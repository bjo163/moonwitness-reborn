import type { QlModelDefinition } from "ql_orm";

export const chatMessage: QlModelDefinition = {
  name: "chat.message",
  description: "Pesan berurutan dalam percakapan.",
  tableName: "messages",
  fields: {
    conversation_id: { type: "char", required: true },
    role: {
      type: "char",
      required: true,
      maxLength: 9,
      validator: (value) =>
        value === "user" || value === "assistant"
          ? undefined
          : "Message role must be user or assistant.",
    },
    content: { type: "text", required: true, maxLength: 16_000 },
    created_at: { type: "datetime", required: true },
  },
};
