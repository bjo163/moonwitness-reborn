import type { QlModelDefinition } from "ql_orm";
import {
  authorityValidator,
  enumValidator,
  sha256Validator,
} from "../services/field-validators.js";
import {
  ANNOTATION_AUTHORITIES,
  AYAH_MAX_BOUND,
  CORPUS_STAGES,
  DEFAULT_CORPUS_STAGE,
  JUZ_MAX,
  JUZ_MIN,
  ROW_KINDS,
  SURAH_MAX,
  SURAH_MIN,
  TEXT_AUTHORITIES,
} from "../services/corpus-vocabulary.js";

/**
 * `corpus.passage` — one text row belonging to a specific edition and
 * locator (RGBL: Passage + Text Segment merged). Both Arabic verbatim and
 * attributed translations live here as separate rows distinguished by the
 * `authority` discriminator.
 *
 * MW-ADR-019 §(a) is implemented right here: `authorityValidator(TEXT_
 * AUTHORITIES)` restricts this column to `["revelation_verbatim","translation"]`,
 * which means a `tafsir`, `reflection`, or `annotation` value cannot be
 * inserted **even via the importer's `orm.createRecordForService` path**
 * because QlOrm validates field values on service writes too
 * (`packages/ql-orm/src/index.ts:319-322`).
 *
 * Composite UNIQUE keys are the workaround for the absence of a real
 * composite index (`packages/ql-orm/src/index.ts:519` is the only
 * `CREATE UNIQUE INDEX` site): `passage_key = <edition_id>|<locator>` gives
 * every reader lookup an indexed equality hit, and doubles as the idempotency
 * guard on re-import — a second `createRecordForService` with the same key
 * surfaces as `QlConflictError` (`:753-755`) that the importer treats as
 * "already imported" rather than an error.
 *
 * `stage` and the write-path ACL mirror `corpus.edition` — no `form` view is
 * registered for this model (see `views/index.ts`); every row is written only
 * by the offline importer service path.
 */
export const corpusPassage: QlModelDefinition = {
  name: "corpus.passage",
  description:
    "Satu baris teks milik satu edisi + locator (ayat Arab, terjemahan, dsb).",
  tableName: "corpus_passage",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 100 },
    edition_id: { type: "char", required: true, maxLength: 64 },
    work_id: { type: "char", required: true, maxLength: 64 },
    authority: {
      type: "char",
      required: true,
      maxLength: 24,
      options: TEXT_AUTHORITIES,
      // MW-ADR-019 §(a) — the religious-integrity storage invariant.
      validator: authorityValidator("authority", TEXT_AUTHORITIES),
    },
    locator: { type: "char", required: true, maxLength: 40 },
    passage_key: { type: "char", required: true, unique: true, maxLength: 180 },
    surah: { type: "integer", required: true, minValue: SURAH_MIN, maxValue: SURAH_MAX },
    ayah: { type: "integer", required: true, minValue: 1, maxValue: AYAH_MAX_BOUND },
    part_index: { type: "integer", minValue: 0, maxValue: 99 },
    row_kind: {
      type: "char",
      required: true,
      maxLength: 16,
      default: "ayah",
      options: ROW_KINDS,
      validator: enumValidator("row_kind", ROW_KINDS),
    },
    juz: { type: "integer", minValue: JUZ_MIN, maxValue: JUZ_MAX },
    text: { type: "text", required: true, maxLength: 12000 },
    text_checksum: {
      type: "char",
      required: true,
      maxLength: 64,
      validator: sha256Validator("text_checksum"),
    },
    // Original upstream identifier — never rewritten by the importer per
    // `https://github.com/bjo163/moonwitness-reborn/wiki/docs-knowledge-CORPUS_INTEGRATION_PLAN` "Do not rewrite IDs or
    // normalize punctuation silently".
    source_record_id: { type: "char", maxLength: 80 },
    // Denormalized copy of `corpus.edition.authority` so a reader filter by
    // kind does not require a join QlOrm cannot express. Kept in sync by
    // the importer; a drift test lives in the corpus-service guard.
    edition_kind_denorm: {
      type: "char",
      maxLength: 24,
      validator: authorityValidator("edition_kind_denorm", [
        ...TEXT_AUTHORITIES,
        ...ANNOTATION_AUTHORITIES,
      ]),
    },
    ordinal: { type: "integer", required: true, minValue: 0 },
    import_run_id: { type: "char", required: true, maxLength: 64 },
    stage: {
      type: "char",
      required: true,
      maxLength: 16,
      default: DEFAULT_CORPUS_STAGE,
      options: CORPUS_STAGES,
      validator: enumValidator("stage", CORPUS_STAGES),
    },
  },
};
