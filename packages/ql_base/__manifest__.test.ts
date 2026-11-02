import assert from "node:assert/strict";
import test from "node:test";
import { createQlOrm } from "ql_orm";
import baseManifest from "./__manifest__.js";

const user = { id: "user-1", groups: ["user"] };
const admin = { id: "admin-1", groups: ["admin"] };
const viewer = { id: "viewer-1", groups: ["viewer"] };
const OPS = ["read", "write", "create", "unlink"] as const;

void test("ql_base manifest registers all five models with expected ownership", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest]);
  try {
    const names = runtime.orm.registry
      .getModels()
      .map((m) => m.name)
      .sort();
    assert.deepEqual(names, [
      "community.beneficial_deed",
      "community.circle_reflection",
      "community.study_circle",
      "ir.model.data",
      "res.partner",
    ]);

    const deed = runtime.orm.registry.getModel("community.beneficial_deed");
    assert.equal(deed.ownerField, undefined, "beneficial_deed is a shared public ledger");

    const circle = runtime.orm.registry.getModel("community.study_circle");
    assert.equal(circle.ownerField, "owner_id");

    const reflection = runtime.orm.registry.getModel("community.circle_reflection");
    assert.equal(reflection.ownerField, "author_id");

    const partner = runtime.orm.registry.getModel("res.partner");
    assert.equal(partner.ownerField, "owner_id");
  } finally {
    runtime.close();
  }
});

void test("res.partner is fully CRUD for users and owner-scoped", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest]);
  try {
    for (const op of OPS) {
      assert.equal(runtime.orm.registry.can("res.partner", ["user"], op), true);
    }
    const created = await runtime.orm.create("res.partner", user, { name: "Ada" });
    assert.equal(created.name, "Ada");
    assert.equal("owner_id" in created, false);

    const otherUser = { id: "user-2", groups: ["user"] };
    assert.deepEqual(await runtime.orm.findMany("res.partner", otherUser), []);
    assert.equal(
      await runtime.orm.update("res.partner", otherUser, String(created.id), { name: "X" }),
      undefined,
    );
    assert.equal(
      await runtime.orm.delete("res.partner", otherUser, String(created.id)),
      false,
    );
  } finally {
    runtime.close();
  }
});

void test("community.beneficial_deed is read-only for users and admin-create only", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest]);
  try {
    for (const op of OPS) {
      assert.equal(
        runtime.orm.registry.can("community.beneficial_deed", ["user"], op),
        op === "read",
      );
    }
    assert.equal(
      runtime.orm.registry.can("community.beneficial_deed", ["admin"], "create"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("community.beneficial_deed", ["admin"], "write"),
      false,
    );

    await assert.rejects(
      () =>
        runtime.orm.create("community.beneficial_deed", user, {
          deed_kind: "typo_correction",
          target_model: "corpus.passage",
          target_id: "1",
          summary: "x",
          proof_hash: "a".repeat(64),
          is_anonymous: false,
          contributor_id: user.id,
        }),
      Error,
    );

    const created = await runtime.orm.create("community.beneficial_deed", admin, {
      deed_kind: "typo_correction",
      target_model: "corpus.passage",
      target_id: "1",
      summary: "x",
      proof_hash: "a".repeat(64),
      is_anonymous: false,
      contributor_id: user.id,
    });
    assert.equal(created.deed_kind, "typo_correction");

    const listed = await runtime.orm.findMany("community.beneficial_deed", viewer);
    assert.equal(listed.length, 1);
  } finally {
    runtime.close();
  }
});

void test("community.study_circle is admin-managed and user-create only", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest]);
  try {
    assert.equal(
      runtime.orm.registry.can("community.study_circle", ["user"], "create"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("community.study_circle", ["user"], "write"),
      false,
    );
    assert.equal(
      runtime.orm.registry.can("community.study_circle", ["admin"], "write"),
      true,
    );

    const created = await runtime.orm.create("community.study_circle", user, {
      title: "Circle 1",
      description: "desc",
      surah_number: 1,
      ayah_range: "1:1-5",
      status: "active",
      max_members: 12,
    });
    assert.equal(created.title, "Circle 1");

    const otherUser = { id: "user-2", groups: ["user"] };
    assert.deepEqual(await runtime.orm.findMany("community.study_circle", otherUser), []);
  } finally {
    runtime.close();
  }
});

void test("community.circle_reflection is author-scoped and admin-managed", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest]);
  try {
    assert.equal(
      runtime.orm.registry.can("community.circle_reflection", ["user"], "write"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("community.circle_reflection", ["user"], "create"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("community.circle_reflection", ["admin"], "unlink"),
      true,
    );

    const created = await runtime.orm.create("community.circle_reflection", user, {
      circle_id: "circle-1",
      passage_locator: "1:1",
      content: "reflection",
      moderation_status: "approved",
    });
    assert.equal(created.content, "reflection");

    const otherUser = { id: "user-2", groups: ["user"] };
    assert.deepEqual(
      await runtime.orm.findMany("community.circle_reflection", otherUser),
      [],
    );
  } finally {
    runtime.close();
  }
});