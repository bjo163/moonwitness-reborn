import assert from "node:assert/strict";
import test from "node:test";
import { createQlOrm } from "ql_orm";
import baseManifest from "../__manifest__.js";

const user = { id: "user-1", groups: ["user"] };
const otherUser = { id: "user-2", groups: ["user"] };

void test("res.partner model is registered with owner scope and full user ACL", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest]);
  try {
    const models = runtime.orm.registry
      .getModels()
      .filter((model) => model.name === "res.partner");
    assert.equal(models.length, 1);
    assert.equal(models[0].ownerField, "owner_id");
    assert.equal(
      runtime.orm.registry.can("res.partner", ["user"], "read"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("res.partner", ["user"], "create"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("res.partner", ["user"], "write"),
      true,
    );
    assert.equal(
      runtime.orm.registry.can("res.partner", ["user"], "unlink"),
      true,
    );
  } finally {
    runtime.close();
  }
});

void test("res.partner enforces owner isolation between users", async () => {
  const runtime = await createQlOrm("file::memory:", [baseManifest]);
  try {
    const created = await runtime.orm.create("res.partner", user, {
      name: "Ada Lovelace",
    });
    assert.equal(created.name, "Ada Lovelace");
    assert.equal("owner_id" in created, false);

    // Another owner cannot list the record.
    assert.deepEqual(await runtime.orm.findMany("res.partner", otherUser), []);

    // The owner-scoped WHERE matches no row for another owner: update is a
    // no-op and delete returns false instead of touching the record.
    assert.equal(
      await runtime.orm.update("res.partner", otherUser, String(created.id), {
        name: "Tampered",
      }),
      undefined,
    );
    assert.equal(
      await runtime.orm.delete("res.partner", otherUser, String(created.id)),
      false,
    );

    // The original record is untouched.
    const mine = await runtime.orm.findMany("res.partner", user);
    assert.equal(mine.length, 1);
    assert.equal(mine[0].name, "Ada Lovelace");
  } finally {
    runtime.close();
  }
});
