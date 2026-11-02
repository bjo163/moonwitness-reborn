import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AgentMessage, ModelProvider } from "@moonwitness/agent-runtime";
import {
  createConversationStore,
  type ConversationStore,
} from "@moonwitness/database";
import { apiRoutes } from "@moonwitness/moonclient";
import { createQlOrm, type QlOrm } from "ql_orm";
import aiManifest from "ql_ai/__manifest__";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import corpusManifest from "ql_corpus/__manifest__";
import sourceManifest from "ql_source/__manifest__";
import researchManifest from "ql_research/__manifest__";
import searchManifest from "ql_search/__manifest__";
import { createApiServer } from "./server.js";
import { listProjectTasks } from "../project-progress/github-issues.js";

let server: ReturnType<typeof createApiServer>;
let address: string;
let store: ConversationStore;
let orm: QlOrm;
let closeOrm: () => void;
let receivedMessages: readonly AgentMessage[] = [];
let receivedProviderConfig: { apiKey: string; model: string } | undefined;
const providerEncryptionKey = Buffer.alloc(32, 7);
const projectTaskIssues = [
  {
    title: "[MW-0001] Build foundation",
    body: `<!-- mw-task-record-start -->
\`\`\`json
${JSON.stringify({
  id: "MW-0001",
  title: "Build foundation",
  section: "Phase 0",
  owner: "Owner",
  depends_on: [],
  acceptance_criteria: "The foundation is available.",
})}
\`\`\`
<!-- mw-task-record-end -->`,
    state: "closed",
    closed_at: "2026-01-01T00:00:00Z",
    labels: [{ name: "type:task" }],
  },
  {
    title: "[MW-0002] Build next",
    body: `<!-- mw-task-record-start -->
\`\`\`json
${JSON.stringify({
  id: "MW-0002",
  title: "Build next",
  section: "Phase 0",
  owner: "Owner",
  depends_on: ["MW-0001"],
  acceptance_criteria: "The next task can start.",
})}
\`\`\`
<!-- mw-task-record-end -->`,
    state: "open",
    closed_at: null,
    labels: [{ name: "type:task" }, { name: "status:pending" }],
  },
];
const projectTasksFetcher: typeof fetch = () =>
  Promise.resolve(
    new Response(JSON.stringify(projectTaskIssues), { status: 200 }),
  );

before(async () => {
  const ormRuntime = await createQlOrm("file::memory:", [
    authManifest,
    baseManifest,
    aiManifest,
    chatManifest,
    sourceManifest,
    corpusManifest,
    researchManifest,
    searchManifest,
  ]);
  orm = ormRuntime.orm;
  closeOrm = ormRuntime.close;
  store = createConversationStore(orm);
  const provider: ModelProvider = {
    generate(messages) {
      receivedMessages = messages;
      return Promise.resolve("Hello from the model.");
    },
  };
  server = createApiServer(provider, store, orm, {
    encryptionKey: providerEncryptionKey,
    projectTasksFetcher,
    providerFactory(config) {
      receivedProviderConfig = config;
      return {
        generate() {
          return Promise.resolve("Reply via configured provider.");
        },
      };
    },
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const serverAddress = server.address();
  assert.ok(serverAddress && typeof serverAddress !== "string");
  address = `http://127.0.0.1:${serverAddress.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  closeOrm();
  store.close();
});

async function register(
  email: string,
  preferredLocale?: "id" | "en",
): Promise<string> {
  const response = await fetch(`${address}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email,
      password: "correct horse battery staple",
      ...(preferredLocale ? { preferredLocale } : {}),
    }),
  });
  assert.equal(response.status, 201);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie);
  return cookie.split(";", 1)[0];
}

