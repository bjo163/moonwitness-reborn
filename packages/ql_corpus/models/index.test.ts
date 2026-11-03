import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  loadAddons,
  QlAccessError,
  QlConflictError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
} from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import corpusManifest from "../__manifest__.js";
import sourceManifest from "ql_source/__manifest__";
import {
  AYAH_MAX_BOUND,
  TOTAL_AYAH_COUNT,
  SURAHS,
} from "../services/corpus-vocabulary.js";
import { readSurahAudioManifest } from "../services/audio-service.js";
import {
  assertAnnotationAuthority,
  assertEditionKindLocaleInvariant,
  assertPassageAuthority,
  publishEdition,
  withdrawEdition,
} from "../services/corpus-service.js";
import {
  importQuranSlice,
  undoImportRun,
} from "../services/import-service.js";
import { readSurahWindow } from "../services/reader-service.js";

// ---------------------------------------------------------------------------
// Boot / structure.
// ---------------------------------------------------------------------------

void test("the addon is accepted by loadAddons and sorts behind ql_source", () => {
  const sorted = loadAddons([
    corpusManifest,
    sourceManifest,
    stubAddonManifest("ql_auth"),
    stubAddonManifest("ql_base"),
  ]);
  const order = sorted.map((m) => m.name);
  assert.ok(order.indexOf("ql_base") < order.indexOf("ql_auth"));
  assert.ok(order.indexOf("ql_auth") < order.indexOf("ql_source"));
  assert.ok(order.indexOf("ql_source") < order.indexOf("ql_corpus"));
});

function privateFieldNames(modelName: string): string[] {
  const model = corpusManifest.models.find((m) => m.name === modelName);
  return Object.entries(model?.fields ?? {})
    .filter(([, field]) => field.private === true)
    .map(([name]) => name);
}

void test("no published view exposes a private field and no passage/annotation form exists", () => {
  for (const view of corpusManifest.views) {
    const privates = privateFieldNames(view.model);
    for (const field of view.fields) {
      assert.equal(
        privates.includes(field),
        false,
        `View '${view.name}' must not list private field '${field}'.`,
      );
    }
  }
  // The importer is the only writer for passage/annotation; there must be
  // no `form` view for either so the view-driven UI never offers Add/Edit.
  for (const model of ["corpus.passage", "corpus.annotation"]) {
    const formView = corpusManifest.views.find(
      (v) => v.model === model && v.type === "form",
    );
    assert.equal(formView, undefined, `${model} must not have a form view`);
  }
  const lexicalCandidate = corpusManifest.computedModels?.find(
    (model) => model.name === "corpus.lexical_candidate",
  );
  assert.ok(lexicalCandidate, "lexical candidate model must be registered");
  assert.equal(
    "extraction_confidence_per_mille" in lexicalCandidate.fields,
    false,
    "the exploratory frequency model must not expose an unmeasured confidence score",
  );
  assert.equal("review_status" in lexicalCandidate.fields, false);
  assert.equal(
    corpusManifest.views.some(
      (view) =>
        view.model === "corpus.lexical_candidate" && view.type === "form",
    ),
    false,
    "computed candidates must not have an editable form",
  );
});

// ---------------------------------------------------------------------------
// MW-ADR-019 storage-level religious-integrity invariant.
// ---------------------------------------------------------------------------

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function seedEditionFixture(
  orm: QlOrm,
  overrides: { authority: string; locale: string; editionKey: string; canonicalId: string },
): Promise<{ work: QlRecord; version: QlRecord; rights: QlRecord; edition: QlRecord }> {
  const work = await orm.createRecordForService("corpus.work", {
    canonical_id: "mw:work:quran",
    title: "Al-Qur'an",
    work_kind: "revelation",
    primary_locale: "ar",
  });
  const artifact = await orm.createRecordForService("source.artifact", {
    canonical_id: "mw:dataset:test:fixture",
    title: "Fixture",
    kind: overrides.authority === "revelation_verbatim" ? "revealed_text" : "translation_source",
    owner_id: "seed-user",
  });
  const version = await orm.createRecordForService("source.version", {
    artifact_id: String(artifact.id),
    version_key: `${String(artifact.id)}@v1`,
    release_label: "v1",
    row_count_expected: 1,
    acquired_at: new Date(),
    method: "unit-test",
    owner_id: "seed-user",
  });
  const rights = await orm.createRecordForService("source.rights", {
    version_id: String(version.id),
    rights_key: `${String(version.id)}|display`,
    action: "display",
    attribution_text: "attributed",
    owner_id: "seed-user",
  });
  const edition = await orm.createRecordForService("corpus.edition", {
    canonical_id: overrides.canonicalId,
    work_id: String(work.id),
    source_version_id: String(version.id),
    rights_id: String(rights.id),
    edition_key: overrides.editionKey,
    authority: overrides.authority,
    locale: overrides.locale,
    attribution_text: "Attribution text",
    publisher: "Test publisher",
    imported_row_count: 1,
  });
  return { work, version, rights, edition };
}

