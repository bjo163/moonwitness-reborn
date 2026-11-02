import assert from "node:assert/strict";
import test from "node:test";
import { QlAccessError, createQlOrm } from "ql_orm";
import { stubAddonManifest } from "ql_orm/testing";
import authManifest from "ql_auth/__manifest__";
import chatManifest from "../__manifest__.js";

const baseStub = stubAddonManifest("ql_base");
const user = { id: "user-1", groups: ["user"] };
const otherUser = { id: "user-2", groups: ["user"] };

function boot() {
  return createQlOrm("file::memory:", [baseStub, authManifest, chatManifest]);
}

void test("chat.conversation is registered with owner scope and full user ACL", async () => {
  const runtime = await boot();
  try {
    const models = runtime.orm.registry
      .getModels()
      .filter((model) => model.name === "chat.conversation");
    assert.equal(models.length, 1);
    assert.equal(models[0].ownerField, "user_id");
    assert.equal(
      runtime.orm.registry.can("chat.conversation", ["user"], "read"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("chat.conversation", ["user"], "create"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("chat.conversation", ["user"], "write"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("chat.conversation", ["user"], "unlink"),
      true,
    );
    assert.equal(chatManifest.depends.includes("ql_auth"), true);
  } finally {
    runtime.close();
  }
});

void test("chat.conversation enforces owner isolation between users", async () => {
  const runtime = await boot();
  try {
    const created = await runtime.orm.create("chat.conversation", user, {
      title: "Tafsir",
    });
    assert.equal(created.title, "Tafsir");
    assert.equal("user_id" in created, false);

    assert.deepEqual(
      await runtime.orm.findMany("chat.conversation", otherUser),
      [],
    );
    assert.equal(
      await runtime.orm.update(
        "chat.conversation",
        otherUser,
        String(created.id),
        { title: "Tampered" },
      ),
      undefined,
    );
    assert.equal(
      await runtime.orm.delete(
        "chat.conversation",
        otherUser,
        String(created.id),
      ),
      false,
    );

    const mine = await runtime.orm.findMany("chat.conversation", user);
    assert.equal(mine.length, 1);
    assert.equal(mine[0].title, "Tafsir");
  } finally {
    runtime.close();
  }
});

void test("chat.message is invisible and unwritable through user CRUD", async () => {
  const runtime = await boot();
  try {
    const models = runtime.orm.registry
      .getModels()
      .filter((model) => model.name === "chat.message");
    assert.equal(models.length, 1);

    assert.equal(
      runtime.orm.registry.can("chat.message", ["user"], "read"),
      false,
    );
    assert.equal(
      runtime.orm.registry.can("chat.message", ["user"], "create"),
      false,
    );
    assert.equal(
      runtime.orm.registry.can("chat.message", ["user"], "write"),
      false,
    );
    assert.equal(
      runtime.orm.registry.can("chat.message", ["user"], "unlink"),
      false,
    );

    await assert.rejects(
      () => runtime.orm.findMany("chat.message", user),
      QlAccessError,
    );
    await assert.rejects(
      () =>
        runtime.orm.create("chat.message", user, {
          conversation_id: "conversation-1",
          role: "user",
          content: "Salam",
        }),
      QlAccessError,
    );
  } finally {
    runtime.close();
  }
});
