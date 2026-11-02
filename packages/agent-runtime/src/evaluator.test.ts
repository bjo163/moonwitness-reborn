import assert from "node:assert/strict";
import test from "node:test";
import type { ModelProvider } from "./index.js";
import {
  calculateMetrics,
  judgeResponse,
  type JudgmentCriteria,
} from "./evaluator.js";

void test("calculateMetrics produces correct precision, recall, f1 and accuracy", () => {
  const counts = {
    truePositives: 80,
    falsePositives: 20,
    falseNegatives: 10,
    trueNegatives: 90,
  };

  const metrics = calculateMetrics(counts);

  // Precision = 80 / (80 + 20) = 0.8
  assert.equal(metrics.precision, 0.8);
  // Recall = 80 / (80 + 10) = 80/90 ≈ 0.8889
  assert.equal(Number(metrics.recall.toFixed(4)), 0.8889);
  // F1 = (2 * 0.8 * (80/90)) / (0.8 + 80/90) ≈ 0.8421
  assert.equal(Number(metrics.f1.toFixed(4)), 0.8421);
  // Accuracy = (80 + 90) / 200 = 0.85
  assert.equal(metrics.accuracy, 0.85);
});

void test("calculateMetrics handles zero denominator division without NaN", () => {
  const counts = {
    truePositives: 0,
    falsePositives: 0,
    falseNegatives: 0,
    trueNegatives: 0,
  };

  const metrics = calculateMetrics(counts);
  assert.equal(metrics.precision, 0);
  assert.equal(metrics.recall, 0);
  assert.equal(metrics.f1, 0);
  assert.equal(metrics.accuracy, 0);
});

void test("judgeResponse parses model evaluation JSON correctly", async () => {
  const mockJudge: ModelProvider = {
    generate(messages) {
      assert.ok(messages.length > 0);
      return Promise.resolve(
        JSON.stringify({
          passed: true,
          score: 9.5,
          reasoning: "The answer faithfully follows the Quranic passage without hallucinations.",
        }),
      );
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