void test("assertPassageAuthority / assertAnnotationAuthority reject the wrong subset", () => {
  assert.doesNotThrow(() => assertPassageAuthority("revelation_verbatim"));
  assert.doesNotThrow(() => assertPassageAuthority("translation"));
  assert.throws(() => assertPassageAuthority("tafsir"), QlValidationError);
  assert.throws(() => assertPassageAuthority("reflection"), QlValidationError);
  assert.doesNotThrow(() => assertAnnotationAuthority("tafsir"));
  assert.doesNotThrow(() => assertAnnotationAuthority("reflection"));
  // The most important guard in the whole feature:
  assert.throws(() => assertAnnotationAuthority("revelation_verbatim"), QlValidationError);
});

void test("QlOrm field validator refuses cross-class writes even through `createRecordForService`", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      // `tafsir` on `corpus.passage` must throw.
      await assert.rejects(
        () =>
          orm.createRecordForService("corpus.passage", {
            canonical_id: "mw:passage:quran:bad-tafsir",
            edition_id: "e",
            work_id: "w",
            authority: "tafsir",
            locator: "1:1",
            passage_key: "e|1:1",
            surah: 1,
            ayah: 1,
            row_kind: "ayah",
            text: "not-revelation-text",
            text_checksum: sha256("not-revelation-text"),
            ordinal: 1,
            import_run_id: "run-1",
          }),
        QlValidationError,
        "corpus.passage.authority must reject 'tafsir' (MW-ADR-019 \u00a7a)",
      );
      // `revelation_verbatim` on `corpus.annotation` must throw.
      await assert.rejects(
        () =>
          orm.createRecordForService("corpus.annotation", {
            canonical_id: "mw:annot:bad-revelation",
            edition_id: "e",
            work_id: "w",
            authority: "revelation_verbatim",
            quoted_passage_id: "p",
            annotator: "test",
            locale: "ar",
            annotation_key: "e|p|revelation_verbatim",
            body: "cannot be revelation",
            attribution_text: "attribution",
            rights_id: "r",
          }),
        QlValidationError,
        "corpus.annotation.authority must reject 'revelation_verbatim' (MW-ADR-019 \u00a7b)",
      );
    },
  );
});

void test("assertEditionKindLocaleInvariant enforces the cross-field kind/locale rule", () => {
  assert.doesNotThrow(() =>
    assertEditionKindLocaleInvariant({ authority: "revelation_verbatim", locale: "ar" }),
  );
  assert.throws(
    () => assertEditionKindLocaleInvariant({ authority: "revelation_verbatim", locale: "en" }),
    QlConflictError,
  );
  assert.throws(
    () => assertEditionKindLocaleInvariant({ authority: "translation", locale: "ar" }),
    QlConflictError,
  );
  assert.doesNotThrow(() =>
    assertEditionKindLocaleInvariant({ authority: "translation", locale: "id" }),
  );
});

// ---------------------------------------------------------------------------
// Idempotency: composite unique keys.
// ---------------------------------------------------------------------------

