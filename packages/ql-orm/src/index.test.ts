import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";
import pg from "pg";
import {
  createQlOrm,
  loadAddons,
  type QlComputedModelContext,
  type QlAddonManifest,
  type QlFieldDefinition,
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
    assert.equal(disabled?.active, true);
    assert.equal(disabled?.create_uid, "owner-1");
    assert.equal(disabled?.write_uid, "owner-1");
    assert.equal(typeof disabled?.updated_at, "number");
    await assert.rejects(
      runtime.orm.update(
        "ai.provider",
        { id: "owner-1", groups: ["user"] },
        String(coded?.id),
        { created_at: "2026-01-01T00:00:00.000Z" },
      ),
      /read-only/,
    );
    const deleted = await runtime.orm.delete(
      "ai.provider",
      { id: "owner-1", groups: ["user"] },
      String(coded?.id),
    );
    assert.equal(deleted, true);
    assert.equal(
      await runtime.orm.findOneByService("ai.provider", {
        id: String(coded?.id),
      }),
      undefined,
    );
    const softDeleted = await runtime.orm.findOneByService(
      "ai.provider",
      { id: String(coded?.id) },
      { includeInactive: true },
    );
    assert.equal(softDeleted?.active, false);
    assert.equal(typeof softDeleted?.deleted_at, "number");
    assert.equal(softDeleted?.write_uid, "owner-1");
  } finally {
    runtime.close();
  }
}

void test("service CRUD and ACL hold on libsql", async () => {
  await runRecordSuite("file::memory:", "ai_provider_libsql_test");
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

// Handle file libsql baru dilepaskan beberapa ratus ms setelah close(),
// sehingga rmSync di Windows bisa melaporkan EPERM pada percobaan pertama.
async function removeTempDir(dir: string): Promise<void> {
  const deadline = Date.now() + 3000;
  for (;;) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch (error) {
      const retryable = (error as { code?: unknown }).code === "EPERM";
      if (!retryable || Date.now() > deadline) throw error;
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
}
