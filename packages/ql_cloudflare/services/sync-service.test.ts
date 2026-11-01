import assert from "node:assert/strict";
import test from "node:test";
import integrationManifest from "ql_integration/__manifest__";
import { createQlOrm, type QlAddonManifest, type QlOrm } from "ql_orm";
import cloudflareManifest from "../__manifest__.js";
import type {
  CloudflareClient,
  CloudflareDnsRecord,
  CloudflareZoneSummary,
} from "./cloudflare-client.js";
import { CloudflareApiError } from "./errors.js";
import {
  ConnectorUnavailableError,
  SyncCooldownError,
  syncConnector,
} from "./sync-service.js";

/** Tests re-run sync back to back, so the production cooldown is switched off unless under test. */
const noCooldown = { cooldownMs: 0 };

const stub = (name: string): QlAddonManifest => ({
  name,
  version: "1.0.0",
  description: name,
  depends: [],
  models: [],
  access: [],
  views: [],
});

function zone(id: string, name: string): CloudflareZoneSummary {
  return { id, name, status: "active", paused: false, accountId: "acct-1" };
}

function record(
  id: string,
  zoneId: string,
  name: string,
  content: string,
): CloudflareDnsRecord {
  return {
    id,
    zoneId,
    name,
    type: "A",
    content,
    ttl: 300,
    proxied: false,
    comment: "",
    managed: false,
    createdOn: "2026-01-02T03:04:05Z",
  };
}

interface FakeOptions {
  zones?: CloudflareZoneSummary[];
  records?: Record<string, CloudflareDnsRecord[]>;
  /** Zone id whose record pages beyond the first fail, to exercise the partial path. */
  breakPagingFor?: string;
}

function fakeClient(options: FakeOptions = {}): CloudflareClient & {
  calls: { zones: number; records: number };
} {
  const zones = options.zones ?? [zone("zone-1", "example.com")];
  const records = options.records ?? {
    "zone-1": [record("rec-1", "zone-1", "api.example.com", "203.0.113.7")],
  };
  const calls = { zones: 0, records: 0 };
  return {
    calls,
    verifyToken() {
      return Promise.resolve({ status: "active", id: "token-1" });
    },
    listZones() {
      calls.zones += 1;
      return Promise.resolve({ items: zones, page: 1, totalPages: 1 });
    },
    listRecords(zoneId, params) {
      calls.records += 1;
      if (options.breakPagingFor === zoneId) {
        if ((params?.page ?? 1) > 1) {
          return Promise.reject(new CloudflareApiError(10107, "page unavailable"));
        }
        return Promise.resolve({ items: [], page: 1, totalPages: 3 });
      }
      return Promise.resolve({ items: records[zoneId] ?? [], page: 1, totalPages: 1 });
    },
    createRecord() {
      return Promise.reject(new Error("not used by sync"));
    },
    updateRecord() {
      return Promise.reject(new Error("not used by sync"));
    },
    deleteRecord() {
      return Promise.reject(new Error("not used by sync"));
    },
  };
}

const ownerId = "owner-1";

async function withConnector(
  run: (
    orm: QlOrm,
    scope: { connectorId: string; ownerId: string },
    filter: Record<string, string>,
  ) => Promise<void>,
  connectorOverrides: Record<string, unknown> = {},
): Promise<void> {
  const runtime = await createQlOrm("file::memory:", [
    stub("ql_base"),
    stub("ql_auth"),
    integrationManifest,
    cloudflareManifest,
  ]);
  try {
    const connector = await runtime.orm.createRecordForService("integration.connector", {
      kind: "cloudflare",
      label: "Produksi",
      token_source: "config_file",
      token_ref: "file:~/.config/cloudflare/token",
      owner_id: ownerId,
      ...connectorOverrides,
    });
    const scope = { connectorId: String(connector.id), ownerId };
    await run(runtime.orm, scope, {
      connector_id: scope.connectorId,
      owner_id: scope.ownerId,
    });
  } finally {
    runtime.close();
  }
}

void test("sync mirrors zones and records and stamps the connector", async () => {
  await withConnector(async (orm, scope, filter) => {
    const result = await syncConnector(orm, fakeClient(), scope);
    assert.deepEqual(result, {
      zones: 1,
      records: 1,
      partial: false,
      incompleteZones: [],
    });
    const zones = await orm.findManyByService("cloudflare.zone", filter);
    assert.equal(zones.length, 1);
    assert.equal(zones[0].name, "example.com");
    assert.equal(zones[0].stale, false);
    const records = await orm.findManyByService("cloudflare.record", filter);
    assert.equal(records[0].content, "203.0.113.7");
    assert.equal(records[0].proxied, false);
    const connector = await orm.findOneByService("integration.connector", {
      id: scope.connectorId,
    });
    assert.equal(connector?.last_sync_status, "ok");
    assert.equal(typeof connector?.last_sync_at, "number");
  });
});

void test("re-sync keeps local ids and sweeps records removed upstream", async () => {
  await withConnector(async (orm, scope, filter) => {
    await syncConnector(orm, fakeClient(), scope, noCooldown);
    const before = await orm.findOneByService("cloudflare.record", filter);
    assert.ok(before);

    const updated = fakeClient({
      records: { "zone-1": [record("rec-1", "zone-1", "api.example.com", "203.0.113.99")] },
    });
    const result = await syncConnector(orm, updated, scope, noCooldown);
    const after = await orm.findOneByService("cloudflare.record", filter);
    assert.equal(result.records, 1);
    assert.equal(after?.id, before?.id);
    assert.equal(after?.content, "203.0.113.99");

    await syncConnector(orm, fakeClient({ records: { "zone-1": [] } }), scope, noCooldown);
    assert.deepEqual(await orm.findManyByService("cloudflare.record", filter), []);
  });
});

void test("an unreadable page keeps stale rows and reports partial", async () => {
  await withConnector(async (orm, scope, filter) => {
    await syncConnector(orm, fakeClient(), scope, noCooldown);
    const broken = fakeClient({ breakPagingFor: "zone-1" });
    const result = await syncConnector(orm, broken, scope, noCooldown);
    assert.equal(result.partial, true);
    assert.deepEqual(result.incompleteZones, ["example.com"]);
    const records = await orm.findManyByService("cloudflare.record", filter);
    assert.equal(records.length, 1, "unproven rows must survive an aborted sweep");
    assert.equal(records[0].stale, true);
    const connector = await orm.findOneByService("integration.connector", {
      id: scope.connectorId,
    });
    assert.equal(connector?.last_sync_status, "partial");
  });
});

void test("a second sync inside the cooldown is refused", async () => {
  await withConnector(async (orm, scope) => {
    await syncConnector(orm, fakeClient(), scope);
    const second = fakeClient();
    await assert.rejects(() => syncConnector(orm, second, scope), SyncCooldownError);
    assert.equal(second.calls.zones, 0, "no HTTP work before the cooldown check");
  });
});

void test("a disabled connector cannot sync", async () => {
  await withConnector(
    async (orm, scope) => {
      await assert.rejects(
        () => syncConnector(orm, fakeClient(), scope),
        ConnectorUnavailableError,
      );
    },
    { enabled: false },
  );
});
