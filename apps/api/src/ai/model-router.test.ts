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
    { maxRetries: 0 },
  );
  await assert.rejects(provider.generate([]), /All configured model providers failed: Only/);
});

void test("fallback provider triggers failover on timeout and emits audit logs", async () => {
  const auditLogs: unknown[] = [];
  const provider = createFallbackProvider(
    [
      {
        id: "slow",
        name: "SlowPrimary",
        config: { apiKey: "slow-key", baseUrl: "https://slow.example/v1", model: "slow-m" },
      },
      {
        id: "fast",
        name: "FastFallback",
        config: { apiKey: "fast-key", baseUrl: "https://fast.example/v1", model: "fast-m" },
      },
    ],
    (config): ModelProvider => ({
      generate() {
        if (config.model === "slow-m") {
          return new Promise((resolve) => setTimeout(() => resolve("slow response"), 200));
        }
        return Promise.resolve("instant fallback response");
      },
    }),
    {
      timeoutMs: 50,
      maxRetries: 0,
      onAuditLog: (log) => auditLogs.push(log),
    },
  );

  const result = await provider.generate([{ role: "user", content: "Salam" }]);
  assert.equal(result, "instant fallback response");
  assert.equal(auditLogs.length, 2);
  assert.equal((auditLogs[0] as { success: boolean }).success, false);
  assert.equal((auditLogs[1] as { success: boolean }).success, true);
});
