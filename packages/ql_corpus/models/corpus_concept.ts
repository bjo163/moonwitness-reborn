import type { QlModelDefinition } from "ql_orm";
import { bcp47Validator } from "../services/field-validators.js";

/**
 * `corpus.concept` — semantic concept in the UNILEX ontology.
 *
 * Concepts represent higher-order semantic targets and philosophical/theological
 * categories. Distinguishes different traditions, disciplines, and contexts (MWREQ-00525).
 * Disallows silent merging of concepts with similar words (MWREQ-00526).
 */
export const corpusConcept: QlModelDefinition = {
  name: "corpus.concept",
  description: "Konsep semantik dan kategori ontologis UNILEX (MW-1223).",
  tableName: "corpus_concept",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    name: { type: "char", required: true, maxLength: 200 },
    category: { type: "char", required: true, maxLength: 64 },
    domain: { type: "char", required: true, maxLength: 64 },
    definition: { type: "text", required: true, maxLength: 4000 },
    primary_locale: {
      type: "char",
      required: true,
      maxLength: 12,
      validator: bcp47Validator("primary_locale"),
    },
    version: { type: "char", required: true, maxLength: 32 },
    is_deprecated: { type: "boolean", required: true },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