void test("duplicate `passage_key` on re-import throws QlConflictError (idempotency primitive)", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      const text = "bismillahir-rahmanir-rahim";
      const checksum = sha256(text);
      const base = {
        edition_id: "edition-1",
        work_id: "work-1",
        authority: "revelation_verbatim",
        locator: "1:1",
        passage_key: "edition-1|1:1",
        surah: 1,
        ayah: 1,
        row_kind: "basmalah",
        text,
        text_checksum: checksum,
        ordinal: 1,
        import_run_id: "run-1",
      };
      await orm.createRecordForService("corpus.passage", {
        canonical_id: "mw:passage:quran:1:1:v1",
        ...base,
      });
      await assert.rejects(
        () =>
          orm.createRecordForService("corpus.passage", {
            canonical_id: "mw:passage:quran:1:1:v2",
            ...base,
          }),
        QlConflictError,
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Reader: rights gate + publication stage gate.
// ---------------------------------------------------------------------------

void test("publishEdition refuses when display rights are not `cleared`", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      const { edition } = await seedEditionFixture(orm, {
        authority: "revelation_verbatim",
        locale: "ar",
        editionKey: "mw:work:quran|ar|revelation_verbatim",
        canonicalId: "mw:edition:quran:ar:revelation",
      });
      // `source.rights.rights_status` was created at default `"unknown"`.
      await assert.rejects(
        () =>
          publishEdition(
            orm,
            { id: "publisher", groups: ["admin"] },
            String(edition.edition_key),
          ),
        QlConflictError,
        "publishEdition must refuse when rights_status is not 'cleared' (deny-by-default)",
      );
    },
  );
});

void test("publishEdition + reader-surah returns the passage with authority + attribution on every row", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      const { edition, version } = await seedEditionFixture(orm, {
        authority: "revelation_verbatim",
        locale: "ar",
        editionKey: "mw:work:quran|ar|revelation_verbatim",
        canonicalId: "mw:edition:quran:ar:revelation",
      });
      const editionId = String(edition.id);
      // Insert a passage first so publishEdition's bulk update flips its
      // stage from "staged" to "published" alongside the edition.
      await orm.createRecordForService("corpus.passage", {
        canonical_id: "mw:passage:quran:1:1",
        edition_id: editionId,
        work_id: String(edition.work_id),
        authority: "revelation_verbatim",
        locator: "1:1",
        passage_key: `${editionId}|1:1`,
        surah: 1,
        ayah: 1,
        row_kind: "basmalah",
        text: "bismillah",
        text_checksum: sha256("bismillah"),
        ordinal: 1,
        import_run_id: "run-1",
      });
      // Simulate an owner signing off rights: flip status to "cleared" via
      // the update service path (the model ACL forbids user PATCH here).
      await orm.updateRecordsForService(
        "source.rights",
        { version_id: String(version.id), action: "display" },
        { rights_status: "cleared" },
      );
      await publishEdition(
        orm,
        { id: "publisher", groups: ["admin"] },
        "mw:work:quran|ar|revelation_verbatim",
      );
      const result = await readSurahWindow(
        orm,
        "mw:work:quran|ar|revelation_verbatim",
        1,
      );
      assert.equal(result.surah, 1);
      assert.equal(result.passages.length, 1);
      const first = result.passages[0];
      // MW-ADR-019 §(d): authority + attribution are non-optional on every row.
      assert.equal(first?.authority, "revelation_verbatim");
      assert.equal(first?.edition_authority, "revelation_verbatim");
      assert.equal(first?.edition_locale, "ar");
      assert.ok(first?.edition_attribution_text && first.edition_attribution_text.length > 0);
    },
  );
});

// ---------------------------------------------------------------------------
// Surah window respects the 500 read clamp.
// ---------------------------------------------------------------------------

void test("longest surah (Al-Baqarah, 286 ayahs) still fits under QlOrm's 500-row read clamp", () => {
  assert.equal(SURAHS.length, 114, "SURAHS must contain exactly 114 entries");
  const longest = SURAHS.reduce((acc, s) => (s.ayahCount > acc.ayahCount ? s : acc));
  assert.equal(longest.number, 2);
  assert.equal(longest.ayahCount, 286);
  assert.ok(
    longest.ayahCount <= 500,
    "Any single surah must fit under findManyByService clamp",
  );
  // Sanity: total ayah count matches the canonical Tanzil/Hafs Kufi scheme
  // encoded in `SURAHS`. The exact total is a data-quality check that guards
  // against a typo in the 114-row table — if a row's count drifts, this
  // assertion is what catches it before an importer miscounts a snapshot.
  assert.equal(TOTAL_AYAH_COUNT, 6221);
});

