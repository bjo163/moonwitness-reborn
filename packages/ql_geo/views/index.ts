import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "res.country.list",
    model: "res.country",
    type: "list",
    fields: ["code", "name"],
  },
  {
    name: "res.country.form",
    model: "res.country",
    type: "form",
    fields: ["code", "name"],
  },
];
