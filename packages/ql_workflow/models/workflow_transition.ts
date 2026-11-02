import type { QlModelDefinition } from "ql_orm";
import { enumValidator } from "../services/field-validators.js";
import {
  REVIEW_STATES,
  TRANSITION_ACTIONS,
} from "../services/workflow-vocabulary.js";

/**
 * `workflow.transition` — the immutable audit trail for every CAB state
 * change. Mirrors the pattern of `integration.audit`: one row per accepted
 * transition, appended by the service in the same call as the state update.
 *
 * The manifest declares `read:true` and every other operation `false` for
 * **every** group, so the generic `/models/workflow.transition` PATCH/POST/
 * DELETE handlers structurally cannot mutate or erase history. Only
 * `ql_workflow/services/workflow-service.ts` inserts rows, via
 * `orm.createRecordForService`.
 *
 * `owner_id` matches the change's owner so the per-owner isolation in
 * `orm.findMany` keeps a member's transition list scoped to their own
 * changes; admins and operators read cross-owner via the queue handler's
 * `findManyByService` path.
 */
export const workflowTransition: QlModelDefinition = {
  name: "workflow.transition",
  description:
    "Jejak append-only setiap transisi state pada workflow.change; tidak dapat diubah atau dihapus.",
  tableName: "workflow_transition",
  ownerField: "owner_id",
  fields: {
    change_id: { type: "char", required: true, maxLength: 64 },
    from_state: {
      type: "char",
      required: true,
      maxLength: 24,
      options: REVIEW_STATES,
      validator: enumValidator("from_state", REVIEW_STATES),
    },
    to_state: {
      type: "char",
      required: true,
      maxLength: 24,
      options: REVIEW_STATES,
      validator: enumValidator("to_state", REVIEW_STATES),
    },
    action: {
      type: "char",
      required: true,
      maxLength: 24,
      options: TRANSITION_ACTIONS,
      validator: enumValidator("action", TRANSITION_ACTIONS),
    },
    reason: { type: "text", maxLength: 4000 },
    revision: { type: "integer", required: true, minValue: 1 },
    actor_id: { type: "char", required: true, private: true },
    owner_id: { type: "char", required: true, private: true },
    created_at: { type: "datetime", required: true },
  },
};
