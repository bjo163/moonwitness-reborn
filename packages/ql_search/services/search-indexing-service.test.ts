import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import corpusManifest from "ql_corpus/__manifest__";
import { publishEdition } from "ql_corpus/services/corpus-service";
import {
  QlAccessError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
} from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import sourceManifest from "ql_source/__manifest__";
import searchManifest from "../__manifest__.js";
import {
  indexCorpusEdition,
  searchCorpusPassages,
  tokenizeText,
} from "./search-indexing-service.js";

const manifests = [
  stubAddonManifest("ql_base"),
  stubAddonManifest("ql_auth"),
  sourceManifest,
  corpusManifest,
  stubAddonManifest("ql_research"),
  searchManifest,
];

type TestEditionOptions = {
  editionKey: string;
  locale: "ar" | "en" | "id";
  authority: "revelation_verbatim" | "translation";
  displayRights?: "cleared" | "under_review";
  indexRights?: "cleared" | "under_review";
  stage?: "staged" | "published";
};

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function suffix(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, "-");
}

async function seedEdition(
  orm: QlOrm,
  options: TestEditionOptions,
): Promise<{ edition: QlRecord; version: QlRecord }> {
  const key = suffix(options.editionKey);
  const work = await orm.createRecordForService("corpus.work", {
    canonical_id: `mw:work:${key}`,
    title: "Test Qur'an",
    work_kind: "revelation",
    primary_locale: "ar",
  });
  const artifact = await orm.createRecordForService("source.artifact", {
    canonical_id: `mw:artifact:${key}`,
    title: "Synthetic fixture",
    kind:
      options.authority === "revelation_verbatim"
        ? "revealed_text"
        : "translation_source",
    owner_id: "test-owner",
  });
  const version = await orm.createRecordForService("source.version", {
    artifact_id: String(artifact.id),
    version_key: `${String(artifact.id)}@fixture`,
    release_label: "fixture",
    row_count_expected: 1,
    acquired_at: new Date(),
    method: "unit-test",
    owner_id: "test-owner",
  });
  const displayRights = await orm.createRecordForService("source.rights", {
    version_id: String(version.id),
    rights_key: `${String(version.id)}|display`,
    action: "display",
    rights_status: options.displayRights ?? "cleared",
    attribution_text: "Synthetic test fixture",
    owner_id: "test-owner",
  });
  await orm.createRecordForService("source.rights", {
    version_id: String(version.id),
    rights_key: `${String(version.id)}|index`,
    action: "index",
    rights_status: options.indexRights ?? "cleared",
    attribution_text: "Synthetic test fixture",
    owner_id: "test-owner",
  });
  await orm.createRecordForService("source.rights", {
    version_id: String(version.id),
    rights_key: `${String(version.id)}|transform`,
    action: "transform",
    rights_status: "cleared",
    attribution_text: "Synthetic test fixture",
    owner_id: "test-owner",
  });
  const edition = await orm.createRecordForService("corpus.edition", {
    canonical_id: `mw:edition:${key}`,
    work_id: String(work.id),
    source_version_id: String(version.id),
    rights_id: String(displayRights.id),
    edition_key: options.editionKey,
    authority: options.authority,
    locale: options.locale,
    attribution_text: "Synthetic test fixture",
    publisher: "Unit test",
    imported_row_count: 1,
    stage: options.stage ?? "staged",
  });
  return { edition, version };
}

async function seedPassage(
  orm: QlOrm,
  edition: QlRecord,
  options: {
    text: string;
    surah?: number;
    ayah?: number;
    stage?: "staged" | "published";
  },
): Promise<QlRecord> {
  const surah = options.surah ?? 1;
  const ayah = options.ayah ?? 1;
  const locator = `${surah}:${ayah}`;
  const key = suffix(String(edition.edition_key));
  return orm.createRecordForService("corpus.passage", {
    canonical_id: `mw:passage:${key}:${locator}`,
    edition_id: String(edition.id),
    work_id: String(edition.work_id),
    authority: String(edition.authority),
    locator,
    passage_key: `${String(edition.id)}|${locator}`,
    surah,
    ayah,
    row_kind: "ayah",
    text: options.text,
    text_checksum: sha256(options.text),
    ordinal: ayah,
    import_run_id: `test-${key}`,
    stage: options.stage ?? "staged",
  });
}

