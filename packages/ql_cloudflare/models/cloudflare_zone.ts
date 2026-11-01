import type { QlModelDefinition } from "ql_orm";

export const cloudflareZone: QlModelDefinition = {
  name: "cloudflare.zone",
  description: "Mirror zone Cloudflare milik konektor seorang pengguna.",
  tableName: "cloudflare_zone",
  ownerField: "owner_id",
  fields: {
    connector_id: { type: "char", required: true, maxLength: 64 },
    external_id: { type: "char", required: true, maxLength: 64 },
    name: { type: "char", required: true, maxLength: 253 },
    account_id: { type: "char", maxLength: 64 },
    status: { type: "char", required: true, default: "pending", maxLength: 32 },
    paused: { type: "boolean", required: true, default: false },
    stale: { type: "boolean", required: true, default: false },
    last_sync_at: { type: "datetime" },
    owner_id: { type: "char", required: true, private: true },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
