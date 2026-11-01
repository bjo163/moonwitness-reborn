import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createConversationStore, type ConversationStore } from "@moonwitness/database";
import {
  apiRoutes,
  type AdminUserListResponseDto,
  type AuditListResponseDto,
  type ConnectorListResponseDto,
  type ConnectorResponseDto,
  type RecordListResponseDto,
  type RecordResponseDto,
  type SyncConnectorResponseDto,
  type VerifyConnectorResponseDto,
  type ZoneListResponseDto,
} from "@moonwitness/moonclient";
import { createQlOrm, type QlOrm } from "ql_orm";
import aiManifest from "ql_ai/__manifest__";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import cloudflareManifest from "ql_cloudflare/__manifest__";
import integrationManifest from "ql_integration/__manifest__";
import { ConnectorCredentialError } from "../connectors/os-credential-store.js";
import { createApiServer } from "./server.js";

const apiToken = "tok-abcdef0123456789";
const ownerEmail = "owner@example.com";
const memberEmail = "member@example.com";
const managerEmail = "manager@example.com";
const testPassword = "correct horse battery staple";
const credentialRef = "file:~/.config/cloudflare/token";

interface Call {
  method: string;
  path: string;
  body?: Record<string, unknown>;
  authorization: string | null;
}

const calls: Call[] = [];

type Resolver = () => Promise<{
  token: string;
  source: "env" | "keychain" | "config_file";
  ref: string;
}>;

const presentToken: Resolver = () =>
  Promise.resolve({
    token: apiToken,
    source: "config_file",
    ref: credentialRef,
  });

let resolveToken: Resolver = presentToken;
let cloudflareBehaviour = answerNormally;

const zoneRow = {
  id: "zone-1",
  name: "example.com",
  status: "active",
  paused: false,
  account: { id: "acct-1" },
};

function recordRow(
  id: string,
  name: string,
  type: string,
  content: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    zone_id: "zone-1",
    name,
    type,
    content,
    ttl: 120,
    proxied: false,
    managed: false,
    created_on: "2026-01-02T03:04:05Z",
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function paged(items: unknown[]): Response {
  return jsonResponse(200, {
    success: true,
    errors: [],
    messages: [],
    result: items,
    result_info: { page: 1, total_pages: 1, per_page: 100 },
  });
}

function answerNormally(method: string, url: URL): Response {
  if (url.pathname.endsWith("/user/tokens/verify")) {
    return jsonResponse(200, {
      success: true,
      errors: [],
      messages: [],
      result: { id: "token-1", status: "active" },
    });
  }
  if (url.pathname.endsWith("/dns_records")) {
    return method === "GET"
      ? paged([
          recordRow("rec-1", "api.example.com", "A", "203.0.113.10", { proxied: true, ttl: 1 }),
          recordRow("rec-2", "example.com", "TXT", "v=spf1 -all"),
        ])
      : jsonResponse(200, {
          success: true,
          errors: [],
          messages: [],
          result: recordRow("rec-new", "www.example.com", "A", "203.0.113.20"),
        });
  }
  if (url.pathname === "/client/v4/zones/zone-1/dns_records/rec-1") {
    return jsonResponse(200, {
      success: true,
      errors: [],
      messages: [],
      result: recordRow("rec-1", "api.example.com", "A", "203.0.113.99", {
        proxied: true,
        ttl: 1,
      }),
    });
  }
  if (url.pathname.endsWith("/zones")) {
    return paged([zoneRow]);
  }
  return jsonResponse(500, { success: false, errors: [{ code: 0, message: "unmapped" }] });
}

function requestUrl(input: RequestInfo | URL): URL {
  if (typeof input === "string") return new URL(input);
  if (input instanceof URL) return input;
  return new URL(input.url);
}

const fakeFetcher: typeof fetch = (input, init) => {
  const url = requestUrl(input);
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers ?? {});
  calls.push({
    method,
    path: `${url.pathname}${url.search}`,
    authorization: headers.get("authorization"),
    ...(typeof init?.body === "string"
      ? { body: JSON.parse(init.body) as Record<string, unknown> }
      : {}),
  });
  return Promise.resolve(cloudflareBehaviour(method, url));
};

let server: ReturnType<typeof createApiServer>;
let address: string;
let orm: QlOrm;
let closeOrm: () => void;
let store: ConversationStore;
let ownerCookie: string;
let memberCookie: string;

async function register(email: string): Promise<string> {
  const response = await fetch(`${address}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Tester",
      email,
      password: testPassword,
    }),
  });
  assert.equal(response.status, 201);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

/** Changing a role revokes that account's sessions, so tests must log back in. */
async function login(email: string): Promise<string> {
  const response = await fetch(`${address}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: testPassword }),
  });
  assert.equal(response.status, 200);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