async function publishTestEdition(
  orm: QlOrm,
  edition: QlRecord,
): Promise<void> {
  await publishEdition(
    orm,
    { id: "test-publisher", groups: ["admin"] },
    String(edition.edition_key),
  );
}

async function addCorpusIndexEntry(
  orm: QlOrm,
  edition: QlRecord,
  passage: QlRecord,
  token: string,
): Promise<void> {
  await orm.createRecordForService("search.index_entry", {
    target_model: "corpus.passage",
    target_id: String(passage.id),
    token,
    weight: 1,
    owner_id: "system",
    edition_key: String(edition.edition_key),
    locale: String(edition.locale),
    surah: Number(passage.surah),
    ayah: Number(passage.ayah),
    created_at: new Date(),
    updated_at: new Date(),
  });
}

void test("corpus indexing is idempotent and retrieval is ranked, bounded, and deterministic", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    const { edition } = await seedEdition(orm, {
      editionKey: "mw:test:translation-en",
      locale: "en",
      authority: "translation",
    });
    const first = await seedPassage(orm, edition, {
      text: "light guidance",
      ayah: 1,
    });
    const second = await seedPassage(orm, edition, {
      text: "light",
      ayah: 2,
    });
    await publishTestEdition(orm, edition);

    const initial = await indexCorpusEdition(
      orm,
      { id: "index-admin", groups: ["admin"] },
      String(edition.edition_key),
    );
    assert.deepEqual(initial, {
      editionKey: "mw:test:translation-en",
      passageCount: 2,
      indexEntryCount: 3,
    });
    const initialEntries = await orm.findManyByService(
      "search.index_entry",
      {
        owner_id: "system",
        target_model: "corpus.passage",
        edition_key: String(edition.edition_key),
      },
      { limit: 500 },
    );
    assert.equal(initialEntries.length, 3);
    assert.ok(
      initialEntries.every(
        (entry) => entry.snippet === null || entry.snippet === undefined,
      ),
    );
    const userVisibleEntries = await orm.findMany(
      "search.index_entry",
      { id: "ordinary-user", groups: ["user"] },
      { limit: 500 },
    );
    assert.equal(
      userVisibleEntries.some((entry) => entry.target_model === "corpus.passage"),
      false,
    );

    const repeated = await indexCorpusEdition(
      orm,
      { id: "index-admin", groups: ["admin"] },
      String(edition.edition_key),
    );
    const repeatedEntries = await orm.findManyByService(
      "search.index_entry",
      {
        owner_id: "system",
        target_model: "corpus.passage",
        edition_key: String(edition.edition_key),
      },
      { limit: 500 },
    );
    assert.deepEqual(repeated, initial);
    assert.equal(repeatedEntries.length, initialEntries.length);

    const ranked = await searchCorpusPassages(orm, "light guidance", "en", 10);
    assert.deepEqual(
      ranked.map(({ passage, score }) => ({ id: passage.id, score })),
      [
        { id: String(first.id), score: 2 },
        { id: String(second.id), score: 1 },
      ],
    );
    assert.deepEqual(
      (await searchCorpusPassages(orm, "light", "en", 1)).map(
        ({ passage }) => passage.id,
      ),
      [String(first.id)],
    );
    await assert.rejects(
      searchCorpusPassages(orm, "light", "en", 101),
      QlValidationError,
    );
    const tiedOrder = (await searchCorpusPassages(orm, "light", "en", 10)).map(
      ({ passage }) => passage.id,
    );
    assert.deepEqual(tiedOrder, [String(first.id), String(second.id)]);
    assert.deepEqual(
      (await searchCorpusPassages(orm, "light guidance", "en", 10)).map(
        ({ passage }) => passage.id,
      ),
      ranked.map(({ passage }) => passage.id),
    );
  });
});

