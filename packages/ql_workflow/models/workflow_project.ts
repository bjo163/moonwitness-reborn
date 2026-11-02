import type { QlModelDefinition } from "ql_orm";
import { enumValidator } from "../services/field-validators.js";
import { PROJECT_STATES } from "../services/workflow-vocabulary.js";

/**
 * `workflow.project` — PM container that groups `workflow.task` rows.
 *
 * Owner-scoped: a member sees only their own projects (enforced by
 * `ownerField: "owner_id"` in QlOrm). `admin`/`root` may read all projects
 * via the service path (server-side listing), not by widening ACL.
 *
 * No state machine here — `state` is a simple active/archived toggle so
 * finished projects can be filtered out of the default list without losing
 * history. Publication review state is owned by `workflow.change`.
 */
export const workflowProject: QlModelDefinition = {
  name: "workflow.project",
  description:
    "Wadah pelacak proyek PM; mengelompokkan task dan menyimpan metadata dasar.",
  tableName: "workflow_project",
  ownerField: "owner_id",
  fields: {
    title: { type: "char", required: true, maxLength: 120 },
    description: { type: "text", maxLength: 4000 },
    state: {
      type: "char",
      required: true,
      default: "active",
      maxLength: 16,
      validator: enumValidator("state", PROJECT_STATES),
    },
    owner_id: { type: "char", required: true, private: true },
  },
};
