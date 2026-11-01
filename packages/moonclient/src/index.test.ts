import assert from "node:assert/strict";
import test from "node:test";
import { MoonClient, MoonClientError, apiRoutes, moonClient } from "./index.js";

function recorder(response: unknown = {}) {
  const requests: Array<{ url: string; method?: string; body: string }> = [];
  const client = new MoonClient({
    baseUrl: "/api",
    fetcher: (input, init = {}) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      requests.push({
        url,
        method: init.method,
        body: typeof init.body === "string" ? init.body : "",
      });
      return Promise.resolve(new Response(JSON.stringify(response), { status: 200 }));
    },
  });
  return { client, requests };
}

void test("MoonClient centralizes URL, request method, and JSON body", async () => {
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const client = new MoonClient({
    baseUrl: "https://api.example.test/",
    fetcher: (input, init = {}) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      requests.push({ url, init });
      return Promise.resolve(new Response(
        JSON.stringify({
          conversation: {
            id: "created",
            title: "Test",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        }),
        { status: 201 },
      ));
    },
  });

  await client.createConversation({ title: "Test" });

  assert.equal(requests[0].url, "https://api.example.test/conversations");
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[0].init.credentials, "same-origin");
  const body = requests[0].init.body;
  assert.equal(typeof body, "string");
  assert.deepEqual(JSON.parse(body as string), { title: "Test" });
});

void test("MoonClient encodes route segments and exposes API error status", async () => {
  const requestedUrls: string[] = [];
  const client = new MoonClient({
    baseUrl: "/api",
    fetcher: (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      requestedUrls.push(url);
      return Promise.resolve(new Response(JSON.stringify({ error: "Authentication required." }), {
        status: 401,
      }));
    },
  });

  await assert.rejects(client.listMessages("thread/one"), (error: unknown) => {
    assert.ok(error instanceof MoonClientError);
    assert.equal(error.message, "Authentication required.");
    assert.equal(error.status, 401);
    return true;
  });
  assert.equal(requestedUrls[0], "/api/conversations/thread%2Fone/messages");
});

void test("connector routes stay under one prefix and encode every id", async () => {
  const { client, requests } = recorder();

  await client.listConnectors();
  await client.createConnector({ kind: "cloudflare", label: "Produksi" });
  await client.updateConnector("c/1", { enabled: false });
  await client.deleteConnector("c/1", { confirmLabel: "Produksi" });
  await client.verifyConnector("c/1");
  await client.syncConnector("c/1");
  await client.listConnectorZones("c/1");
  await client.listConnectorRecords("c/1", "z/2", { name: "api.example.com", type: "A" });
  await client.createConnectorRecord("c/1", "z/2", {
    name: "api",
    type: "A",
    content: "203.0.113.7",
    ttl: 120,
    proxied: false,
  });
  await client.updateConnectorRecord("c/1", "z/2", "r/3", {
    name: "api",
    type: "A",
    content: "203.0.113.8",
    ttl: 120,
    proxied: false,
  });
  await client.deleteConnectorRecord("c/1", "z/2", "r/3", {
    confirmName: "api.example.com",
  });
  await client.listConnectorAudit("c/1");

  assert.deepEqual(
    requests.map(({ url, method }) => `${method ?? "GET"} ${url}`),
    [
      "GET /api/settings/connectors",
      "POST /api/settings/connectors",
      "PUT /api/settings/connectors/c%2F1",
      "DELETE /api/settings/connectors/c%2F1",
      "POST /api/settings/connectors/c%2F1/verify",
      "POST /api/settings/connectors/c%2F1/sync",
      "GET /api/settings/connectors/c%2F1/zones",
      "GET /api/settings/connectors/c%2F1/zones/z%2F2/records?name=api.example.com&type=A",
      "POST /api/settings/connectors/c%2F1/zones/z%2F2/records",
      "PATCH /api/settings/connectors/c%2F1/zones/z%2F2/records/r%2F3",
      "DELETE /api/settings/connectors/c%2F1/zones/z%2F2/records/r%2F3",
      "GET /api/settings/connectors/c%2F1/audit",
    ],
  );

  for (const path of [
    apiRoutes.connectors.collection,
    apiRoutes.connectors.prefix,
    apiRoutes.connectors.item("x"),
    apiRoutes.connectors.verify("x"),
    apiRoutes.connectors.sync("x"),
    apiRoutes.connectors.zones("x"),
    apiRoutes.connectors.records("x", "y"),
    apiRoutes.connectors.record("x", "y", "z"),
    apiRoutes.connectors.audit("x"),
  ]) {
    assert.ok(
      path.startsWith("/settings/connectors"),
      `Route '${path}' escaped the connector prefix.`,
    );
  }
});

void test("no connector contract surface accepts a credential", () => {
  const clientMembers = [
    ...Object.getOwnPropertyNames(MoonClient.prototype),
    ...Object.keys(moonClient),
  ];
  for (const name of clientMembers) {
    assert.equal(
      /(set|upload|rotate|update)(Token|Secret|Credential)/i.test(name),
      false,
      `MoonClient.${name} would put a credential back into the app.`,
    );
  }

  for (const [group, routes] of Object.entries(apiRoutes)) {
    const paths = typeof routes === "string"
      ? [routes]
      : Object.values(routes).filter((value): value is string => typeof value === "string");
    for (const path of paths) {
      assert.equal(
        /secret|credential/i.test(path),
        false,
        `Route '${group}${path}' implies stored credentials.`,
      );
    }
  }
});

// Browser melempar "Failed to execute 'fetch' on 'Window': Illegal invocation"
// kalau fetch menerima this selain global, dan klien menyimpannya sebagai field.
void test("default fetcher calls fetch with the global as receiver", async () => {
  const originalFetch = globalThis.fetch;
  const receivers: unknown[] = [];
  globalThis.fetch = function (this: unknown) {
    receivers.push(this);
    return Promise.resolve(new Response(JSON.stringify({ user: null }), { status: 200 }));
  };
  try {
    await new MoonClient({ baseUrl: "/api" }).currentUser();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(receivers.length, 1);
  assert.equal(receivers[0], globalThis);
});
