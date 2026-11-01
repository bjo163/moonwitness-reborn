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
];
