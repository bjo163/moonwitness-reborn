import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";
import { createClient } from "@libsql/client";
import pg from "pg";
import {
  createQlOrm,
  loadAddons,
  normalizeModelDefinition,
  type QlComputedModelContext,
  type QlAddonManifest,
  type QlFieldDefinition,
  type QlModelDefinition,
  QlModelRegistry,
} from "./index.js";

const base = {
  name: "ql_base",
  version: "1.0.0",
  description: "Base",
  depends: [],
  models: [],
  access: [],
  views: [],
  data: [],
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

void test("manifest seed data loads in dependency order and follows row policies", async () => {
  const externalIds = {
    name: "ir.model.data",
    description: "External IDs",
    tableName: "ir_model_data_seed_test",
    fields: {
      external_id: {
        type: "char" as const,
        required: true,
        unique: true,
        private: true,
      },
      model_name: { type: "char" as const, required: true, private: true },
      record_id: { type: "char" as const, required: true, private: true },
    },
  };
  const setting = {
    name: "base.setting",
    description: "System settings",
    tableName: "base_setting_seed_test",
    fields: {
      code: { type: "char" as const, required: true, unique: true },
      value: { type: "char" as const, required: true },
    },
  };
  const item = {
    name: "test.item",
    description: "Seedable test item",
    tableName: "test_item_seed_test",
    fields: {
      code: { type: "char" as const, required: true, unique: true },
      value: { type: "char" as const, required: true },
    },
  };
  const baseManifest: QlAddonManifest = {
    ...base,
    models: [externalIds, setting],
    data: [
      {
        id: "default_setting",
        model: "base.setting",
        key: { field: "code", value: "site_name" },
        values: { code: "site_name", value: "MoonWitness" },
        updatePolicy: "reconcile",
      },
    ],
  };
  const itemManifest: QlAddonManifest = {
    ...base,
    name: "ql_seed_fixture",
    depends: ["ql_base"],
    models: [item],
    data: [
      {
        id: "stable_item",
        model: "test.item",
        key: { field: "code", value: "example" },
        values: { code: "example", value: "original" },
        updatePolicy: "insert_only",
      },
    ],
  };

  const runtime = await createQlOrm("file::memory:", [
    itemManifest,
    baseManifest,
  ]);
  try {
    assert.equal(
      runtime.orm.registry.can("ir.model.data", ["admin", "root"], "read"),
      false,
    );
    const externalIdsInOrder = await runtime.orm.findManyByService(
      "ir.model.data",
      {},
      { limit: 10, orderBy: "rowid-asc" },
    );
    assert.deepEqual(
      externalIdsInOrder.map((record) => record.external_id),
      ["ql_base.default_setting", "ql_seed_fixture.stable_item"],
    );

    await runtime.orm.updateRecordsForService(
      "base.setting",
      { code: "site_name" },
      { value: "local override" },
    );
    await runtime.orm.updateRecordsForService(
      "test.item",
      { code: "example" },
      { value: "local override" },
    );
    await runtime.orm.loadDefaultData();

    assert.equal(
      (
        await runtime.orm.findOneByService("base.setting", {
          code: "site_name",
        })
      )?.value,
      "MoonWitness",
    );
    assert.equal(
      (
        await runtime.orm.findOneByService("test.item", {
          code: "example",
        })
      )?.value,
      "local override",
    );
    assert.equal(
      (
        await runtime.orm.findManyByService(
          "ir.model.data",
          {},
          { limit: 10 },
        )
      ).length,
      2,
    );
  } finally {
    runtime.close();
  }
});

void test("manifest seed data rejects private fields and owner-scoped models", () => {
  const protectedModel = {
    name: "test.protected",
    description: "Protected test model",
    tableName: "test_protected_seed_validation",
    fields: {
      code: { type: "char" as const, required: true, unique: true },
      secret: { type: "char" as const, required: true, private: true },
    },
  };
  const privateSeed: QlAddonManifest = {
    ...base,
    name: "ql_private_seed",
    depends: ["ql_base"],
    models: [protectedModel],
    data: [
      {
        id: "private_value",
        model: "test.protected",
        key: { field: "code", value: "private" },
        values: { code: "private", secret: "not allowed" },
        updatePolicy: "insert_only",
      },
    ],
  };
  assert.throws(
    () => new QlModelRegistry([base, privateSeed]),
    /invalid or private field 'secret'/,
  );

  const ownerScopedModel = {
    name: "test.owned",
    description: "Owner-scoped test model",
    tableName: "test_owned_seed_validation",
    ownerField: "owner_id",
    fields: {
      code: { type: "char" as const, required: true, unique: true },
      owner_id: { type: "char" as const, required: true, private: true },
    },
  };
  const ownerSeed: QlAddonManifest = {
    ...base,
    name: "ql_owner_seed",
    depends: ["ql_base"],
    models: [ownerScopedModel],
    data: [
      {
        id: "owner_record",
        model: "test.owned",
        key: { field: "code", value: "owner" },
        values: { code: "owner", owner_id: "system" },
        updatePolicy: "insert_only",
      },
    ],
  };
  assert.throws(
    () => new QlModelRegistry([base, ownerSeed]),
    /cannot seed owner-scoped model/,
  );
});

void test("view declarations validate model and field names", () => {
  const model: QlModelDefinition = {
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

function computedFieldManifest(tableName: string) {
  return {
    ...base,
    access: [
      {
        model: "test.profile",
        group: "user",
        read: true,
        write: true,
        create: true,
        unlink: true,
      },
    ],
    models: [
      {
        name: "test.profile",
        description: "Computed profile fields",
        tableName,
        ownerField: "owner_id",
        fields: {
          first_name: { type: "char" as const, required: true },
          last_name: { type: "char" as const, required: true },
          owner_id: {
            type: "char" as const,
            required: true,
            private: true,
          },
          full_name: {
            type: "char" as const,
            required: true,
            compute: {
              dependsOn: ["first_name", "last_name"],
              resolve: (record: Readonly<Record<string, string | number | boolean | null>>) =>
                `${record.first_name} ${record.last_name}`,
            },
          },
          greeting: {
            type: "char" as const,
            compute: {
              dependsOn: ["full_name"],
              resolve: (record: Readonly<Record<string, string | number | boolean | null>>) =>
                `Hello, ${record.full_name}`,
            },
          },
        },
      },
    ],
  };
}

async function runComputedFieldSuite(
  databaseUrl: string,
  tableName: string,
): Promise<void> {
  const runtime = await createQlOrm(databaseUrl, [
    computedFieldManifest(tableName),
  ]);
  try {
    const owner = { id: "owner-1", groups: ["user"] };
    const created = await runtime.orm.createRecordForService(
      "test.profile",
      {
        first_name: "Ada",
        last_name: "Lovelace",
        owner_id: owner.id,
      },
    );
    assert.equal(created.full_name, "Ada Lovelace");
    assert.equal(created.greeting, "Hello, Ada Lovelace");
    assert.equal("owner_id" in created, true);

    const publicRows = await runtime.orm.findMany("test.profile", owner);
    assert.equal(publicRows.length, 1);
    assert.equal(publicRows[0].full_name, "Ada Lovelace");
    assert.equal(publicRows[0].greeting, "Hello, Ada Lovelace");
    assert.equal("owner_id" in publicRows[0], false);

    await assert.rejects(
      runtime.orm.create("test.profile", owner, {
        first_name: "Grace",
        last_name: "Hopper",
        full_name: "Forged",
      }),
      /Computed field 'full_name' is read-only/,
    );
    await assert.rejects(
      runtime.orm.update(
        "test.profile",
        owner,
        String(created.id),
        { greeting: "Forged" },
      ),
      /Computed field 'greeting' is read-only/,
    );
    await assert.rejects(
      runtime.orm.createRecordForService("test.profile", {
        first_name: "Grace",
        last_name: "Hopper",
        owner_id: owner.id,
        greeting: "Forged",
      }),
      /Computed field 'greeting' is read-only/,
    );
    await assert.rejects(
      runtime.orm.findManyByService("test.profile", { full_name: "Ada Lovelace" }),
      /cannot be used as a database filter/,
    );
  } finally {
    runtime.close();
  }
}

void test("computed fields resolve in dependency order and stay virtual on libsql", async () => {
  await runComputedFieldSuite("file::memory:", "test_profile_computed_libsql");
});

void test("computed field dependencies reject cycles and private-field leaks", () => {
  const model = computedFieldManifest("test_profile_invalid").models[0];
  assert.ok(model);
  const cycle = {
    ...model,
    fields: {
      first_name: {
        type: "char" as const,
        compute: {
          dependsOn: ["greeting"],
          resolve: () => "first",
        },
      },
      greeting: {
        type: "char" as const,
        compute: {
          dependsOn: ["first_name"],
          resolve: () => "greeting",
        },
      },
    },
  };
  assert.throws(
    () => new QlModelRegistry([{ ...base, models: [cycle] }]),
    /dependency cycle/,
  );

  const leaksPrivate = {
    ...model,
    fields: {
      ...model.fields,
      leaked_owner: {
        type: "char" as const,
        compute: {
          dependsOn: ["owner_id"],
          resolve: (record: Readonly<Record<string, string | number | boolean | null>>) =>
            record.owner_id,
        },
      },
    },
  };
  assert.throws(
    () => new QlModelRegistry([{ ...base, models: [leaksPrivate] }]),
    /cannot depend on private field/,
  );
});

void test("computed models are ACL-gated bounded read-only projections", async () => {
  let computeCalls = 0;
  const manifest = {
    ...base,
    models: [
      {
        name: "test.source",
        description: "Source record",
        tableName: "test_computed_source",
        fields: {
          value: { type: "char" as const, required: true },
        },
      },
    ],
    computedModels: [
      {
        name: "test.projection",
        description: "Virtual projection",
        sources: ["test.source"],
        queryFields: {
          prefix: { type: "char" as const, required: true, maxLength: 20 },
        },
        fields: {
          value: { type: "char" as const, required: true },
        },
        compute({ query }: QlComputedModelContext) {
          computeCalls += 1;
          const prefix = query.filters.prefix;
          if (typeof prefix !== "string") {
            throw new Error("Validated prefix query is missing.");
          }
          return Promise.resolve([{ id: "projection-1", value: prefix }]);
        },
      },
    ],
    access: [
      {
        model: "test.source",
        group: "operator",
        read: true,
        write: false,
        create: false,
        unlink: false,
      },
      {
        model: "test.projection",
        group: "operator",
        read: true,
        write: false,
        create: false,
        unlink: false,
      },
      {
        model: "test.projection",
        group: "analyst",
        read: true,
        write: false,
        create: false,
        unlink: false,
      },
    ],
    views: [
      {
        name: "test.projection.list",
        model: "test.projection",
        type: "list" as const,
        fields: ["value"],
      },
    ],
  };
  const runtime = await createQlOrm("file::memory:", [manifest]);
  try {
    const operator = { id: "operator-1", groups: ["operator"] };
    const records = await runtime.orm.queryComputedModel(
      "test.projection",
      operator,
      { filters: { prefix: "candidate" }, limit: 1 },
    );
    assert.deepEqual(records, [{ id: "projection-1", value: "candidate" }]);
    assert.equal(computeCalls, 1);
    assert.deepEqual(
      runtime.orm.registry.getComputedModels().map((model) => model.name),
      ["test.projection"],
    );
    assert.deepEqual(
      runtime.orm.registry.getViews("test.projection").map((view) => view.name),
      ["test.projection.list"],
    );
    await assert.rejects(
      runtime.orm.queryComputedModel("test.projection", operator, {
        filters: { unknown: "value" },
      }),
      /Unknown query field/,
    );
    await assert.rejects(
      runtime.orm.queryComputedModel("test.projection", operator, { limit: 101 }),
      /between 1 and 100/,
    );
    await assert.rejects(
      runtime.orm.queryComputedModel("test.projection", {
        id: "member-1",
        groups: ["user"],
      }),
      /Access denied: read on 'test\.projection'/,
    );
    await assert.rejects(
      runtime.orm.queryComputedModel("test.projection", {
        id: "member-1",
        groups: ["analyst"],
      }),
      /Access denied: read on 'test\.source'/,
    );
    assert.equal(computeCalls, 1);
  } finally {
    runtime.close();
  }
});

async function runRecordSuite(
  databaseUrl: string,
  tableName: string,
): Promise<void> {
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
        tableName,
        ownerField: "owner_id",
        fields: {
          name: { type: "char" as const, required: true },
          code: { type: "char" as const, unique: true },
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
          enabled: {
            type: "boolean" as const,
            required: true,
            default: true,
          },
          owner_id: { type: "char" as const, required: true, private: true },
          created_at: { type: "datetime" as const, required: true },
          updated_at: { type: "datetime" as const, required: true },
        },
      },
    ],
  };
  const runtime = await createQlOrm(databaseUrl, [manifest]);
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
    await runtime.orm.createForService("ai.provider", "owner-1", {
      name: "Coded",
      base_url: "https://coded.example/v1",
      encrypted_api_key: "secret",
      code: "unique-code",
    });
    await assert.rejects(
      runtime.orm.createForService("ai.provider", "owner-1", {
        name: "Duplicate code",
        base_url: "https://duplicate.example/v1",
        encrypted_api_key: "secret",
        code: "unique-code",
      }),
      /already exists/,
    );
    await runtime.orm.createRecordForService("ai.provider", {
      name: "First",
      base_url: "https://first.example/v1",
      encrypted_api_key: "secret",
      owner_id: "owner-7",
    });
    await runtime.orm.createRecordForService("ai.provider", {
      name: "Second",
      base_url: "https://second.example/v1",
      encrypted_api_key: "secret",
      owner_id: "owner-7",
    });
    assert.deepEqual(
      (
        await runtime.orm.findManyByService(
          "ai.provider",
          { owner_id: "owner-7" },
          { orderBy: "rowid-asc", limit: 10 },
        )
      ).map((record) => record.name),
      ["First", "Second"],
    );
    const ordered = await runtime.orm.findManyForService(
      "ai.provider",
      "owner-1",
    );
    const coded = ordered.find((record) => record.name === "Coded");
    assert.equal(coded?.enabled, true);
    assert.equal(typeof coded?.priority, "number");
    assert.equal(coded?.priority, 0);
    assert.equal(typeof coded?.created_at, "number");
    assert.ok(Number.isSafeInteger(coded?.created_at));
    await runtime.orm.updateForService(
      "ai.provider",
      "owner-1",
      String(coded?.id),
      { enabled: false },
    );
    const disabled = await runtime.orm.findOneByService("ai.provider", {
      id: String(coded?.id),
    });
    assert.equal(disabled?.enabled, false);
  } finally {
    runtime.close();
  }
}

