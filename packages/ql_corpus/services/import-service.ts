import { createHash } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import { createInterface } from "node:readline";
import {
  QlConflictError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
} from "ql_orm";
import {
  assertEditionKindLocaleInvariant,
  assertPassageAuthority,
} from "./corpus-service.js";
import {
  DEFAULT_CORPUS_STAGE,
  ROW_KINDS,
  SURAH_MAX,
  SURAH_MIN,
  type RowKind,
} from "./corpus-vocabulary.js";

/**
 * Offline importer for `ql_corpus`.
 *
 * Design constraints this file honours:
 *
 * - **HTTP cannot carry a bulk upload** — `apps/api/src/http/server.ts:111`
 *   caps request bodies at 64 KB, and `AGENTS.md:16-20` forbids a parallel
 *   capability surface on the API. The importer is invoked via
 *   `pnpm --filter ql_corpus import:quran`, never via a route.
 * - **QlOrm has no transaction API** (`grep transaction|BEGIN|COMMIT
 *   packages/ql-orm/src/index.ts` returns 0 matches; the same limitation is
 *   documented at `packages/ql_workflow/services/workflow-service.ts:103-106`).
 *   Safety comes from idempotency: composite `passage_key` UNIQUE + skip
 *   on `QlConflictError` + a per-row `import_run_id` tag + a checkpoint
 *   file under `data/` (which is gitignored).
 * - **Reconciliation is a hard gate**: before any row is written, the
 *   importer streams the JSONL once to count lines and compares against
 *   the `rows_expected` value the owner records in
 *   `https://github.com/bjo163/moonwitness-reborn/wiki/docs-knowledge-CORPUS_INTEGRATION_PLAN` §*Al-Qur'an first-slice
 *   datasets*. A mismatch aborts with a diff report and exit code 1. This
 *   is what prevents the 12.594-vs-6.240 discrepancy from silently
 *   corrupting the corpus (see plan MW-0561/MW-0565).
 * - **Field validators still run** — `orm.createRecordForService` fires the
 *   `authorityValidator(TEXT_AUTHORITIES)` and the `sha256Validator`
 *   (`packages/ql-orm/src/index.ts:319-322`), so the importer cannot bypass
 *   the MW-ADR-019 religious-integrity invariant even by accident.
 */

export interface DatasetManifestEntry {
  readonly id: string;
  readonly path: string;
  readonly kind: "revelation_verbatim" | "translation";
  readonly locale: string;
  readonly rows_expected: number;
  readonly edition_canonical_id: string;
  readonly source_release_sha?: string;
  readonly source_repo?: string;
  readonly source_branch?: string;
  readonly license_id: string;
  readonly attribution_text: string;
  readonly publisher: string;
  readonly author_or_translator?: string;
  readonly work_canonical_id: string;
  readonly work_title: string;
  readonly work_kind: "revelation" | "translation_of_revelation";
  readonly rights_status: "cleared" | "under_review" | "unknown" | "restricted";
}

export interface QuranDatasetManifest {
  readonly datasets: readonly DatasetManifestEntry[];
}

export interface ReconciliationReport {
  readonly dataset: string;
  readonly expected: number;
  readonly observed: number;
  readonly inserted: number;
  readonly skippedConflict: number;
  readonly rejected: readonly { line: number; reason: string }[];
  readonly importRunId: string;
}