// ---------------------------------------------------------------------------
// Write-path ACL denies every group from generic CRUD on passage/annotation.
// ---------------------------------------------------------------------------

void test("`corpus.passage` and `corpus.annotation` reject create/write for every group via generic path", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      for (const groups of [
        ["user"],
        ["viewer"],
        ["operator"],
        ["admin"],
        ["root"],
      ] as const) {
        const user = { id: `probe-${groups[0]}`, groups };
        await assert.rejects(
          () =>
            orm.create("corpus.passage", user, {
              canonical_id: "probe-passage",
              edition_id: "e",
              work_id: "w",
              authority: "revelation_verbatim",
              locator: "1:1",
              passage_key: "e|1:1-probe",
              surah: 1,
              ayah: 1,
              row_kind: "ayah",
              text: "x",
              text_checksum: sha256("x"),
              ordinal: 1,
              import_run_id: "run",
            }),
          QlAccessError,
          `corpus.passage create must be denied for group ${groups[0]}`,
        );
        await assert.rejects(
          () =>
            orm.create("corpus.annotation", user, {
              canonical_id: "probe-annot",
              edition_id: "e",
              work_id: "w",
              authority: "tafsir",
              quoted_passage_id: "p",
              annotator: "x",
              locale: "ar",
              annotation_key: "e|p|annot",
              body: "x",
              attribution_text: "y",
              rights_id: "r",
            }),
          QlAccessError,
          `corpus.annotation create must be denied for group ${groups[0]}`,
        );
      }
    },
  );
});

void test("withdrawEdition reverts a published edition to withdrawn without erasing rows", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      const { version, edition } = await seedEditionFixture(orm, {
        authority: "translation",
        locale: "en",
        editionKey: "mw:work:quran|en|translation",
        canonicalId: "mw:edition:quran:en:translation",
      });
      await orm.updateRecordsForService(
        "source.rights",
        { version_id: String(version.id), action: "display" },
        { rights_status: "cleared" },
      );
      await publishEdition(
        orm,
        { id: "pub", groups: ["admin"] },
        "mw:work:quran|en|translation",
      );
      const withdrawn = await withdrawEdition(
        orm,
        { id: "pub", groups: ["admin"] },
        "mw:work:quran|en|translation",
        "rights re-opened",
      );
      assert.equal(withdrawn.stage, "withdrawn");
      // The edition row is still there; only `stage` flipped.
      const after = await orm.findOneByService("corpus.edition", {
        id: String(edition.id),
      });
      assert.ok(after, "withdraw must not erase the row (audit-preserving rollback)");
      assert.equal(after.stage, "withdrawn");
    },
  );
});

