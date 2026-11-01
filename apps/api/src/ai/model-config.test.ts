import assert from "node:assert/strict";
import test from "node:test";
import { resolveModelProviderConfig } from "./model-config.js";

void test("FreeLLMAPI mode defaults to its local gateway and automatic routing", () => {
  assert.deepEqual(
    resolveModelProviderConfig({
      MODEL_PROVIDER: "freellmapi",
      FREELLMAPI_API_KEY: "gateway-key",
    }),
    {
      mode: "freellmapi",
      missingApiKey: false,
      config: {
        apiKey: "gateway-key",
        model: "auto",
        baseUrl: "http://127.0.0.1:3002/v1",
      },
    },
  );
});

void test("FreeLLMAPI mode accepts an explicit gateway URL and model", () => {
  assert.deepEqual(
    resolveModelProviderConfig({
      MODEL_PROVIDER: "freellmapi",
      FREELLMAPI_API_KEY: "gateway-key",
      FREELLMAPI_MODEL: "auto:fast",
      FREELLMAPI_BASE_URL: "http://gateway.internal:31415/v1",
    }),
    {
      mode: "freellmapi",
      missingApiKey: false,
      config: {
        apiKey: "gateway-key",
        model: "auto:fast",
        baseUrl: "http://gateway.internal:31415/v1",
      },
    },
  );
});

void test("missing gateway key leaves inference disabled without inventing credentials", () => {
  assert.deepEqual(
    resolveModelProviderConfig({ MODEL_PROVIDER: "freellmapi" }),
    { mode: "freellmapi", missingApiKey: true },
  );
});

void test("existing OpenAI-compatible configuration remains supported", () => {
  assert.deepEqual(
    resolveModelProviderConfig({
      MODEL_API_KEY: "provider-key",
      MODEL_NAME: "example-model",
      MODEL_BASE_URL: "https://models.example/v1",
    }),
    {
      mode: "openai-compatible",
      missingApiKey: false,
      config: {
        apiKey: "provider-key",
        model: "example-model",
        baseUrl: "https://models.example/v1",
      },
    },
  );
});

void test("unsupported provider modes fail explicitly", () => {
  assert.throws(
    () => resolveModelProviderConfig({ MODEL_PROVIDER: "unknown" }),
    /Unsupported MODEL_PROVIDER/,
  );
});
