import type { QlModelDefinition } from "ql_orm";
import { enumValidator } from "../services/field-validators.js";

const actions = [
  "create",
  "update",
  "delete",
  "sync",
  "verify",
  "delete_connector",
];

export const integrationAudit: QlModelDefinition = {
  name: "integration.audit",
  description: "Jejak append-only untuk setiap aksi pada konektor eksternal.",
  tableName: "integration_audit",
  ownerField: "owner_id",
  softDelete: false,
  fields: {
    connector_id: { type: "char", required: true, maxLength: 64 },
    zone_id: { type: "char", maxLength: 64 },
    record_id: { type: "char", maxLength: 64 },
    action: {
      type: "char",
      required: true,
      maxLength: 24,
      validator: enumValidator("action", actions),
    },
    target: { type: "char", required: true, maxLength: 253 },
    outcome: {
      type: "char",
      required: true,
      default: "ok",
      maxLength: 12,
      validator: enumValidator("outcome", ["ok", "error"]),
    },
    detail: { type: "text", maxLength: 4000 },
    error_code: { type: "char", maxLength: 24 },
    error_message: { type: "char", maxLength: 500 },
    owner_id: { type: "char", required: true, private: true },
  },
};