interface Reply<T> {
  status: number;
  text: string;
  headers: Headers;
  body: T;
}

async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; cookie?: string } = {},
): Promise<Reply<T>> {
  const response = await fetch(`${address}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      cookie: init.cookie ?? ownerCookie,
    },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  const text = await response.text();
  return {
    status: response.status,
    text,
    headers: response.headers,
    body: JSON.parse(text) as T,
  };
}

async function createConnector(label: string, kind = "cloudflare"): Promise<string> {
  const created = await api<ConnectorResponseDto>(apiRoutes.connectors.collection, {
    method: "POST",
    body: { kind, label },
  });
  assert.equal(created.status, 201, created.text);
  return created.body.connector.id;
}

function connectorRow(list: ConnectorListResponseDto, id: string) {
  const row = list.connectors.find((item) => item.id === id);
  assert.ok(row);
  return row;
}

before(async () => {
  const runtime = await createQlOrm("file::memory:", [
    baseManifest,
    authManifest,
    aiManifest,
    chatManifest,
    integrationManifest,
    cloudflareManifest,
  ]);
  orm = runtime.orm;
  closeOrm = runtime.close;
  store = createConversationStore(orm);
  server = createApiServer(undefined, store, orm, {
    bootstrapAdmin: { email: ownerEmail, token: "one-time" },
    resolveConnectorToken: () => resolveToken(),
    cloudflareFetcher: fakeFetcher,
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const where = server.address();
  assert.ok(where && typeof where !== "string");
  address = `http://127.0.0.1:${where.port}`;
  ownerCookie = await register(ownerEmail);
  memberCookie = await register(memberEmail);
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  closeOrm();
  store.close();
});

beforeEach(() => {
  calls.length = 0;
  cloudflareBehaviour = answerNormally;
  resolveToken = presentToken;
});

void test("the catalog lists both kinds and no field can carry a token", async () => {
  const empty = await api<ConnectorListResponseDto>(apiRoutes.connectors.collection);
  assert.equal(empty.status, 200);
  assert.deepEqual(
    empty.body.kinds.map((kind) => [kind.kind, kind.readonly]),
    [
      ["cloudflare", false],
      ["cloudflare_read", true],
    ],
  );
  assert.equal(empty.body.connectors.length, 0);
  assert.equal(empty.text.includes(apiToken), false);

  const dnsKinds = empty.body.kinds.filter((kind) =>
    kind.capabilities.includes("dns"),
  );
  assert.equal(dnsKinds.length, 2);
  for (const kind of dnsKinds) {
    assert.ok(kind.recordTypes?.includes("CNAME"));
    assert.deepEqual(kind.proxiableTypes, ["A", "AAAA", "CNAME"]);
  }

  const id = await createConnector("Katalog");
  const listed = await api<ConnectorListResponseDto>(apiRoutes.connectors.collection);
  const row = connectorRow(listed.body, id);
  assert.equal("token" in row, false);
  assert.equal("secret" in row, false);
  assert.equal("apiKey" in row, false);
  assert.equal(row.tokenSource, "config_file");
  assert.equal(row.tokenRef, credentialRef);
  assert.equal(row.verifyStatus, "unverified");
});

void test("least-privilege accounts cannot manage or drive connectors", async () => {
  const id = await createConnector("Gate");

  const denied = await api(apiRoutes.connectors.collection, {
    method: "POST",
    body: { kind: "cloudflare", label: "Puny member" },
    cookie: memberCookie,
  });
  assert.equal(denied.status, 403);

  const sync = await api(apiRoutes.connectors.sync(id), {
    method: "POST",
    cookie: memberCookie,
  });
  assert.equal(sync.status, 403);

  // The path id only counts for its owner, so a probe reads as absent.
  const zones = await api<ZoneListResponseDto>(apiRoutes.connectors.zones(id), {
    cookie: memberCookie,
  });
  assert.equal(zones.status, 404);
  assert.equal(zones.text.includes("example.com"), false);

  const noGetForItem = await api(apiRoutes.connectors.item(id));
  assert.equal(noGetForItem.status, 405);
});

void test("managing a connector and driving it are separate grants", async () => {
  await register(managerEmail);
  const directory = await api<AdminUserListResponseDto>(
    apiRoutes.admin.users.collection,
  );
  const managerId = directory.body.users.find(
    (item) => item.email === managerEmail,
  )?.id;
  assert.ok(managerId, "the new account shows up in the admin directory");
  const promoted = await api(apiRoutes.admin.users.role(managerId), {
    method: "PATCH",
    body: { role: "integrations_manager" },
  });
  assert.equal(promoted.status, 200, promoted.text);
  const cookie = await login(managerEmail);

  const owned = await api<ConnectorResponseDto>(apiRoutes.connectors.collection, {
    method: "POST",
    body: { kind: "cloudflare", label: "Milik manager" },
    cookie,
  });
  assert.equal(owned.status, 201, owned.text);
  const connectorId = owned.body.connector.id;

  const verified = await api(apiRoutes.connectors.verify(connectorId), {
    method: "POST",
    cookie,
  });
  assert.equal(verified.status, 200, verified.text);

  const synced = await api(apiRoutes.connectors.sync(connectorId), {
    method: "POST",
    cookie,
  });
  assert.equal(synced.status, 403);
  assert.equal(synced.text.includes(apiToken), false);

  // A privileged role from another account still cannot see this owner's mirror.
  const foreignId = await createConnector("Punya owner");
  const foreignZones = await api(apiRoutes.connectors.zones(foreignId), { cookie });
  assert.equal(foreignZones.status, 404);
});

