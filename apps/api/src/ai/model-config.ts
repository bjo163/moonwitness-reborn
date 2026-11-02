import type { OpenAICompatibleProviderOptions } from "@moonwitness/agent-runtime";

export type ModelProviderMode = "openai-compatible" | "freellmapi";

export interface ModelProviderConfigResult {
  mode: ModelProviderMode;
  config?: OpenAICompatibleProviderOptions;
  missingApiKey: boolean;
}

function parseMode(rawMode: string | undefined): ModelProviderMode {
  if (rawMode === undefined || rawMode === "") {
    return "openai-compatible";
  }
  if (rawMode === "openai-compatible" || rawMode === "freellmapi") {
    return rawMode;
  }
  throw new Error(
    `Unsupported MODEL_PROVIDER '${rawMode}'. Expected 'openai-compatible' or 'freellmapi'.`,
  );
}

export function resolveModelProviderConfig(
  env: NodeJS.ProcessEnv,
): ModelProviderConfigResult {
  const configuredMode = env.MODEL_PROVIDER?.trim().toLowerCase();
  const mode = parseMode(configuredMode);

  const isFreeLlmApi = mode === "freellmapi";
  const rawKey = isFreeLlmApi ? env.FREELLMAPI_API_KEY : env.MODEL_API_KEY;
  const apiKey = rawKey?.trim();
  if (apiKey === undefined || apiKey === "") {
    return { mode, missingApiKey: true };
  }

  const modelSetting = isFreeLlmApi
    ? (env.FREELLMAPI_MODEL ?? "auto")
    : env.MODEL_NAME;
  const model = modelSetting?.trim();
  if (model === undefined || model === "") {
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
