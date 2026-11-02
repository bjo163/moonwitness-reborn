import type { QlModelDefinition } from "ql_orm";
import { enumValidator } from "../services/field-validators.js";
import {
  TASK_PRIORITY_MAX,
  TASK_PRIORITY_MIN,
  TASK_STATUSES,
} from "../services/workflow-vocabulary.js";

/**
 * `workflow.task` — the ordinary PM tracker item. Kept deliberately simple
 * (single owner, one project reference, one status) so the whole model can
 * render through the existing view-driven `/models` workspace with zero new
 * UI code. Cross-user visibility or assignee semantics are out of MVP scope
 * (see MW-ADR-017 Deferred list).
 */
export const workflowTask: QlModelDefinition = {
  name: "workflow.task",
  description:
    "Item pelacak proyek milik satu pengguna; terhubung ke `workflow.project` via `project_id`.",
  tableName: "workflow_task",
  ownerField: "owner_id",
  fields: {
    project_id: { type: "char", maxLength: 64 },
    title: { type: "char", required: true, maxLength: 200 },
    notes: { type: "text", maxLength: 4000 },
    status: {
      type: "char",
      required: true,
      default: "open",
      maxLength: 12,
      options: TASK_STATUSES,
      validator: enumValidator("status", TASK_STATUSES),
    },
    priority: {
      type: "integer",
      default: TASK_PRIORITY_MIN,
      minValue: TASK_PRIORITY_MIN,
      maxValue: TASK_PRIORITY_MAX,
    },
    due_at: { type: "datetime" },
    owner_id: { type: "char", required: true, private: true },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
