/**
 * Canonical vocabularies for `ql_workflow`. The scalar unions live here so
 * models, validators, the state machine, and the API handler all agree on
 * the exact spelling of a state or action.
 *
 * These unions are **deliberately not** promoted to `@moonwitness/types`
 * yet — per MW-ADR-015 the shared kernel requires a proven 3-site
 * duplication threshold, and this vocabulary currently has exactly two
 * consumers (`ql_workflow` itself + `@moonwitness/moonclient` DTO). Promote
 * when a second review-bearing addon (e.g. `source.review`) appears.
 *
 * The state set mirrors `https://github.com/bjo163/moonwitness-reborn/wiki/docs-workflows-WORKFLOW_AND_PUBLISHING_SPECIFICATION`
 * verbatim; adding or renaming a state requires updating that spec first.
 */

export const REVIEW_STATES = [
  "draft",
  "submitted",
  "in_review",
  "changes_requested",
  "approved",
  "rejected",
  "withdrawn",
  "superseded",
  "published",
] as const;

export type ReviewState = (typeof REVIEW_STATES)[number];

export const TRANSITION_ACTIONS = [
  "submit",
  "start_review",
  "request_changes",
  "approve",
  "reject",
  "withdraw",
  "publish",
  "supersede",
] as const;

export type TransitionAction = (typeof TRANSITION_ACTIONS)[number];

/** Terminal states — no outgoing transitions are permitted. */
export const TERMINAL_STATES: readonly ReviewState[] = [
  "rejected",
  "withdrawn",
  "superseded",
];

/** PM task status enum, kept separate from the CAB `ReviewState` machine. */
export const TASK_STATUSES = ["open", "doing", "blocked", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** `workflow.project.state` values (PM project archive toggle). */
export const PROJECT_STATES = ["active", "archived"] as const;
export type ProjectState = (typeof PROJECT_STATES)[number];

/** Priority band for `workflow.task` (0 = lowest, 9 = highest). */
export const TASK_PRIORITY_MIN = 0;
export const TASK_PRIORITY_MAX = 9;

/** Urgency band for `workflow.change` — mirrors `TASK_STATUSES` granularity. */
export const CHANGE_URGENCIES = ["low", "medium", "high", "critical"] as const;
export type ChangeUrgency = (typeof CHANGE_URGENCIES)[number];

/** Default values used by the service when creating records. */
export const DEFAULT_REVIEW_STATE: ReviewState = "draft";
export const DEFAULT_CHANGE_REVISION = 1;
