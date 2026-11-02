import type { QlModelDefinition } from "ql_orm";

export const chatCitationVerification: QlModelDefinition = {
  name: "chat.citation_verification",
  description: "Log verifikasi kutipan ayat Qur'an dan pelindung halusinasi.",
  tableName: "chat_citation_verifications",
  ownerField: "owner_id",
  fields: {
    message_id: { type: "char", required: true, maxLength: 64 },
    surah: { type: "integer", required: true, minValue: 0, maxValue: 999 },
    ayah: { type: "integer", required: true, minValue: 0, maxValue: 9999 },
    claimed_text: { type: "text", required: false, maxLength: 4000 },
    verification_status: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ["verified", "unverified"],
      default: "verified",
    },
    owner_id: { type: "char", required: true, maxLength: 64, private: true },
    created_at: { type: "datetime", required: true },
  },
};
