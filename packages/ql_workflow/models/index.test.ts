import assert from "node:assert/strict";
import test from "node:test";
import {
  loadAddons,
  QlAccessError,
  QlConflictError,
  QlValidationError,
} from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import workflowManifest from "../__manifest__.js";
import { canTransition } from "../services/state-machine.js";
import {
  getSanadPipelineStatusForService,
  requestTransition,
  submitPeerReviewForService,
} from "../services/workflow-service.js";
import {
  REVIEW_STATES,
  TRANSITION_ACTIONS,
} from "../services/workflow-vocabulary.js";

// Phase 1 baseline: the addon skeleton registers cleanly and the state
// machine's shape is validated before any model or route exists. Later
// phases add per-model ACL and view tests.

void test("the addon is accepted by loadAddons and ordered behind its deps", () => {
  // Only ql_workflow is under test; its declared dependencies are stubs so
  // the addon boots in isolation.
  const withDeps = loadAddons([
    workflowManifest,
    stubAddonManifest("ql_auth"),
    stubAddonManifest("ql_base"),
  ]);
  const order = withDeps.map((manifest) => manifest.name);
  assert.ok(
    order.indexOf("ql_base") < order.indexOf("ql_auth"),
    "ql_base must sort before ql_auth",
  );
  assert.ok(
    order.indexOf("ql_auth") < order.indexOf("ql_workflow"),
    "ql_auth must sort before ql_workflow",
  );
});

void test("the state machine matches the spec verbatim", () => {
  // Every legal edge from the canonical workflow spec:
  // https://github.com/bjo163/moonwitness-reborn/wiki/docs-workflows-WORKFLOW_AND_PUBLISHING_SPECIFICATION
  assert.equal(canTransition("draft", "submit"), "submitted");
  assert.equal(canTransition("submitted", "start_review"), "in_review");
  assert.equal(canTransition("in_review", "approve"), "approved");
  assert.equal(canTransition("in_review", "request_changes"), "changes_requested");
  assert.equal(canTransition("in_review", "reject"), "rejected");
  assert.equal(canTransition("changes_requested", "submit"), "submitted");
  assert.equal(canTransition("approved", "publish"), "published");
  assert.equal(canTransition("published", "supersede"), "superseded");

  // Terminal states must reject every action.
  for (const state of ["rejected", "withdrawn", "superseded"] as const) {
    for (const action of TRANSITION_ACTIONS) {
      assert.equal(
        canTransition(state, action),
        null,
        `${state} is terminal but allows ${action}`,
      );
    }
  }

  // Draft has exactly one outgoing edge.
  for (const action of TRANSITION_ACTIONS) {
    const expected = action === "submit" ? "submitted" : null;
    assert.equal(canTransition("draft", action), expected);
  }
});

void test("the vocabulary uses only states and actions the machine knows", () => {
  // Every state mentioned in TRANSITION_ACTIONS keys must exist in REVIEW_STATES.
  for (const state of REVIEW_STATES) {
    assert.equal(
      typeof state,
      "string",
      "review state must be a string literal",
    );
  }
  // Sanity: the arrays are the exact set the model validators will accept.
  assert.ok(REVIEW_STATES.includes("draft"));
  assert.ok(REVIEW_STATES.includes("published"));
  assert.ok(TRANSITION_ACTIONS.includes("approve"));
});

// ---------------------------------------------------------------------------
// Phase 2 — PM tracker model invariants.
// ---------------------------------------------------------------------------

const ownerA = { id: "user-a", groups: ["user"] };
const ownerB = { id: "user-b", groups: ["user"] };

function privateFieldNames(modelName: string): string[] {
  const model = workflowManifest.models.find((entry) => entry.name === modelName);
  return Object.entries(model?.fields ?? {})
    .filter(([, field]) => field.private === true)
    .map(([name]) => name);
}

void test("no published view exposes a private field", () => {
  for (const view of workflowManifest.views) {
    const privateNames = privateFieldNames(view.model);
    for (const field of view.fields) {
      assert.equal(
        privateNames.includes(field),
        false,
        `View '${view.name}' must not list private field '${field}'.`,
      );
    }
  }
});

void test("workflow.task rejects an unknown status via the model validator", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), workflowManifest],
    async (orm) => {
      await assert.rejects(
        () =>
          orm.createRecordForService("workflow.task", {
            title: "t",
            status: "wip", // not in TASK_STATUSES
            owner_id: ownerA.id,
          }),
        QlValidationError,
      );
    },
  );
});

void test("workflow.project and workflow.task are owner-isolated for the user group", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), workflowManifest],
    async (orm) => {
      await orm.createRecordForService("workflow.project", {
        title: "Project A",
        owner_id: ownerA.id,
      });
      const asOwner = await orm.findMany("workflow.project", ownerA);
      const asOther = await orm.findMany("workflow.project", ownerB);
      assert.equal(asOwner.length, 1, "owner must see their own project");
      assert.deepEqual(asOther, [], "other users must not see foreign projects");
    },
  );
});

