import type { QlModelDefinition } from "ql_orm";

export const LEXICAL_REVIEW_DECISIONS = [
  "retain_for_research",
  "exclude_from_research",
  "needs_expert_review",
] as const;

export const researchLexicalReview: QlModelDefinition = {
  name: "research.lexical_review",
  description:
    "Append-only human assessment of an exploratory lexical-frequency result, pinned to a source and method snapshot.",
  tableName: "research_lexical_review",
  softDelete: false,
  fields: {
    candidate_id: { type: "char", required: true, maxLength: 64 },
    edition_key: { type: "char", required: true, maxLength: 160 },
    source_version_id: { type: "char", required: true, maxLength: 64 },
    normalization_version: { type: "char", required: true, maxLength: 80 },
    algorithm_version: { type: "char", required: true, maxLength: 80 },
    occurrence_count: { type: "integer", required: true, minValue: 1 },
    verse_reference_count: { type: "integer", required: true, minValue: 1 },
    source_references: { type: "text", required: true, maxLength: 16_000 },
    source_reference_digest: { type: "char", required: true, maxLength: 64 },
    decision: {
      type: "char",
      required: true,
      maxLength: 32,
      validator(value) {
        return LEXICAL_REVIEW_DECISIONS.some((decision) => decision === value)
          ? undefined
          : `decision must be one of ${LEXICAL_REVIEW_DECISIONS.join(", ")}.`;
      },
    },
    rationale: { type: "text", required: true, maxLength: 4000 },
    reviewer_id: { type: "char", required: true, maxLength: 64, private: true },
    reviewed_at: { type: "datetime", required: true },
  },
};
