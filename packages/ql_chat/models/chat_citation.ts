import type { QlModelDefinition } from "ql_orm";

export const chatCitation: QlModelDefinition = {
  name: "chat.citation",
  description: "Referensi corpus yang dikutip oleh pesan assistant.",
  tableName: "chat_citation",
  ownerField: "owner_id",
  fields: {
    owner_id: { type: "char", required: true, maxLength: 64, private: true },
    conversation_id: {
      type: "char",
      required: true,
      maxLength: 64,
      private: true,
    },
    message_id: { type: "char", required: true, maxLength: 64, private: true },
    evidence_id: { type: "char", required: true, maxLength: 64, private: true },
    edition_id: { type: "char", required: true, maxLength: 64, private: true },
    edition_key: {
      type: "char",
      required: true,
      maxLength: 160,
      private: true,
    },
    surah: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 114,
      private: true,
    },
    ayah: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 286,
      private: true,
    },
    created_at: { type: "datetime", required: true, private: true },
    updated_at: { type: "datetime", required: true, private: true },
  },
};
