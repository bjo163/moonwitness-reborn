import type { QlModelDefinition } from "ql_orm";
import {
  MAX_ATTACHMENT_BYTES,
  SHA256_HEX,
  UPLOAD_STATES,
} from "../services/attachment-vocabulary.js";

export const irAttachmentUpload: QlModelDefinition = {
  name: "ir.attachment.upload",
  description:
    "Sesi upload bertahap yang bisa dilanjutkan; tidak punya view dan tidak punya ACL.",
  tableName: "ir_attachment_upload",
  ownerField: "owner_id",
  fields: {
    attachment_id: { type: "char", required: true, maxLength: 120 },
    state: {
      type: "char",
      required: true,
      maxLength: 16,
      default: "open",
      options: UPLOAD_STATES,
      validator: (value) =>
        typeof value === "string" && (UPLOAD_STATES as readonly string[]).includes(value)
          ? undefined
          : `Field 'state' must be one of: ${UPLOAD_STATES.join(", ")}.`,
    },
    chunk_size: { type: "integer", required: true, minValue: 1 },
    total_chunks: {
      type: "integer",
      required: true,
      minValue: 0,
      maxValue: 20000,
    },
    expected_bytes: {
      type: "integer",
      required: true,
      minValue: 0,
      maxValue: MAX_ATTACHMENT_BYTES,
    },
    // Optional client claim, verified only when present. The stored digest on
    // ir.attachment is always the one the server computed.
    declared_sha256: {
      type: "char",
      maxLength: 64,
      validator: (value) =>
        typeof value === "string" && SHA256_HEX.test(value)
          ? undefined
          : "Field 'declared_sha256' must be 64 lowercase hex characters.",
    },
    expires_at: { type: "datetime", required: true },
    owner_id: { type: "char", required: true, private: true },
  },
};