void test("lexical candidates are computed only from published editions with cleared transform rights", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      const { version, edition } = await seedEditionFixture(orm, {
        authority: "revelation_verbatim",
        locale: "ar",
        editionKey: "mw:work:quran|ar|revelation_verbatim",
        canonicalId: "mw:edition:quran:ar:revelation",
      });
      await orm.updateRecordsForService(
        "source.rights",
        { version_id: String(version.id), action: "display" },
        { rights_status: "cleared" },
      );
      await orm.createRecordForService("source.rights", {
        version_id: String(version.id),
        rights_key: `${String(version.id)}|transform`,
        action: "transform",
        rights_status: "cleared",
        attribution_text: "Fixture transform permission",
        owner_id: "seed-user",
      });
      const createdAt = new Date();
      for (const passage of [
        {
          ayah: 1,
          text: "الرَّحْمَٰنُ الرَّحِيمُ الرَّحْمَٰنُ ١٢٣،",
          ordinal: 1,
        },
        { ayah: 2, text: "الرحمن الرحيم", ordinal: 2 },
      ]) {
        await orm.createRecordForService("corpus.passage", {
          canonical_id: `mw:passage:fixture:${passage.ayah}`,
          edition_id: String(edition.id),
          work_id: String(edition.work_id),
          authority: "revelation_verbatim",
          locator: `1:${passage.ayah}`,
          passage_key: `${String(edition.id)}|1:${passage.ayah}`,
          surah: 1,
          ayah: passage.ayah,
          row_kind: "ayah",
          text: passage.text,
          text_checksum: sha256(passage.text),
          ordinal: passage.ordinal,
          import_run_id: "lexical-fixture",
          created_at: createdAt,
          updated_at: createdAt,
        });
      }
      await publishEdition(
        orm,
        { id: "operator-1", groups: ["operator"] },
        "mw:work:quran|ar|revelation_verbatim",
      );

      const candidates = await orm.queryComputedModel(
        "corpus.lexical_candidate",
        { id: "operator-1", groups: ["operator"] },
        {
          filters: { edition_key: "mw:work:quran|ar|revelation_verbatim" },
          limit: 100,
        },
      );
      const rahman = candidates.find(
        (candidate) => candidate.normalized_form === "الرحمن",
      );
      assert.ok(rahman, "normalization should group vocalized and plain forms");
      assert.equal(rahman.occurrence_count, 3);
      assert.equal(rahman.verse_reference_count, 2);
      assert.equal(rahman.algorithm_version, "arabic-token-frequency-v1");
      assert.equal(
        candidates.some((candidate) => "extraction_confidence_per_mille" in candidate),
        false,
      );
      const references = JSON.parse(String(rahman.source_references)) as {
        surah: number;
        ayah: number;
        checksum: string;
      }[];
      assert.deepEqual(
        references.map(({ surah, ayah }) => `${surah}:${ayah}`),
        ["1:1", "1:2"],
      );
      assert.ok(references.every(({ checksum }) => /^[a-f0-9]{64}$/u.test(checksum)));
      const exact = await orm.queryComputedModel(
        "corpus.lexical_candidate",
        { id: "operator-1", groups: ["operator"] },
        {
          filters: {
            edition_key: "mw:work:quran|ar|revelation_verbatim",
            normalized_form: "الرحمن",
          },
          limit: 100,
        },
      );
      assert.equal(exact.length, 1);
      assert.equal(exact[0].id, rahman.id);
      assert.equal(
        candidates.some((candidate) => candidate.normalized_form === "١٢٣"),
        false,
        "Arabic numerals and punctuation are not lexical candidates",
      );
    },
  );
});

