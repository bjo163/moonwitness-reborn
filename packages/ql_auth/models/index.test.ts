import assert from "node:assert/strict";
import test from "node:test";
import {
  QlAccessError,
  QlConflictError,
  createQlOrm,
  type QlAddonManifest,
} from "ql_orm";
import authManifest from "../__manifest__.js";

const baseStub: QlAddonManifest = {
  name: "ql_base",
  version: "1.0.0",
  description: "Base stub for verification model tests.",
  depends: [],
  models: [],
  access: [],
  views: [],
};

const user = { id: "user-1", groups: ["user"] };

function tokenFields(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "user-1",
    purpose: "password_reset",
    token_hash: "hash-1",
    expires_at: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

void test("verification records are invisible and unwritable through user CRUD", async () => {
  const runtime = await createQlOrm("file::memory:", [baseStub, authManifest]);
  try {
    assert.equal(
      authManifest.access?.some((rule) => rule.model === "res.verification"),
      false,
    );
    assert.equal(
      runtime.orm
        .registry.getModels()
        .filter((model) => model.name === "res.verification")
        .length,
      1,
    );
    assert.equal(
      runtime.orm.registry.can("res.verification", ["user"], "read"),
      false,
    );
    assert.equal(
      runtime.orm.registry.can("res.verification", ["admin"], "create"),
      false,
    );

    await assert.rejects(
      () => runtime.orm.findMany("res.verification", user),
      QlAccessError,
    );
    await assert.rejects(
      () => runtime.orm.create("res.verification", user, tokenFields()),
      QlAccessError,
    );
  } finally {
    runtime.close();
  }
});

void test("the service path stores a hashed single-use token", async () => {
  const runtime = await createQlOrm("file::memory:", [baseStub, authManifest]);
  try {
    const orm = runtime.orm;
    await orm.createRecordForService("res.verification", tokenFields());
    await assert.rejects(
      () =>
        orm.createRecordForService(
          "res.verification",
          tokenFields({ user_id: "user-2" }),
        ),
      QlConflictError,
    );
    assert.equal(
      (await orm.findOneByService("res.verification", { token_hash: "hash-1" }))
        ?.user_id,
      "user-1",
    );
    assert.equal(await orm.deleteRecordsForService("res.verification", { token_hash: "hash-1" }), 1);
    assert.equal(
      await orm.deleteRecordsForService("res.verification", { token_hash: "hash-1" }),
      0,
    );
    await assert.rejects(
      () => orm.createRecordForService("res.verification", tokenFields({ purpose: "anything" })),
      /purpose/,
    );
  } finally {
    runtime.close();
  }
});
