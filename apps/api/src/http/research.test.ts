import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, test } from "node:test";
import { createConversationStore, type ConversationStore } from "@moonwitness/database";
import {
  apiRoutes,
  type CreateLexicalResearchReviewResponseDto,
  type LexicalResearchReviewQueueResponseDto,
  type ModelRecordResponseDto,
} from "@moonwitness/moonclient";
import { createQlOrm, type QlOrm } from "ql_orm";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import corpusManifest from "ql_corpus/__manifest__";
import researchManifest from "ql_research/__manifest__";
import sourceManifest from "ql_source/__manifest__";
import { createApiServer } from "./server.js";

const testPassword = "correct horse battery staple";
const ownerEmail = "research-owner@example.com";
const memberEmail = "research-member@example.com";
const editionKey = "mw:work:research-fixture|ar|revelation_verbatim";

let server: ReturnType<typeof createApiServer>;
let address: string;
let orm: QlOrm;
let closeOrm: () => void;
let store: ConversationStore;
let ownerCookie: string;
let memberCookie: string;

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
    body: JSON.stringify({ name: "Research member", email, password: testPassword }),
  });
  assert.equal(response.status, 201);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

async function seedPublishedFixture(): Promise<void> {
  const work = await orm.createRecordForService("corpus.work", {
    canonical_id: "mw:work:research-fixture",
    title: "Research review fixture",
    work_kind: "revelation",
    primary_locale: "ar",
  });
  const artifact = await orm.createRecordForService("source.artifact", {
    canonical_id: "mw:dataset:research-fixture",
    title: "Licensed research fixture",
    kind: "revealed_text",
    owner_id: "seed-user",
  });
  const version = await orm.createRecordForService("source.version", {
    artifact_id: String(artifact.id),
    version_key: `${String(artifact.id)}@v1`,
    release_label: "fixture-v1",
    row_count_expected: 2,
    acquired_at: new Date(),
    method: "API test fixture",
    owner_id: "seed-user",
  });
  let displayRightsId = "";
  for (const action of ["display", "transform"]) {
    const rights = await orm.createRecordForService("source.rights", {
      version_id: String(version.id),
      rights_key: `${String(version.id)}|${action}`,
      action,
      rights_status: "cleared",
      attribution_text: "Fixture source attribution",
      owner_id: "seed-user",
    });
    if (action === "display") displayRightsId = String(rights.id);
  }
  const edition = await orm.createRecordForService("corpus.edition", {
    canonical_id: "mw:edition:research-fixture",
    work_id: String(work.id),
    source_version_id: String(version.id),
    rights_id: displayRightsId,
    edition_key: editionKey,
    authority: "revelation_verbatim",
    locale: "ar",
    attribution_text: "Fixture source attribution",
    publisher: "Fixture publisher",
    imported_row_count: 2,
  });
  for (const [index, text] of [
    "الرَّحْمَٰنُ",
    "الرَّحْمَٰنُ الرَّحِيمُ",
  ].entries()) {
    const ayah = index + 1;
    await orm.createRecordForService("corpus.passage", {
      canonical_id: `mw:passage:research-fixture:${ayah}`,
      edition_id: String(edition.id),
      work_id: String(work.id),
      authority: "revelation_verbatim",
      locator: `1:${ayah}`,
      passage_key: `${String(edition.id)}|1:${ayah}`,
      surah: 1,
      ayah,
      row_kind: "ayah",
      text,
      text_checksum: createHash("sha256").update(text, "utf8").digest("hex"),
      ordinal: ayah,
      import_run_id: "research-api-test",
    });
  }
  const { publishEdition } = await import("ql_corpus/services/corpus-service");
  await publishEdition(
    orm,
    { id: "owner", groups: ["admin"] },
    editionKey,
  );
}

before(async () => {
  const runtime = await createQlOrm("file::memory:", [
    baseManifest,
    authManifest,
    sourceManifest,
    corpusManifest,
    researchManifest,
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
      name: "Research owner",
      email: ownerEmail,
      password: testPassword,
    }),
  });
  assert.equal(setup.status, 201);
  ownerCookie = (setup.headers.get("set-cookie") ?? "").split(";", 1)[0];
  memberCookie = await register(memberEmail);
  await seedPublishedFixture();
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  closeOrm();
});

void test("research review endpoints require authentication and reviewer groups", async () => {
  const unauthenticated = await fetch(
    `${address}${apiRoutes.research.lexicalCandidateQueue(editionKey)}`,
  );
  assert.equal(unauthenticated.status, 401);

  const memberQueue = await api<{ error: string }>(
    apiRoutes.research.lexicalCandidateQueue(editionKey),
    { cookie: memberCookie },
  );
  assert.equal(memberQueue.status, 403, memberQueue.text);

  const memberReview = await api<{ error: string }>(
    apiRoutes.research.lexicalCandidateReview("f".repeat(64)),
    {
      method: "POST",
      cookie: memberCookie,
      body: {},
    },
  );
  assert.equal(memberReview.status, 403, memberReview.text);
});

