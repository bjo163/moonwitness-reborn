import assert from "node:assert/strict";
import test from "node:test";
import type { ModelProvider } from "@moonwitness/agent-runtime";
import { createFallbackProvider } from "./model-router.js";

void test("fallback provider tries providers in configured order", async () => {
  const attempts: string[] = [];
  const provider = createFallbackProvider(
    [
      {
        id: "first",
        name: "First",
        config: { apiKey: "first-key", baseUrl: "https://first.example/v1", model: "m1" },
      },
      {
        id: "second",
        name: "Second",
        config: { apiKey: "second-key", baseUrl: "https://second.example/v1", model: "m2" },
      },
    ],
    (config): ModelProvider => ({
      generate() {
        attempts.push(config.model);
        if (config.model === "m1") {
          return Promise.reject(new Error("upstream unavailable"));
        }
        return Promise.resolve("reply from second");
      },
    }),
  );
  assert.equal(await provider.generate([{ role: "user", content: "Hi" }]), "reply from second");
  assert.deepEqual(attempts, ["m1", "m2"]);
});

void test("fallback provider reports failure when every provider fails", async () => {
  const provider = createFallbackProvider(
    [
      {
        id: "only",
        name: "Only",
        config: { apiKey: "key", baseUrl: "https://provider.example/v1", model: "m1" },
      },
    ],
    () => ({
      generate() {
        return Promise.reject(new Error("failed"));
      },
    }),
  );
  await assert.rejects(provider.generate([]), /All configured model providers failed: Only/);
});
