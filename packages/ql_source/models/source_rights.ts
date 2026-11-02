import type { QlModelDefinition } from "ql_orm";
import { enumValidator } from "../services/field-validators.js";
import {
  DEFAULT_RIGHTS_STATUS,
  RIGHTS_ACTIONS,
  RIGHTS_STATUSES,
} from "../services/source-vocabulary.js";

/**
 * `source.rights` — the rights decision for a **specific action** against a
 * specific `source.version`. The composite `rights_key` =
 * `<version_id>|<action>` is stored as a unique column so the reader's
 * per-action rights gate is a single indexed lookup, not a scan (QlOrm has
 * no composite indexes; see `packages/ql-orm/src/index.ts:519`).
 *
 * `rights_status` defaults to `"unknown"` — deny-by-default
 * (`DATA_LIFECYCLE_AND_PROVENANCE.md:27`). `reader-service` treats any
 * non-`"cleared"` status as a hard block; `publishEdition` treats it as a
 * `QlConflictError`. The manifest declares `write:false, unlink:false` on
 * this model for **every** group, so a status flip is only reachable via
 * `services/source-service.upsertRights(...)`, which additionally appends a
 * `source.provenance` audit row so the decision itself is on the record.
 *
 * `license_evidence_ref` and `verified_by_id` are `private:true`. The former
 * is a locator (path or URL) to the licence evidence bundle kept off-repo;
 * it must never appear in a DTO, log line, or metadata response.
 */
export const sourceRights: QlModelDefinition = {
  name: "source.rights",
  description:
    "Keputusan rights untuk satu aksi spesifik terhadap satu versi sumber; deny-by-default.",
  tableName: "source_rights",
  ownerField: "owner_id",
  fields: {
    version_id: { type: "char", required: true, maxLength: 64 },
    rights_key: { type: "char", required: true, unique: true, maxLength: 180 },
    action: {
      type: "char",
      required: true,
      maxLength: 16,
      validator: enumValidator("action", RIGHTS_ACTIONS),
    },
    rights_status: {
      type: "char",
      required: true,
      maxLength: 16,
      default: DEFAULT_RIGHTS_STATUS,
      validator: enumValidator("rights_status", RIGHTS_STATUSES),
    },
    license_id: { type: "char", maxLength: 120 },
    license_text: { type: "text", maxLength: 4000 },
    attribution_required: { type: "boolean", required: true, default: true },
    attribution_text: { type: "text", required: true, maxLength: 4000 },
    territory: { type: "char", maxLength: 80 },
    term_ends_at: { type: "datetime" },
    verified_by_id: { type: "char", private: true },
    verified_at: { type: "datetime" },
    license_evidence_ref: { type: "char", maxLength: 500, private: true },
    basis_notes: { type: "text", maxLength: 4000 },
    owner_id: { type: "char", required: true, private: true },
  },
};
