import assert from "node:assert/strict";
import test from "node:test";
import { createQlOrm } from "ql_orm";
import { stubAddonManifest } from "ql_orm/testing";
import authManifest from "ql_auth/__manifest__";
import chatManifest from "./__manifest__.js";

const user = { id: "user-1", groups: ["user"] };
const OPS = ["read", "write", "create", "unlink"] as const;

function boot() {
  return createQlOrm("file::memory:", [
    stubAddonManifest("ql_base"),
    authManifest,
    chatManifest,
  ]);
}

void test("ql_chat manifest registers all four models with expected ownership", async () => {
  const runtime = await boot();
  try {
    const names = runtime.orm.registry
      .getModels()
      .filter((m) => m.name.startsWith("chat."))
      .map((m) => m.name)
      .sort();
    assert.deepEqual(names, [
      "chat.citation",
      "chat.citation_verification",
      "chat.conversation",
      "chat.message",
    ]);

    const conversation = runtime.orm.registry.getModel("chat.conversation");
    assert.equal(conversation.ownerField, "user_id");
    assert.equal(conversation.fields.user_id.private, true);

    const message = runtime.orm.registry.getModel("chat.message");
    assert.equal(message.ownerField, undefined);
    assert.equal(message.fields.grounding_status.private, true);

    assert.equal(chatManifest.data.length, 0);
  } finally {
    runtime.close();
  }
});

void test("chat.conversation is owner-scoped and user-managed", async () => {
  const runtime = await boot();
  try {
    for (const op of OPS) {
      assert.equal(runtime.orm.registry.can("chat.conversation", ["user"], op), true);
    }
    const created = await runtime.orm.create("chat.conversation", user, {
      title: "Session 1",
    });
    assert.equal(created.title, "Session 1");
    assert.equal("user_id" in created, false);

    const otherUser = { id: "user-2", groups: ["user"] };
    assert.deepEqual(await runtime.orm.findMany("chat.conversation", otherUser), []);
    assert.equal(
      await runtime.orm.update("chat.conversation", otherUser, String(created.id), {
        title: "X",
      }),
      undefined,
    );
  } finally {
    runtime.close();
  }
});

void test("chat.message and chat.citation are service-only for users", async () => {
  const runtime = await boot();
  try {
    for (const op of OPS) {
      assert.equal(runtime.orm.registry.can("chat.message", ["user"], op), false);
      assert.equal(runtime.orm.registry.can("chat.citation", ["user"], op), false);
    }
    await assert.rejects(
      () =>
        runtime.orm.create("chat.message", user, {
          conversation_id: "c-1",
          role: "user",
          content: "hi",
        }),
      Error,
    );
  } finally {
    runtime.close();
  }
});

void test("chat.citation_verification is read-only for users and admin-managed", async () => {
  const runtime = await boot();
  try {
    assert.equal(
      runtime.orm.registry.can("chat.citation_verification", ["user"], "read"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("chat.citation_verification", ["user"], "write"),
      false,
    );
    assert.equal(
      runtime.orm.registry.can("chat.citation_verification", ["admin"], "create"),
      true,
    );

    const created = await runtime.orm.createForService(
      "chat.citation_verification",
      user.id,
      {
        message_id: "msg-1",
        surah: 1,
        ayah: 1,
        verification_status: "verified",
      },
    );
    assert.equal(created.verification_status, "verified");

    const listed = await runtime.orm.findMany("chat.citation_verification", user);
    assert.equal(listed.length, 1);
  } finally {
    runtime.close();
  }
});