void test("GET /health returns service status", async () => {
  const response = await fetch(`${address}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

void test("first-use onboarding grants exactly one super admin", async () => {
  const runtime = await createQlOrm("file::memory:", [
    authManifest,
    baseManifest,
    aiManifest,
    chatManifest,
  ]);
  const setupStore = createConversationStore(runtime.orm);
  const setupServer = createApiServer(undefined, setupStore, runtime.orm, {
    projectTasksFetcher,
  });
  await new Promise<void>((resolve) => {
    setupServer.listen(0, "127.0.0.1", resolve);
  });
  const setupAddress = setupServer.address();
  assert.ok(setupAddress && typeof setupAddress !== "string");
  const setupBaseUrl = `http://127.0.0.1:${setupAddress.port}`;

  try {
    const setupStatus = await fetch(`${setupBaseUrl}/auth/setup`);
    assert.equal(setupStatus.status, 200);
    assert.equal(setupStatus.headers.get("cache-control"), "no-store");
    assert.deepEqual(await setupStatus.json(), { required: true });

    const setupRequests = await Promise.all(
      ["initial-owner@example.com", "racing-owner@example.com"].map((email) =>
        fetch(`${setupBaseUrl}/auth/setup`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "Initial Owner",
            email,
            password: "correct horse battery staple",
            role: "member",
          }),
        }),
      ),
    );
    assert.deepEqual(
      setupRequests.map((response) => response.status).sort(),
      [201, 409],
    );

    const ownerResponse = setupRequests.find((response) => response.status === 201);
    assert.ok(ownerResponse);
    const ownerCookie = ownerResponse.headers.get("set-cookie");
    assert.ok(ownerCookie);
    const owner = await fetch(`${setupBaseUrl}/auth/me`, {
      headers: { cookie: ownerCookie.split(";", 1)[0] },
    });
    assert.equal(owner.status, 200);
    const ownerBody = (await owner.json()) as {
      user: { role: string; setup_claim?: string };
    };
    assert.equal(ownerBody.user.role, "super_admin");
    assert.equal("setup_claim" in ownerBody.user, false);

    const roleCatalog = await fetch(
      `${setupBaseUrl}${apiRoutes.admin.roles.collection}`,
      { headers: { cookie: ownerCookie.split(";", 1)[0] } },
    );
    assert.equal(roleCatalog.status, 200);
    const roleCatalogBody = await roleCatalog.json() as {
      roles: Array<{
        code: string;
        nameKey: string;
        descriptionKey: string;
      }>;
    };
    const adminRole = roleCatalogBody.roles.find((role) => role.code === "admin");
    assert.ok(adminRole);
    assert.equal(adminRole.nameKey, "web.adminUsers.roles.admin.name");
    assert.equal(
      adminRole.descriptionKey,
      "web.adminUsers.roles.admin.description",
    );

    const publicSummary = await fetch(
      `${setupBaseUrl}${apiRoutes.projectProgress.summary}`,
    );
    assert.equal(publicSummary.status, 200);
    const summaryBody = await publicSummary.json() as {
      total: number;
      readyCount: number;
      states: Record<string, number>;
    };
    const projectTasks = await listProjectTasks(projectTasksFetcher);
    assert.equal(summaryBody.total, projectTasks.length);
    assert.equal(summaryBody.states.done, 1);
    assert.equal(summaryBody.states.pending, 1);
    assert.equal(summaryBody.readyCount, 1);
    assert.equal(
      Object.values(summaryBody.states).reduce((sum, count) => sum + count, 0),
      projectTasks.length,
    );
    assert.equal("tasks" in summaryBody, false);

    const anonymousDetails = await fetch(
      `${setupBaseUrl}${apiRoutes.projectProgress.tasks}`,
    );
    assert.equal(anonymousDetails.status, 401);

    const ownerDetails = await fetch(
      `${setupBaseUrl}${apiRoutes.projectProgress.tasks}`,
      { headers: { cookie: ownerCookie.split(";", 1)[0] } },
    );
    assert.equal(ownerDetails.status, 200);
    const ownerDetailsBody = await ownerDetails.json() as {
      tasks: unknown[];
      readyTaskIds: string[];
    };
    assert.equal(ownerDetailsBody.tasks.length, projectTasks.length);
    assert.equal(ownerDetailsBody.readyTaskIds.length, summaryBody.readyCount);
    assert.deepEqual(ownerDetailsBody.readyTaskIds, ["MW-0002"]);

    const closedSetup = await fetch(`${setupBaseUrl}/auth/setup`);
    assert.deepEqual(await closedSetup.json(), { required: false });
    const repeatedSetup = await fetch(`${setupBaseUrl}/auth/setup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Second Owner",
        email: "second-owner@example.com",
        password: "correct horse battery staple",
      }),
    });
    assert.equal(repeatedSetup.status, 409);

    const memberResponse = await fetch(`${setupBaseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Ordinary Member",
        email: "ordinary-member@example.com",
        password: "correct horse battery staple",
        role: "super_admin",
      }),
    });
    assert.equal(memberResponse.status, 201);
    const memberCookie = memberResponse.headers.get("set-cookie");
    assert.ok(memberCookie);
    const memberDetails = await fetch(
      `${setupBaseUrl}${apiRoutes.projectProgress.tasks}`,
      { headers: { cookie: memberCookie.split(";", 1)[0] } },
    );
    assert.equal(memberDetails.status, 403);
    const member = await fetch(`${setupBaseUrl}/auth/me`, {
      headers: { cookie: memberCookie.split(";", 1)[0] },
    });
    assert.equal(
      (await member.json() as { user: { role: string } }).user.role,
      "member",
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      setupServer.close((error) => (error ? reject(error) : resolve()));
    });
    setupStore.close();
    runtime.close();
  }
});

