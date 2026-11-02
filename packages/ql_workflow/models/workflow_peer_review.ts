import type { QlModelDefinition } from "ql_orm";

export const PEER_REVIEW_DECISIONS = ["approved", "changes_requested"] as const;

export const workflowPeerReview: QlModelDefinition = {
  name: "workflow.peer_review",
  description: "Scholarly peer review record in the Sanad verification pipeline.",
  tableName: "workflow_peer_review",
  ownerField: "reviewer_id",
  fields: {
    change_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    decision: {
      type: "char",
      required: true,
      maxLength: 32,
      options: PEER_REVIEW_DECISIONS,
      validator(value) {
        return PEER_REVIEW_DECISIONS.includes(
          value as (typeof PEER_REVIEW_DECISIONS)[number],
        )
          ? undefined
          : `decision must be one of: ${PEER_REVIEW_DECISIONS.join(", ")}`;
      },
    },
    notes: {
      type: "text",
      required: true,
      maxLength: 8000,
    },
    sanad_chain_ref: {
      type: "char",
      required: true,
      maxLength: 160,
    },
    reviewer_id: {
      type: "char",
      required: true,
      maxLength: 64,
      private: true,
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
