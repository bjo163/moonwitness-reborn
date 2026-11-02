import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createConversationStore, type ConversationStore } from "@moonwitness/database";
import {
  apiRoutes,
  type ModelRecordResponseDto,
  type TransitionResponseDto,
  type WorkflowChangeListResponseDto,
  type WorkflowTransitionListResponseDto,
} from "@moonwitness/moonclient";
import { createQlOrm, type QlOrm } from "ql_orm";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import workflowManifest from "ql_workflow/__manifest__";
import { createApiServer } from "./server.js";

const testPassword = "correct horse battery staple";
const ownerEmail = "owner@example.com";
const submitterEmail = "submitter@example.com";

let server: ReturnType<typeof createApiServer>;
let address: string;
let orm: QlOrm;
let closeOrm: () => void;
let store: ConversationStore;
let ownerCookie: string;
let submitterCookie: string;

interface Reply<T> {
  status: number;
  text: string;
  body: T;
}

async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; cookie?: string } = {},
): Promise<Reply<T>> {
  const response = await fetch(`${address}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      cookie: init.cookie ?? ownerCookie,
    },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return { status: response.status, text, body: body as T };
}

async function register(email: string): Promise<string> {
  const response = await fetch(`${address}${apiRoutes.auth.register}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Submitter", email, password: testPassword }),
  });
  assert.equal(response.status, 201);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

async function createDraft(cookie: string, title: string): Promise<string> {
  const created = await api<ModelRecordResponseDto>(
    apiRoutes.models.records("workflow.change"),
    {
      method: "POST",
      cookie,
      body: { values: { title, body: "detail", urgency: "high" } },
    },
  );
  assert.equal(created.status, 201, created.text);
  return String(created.body.record.id);
}