void test("service CRUD and ACL hold on libsql", async () => {
  await runRecordSuite("file::memory:", "ai_provider_libsql_test");
});

function transactionManifest(tableName: string): QlAddonManifest {
  return {
    ...base,
    models: [
      {
        name: "tx.note",
        description: "Transaction probe",
        tableName,
        ownerField: "owner_id",
        fields: {
          label: { type: "char", required: true },
          owner_id: { type: "char", required: true, private: true },
        },
      },
    ],
    access: [
      {
        model: "tx.note",
        group: "user",
        read: true,
        write: true,
        create: true,
        unlink: true,
      },
    ],
  };
}

async function runTransactionSuite(
  databaseUrl: string,
  tableName: string,
): Promise<void> {
  const runtime = await createQlOrm(databaseUrl, [transactionManifest(tableName)]);
  const owner = { id: "owner-1", groups: ["user"] };
  try {
    const created = await runtime.orm.transaction(async (tx) => {
      const record = await tx.createForService("tx.note", owner.id, {
        label: "committed",
      });
      const visible = await tx.findManyForService("tx.note", owner.id);
      assert.equal(visible.length, 1, "a transaction must see its own writes");
      return record;
    });
    assert.equal(typeof created.id, "string");

    // The outer connection only sees what was committed.
    assert.deepEqual(
      (await runtime.orm.findManyForService("tx.note", owner.id)).map(
        (row) => row.label,
      ),
      ["committed"],
    );

    await assert.rejects(
      async () =>
        await runtime.orm.transaction(async (tx) => {
          await tx.createForService("tx.note", owner.id, { label: "rolled back" });
          throw new Error("deliberate rollback");
        }),
      /deliberate rollback/,
    );
    assert.deepEqual(
      (await runtime.orm.findManyForService("tx.note", owner.id)).map(
        (row) => row.label,
      ),
      ["committed"],
      "a rolled back transaction must leave no row",
    );

    // A nested call through the session joins the open transaction, so the
    // single-connection driver cannot deadlock or nest BEGIN.
    const nested = await runtime.orm.transaction(async (tx) => {
      await tx.createForService("tx.note", owner.id, { label: "outer" });
      await tx.transaction(async (inner) => {
        await inner.createForService("tx.note", owner.id, { label: "inner" });
      });
      return (await tx.findManyForService("tx.note", owner.id)).map(
        (row) => row.label,
      );
    });
    assert.deepEqual(
      nested.sort(),
      ["committed", "inner", "outer"],
      "a nested transaction must join its parent",
    );

    await assert.rejects(
      async () =>
        await runtime.orm.transaction(async (tx) => {
          await tx.transaction(async (inner) => {
            await inner.createForService("tx.note", owner.id, { label: "abandoned" });
          });
          throw new Error("outer fails");
        }),
      /outer fails/,
    );
    assert.equal(
      (
        await runtime.orm.findManyForService("tx.note", owner.id)
      ).filter((row) => row.label === "abandoned").length,
      0,
      "a joined nested transaction must roll back with its parent",
    );
  } finally {
    runtime.close();
  }
}

