import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateMetrics,
  judgeResponse,
  type ClassificationCounts,
  type JudgmentCriteria,
} from "./evaluator.js";
import type { AgentMessage, ModelProvider } from "./index.js";

void test("calculateMetrics computes precision, recall, and f1 accurately", () => {
  const counts: ClassificationCounts = {
    truePositives: 8,
    falsePositives: 2,
    falseNegatives: 2,
    trueNegatives: 8,
  };

  const metrics = calculateMetrics(counts);
  assert.equal(metrics.precision, 0.8);
  assert.equal(metrics.recall, 0.8);
  assert.equal(metrics.f1, 0.8);
  assert.equal(metrics.accuracy, 0.8);
});

void test("calculateMetrics handles zero division defensively", () => {
  const zeroCounts: ClassificationCounts = {
    truePositives: 0,
    falsePositives: 0,
    falseNegatives: 0,
    trueNegatives: 0,
  };

  const metrics = calculateMetrics(zeroCounts);
  assert.equal(metrics.precision, 0);
  assert.equal(metrics.recall, 0);
  assert.equal(metrics.f1, 0);
  assert.equal(metrics.accuracy, 0);
});

void test("judgeResponse parses model evaluation JSON correctly", async () => {
  const mockJudge: ModelProvider = {
    async generate(_messages: readonly AgentMessage[]): Promise<string> {
      return JSON.stringify({
        passed: true,
        score: 9.5,
        reasoning: "The answer faithfully follows the Quranic passage without hallucinations.",
      });
    },
  };

  const criteria: JudgmentCriteria = {
    name: "faithfulness",
    question: "Is the response faithful to the source?",
    rubric: "Score 10 if every claim is grounded in the text, otherwise score low.",
  };

  const judgment = await judgeResponse(
    mockJudge,
    {
      input: "What is mentioned in Surah Al-Fatiha verse 1?",
      context: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      output: "It begins with Bismillah mentioning Allah the Entirely Merciful.",
      referenceGroundTruth: "Basmalah",
    },
    criteria,
  );

  assert.equal(judgment.passed, true);
  assert.equal(judgment.score, 9.5);
  assert.match(judgment.reasoning, /Quranic passage/);
});
