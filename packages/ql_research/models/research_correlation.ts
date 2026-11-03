import type { QlModelDefinition } from "ql_orm";

/**
 * Valid correlation relationship types across knowledge domains (MWREQ-00668..MWREQ-00683).
 */
export const CORRELATION_TYPES = [
  "cites",
  "contradicts",
  "corroborates",
  "elaborates",
  "chronologically_precedes",
  "geographically_coincides",
  "transmitted_by",
  "subject_of",
  "participant_in",
  "abrogates",
] as const;

export type CorrelationType = (typeof CORRELATION_TYPES)[number];

/**
 * Valid certainty tiers for correlation assertions.
 */
export const CORRELATION_CERTAINTIES = [
  "definite",
  "probable",
  "plausible",
  "speculative",
  "contested",
] as const;

export type CorrelationCertainty = (typeof CORRELATION_CERTAINTIES)[number];

/**
 * `research.correlation` — Explicit typed correlation between research and corpus entities (MW-1232).
 *
 * Implements MWREQ-00668 through MWREQ-00683:
 * - Cross-domain typed semantic links between entities (work, passage, person, event, statement, law).
 * - Distinguishes explicit citations from scholarly inferences and contested hypotheses.
 * - Prevents circular citation amplification by tracking provenance and certainty tiers.
 */
export const researchCorrelation: QlModelDefinition = {
  name: "research.correlation",
  description: "Relasi korelasi dan keterhubungan antar-entitas riset dan korpus (MW-1232).",
  tableName: "research_correlation",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    source_entity_type: { type: "char", required: true, maxLength: 64 },
    source_entity_id: { type: "char", required: true, maxLength: 80 },
    target_entity_type: { type: "char", required: true, maxLength: 64 },
    target_entity_id: { type: "char", required: true, maxLength: 80 },
    correlation_type: {
      type: "char",
      required: true,
      maxLength: 32,
      options: CORRELATION_TYPES,
      validator(value) {
        return CORRELATION_TYPES.some((t) => t === value)
          ? undefined
          : `correlation_type must be one of ${CORRELATION_TYPES.join(", ")}.`;
      },
    },
    certainty: {
      type: "char",
      required: true,
      maxLength: 32,
      options: CORRELATION_CERTAINTIES,
      validator(value) {
        return CORRELATION_CERTAINTIES.some((c) => c === value)
          ? undefined
          : `certainty must be one of ${CORRELATION_CERTAINTIES.join(", ")}.`;
      },
    },
    scholarly_rationale: { type: "text", maxLength: 4000 },
    contestation_notes: { type: "text", maxLength: 2000 },
  },
};
