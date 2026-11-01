import type { QlModelDefinition } from "ql_orm";
import { enumValidator } from "../services/field-validators.js";

const verifyStatuses = ["unverified", "ok", "invalid", "network", "missing"];
const syncStatuses = ["ok", "partial", "error"];
const tokenSources = ["unresolved", "env", "keychain", "config_file"];

export const integrationConnector: QlModelDefinition = {
  name: "integration.connector",
  description:
    "Konektor layanan eksternal; kredensialnya tinggal di OS credential store, tidak di sini.",
  tableName: "integration_connector",
  ownerField: "owner_id",
  fields: {
    kind: {
      type: "char",
      required: true,
      maxLength: 40,
      validator: (value) =>
        typeof value === "string" && /^[a-z][a-z0-9_]{2,39}$/.test(value)
          ? undefined
          : "Field 'kind' must be a lowercase connector identifier.",
    },
    label: { type: "char", required: true, maxLength: 80 },
    token_source: {
      type: "char",
      required: true,
      default: "unresolved",
      maxLength: 16,
      validator: enumValidator("token_source", tokenSources),
    },
    token_ref: { type: "char", maxLength: 200 },
    enabled: { type: "boolean", required: true, default: true },
    verify_status: {
      type: "char",
      required: true,
      default: "unverified",
      maxLength: 16,
      validator: enumValidator("verify_status", verifyStatuses),
    },
    last_verify_at: { type: "datetime" },
    last_sync_at: { type: "datetime" },
    last_sync_status: {
      type: "char",
      maxLength: 16,
      validator: enumValidator("last_sync_status", syncStatuses),
    },
    owner_id: { type: "char", required: true, private: true },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
