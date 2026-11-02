import type { QlModelDefinition } from "ql_orm";
import { workflowChange } from "./workflow_change.js";
import { workflowCovenantSignature } from "./workflow_covenant_signature.js";
import { workflowPeerReview } from "./workflow_peer_review.js";
import { workflowProject } from "./workflow_project.js";
import { workflowTask } from "./workflow_task.js";
import { workflowTransition } from "./workflow_transition.js";

export { workflowChange, workflowCovenantSignature, workflowPeerReview, workflowProject, workflowTask, workflowTransition };

export const models: QlModelDefinition[] = [
  workflowProject,
  workflowTask,
  workflowChange,
  workflowTransition,
  workflowCovenantSignature,
  workflowPeerReview,
];