void test("create, verify and sync stamp the source, audit it, never echo the token", async () => {
  const id = await createConnector("Audit trail");

  const verified = await api<VerifyConnectorResponseDto>(apiRoutes.connectors.verify(id), {
    method: "POST",
  });
  assert.equal(verified.status, 200, verified.text);
  assert.equal(verified.body.connector.verifyStatus, "ok");
  assert.match(verified.body.message, /config_file/);
  assert.equal(verified.text.includes(apiToken), false);
  const verifyCall = calls.find((call) => call.path.endsWith("/user/tokens/verify"));
  assert.equal(verifyCall?.authorization, `Bearer ${apiToken}`);

  const synced = await api<SyncConnectorResponseDto>(apiRoutes.connectors.sync(id), {
    method: "POST",
  });
  assert.equal(synced.status, 200, synced.text);
  assert.equal(synced.body.zones, 1);
  assert.equal(synced.body.records, 2);
  assert.equal(synced.body.partial, false);
  assert.equal(synced.text.includes(apiToken), false);

  const audit = await api<AuditListResponseDto>(apiRoutes.connectors.audit(id));
  assert.equal(audit.status, 200);
  assert.equal(audit.text.includes(apiToken), false);
  const actions = new Set(audit.body.entries.map((entry) => entry.action));
  assert.deepEqual([...actions].sort(), ["create", "sync", "verify"]);

  const cooldown = await api(apiRoutes.connectors.sync(id), { method: "POST" });
  assert.equal(cooldown.status, 429);
  assert.ok(Number(cooldown.headers.get("retry-after")) >= 1);
});

void test("the mirror is read from the database and filters locally", async () => {
  const id = await createConnector("Mirror");
  const before = await api<ZoneListResponseDto>(apiRoutes.connectors.zones(id));
  assert.equal(before.body.zones.length, 0);

  const synced = await api<SyncConnectorResponseDto>(apiRoutes.connectors.sync(id), {
    method: "POST",
  });
  assert.equal(synced.status, 200, synced.text);

  const zones = await api<ZoneListResponseDto>(apiRoutes.connectors.zones(id));
  assert.equal(zones.body.zones.length, 1);
  assert.equal(zones.body.zones[0]?.externalId, "zone-1");
  assert.equal(zones.body.zones[0]?.name, "example.com");

  calls.length = 0;
  const all = await api<RecordListResponseDto>(
    apiRoutes.connectors.records(id, "zone-1"),
  );
  assert.equal(all.body.records.length, 2);
  assert.equal(all.body.truncated, false);
  assert.equal(all.body.zone?.externalId, "zone-1");
  // Browsing the mirror must not spend Cloudflare requests.
  assert.equal(calls.length, 0);

  const search = await api<RecordListResponseDto>(
    `${apiRoutes.connectors.records(id, "zone-1")}?name=spf&type=TXT`,
  );
  assert.deepEqual(search.body.records.map((record) => record.name), ["example.com"]);
});

