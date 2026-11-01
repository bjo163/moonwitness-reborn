import type { QlModelDefinition } from "ql_orm";
import { AUTO_TTL, MAX_TTL, RECORD_TYPES } from "../services/record-types.js";

export const cloudflareRecord: QlModelDefinition = {
  name: "cloudflare.record",
  description: "Mirror DNS record Cloudflare milik konektor seorang pengguna.",
  tableName: "cloudflare_record",
  ownerField: "owner_id",
  fields: {
    connector_id: { type: "char", required: true, maxLength: 64 },
    zone_id: { type: "char", required: true, maxLength: 64 },
    external_id: { type: "char", required: true, maxLength: 64 },
    name: { type: "char", required: true, maxLength: 253 },
    type: {
      type: "char",
      required: true,
      maxLength: 20,
      validator: (value) =>
        typeof value === "string" &&
        (RECORD_TYPES as readonly string[]).includes(value.toUpperCase())
          ? undefined
          : `Field 'type' must be one of: ${RECORD_TYPES.join(", ")}.`,
    },
    content: { type: "text", required: true, maxLength: 2048 },
    ttl: {
      type: "integer",
      required: true,
      default: AUTO_TTL,
      minValue: AUTO_TTL,
      maxValue: MAX_TTL,
    },
    proxied: { type: "boolean", required: true, default: false },
    comment: { type: "char", maxLength: 500 },
    managed: { type: "boolean", required: true, default: false },
    remote_created_at: { type: "datetime" },
    stale: { type: "boolean", required: true, default: false },
    last_sync_at: { type: "datetime" },
    owner_id: { type: "char", required: true, private: true },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