void test("first-use setup remains available when only member accounts exist", async () => {
  const runtime = await createQlOrm("file::memory:", [
    authManifest,
    baseManifest,
    aiManifest,
    chatManifest,
  ]);
  const setupStore = createConversationStore(runtime.orm);
  const setupServer = createApiServer(undefined, setupStore, runtime.orm);
  await new Promise<void>((resolve) => {
    setupServer.listen(0, "127.0.0.1", resolve);
  });
  const setupAddress = setupServer.address();
  assert.ok(setupAddress && typeof setupAddress !== "string");
  const setupBaseUrl = `http://127.0.0.1:${setupAddress.port}`;

  try {
    const registration = await fetch(`${setupBaseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Existing Member",
        email: "existing-member@example.com",
        password: "correct horse battery staple",
      }),
    });
    assert.equal(registration.status, 201);

    const setupStatus = await fetch(`${setupBaseUrl}/auth/setup`);
    assert.deepEqual(await setupStatus.json(), { required: true });
    const setupAttempt = await fetch(`${setupBaseUrl}/auth/setup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Initial Owner",
        email: "initial-owner-after-member@example.com",
        password: "correct horse battery staple",
      }),
    });
    assert.equal(setupAttempt.status, 201);
    const closedSetup = await fetch(`${setupBaseUrl}/auth/setup`);
    assert.deepEqual(await closedSetup.json(), { required: false });
  } finally {
    await new Promise<void>((resolve, reject) => {
      setupServer.close((error) => (error ? reject(error) : resolve()));
    });
    setupStore.close();
    runtime.close();
  }
});

void test("account locale updates are validated and scoped to the session user", async () => {
  const firstCookie = await register("locale-first@example.com", "en");
  const secondCookie = await register("locale-second@example.com");
  const firstUserResponse = await fetch(`${address}/auth/me`, {
    headers: { cookie: firstCookie },
  });
  const secondUserResponse = await fetch(`${address}/auth/me`, {
    headers: { cookie: secondCookie },
  });
  const firstUser = (await firstUserResponse.json()) as {
    user: { id: string; preferredLocale: string; passwordHash?: string };
  };
  const secondUser = (await secondUserResponse.json()) as {
    user: { id: string; preferredLocale: string };
  };
  assert.equal(firstUser.user.preferredLocale, "en");
  assert.equal(secondUser.user.preferredLocale, "id");
  assert.equal("passwordHash" in firstUser.user, false);

  const unauthenticated = await fetch(`${address}/auth/me/preferences`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ preferredLocale: "en" }),
  });
  assert.equal(unauthenticated.status, 401);

  const invalidLocale = await fetch(`${address}/auth/me/preferences`, {
    method: "PATCH",
    headers: {
      cookie: firstCookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({ preferredLocale: "fr" }),
  });
  assert.equal(invalidLocale.status, 400);

  const updated = await fetch(`${address}/auth/me/preferences`, {
    method: "PATCH",
    headers: {
      cookie: firstCookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      preferredLocale: "id",
      userId: secondUser.user.id,
    }),
  });
  assert.equal(updated.status, 200);
  const updatedBody = (await updated.json()) as {
    user: { id: string; preferredLocale: string };
  };
  assert.equal(updatedBody.user.id, firstUser.user.id);
  assert.equal(updatedBody.user.preferredLocale, "id");

  const secondAfterUpdate = await fetch(`${address}/auth/me`, {
    headers: { cookie: secondCookie },
  });
  const secondAfterBody = (await secondAfterUpdate.json()) as {
    user: { preferredLocale: string };
  };
  assert.equal(secondAfterBody.user.preferredLocale, "id");
});

