import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "i18n.language.list",
    model: "i18n.language",
    type: "list",
    fields: ["code", "label", "enabled", "direction", "is_default"],
  },
  {
    name: "i18n.translation.list",
    model: "i18n.translation",
    type: "list",
    fields: [
      "namespace",
      "message_key",
      "locale",
      "source_text",
      "translated_text",
      "status",
      "draft_source",
      "updated_at",
    ],
  },
  {
    name: "i18n.translation.form",
    model: "i18n.translation",
    type: "form",
    fields: [
      "namespace",
      "message_key",
      "locale",
      "source_text",
      "context",
      "translated_text",
      "status",
      "draft_source",
    ],
  },
];
