import type { QlModelDefinition } from "ql_orm";
import { validateProviderBaseUrl } from "../services/provider-config.js";

export const aiProvider: QlModelDefinition = {
  name: "ai.provider",
  description: "Endpoint model dan prioritas fallback milik pengguna.",
  tableName: "ai_provider",
  ownerField: "owner_id",
  fields: {
    name: { type: "char", required: true, maxLength: 80 },
    base_url: {
      type: "char",
      required: true,
      maxLength: 300,
      validator: validateProviderBaseUrl,
    },
    model: { type: "char", required: true, maxLength: 120 },
    encrypted_api_key: {
      type: "text",
      required: true,
      maxLength: 8192,
      private: true,
    },
    priority: {
      type: "integer",
      required: true,
      default: 0,
      minValue: 0,
      maxValue: 1000,
    },
    enabled: { type: "boolean", required: true, default: true },
    owner_id: { type: "char", required: true, private: true },
  },
};