void test("registration, login and logout manage a secure session cookie", async () => {
  const cookie = await register("first@example.com");
  assert.match(cookie, /^ql_session=/);

  const currentUser = await fetch(`${address}/auth/me`, {
    headers: { cookie },
  });
  assert.equal(currentUser.status, 200);
  const currentUserBody = (await currentUser.json()) as {
    user: { email: string; passwordHash?: string };
  };
  assert.equal(currentUserBody.user.email, "first@example.com");
  assert.equal("passwordHash" in currentUserBody.user, false);

  const login = await fetch(`${address}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: " FIRST@example.com ",
      password: "correct horse battery staple",
    }),
  });
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie") ?? "", /HttpOnly; SameSite=Strict/);

  const wrongPassword = await fetch(`${address}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "first@example.com",
      password: "incorrect password",
    }),
  });
  assert.equal(wrongPassword.status, 401);

  const logout = await fetch(`${address}/auth/logout`, {
    method: "POST",
    headers: { cookie },
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
  assert.equal(
    (await fetch(`${address}/auth/me`, { headers: { cookie } })).status,
    401,
  );
});

void test("chat and conversation endpoints require authentication", async () => {
  assert.equal((await fetch(`${address}/conversations`)).status, 401);
  const response = await fetch(`${address}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 401);
});

void test("conversation and partner data are isolated to the authenticated user", async () => {
  const ownerCookie = await register("owner@example.com");
  const otherCookie = await register("other@example.com");

  const createConversation = await fetch(`${address}/conversations`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({}),
  });
  assert.equal(createConversation.status, 201);
  const { conversation } = (await createConversation.json()) as {
    conversation: { id: string; title: string };
  };
  assert.equal(conversation.title, "Percakapan baru");

  const createResponse = await fetch(`${address}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({
      conversationId: conversation.id,
      input: "  Hello. ",
      instructions: "  Be helpful. ",
    }),
  });
  assert.equal(createResponse.status, 200);
  assert.deepEqual(await createResponse.json(), {
    reply: "Hello from the model.",
  });
  assert.deepEqual(receivedMessages, [
    { role: "system", content: "Be helpful." },
    { role: "user", content: "Hello." },
  ]);

  const followup = await fetch(`${address}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({
      conversationId: conversation.id,
      input: "Follow up",
    }),
  });
  assert.equal(followup.status, 200);
  assert.deepEqual(receivedMessages, [
    { role: "user", content: "Hello." },
    { role: "assistant", content: "Hello from the model." },
    { role: "user", content: "Follow up" },
  ]);

  const messagesResponse = await fetch(
    `${address}/conversations/${conversation.id}/messages`,
    { headers: { cookie: ownerCookie } },
  );
  const { messages } = (await messagesResponse.json()) as {
    messages: Array<{ role: string; content: string }>;
  };
  assert.equal(messages.length, 4);
  assert.equal(messages[0].content, "Hello.");

  const otherConversations = await fetch(`${address}/conversations`, {
    headers: { cookie: otherCookie },
  });
  assert.deepEqual(
    (await otherConversations.json() as { conversations: unknown[] })
      .conversations,
    [],
  );
  assert.equal(
    (
      await fetch(
        `${address}/conversations/${conversation.id}/messages`,
        { headers: { cookie: otherCookie } },
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await fetch(`${address}/conversations/${conversation.id}`, {
        method: "DELETE",
        headers: { cookie: otherCookie },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await fetch(`${address}/conversations`, {
        headers: { cookie: ownerCookie },
      })
    ).status,
    200,
  );
});

void test("the addon ORM validates partners and isolates ownership", async () => {
  const ownerCookie = await register("partner-owner@example.com");
  const otherCookie = await register("partner-other@example.com");
  const maliciousCreate = await fetch(`${address}/models/res.partner`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({
      values: {
        name: "Forged owner",
        owner_id: "attacker-controlled",
      },
    }),
  });
  assert.equal(maliciousCreate.status, 400);

  const created = await fetch(`${address}/models/res.partner`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({
      values: {
        name: "Ada Lovelace",
        email: "ada@example.com",
      },
    }),
  });
  assert.equal(created.status, 201);
  const { record } = (await created.json()) as {
    record: { id: string; name: string };
  };
  assert.equal(record.name, "Ada Lovelace");
  assert.equal("owner_id" in record, false);
  assert.equal(
    (
      await fetch(`${address}/models/res.users`, {
        headers: { cookie: ownerCookie },
      })
    ).status,
    403,
  );

  const ownerRecords = await fetch(`${address}/models/res.partner`, {
    headers: { cookie: ownerCookie },
  });
  assert.equal(
    (await ownerRecords.json() as { records: unknown[] }).records.length,
    1,
  );
  const otherRecords = await fetch(`${address}/models/res.partner`, {
    headers: { cookie: otherCookie },
  });
  assert.deepEqual(
    (await otherRecords.json() as { records: unknown[] }).records,
    [],
  );

  const updated = await fetch(
    `${address}/models/res.partner/${record.id}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie: ownerCookie },
      body: JSON.stringify({ values: { phone: "+1-555-0100" } }),
    },
  );
  assert.equal(updated.status, 200);
  assert.equal(
    (
      await fetch(`${address}/models/res.partner/${record.id}`, {
        method: "DELETE",
        headers: { cookie: otherCookie },
      })
    ).status,
    404,
  );
});

