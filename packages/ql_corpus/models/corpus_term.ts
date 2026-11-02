import type { QlModelDefinition } from "ql_orm";
import { bcp47Validator } from "../services/field-validators.js";

/**
 * `corpus.term` — canonical vocabulary item / term in the UNILEX ontology.
 *
 * Owned by `ql_corpus` under the unified lexical & knowledge substrate.
 * Maps terminology, root, lemma, part-of-speech, and primary language.
 * Enforces unambiguous semantic mapping without silent collision (MWREQ-00526).
 */
export const corpusTerm: QlModelDefinition = {
  name: "corpus.term",
  description: "Entitas leksikon/istilah kanonis dalam ontologi UNILEX (MW-1223).",
  tableName: "corpus_term",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    term: { type: "char", required: true, maxLength: 200 },
    lemma: { type: "char", maxLength: 200 },
    root: { type: "char", maxLength: 64 },
    part_of_speech: { type: "char", maxLength: 32 },
    primary_locale: {
      type: "char",
      required: true,
      maxLength: 12,
      validator: bcp47Validator("primary_locale"),
    },
    transliteration: { type: "char", maxLength: 200 },
    description: { type: "text", maxLength: 4000 },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