void test("record writes need a writable kind, a valid draft, a typed confirm", async () => {
  const writable = await createConnector("Ubah record");
  const readOnly = await createConnector("Baca saja", "cloudflare_read");

  const refusedSync = await api<SyncConnectorResponseDto>(
    apiRoutes.connectors.sync(readOnly),
    { method: "POST" },
  );
  assert.equal(refusedSync.status, 200, refusedSync.text);

  calls.length = 0;
  const refused = await api(apiRoutes.connectors.records(readOnly, "zone-1"), {
    method: "POST",
    body: { name: "www.example.com", type: "A", content: "203.0.113.5", ttl: 120, proxied: false },
  });
  assert.equal(refused.status, 403);
  assert.match(refused.text, /read-only/);
  assert.equal(calls.some((call) => call.method === "POST"), false);

  assert.equal(
    (await api(apiRoutes.connectors.sync(writable), { method: "POST" })).status,
    200,
  );

  const created = await api<RecordResponseDto>(apiRoutes.connectors.records(writable, "zone-1"), {
    method: "POST",
    body: { name: "www.example.com", type: "A", content: "203.0.113.20", ttl: 120, proxied: false },
  });
  assert.equal(created.status, 201, created.text);
  assert.equal(created.body.record.externalId, "rec-new");
  assert.equal(created.text.includes(apiToken), false);

  const badCombo = await api(apiRoutes.connectors.records(writable, "zone-1"), {
    method: "POST",
    body: { name: "spf.example.com", type: "TXT", content: "v=spf1 -all", ttl: 120, proxied: true },
  });
  assert.equal(badCombo.status, 400);

  const mirror = await api<RecordListResponseDto>(apiRoutes.connectors.records(writable, "zone-1"));
  const target = mirror.body.records.find((record) => record.externalId === "rec-1");
  assert.ok(target);

  const patched = await api<RecordResponseDto>(
    apiRoutes.connectors.record(writable, "zone-1", target.id),
    {
      method: "PATCH",
      body: { name: "api.example.com", type: "A", content: "203.0.113.99", ttl: 1, proxied: true },
    },
  );
  assert.equal(patched.status, 200, patched.text);
  assert.equal(patched.body.record.content, "203.0.113.99");

  calls.length = 0;
  const sloppy = await api(apiRoutes.connectors.record(writable, "zone-1", target.id), {
    method: "DELETE",
    body: { confirmName: "api" },
  });
  assert.equal(sloppy.status, 400);
  assert.equal(calls.length, 0);

  const deleted = await api<{ deleted: boolean; name: string }>(
    apiRoutes.connectors.record(writable, "zone-1", target.id),
    { method: "DELETE", body: { confirmName: "api.example.com" } },
  );
  assert.equal(deleted.status, 200, deleted.text);
  assert.equal(deleted.body.name, "api.example.com");

  const afterDelete = await api<RecordListResponseDto>(
    apiRoutes.connectors.records(writable, "zone-1"),
  );
  assert.equal(
    afterDelete.body.records.some((record) => record.externalId === "rec-1"),
    false,
  );

  const audit = await api<AuditListResponseDto>(apiRoutes.connectors.audit(writable));
  const actions = new Set(audit.body.entries.map((entry) => entry.action));
  for (const action of ["create", "update", "delete", "sync"]) {
    assert.ok(actions.has(action), audit.text);
  }
});

void test("Cloudflare and credential failures map to honest statuses", async () => {
  const id = await createConnector("Gagal");

  cloudflareBehaviour = () =>
    jsonResponse(400, { success: false, errors: [{ code: 112, message: "Cannot perform action" }] });
  const rejected = await api(apiRoutes.connectors.verify(id), { method: "POST" });
  assert.equal(rejected.status, 502);
  assert.match(rejected.text, /Cannot perform action/);
  const afterReject = await api<ConnectorListResponseDto>(apiRoutes.connectors.collection);
  assert.equal(connectorRow(afterReject.body, id).verifyStatus, "invalid");

  cloudflareBehaviour = () =>
    jsonResponse(
      429,
      { success: false, errors: [{ code: 10107, message: "rate limited" }] },
      { "retry-after": "7" },
    );
  const throttled = await api(apiRoutes.connectors.verify(id), { method: "POST" });
  assert.equal(throttled.status, 429);
  assert.equal(throttled.headers.get("retry-after"), "7");

  resolveToken = () => Promise.reject(new ConnectorCredentialError("Token Cloudflare tidak ditemukan di store."));
  const missing = await api(apiRoutes.connectors.verify(id), { method: "POST" });
  assert.equal(missing.status, 503);
  assert.match(missing.text, /tidak ditemukan/);
  const afterMissing = await api<ConnectorListResponseDto>(apiRoutes.connectors.collection);
  assert.equal(connectorRow(afterMissing.body, id).verifyStatus, "missing");
});

void test("deleting a connector needs the exact label and takes the mirror with it", async () => {
  const id = await createConnector("Hapus saya");
  assert.equal(
    (await api(apiRoutes.connectors.sync(id), { method: "POST" })).status,
    200,
  );

  const wrong = await api(apiRoutes.connectors.item(id), {
    method: "DELETE",
    body: { confirmLabel: "Hapus" },
  });
  assert.equal(wrong.status, 400);

  const deleted = await api<{ deleted: boolean }>(apiRoutes.connectors.item(id), {
    method: "DELETE",
    body: { confirmLabel: "Hapus saya" },
  });
  assert.equal(deleted.status, 200, deleted.text);
  assert.equal((await api(apiRoutes.connectors.zones(id))).status, 404);

  // Removing the connector does not remove the evidence it left behind.
  const survivors = await orm.findManyByService("integration.audit", { connector_id: id }, {});
  assert.ok(survivors.length > 0);
  const actions = new Set(survivors.map((row) => row.action));
  assert.equal(actions.has("delete_connector"), true);
});
