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
    fields: ["title"],
  },
  {
    name: "chat.conversation.landing",
    model: "chat.conversation",
    type: "landing",
    fields: ["title", "updated_at"],
    landing: {
      section: "foundation",
      sequence: 10,
      href: "/command-center/chat",
      status: "available",
      titleKey: "web.landing.views.chat_conversation.title",
      descriptionKey: "web.landing.views.chat_conversation.description",
    },
  },
];
