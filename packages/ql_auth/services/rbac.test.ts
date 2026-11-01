import assert from "node:assert/strict";
import test from "node:test";
import { createQlOrm, QlModelRegistry, type QlAddonManifest, type QlOrm } from "ql_orm";
import authManifest from "../__manifest__.js";
import {
  DEFAULT_ROLE,
  ROLE_CATALOG,
  findRoleDefinition,
  groupsForRole,
  isKnownRole,
  seedRoles,
} from "./rbac.js";

const baseStub: QlAddonManifest = {
  name: "ql_base",
  version: "1.0.0",
  description: "Base stub for role tests.",
  depends: [],
  models: [],
  access: [],
  views: [],
};

async function memoryOrm(): Promise<{ orm: QlOrm; close: () => void }> {
  return createQlOrm("file::memory:", [baseStub, authManifest]);
}

void test("every role grants the user group and unknown roles fall back", () => {
  for (const role of ROLE_CATALOG) {
    assert.ok(role.groups.includes("user"), `role ${role.code} must include user`);
    assert.deepEqual(groupsForRole(role.code).slice(0, 1), ["user"]);
    assert.ok(
      role.groups.join(",").length <= 200,
      `role ${role.code} groups exceed the res.role column`,
    );
  }
  assert.deepEqual(groupsForRole("does_not_exist"), ["user"]);
  assert.deepEqual(groupsForRole(undefined), ["user"]);
  assert.equal(isKnownRole(DEFAULT_ROLE), true);
});

void test("role catalog is assignable except super_admin", () => {
  assert.deepEqual(
    ROLE_CATALOG.filter((role) => !role.assignable).map((role) => role.code),
    ["super_admin"],
  );
});

void test("super_admin covers every operational group", () => {
  const groups = groupsForRole("super_admin");
  for (const group of ["admin", "root", "connector", "operator"]) {
    assert.ok(groups.includes(group), `super_admin must grant '${group}'`);
  }
  for (const role of ROLE_CATALOG) {
    for (const group of role.groups) {
      assert.ok(
        groups.includes(group),
        `super_admin must be a superset of role ${role.code}`,
      );
    }
  }
});

void test("registry denies role catalog reads outside admin and root", () => {
  const registry = new QlModelRegistry([baseStub, authManifest]);
  assert.equal(registry.can("res.role", ["user"], "read"), false);
  assert.equal(registry.can("res.role", ["operator"], "read"), false);
  assert.equal(registry.can("res.role", ["admin"], "read"), true);
  assert.equal(registry.can("res.role", ["admin"], "create"), false);
  assert.equal(registry.can("res.role", ["root"], "unlink"), false);
});

void test("seedRoles is idempotent and stores groups as csv", async () => {
  const { orm, close } = await memoryOrm();
  try {
    await seedRoles(orm);
    const first = await orm.findManyByService("res.role", {}, { limit: 100 });
    assert.equal(first.length, ROLE_CATALOG.length);
    await seedRoles(orm);
    const second = await orm.findManyByService("res.role", {}, { limit: 100 });
    assert.equal(second.length, ROLE_CATALOG.length);
    const operator = second.find((row) => row.code === "operator");
    assert.ok(operator);
    assert.equal(operator.groups, "user,operator,connector");
    assert.equal(operator.assignable, true);
  } finally {
    close();
  }
});

void test("res.users defaults to member and hides the private role column", async () => {
  const { orm, close } = await memoryOrm();
  try {
    await seedRoles(orm);
    const created = await orm.createRecordForService("res.users", {
      name: "Rani",
      email: "rani@example.com",
      password_hash: "scrypt$1$2",
      active: true,
    });
    assert.equal(created.role, DEFAULT_ROLE);

    const readable = await orm.findMany("res.users", {
      id: String(created.id),
      groups: ["user", "admin"],
    });
    assert.equal(readable.length, 1);
    assert.equal("role" in readable[0], false);
    assert.equal("password_hash" in readable[0], false);
    assert.equal(readable[0].email, "rani@example.com");

    await assert.rejects(
      orm.update("res.users", { id: String(created.id), groups: ["user", "admin"] }, String(created.id), {
        role: "super_admin",
      }),
      /cannot be written through this API/,
    );
    await assert.rejects(
      orm.createRecordForService("res.users", {
        name: "Bogus",
        email: "bogus@example.com",
        password_hash: "scrypt$1$2",
        role: "root_overlord",
      }),
      /known role code/,
    );
  } finally {
    close();
  }
});

void test("seedRoles repairs rows left behind by an older catalog", async () => {
  const { orm, close } = await memoryOrm();
  try {
    await seedRoles(orm);
    await orm.updateRecordsForService(
      "res.role",
      { code: "super_admin" },
      { groups: "user,admin,root", name: "Old name", assignable: true },
    );
    await seedRoles(orm);
    const rows = await orm.findManyByService(
      "res.role",
      { code: "super_admin" },
      { limit: 10 },
    );
    assert.equal(rows.length, 1);
    const definition = findRoleDefinition("super_admin");
    assert.ok(definition);
    assert.equal(rows[0].groups, definition.groups.join(","));
    assert.equal(rows[0].name, definition.name);
    assert.equal(rows[0].assignable, definition.assignable);
  } finally {
    close();
  }
});
