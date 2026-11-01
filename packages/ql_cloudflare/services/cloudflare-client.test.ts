import assert from "node:assert/strict";
import test from "node:test";
import {
  CLOUDFLARE_API_BASE,
  createCloudflareClient,
} from "./cloudflare-client.js";
import {
  CloudflareApiError,
  CloudflareNetworkError,
  CloudflareRateLimitError,
  sanitizeCloudflareMessage,
} from "./errors.js";

interface Call {
  url: string;
  init: RequestInit;
}

const singlePage = { success: true, result: [], result_info: { page: 1, total_pages: 1 } };

function clientFor(
  respond: (url: string, init: RequestInit) => Promise<Response>,
): { client: ReturnType<typeof createCloudflareClient>; calls: Call[] } {
  const calls: Call[] = [];
  const client = createCloudflareClient({
    token: "tok-1234567890",
    fetcher: (input, init) => {
      let url: string;
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else {
        url = input.url;
      }
      calls.push({ url, init: init ?? {} });
      return respond(url, init ?? {});
    },
  });
  return { client, calls };
}

function respondWith(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...headers },
      }),
    );
}

function requestBody(call: Call): Record<string, unknown> {
  const raw = call.init.body;
  return JSON.parse(typeof raw === "string" ? raw : "{}") as Record<string, unknown>;
}

void test("every path is built on the /client/v4 base", async () => {
  const { client, calls } = clientFor(respondWith(singlePage));
  await client.listZones();
  assert.equal(calls[0].url, `${CLOUDFLARE_API_BASE}/zones?page=1&per_page=100`);
  assert.ok(calls[0].url.includes("/client/v4/"), "base path must survive URL building");
  assert.equal(
    (calls[0].init.headers as Record<string, string>).authorization,
    "Bearer tok-1234567890",
  );
});

void test("record endpoints address the zone and keep the envelope shape", async () => {
  const { client, calls } = clientFor(
    respondWith({
      success: true,
      result: {
        id: "rec-1",
        zone_id: "zone-1",
        name: "API.example.com.",
        type: "a",
        content: "203.0.113.5",
        ttl: 120,
        proxied: false,
      },
    }),
  );
  const record = await client.createRecord("zone-1", {
    name: "  api.example.com  ",
    type: "a",
    content: "203.0.113.5",
    ttl: 120,
    proxied: false,
  });
  assert.equal(calls[0].url, `${CLOUDFLARE_API_BASE}/zones/zone-1/dns_records`);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(record.id, "rec-1");
  assert.equal(record.ttl, 120);
  const body = requestBody(calls[0]);
  assert.equal(body.name, "api.example.com");
  assert.equal(body.type, "A");
});

void test("an unsuccessful envelope becomes a coded api error", async () => {
  const { client } = clientFor(
    respondWith(
      {
        success: false,
        errors: [{ code: 112, message: "CNAME records cannot be created at the apex" }],
      },
      400,
    ),
  );
  await assert.rejects(
    () =>
      client.createRecord("zone-1", {
        name: "example.com",
        type: "CNAME",
        content: "target.example.com",
        ttl: 1,
        proxied: false,
      }),
    (error: unknown) => {
      assert.ok(error instanceof CloudflareApiError);
      assert.equal(error.code, 112);
      assert.match(error.message, /CNAME/);
      return true;
    },
  );
});

void test("rate limits carry a retry window", async () => {
  const { client } = clientFor(
    respondWith(
      { success: false, errors: [{ code: 10107, message: "rate limited" }] },
      429,
      { "retry-after": "7" },
    ),
  );
  await assert.rejects(
    () => client.listZones(),
    (error: unknown) => {
      assert.ok(error instanceof CloudflareRateLimitError);
      assert.equal(error.retryAfterMs, 7000);
      return true;
    },
  );
});

void test("transport failures never leak as raw fetch errors", async () => {
  const { client } = clientFor(() => Promise.reject(new TypeError("fetch failed")));
  await assert.rejects(() => client.listZones(), CloudflareNetworkError);
});

void test("token verification uses the token endpoint, not account scope", async () => {
  const { client, calls } = clientFor(
    respondWith({ success: true, result: { id: "token-1", status: "active" } }),
  );
  const info = await client.verifyToken();
  assert.equal(calls[0].url, `${CLOUDFLARE_API_BASE}/user/tokens/verify`);
  assert.deepEqual(info, { status: "active", id: "token-1" });
});

void test("sanitizing truncates and redacts token-like material", () => {
  const secret = "v1z0abcdefghijklmnopqrstuvwxyz0123456";
  const safe = sanitizeCloudflareMessage(`rejected ${secret} ${"x".repeat(400)}`);
  assert.equal(safe.includes(secret), false);
  assert.ok(safe.length <= 300);
});
