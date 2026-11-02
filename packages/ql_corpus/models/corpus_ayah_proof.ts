import type { QlModelDefinition } from "ql_orm";
import { sha256Validator } from "../services/field-validators.js";
import {
  AYAH_MAX_BOUND,
  SURAH_MAX,
  SURAH_MIN,
} from "../services/corpus-vocabulary.js";

export const corpusAyahProof: QlModelDefinition = {
  name: "corpus.ayah_proof",
  labelKey: "web.models.entities.corpus_ayah_proof",
  description: "Cryptographic proof record anchoring immutable passage content hashes.",
  descriptionKey: "web.models.descriptions.corpus_ayah_proof",
  tableName: "corpus_ayah_proof",
  fields: {
    passage_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    surah_number: {
      type: "integer",
      required: true,
      minValue: SURAH_MIN,
      maxValue: SURAH_MAX,
    },
    ayah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      // Coarse ceiling only; the per-surah verse count is a cross-field rule
      // enforced by `assertAyahWithinSurah` in the services and the API.
      maxValue: AYAH_MAX_BOUND,
    },
    edition_code: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    content_hash_sha256: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 64,
      validator: sha256Validator("content_hash_sha256"),
    },
    canonical_payload: {
      type: "text",
      required: true,
      maxLength: 8000,
    },
    verification_count: {
      type: "integer",
      required: true,
      default: 0,
      minValue: 0,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
