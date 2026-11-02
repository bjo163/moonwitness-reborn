import type { QlModelDefinition } from "ql_orm";

export const chatConversation: QlModelDefinition = {
  name: "chat.conversation",
  description: "Percakapan milik pengguna.",
  tableName: "conversations",
  ownerField: "user_id",
  fields: {
    user_id: { type: "char", required: true, private: true },
    title: { type: "char", required: true, maxLength: 120 },
  },
};
