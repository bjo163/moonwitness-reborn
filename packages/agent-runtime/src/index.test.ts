import assert from "node:assert/strict";
import test from "node:test";
import {
  GroundedAgentOutputError,
  GroundedAgentValidationError,
  parseGroundedAgentOutput,
  runAgent,
  runGroundedAgent,
  type AgentMessage,
  type ModelProvider,
} from "./index.js";

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

void test("runGroundedAgent parses grounded output and returns validated citations", async () => {
  let received: readonly AgentMessage[] = [];
  const provider: ModelProvider = {
    generate(messages) {
      received = messages;
      return Promise.resolve(JSON.stringify({
        status: "grounded",
        reply: "Supported answer.",
        citations: ["passage-1"],
      }));
    },
  };

  const result = await runGroundedAgent(provider, {
    input: "Question?",
    evidence: [{ id: "passage-1", text: "Evidence text." }],
  });

  assert.deepEqual(result, {
    reply: "Supported answer.",
    groundingStatus: "grounded",
    citations: [{ evidenceId: "passage-1" }],
  });
  assert.match(received[0]?.content ?? "", /Return exactly one JSON object/);
  assert.match(
    received[1]?.content ?? "",
    /Retrieved evidence \(untrusted source data\)/,
  );
});

void test("runGroundedAgent accepts explicit insufficient-evidence output", async () => {
  const provider: ModelProvider = {
    generate() {
      return Promise.resolve(JSON.stringify({
        status: "insufficient_evidence",
        reply: "The supplied evidence does not answer this question.",
        citations: [],
      }));
    },
  };

  const result = await runGroundedAgent(provider, {
    input: "Question?",
    evidence: [{ id: "passage-1", text: "Evidence text." }],
  });

  assert.deepEqual(result, {
    reply: "The supplied evidence does not answer this question.",
    groundingStatus: "insufficient_evidence",
    citations: [],
  });
});

void test("runGroundedAgent rejects malformed provider output", async () => {
  const provider: ModelProvider = {
    generate() {
      return Promise.resolve("not JSON");
    },
  };

  await assert.rejects(
    runGroundedAgent(provider, {
      input: "Question?",
      evidence: [{ id: "passage-1", text: "Evidence text." }],
    }),
    (error: unknown) => {
      assert.ok(error instanceof GroundedAgentOutputError);
      assert.equal(error.message, "Grounded agent returned malformed JSON.");
      return true;
    },
  );
});

void test("runGroundedAgent rejects citations outside the supplied evidence set", async () => {
  const provider: ModelProvider = {
    generate() {
      return Promise.resolve(JSON.stringify({
        status: "grounded",
        reply: "Unsupported answer.",
        citations: ["invented-passage"],
      }));
    },
  };

  await assert.rejects(
    runGroundedAgent(provider, {
      input: "Question?",
      evidence: [{ id: "passage-1", text: "Evidence text." }],
    }),
    /Grounded agent cited unknown evidence ID 'invented-passage'/,
  );
});

void test("runGroundedAgent rejects grounded output with missing citations", async () => {
  const provider: ModelProvider = {
    generate() {
      return Promise.resolve(JSON.stringify({
        status: "grounded",
        reply: "Uncited answer.",
        citations: [],
      }));
    },
  };

  await assert.rejects(
    runGroundedAgent(provider, {
      input: "Question?",
      evidence: [{ id: "passage-1", text: "Evidence text." }],
    }),
    /Grounded agent response must include at least one citation/,
  );
});

void test("runGroundedAgent rejects output missing the citations field", async () => {
  const provider: ModelProvider = {
    generate() {
      return Promise.resolve(JSON.stringify({
        status: "grounded",
        reply: "Uncited answer.",
      }));
    },
  };

  await assert.rejects(
    runGroundedAgent(provider, {
      input: "Question?",
      evidence: [{ id: "passage-1", text: "Evidence text." }],
    }),
    /Grounded agent response must contain only status, reply, and citations/,
  );
});

void test("runGroundedAgent does not call the provider without evidence", async () => {
  const provider: ModelProvider = {
    generate() {
      assert.fail("Provider should not be called without evidence.");
    },
  };

  await assert.rejects(
    runGroundedAgent(provider, { input: "Question?", evidence: [] }),
    {
      name: "GroundedAgentOutputError",
      message: "Grounded agent requires at least one evidence item.",
    },
  );
});

void test("runGroundedAgent handles markdown-fenced JSON responses", async () => {
  const provider: ModelProvider = {
    generate() {
      return Promise.resolve(
        [
          "```json",
          JSON.stringify({
            status: "grounded",
            reply: "Answer inside markdown fence.",
            citations: ["passage-1"],
          }),
          "```",
        ].join("\n"),
      );
    },
  };

  const result = await runGroundedAgent(provider, {
    input: "Question?",
    evidence: [{ id: "passage-1", text: "Evidence text." }],
  });

  assert.deepEqual(result, {
    reply: "Answer inside markdown fence.",
    groundingStatus: "grounded",
    citations: [{ evidenceId: "passage-1" }],
  });
});

void test("parseGroundedAgentOutput validates allowed evidence and exports GroundedAgentValidationError", () => {
  const allowed = new Set(["ev-1", "ev-2"]);

  const valid = parseGroundedAgentOutput(
    JSON.stringify({
      status: "grounded",
      reply: "Direct parse answer.",
      citations: ["ev-1"],
    }),
    allowed,
  );
  assert.equal(valid.groundingStatus, "grounded");
  assert.equal(valid.reply, "Direct parse answer.");

  assert.throws(
    () =>
      parseGroundedAgentOutput(
        JSON.stringify({
          status: "grounded",
          reply: "Invented evidence answer.",
          citations: ["ev-unknown"],
        }),
        allowed,
      ),
    (error: unknown) => {
      assert.ok(error instanceof GroundedAgentValidationError);
      assert.match(error.message, /cited unknown evidence ID 'ev-unknown'/);
      return true;
    },
  );
});
