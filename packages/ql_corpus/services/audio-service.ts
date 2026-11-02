import {
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
} from "ql_orm";
import { SURAH_MAX, SURAH_MIN } from "./corpus-vocabulary.js";
import { assertAyahWithinSurah } from "./corpus-service.js";

/**
 * Track 05 — read path for tilawah audio.
 *
 * Everything the player shows has to come from a curated row: the reciter's
 * name and licence from `corpus.reciter`, the clip address and its millisecond
 * boundaries from `corpus.audio_segment`. Nothing here derives a timestamp from
 * an array index, and nothing here points the browser at a third-party CDN. An
 * un-curated surah answers with an empty segment list and the screen says so,
 * instead of inventing a five-second-per-ayah recitation.
 *
 * Per-surah fetches respect the 500-row `findManyByService` clamp by
 * construction: the longest surah is 286 verses, so one reciter/surah window
 * cannot exceed it. There is no endpoint here that loads a whole edition.
 */

const MAX_RECITERS = 50;
const MAX_SEGMENTS_PER_SURAH = 500;
const RECITER_SLUG_MAX_LENGTH = 64;

export const recitationStyles = ["murattal", "mujawwad", "tahfeedh"] as const;
export type RecitationStyle = (typeof recitationStyles)[number];

export interface ReciterDto {
  id: string;
  slug: string;
  nameTranslit: string;
  nameArabic: string;
  style: RecitationStyle;
  licenseType: string;
  isActive: boolean;
}

export interface AudioSegmentDto {
  ayahNumber: number;
  startMs: number;
  endMs: number;
  audioFileUrl: string;
}

export interface SurahAudioManifestDto {
  reciterSlug: string;
  reciterName: string;
  reciterStyle: RecitationStyle;
  licenseType: string;
  surahNumber: number;
  segments: AudioSegmentDto[];
  /**
   * The one continuous recording that `start_ms`/`end_ms` time, or null when
   * the surah is curated as per-verse clips. It is read off `audio_file_url`,
   * never assembled from `corpus.reciter.audio_base_url` plus a filename
   * pattern: the schema defines no such pattern, so building a URL from the
   * base would be a guess dressed up as data. A player that needs one
   * timeline over a whole surah cannot use per-verse clips, so null is the
   * honest answer rather than a first-clip stand-in.
   */
  streamUrl: string | null;
  /** End of the curated timeline, taken from the last segment; 0 when empty. */
  durationMs: number;
}

export function assertReciterSlug(slug: string): string {
  if (
    !slug.trim() ||
    slug !== slug.trim() ||
    slug.length > RECITER_SLUG_MAX_LENGTH ||
    !/^[a-z0-9][a-z0-9_-]*$/.test(slug)
  ) {
    throw new QlValidationError(
      `A reciter slug must be a lowercase identifier of at most ${RECITER_SLUG_MAX_LENGTH} characters.`,
    );
  }
  return slug;
}

export function assertSurahNumber(value: number): number {
  if (!Number.isInteger(value) || value < SURAH_MIN || value > SURAH_MAX) {
    throw new QlValidationError(
      `Surah number must be one of ${SURAH_MIN}..${SURAH_MAX}; got ${String(value)}.`,
    );
  }
  return value;
}

function requiredText(record: QlRecord, key: string, model: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new QlValidationError(`${model}.${key} must be a non-empty string.`);
  }
  return value;
}

function requiredInteger(record: QlRecord, key: string, model: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new QlValidationError(`${model}.${key} must be a safe integer.`);
  }
  return value;
}

function styleOf(value: string): RecitationStyle {
  if (!(recitationStyles as readonly string[]).includes(value)) {
    throw new QlValidationError(
      `corpus.reciter.recitation_style holds '${value}', which is not a declared style.`,
    );
  }
  return value as RecitationStyle;
}

function toReciter(record: QlRecord): ReciterDto {
  return {
    id: requiredText(record, "id", "corpus.reciter"),
    slug: requiredText(record, "slug", "corpus.reciter"),
    nameTranslit: requiredText(record, "name_translit", "corpus.reciter"),
    nameArabic: requiredText(record, "name_arabic", "corpus.reciter"),
    style: styleOf(requiredText(record, "recitation_style", "corpus.reciter")),
    licenseType: requiredText(record, "license_type", "corpus.reciter"),
    isActive: record.is_active === true,
  };
}

