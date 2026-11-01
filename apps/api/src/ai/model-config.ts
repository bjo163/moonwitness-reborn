import type { OpenAICompatibleProviderOptions } from "@moonwitness/agent-runtime";

export type ModelProviderMode = "openai-compatible" | "freellmapi";

export interface ModelProviderConfigResult {
  mode: ModelProviderMode;
  config?: OpenAICompatibleProviderOptions;
  missingApiKey: boolean;
}

export function resolveModelProviderConfig(
  env: NodeJS.ProcessEnv,
): ModelProviderConfigResult {
  const configuredMode = env.MODEL_PROVIDER?.trim().toLowerCase();
  const mode = configuredMode || "openai-compatible";
  if (mode !== "openai-compatible" && mode !== "freellmapi") {
    throw new Error(
      `Unsupported MODEL_PROVIDER '${mode}'. Expected 'openai-compatible' or 'freellmapi'.`,
    );
  }

  const isFreeLlmApi = mode === "freellmapi";
  const apiKey = (
    isFreeLlmApi ? env.FREELLMAPI_API_KEY : env.MODEL_API_KEY
  )?.trim();
  if (!apiKey) {
    return { mode, missingApiKey: true };
  }

  const modelSetting = isFreeLlmApi
    ? (env.FREELLMAPI_MODEL ?? "auto")
    : env.MODEL_NAME;
  const model = modelSetting?.trim();
  if (!model) {
    throw new Error(
      isFreeLlmApi
        ? "FREELLMAPI_MODEL must not be empty."
        : "MODEL_NAME must not be empty.",
    );
  }

  const baseUrl = isFreeLlmApi
    ? (env.FREELLMAPI_BASE_URL ?? "http://127.0.0.1:3002/v1")
    : (env.MODEL_BASE_URL ?? "https://api.openai.com/v1");
  return {
    mode,
    missingApiKey: false,
    config: { apiKey, model, baseUrl },
  };
}
