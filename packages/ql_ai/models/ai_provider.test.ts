import assert from "node:assert/strict";
import test from "node:test";
import { QlAccessError, createQlOrm } from "ql_orm";
import baseManifest from "../../ql_base/__manifest__.js";
import aiManifest from "../__manifest__.js";

const user = { id: "user-1", groups: ["user"] };

void test("ai.provider model is registered with owner scope and read-only user ACL", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest, aiManifest]);
  try {
    const models = runtime.orm.registry
      .getModels()
      .filter((model) => model.name === "ai.provider");
    assert.equal(models.length, 1);
    assert.equal(models[0].ownerField, "owner_id");
    assert.equal(models[0].fields.encrypted_api_key.private, true);

    // Regular users may read provider config but never write, create, unlink.
    assert.equal(
      runtime.orm.registry.can("ai.provider", ["user"], "read"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("ai.provider", ["user"], "create"),
      false,
    );
    assert.equal(
      runtime.orm.registry.can("ai.provider", ["user"], "write"),
      false,
    );
    assert.equal(
      runtime.orm.registry.can("ai.provider", ["user"], "unlink"),
      false,
    );

    // Admins manage provider config end to end.
    assert.equal(
      runtime.orm.registry.can("ai.provider", ["admin"], "read"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("ai.provider", ["admin"], "create"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("ai.provider", ["admin"], "write"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("ai.provider", ["admin"], "unlink"),
      true,
    );
  } finally {
    runtime.close();
  }
});

void test("ai.provider denies user writes and never exposes the private key", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest, aiManifest]);
  try {
    const owner = "owner-1";
    await runtime.orm.createForService("ai.provider", owner, {
      name: "Primary",
      base_url: "https://provider.example/v1",
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
      QlAccessError,
    );
  } finally {
    runtime.close();
  }
});
