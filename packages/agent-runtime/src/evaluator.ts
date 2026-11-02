import type { ModelProvider } from "./index.js";

export interface ClassificationCounts {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
}

export interface MetricScores {
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
}

export function calculateMetrics(counts: ClassificationCounts): MetricScores {
  const { truePositives, falsePositives, falseNegatives, trueNegatives } = counts;
  const precisionDenominator = truePositives + falsePositives;
  const precision = precisionDenominator > 0 ? truePositives / precisionDenominator : 0;

  const recallDenominator = truePositives + falseNegatives;
  const recall = recallDenominator > 0 ? truePositives / recallDenominator : 0;

  const f1Denominator = precision + recall;
  const f1 = f1Denominator > 0 ? (2 * precision * recall) / f1Denominator : 0;

  const total = truePositives + falsePositives + falseNegatives + trueNegatives;
  const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;

  return { precision, recall, f1, accuracy };
}

export interface JudgmentCriteria {
  name: "faithfulness" | "relevance" | "safety";
  question: string;
  rubric: string;
}

export interface EvaluationItem {
  input: string;
  context?: string;
  output: string;
  referenceGroundTruth?: string;
}

export interface EvaluationJudgment {
  passed: boolean;
  score: number;
  reasoning: string;
}

export async function judgeResponse(
  judgeModel: ModelProvider,
  item: EvaluationItem,
  criteria: JudgmentCriteria,
): Promise<EvaluationJudgment> {
  const prompt = [
    `You are an objective AI evaluation judge assessing the criteria: ${criteria.name}.`,
    `Rubric: ${criteria.rubric}`,
    `User Question: ${item.input}`,
    item.context ? `Source Context: ${item.context}` : "",
    item.referenceGroundTruth ? `Ground Truth Reference: ${item.referenceGroundTruth}` : "",
    `Agent Response: ${item.output}`,
    "Respond strictly with a JSON object in this format: {\"passed\": boolean, \"score\": number (1-10), \"reasoning\": string}",
  ]
    .filter(Boolean)
    .join("\n\n");

  const responseText = await judgeModel.generate([{ role: "user", content: prompt }]);
  try {
    const parsed = JSON.parse(responseText.trim()) as {
      passed?: boolean;
      score?: number;
      reasoning?: string;
    };
    return {
      passed: Boolean(parsed.passed),
      score: typeof parsed.score === "number" ? parsed.score : parsed.passed ? 10 : 0,
      reasoning: parsed.reasoning ?? responseText,
    };
  } catch {
    const isPassing = /passed["']?\s*:\s*true/i.test(responseText);
    return {
      passed: isPassing,
      score: isPassing ? 8 : 2,
      reasoning: responseText,
    };
  }
}