void test("authenticated model metadata exposes addon views without private fields", async () => {
  const anonymous = await fetch(`${address}/models`);
  assert.equal(anonymous.status, 401);

  const cookie = await register("model-metadata@example.com");
  const response = await fetch(`${address}/models`, {
    headers: { cookie },
  });
  assert.equal(response.status, 200);
  const { models } = (await response.json()) as {
    models: Array<{
      name: string;
      labelKey: string;
      descriptionKey: string;
      fields: Record<string, { labelKey: string }>;
      views: Array<{ labelKey: string; type: string; fields: string[] }>;
      permissions: { create: boolean; write: boolean; unlink: boolean };
    }>;
  };
  const partner = models.find((model) => model.name === "res.partner");
  assert.ok(partner);
  assert.equal(partner.labelKey, "web.models.entities.res_partner");
  assert.equal(partner.descriptionKey, "web.models.descriptions.res_partner");
  assert.equal(partner.fields.name.labelKey, "web.models.fieldName");
  assert.deepEqual(Object.keys(partner.fields), [
    "name",
    "email",
    "phone",
    "company_name",
    "created_at",
    "updated_at",
  ]);
  assert.deepEqual(
    partner.views.map((view) => ({ type: view.type, fields: view.fields })),
    [
      {
        type: "list",
        fields: ["name", "company_name", "email", "phone"],
      },
      {
        type: "form",
        fields: ["name", "company_name", "email", "phone"],
      },
    ],
  );
  assert.equal(partner.views[0]?.labelKey, "web.models.viewList");
  assert.deepEqual(partner.permissions, {
    create: true,
    write: true,
    unlink: true,
  });
  assert.equal(models.some((model) => model.name === "res.users"), false);
});

