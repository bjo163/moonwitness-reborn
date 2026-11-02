import type { QlModelDefinition } from "ql_orm";

export const WITNESS_RELIABILITY_LEVELS = [
  "unverified",
  "corroborated",
  "disputed",
  "questionable",
] as const;

/**
 * `witness.statement` — Attributed testimony, observation, or recorded experience.
 *
 * Implements MWREQ-00527 through MWREQ-00543 (MW-1224):
 * - Attributed to person/source reference.
 * - Explicit transmission chain and chain of custody tracking.
 * - A witness is not automatically accurate (MWREQ-00541).
 * - A recorded statement is not automatically verified (MWREQ-00542).
 * - Missing chain-of-custody remains visible (MWREQ-00543).
 */
export const witnessStatement: QlModelDefinition = {
  name: "witness.statement",
  description: "Pernyataan saksi, transmisi, dan penilaian reliabilitas (MW-1224).",
  tableName: "witness_statement",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    witness_name: { type: "char", required: true, maxLength: 200 },
    person_id: { type: "char", maxLength: 64 },
    source_artifact_id: { type: "char", required: true, maxLength: 64 },
    passage_id: { type: "char", maxLength: 64 },
    statement: { type: "text", required: true, maxLength: 16_000 },
    time_context: { type: "char", maxLength: 200 },
    place_context: { type: "char", maxLength: 200 },
    transmission_chain: { type: "text", maxLength: 4000 },
    chain_of_custody: { type: "text", maxLength: 4000 },
    has_broken_chain: { type: "boolean", required: true },
    reliability_assessment: {
      type: "char",
      required: true,
      maxLength: 32,
      validator(value) {
        return WITNESS_RELIABILITY_LEVELS.some((level) => level === value)
          ? undefined
          : `reliability_assessment must be one of ${WITNESS_RELIABILITY_LEVELS.join(", ")}.`;
      },
    },
    consent_status: { type: "char", required: true, maxLength: 32 },
  },
};
