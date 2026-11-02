import type { QlModelDefinition } from "ql_orm";

export const DEED_KINDS = [
  "typo_correction",
  "translation_review",
  "reference_verification",
  "annotation_audit",
] as const;

export const communityBeneficialDeed: QlModelDefinition = {
  name: "community.beneficial_deed",
  description: "Non-gamified transparent ledger of verified beneficial deeds.",
  tableName: "community_beneficial_deed",
  fields: {
    deed_kind: {
      type: "char",
      required: true,
      maxLength: 32,
      options: DEED_KINDS,
    },
    target_model: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    target_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    summary: {
      type: "char",
      required: true,
      maxLength: 255,
    },
    proof_hash: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    is_anonymous: {
      type: "boolean",
      required: true,
      default: false,
    },
    contributor_id: {
      type: "char",
      required: true,
      maxLength: 64,
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