interface JsonLine {
  readonly surah: number;
  readonly ayah: number;
  readonly text: string;
  readonly row_kind?: RowKind;
  readonly source_record_id?: string;
  readonly part_index?: number;
  readonly juz?: number;
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function countLines(filePath: string): Promise<number> {
  const handle = await fs.open(filePath, "r");
  try {
    const stream = handle.createReadStream({ encoding: "utf8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    let count = 0;
    for await (const line of rl) {
      if (line.trim().length > 0) count += 1;
    }
    return count;
  } finally {
    await handle.close();
  }
}

function isRowKind(value: unknown): value is RowKind {
  return (
    typeof value === "string" && (ROW_KINDS as readonly string[]).includes(value)
  );
}

function parseLine(raw: string): JsonLine {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const surah = Number(parsed.surah ?? parsed.chapter ?? 0);
  const ayah = Number(parsed.ayah ?? parsed.verse ?? 0);
  const text = typeof parsed.text === "string" ? parsed.text : "";
  if (!Number.isInteger(surah) || surah < SURAH_MIN || surah > SURAH_MAX) {
    throw new QlValidationError(`surah '${String(parsed.surah)}' out of range`);
  }
  if (!Number.isInteger(ayah) || ayah < 1) {
    throw new QlValidationError(`ayah '${String(parsed.ayah)}' invalid`);
  }
  if (!text) throw new QlValidationError("text is required");
  const rowKindRaw = parsed.row_kind ?? parsed.type ?? "ayah";
  if (typeof rowKindRaw !== "string" || !isRowKind(rowKindRaw)) {
    throw new QlValidationError("row_kind must be a supported string.");
  }
  const partIndex =
    typeof parsed.part_index === "number" ? parsed.part_index : undefined;
  const juz = typeof parsed.juz === "number" ? parsed.juz : undefined;
  let sourceRecordId: string | undefined;
  if (typeof parsed.source_record_id === "string") {
    sourceRecordId = parsed.source_record_id;
  } else if (typeof parsed.id === "string") {
    sourceRecordId = parsed.id;
  }
  return {
    surah,
    ayah,
    text,
    row_kind: rowKindRaw,
    ...(sourceRecordId ? { source_record_id: sourceRecordId } : {}),
    ...(partIndex !== undefined ? { part_index: partIndex } : {}),
    ...(juz !== undefined ? { juz } : {}),
  };
}

async function loadManifest(
  manifestPath: string,
): Promise<QuranDatasetManifest> {
  const raw = await fs.readFile(manifestPath, "utf8");
  return JSON.parse(raw) as QuranDatasetManifest;
}

async function upsertArtifactAndVersion(
  orm: QlOrm,
  dataset: DatasetManifestEntry,
  observedRows: number,
  ownerId: string,
): Promise<{ artifactId: string; versionId: string }> {
  const existingArtifact = await orm.findOneByService("source.artifact", {
    canonical_id: dataset.id,
  });
  const artifactKind =
    dataset.kind === "revelation_verbatim" ? "revealed_text" : "translation_source";
  const stamped = new Date();
  let artifactId: string;
  if (existingArtifact) {
    artifactId = String(existingArtifact.id);
  } else {
    const created = await orm.createRecordForService("source.artifact", {
      canonical_id: dataset.id,
      title: dataset.work_title,
      kind: artifactKind,
      publisher: dataset.publisher,
      repository: dataset.source_repo ?? "",
      branch: dataset.source_branch ?? "",
      ...(dataset.source_release_sha
        ? { commit_sha: dataset.source_release_sha }
        : {}),
      lifecycle_stage: "ingest_staged",
      owner_id: ownerId,
      created_at: stamped,
      updated_at: stamped,
    });
    artifactId = String(created.id);
  }
  const versionKey = `${artifactId}@${dataset.id}`;
  const existingVersion = await orm.findOneByService("source.version", {
    version_key: versionKey,
  });
  let versionId: string;
  if (existingVersion) {
    versionId = String(existingVersion.id);
    await orm.updateRecordsForService(
      "source.version",
      { id: versionId },
      {
        row_count_expected: dataset.rows_expected,
        row_count_observed: observedRows,
        acquired_at: stamped,
        updated_at: stamped,
        lifecycle_stage: "ingest_staged",
      },
    );
  } else {
    const created = await orm.createRecordForService("source.version", {
      artifact_id: artifactId,
      version_key: versionKey,
      release_label: dataset.id,
      snapshot_repo: dataset.source_repo ?? "",
      snapshot_ref: dataset.source_branch ?? "",
      ...(dataset.source_release_sha
        ? { snapshot_sha: dataset.source_release_sha }
        : {}),
      row_count_expected: dataset.rows_expected,
      row_count_observed: observedRows,
      acquired_at: stamped,
      method: "pnpm --filter ql_corpus import:quran",
      lifecycle_stage: "ingest_staged",
      owner_id: ownerId,
      created_at: stamped,
      updated_at: stamped,
    });
    versionId = String(created.id);
  }
  return { artifactId, versionId };
}

async function upsertWorkEditionRights(
  orm: QlOrm,
  dataset: DatasetManifestEntry,
  versionId: string,
  ownerId: string,
): Promise<{ workId: string; editionId: string }> {
  const stamped = new Date();
  const existingWork = await orm.findOneByService("corpus.work", {
    canonical_id: dataset.work_canonical_id,
  });
  let workId: string;
  if (existingWork) {
    workId = String(existingWork.id);
  } else {
    const created = await orm.createRecordForService("corpus.work", {
      canonical_id: dataset.work_canonical_id,
      title: dataset.work_title,
      work_kind: dataset.work_kind,
      primary_locale: dataset.locale,
      created_at: stamped,
      updated_at: stamped,
    });
    workId = String(created.id);
  }
  const editionKey = `${workId}|${dataset.locale}|${dataset.kind}`;
  assertEditionKindLocaleInvariant({
    authority: dataset.kind,
    locale: dataset.locale,
  });
  assertPassageAuthority(dataset.kind);
  const existingEdition = await orm.findOneByService("corpus.edition", {
    edition_key: editionKey,
  });
  // Create a per-version rights row so `publishEdition` and `readSurahWindow`
  // can gate on `rights_status`. The importer creates this on the owner's
  // behalf but does **not** clear rights — that requires a human decision
  // (DATA_LIFECYCLE_AND_PROVENANCE.md:27).
  const rightsKey = `${versionId}|display`;
  const existingRights = await orm.findOneByService("source.rights", {
    rights_key: rightsKey,
  });
  let rightsId: string;
  if (existingRights) {
    rightsId = String(existingRights.id);
  } else {
    const created = await orm.createRecordForService("source.rights", {
      version_id: versionId,
      rights_key: rightsKey,
      action: "display",
      rights_status: dataset.rights_status,
      license_id: dataset.license_id,
      attribution_required: true,
      attribution_text: dataset.attribution_text,
      owner_id: ownerId,
      created_at: stamped,
      updated_at: stamped,
    });
    rightsId = String(created.id);
  }
  let editionId: string;
  if (existingEdition) {
    editionId = String(existingEdition.id);
    await orm.updateRecordsForService(
      "corpus.edition",
      { id: editionId },
      {
        imported_row_count: dataset.rows_expected,
        updated_at: stamped,
      },
    );
  } else {
    const created = await orm.createRecordForService("corpus.edition", {
      canonical_id: dataset.edition_canonical_id,
      work_id: workId,
      source_version_id: versionId,
      rights_id: rightsId,
      edition_key: editionKey,
      authority: dataset.kind,
      locale: dataset.locale,
      publisher: dataset.publisher,
      author_or_translator: dataset.author_or_translator ?? dataset.publisher,
      attribution_text: dataset.attribution_text,
      revision: dataset.source_release_sha ?? "",
      imported_row_count: dataset.rows_expected,
      stage: DEFAULT_CORPUS_STAGE,
      created_at: stamped,
      updated_at: stamped,
    });
    editionId = String(created.id);
  }
  return { workId, editionId };
}

async function importRows(
  orm: QlOrm,
  dataset: DatasetManifestEntry,
  editionId: string,
  workId: string,
  importRunId: string,
  checkpointPath: string | null,
  dryRun: boolean,
): Promise<ReconciliationReport> {
  const handle = await fs.open(dataset.path, "r");
  const rejected: { line: number; reason: string }[] = [];
  let inserted = 0;
  let skippedConflict = 0;
  let observed = 0;
  let lastOrdinalCheckpointed = 0;
  try {
    if (checkpointPath && existsSync(checkpointPath)) {
      const raw = await fs.readFile(checkpointPath, "utf8");
      lastOrdinalCheckpointed = Number.parseInt(raw.trim() || "0", 10) || 0;
    }
    const stream = handle.createReadStream({ encoding: "utf8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    let lineNo = 0;
    for await (const raw of rl) {
      lineNo += 1;
      if (!raw.trim()) continue;
      observed += 1;
      if (observed <= lastOrdinalCheckpointed) {
        inserted += 1; // already imported in a prior run
        continue;
      }
      try {
        const parsed = parseLine(raw);
        const locator = `${parsed.surah}:${parsed.ayah}`;
        const passageKey = `${editionId}|${locator}`;
        const checksum = sha256(parsed.text);
        if (dryRun) {
          // Reconciliation still counts a would-be-inserted row so the
          // post-run check below does not misreport a dry-run as a failure.
          inserted += 1;
          continue;
        }
        const stamped = new Date();
        await orm.createRecordForService("corpus.passage", {
          canonical_id: `${dataset.edition_canonical_id}:${locator}`,
          edition_id: editionId,
          work_id: workId,
          authority: dataset.kind,
          locator,
          passage_key: passageKey,
          surah: parsed.surah,
          ayah: parsed.ayah,
          ...(parsed.part_index !== undefined
            ? { part_index: parsed.part_index }
            : {}),
          row_kind: parsed.row_kind ?? "ayah",
          ...(parsed.juz !== undefined ? { juz: parsed.juz } : {}),
          text: parsed.text,
          text_checksum: checksum,
          ...(parsed.source_record_id
            ? { source_record_id: parsed.source_record_id }
            : {}),
          edition_kind_denorm: dataset.kind,
          ordinal: observed,
          import_run_id: importRunId,
          stage: DEFAULT_CORPUS_STAGE,
          created_at: stamped,
          updated_at: stamped,
        });
        inserted += 1;
        if (checkpointPath && observed % 500 === 0) {
          await fs.writeFile(checkpointPath, String(observed), "utf8");
        }
      } catch (error) {
        if (error instanceof QlConflictError) {
          skippedConflict += 1;
          continue;
        }
        if (
          error instanceof QlValidationError ||
          error instanceof QlNotFoundError
        ) {
          rejected.push({ line: lineNo, reason: error.message });
          continue;
        }
        throw error;
      }
    }
  } finally {
    await handle.close();
    if (!dryRun && checkpointPath && observed > lastOrdinalCheckpointed) {
      await fs.writeFile(checkpointPath, String(observed), "utf8");
    }
  }
  return {
    dataset: dataset.id,
    expected: dataset.rows_expected,
    observed,
    inserted,
    skippedConflict,
    rejected,
    importRunId,
  };
}

export interface ImportOptions {
  readonly dryRun: boolean;
  readonly datasetId?: string;
  readonly checkpointDir?: string;
  readonly importRunId?: string;
  readonly ownerId?: string;
}

export async function importQuranSlice(
  orm: QlOrm,
  manifestPath: string,
  options: ImportOptions,
): Promise<ReconciliationReport[]> {
  const manifest = await loadManifest(manifestPath);
  const reports: ReconciliationReport[] = [];
  const selected = options.datasetId
    ? manifest.datasets.filter((d) => d.id === options.datasetId)
    : [...manifest.datasets];
  if (selected.length === 0) {
    throw new QlNotFoundError(
      options.datasetId
        ? `Dataset '${options.datasetId}' is not in the manifest.`
        : "Manifest is empty.",
    );
  }
  const importRunId =
    options.importRunId ?? `run-${Date.now().toString(36)}`;
  const ownerId = options.ownerId ?? "importer";
  for (const dataset of selected) {
    // Reconciliation hard-gate #1 — file exists.
    if (!existsSync(dataset.path)) {
      throw new QlNotFoundError(
        `Dataset file '${dataset.path}' does not exist for '${dataset.id}'.`,
      );
    }
    // Reconciliation hard-gate #2 — line count matches manifest before any
    // row is written. Abort on mismatch with the diff in the error message.
    const observed = await countLines(dataset.path);
    if (observed !== dataset.rows_expected) {
      throw new QlValidationError(
        `Row count mismatch for '${dataset.id}': observed=${observed}, expected=${dataset.rows_expected}. No rows written. Update rows_expected in the manifest (or the frozen snapshot) before retrying — see https://github.com/bjo163/moonwitness-reborn/wiki/docs-knowledge-CORPUS_INTEGRATION_PLAN §Al-Qur'an first-slice datasets.`,
      );
    }
    const { versionId } = await upsertArtifactAndVersion(
      orm,
      dataset,
      observed,
      ownerId,
    );
    const { workId, editionId } = await upsertWorkEditionRights(
      orm,
      dataset,
      versionId,
      ownerId,
    );
    const checkpointPath =
      options.checkpointDir && !options.dryRun
        ? `${options.checkpointDir}/import-${importRunId}-${dataset.id}.checkpoint`
        : null;
    const report = await importRows(
      orm,
      dataset,
      editionId,
      workId,
      importRunId,
      checkpointPath,
      options.dryRun,
    );
    reports.push(report);
    if (report.inserted + report.skippedConflict !== report.expected) {
      throw new QlValidationError(
        `Reconciliation failed for '${dataset.id}': inserted=${report.inserted}, skippedConflict=${report.skippedConflict}, expected=${report.expected}. Rejected lines: ${report.rejected.length}.`,
      );
    }
  }
  return reports;
}

/** Rollback lever: delete every passage tagged with the given import_run_id. */
export async function undoImportRun(
  orm: QlOrm,
  importRunId: string,
): Promise<number> {
  return orm.deleteRecordsForService(
    "corpus.passage",
    {
      import_run_id: importRunId,
    },
    { hard: true },
  );
}