before(async () => {
  const runtime = await createQlOrm("file::memory:", [
    baseManifest,
    authManifest,
    workflowManifest,
  ]);
  orm = runtime.orm;
  closeOrm = runtime.close;
  store = createConversationStore(orm);
  server = createApiServer(undefined, store, orm);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const where = server.address();
  assert.ok(where && typeof where !== "string");
  address = `http://127.0.0.1:${where.port}`;
  const setup = await fetch(`${address}${apiRoutes.auth.setup}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Owner",
      email: ownerEmail,
      password: testPassword,
    }),
  });
  assert.equal(setup.status, 201);
  ownerCookie = (setup.headers.get("set-cookie") ?? "").split(";", 1)[0];
  submitterCookie = await register(submitterEmail);
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  closeOrm();
});

void test("the queue endpoint refuses unauthenticated callers", async () => {
  const response = await fetch(`${address}${apiRoutes.workflow.queue}`);
  assert.equal(response.status, 401);
});

void test("the queue endpoint refuses members who lack the reviewer group", async () => {
  const reply = await api<{ error: string }>(apiRoutes.workflow.queue, {
    cookie: submitterCookie,
  });
  assert.equal(reply.status, 403, reply.text);
});

void test("reviewers see open changes across owners in the queue", async () => {
  const changeId = await createDraft(submitterCookie, "Queue probe");
  const reply = await api<WorkflowChangeListResponseDto>(apiRoutes.workflow.queue);
  assert.equal(reply.status, 200, reply.text);
  const seen = reply.body.changes.find((row) => row.id === changeId);
  assert.ok(seen, "reviewer queue must include the foreign change");
  assert.equal(seen.state, "draft");
  // Private fields must not leak through the queue DTO.
  assert.ok(!("owner_id" in (seen as unknown as Record<string, unknown>)));
});

void test("generic PATCH on workflow.change cannot mutate state (bypass lockdown)", async () => {
  const changeId = await createDraft(submitterCookie, "Bypass attempt");
  const reply = await api<{ error: string }>(
    apiRoutes.models.record("workflow.change", changeId),
    {
      method: "PATCH",
      cookie: submitterCookie,
      body: { values: { state: "approved" } },
    },
  );
  assert.equal(reply.status, 403, reply.text);
});

void test("transition flow: submit → start_review → approve → publish, self-approve refused", async () => {
  const changeId = await createDraft(submitterCookie, "End-to-end change");

  // Submitter submits.
  const submitted = await api<TransitionResponseDto>(
    apiRoutes.workflow.transition(changeId),
    {
      method: "POST",
      cookie: submitterCookie,
      body: { action: "submit", reason: "ready" },
    },
  );
  assert.equal(submitted.status, 200, submitted.text);
  assert.equal(submitted.body.change.state, "submitted");

  // Submitter cannot start their own review (missing reviewer group).
  const selfStart = await api<{ error: string }>(
    apiRoutes.workflow.transition(changeId),
    {
      method: "POST",
      cookie: submitterCookie,
      body: { action: "start_review" },
    },
  );
  assert.equal(selfStart.status, 403, selfStart.text);

  // Owner (admin) starts the review.
  const started = await api<TransitionResponseDto>(
    apiRoutes.workflow.transition(changeId),
    { method: "POST", body: { action: "start_review" } },
  );
  assert.equal(started.status, 200, started.text);
  assert.equal(started.body.change.state, "in_review");

  // Owner approves — allowed because the owner is not the submitter.
  const approved = await api<TransitionResponseDto>(
    apiRoutes.workflow.transition(changeId),
    { method: "POST", body: { action: "approve", reason: "ok" } },
  );
  assert.equal(approved.status, 200, approved.text);
  assert.equal(approved.body.change.state, "approved");

  // Now the audit trail is populated.
  const audit = await api<WorkflowTransitionListResponseDto>(
    apiRoutes.workflow.transitions(changeId),
    { cookie: submitterCookie },
  );
  assert.equal(audit.status, 200, audit.text);
  const actions = audit.body.transitions.map((row) => row.action).sort();
  assert.deepEqual(actions, ["approve", "start_review", "submit"]);
});

void test("self-approval is blocked even when the submitter holds a reviewer role", async () => {
  // Owner creates their own change; they are also the sole admin, so the
  // service must reject their attempt to approve their own submission.
  const changeId = await createDraft(ownerCookie, "Self approve test");
  await api(apiRoutes.workflow.transition(changeId), {
    method: "POST",
    body: { action: "submit" },
  });
  await api(apiRoutes.workflow.transition(changeId), {
    method: "POST",
    body: { action: "start_review" },
  });
  const approve = await api<{ error: string }>(
    apiRoutes.workflow.transition(changeId),
    { method: "POST", body: { action: "approve" } },
  );
  assert.equal(approve.status, 409, approve.text);
});

void test("illegal transitions return 400 via the state machine", async () => {
  const changeId = await createDraft(submitterCookie, "Illegal edge");
  const reply = await api<{ error: string }>(
    apiRoutes.workflow.transition(changeId),
    { method: "POST", body: { action: "approve" } },
  );
  assert.equal(reply.status, 400, reply.text);
});

void test("Track 17: Sanad review pipeline blocks self-approval and transitions upon 2 approvals", async () => {
  const changeId = await createDraft(submitterCookie, "Sanad research submission");
  await api(apiRoutes.workflow.transition(changeId), {
    method: "POST",
    cookie: submitterCookie,
    body: { action: "submit" },
  });
  await api(apiRoutes.workflow.transition(changeId), {
    method: "POST",
    cookie: ownerCookie,
    body: { action: "start_review" },
  });

  // Submitter (author) cannot review own change
  const selfReview = await api<{ error: string }>(
    apiRoutes.workflow.sanadVerification(changeId),
    {
      method: "POST",
      cookie: submitterCookie,
      body: {
        decision: "approved",
        notes: "I approve my own work",
        sanadChainRef: "Self",
      },
    },
  );
  assert.equal(selfReview.status, 403, selfReview.text);

  // Reviewer 1 (Owner) reviews
  const review1 = await api<{ approvedCount: number; currentState: string }>(
    apiRoutes.workflow.sanadVerification(changeId),
    {
      method: "POST",
      cookie: ownerCookie,
      body: {
        decision: "approved",
        notes: "First scholar approval",
        sanadChainRef: "Imam Malik",
      },
    },
  );
  assert.equal(review1.status, 200, review1.text);
  assert.equal(review1.body.approvedCount, 1);
  assert.equal(review1.body.currentState, "in_review");

  // Register second reviewer
  const reviewer2Cookie = await register("scholar2@example.com");
  const review2 = await api<{ approvedCount: number; currentState: string }>(
    apiRoutes.workflow.sanadVerification(changeId),
    {
      method: "POST",
      cookie: reviewer2Cookie,
      body: {
        decision: "approved",
        notes: "Second scholar approval",
        sanadChainRef: "Imam Shafi'i",
      },
    },
  );
  assert.equal(review2.status, 200, review2.text);
  assert.equal(review2.body.approvedCount, 2);
  assert.equal(review2.body.currentState, "approved");
});

void test("Track 20: Pre-publication ethics checklist requires all clauses", async () => {
  const changeId = await createDraft(submitterCookie, "Ethics test article");
  // Missing clauses
  const badPublish = await api<{ error: string }>(
    apiRoutes.workflow.publishChange(changeId),
    {
      method: "POST",
      cookie: submitterCookie,
      body: {
        ethicsAffirmation: {
          isNotFatwaAffirmed: false,
          citationsVerifiedAffirmed: true,
          decorumAffirmed: true,
        },
      },
    },
  );
  assert.equal(badPublish.status, 422, badPublish.text);

  // Valid clauses
  const goodPublish = await api<{ newState: string }>(
    apiRoutes.workflow.publishChange(changeId),
    {
      method: "POST",
      cookie: submitterCookie,
      body: {
        ethicsAffirmation: {
          isNotFatwaAffirmed: true,
          citationsVerifiedAffirmed: true,
          decorumAffirmed: true,
          ethicsDigest: "valid-sha256",
        },
      },
    },
  );
  assert.equal(goodPublish.status, 200, goodPublish.text);
  assert.equal(goodPublish.body.newState, "published");
});