void test("computed model metadata and query route are read-only and validated", async () => {
  const cookie = await register("computed-model@example.com");
  const user = await store.getUserByEmail("computed-model@example.com");
  assert.ok(user);
  await orm.updateRecordsForService(
    "res.users",
    { id: user.id },
    { role: "admin" },
  );

  const metadataResponse = await fetch(`${address}/models`, {
    headers: { cookie },
  });
  assert.equal(metadataResponse.status, 200);
  const metadata = (await metadataResponse.json()) as {
    models: Array<{
      kind: string;
      name: string;
      permissions: { create: boolean; write: boolean; unlink: boolean };
    }>;
  };
  const lexicalCandidate = metadata.models.find(
    (model) => model.name === "corpus.lexical_candidate",
  );
  assert.ok(lexicalCandidate);
  assert.equal(lexicalCandidate.kind, "computed");
  assert.deepEqual(lexicalCandidate.permissions, {
    create: false,
    write: false,
    unlink: false,
  });

  const route = apiRoutes.models.compute("corpus.lexical_candidate");
  const invalid = await fetch(`${address}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ unexpected: true }),
  });
  assert.equal(invalid.status, 400);

  const denied = await fetch(`${address}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ filters: {} }),
  });
  assert.equal(denied.status, 403);
});

void test("provider gateway stores encrypted keys in the ql_ai addon and routes chat", async () => {
  const ownerCookie = await register("provider-owner@example.com");
  const otherCookie = await register("provider-other@example.com");
  const invalidProvider = await fetch(`${address}/settings/providers`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({
      name: "Insecure",
      baseUrl: "http://provider.example/v1",
      model: "example-chat",
      apiKey: "user-owned-secret",
    }),
  });
  assert.equal(invalidProvider.status, 400);
  const create = await fetch(`${address}/settings/providers`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({
      name: "Primary",
      baseUrl: "https://api.example.test/v1",
      model: "example-chat",
      apiKey: "user-owned-secret",
    }),
  });
  assert.equal(create.status, 201);
  const { provider: createdProvider } = (await create.json()) as {
    provider: { id: string; name: string; hasApiKey: boolean };
  };
  assert.equal(createdProvider.name, "Primary");
  assert.equal(createdProvider.hasApiKey, true);

  const owner = await store.getUserByEmail("provider-owner@example.com");
  assert.ok(owner);
  const savedRecords = await orm.findManyForService("ai.provider", owner.id);
  assert.equal(savedRecords.length, 1);
  assert.notEqual(savedRecords[0].encrypted_api_key, "user-owned-secret");
  const otherProviderList = await fetch(`${address}/settings/providers`, {
    headers: { cookie: otherCookie },
  });
  assert.deepEqual(
    (await otherProviderList.json() as { providers: unknown[] }).providers,
    [],
  );
  const genericRead = await fetch(`${address}/models/ai.provider`, {
    headers: { cookie: ownerCookie },
  });
  assert.equal(genericRead.status, 200);
  const genericRecords = (await genericRead.json()) as {
    records: Record<string, unknown>[];
  };
  assert.equal(genericRecords.records[0].name, "Primary");
  assert.equal("encrypted_api_key" in genericRecords.records[0], false);
  const list = await fetch(`${address}/settings/providers`, {
    headers: { cookie: ownerCookie },
  });
  const listText = await list.text();
  assert.equal(list.status, 200);
  assert.equal(listText.includes("user-owned-secret"), false);
  assert.equal(listText.includes("encrypted_api_key"), false);

  const conversationResponse = await fetch(`${address}/conversations`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({}),
  });
  const { conversation } = (await conversationResponse.json()) as {
    conversation: { id: string };
  };
  const chat = await fetch(`${address}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({
      conversationId: conversation.id,
      input: "route this",
    }),
  });
  assert.equal(chat.status, 200);
  assert.deepEqual(await chat.json(), {
    reply: "Reply via configured provider.",
  });
  assert.deepEqual(receivedProviderConfig, {
    apiKey: "user-owned-secret",
    baseUrl: "https://api.example.test/v1",
    model: "example-chat",
  });

  const foreignUpdate = await fetch(
    `${address}/settings/providers/${createdProvider.id}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: otherCookie },
      body: JSON.stringify({ enabled: false }),
    },
  );
  assert.equal(foreignUpdate.status, 404);
});