void test("review queue exposes exploratory candidates without confidence or private data", async () => {
  const reply = await api<LexicalResearchReviewQueueResponseDto>(
    apiRoutes.research.lexicalCandidateQueue(editionKey),
  );
  assert.equal(reply.status, 200, reply.text);
  const item = reply.body.candidates.find(
    ({ candidate }) => candidate.normalized_form === "الرحمن",
  );
  assert.ok(item);
  assert.equal(item.review, null);
  assert.equal(item.candidate.occurrence_count, 2);
  assert.equal("extraction_confidence_per_mille" in item.candidate, false);
  assert.ok(Array.isArray(item.candidate.source_references));
  assert.ok(
    item.candidate.source_references.every((reference) =>
      /^[a-f0-9]{64}$/u.test(reference.checksum),
    ),
  );
  assert.equal("reviewer_id" in (item.review ?? {}), false);
});

void test("assessment writes are recomputed, append-only, and exclude candidate text", async () => {
  const queue = await api<LexicalResearchReviewQueueResponseDto>(
    apiRoutes.research.lexicalCandidateQueue(editionKey),
  );
  const item = queue.body.candidates.find(
    ({ candidate }) => candidate.normalized_form === "الرحمن",
  );
  assert.ok(item);
  const created = await api<CreateLexicalResearchReviewResponseDto>(
    apiRoutes.research.lexicalCandidateReview(item.candidate.id),
    {
      method: "POST",
      body: {
        edition_key: editionKey,
        normalized_form: item.candidate.normalized_form,
        decision: "retain_for_research",
        rationale: "Keep for a separate, expert-led linguistic review.",
      },
    },
  );
  assert.equal(created.status, 201, created.text);
  assert.equal(created.body.review.candidate_id, item.candidate.id);
  assert.equal(created.body.review.source_version_id, item.candidate.source_version_id);
  assert.equal(typeof created.body.review.reviewed_at, "number");
  assert.equal("reviewer_id" in created.body.review, false);
  assert.equal("candidate_text" in created.body.review, false);
  assert.match(created.body.review.source_reference_digest, /^[a-f0-9]{64}$/u);

  const refreshed = await api<LexicalResearchReviewQueueResponseDto>(
    apiRoutes.research.lexicalCandidateQueue(editionKey),
  );
  const reviewed = refreshed.body.candidates.find(
    ({ candidate }) => candidate.id === item.candidate.id,
  );
  assert.equal(reviewed?.review?.id, created.body.review.id);
  assert.equal(reviewed?.review?.decision, "retain_for_research");

  const genericPatch = await api<{ error: string }>(
    apiRoutes.models.record("research.lexical_review", created.body.review.id),
    {
      method: "PATCH",
      body: { values: { decision: "exclude_from_research" } },
    },
  );
  assert.equal(genericPatch.status, 403, genericPatch.text);

  const genericDelete = await api<{ error: string }>(
    apiRoutes.models.record("research.lexical_review", created.body.review.id),
    { method: "DELETE" },
  );
  assert.equal(genericDelete.status, 403, genericDelete.text);

  const genericCreate = await api<ModelRecordResponseDto>(
    apiRoutes.models.records("research.lexical_review"),
    {
      method: "POST",
      body: {
        values: {
          candidate_id: item.candidate.id,
          edition_key: editionKey,
          decision: "retain_for_research",
          rationale: "Forged provenance is not accepted.",
        },
      },
    },
  );
  assert.equal(genericCreate.status, 403, genericCreate.text);
});

void test("review endpoint rejects invalid decisions, missing reasons, and stale candidate IDs", async () => {
  const queue = await api<LexicalResearchReviewQueueResponseDto>(
    apiRoutes.research.lexicalCandidateQueue(editionKey),
  );
  const item = queue.body.candidates[0];
  assert.ok(item);

  for (const body of [
    {
      edition_key: editionKey,
      normalized_form: item.candidate.normalized_form,
      decision: "theologically_verified",
      rationale: "This decision must never be accepted.",
    },
    {
      edition_key: editionKey,
      normalized_form: item.candidate.normalized_form,
      decision: "retain_for_research",
      rationale: "   ",
    },
  ]) {
    const invalid = await api<{ error: string }>(
      apiRoutes.research.lexicalCandidateReview(item.candidate.id),
      { method: "POST", body },
    );
    assert.equal(invalid.status, 400, invalid.text);
  }

  const stale = await api<{ error: string }>(
    apiRoutes.research.lexicalCandidateReview("f".repeat(64)),
    {
      method: "POST",
      body: {
        edition_key: editionKey,
        normalized_form: item.candidate.normalized_form,
        decision: "retain_for_research",
        rationale: "Candidate id is deliberately stale.",
      },
    },
  );
  assert.equal(stale.status, 404, stale.text);
});
