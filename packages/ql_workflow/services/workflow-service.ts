import {
  QlAccessError,
  QlConflictError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
  type QlUserContext,
} from "ql_orm";
import { canTransition } from "./state-machine.js";
import {
  REVIEW_STATES,
  TRANSITION_ACTIONS,
  type ReviewState,
  type TransitionAction,
} from "./workflow-vocabulary.js";

/** Actions that must be performed by a CAB reviewer, never by the submitter. */
const REVIEWER_ONLY_ACTIONS: readonly TransitionAction[] = [
  "start_review",
  "approve",
  "request_changes",
  "reject",
  "publish",
  "withdraw",
  "supersede",
];

/** Actions that only the change owner (submitter) may perform. */
const OWNER_ONLY_ACTIONS: readonly TransitionAction[] = ["submit"];

/**
 * Reviewer actions that must additionally be performed by someone other than
 * the change owner, even if the actor also holds a reviewer group. Mirrors
 * the spec rule "submitter cannot approve their own work" (see
 * `https://github.com/bjo163/moonwitness-reborn/wiki/docs-workflows-WORKFLOW_AND_PUBLISHING_SPECIFICATION`).
 */
const SELF_FORBIDDEN_ACTIONS: readonly TransitionAction[] = [
  "approve",
  "reject",
  "publish",
  "supersede",
];

/** Actions the current reviewer group may execute (must align with API gate). */
const REVIEWER_GROUPS: readonly string[] = ["admin", "operator"];

function isReviewState(value: unknown): value is ReviewState {
  return typeof value === "string" && (REVIEW_STATES as readonly string[]).includes(value);
}

function isTransitionAction(value: unknown): value is TransitionAction {
  return (
    typeof value === "string" &&
    (TRANSITION_ACTIONS as readonly string[]).includes(value)
  );
}

function actorHasReviewerGroup(user: QlUserContext): boolean {
  return user.groups.some((group) => REVIEWER_GROUPS.includes(group));
}

function assertReviewer(user: QlUserContext, action: TransitionAction): void {
  if (!REVIEWER_ONLY_ACTIONS.includes(action)) return;
  if (!actorHasReviewerGroup(user)) {
    // Same error class the API boundary already maps to HTTP 403.
    throw new QlAccessError(
      `Action '${action}' requires one of the reviewer groups: ${REVIEWER_GROUPS.join(", ")}.`,
    );
  }
}

function assertOwner(
  user: QlUserContext,
  action: TransitionAction,
  owner: string,
): void {
  if (!OWNER_ONLY_ACTIONS.includes(action)) return;
  if (user.id !== owner) {
    throw new QlAccessError(
      `Action '${action}' may only be performed by the change owner.`,
    );
  }
}

export interface TransitionResult {
  readonly change: QlRecord;
  readonly transition: QlRecord;
}

/**
 * Applies one CAB transition. The state machine table (from
 * `services/state-machine.ts`) is the sole authority on which edges are
 * legal; every rejection surfaces as an existing `ql_orm` error type so the
 * API boundary can translate it without a new error class.
 *
 * The workflow sequence is intentionally:
 *   1. read the change (service path, sees `owner_id` + `state`)
 *   2. validate the machine edge
 *   3. validate the actor guard (self-approval blocked)
 *   4. bump `state`/`revision`/`updated_at` via the service write path
 *   5. append the immutable audit row
 * Steps 4 and 5 are not wrapped in an explicit transaction because QlOrm's
 * current service API does not expose one; a partial failure therefore
 * surfaces as an error to the client. This is documented in MW-ADR-017 as
 * an accepted MVP limitation.
 */
export async function requestTransition(
  orm: QlOrm,
  user: QlUserContext,
  changeId: string,
  action: unknown,
  reason?: string,
): Promise<TransitionResult> {
  if (!isTransitionAction(action)) {
    throw new QlValidationError(`Unknown transition action '${String(action)}'.`);
  }
  const existing = await orm.findOneByService("workflow.change", { id: changeId });
  if (!existing) throw new QlNotFoundError(`Change '${changeId}' not found.`);

  const current = existing.state;
  if (!isReviewState(current)) {
    throw new QlValidationError(
      `Change '${changeId}' is in an unrecognised state '${String(current)}'.`,
    );
  }
  const next = canTransition(current, action);
  if (!next) {
    throw new QlValidationError(
      `Action '${action}' is not permitted from state '${current}'.`,
    );
  }

  assertReviewer(user, action);

  // Spec line 14: "A submitter cannot approve their own work" — enforced
  // here even for users who hold a reviewer group.
  const owner = typeof existing.owner_id === "string" ? existing.owner_id : "";
  assertOwner(user, action, owner);
  if (SELF_FORBIDDEN_ACTIONS.includes(action) && owner && owner === user.id) {
    throw new QlConflictError("Submitters cannot approve or publish their own change.");
  }

  const nextRevision =
    (typeof existing.revision === "number" ? existing.revision : 1) + 1;
  const now = Date.now();
  const stamped = new Date(now);
  const trimmedReason =
    typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 4000) : null;

  const updated = await orm.updateRecordsForService(
    "workflow.change",
    { id: changeId },
    { state: next, revision: nextRevision, updated_at: stamped },
  );
  if (updated === 0) {
    throw new QlNotFoundError(`Change '${changeId}' could not be updated.`);
  }

  const transition = await orm.createRecordForService("workflow.transition", {
    change_id: changeId,
    from_state: current,
    to_state: next,
    action,
    reason: trimmedReason ?? "",
    revision: nextRevision,
    actor_id: user.id,
    owner_id: owner,
    created_at: stamped,
  });
  const change = await orm.findOneByService("workflow.change", { id: changeId });
  if (!change) throw new QlNotFoundError(`Change '${changeId}' vanished after update.`);
  return { change, transition };
}

/**
 * Loads the cross-owner queue of open change requests for reviewers. Kept
 * intentionally narrow: no state filter, no assignee, no pagination. The
 * API handler applies the state whitelist and hard limit; future revisions
 * may widen this once QlOrm gains indexed range queries (see plan
 * "Deferred for perf/scalability").
 */
export async function listOpenChanges(orm: QlOrm): Promise<QlRecord[]> {
  return orm.findManyByService("workflow.change", {}, { limit: 200 });
}

/**
 * Reads every transition attached to a change, newest first. Used by the
 * audit-trail panel on `/workflow/[id]` and by tests verifying immutability
 * (no `write` / `unlink` ACL on `workflow.transition`).
 */
export async function listTransitionsForChange(
  orm: QlOrm,
  changeId: string,
): Promise<QlRecord[]> {
  return orm.findManyByService(
    "workflow.change",
    { id: changeId },
    { limit: 1 },
  ).then(async ([change]) => {
    if (!change) throw new QlNotFoundError(`Change '${changeId}' not found.`);
    return orm.findManyByService(
      "workflow.transition",
      { change_id: changeId },
      { limit: 200, orderBy: { field: "created_at", direction: "desc" } },
    );
  });
}