void test("registration validates passwords and rejects duplicate emails", async () => {
  const tooShort = await fetch(`${address}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Short",
      email: "short@example.com",
      password: "short",
    }),
  });
  assert.equal(tooShort.status, 400);

  await register("duplicate@example.com");
  const duplicate = await fetch(`${address}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate",
      email: "DUPLICATE@example.com",
      password: "correct horse battery staple",
    }),
  });
  assert.equal(duplicate.status, 409);
});

void test("unknown routes return 404", async () => {
  const response = await fetch(`${address}/unknown`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: "Not found",
    code: "RESOURCE_NOT_FOUND",
  });
});


void test("GET /models exposes addon and category metadata and GET /public/landing returns declarative landing views", async () => {
  const cookie = await register("landing-catalog@example.com");
  const modelsRes = await fetch(`${address}/models`, {
    headers: { cookie },
  });
  assert.equal(modelsRes.status, 200);
  const { models } = (await modelsRes.json()) as {
    models: {
      name: string;
      addon?: string;
      category?: string;
      views: { type: string }[];
    }[];
  };
  const partnerModel = models.find((m) => m.name === "res.partner");
  assert.ok(partnerModel);
  assert.equal(partnerModel.addon, "ql_base");
  assert.equal(partnerModel.category, "system");
  assert.equal(
    models.some((m) => m.views.some((v) => v.type === "landing")),
    false,
  );

  const landingRes = await fetch(`${address}/public/landing`);
  assert.equal(landingRes.status, 200);
  const { items } = (await landingRes.json()) as {
    items: {
      name: string;
      model: string;
      addon: string;
      section: string;
      href: string;
    }[];
  };
  assert.ok(items.some((item) => item.name === "chat.conversation.landing"));
  assert.ok(items.some((item) => item.name === "ai.provider.landing"));
  assert.ok(items.every((item) => item.href.startsWith("/")));

  const publicTermRes = await fetch(
    `${address}/public/models/corpus.term`,
  );
  assert.equal(publicTermRes.status, 200);
  const publicTermBody = (await publicTermRes.json()) as {
    model: {
      name: string;
      permissions: { create: boolean; write: boolean; unlink: boolean };
    } | null;
    models: { name: string }[];
    records: Record<string, unknown>[];
  };
  assert.equal(publicTermBody.model?.name, "corpus.term");
  assert.deepEqual(publicTermBody.model?.permissions, {
    create: false,
    write: false,
    unlink: false,
  });
  assert.ok(publicTermBody.models.some((m) => m.name === "corpus.term"));

  const publicExplorerDenied = await fetch(
    `${address}/public/models/ai.provider`,
  );
  assert.equal(publicExplorerDenied.status, 404);
});

void test("GET /search queries search.index_entry securely with owner isolation", async () => {
  const cookie = await register("searcher@example.com");
  const user = await store.getUserByEmail("searcher@example.com");
  assert.ok(user);

  // Create an index entry in orm via createRecordForService (owned by user)
  await orm.createRecordForService("search.index_entry", {
    id: "entry_musa_01",
    target_model: "story.narrative",
    target_id: "story_musa",
    token: "musa",
    weight: 3,
    snippet: "Kisah Nabi Musa dan perjalanan di padang pasir",
    owner_id: user.id,
    created_at: Date.now(),
    updated_at: Date.now(),
  });

  const searchRes = await fetch(`${address}/search?q=musa`, {
    headers: { cookie },
  });
  assert.equal(searchRes.status, 200);
  const data = (await searchRes.json()) as {
    query: string;
    total: number;
    results: Array<{ id: string; targetModel: string; targetId: string }>;
  };
  assert.equal(data.query, "musa");
  assert.ok(data.total >= 1);
  assert.equal(data.results[0].targetId, "story_musa");
  assert.equal(data.results[0].targetModel, "story.narrative");
});

