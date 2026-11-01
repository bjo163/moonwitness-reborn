import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "chat.conversation.list",
    model: "chat.conversation",
    type: "list",
    fields: ["title", "created_at", "updated_at"],
  },
  {
    name: "chat.conversation.form",
    model: "chat.conversation",
    type: "form",
    fields: ["title", "created_at", "updated_at"],
  },
];
