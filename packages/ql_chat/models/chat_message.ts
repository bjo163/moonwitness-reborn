import type { QlModelDefinition } from "ql_orm";

export const CHAT_GROUNDING_STATUSES = [
  "grounded",
  "insufficient_evidence",
  "legacy",
] as const;

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
    grounding_status: {
      type: "char",
      maxLength: 24,
      options: CHAT_GROUNDING_STATUSES,
      validator: (value) =>
        value === undefined ||
        CHAT_GROUNDING_STATUSES.some((status) => status === value)
          ? undefined
          : "Message grounding status is invalid.",
      private: true,
    },
    created_at: { type: "datetime", required: true },
  },
};