void test("corpus retrieval matches Arabic script and UI locale exactly", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    const arabic = await seedEdition(orm, {
      editionKey: "mw:test:quran-ar",
      locale: "ar",
      authority: "revelation_verbatim",
    });
    const arabicPassage = await seedPassage(orm, arabic.edition, {
      text: "نُورٌ",
    });
    const indonesian = await seedEdition(orm, {
      editionKey: "mw:test:translation-id",
      locale: "id",
      authority: "translation",
    });
    const indonesianPassage = await seedPassage(orm, indonesian.edition, {
      text: "cahaya",
    });
    const english = await seedEdition(orm, {
      editionKey: "mw:test:translation-en",
      locale: "en",
      authority: "translation",
    });
    const englishPassage = await seedPassage(orm, english.edition, {
      text: "light",
    });
    await publishTestEdition(orm, arabic.edition);
    await publishTestEdition(orm, indonesian.edition);
    await publishTestEdition(orm, english.edition);
    await addCorpusIndexEntry(
      orm,
      arabic.edition,
      arabicPassage,
      tokenizeText("نُورٌ")[0] ?? "",
    );
    await addCorpusIndexEntry(
      orm,
      indonesian.edition,
      indonesianPassage,
      "cahaya",
    );
    await addCorpusIndexEntry(
      orm,
      english.edition,
      englishPassage,
      "light",
    );

    assert.deepEqual(
      (await searchCorpusPassages(orm, "نُورٌ", "en")).map(
        ({ passage }) => passage.id,
      ),
      [String(arabicPassage.id)],
    );
    assert.deepEqual(
      (await searchCorpusPassages(orm, "cahaya", "id")).map(
        ({ passage }) => passage.id,
      ),
      [String(indonesianPassage.id)],
    );
    assert.deepEqual(await searchCorpusPassages(orm, "cahaya", "en"), []);
    assert.deepEqual(
      (await searchCorpusPassages(orm, "light", "en")).map(
        ({ passage }) => passage.id,
      ),
      [String(englishPassage.id)],
    );
  });
});

void test("search index metadata rejects unsupported corpus locales", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await assert.rejects(
      orm.createRecordForService("search.index_entry", {
        target_model: "corpus.passage",
        target_id: "fixture-passage",
        token: "fixture",
        weight: 1,
        owner_id: "system",
        locale: "fr",
        created_at: new Date(),
        updated_at: new Date(),
      }),
      QlValidationError,
    );
  });
});

void test("staged editions and uncleared rights cannot be indexed or retrieved", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    const staged = await seedEdition(orm, {
      editionKey: "mw:test:staged",
      locale: "en",
      authority: "translation",
    });
    const stagedPassage = await seedPassage(orm, staged.edition, {
      text: "staged token",
    });
    await addCorpusIndexEntry(orm, staged.edition, stagedPassage, "staged");
    await assert.rejects(
      indexCorpusEdition(
        orm,
        { id: "index-admin", groups: ["admin"] },
        String(staged.edition.edition_key),
      ),
      QlAccessError,
    );
    await assert.rejects(
      indexCorpusEdition(
        orm,
        { id: "ordinary-user", groups: ["user"] },
        String(staged.edition.edition_key),
      ),
      QlAccessError,
    );
    assert.deepEqual(await searchCorpusPassages(orm, "staged", "en"), []);

    const uncleared = await seedEdition(orm, {
      editionKey: "mw:test:uncleared",
      locale: "en",
      authority: "translation",
      displayRights: "under_review",
      stage: "published",
    });
    const passage = await seedPassage(orm, uncleared.edition, {
      text: "unpublished stale token",
      stage: "published",
    });
    await addCorpusIndexEntry(orm, uncleared.edition, passage, "stale");

    await assert.rejects(
      indexCorpusEdition(
        orm,
        { id: "index-admin", groups: ["admin"] },
        String(uncleared.edition.edition_key),
      ),
      QlAccessError,
    );
    assert.deepEqual(
      await searchCorpusPassages(orm, "stale", "en"),
      [],
    );

    const indexRightsDenied = await seedEdition(orm, {
      editionKey: "mw:test:index-rights-denied",
      locale: "en",
      authority: "translation",
      indexRights: "under_review",
      stage: "published",
    });
    const indexRightsDeniedPassage = await seedPassage(
      orm,
      indexRightsDenied.edition,
      { text: "index rights token", stage: "published" },
    );
    await addCorpusIndexEntry(
      orm,
      indexRightsDenied.edition,
      indexRightsDeniedPassage,
      "rights",
    );
    await assert.rejects(
      indexCorpusEdition(
        orm,
        { id: "index-admin", groups: ["admin"] },
        String(indexRightsDenied.edition.edition_key),
      ),
      QlAccessError,
    );
    assert.deepEqual(
      await searchCorpusPassages(orm, "rights", "en"),
      [],
    );
  });
});
