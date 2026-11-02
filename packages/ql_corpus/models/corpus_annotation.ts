import type { QlModelDefinition } from "ql_orm";
import {
  authorityValidator,
  bcp47Validator,
  sha256Validator,
} from "../services/field-validators.js";
import {
  ANNOTATION_AUTHORITIES,
  CORPUS_STAGES,
  DEFAULT_CORPUS_STAGE,
} from "../services/corpus-vocabulary.js";

/**
 * `corpus.annotation` — commentary, tafsir, or personal reflection referencing
 * an existing `corpus.passage` (RGBL: derived record).
 *
 * MW-ADR-019 §(b): `authorityValidator(ANNOTATION_AUTHORITIES)` **refuses**
 * `revelation_verbatim`, so commentary can never be inserted into the same
 * table as canonical text — even from the importer's service path — because
 * QlOrm runs field validators on service writes
 * (`packages/ql-orm/src/index.ts:319-322`). This is the *structural* form
 * of `https://github.com/bjo163/moonwitness-reborn/wiki/docs-vision-ALLAH_COM_OFFICIAL_CANON` "A translation is not
 * the original text. Commentary is not the source."
 *
 * `quoted_passage_id` is required: a tafsir row without a target verse is a
 * data-model bug, not a legitimate record. The table ships with the MVP so
 * the invariant is regression-tested on day one; the corpus plan
 * (`https://github.com/bjo163/moonwitness-reborn/wiki/docs-knowledge-CORPUS_INTEGRATION_PLAN`) explicitly defers the tafsir
 * import until its per-edition rights are recorded — the table stays empty
 * until then.
 */
export const corpusAnnotation: QlModelDefinition = {
  name: "corpus.annotation",
  description:
    "Tafsir, refleksi, atau anotasi yang merujuk ke satu passage; tidak pernah boleh berisi teks revelation.",
  tableName: "corpus_annotation",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 100 },
    edition_id: { type: "char", required: true, maxLength: 64 },
    work_id: { type: "char", required: true, maxLength: 64 },
    authority: {
      type: "char",
      required: true,
      maxLength: 24,
      // MW-ADR-019 §(b) — the storage-level religious-integrity invariant.
      validator: authorityValidator("authority", ANNOTATION_AUTHORITIES),
    },
    quoted_passage_id: { type: "char", required: true, maxLength: 64 },
    annotator: { type: "char", required: true, maxLength: 200 },
    school_or_tradition: { type: "char", maxLength: 120 },
    locale: { type: "char", required: true, maxLength: 12, validator: bcp47Validator("locale") },
    locator: { type: "char", maxLength: 40 },
    annotation_key: { type: "char", required: true, unique: true, maxLength: 180 },
    body: { type: "text", required: true, maxLength: 20000 },
    body_checksum: {
      type: "char",
      maxLength: 64,
      validator: sha256Validator("body_checksum"),
    },
    attribution_text: { type: "text", required: true, maxLength: 4000 },
    rights_id: { type: "char", required: true, maxLength: 64 },
    stage: {
      type: "char",
      required: true,
      maxLength: 16,
      default: DEFAULT_CORPUS_STAGE,
      validator: authorityValidator("stage", CORPUS_STAGES),
    },
    import_run_id: { type: "char", maxLength: 64 },
  },
};