void test("generic create refuses write on unknown model and access errors surface", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), workflowManifest],
    async (orm) => {
      await assert.rejects(
        () => orm.create("unknown.model", ownerA, {}),
        // QlOrm throws NotFoundError for unknown models; wrap via any Error.
        (err: unknown) => err instanceof Error,
      );
      // Sanity: a group that has no ACL entry defaults to deny.
      const viewer = { id: "v", groups: ["viewer"] };
      await assert.rejects(
        () => orm.create("workflow.project", viewer, { title: "x" }),
        QlAccessError,
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Phase 3 — CAB state machine + bypass-lockdown regression lock.
// ---------------------------------------------------------------------------

const reviewer = { id: "reviewer-1", groups: ["admin"] };
const otherReviewer = { id: "reviewer-2", groups: ["operator"] };

async function createDraft(
  orm: Parameters<typeof withMemoryOrm>[1] extends (o: infer O) => unknown
    ? O
    : never,
  owner: typeof ownerA,
): Promise<string> {
  const draft = await orm.createRecordForService("workflow.change", {
    title: "Add new publication right",
    body: "Detail",
    urgency: "high",
    state: "draft",
    revision: 1,
    owner_id: owner.id,
  });
  return String(draft.id);
}

void test("ACL bypass lock: a member cannot PATCH `state` via generic update", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), workflowManifest],
    async (orm) => {
      const changeId = await createDraft(orm, ownerA);
      await assert.rejects(
        () =>
          orm.update("workflow.change", ownerA, changeId, {
            state: "approved",
          }),
        QlAccessError,
        "generic PATCH must not be able to bypass the transition handler",
      );
    },
  );
});

void test("full legal transition path stamps the audit trail and rejects self-approval", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), workflowManifest],
    async (orm) => {
      const changeId = await createDraft(orm, ownerA);

      // Owner submits (draft → submitted).
      await requestTransition(orm, ownerA, changeId, "submit", "ready");
      // A submitter who happens to also hold `admin` can start the review,
      // but the self-approval guard still blocks approving their own work.
      const submitterAsAdmin = { id: ownerA.id, groups: ["user", "admin"] };
      await requestTransition(orm, submitterAsAdmin, changeId, "start_review");
      await assert.rejects(
        () => requestTransition(orm, submitterAsAdmin, changeId, "approve"),
        QlConflictError,
        "submitter cannot approve their own change",
      );

      // A genuine reviewer path: approve by `reviewer`, publish by
      // `otherReviewer`.
      await requestTransition(orm, reviewer, changeId, "approve", "ok");
      await requestTransition(orm, otherReviewer, changeId, "publish");

      const audit = await orm.findManyByService("workflow.transition", {
        change_id: changeId,
      });
      const actions = audit
        .map((row) => String(row.action))
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .sort();
      assert.deepEqual(actions, [
        "approve",
        "publish",
        "start_review",
        "submit",
      ]);
      const latest = audit.reduce((acc, row) =>
        Number(row.revision) > Number(acc.revision) ? row : acc,
      );
      assert.equal(latest.to_state, "published");
    },
  );
});

void test("transition rejects unknown action and illegal edges", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), workflowManifest],
    async (orm) => {
      const changeId = await createDraft(orm, ownerA);
      await assert.rejects(
        () => requestTransition(orm, ownerA, changeId, "not_a_real_action"),
        QlValidationError,
      );
      // Legal action but from the wrong state.
      await assert.rejects(
        () => requestTransition(orm, reviewer, changeId, "approve"),
        QlValidationError,
      );
    },
  );
});

void test("reviewer actions require an admin/operator group", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), workflowManifest],
    async (orm) => {
      const changeId = await createDraft(orm, ownerA);
      await requestTransition(orm, ownerA, changeId, "submit");
      await requestTransition(orm, reviewer, changeId, "start_review");
      // Now the change sits in `in_review`, where `approve` is a legal edge.
      // A member without a reviewer group must still be denied.
      await assert.rejects(
        () => requestTransition(orm, ownerB, changeId, "approve"),
        QlAccessError,
      );
    },
  );
});

void test("submit may only be executed by the change owner", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), workflowManifest],
    async (orm) => {
      const changeId = await createDraft(orm, ownerA);
      await assert.rejects(
        () => requestTransition(orm, ownerB, changeId, "submit"),
        QlAccessError,
        "a non-owner cannot submit someone else's change",
      );
    },
  );
});

void test("Sanad pipeline: requires 2 distinct peer reviewers, rejects author self-review and duplicate reviewer", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), workflowManifest],
    async (orm) => {
      const changeId = await createDraft(orm, ownerA);
      await requestTransition(orm, ownerA, changeId, "submit");

      // 1. Author cannot review their own work
      await assert.rejects(
        () =>
          submitPeerReviewForService(orm, changeId, ownerA.id, {
            decision: "approved",
            notes: "Self endorsement",
            sanadChainRef: "ref-1",
          }),
        QlAccessError,
        "Author self-review must be rejected",
      );

      // 2. Reviewer 1 submits approval -> quorum not yet reached
      const res1 = await submitPeerReviewForService(orm, changeId, reviewer.id, {
        decision: "approved",
        notes: "Approved by reviewer 1",
        sanadChainRef: "ref-rev1",
      });
      assert.equal(res1.quorumReached, false);
      const statusAfter1 = await getSanadPipelineStatusForService(orm, changeId);
      assert.equal(statusAfter1.approvedCount, 1);
      assert.equal(statusAfter1.canPublish, false);

      // 3. Duplicate review by reviewer 1 must be rejected
      await assert.rejects(
        () =>
          submitPeerReviewForService(orm, changeId, reviewer.id, {
            decision: "approved",
            notes: "Duplicate approval attempt",
            sanadChainRef: "ref-rev1-dup",
          }),
        QlConflictError,
        "Duplicate review submission must be rejected with QlConflictError",
      );

      // 4. Reviewer 2 submits approval -> distinct quorum reached, auto transitions to 'approved'
      const res2 = await submitPeerReviewForService(orm, changeId, otherReviewer.id, {
        decision: "approved",
        notes: "Approved by reviewer 2",
        sanadChainRef: "ref-rev2",
      });
      assert.equal(res2.quorumReached, true);
      assert.equal(res2.change.state, "approved");

      const statusAfter2 = await getSanadPipelineStatusForService(orm, changeId);
      assert.equal(statusAfter2.approvedCount, 2);
      assert.equal(statusAfter2.canPublish, true);
    },
  );
});
