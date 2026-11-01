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
