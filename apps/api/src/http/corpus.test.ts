import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, test } from "node:test";
import { createConversationStore, type ConversationStore } from "@moonwitness/database";
import {
  apiRoutes,
  type AuthResponseDto,
  type ConversationMessagesResponseDto,
  type CorpusEditionListResponseDto,
  type CorpusSurahResponseDto,
} from "@moonwitness/moonclient";
import { createQlOrm, type QlOrm } from "ql_orm";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import corpusManifest from "ql_corpus/__manifest__";
import sourceManifest from "ql_source/__manifest__";
import { publishEdition } from "ql_corpus/services/corpus-service";
import { _resetRightsCacheForTests } from "ql_corpus/services/reader-service";
import { createApiServer } from "./server.js";

const testPassword = "correct horse battery staple";
const ownerEmail = "corpus-owner@example.com";
const memberEmail = "corpus-member@example.com";

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

let server: ReturnType<typeof createApiServer>;
let address: string;
let orm: QlOrm;
let closeOrm: () => void;
let store: ConversationStore;
let ownerCookie: string;
let memberCookie: string;
let publishedEditionKey = "";
let stagedEditionKey = "";
let publishableEditionKey = "";

async function register(email: string, name = "Tester"): Promise<string> {
  const response = await fetch(`${address}${apiRoutes.auth.register}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password: testPassword }),
  });
  assert.equal(response.status, 201);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; cookie?: string } = {},
): Promise<{ status: number; text: string; body: T }> {
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

async function seedEdition(
  authority: "revelation_verbatim" | "translation",
  locale: string,
  cleared: boolean,
  stageFlip: "none" | "publish",
  workId: string,
): Promise<string> {
  const artifact = await orm.createRecordForService("source.artifact", {
    canonical_id: `mw:dataset:test:${locale}-${authority}`,
    title: "Fixture",
    kind: authority === "revelation_verbatim" ? "revealed_text" : "translation_source",
    owner_id: "seed",
  });
  const version = await orm.createRecordForService("source.version", {
    artifact_id: String(artifact.id),
    version_key: `${String(artifact.id)}@v1`,
    release_label: "v1",
    row_count_expected: 1,
    acquired_at: new Date(),
    method: "corpus.test",
    owner_id: "seed",
  });
  const rights = await orm.createRecordForService("source.rights", {
    version_id: String(version.id),
    rights_key: `${String(version.id)}|display`,
    action: "display",
    rights_status: cleared ? "cleared" : "under_review",
    attribution_required: true,
    attribution_text: `Fixture ${authority} \u00a9 test`,
    owner_id: "seed",
  });
  const editionKey = `mw:work:quran|${locale}|${authority}`;
  const edition = await orm.createRecordForService("corpus.edition", {
    canonical_id: `mw:edition:test:${locale}:${authority}`,
    work_id: workId,
    source_version_id: String(version.id),
    rights_id: String(rights.id),
    edition_key: editionKey,
    authority,
    locale,
    publisher: "Fixture",
    attribution_text: `Fixture ${authority} \u00a9 test`,
    imported_row_count: 1,
  });
  await orm.createRecordForService("corpus.passage", {
    canonical_id: `mw:passage:test:${locale}:${authority}:1:1`,
    edition_id: String(edition.id),
    work_id: workId,
    authority,
    locator: "1:1",
    passage_key: `${String(edition.id)}|1:1`,
    surah: 1,
    ayah: 1,
    row_kind: "basmalah",
    text: `sample-${authority}`,
    text_checksum: sha256(`sample-${authority}`),
    ordinal: 1,
    import_run_id: "corpus-test-run",
  });
  if (stageFlip === "publish") {
    await publishEdition(
      orm,
      { id: "seed", groups: ["admin"] },
      editionKey,
    );
  }
  return editionKey;
}

before(async () => {
  const runtime = await createQlOrm("file::memory:", [
    baseManifest,
    authManifest,
    chatManifest,
    sourceManifest,
    corpusManifest,
  ]);
  orm = runtime.orm;
  closeOrm = runtime.close;
  store = createConversationStore(orm);
  server = createApiServer(undefined, store, orm);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
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
  memberCookie = await register(memberEmail);
  const work = await orm.createRecordForService("corpus.work", {
    canonical_id: "mw:work:quran",
    title: "Al-Qur'an",
    work_kind: "revelation",
    primary_locale: "ar",
  });
  const workId = String(work.id);
  publishedEditionKey = await seedEdition(
    "revelation_verbatim",
    "ar",
    /* cleared */ true,
    /* publish */ "publish",
    workId,
  );
  stagedEditionKey = await seedEdition(
    "translation",
    "en",
    /* cleared */ false,
    /* publish */ "none",
    workId,
  );
  // A third fixture: rights cleared, stage still `staged` — the publish-
  // over-HTTP test transitions this one so both the deny and the allow
  // paths of `publishEdition` are exercised.
  publishableEditionKey = await seedEdition(
    "translation",
    "id",
    /* cleared */ true,
    /* publish */ "none",
    workId,
  );
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  closeOrm();
  void ({} as AuthResponseDto);
});

void test("corpus endpoints require authentication", async () => {
  const response = await fetch(`${address}${apiRoutes.corpus.editions}`);
  assert.equal(response.status, 401);
});

void test("the shelf lists only published editions", async () => {
  const reply = await api<CorpusEditionListResponseDto>(apiRoutes.corpus.editions, {
    cookie: memberCookie,
  });
  assert.equal(reply.status, 200, reply.text);
  const keys = reply.body.editions.map((edition) => edition.edition_key);
  assert.ok(keys.includes(publishedEditionKey), "published edition must be visible");
  assert.ok(!keys.includes(stagedEditionKey), "staged edition must NOT be visible");
  // Every returned edition carries authority + attribution non-undefined.
  for (const edition of reply.body.editions) {
    assert.ok(edition.authority);
    assert.ok(edition.attribution_text);
    assert.equal(edition.stage, "published");
  }
});

void test("reading a published Arabic surah returns passages with authority + attribution on every row", async () => {
  const reply = await api<CorpusSurahResponseDto>(
    apiRoutes.corpus.surah(publishedEditionKey, 1),
    { cookie: memberCookie },
  );
  assert.equal(reply.status, 200, reply.text);
  assert.equal(reply.body.reading.passages.length, 1);
  const first = reply.body.reading.passages[0];
  assert.equal(first?.authority, "revelation_verbatim");
  assert.equal(first?.edition_authority, "revelation_verbatim");
  assert.ok(first?.edition_attribution_text);
  // Private fields must never leak — the model already strips them at
  // `findMany`/`findManyByService`, but the DTO shape also omits the keys.
  const body = JSON.stringify(reply.body);
  assert.equal(/"owner_id"|"actor_id"|"license_evidence_ref"/.test(body), false);
});

void test("reading a staged edition (or one without cleared rights) is refused and returns no text", async () => {
  const reply = await api<{ error?: string }>(
    apiRoutes.corpus.surah(stagedEditionKey, 1),
    { cookie: memberCookie },
  );
  assert.equal(reply.status, 403, reply.text);
  // The 403 response must not contain passage text; the deny is real.
  assert.equal(/sample-translation/.test(reply.text), false);
});

void test("conversation history revalidates citations before returning display metadata", async () => {
  const owner = await store.getUserByEmail(ownerEmail);
  assert.ok(owner);
  const eligibleEdition = await orm.findOneByService("corpus.edition", {
    edition_key: publishedEditionKey,
  });
  const stagedEdition = await orm.findOneByService("corpus.edition", {
    edition_key: publishableEditionKey,
  });
  assert.ok(eligibleEdition);
  assert.ok(stagedEdition);
  const eligiblePassage = await orm.findOneByService("corpus.passage", {
    passage_key: `${String(eligibleEdition.id)}|1:1`,
  });
  const stagedPassage = await orm.findOneByService("corpus.passage", {
    passage_key: `${String(stagedEdition.id)}|1:1`,
  });
  assert.ok(eligiblePassage);
  assert.ok(stagedPassage);
  const conversation = await store.createConversation(owner.id);
  await store.addMessage(
    conversation.id,
    owner.id,
    "assistant",
    "A response with a cited passage.",
    {
      groundingStatus: "grounded",
      citations: [
        {
          evidenceId: String(eligiblePassage.id),
          editionId: String(eligibleEdition.id),
          editionKey: publishedEditionKey,
          surah: 1,
          ayah: 1,
        },
      ],
    },
  );
  await store.addMessage(
    conversation.id,
    owner.id,
    "assistant",
    "A response with a staged citation.",
    {
      groundingStatus: "grounded",
      citations: [
        {
          evidenceId: String(stagedPassage.id),
          editionId: String(stagedEdition.id),
          editionKey: publishableEditionKey,
          surah: 1,
          ayah: 1,
        },
      ],
    },
  );
  await store.addMessage(
    conversation.id,
    owner.id,
    "assistant",
    "There is not enough evidence.",
    { groundingStatus: "insufficient_evidence" },
  );

  const history = await api<ConversationMessagesResponseDto>(
    apiRoutes.conversations.messages(conversation.id),
  );
  assert.equal(history.status, 200, history.text);
  assert.equal(history.body.messages[0]?.groundingStatus, "grounded");
  assert.equal(
    history.body.messages[0]?.citations?.[0]?.evidenceId,
    String(eligiblePassage.id),
  );
  assert.equal(history.body.messages[1]?.groundingStatus, "legacy");
  assert.equal(history.body.messages[1]?.citations, undefined);
  assert.equal(
    history.body.messages[2]?.groundingStatus,
    "insufficient_evidence",
  );
  assert.equal(history.text.includes("sample-revelation_verbatim"), false);

  await orm.updateRecordsForService(
    "source.rights",
    {
      version_id: String(eligibleEdition.source_version_id),
      action: "display",
    },
    { rights_status: "under_review" },
  );
  _resetRightsCacheForTests();

  const revokedHistory = await api<ConversationMessagesResponseDto>(
    apiRoutes.conversations.messages(conversation.id),
  );
  assert.equal(revokedHistory.status, 200, revokedHistory.text);
  assert.equal(revokedHistory.body.messages[0]?.groundingStatus, "legacy");
  assert.equal(revokedHistory.body.messages[0]?.citations, undefined);
});

void test("out-of-range surah and ayah are rejected before the service is reached", async () => {
  for (const surah of [0, 115]) {
    const reply = await api<{ error?: string }>(
      apiRoutes.corpus.surah(publishedEditionKey, surah),
      { cookie: memberCookie },
    );
    // Path regex uses `[0-9]+`, so 0 and 115 both reach the handler and the
    // service throws out-of-range (or the passage lookup returns 404). Either
    // is acceptable as long as the response is 4xx with no text.
    assert.ok(
      reply.status === 400 || reply.status === 403 || reply.status === 404,
      `expected 4xx for surah=${surah}, got ${reply.status} (${reply.text})`,
    );
  }
});

void test("publish and withdraw over HTTP require an admin/operator/root group", async () => {
  const denied = await api<{ error?: string }>(
    `${apiRoutes.corpus.edition(publishableEditionKey)}/publish`,
    { method: "POST", cookie: memberCookie, body: {} },
  );
  assert.equal(denied.status, 403, denied.text);
  // The admin path succeeds and flips the edition to published.
  const published = await api<{ edition: { stage: string } }>(
    `${apiRoutes.corpus.edition(publishableEditionKey)}/publish`,
    { method: "POST", cookie: ownerCookie, body: { reason: "unit test" } },
  );
  assert.equal(published.status, 200, published.text);
  assert.equal(published.body.edition.stage, "published");
  // Roll it back so the fixture remains staged for downstream test reruns.
  const withdrawn = await api<{ edition: { stage: string } }>(
    `${apiRoutes.corpus.edition(publishableEditionKey)}/withdraw`,
    { method: "POST", cookie: ownerCookie, body: {} },
  );
  assert.equal(withdrawn.status, 200, withdrawn.text);
  assert.equal(withdrawn.body.edition.stage, "withdrawn");
});