void test("transactions commit, roll back, and nest on libsql", async () => {
  await runTransactionSuite("file::memory:", "tx_note_libsql_test");
});

function relationManifest(): QlAddonManifest {
  const char = { type: "char" as const, required: true, private: true };
  return {
    ...base,
    name: "ql_library",
    models: [
      {
        name: "library.book",
        description: "Book",
        tableName: "library_book_rel_test",
        ownerField: "owner_id",
        fields: {
          title: { type: "char", required: true, maxLength: 80 },
          shelves: {
            type: "char",
            relation: {
              kind: "o2m",
              model: "library.shelf",
              inverseField: "book_id",
            },
          },
          owner_id: char,
        },
      },
      {
        name: "library.shelf",
        description: "Shelf",
        tableName: "library_shelf_rel_test",
        ownerField: "owner_id",
        fields: {
          label: { type: "char", required: true, maxLength: 40 },
          book_id: {
            type: "char",
            required: true,
            maxLength: 36,
            relation: { kind: "m2o", model: "library.book" },
          },
          owner_id: char,
        },
      },
    ],
    access: [
      {
        model: "library.book",
        group: "user",
        read: true,
        write: true,
        create: true,
        unlink: true,
      },
      {
        model: "library.shelf",
        group: "user",
        read: true,
        write: true,
        create: true,
        unlink: true,
      },
      {
        model: "library.book",
        group: "reader",
        read: true,
        write: false,
        create: false,
        unlink: false,
      },
    ],
    views: [
      {
        name: "library.book.list",
        model: "library.book",
        type: "list",
        fields: ["title"],
      },
    ],
  };
}

