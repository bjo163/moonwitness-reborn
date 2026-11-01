import assert from "node:assert/strict";
import test from "node:test";
import { runAgent, type AgentMessage, type ModelProvider } from "./index.js";

void test("runAgent sends trimmed instructions and input to the provider", async () => {
  let received: readonly AgentMessage[] = [];
  const provider: ModelProvider = {
    generate(messages) {
      received = messages;
      return Promise.resolve("response");
    },
  };

  const result = await runAgent(provider, {
    instructions: "  Be helpful. ",
    input: "  Hello. ",
  });

  assert.equal(result, "response");
  assert.deepEqual(received, [
    { role: "system", content: "Be helpful." },
    { role: "user", content: "Hello." },
  ]);
});

void test("runAgent rejects empty input before calling the provider", async () => {
  const provider: ModelProvider = {
    generate() {
      assert.fail("Provider should not be called for empty input.");
    },
  };

  await assert.rejects(runAgent(provider, { input: "  " }), {
    message: "Agent input must not be empty.",
  });
});
