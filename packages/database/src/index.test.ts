import assert from "node:assert/strict";
import test from "node:test";
import { createQlOrm } from "ql_orm";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import { createConversationStore } from "./index.js";

async function createStore() {
  const runtime = await createQlOrm("file::memory:", [
    authManifest,
    baseManifest,
    chatManifest,
  ]);
  return {
    store: createConversationStore(runtime.orm),
    close: runtime.close,
  };
}

void test("conversation store persists ordered messages and deletes cascaded rows", async () => {
  const { store, close } = await createStore();
  try {
    const user = await store.createUser({
      name: "Test User",
      email: "test@example.com",
      passwordHash: "scrypt$salt$hash",
    });
    const otherUser = await store.createUser({
      name: "Other User",
      email: "other@example.com",
      passwordHash: "scrypt$salt$hash",
    });
    const conversation = await store.createConversation(user.id);
    const userMessage = await store.addMessage(
      conversation.id,
      user.id,
      "user",
      "Hello",
    );
    await store.addMessage(
      conversation.id,
      user.id,
      "assistant",
      "Hi there",
    );

    const messages = await store.getMessages(conversation.id, user.id);
    assert.deepEqual(
      messages.map(({ role, content }) => ({ role, content })),
      [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
    );
    assert.equal(
      (await store.getConversation(conversation.id, user.id))?.title,
      "Hello",
    );
    assert.deepEqual(await store.listConversations(otherUser.id), []);
    assert.equal(
      await store.getConversation(conversation.id, otherUser.id),
      undefined,
    );
    assert.deepEqual(
      await store.getMessages(conversation.id, otherUser.id),
      [],
    );
    assert.equal(
      await store.deleteConversation(conversation.id, otherUser.id),
      false,
    );
    assert.equal(
      await store.deleteConversation(conversation.id, user.id),
      true,
    );
    assert.deepEqual(await store.getMessages(conversation.id, user.id), []);
    assert.equal(userMessage.conversationId, conversation.id);
  } finally {
    store.close();
    close();
  }
});

void test("session lookup rejects expired tokens", async () => {
  const { store, close } = await createStore();
  try {
    const user = await store.createUser({
      name: "Test User",
      email: "session@example.com",
      passwordHash: "scrypt$salt$hash",
    });
    await store.createSession(
      user.id,
      "token-hash",
      new Date(Date.now() - 1_000),
    );
    assert.equal(await store.getSessionUser("token-hash"), undefined);
  } finally {
    store.close();
    close();
  }
});

void test("verification tokens are single-use and isolated per user", async () => {
  const { store, close } = await createStore();
  try {
    const user = await store.createUser({
      name: "Test User",
      email: "verify@example.com",
      passwordHash: "scrypt$salt$hash",
    });
    const other = await store.createUser({
      name: "Other User",
      email: "verify2@example.com",
      passwordHash: "scrypt$salt$hash",
    });
    const expiresAt = new Date(Date.now() + 60_000);
    await store.createVerification({
      userId: user.id,
      purpose: "password_reset",
      tokenHash: "hash-first",
      expiresAt,
    });
    await store.createVerification({
      userId: other.id,
      purpose: "password_reset",
      tokenHash: "hash-other",
      expiresAt,
    });

    assert.equal(
      (await store.findVerification("password_reset", "hash-first"))?.userId,
      user.id,
    );
    assert.equal(
      await store.findVerification("email_verify", "hash-first"),
      undefined,
    );
    assert.equal(
      await store.findVerification("password_reset", "unknown"),
      undefined,
    );

    assert.equal(await store.claimVerification("hash-first"), true);
    assert.equal(await store.claimVerification("hash-first"), false);
    assert.equal(
      await store.findVerification("password_reset", "hash-first"),
      undefined,
    );
    assert.equal(await store.claimVerification("hash-other"), true);
  } finally {
    store.close();
    close();
  }
});

void test("latest verification lookup returns the newest record", async () => {
  const { store, close } = await createStore();
  try {
    const user = await store.createUser({
      name: "Test User",
      email: "latest@example.com",
      passwordHash: "scrypt$salt$hash",
    });
    const expiresAt = new Date(Date.now() + 60_000);
    await store.createVerification({
      userId: user.id,
      purpose: "password_reset",
      tokenHash: "hash-old",
      expiresAt,
    });
    await store.createVerification({
      userId: user.id,
      purpose: "password_reset",
      tokenHash: "hash-new",
      expiresAt,
    });

    assert.equal(
      (await store.findLatestVerification(user.id, "password_reset"))?.tokenHash,
      "hash-new",
    );
    assert.deepEqual(
      await store.findLatestVerification(user.id, "email_verify"),
      undefined,
    );

    await store.deleteVerifications(user.id, "password_reset");
    assert.deepEqual(
      await store.findLatestVerification(user.id, "password_reset"),
      undefined,
    );
  } finally {
    store.close();
    close();
  }
});

void test("password changes apply once and sessions can be revoked per user", async () => {
  const { store, close } = await createStore();
  try {
    const user = await store.createUser({
      name: "Test User",
      email: "rotate@example.com",
      passwordHash: "scrypt$salt$old",
    });
    const other = await store.createUser({
      name: "Other User",
      email: "rotate2@example.com",
      passwordHash: "scrypt$salt$keep",
    });
    await store.createSession(
      user.id,
      "user-session-hash",
      new Date(Date.now() + 60_000),
    );
    await store.createSession(
      other.id,
      "other-session-hash",
      new Date(Date.now() + 60_000),
    );

    assert.equal(await store.setPasswordHash(user.id, "scrypt$salt$new"), true);
    assert.equal((await store.getUserById(user.id))?.passwordHash, "scrypt$salt$new");
    assert.equal(await store.setPasswordHash("missing-user", "scrypt$salt$x"), false);

    await store.deleteSessionsForUser(user.id);
    assert.equal(await store.getSessionUser("user-session-hash"), undefined);
    assert.ok(await store.getSessionUser("other-session-hash"));
  } finally {
    store.close();
    close();
  }
});
