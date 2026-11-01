import { mkdtempSync, rmSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import {
  createQlOrm,
  loadAddons,
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
if (postgresUrl) {
  void test("service CRUD and ACL hold on postgres", async () => {
    await runRecordSuite(postgresUrl, `ai_provider_pg_${Date.now().toString(36)}`);
  });
  void test("added fields keep existing rows on postgres", async () => {
    await runEvolutionSuite(postgresUrl, `ai_note_pg_${Date.now().toString(36)}`);
  });
}
