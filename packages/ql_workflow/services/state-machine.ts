import type { ReviewState, TransitionAction } from "./workflow-vocabulary.js";

/**
 * The `ql_workflow` state machine, transcribed 1:1 from
 * `docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md:8-12`:
 *
 * ```
 * DRAFT → SUBMITTED → IN_REVIEW → APPROVED → PUBLISHED
 *                     │              │            │
 *                     ├→ CHANGES_REQUESTED       ├→ WITHDRAWN
 *                     └→ REJECTED                 └→ SUPERSEDED
 * ```
 *
 * Any `(state, action)` pair not listed here is illegal — the service layer
 * throws `QlValidationError`. Terminal states (`rejected`, `withdrawn`,
 * `superseded`, `published` when no further action applies) have no outgoing
 * edges except the ones enumerated below.
 */
const TRANSITIONS: Readonly<
  Record<ReviewState, Partial<Record<TransitionAction, ReviewState>>>
> = {
  draft: { submit: "submitted" },
  submitted: { start_review: "in_review" },
  in_review: {
    approve: "approved",
    request_changes: "changes_requested",
    reject: "rejected",
  },
  changes_requested: { submit: "submitted" },
  approved: { publish: "published", withdraw: "withdrawn" },
  published: { supersede: "superseded", withdraw: "withdrawn" },
  rejected: {},
  withdrawn: {},
  superseded: {},
};

/** Legal (from, action) → to edge, or `null` when the pair is not permitted. */
export function canTransition(
  from: ReviewState,
  action: TransitionAction,
): ReviewState | null {
  return TRANSITIONS[from][action] ?? null;
}

/** Full transition table — exported so tests can iterate every legal edge. */
export const transitionTable = TRANSITIONS;
