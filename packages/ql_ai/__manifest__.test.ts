import assert from "node:assert/strict";
import test from "node:test";
import { createQlOrm } from "ql_orm";
import baseManifest from "ql_base/__manifest__";
import aiManifest from "./__manifest__.js";

const user = { id: "user-1", groups: ["user"] };
const admin = { id: "admin-1", groups: ["admin"] };

void test("ql_ai manifest registers exactly one model and declares no data", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest, aiManifest]);
  try {
    const models = runtime.orm.registry.getModels().filter((m) => m.name === "ai.provider");
    assert.equal(models.length, 1);
    assert.equal(models[0].ownerField, "owner_id");
    assert.equal(models[0].fields.encrypted_api_key.private, true);
    assert.equal(aiManifest.data.length, 0);
  } finally {
    runtime.close();
  }
});

void test("ai.provider ACL denies user writes and never exposes the private key", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest, aiManifest]);
  try {
    const owner = "owner-1";
    await runtime.orm.createForService("ai.provider", owner, {
      name: "Primary",
      base_url: "https://provider.example/v1",
      model: "gpt-4",
      encrypted_api_key: "encrypted-secret",
    });

    const rows = await runtime.orm.findMany("ai.provider", {
      id: owner,
      groups: ["user"],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "Primary");
    assert.equal("encrypted_api_key" in rows[0], false);

    await assert.rejects(
      () =>
        runtime.orm.create("ai.provider", user, {
          name: "Exposed",
          base_url: "https://exposed.example/v1",
          encrypted_api_key: "secret",
        }),
      Error,
    );

    await assert.rejects(
      () =>
        runtime.orm.update("ai.provider", user, owner, {
          name: "Tampered",
        }),
      Error,
    );
  } finally {
    runtime.close();
  }
});

void test("admin may manage ai.provider records", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest, aiManifest]);
  try {
    const created = await runtime.orm.createForService("ai.provider", "admin-1", {
      name: "Admin Provider",
      base_url: "https://admin.example/v1",
      model: "gpt-4",
      encrypted_api_key: "admin-secret",
    });
    assert.equal(created.name, "Admin Provider");
    assert.equal("encrypted_api_key" in created, false);

    const updated = await runtime.orm.update(
      "ai.provider",
      admin,
      String(created.id),
      { name: "Renamed" },
    );
    assert.equal(updated.name, "Renamed");

    const deleted = await runtime.orm.delete("ai.provider", admin, String(created.id));
    assert.equal(deleted, true);
  } finally {
    runtime.close();
  }
});

void test("ai.provider is owner-scoped between two users", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest, aiManifest]);
  try {
    const otherUser = { id: "user-2", groups: ["user"] };
    await runtime.orm.createForService("ai.provider", "owner-1", {
      name: "Owner Provider",
      base_url: "https://owner.example/v1",
      model: "gpt-4",
      encrypted_api_key: "owner-secret",
    });
    assert.deepEqual(await runtime.orm.findMany("ai.provider", otherUser), []);
    await assert.rejects(
      () => runtime.orm.delete("ai.provider", otherUser, "owner-1"),
      Error,
    );
  } finally {
    runtime.close();
  }
});