void test("relations own no column, reject writes, and hydrate in batch", async () => {
  const runtime = await createQlOrm("file::memory:", [relationManifest()]);
  const owner = { id: "owner-1", groups: ["user"] };
  try {
    const first = await runtime.orm.createForService("library.book", owner.id, {
      title: "First",
    });
    const second = await runtime.orm.createForService("library.book", owner.id, {
      title: "Second",
    });
    for (const [bookId, label] of [
      [first.id, "a"],
      [first.id, "b"],
      [second.id, "c"],
    ] as const) {
      await runtime.orm.createForService("library.shelf", owner.id, {
        label,
        book_id: bookId,
      });
    }

    const books = await runtime.orm.findMany("library.book", owner);
    assert.equal(books.length, 2);
    // A reverse relation owns no column, so it never appears on a record.
    assert.equal("shelves" in books[0], false);

    await assert.rejects(
      () =>
        runtime.orm.create("library.book", owner, {
          title: "Bad",
          shelves: [],
        }),
      /Reverse relation 'shelves' is read-only/,
    );

    const graph = await runtime.orm.readRelations("library.book", owner, books);
    const shelves = graph.shelves ?? {};
    assert.equal((shelves[String(first.id)] ?? []).length, 2);
    assert.equal((shelves[String(second.id)] ?? []).length, 1);
    assert.deepEqual(
      (shelves[String(first.id)] ?? []).map((row) => row.label),
      ["a", "b"],
    );
    // A parent with no children gets no entry rather than an empty placeholder.
    assert.equal(Object.keys(graph.shelves ?? {}).length, 2);

    const back = await runtime.orm.readRelations(
      "library.shelf",
      owner,
      await runtime.orm.findMany("library.shelf", owner),
    );
    const byBook = back.book_id ?? {};
    assert.equal(
      (byBook[String(first.id)] ?? []).map((row) => row.title)[0],
      "First",
    );
    assert.equal(Object.keys(byBook).length, 2);
  } finally {
    runtime.close();
  }
});

