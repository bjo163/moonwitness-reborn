import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "ir.attachment.list",
    model: "ir.attachment",
    type: "list",
    fields: ["name", "kind", "mime_type", "size_bytes", "state", "created_at"],
  },
  {
    name: "ir.attachment.form",
    model: "ir.attachment",
    type: "form",
    fields: [
      "name",
      "kind",
      "mime_type",
      "size_bytes",
      "sha256",
      "state",
      "parent_model",
      "parent_record_id",
    ],
  },
];
