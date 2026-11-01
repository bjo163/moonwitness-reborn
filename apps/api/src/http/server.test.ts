import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AgentMessage, ModelProvider } from "@moonwitness/agent-runtime";
import {
  createConversationStore,
  type ConversationStore,
} from "@moonwitness/database";
import { createQlOrm, type QlOrm } from "ql_orm";
import aiManifest from "ql_ai/__manifest__";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import { hashVerificationToken } from "../auth/auth.js";
import type { MailSender, PasswordResetMail } from "../mail/mailer.js";
import { createApiServer } from "./server.js";

let server: ReturnType<typeof createApiServer>;
let address: string;
let store: ConversationStore;
let orm: QlOrm;
let closeOrm: () => void;
let receivedMessages: readonly AgentMessage[] = [];
let receivedProviderConfig: { apiKey: string; model: string } | undefined;
const providerEncryptionKey = Buffer.alloc(32, 7);

before(async () => {
  const ormRuntime = await createQlOrm("file::memory:", [
    authManifest,
    baseManifest,
    aiManifest,
    chatManifest,
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

async function register(email: string): Promise<string> {
  const response = await fetch(`${address}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email,
      password: "correct horse battery staple",
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
      fields: Record<string, unknown>;
      views: Array<{ type: string; fields: string[] }>;
      permissions: { create: boolean; write: boolean; unlink: boolean };
    }>;
  };
  const partner = models.find((model) => model.name === "res.partner");
  assert.ok(partner);
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
  assert.deepEqual(partner.permissions, {
    create: true,
    write: true,
    unlink: true,
  });
  assert.equal(models.some((model) => model.name === "res.users"), false);
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
  assert.deepEqual(await response.json(), { error: "Not found" });
});

type JsonReply = { status: number; body: Record<string, unknown> };

async function postJson(
  base: string,
  path: string,
  payload: unknown,
  cookie?: string,
): Promise<JsonReply> {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

async function mailServer(mailer: MailSender | undefined) {
  const app = createApiServer(undefined, store, orm, {
    encryptionKey: providerEncryptionKey,
    appBaseUrl: "https://web.test",
    ...(mailer ? { mail: mailer } : {}),
  });
  await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
  const info = app.address();
  assert.ok(info && typeof info !== "string");
  return {
    base: `http://127.0.0.1:${info.port}`,
    stop: () =>
      new Promise<void>((resolve, reject) => {
        app.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

function recordingMailer() {
  const sent: PasswordResetMail[] = [];
  const mailer: MailSender = {
    sendPasswordReset(mail) {
      sent.push(mail);
      return Promise.resolve();
    },
    close() {},
  };
  return { sent, mailer };
}

async function registerAt(
  base: string,
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(`${base}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Reset User", email, password }),
  });
  assert.equal(response.status, 201);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

void test("forgot-password has one response shape with and without mail", async () => {
  const app = await mailServer(undefined);
  try {
    await registerAt(app.base, "member@example.com", "correct horse battery staple");
    const unknown = await postJson(app.base, "/auth/forgot-password", {
      email: "ghost@example.com",
    });
    const existing = await postJson(app.base, "/auth/forgot-password", {
      email: "member@example.com",
    });
    assert.deepEqual(unknown, { status: 200, body: { sent: false } });
    assert.deepEqual(existing, { status: 200, body: { sent: false } });

    const malformed = await postJson(app.base, "/auth/forgot-password", {
      email: 42,
    });
    assert.equal(malformed.status, 400);
    const noBody = await fetch(`${app.base}/auth/forgot-password`, { method: "POST" });
    assert.equal(noBody.status, 400);
  } finally {
    await app.stop();
  }
});

void test("forgot-password sends one single-use link per cooldown window", async () => {
  const { sent, mailer } = recordingMailer();
  const app = await mailServer(mailer);
  try {
    await registerAt(app.base, "linked@example.com", "correct horse battery staple");
    const first = await postJson(app.base, "/auth/forgot-password", {
      email: " LINKED@example.com ",
    });
    assert.deepEqual(first, { status: 200, body: { sent: true } });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "linked@example.com");
    assert.equal(sent[0].name, "Reset User");
    assert.equal(sent[0].ttlMinutes, 30);
    const token = new URL(sent[0].resetUrl).searchParams.get("token") ?? "";
    assert.match(token, /^[A-Za-z0-9_-]{40,50}$/);
    assert.ok(sent[0].resetUrl.startsWith("https://web.test/"));

    const stored = await store.findVerification(
      "password_reset",
      hashVerificationToken(token),
    );
    assert.ok(stored);
    assert.equal(stored.tokenHash, hashVerificationToken(token));
    assert.ok(!stored.tokenHash.includes(token));

    const second = await postJson(app.base, "/auth/forgot-password", {
      email: "linked@example.com",
    });
    assert.deepEqual(second, { status: 200, body: { sent: false } });
    assert.equal(sent.length, 1);
  } finally {
    await app.stop();
  }
});

void test("reset-password rotates the credential and revokes active sessions", async () => {
  const { sent, mailer } = recordingMailer();
  const app = await mailServer(mailer);
  const password = "correct horse battery staple";
  const replacement = "brand new battery horse correct";
  try {
    const cookie = await registerAt(app.base, "rotate@example.com", password);
    await postJson(app.base, "/auth/forgot-password", { email: "rotate@example.com" });
    const token = new URL(sent[0].resetUrl).searchParams.get("token") ?? "";

    const weak = await postJson(app.base, "/auth/reset-password", {
      token,
      password: "short",
    });
    assert.equal(weak.status, 400);
    assert.ok(await store.findVerification("password_reset", hashVerificationToken(token)));

    const done = await postJson(app.base, "/auth/reset-password", {
      token,
      password: replacement,
    });
    assert.deepEqual(done, { status: 200, body: { reset: true } });
    assert.equal(
      await store.findVerification("password_reset", hashVerificationToken(token)),
      undefined,
    );

    const replay = await postJson(app.base, "/auth/reset-password", {
      token,
      password: replacement,
    });
    assert.equal(replay.status, 400);

    const staleSession = await fetch(`${app.base}/auth/me`, {
      headers: { cookie },
    });
    assert.equal(staleSession.status, 401);

    assert.equal(
      (await postJson(app.base, "/auth/login", { email: "rotate@example.com", password }))
        .status,
      401,
    );
    assert.equal(
      (await postJson(app.base, "/auth/login", {
        email: "rotate@example.com",
        password: replacement,
      })).status,
      200,
    );
  } finally {
    await app.stop();
  }
});

void test("reset-password rejects malformed, expired and cross-purpose tokens", async () => {
  const app = await mailServer(undefined);
  try {
    const user = await store.createUser({
      name: "Seeded",
      email: "seeded@example.com",
      passwordHash: "scrypt$salt$hash",
    });
    const expiredToken = "expiredexpiredexpiredexpiredexpiredexpiredexp";
    await store.createVerification({
      userId: user.id,
      purpose: "password_reset",
      tokenHash: hashVerificationToken(expiredToken),
      expiresAt: new Date(Date.now() - 1_000),
    });
    const otherPurposeToken = "verifyingverifyingverifyingverifyingverify1";
    await store.createVerification({
      userId: user.id,
      purpose: "email_verify",
      tokenHash: hashVerificationToken(otherPurposeToken),
      expiresAt: new Date(Date.now() + 60_000),
    });

    for (const token of ["abc", expiredToken, otherPurposeToken]) {
      const reply = await postJson(app.base, "/auth/reset-password", {
        token,
        password: "a brand new long password",
      });
      assert.equal(reply.status, 400);
    }
    // Rejected attempts must not consume the row they could not use.
    assert.ok(await store.findVerification("email_verify", hashVerificationToken(otherPurposeToken)));
    const stillExpired = await store.findVerification(
      "password_reset",
      hashVerificationToken(expiredToken),
    );
    assert.ok(stillExpired);
    assert.equal(stillExpired.userId, user.id);
    assert.ok(stillExpired.expiresAt.getTime() <= Date.now());
    const leaked = await postJson(app.base, "/auth/reset-password", { password: "x" });
    assert.equal(leaked.status, 400);
  } finally {
    await app.stop();
  }
});

void test("a failed SMTP send leaves no usable token", async () => {
  const failing: MailSender = {
    sendPasswordReset() {
      return Promise.reject(new Error("535 authentication failed"));
    },
    close() {},
  };
  const app = await mailServer(failing);
  try {
    await registerAt(app.base, "undelivered@example.com", "correct horse battery staple");
    const reply = await postJson(app.base, "/auth/forgot-password", {
      email: "undelivered@example.com",
    });
    assert.deepEqual(reply, { status: 200, body: { sent: false } });
    const user = await store.getUserByEmail("undelivered@example.com");
    assert.ok(user);
    assert.deepEqual(
      await store.findLatestVerification(user.id, "password_reset"),
      undefined,
    );
  } finally {
    await app.stop();
  }
});
