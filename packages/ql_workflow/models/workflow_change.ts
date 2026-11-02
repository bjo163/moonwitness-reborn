import type { QlModelDefinition } from "ql_orm";
import { enumValidator } from "../services/field-validators.js";
import {
  CHANGE_URGENCIES,
  DEFAULT_CHANGE_REVISION,
  DEFAULT_REVIEW_STATE,
  REVIEW_STATES,
} from "../services/workflow-vocabulary.js";

/**
 * `workflow.change` — the CAB (Change Advisory Board) change request.
 *
 * Bypass lockdown: the manifest's ACL sets `write:false, create:false` for
 * **every** group on this model. `state` therefore cannot be mutated through
 * the generic `/models/workflow.change` PATCH handler; every transition must
 * run through `ql_workflow/services/workflow-service.ts`, which uses
 * `orm.updateRecordsForService` (bypasses ACL but not the guard rules) and
 * appends a matching `workflow.transition` row.
 *
 * `state` is intentionally omitted from the `workflow.change.form` view so
 * the view-driven workspace UI does not render an editable dropdown that the
 * server would reject.
 */
export const workflowChange: QlModelDefinition = {
  name: "workflow.change",
  description:
    "Change request CAB: satu perubahan yang diusulkan, direview, dan diputuskan oleh board.",
  tableName: "workflow_change",
  ownerField: "owner_id",
  fields: {
    title: { type: "char", required: true, maxLength: 200 },
    body: { type: "text", maxLength: 8000 },
    subject_type: { type: "char", maxLength: 64 },
    subject_id: { type: "char", maxLength: 64 },
    state: {
      type: "char",
      required: true,
      default: DEFAULT_REVIEW_STATE,
      maxLength: 24,
      options: REVIEW_STATES,
      validator: enumValidator("state", REVIEW_STATES),
    },
    urgency: {
      type: "char",
      required: true,
      default: "medium",
      maxLength: 12,
      options: CHANGE_URGENCIES,
      validator: enumValidator("urgency", CHANGE_URGENCIES),
    },
    revision: {
      type: "integer",
      required: true,
      default: DEFAULT_CHANGE_REVISION,
      minValue: 1,
    },
    ethics_affirmed_at: { type: "datetime", required: false },
    ethics_digest: { type: "char", required: false, maxLength: 64 },
    is_not_fatwa_affirmed: { type: "boolean", required: false, default: false },
    owner_id: { type: "char", required: true, private: true },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
