import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "research.lexical_review.list",
    model: "research.lexical_review",
    type: "list",
    fields: [
      "candidate_id",
      "edition_key",
      "source_version_id",
      "decision",
      "rationale",
      "reviewed_at",
    ],
  },
];
