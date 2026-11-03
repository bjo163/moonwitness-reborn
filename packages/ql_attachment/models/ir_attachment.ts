import type { QlModelDefinition } from "ql_orm";
import {
  ATTACHMENT_KINDS,
  ATTACHMENT_STATES,
  MAX_ATTACHMENT_BYTES,
  SHA256_HEX,
} from "../services/attachment-vocabulary.js";

function oneOf(values: readonly string[], label: string) {
  return (value: unknown): string | undefined =>
    typeof value === "string" && values.includes(value)
      ? undefined
      : `Field '${label}' must be one of: ${values.join(", ")}.`;
}

export const irAttachment: QlModelDefinition = {
  name: "ir.attachment",
  description:
    "Metadata lampiran milik pengguna; byte-nya hidup di storage driver, bukan di kolom.",
  tableName: "ir_attachment",
  ownerField: "owner_id",
  fields: {
    name: { type: "char", required: true, maxLength: 240 },
    kind: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ATTACHMENT_KINDS,
      validator: oneOf(ATTACHMENT_KINDS, "kind"),
    },
    mime_type: { type: "char", required: true, maxLength: 120 },
    size_bytes: {
      type: "integer",
      required: true,
      minValue: 0,
      maxValue: MAX_ATTACHMENT_BYTES,
    },
    // Server-computed while assembling, so an in-flight row legitimately has
    // no digest yet. Serving code must treat a missing digest as not ready.
    sha256: {
      type: "char",
      maxLength: 64,
      validator: (value) =>
        typeof value === "string" && SHA256_HEX.test(value)
          ? undefined
          : "Field 'sha256' must be 64 lowercase hex characters.",
    },
    state: {
      type: "char",
      required: true,
      maxLength: 16,
      default: "uploading",
      options: ATTACHMENT_STATES,
      validator: oneOf(ATTACHMENT_STATES, "state"),
    },
    driver: { type: "char", required: true, maxLength: 40 },
    // Server-only location. Private keeps it out of SELECT lists, records,
    // metadata responses, and logs.
    storage_key: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 200,
      private: true,
    },
    parent_model: { type: "char", maxLength: 120 },
    parent_record_id: { type: "char", maxLength: 120 },
    owner_id: { type: "char", required: true, private: true },
    uploaded_at: { type: "datetime" },
  },
};
