import assert from "node:assert/strict";
import test from "node:test";
import integrationManifest from "ql_integration/__manifest__";
import {
  createQlOrm,
  loadAddons,
  QlAccessError,
  QlValidationError,
  type QlAddonManifest,
} from "ql_orm";
import cloudflareManifest from "../__manifest__.js";

const owner = { id: "owner-1", groups: ["user"] };
const intruder = { id: "owner-2", groups: ["user"] };

const stub = (name: string): QlAddonManifest => ({
  name,
  version: "1.0.0",
  description: name,
  depends: [],
  models: [],
  access: [],
  views: [],
});

const manifests = [
  stub("ql_base"),
  stub("ql_auth"),
  integrationManifest,
  cloudflareManifest,
];

function recordValues(overrides: Record<string, unknown> = {}) {
  return {
    connector_id: "connector-1",
    zone_id: "zone-1",
    external_id: "record-1",
    name: "api.example.com",
    type: "A",
    content: "203.0.113.10",
    owner_id: owner.id,
    ...overrides,
  };
}

void test("the transport addon loads after the connector registry", () => {
  const sorted = loadAddons([...manifests].reverse());
  const order = sorted.map((manifest) => manifest.name);
  assert.ok(order.indexOf("ql_integration") < order.indexOf("ql_cloudflare"));
});

void test("mirror rows are read-only through generic CRUD", async () => {
  for (const model of ["cloudflare.zone", "cloudflare.record"]) {
    const rule = cloudflareManifest.access?.find(
      (entry) => entry.model === model && entry.group === "user",
    );
    assert.equal(rule?.read, true);
    assert.equal(rule?.write, false);
    assert.equal(rule?.create, false);
    assert.equal(rule?.unlink, false);
  }
  const runtime = await createQlOrm("file::memory:", manifests);
  try {
    await assert.rejects(
      () => runtime.orm.create("cloudflare.record", owner, recordValues()),
      QlAccessError,
    );
    await runtime.orm.createRecordForService("cloudflare.record", recordValues());
    const rows = await runtime.orm.findMany("cloudflare.record", owner);
    assert.equal(rows.length, 1);
    assert.equal("owner_id" in rows[0], false);
    assert.deepEqual(await runtime.orm.findMany("cloudflare.record", intruder), []);
  } finally {
    runtime.close();
  }
});

void test("no published view exposes a private field", () => {
  const privateNames = new Set<string>();
  for (const model of cloudflareManifest.models) {
    for (const [name, field] of Object.entries(model.fields)) {
      if (field.private) privateNames.add(`${model.name}.${name}`);
    }
  }
  for (const view of cloudflareManifest.views) {
    for (const field of view.fields) {
      assert.equal(privateNames.has(`${view.model}.${field}`), false);
    }
  }
});

void test("record type and ttl bounds are enforced by the model", async () => {
  const runtime = await createQlOrm("file::memory:", manifests);
  try {
    await assert.rejects(
      () =>
        runtime.orm.createRecordForService(
          "cloudflare.record",
          recordValues({ type: "PTR" }),
        ),
      QlValidationError,
    );
    await assert.rejects(
      () =>
        runtime.orm.createRecordForService(
          "cloudflare.record",
          recordValues({ ttl: 99999999 }),
        ),
      QlValidationError,
    );
    const stored = await runtime.orm.createRecordForService(
      "cloudflare.record",
      recordValues(),
    );
    assert.equal(stored.ttl, 1);
    assert.equal(stored.proxied, false);
    assert.equal(stored.stale, false);
    assert.equal(stored.managed, false);
  } finally {
    runtime.close();
  }
});