void test("readRelations honours ACL and owner scope", async () => {
  const runtime = await createQlOrm("file::memory:", [relationManifest()]);
  const owner = { id: "owner-1", groups: ["user"] };
  const other = { id: "owner-2", groups: ["user"] };
  try {
    const book = await runtime.orm.createForService("library.book", owner.id, {
      title: "Shared",
    });
    await runtime.orm.createForService("library.shelf", other.id, {
      label: "elsewhere",
      book_id: String(book.id),
    });

    const books = await runtime.orm.findMany("library.book", owner);
    const graph = await runtime.orm.readRelations("library.book", owner, books);
    // The other owner's shelf is invisible even though its book_id matches.
    assert.equal(graph.shelves?.[String(book.id)], undefined);

    const reader = { id: "owner-1", groups: ["reader"] };
    await assert.rejects(
      () => runtime.orm.readRelations("library.book", reader, books),
      /read on 'library.shelf'/,
    );

    await assert.rejects(
      () => runtime.orm.readRelations("library.book", owner, books, ["title"]),
      /declares no relation/,
    );
  } finally {
    runtime.close();
  }
});

void test("relation declarations that cannot work are rejected at boot", () => {
  const book = (extra: Record<string, unknown>) => ({
    ...base,
    name: "ql_library",
    models: [
      {
        name: "library.book",
        description: "Book",
        tableName: "library_book_bad",
        fields: {
          title: { type: "char", required: true, maxLength: 80 },
          ...extra,
        },
      },
    ],
    access: [],
    views: [],
    data: [],
  });

  const cases: Record<string, unknown>[] = [
    { ghost: { type: "char", relation: { kind: "m2o", model: "library.missing" } } },
    { ghost: { type: "integer", relation: { kind: "m2o", model: "library.book" } } },
    { ghost: { type: "char", relation: { kind: "m2o", model: "library.book" } } },
    {
      ghost: {
        type: "char",
        relation: { kind: "o2m", model: "library.book", inverseField: "nope" },
      },
    },
    {
      ghost: {
        type: "char",
        required: true,
        relation: { kind: "o2m", model: "library.book", inverseField: "self" },
      },
    },
  ];
  for (const extra of cases) {
    assert.throws(
      () => new QlModelRegistry([book(extra) as unknown as QlAddonManifest]),
      /Relation|relation/,
      JSON.stringify(Object.keys(extra)),
    );
  }
});

