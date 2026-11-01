/**
 * `ql_corpus` — canonical vocabularies for the RGBL corpus layer.
 *
 * Local (not promoted to `@moonwitness/types`) because MW-ADR-015 requires
 * a proven 3-site duplication threshold; these unions have exactly two
 * consumers today: the `ql_corpus` validators/services and the moonclient
 * DTO re-declarations. Promote when a second review-bearing addon (e.g.
 * `publication.review`) appears.
 *
 * The **two-subset split** below is the storage-level religious-integrity
 * invariant recorded as MW-ADR-019. `corpus.passage.authority` uses
 * `TEXT_AUTHORITIES` and `corpus.annotation.authority` uses
 * `ANNOTATION_AUTHORITIES`; because QlOrm runs field validators on both the
 * user *and* the service write paths
 * (`packages/ql-orm/src/index.ts:319-322`), a `revelation_verbatim` row can
 * never enter the annotation table and a `tafsir` row can never enter the
 * passage table — even from the importer. Enforced by test 2 in
 * `models/index.test.ts`.
 */

/** Full set of content classes across the corpus + annotation tables. */
export const PASSAGE_KINDS = [
  "revelation_verbatim",
  "translation",
  "tafsir",
  "reflection",
  "annotation",
  "lexical",
] as const;
export type PassageKind = (typeof PASSAGE_KINDS)[number];

/** Subset that may live in `corpus.passage` (exact-text and attributed translation). */
export const TEXT_AUTHORITIES: readonly PassageKind[] = [
  "revelation_verbatim",
  "translation",
];

/** Subset that may live in `corpus.annotation` (commentary / reflection). */
export const ANNOTATION_AUTHORITIES: readonly PassageKind[] = [
  "tafsir",
  "reflection",
  "annotation",
];

/** `corpus.edition.work_kind` — the top-level classification of a work. */
export const WORK_KINDS = [
  "revelation",
  "translation_of_revelation",
  "commentary",
  "lexicon",
  "reflection",
] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

/**
 * Corpus row lifecycle. Kept distinct from `source.artifact.lifecycle_stage`
 * (the 9-stage `LIFECYCLE_STAGES` in `ql_source`) so the two ledgers do not
 * drift; the mapping is documented on `source.provenance`.
 */
export const CORPUS_STAGES = [
  "staged",
  "validated",
  "reviewed",
  "approved",
  "published",
  "withdrawn",
  "quarantined",
] as const;
export type CorpusStage = (typeof CORPUS_STAGES)[number];

/** Row granularity preserved verbatim from upstream snapshots. */
export const ROW_KINDS = [
  "ayah",
  "basmalah",
  "surah_header",
  "word",
  "footnote",
] as const;
export type RowKind = (typeof ROW_KINDS)[number];

/** Locales the Al-Qur'an first slice covers. Extend with a BCP 47 tag when adding another translation. */
export const QURAN_LOCALES = ["ar", "en", "id"] as const;

/** Hard bounds from the Quran's structure — enforced by field `minValue`/`maxValue`. */
export const SURAH_MIN = 1;
export const SURAH_MAX = 114;
/** Al-Baqarah is the longest surah at 286 ayahs; this bound is checked against the 500-row read clamp. */
export const AYAH_MAX_BOUND = 286;
export const JUZ_MIN = 1;
export const JUZ_MAX = 30;

/**
 * 114-entry surah metadata table. Kept in code (not the DB) because it is
 * a stable religious constant, and the reader's surah navigation + the
 * importer's reconciliation gate both need it before any record is written.
 * `ayahCount` is the canonical Medinan count (Kufi/Basran variants are
 * recorded as annotations when a specific edition needs them).
 */
export interface SurahMeta {
  readonly number: number;
  readonly ayahCount: number;
}

