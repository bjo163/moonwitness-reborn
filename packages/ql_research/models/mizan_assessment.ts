import type { QlModelDefinition } from "ql_orm";

/**
 * Valid MIZAN assessment dimensions/rubrics (MWREQ-00651..MWREQ-00667).
 */
export const MIZAN_DIMENSIONS = [
  "isnad_authenticity",
  "matn_coherence",
  "historical_corroboration",
  "theological_orthodoxy",
  "jurisprudential_utility",
  "ethical_weight",
] as const;

export type MizanDimension = (typeof MIZAN_DIMENSIONS)[number];

/**
 * Valid overall verdict / balance tiers.
 */
export const MIZAN_BALANCE_TIERS = [
  "mutawatir_conclusive",
  "sahih_rigorous",
  "hasan_sound",
  "daif_weak",
  "mawdu_fabricated",
  "contested_uncertain",
] as const;

export type MizanBalanceTier = (typeof MIZAN_BALANCE_TIERS)[number];

/**
 * `mizan.assessment` — Comprehensive multidimensional research balance & assessment (MW-1231).
 *
 * Implements MWREQ-00651 through MWREQ-00667:
 * - Versioned evaluation rubric (MIZAN balance framework).
 * - Multi-criteria scoring with transparent weights.
 * - Explanatory notes on consensus versus contestation.
 * - Explicit epistemic accountability without subjective bias.
 */
export const mizanAssessment: QlModelDefinition = {
  name: "mizan.assessment",
  description: "Asesmen neraca kritis multidimensi MIZAN (MW-1231).",
  tableName: "mizan_assessment",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    target_entity_type: { type: "char", required: true, maxLength: 64 },
    target_entity_id: { type: "char", required: true, maxLength: 80 },
    rubric_version: { type: "char", required: true, maxLength: 32 },
    primary_dimension: {
      type: "char",
      required: true,
      maxLength: 32,
      validator(value) {
        return MIZAN_DIMENSIONS.some((d) => d === value)
          ? undefined
          : `primary_dimension must be one of ${MIZAN_DIMENSIONS.join(", ")}.`;
      },
    },
    balance_tier: {
      type: "char",
      required: true,
      maxLength: 32,
      validator(value) {
        return MIZAN_BALANCE_TIERS.some((t) => t === value)
          ? undefined
          : `balance_tier must be one of ${MIZAN_BALANCE_TIERS.join(", ")}.`;
      },
    },
    weight_score: { type: "integer", required: true },
    evaluator_context: { type: "char", maxLength: 200 },
    rationalization: { type: "text", maxLength: 4000 },
    contestation_notes: { type: "text", maxLength: 2000 },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
