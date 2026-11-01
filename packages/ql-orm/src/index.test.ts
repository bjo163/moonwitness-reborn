import assert from "node:assert/strict";
import test from "node:test";
import { createQlOrm, loadAddons, QlModelRegistry } from "./index.js";

const base = {
  name: "ql_base",
  version: "1.0.0",
  description: "Base",
  depends: [],
  models: [],
  access: [],
  views: [],
};

void test("addon loading sorts dependencies and rejects cycles", () => {
  const dependent = {
    ...base,
    name: "ql_crm",
    depends: ["ql_base"],
  };
  assert.deepEqual(loadAddons([dependent, base]).map((addon) => addon.name), [
    "ql_base",
    "ql_crm",
  ]);
  assert.throws(
    () =>
      loadAddons([
        { ...base, depends: ["ql_auth"] },
        { ...base, name: "ql_auth", depends: ["ql_base"] },
      ]),
    /cycle/,
  );
});

void test("model registry validates addon prefix, models and access rules", () => {
  const partner = {
    name: "res.partner",
    description: "Contact",
    tableName: "res_partner",
    fields: {
      name: { type: "char" as const, required: true },
      owner_id: { type: "char" as const, required: true },
    },
    ownerField: "owner_id",
  };
  const manifest = {
    ...base,
    models: [partner],
    access: [
      {
        model: "res.partner",
        group: "user",
        read: true,
        write: false,
        create: true,
        unlink: false,
      },
    ],
    views: [
      {
        name: "res.partner.list",
        model: "res.partner",
        type: "list" as const,
        fields: ["name"],
      },
    ],
  };
  const registry = new QlModelRegistry([manifest]);
  assert.equal(registry.can("res.partner", ["user"], "create"), true);
  assert.equal(registry.can("res.partner", ["user"], "unlink"), false);
  assert.deepEqual(registry.getViews("res.partner"), manifest.views);
  assert.throws(
    () => new QlModelRegistry([{ ...manifest, name: "base" }]),
    /ql_ prefix/,
  );
});

void test("view declarations validate model and field names", () => {
  const model = {
    name: "res.partner",
    description: "Contact",
    tableName: "res_partner",
    fields: {
      name: { type: "char" as const, required: true },
      owner_id: { type: "char" as const, required: true },
    },
  };
  assert.throws(
    () =>
      new QlModelRegistry([
        {
          ...base,
          models: [model],
          views: [
            {
              name: "res.partner.list",
              model: "res.partner",
              type: "list",
              fields: ["missing_field"],
            },
          ],
        },
      ]),
    /unknown field/,
  );
});

void test("service-owned records keep private fields out of user CRUD", async () => {
  const manifest = {
    ...base,
    access: [
      {
        model: "ai.provider",
        group: "user",
        read: true,
        write: true,
        create: true,
        unlink: true,
      },
    ],
    models: [
      {
        name: "ai.provider",
        description: "Provider credentials",
        tableName: "ai_provider_test",
        ownerField: "owner_id",
        fields: {
          name: { type: "char" as const, required: true },
          base_url: {
            type: "char" as const,
            required: true,
            validator: (value: unknown) =>
              typeof value === "string" && value.startsWith("https://")
                ? undefined
                : "Provider URL must use HTTPS.",
          },
          encrypted_api_key: {
            type: "text" as const,
            required: true,
            private: true,
          },
          priority: {
            type: "integer" as const,
            required: true,
            default: 0,
            minValue: 0,
            maxValue: 1000,
          },
          owner_id: { type: "char" as const, required: true, private: true },
          created_at: { type: "datetime" as const, required: true },
          updated_at: { type: "datetime" as const, required: true },
        },
      },
    ],
  };
  const runtime = await createQlOrm("file::memory:", [manifest]);
  try {
    const record = await runtime.orm.createForService("ai.provider", "owner-1", {
      name: "Primary",
      base_url: "https://provider.example/v1",
      encrypted_api_key: "encrypted-secret",
    });
    assert.equal("encrypted_api_key" in record, false);
    const publicRecords = await runtime.orm.findMany("ai.provider", {
      id: "owner-1",
      groups: ["user"],
    });
    assert.equal(publicRecords.length, 1);
    assert.equal("encrypted_api_key" in publicRecords[0], false);
    const owned = await runtime.orm.findManyForService(
      "ai.provider",
      "owner-1",
    );
    assert.equal(owned[0].encrypted_api_key, "encrypted-secret");
    assert.deepEqual(
      await runtime.orm.findManyForService("ai.provider", "owner-2"),
      [],
    );
    await assert.rejects(
      runtime.orm.create("ai.provider", { id: "owner-1", groups: ["user"] }, {
        name: "Exposed",
        encrypted_api_key: "not-allowed",
      }),
      /cannot be written/,
    );
    const updated = await runtime.orm.updateForService(
      "ai.provider",
      "owner-1",
      String(record.id),
      { encrypted_api_key: "rotated-secret" },
    );
    assert.equal(updated?.name, "Primary");
    assert.equal(
      (await runtime.orm.findManyForService("ai.provider", "owner-1"))[0]
        .encrypted_api_key,
      "rotated-secret",
    );
    assert.equal(
      await runtime.orm.deleteForService(
        "ai.provider",
        "owner-2",
        String(record.id),
      ),
      false,
    );
    await assert.rejects(
      runtime.orm.createForService("ai.provider", "owner-1", {
        name: "Insecure",
        base_url: "http://provider.example/v1",
        encrypted_api_key: "secret",
      }),
      /Provider URL must use HTTPS/,
    );
    await assert.rejects(
      runtime.orm.createForService("ai.provider", "owner-1", {
        name: "Invalid priority",
        base_url: "https://provider.example/v1",
        encrypted_api_key: "secret",
        priority: 1001,
      }),
      /between 0 and 1000/,
    );
  } finally {
    runtime.close();
  }
});
