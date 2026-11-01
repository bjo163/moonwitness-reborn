import assert from "node:assert/strict";
import test from "node:test";
import {
  OpenAICompatibleProvider,
  type AgentMessage,
} from "./index.js";

void test("provider sends an OpenAI-compatible chat completion request", async () => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  const provider = new OpenAICompatibleProvider({
    baseUrl: "https://example.test/v1/",
    apiKey: "test-key",
    model: "test-model",
    fetch: (input, init) => {
      requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      requestInit = init;
      return Promise.resolve(new Response(
        JSON.stringify({ choices: [{ message: { content: "Hello!" } }] }),
        { status: 200 },
      ));
    },
  });
  const messages: AgentMessage[] = [{ role: "user", content: "Hi" }];

  assert.equal(await provider.generate(messages), "Hello!");
  assert.equal(
    requestUrl,
    "https://example.test/v1/chat/completions",
  );
  assert.equal(requestInit?.method, "POST");
  assert.equal(
    new Headers(requestInit?.headers).get("authorization"),
    "Bearer test-key",
  );
  const body = requestInit?.body;
  assert.equal(typeof body, "string");
  assert.deepEqual(JSON.parse(body as string), { model: "test-model", messages });
});

void test("provider reports unsuccessful and malformed responses", async () => {
  const unavailable = new OpenAICompatibleProvider({
    baseUrl: "https://example.test/v1",
    apiKey: "test-key",
    model: "test-model",
    fetch: () => Promise.resolve(new Response("unavailable", { status: 503 })),
  });
  await assert.rejects(unavailable.generate([]), {
    message: "Model provider returned HTTP 503.",
  });

  const malformed = new OpenAICompatibleProvider({
    baseUrl: "https://example.test/v1",
    apiKey: "test-key",
    model: "test-model",
    fetch: () => Promise.resolve(new Response("not json")),
  });
  await assert.rejects(malformed.generate([]), {
    message: "Model provider returned invalid JSON.",
  });
});
