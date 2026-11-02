import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "res.partner.list",
    model: "res.partner",
    type: "list",
    fields: ["name", "company_name", "email", "phone"],
  },
  {
    name: "res.partner.form",
    model: "res.partner",
    type: "form",
    fields: ["name", "company_name", "email", "phone"],
  },
  {
    name: "community.beneficial_deed.list",
    model: "community.beneficial_deed",
    type: "list",
    fields: ["deed_kind", "summary", "proof_hash", "created_at"],
  },
  {
    name: "community.study_circle.list",
    model: "community.study_circle",
    type: "list",
    fields: ["title", "surah_number", "status", "max_members", "updated_at"],
  },
  {
    name: "community.circle_reflection.list",
    model: "community.circle_reflection",
    type: "list",
    fields: ["circle_id", "passage_locator", "moderation_status", "created_at"],
  },
];