void test("lexical candidates deny editions without cleared transform rights", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      const { version, edition } = await seedEditionFixture(orm, {
        authority: "revelation_verbatim",
        locale: "ar",
        editionKey: "mw:work:quran|ar|unlicensed",
        canonicalId: "mw:edition:quran:ar:unlicensed",
      });
      await orm.updateRecordsForService(
        "source.rights",
        { version_id: String(version.id), action: "display" },
        { rights_status: "cleared" },
      );
      await publishEdition(
        orm,
        { id: "operator-1", groups: ["operator"] },
        "mw:work:quran|ar|unlicensed",
      );
      assert.ok(edition.id);
      await assert.rejects(
        () =>
          orm.queryComputedModel(
            "corpus.lexical_candidate",
            { id: "operator-1", groups: ["operator"] },
            { filters: { edition_key: "mw:work:quran|ar|unlicensed" } },
          ),
        QlAccessError,
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Importer — reconciliation hard-gate + idempotency + undo-run.
// ---------------------------------------------------------------------------

function writeTempManifest(
  dir: string,
  entries: readonly {
    id: string;
    file: string;
    rowsExpected: number;
    kind: "revelation_verbatim" | "translation";
    locale: string;
  }[],
): string {
  const datasets = entries.map((entry) => ({
    id: entry.id,
    path: entry.file,
    kind: entry.kind,
    locale: entry.locale,
    rows_expected: entry.rowsExpected,
    edition_canonical_id: `mw:edition:${entry.id}`,
    work_canonical_id: "mw:work:quran",
    work_title: "Al-Qur'an",
    work_kind: entry.kind === "revelation_verbatim" ? "revelation" : "translation_of_revelation",
    publisher: "Fixture Publisher",
    license_id: "Fixture-License",
    attribution_text: "Fixture attribution — not canonical scripture.",
    rights_status: "under_review",
  }));
  const manifestPath = join(dir, "quran-manifest.json");
  writeFileSync(manifestPath, JSON.stringify({ datasets }, null, 2), "utf8");
  return manifestPath;
}

void test("importer aborts before writing a single row when observed != rows_expected", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ql-corpus-import-"));
  try {
    const file = join(dir, "ar.jsonl");
    writeFileSync(file, '{"surah":1,"ayah":1,"text":"a"}\n{"surah":1,"ayah":2,"text":"b"}\n', "utf8");
    const manifest = writeTempManifest(dir, [
      {
        id: "mw:dataset:test:ar",
        file,
        rowsExpected: 999,
        kind: "revelation_verbatim",
        locale: "ar",
      },
    ]);
    await withMemoryOrm(
      [
        stubAddonManifest("ql_base"),
        stubAddonManifest("ql_auth"),
        sourceManifest,
        corpusManifest,
      ],
      async (orm) => {
        await assert.rejects(
          () => importQuranSlice(orm, manifest, { dryRun: true }),
          (error: unknown) =>
            error instanceof QlValidationError &&
            /observed=2, expected=999/.test(error.message),
          "must abort on reconciliation mismatch",
        );
        // Zero rows written.
        const stored = await orm.findManyByService("corpus.edition", {});
        assert.equal(stored.length, 0);
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

void test("importer dry-run with a valid fixture reconciles cleanly and writes nothing", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ql-corpus-import-"));
  try {
    const file = join(dir, "ar.jsonl");
    writeFileSync(
      file,
      '{"surah":1,"ayah":1,"text":"a"}\n{"surah":1,"ayah":2,"text":"b"}\n',
      "utf8",
    );
    const manifest = writeTempManifest(dir, [
      {
        id: "mw:dataset:test:ar",
        file,
        rowsExpected: 2,
        kind: "revelation_verbatim",
        locale: "ar",
      },
    ]);
    await withMemoryOrm(
      [
        stubAddonManifest("ql_base"),
        stubAddonManifest("ql_auth"),
        sourceManifest,
        corpusManifest,
      ],
      async (orm) => {
        const reports = await importQuranSlice(orm, manifest, { dryRun: true });
        assert.equal(reports.length, 1);
        const report = reports[0];
        assert.equal(report?.expected, 2);
        assert.equal(report?.observed, 2);
        assert.equal(report?.rejected.length, 0);
        // Dry-run skipped row writes; the artifact/version/edition scaffolding
        // is still created so an operator can inspect it before the real run.
        const editions = await orm.findManyByService("corpus.edition", {});
        assert.equal(editions.length, 1);
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

void test("importer is idempotent: a second real run skips via passage_key UNIQUE and undo-run removes the newly-created rows", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ql-corpus-import-"));
  try {
    const file = join(dir, "ar.jsonl");
    writeFileSync(
      file,
      '{"surah":1,"ayah":1,"text":"a"}\n{"surah":1,"ayah":2,"text":"b"}\n',
      "utf8",
    );
    const manifest = writeTempManifest(dir, [
      {
        id: "mw:dataset:test:ar",
        file,
        rowsExpected: 2,
        kind: "revelation_verbatim",
        locale: "ar",
      },
    ]);
    await withMemoryOrm(
      [
        stubAddonManifest("ql_base"),
        stubAddonManifest("ql_auth"),
        sourceManifest,
        corpusManifest,
      ],
      async (orm) => {
        const first = await importQuranSlice(orm, manifest, {
          dryRun: false,
          importRunId: "run-1",
        });
        assert.equal(first[0]?.inserted, 2);
        const second = await importQuranSlice(orm, manifest, {
          dryRun: false,
          importRunId: "run-2",
        });
        // The unique `passage_key` fires `QlConflictError` per row, treated
        // as "already imported" by the importer.
        assert.equal(second[0]?.inserted, 0);
        assert.equal(second[0]?.skippedConflict, 2);
        const removed = await undoImportRun(orm, "run-1");
        assert.equal(removed, 2);
        const remaining = await orm.findManyByService("corpus.passage", {});
        assert.equal(remaining.length, 0);
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

void test("UNILEX ontology models corpus.term and corpus.concept are registered and validated", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      // Test corpus.term creation
      const termRecord = await orm.createRecordForService("corpus.term", {
        canonical_id: "mw:term:rahmah",
        term: "رَحْمَة",
        lemma: "ر ح م",
        root: "ر-ح-م",
        part_of_speech: "noun",
        primary_locale: "ar",
        transliteration: "rahmah",
        description: "Divine mercy and encompassing grace",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      assert.ok(termRecord.id);

      const retrievedTerm = await orm.findOneByService("corpus.term", { id: termRecord.id });
      assert.equal(retrievedTerm?.["term"], "رَحْمَة");
      assert.equal(retrievedTerm?.["primary_locale"], "ar");

      // Test corpus.concept creation
      const conceptRecord = await orm.createRecordForService("corpus.concept", {
        canonical_id: "mw:concept:divine_mercy",
        name: "Divine Mercy",
        category: "theology",
        domain: "quranic_ontology",
        definition: "The all-encompassing attribute of grace and benevolence in Quranic worldview",
        primary_locale: "en",
        version: "1.0.0",
        is_deprecated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      assert.ok(conceptRecord.id);

      const retrievedConcept = await orm.findOneByService("corpus.concept", { id: conceptRecord.id });
      assert.equal(retrievedConcept?.["name"], "Divine Mercy");
      assert.equal(retrievedConcept?.["is_deprecated"], false);

      // Test corpus.ayah_proof creation and SHA-256 validation
      const proofRecord = await orm.createRecordForService("corpus.ayah_proof", {
        passage_id: "mw:passage:test:1:1",
        surah_number: 1,
        ayah_number: 1,
        edition_code: "kemenag_id",
        content_hash_sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        canonical_payload: "V1|edition:kemenag_id|surah:1|ayah:1|text:Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang",
        verification_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      assert.ok(proofRecord.id);

      // Test corpus.reciter creation
      const reciterRecord = await orm.createRecordForService("corpus.reciter", {
        slug: "al-husary",
        name_translit: "Mahmoud Khalil Al-Husary",
        name_arabic: "محمود خليل الحصري",
        recitation_style: "murattal",
        audio_base_url: "https://audio.moonwitness.com/husary",
        license_type: "public_domain",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      assert.ok(reciterRecord.id);

      // Test corpus.audio_segment creation
      const segmentRecord = await orm.createRecordForService("corpus.audio_segment", {
        reciter_slug: "al-husary",
        surah_number: 1,
        ayah_number: 1,
        start_ms: 0,
        end_ms: 4500,
        audio_file_url: "https://audio.moonwitness.com/husary/001001.mp3",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      assert.ok(segmentRecord.id);

      // Test corpus.root_word creation and retrieval (Track 08)
      const rootRecord = await orm.createRecordForService("corpus.root_word", {
        root_arabic: "ر-ح-م",
        root_translit: "r-h-m",
        total_occurrences: 339,
        meaning_id: "Kasih sayang, rahmat, kelembutan",
        meaning_en: "Mercy, compassion, grace",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      assert.ok(rootRecord.id);

      const retrievedRoot = await orm.findOneByService("corpus.root_word", { id: rootRecord.id });
      assert.equal(retrievedRoot?.["root_arabic"], "ر-ح-م");
      assert.equal(retrievedRoot?.["total_occurrences"], 339);

      // Test corpus.word_derivation creation (Track 08)
      const derivationRecord = await orm.createRecordForService("corpus.word_derivation", {
        root_id: String(rootRecord.id),
        passage_id: "mw:passage:test:1:1",
        surah_number: 1,
        ayah_number: 1,
        word_index_in_ayah: 3,
        arabic_lemma: "الرَّحْمَٰنِ",
        form_pattern: "fa'lan",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      assert.ok(derivationRecord.id);
    },
  );
});

// ---------------------------------------------------------------------------
// Track 04/05 registries: the smoke test above only proves a row can be
// written by the service. These are the denial cases: a reader cannot mint
// proof anchors or put words in a reciter's mouth, a digest that is not a
// digest is refused, and a locator the canonical table cannot produce is
// refused by the service even though the column lets it through.
// ---------------------------------------------------------------------------

void test("proof and tilawah registries deny reader writes and impossible rows", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      sourceManifest,
      corpusManifest,
    ],
    async (orm) => {
      const timestamp = new Date().toISOString();
      const digest = sha256("bismillah");
      const proofValues = {
        passage_id: "mw:passage:denial:1:1",
        edition_code: "kemenag",
        surah_number: 1,
        ayah_number: 1,
        content_hash_sha256: digest,
        canonical_payload: `V1|kemenag|1:1|bismillah`,
        verification_count: 0,
        created_at: timestamp,
        updated_at: timestamp,
      };
      const reciterValues = {
        slug: "registry-reciter",
        name_translit: "Registry Reciter",
        name_arabic: "قارئ السجل",
        recitation_style: "murattal",
        audio_base_url: "https://audio.invalid/registry",
        license_type: "public_domain",
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      };
      const segmentValues = {
        reciter_slug: "registry-reciter",
        surah_number: 1,
        ayah_number: 1,
        start_ms: 0,
        end_ms: 4500,
        audio_file_url: "https://audio.invalid/registry/001001.mp3",
        created_at: timestamp,
        updated_at: timestamp,
      };

      for (const group of ["viewer", "user"]) {
        const reader = { id: `reader-${group}`, groups: [group] };
        for (const [model, values] of [
          ["corpus.ayah_proof", proofValues],
          ["corpus.reciter", reciterValues],
          ["corpus.audio_segment", segmentValues],
        ] as const) {
          await assert.rejects(
            () => orm.create(model, reader, values),
            QlAccessError,
            `${model} must stay operator-authored for group ${group}`,
          );
        }
      }

      const operator = { id: "operator-1", groups: ["operator"] };
      await assert.rejects(
        () =>
          orm.create("corpus.ayah_proof", operator, {
            ...proofValues,
            content_hash_sha256: "not-a-digest",
          }),
        QlValidationError,
        "sha256Validator has to refuse a digest that is not a digest",
      );
      const anchored = await orm.create("corpus.ayah_proof", operator, proofValues);
      assert.ok(anchored.id);
      await assert.rejects(
        () =>
          orm.create("corpus.ayah_proof", operator, {
            ...proofValues,
            passage_id: "mw:passage:denial:2:1",
            surah_number: 2,
          }),
        QlConflictError,
        "one digest anchoring two verses would make verification ambiguous",
      );

      await orm.create("corpus.reciter", operator, reciterValues);
      await assert.rejects(
        () =>
          orm.create("corpus.audio_segment", operator, {
            ...segmentValues,
            ayah_number: AYAH_MAX_BOUND + 1,
          }),
        QlValidationError,
        `no ayah is numbered above ${AYAH_MAX_BOUND} in any surah`,
      );
      await orm.create("corpus.audio_segment", operator, segmentValues);

      // The coarse column ceiling is not a per-surah permission: 114 has six
      // verses, so a clip stored for 114:286 has to be refused on the way out.
      await orm.create("corpus.audio_segment", operator, {
        ...segmentValues,
        surah_number: 114,
        ayah_number: AYAH_MAX_BOUND,
        audio_file_url: "https://audio.invalid/registry/114286.mp3",
      });
      await assert.rejects(
        () => readSurahAudioManifest(orm, "registry-reciter", 114),
        QlValidationError,
        "the service enforces the SURAHS table, not the column bound",
      );
      const curated = await readSurahAudioManifest(orm, "registry-reciter", 1);
      assert.equal(curated.segments.length, 1);
      assert.equal(curated.reciterName, "Registry Reciter");
    },
  );
});