void test("an IN filter matches any listed value and an empty set matches nothing", async () => {
  const runtime = await createQlOrm("file::memory:", [relationManifest()]);
  const owner = { id: "owner-1", groups: ["user"] };
  try {
    const book = await runtime.orm.createForService("library.book", owner.id, {
      title: "In",
    });
    for (const label of ["x", "y"]) {
      await runtime.orm.createForService("library.shelf", owner.id, {
        label,
        book_id: String(book.id),
      });
    }
    const both = await runtime.orm.findManyByService("library.shelf", {
      label: { in: ["x", "y"] },
    });
    assert.equal(both.length, 2);
    const none = await runtime.orm.findManyByService("library.shelf", {
      label: { in: [] },
    });
    assert.deepEqual(none, []);
    await assert.rejects(
      () =>
        runtime.orm.findManyByService("library.shelf", {
          book_id: { in: Array.from({ length: 501 }, () => String(book.id)) },
        }),
      /at most 500 values/,
    );
    await assert.rejects(
      () =>
        runtime.orm.findManyByService("library.book", {
          shelves: { in: [String(book.id)] },
        }),
      /cannot be used as a database filter/,
    );
  } finally {
    runtime.close();
  }
});

// Release yang menambah field harus tetap membuka tabel yang sudah berisi data,
// jadi jalur ALTER TABLE diuji pada database yang sama, bukan tabel baru.
async function runEvolutionSuite(
  databaseUrl: string,
  tableName: string,
): Promise<void> {
  const manifest = (extraFields: Record<string, QlFieldDefinition>) => ({
    ...base,
    access: [
      {
        model: "ai.note",
        group: "user",
        read: true,
        write: true,
        create: true,
        unlink: true,
      },
    ],
    models: [
      {
        name: "ai.note",
        description: "Evolving note",
        tableName,
        ownerField: "owner_id",
        fields: {
          name: { type: "char" as const, required: true },
          owner_id: { type: "char" as const, required: true, private: true },
          ...extraFields,
        },
      },
    ],
  });

  const before = await createQlOrm(databaseUrl, [manifest({})]);
  try {
    await before.orm.createRecordForService("ai.note", {
      name: "Kept",
      owner_id: "owner-1",
    });
  } finally {
    before.close();
  }

  const after = await createQlOrm(databaseUrl, [
    manifest({
      label: { type: "char" as const, default: "gene'ric" },
      score: { type: "integer" as const, default: 7 },
      active: { type: "boolean" as const, required: true, default: true },
    }),
  ]);
  try {
    const rows = await after.orm.findManyForService("ai.note", "owner-1");
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.name, "Kept");
    assert.equal(rows[0]?.label, "gene'ric");
    assert.equal(rows[0]?.score, 7);
    assert.equal(rows[0]?.active, true);
    await after.orm.createRecordForService("ai.note", {
      name: "Added",
      owner_id: "owner-1",
    });
    assert.deepEqual(
      (
        await after.orm.findManyByService(
          "ai.note",
          { owner_id: "owner-1" },
          { orderBy: "rowid-asc" },
        )
      ).map((record) => record.name),
      ["Kept", "Added"],
    );
  } finally {
    after.close();
  }
}

