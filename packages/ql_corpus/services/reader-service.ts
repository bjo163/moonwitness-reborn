import {
  QlAccessError,
  QlNotFoundError,
  type QlOrm,
  type QlRecord,
} from "ql_orm";
import { readRights } from "ql_source/services/source-service";

/**
 * Rights cache keyed on the source.version id + display action. Uses the
 * same in-flight single-flight pattern as
 * `packages/ql_cloudflare/services/sync-service.ts:239-259` (a Map of
 * pending promises) so a burst of concurrent reads on the same edition
 * results in exactly one rights lookup, not N.
 *
 * TTL is short (60 s) because a rights flip is an admin action with rare
 * consequences — the reader must reject a revoked edition quickly, but a
 * 60-second cache window is acceptable (a withdraw can always be forced by
 * a fresh process).
 */
interface RightsCacheEntry {
  value: QlRecord | null;
  expiresAt: number;
}
const RIGHTS_CACHE = new Map<string, Promise<RightsCacheEntry>>();
const RIGHTS_TTL_MS = 60_000;
const RIGHTS_CACHE_MAX = 64;

async function cachedRights(orm: QlOrm, versionId: string): Promise<QlRecord | null> {
  const cacheKey = versionId;
  const existing = RIGHTS_CACHE.get(cacheKey);
  if (existing) {
    const entry = await existing;
    if (entry.expiresAt > Date.now()) return entry.value;
    RIGHTS_CACHE.delete(cacheKey);
  }
  const inflight = (async (): Promise<RightsCacheEntry> => {
    const value = await readRights(orm, versionId, "display");
    return { value, expiresAt: Date.now() + RIGHTS_TTL_MS };
  })();
  RIGHTS_CACHE.set(cacheKey, inflight);
  // Cap the cache size to keep the memory ceiling bounded; a Map's
  // iteration order is insertion order, so the oldest entry is first.
  if (RIGHTS_CACHE.size > RIGHTS_CACHE_MAX) {
    const oldest = RIGHTS_CACHE.keys().next();
    if (!oldest.done) RIGHTS_CACHE.delete(oldest.value);
  }
  const entry = await inflight;
  return entry.value;
}

/** Test helper: force a cache miss for the next read (not used by production code). */
export function _resetRightsCacheForTests(): void {
  RIGHTS_CACHE.clear();
}

/**
 * Reader DTO shape. Note that every passage in the response carries its own
 * `authority` and `attribution_text` — MW-ADR-019 §(d) forbids a client
 * from rendering text without its kind, so the shape is duplicated per row
 * rather than referenced once at the envelope.
 */
export interface PassageReadDto {
  readonly id: string;
  readonly locator: string;
  readonly surah: number;
  readonly ayah: number;
  readonly authority: string;
  readonly row_kind: string;
  readonly text: string;
  readonly text_checksum: string;
  readonly ordinal: number;
  readonly edition_id: string;
  readonly edition_authority: string;
  readonly edition_locale: string;
  readonly edition_publisher: string;
  readonly edition_attribution_text: string;
}

export interface SurahReadDto {
  readonly editionKey: string;
  readonly editionAuthority: string;
  readonly editionLocale: string;
  readonly surah: number;
  readonly passages: readonly PassageReadDto[];
}

function readEditionFields(edition: QlRecord): {
  authority: string;
  locale: string;
  publisher: string;
  attribution: string;
} {
  return {
    authority: String(edition.authority ?? ""),
    locale: String(edition.locale ?? ""),
    publisher: String(edition.publisher ?? ""),
    attribution: String(edition.attribution_text ?? ""),
  };
}

function toDto(
  passage: QlRecord,
  edition: QlRecord,
): PassageReadDto {
  const meta = readEditionFields(edition);
  return {
    id: String(passage.id ?? ""),
    locator: String(passage.locator ?? ""),
    surah: Number(passage.surah ?? 0),
    ayah: Number(passage.ayah ?? 0),
    authority: String(passage.authority ?? meta.authority),
    row_kind: String(passage.row_kind ?? "ayah"),
    text: String(passage.text ?? ""),
    text_checksum: String(passage.text_checksum ?? ""),
    ordinal: Number(passage.ordinal ?? 0),
    edition_id: String(passage.edition_id ?? edition.id ?? ""),
    edition_authority: meta.authority,
    edition_locale: meta.locale,
    edition_publisher: meta.publisher,
    edition_attribution_text: meta.attribution,
  };
}

/**
 * Read one surah's passages from a published edition whose display rights
 * are cleared.
 *
 * The 500-row clamp on `findManyByService`
 * (`packages/ql-orm/src/index.ts:705`) is respected **by construction**:
 * the largest surah in the Quran is 286 verses (At-Baqarah), so per-surah
 * fetch always fits. Requests for a whole edition would exceed the clamp
 * and are refused by the caller — the handler must not implement a "load
 * everything" endpoint.
 */
export async function readSurahWindow(
  orm: QlOrm,
  editionKey: string,
  surah: number,
): Promise<SurahReadDto> {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new QlNotFoundError(`Surah '${String(surah)}' is out of range 1..114.`);
  }
  const edition = await orm.findOneByService("corpus.edition", {
    edition_key: editionKey,
  });
  if (!edition) throw new QlNotFoundError(`Edition '${editionKey}' not found.`);
  if (edition.stage !== "published") {
    // Rights-blocked or unpublished — the reader refuses to surface text.
    throw new QlAccessError(
      "Edition is not published; content is unavailable.",
    );
  }
  const rights = await cachedRights(orm, String(edition.source_version_id));
  if (!rights || rights.rights_status !== "cleared") {
    throw new QlAccessError(
      "Display rights are not cleared for this edition; content is unavailable.",
    );
  }
  const rows = await orm.findManyByService(
    "corpus.passage",
    {
      edition_id: String(edition.id),
      surah,
      stage: "published",
    },
    { limit: 500, orderBy: { field: "ordinal", direction: "asc" } },
  );
  return {
    editionKey,
    editionAuthority: String(edition.authority ?? ""),
    editionLocale: String(edition.locale ?? ""),
    surah,
    passages: rows.map((row) => toDto(row, edition)),
  };
}

/** Single-verse lookup — hits the denormalized `passage_key` UNIQUE index. */
export async function readVerse(
  orm: QlOrm,
  editionKey: string,
  surah: number,
  ayah: number,
): Promise<PassageReadDto> {
  const edition = await orm.findOneByService("corpus.edition", {
    edition_key: editionKey,
  });
  if (!edition) throw new QlNotFoundError(`Edition '${editionKey}' not found.`);
  if (edition.stage !== "published") {
    throw new QlAccessError("Edition is not published; content is unavailable.");
  }
  const rights = await cachedRights(orm, String(edition.source_version_id));
  if (!rights || rights.rights_status !== "cleared") {
    throw new QlAccessError(
      "Display rights are not cleared for this edition; content is unavailable.",
    );
  }
  const locator = `${surah}:${ayah}`;
  const row = await orm.findOneByService("corpus.passage", {
    passage_key: `${String(edition.id)}|${locator}`,
  });
  if (!row) {
    throw new QlNotFoundError(`Verse '${locator}' not found in edition '${editionKey}'.`);
  }
  return toDto(row, edition);
}
