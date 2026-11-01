import assert from "node:assert/strict";
import test from "node:test";
import { MoonClient, MoonClientError } from "./index.js";

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

void test("password reset calls use the shared route table", async () => {
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
      return Promise.resolve(
        new Response(JSON.stringify({ sent: true, reset: true }), { status: 200 }),
      );
    },
  });

  await client.requestPasswordReset({ email: "bjo@a-l-l-a-h.com" });
  await client.resetPassword({ token: "abc", password: "a brand new long password" });

  assert.deepEqual(
    requests.map(({ url, method }) => ({ url, method })),
    [
      { url: "/api/auth/forgot-password", method: "POST" },
      { url: "/api/auth/reset-password", method: "POST" },
    ],
  );
  assert.deepEqual(JSON.parse(requests[0].body), { email: "bjo@a-l-l-a-h.com" });
  assert.deepEqual(JSON.parse(requests[1].body), {
    token: "abc",
    password: "a brand new long password",
  });
});