// libsql may keep a file handle alive for a bit longer on Windows after the
// client is closed. Best-effort cleanup is sufficient here; the process exit is
// the reliable finalizer for a temporary database directory.
async function removeTempDir(dir: string): Promise<void> {
  const deadline = Date.now() + 3000;
  for (;;) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch (error) {
      const code = (error as { code?: unknown }).code;
      const retryable = code === "EPERM" || code === "EBUSY";
      if (!retryable || Date.now() > deadline) {
        if (code === "EPERM" || code === "EBUSY") return;
        throw error;
      }
      if (typeof globalThis.gc === "function") {
        globalThis.gc();
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

void test("added fields keep existing rows on libsql", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ql-orm-evolve-"));
  try {
    await runEvolutionSuite(
      `file:${join(dir, "evolve.db").replace(/\\/g, "/")}`,
      "ai_note_libsql_evolve",
    );
  } finally {
    await removeTempDir(dir);
  }
});

const postgresUrl = process.env.QL_ORM_PG_URL;

// Database Postgres untuk tes bisa persisten (mis. service lokal), jadi tabel
// scratch milik suite dihapus lagi; di CI kontainernya memang sekali pakai.
async function dropScratchTable(
  databaseUrl: string,
  tableName: string,
): Promise<void> {
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await client.query(`drop table if exists "${tableName}" cascade`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

if (postgresUrl) {
  void test("computed fields resolve in dependency order and stay virtual on postgres", async () => {
    const tableName = `test_profile_computed_pg_${Date.now().toString(36)}`;
    try {
      await runComputedFieldSuite(postgresUrl, tableName);
    } finally {
      await dropScratchTable(postgresUrl, tableName);
    }
  });
  void test("service CRUD and ACL hold on postgres", async () => {
    const tableName = `ai_provider_pg_${Date.now().toString(36)}`;
    try {
      await runRecordSuite(postgresUrl, tableName);
    } finally {
      await dropScratchTable(postgresUrl, tableName);
    }
  });
  void test("added fields keep existing rows on postgres", async () => {
    const tableName = `ai_note_pg_${Date.now().toString(36)}`;
    try {
      await runEvolutionSuite(postgresUrl, tableName);
    } finally {
      await dropScratchTable(postgresUrl, tableName);
    }
  });
  void test("transactions commit and roll back on postgres", async () => {
    const tableName = `tx_note_pg_${Date.now().toString(36)}`;
    try {
      await runTransactionSuite(postgresUrl, tableName);
    } finally {
      await dropScratchTable(postgresUrl, tableName);
    }
  });
}


void test("registry resolves model addon, category, and validates landing views", () => {
  const registry = new QlModelRegistry([
    {
      name: "ql_corpus",
      version: "0.1.0",
      description: "Corpus",
      category: "knowledge",
      depends: [],
      models: [
        {
          name: "corpus.document",
          description: "Document",
          tableName: "corpus_document_landing_test",
          fields: {
            code: { type: "char", required: true },
            title: { type: "char", required: true },
            secret_token: { type: "char", private: true },
          },
        },
      ],
      access: [],
      views: [
        {
          name: "corpus.document.landing",
          model: "corpus.document",
          type: "landing",
          fields: ["code", "title"],
          landing: {
            section: "knowledge",
            sequence: 10,
            href: "/corpus",
            status: "available",
          },
        },
      ],
      data: [],
    },
  ]);

  assert.equal(registry.getModelAddon("corpus.document"), "ql_corpus");
  assert.equal(registry.getModelCategory("corpus.document"), "knowledge");
  const landingViews = registry.getLandingViews();
  assert.equal(landingViews.length, 1);
  assert.equal(landingViews[0]?.name, "corpus.document.landing");

  assert.throws(
    () =>
      new QlModelRegistry([
        {
          name: "ql_corpus",
          version: "0.1.0",
          description: "Corpus",
          depends: [],
          models: [
            {
              name: "corpus.document",
              description: "Document",
              tableName: "corpus_document_landing_bad_test",
              fields: {
                secret_token: { type: "char", private: true },
              },
            },
          ],
          access: [],
          views: [
            {
              name: "corpus.document.bad_landing",
              model: "corpus.document",
              type: "landing",
              fields: ["secret_token"],
              landing: {
                section: "knowledge",
                href: "/corpus",
              },
            },
          ],
          data: [],
        },
      ]),
    /cannot reference private field/,
  );

  assert.throws(
    () =>
      new QlModelRegistry([
        {
          name: "ql_corpus",
          version: "0.1.0",
          description: "Corpus",
          depends: [],
          models: [
            {
              name: "corpus.document",
              description: "Document",
              tableName: "corpus_document_options_bad_test",
              fields: {
                status: { type: "char", options: [] },
              },
            },
          ],
          access: [],
          views: [],
          data: [],
        },
      ]),
    /options must be a non-empty list of strings/,
  );
});

void test("findMany filters records using parameterized SQL search options", async () => {
  const runtime = await createQlOrm("file::memory:", [
    {
      ...base,
      name: "ql_test_search",
      models: [
        {
          name: "test.search_item",
          description: "Search item",
          tableName: "test_search_item",
          fields: {
            title: { type: "char", required: true },
            content: { type: "text" },
          },
        },
      ],
      access: [
        {
          model: "test.search_item",
          group: "user",
          read: true,
          write: true,
          create: true,
          unlink: true,
        },
      ],
    },
  ]);
  try {
    const user = { id: "user-1", groups: ["user"] };
    await runtime.orm.create("test.search_item", user, {
      title: "Kisah Nabi Ibrahim",
      content: "Membangun Ka'bah bersama Nabi Ismail",
    });
    await runtime.orm.create("test.search_item", user, {
      title: "Kisah Nabi Musa",
      content: "Membelah lautan dengan mukjizat",
    });

    const matchedTitle = await runtime.orm.findMany("test.search_item", user, {
      search: { fields: ["title"], query: "musa" },
    });
    assert.equal(matchedTitle.length, 1);
    assert.equal(matchedTitle[0].title, "Kisah Nabi Musa");

    const matchedContent = await runtime.orm.findMany("test.search_item", user, {
      search: { fields: ["content"], query: "ka'bah" },
    });
    assert.equal(matchedContent.length, 1);
    assert.equal(matchedContent[0].title, "Kisah Nabi Ibrahim");
  } finally {
    runtime.close();
  }
});

function auditManifest(tableName: string): QlAddonManifest {
  return {
    ...base,
    name: "ql_audit_test",
    models: [
      {
        name: "test.audit",
        description: "Audit test model",
        tableName,
        fields: {
          name: { type: "char" as const, required: true },
        },
      },
    ],
    access: [
      {
        model: "test.audit",
        group: "user",
        read: true,
        write: true,
        create: true,
        unlink: true,
      },
    ],
    views: [
      {
        name: "test.audit.list",
        model: "test.audit",
        type: "list" as const,
        fields: ["name", "created_at", "updated_at"],
      },
    ],
  };
}

void test("registry injects audit fields without mutating manifests and validates overrides", () => {
  const model: QlModelDefinition = {
    name: "test.audit",
    description: "Audit test model",
    tableName: "test_audit_registry",
    fields: { name: { type: "char" as const, required: true } },
  };
  const manifest = {
    ...base,
    name: "ql_audit_registry",
    models: [model],
    access: [],
    views: [
      {
        name: "test.audit.list",
        model: "test.audit",
        type: "list" as const,
        fields: ["name", "created_at", "created_by"],
      },
    ],
  };
  const registry = new QlModelRegistry([manifest]);
  const registered = registry.getModel("test.audit");
  assert.equal(registered.fields.created_at?.type, "datetime");
  assert.equal(registered.fields.updated_at?.type, "datetime");
  assert.equal(registered.fields.created_by?.private, true);
  assert.equal(registered.fields.updated_by?.private, true);
  assert.equal(model.fields.created_at, undefined);

  const normalized = normalizeModelDefinition(model);
  assert.strictEqual(normalizeModelDefinition(normalized), normalized);

  assert.throws(
    () =>
      normalizeModelDefinition({
        ...model,
        fields: {
          ...model.fields,
          created_at: { type: "char" as const },
        },
      }),
    /audit field 'created_at' must be type 'datetime'/,
  );
});

void test("create and update stamp audit fields and public writes cannot spoof them", async () => {
  const runtime = await createQlOrm("file::memory:", [
    auditManifest("test_audit_stamp"),
  ]);
  try {
    const user = { id: "user-1", groups: ["user"] };
    const created = await runtime.orm.create("test.audit", user, { name: "one" });
    assert.equal(typeof created.created_at, "number");
    assert.equal(typeof created.updated_at, "number");
    assert.equal("created_by" in created, false);

    const spoofed = await runtime.orm.create(
      "test.audit",
      user,
      { name: "bad", created_at: 1 },
    );
    assert.equal(typeof spoofed.created_at, "number");
    assert.notEqual(spoofed.created_at, 1);
    await assert.rejects(
      () =>
        runtime.orm.update("test.audit", user, String(created.id), {
          updated_at: 1,
        }),
      /At least one field is required/,
    );
    await assert.rejects(
      () => runtime.orm.update("test.audit", user, String(created.id), {}),
      /At least one field is required/,
    );

    const updated = await runtime.orm.update(
      "test.audit",
      user,
      String(created.id),
      { name: "two" },
    );
    assert.ok(updated);
    assert.equal(typeof updated.updated_at, "number");

    const serviceCreated = await runtime.orm.createRecordForService(
      "test.audit",
      { name: "three", created_at: 1234 },
      { actorId: "admin-9" },
    );
    assert.equal(serviceCreated.created_at, 1234);
    assert.equal(serviceCreated.created_by, "admin-9");
    assert.equal(serviceCreated.updated_by, "admin-9");

    const updatedCount = await runtime.orm.updateRecordsForService(
      "test.audit",
      { name: "three" },
      { name: "four" },
      { actorId: "admin-10" },
    );
    assert.equal(updatedCount, 1);
    const [row] = await runtime.orm.findManyByService("test.audit", {
      name: "four",
    });
    assert.equal(row?.updated_by, "admin-10");
    assert.equal(typeof row?.updated_at, "number");

    const userRows = await runtime.orm.findMany("test.audit", user);
    assert.equal(Object.hasOwn(userRows[0], "created_by"), false);
    assert.equal(Object.hasOwn(userRows[0], "updated_by"), false);
  } finally {
    runtime.close();
  }
});

void test("schema sync backfills audit timestamps for rows that predate the columns", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ql-orm-audit-"));
  const url = `file:${join(dir, "audit.db").replace(/\\/g, "/")}`;
  const client = createClient({ url });
  try {
    await client.execute(
      "CREATE TABLE test_audit_backfill (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL)",
    );
    await client.execute(
      "INSERT INTO test_audit_backfill (id, name) VALUES ('legacy-1', 'legacy')",
    );
  } finally {
    client.close();
  }
  const runtime = await createQlOrm(url, [auditManifest("test_audit_backfill")]);
  try {
    const rows = await runtime.orm.findManyByService("test.audit", {});
    assert.equal(rows.length, 1);
    assert.equal(typeof rows[0]?.created_at, "number");
    assert.equal(typeof rows[0]?.updated_at, "number");
  } finally {
    runtime.close();
    await removeTempDir(dir);
  }
});
