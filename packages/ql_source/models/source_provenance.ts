import type { QlModelDefinition } from "ql_orm";
import { enumValidator } from "../services/field-validators.js";
import { ENTITY_REF_TYPES } from "../services/source-vocabulary.js";

/**
 * `source.provenance` — the append-only lifecycle/decision ledger that
 * `DATA_LIFECYCLE_AND_PROVENANCE.md:14` demands: every transition records
 * actor/service, timestamp, input version, decision, reason and correlation
 * ID. **No transition silently overwrites the original.**
 *
 * Structural enforcement: the manifest declares
 * `write:false, create:false, unlink:false` for **every** group on this model
 * (mirroring `packages/ql_workflow/models/workflow_transition.ts` — same
 * rationale: an audit row must never be mutated or erased through the
 * generic `/models/:model` PATCH/DELETE handler). Only
 * `orm.createRecordForService` inside a service path can append a row.
 *
 * `actor_id` is `private:true`: it is preserved in the DB so an admin can
 * audit who signed off a rights decision, but never surfaces in a DTO,
 * response body, or metadata (AGENTS.md §"Field rahasia wajib private").
 */
export const sourceProvenance: QlModelDefinition = {
  name: "source.provenance",
  description:
    "Ledger append-only setiap transisi lifecycle/keputusan atas sumber dan korpus.",
  tableName: "source_provenance",
  // Intentionally no `ownerField` — the audit trail is a shared ledger read
  // by reviewer groups via `findManyByService`; per-user filtering would let
  // one reviewer hide an action from another. Access is instead controlled
  // entirely by the ACL (read-only for authenticated groups, no write).
  fields: {
    subject_type: {
      type: "char",
      required: true,
      maxLength: 64,
      options: ENTITY_REF_TYPES,
      validator: enumValidator("subject_type", ENTITY_REF_TYPES),
    },
    subject_id: { type: "char", required: true, maxLength: 64 },
    // `from_stage` and `to_stage` are the free-form ledger of stage names —
    // the source lifecycle (LIFECYCLE_STAGES), the rights status set
    // (RIGHTS_STATUSES), and any downstream addon's own stage vocabulary
    // (e.g. `ql_corpus` CORPUS_STAGES) all flow through this table by design.
    // Cross-set validation is done by each addon's service, not here, so a
    // QlOrm single-value validator (which cannot see the sibling
    // `subject_type`) is intentionally absent from these two fields.
    from_stage: { type: "char", maxLength: 24 },
    to_stage: { type: "char", required: true, maxLength: 24 },
    action: { type: "char", required: true, maxLength: 48 },
    decision: { type: "char", maxLength: 24 },
    reason: { type: "text", maxLength: 4000 },
    correlation_id: { type: "char", required: true, maxLength: 64 },
    input_version_id: { type: "char", maxLength: 64 },
    input_checksum: { type: "char", maxLength: 64 },
    output_checksum: { type: "char", maxLength: 64 },
    actor_id: { type: "char", required: true, private: true },
    occurred_at: { type: "datetime", required: true },
  },
};