/**
 * One curated row, checked against the canonical surah table rather than
 * trusted from storage: a clip labelled with a verse that does not exist, or
 * ending before it starts, would put false synchronisation data underneath a
 * recitation of scripture.
 */
function toSegment(record: QlRecord): AudioSegmentDto {
  const surahNumber = requiredInteger(record, "surah_number", "corpus.audio_segment");
  const ayahNumber = requiredInteger(record, "ayah_number", "corpus.audio_segment");
  assertAyahWithinSurah(surahNumber, ayahNumber);
  const startMs = requiredInteger(record, "start_ms", "corpus.audio_segment");
  const endMs = requiredInteger(record, "end_ms", "corpus.audio_segment");
  if (startMs < 0 || endMs <= startMs) {
    throw new QlValidationError(
      `The clip for ${surahNumber}:${ayahNumber} runs ${startMs}ms..${endMs}ms, which is not a positive span.`,
    );
  }
  return {
    ayahNumber,
    startMs,
    endMs,
    audioFileUrl: requiredText(record, "audio_file_url", "corpus.audio_segment"),
  };
}

/** Every registered reciter, activation flag included, for the admin shelf. */
export async function listReciters(orm: QlOrm): Promise<ReciterDto[]> {
  const rows = await orm.findManyByService(
    "corpus.reciter",
    {},
    { limit: MAX_RECITERS, orderBy: { field: "slug", direction: "asc" } },
  );
  if (rows.length === MAX_RECITERS) {
    throw new QlValidationError(
      `The reciter scan reached its ${MAX_RECITERS}-row bound; raise it deliberately.`,
    );
  }
  return rows.map(toReciter);
}

async function requireActiveReciter(orm: QlOrm, slug: string): Promise<ReciterDto> {
  const row = await orm.findOneByService("corpus.reciter", { slug });
  if (!row) {
    throw new QlNotFoundError(`No reciter '${slug}' is registered in corpus.reciter.`);
  }
  const reciter = toReciter(row);
  if (!reciter.isActive) {
    throw new QlNotFoundError(
      `Reciter '${slug}' is registered but deactivated, so its recitation is not offered.`,
    );
  }
  return reciter;
}

/**
 * The curated clips for one surah by one reciter, ordered by verse. The reciter
 * has to exist and be active before any audio is named: putting a name on a
 * recitation the registry does not carry is a false attribution.
 */
export async function readSurahAudioManifest(
  orm: QlOrm,
  reciterSlug: string,
  surahNumber: number,
): Promise<SurahAudioManifestDto> {
  const slug = assertReciterSlug(reciterSlug);
  const surah = assertSurahNumber(surahNumber);
  const reciter = await requireActiveReciter(orm, slug);

  const rows = await orm.findManyByService(
    "corpus.audio_segment",
    { reciter_slug: slug, surah_number: surah },
    {
      limit: MAX_SEGMENTS_PER_SURAH,
      orderBy: { field: "ayah_number", direction: "asc" },
    },
  );
  if (rows.length === MAX_SEGMENTS_PER_SURAH) {
    throw new QlValidationError(
      `The audio window for ${slug}/${String(surah)} hit the ${MAX_SEGMENTS_PER_SURAH}-row clamp; a wider window needs a deliberate bound.`,
    );
  }
  const segments = rows.map(toSegment);
  const streamUrl = streamUrlOf(segments);

  return {
    reciterSlug: slug,
    reciterName: reciter.nameTranslit,
    reciterStyle: reciter.style,
    licenseType: reciter.licenseType,
    surahNumber: surah,
    segments,
    streamUrl,
    durationMs: segments.reduce(
      (furthest, segment) => Math.max(furthest, segment.endMs),
      0,
    ),
  };
}

/** The file every segment of the surah shares, or null if they do not share one. */
function streamUrlOf(segments: readonly AudioSegmentDto[]): string | null {
  if (segments.length === 0) return null;
  const firstUrl = segments[0].audioFileUrl;
  return segments.every((segment) => segment.audioFileUrl === firstUrl)
    ? firstUrl
    : null;
}