/** Canonical ayah-count table (Hafs ʿan ʿAli al-Kisaʾi, the standard Tanzil/QuranEnc numbering). */
export const SURAHS: readonly SurahMeta[] = [
  { number: 1, ayahCount: 7 },
  { number: 2, ayahCount: 286 },
  { number: 3, ayahCount: 200 },
  { number: 4, ayahCount: 176 },
  { number: 5, ayahCount: 120 },
  { number: 6, ayahCount: 165 },
  { number: 7, ayahCount: 206 },
  { number: 8, ayahCount: 75 },
  { number: 9, ayahCount: 129 },
  { number: 10, ayahCount: 109 },
  { number: 11, ayahCount: 123 },
  { number: 12, ayahCount: 111 },
  { number: 13, ayahCount: 43 },
  { number: 14, ayahCount: 52 },
  { number: 15, ayahCount: 99 },
  { number: 16, ayahCount: 128 },
  { number: 17, ayahCount: 111 },
  { number: 18, ayahCount: 110 },
  { number: 19, ayahCount: 98 },
  { number: 20, ayahCount: 135 },
  { number: 21, ayahCount: 112 },
  { number: 22, ayahCount: 78 },
  { number: 23, ayahCount: 118 },
  { number: 24, ayahCount: 64 },
  { number: 25, ayahCount: 77 },
  { number: 26, ayahCount: 227 },
  { number: 27, ayahCount: 93 },
  { number: 28, ayahCount: 88 },
  { number: 29, ayahCount: 69 },
  { number: 30, ayahCount: 60 },
  { number: 31, ayahCount: 34 },
  { number: 32, ayahCount: 30 },
  { number: 33, ayahCount: 73 },
  { number: 34, ayahCount: 54 },
  { number: 35, ayahCount: 45 },
  { number: 36, ayahCount: 68 },
  { number: 37, ayahCount: 182 },
  { number: 38, ayahCount: 88 },
  { number: 39, ayahCount: 75 },
  { number: 40, ayahCount: 85 },
  { number: 41, ayahCount: 54 },
  { number: 42, ayahCount: 53 },
  { number: 43, ayahCount: 89 },
  { number: 44, ayahCount: 59 },
  { number: 45, ayahCount: 37 },
  { number: 46, ayahCount: 35 },
  { number: 47, ayahCount: 38 },
  { number: 48, ayahCount: 29 },
  { number: 49, ayahCount: 18 },
  { number: 50, ayahCount: 45 },
  { number: 51, ayahCount: 60 },
  { number: 52, ayahCount: 49 },
  { number: 53, ayahCount: 62 },
  { number: 54, ayahCount: 55 },
  { number: 55, ayahCount: 78 },
  { number: 56, ayahCount: 96 },
  { number: 57, ayahCount: 29 },
  { number: 58, ayahCount: 22 },
  { number: 59, ayahCount: 24 },
  { number: 60, ayahCount: 13 },
  { number: 61, ayahCount: 14 },
  { number: 62, ayahCount: 11 },
  { number: 63, ayahCount: 11 },
  { number: 64, ayahCount: 18 },
  { number: 65, ayahCount: 12 },
  { number: 66, ayahCount: 12 },
  { number: 67, ayahCount: 30 },
  { number: 68, ayahCount: 52 },
  { number: 69, ayahCount: 52 },
  { number: 70, ayahCount: 44 },
  { number: 71, ayahCount: 28 },
  { number: 72, ayahCount: 28 },
  { number: 73, ayahCount: 20 },
  { number: 74, ayahCount: 56 },
  { number: 75, ayahCount: 40 },
  { number: 76, ayahCount: 31 },
  { number: 77, ayahCount: 50 },
  { number: 78, ayahCount: 40 },
  { number: 79, ayahCount: 46 },
  { number: 80, ayahCount: 42 },
  { number: 81, ayahCount: 29 },
  { number: 82, ayahCount: 19 },
  { number: 83, ayahCount: 36 },
  { number: 84, ayahCount: 25 },
  { number: 85, ayahCount: 22 },
  { number: 86, ayahCount: 17 },
  { number: 87, ayahCount: 19 },
  { number: 88, ayahCount: 26 },
  { number: 89, ayahCount: 30 },
  { number: 90, ayahCount: 20 },
  { number: 91, ayahCount: 15 },
  { number: 92, ayahCount: 21 },
  { number: 93, ayahCount: 11 },
  { number: 94, ayahCount: 8 },
  { number: 95, ayahCount: 8 },
  { number: 96, ayahCount: 19 },
  { number: 97, ayahCount: 5 },
  { number: 98, ayahCount: 8 },
  { number: 99, ayahCount: 8 },
  { number: 100, ayahCount: 11 },
  { number: 101, ayahCount: 11 },
  { number: 102, ayahCount: 8 },
  { number: 103, ayahCount: 3 },
  { number: 104, ayahCount: 9 },
  { number: 105, ayahCount: 5 },
  { number: 106, ayahCount: 4 },
  { number: 107, ayahCount: 7 },
  { number: 108, ayahCount: 3 },
  { number: 109, ayahCount: 6 },
  { number: 110, ayahCount: 3 },
  { number: 111, ayahCount: 5 },
  { number: 112, ayahCount: 4 },
  { number: 113, ayahCount: 5 },
  { number: 114, ayahCount: 6 },
];

/**
 * Total verse count derived from `SURAHS` — the importer uses this to sanity
 * check that the ayah-count table is complete and internally consistent
 * before trusting the reconciliation gate (the canonical 6,236 verse count
 * is asserted by test 7 in `models/index.test.ts`).
 */
export const TOTAL_AYAH_COUNT: number = SURAHS.reduce(
  (sum, s) => sum + s.ayahCount,
  0,
);

/** Default stage — a freshly-imported row starts here and is only surfaced after an explicit publish. */
export const DEFAULT_CORPUS_STAGE: CorpusStage = "staged";
/** Default urgency equivalent for annotation records — kept for symmetry with workflow's default vocabulary. */
export const DEFAULT_ROW_KIND: RowKind = "ayah";
