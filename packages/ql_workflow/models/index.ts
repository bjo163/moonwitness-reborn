import type { QlModelDefinition } from "ql_orm";
import { workflowChange } from "./workflow_change.js";
import { workflowProject } from "./workflow_project.js";
import { workflowTask } from "./workflow_task.js";
import { workflowTransition } from "./workflow_transition.js";

export const models: QlModelDefinition[] = [
  workflowProject,
  workflowTask,
  workflowChange,
  workflowTransition,
];
