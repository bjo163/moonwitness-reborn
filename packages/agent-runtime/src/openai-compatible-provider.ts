import type { AgentMessage, ModelProvider } from "./index.js";

export interface OpenAICompatibleProviderOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  fetch?: typeof fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export class OpenAICompatibleProvider implements ModelProvider {
  private readonly endpoint: string;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: OpenAICompatibleProviderOptions) {
    const baseUrl = new URL(options.baseUrl);
    if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
      throw new Error("Model base URL must use HTTP or HTTPS.");
    }
    if (!options.apiKey.trim()) {
      throw new Error("Model API key must not be empty.");
    }
    if (!options.model.trim()) {
      throw new Error("Model name must not be empty.");
    }

    this.endpoint = `${options.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    this.fetcher = options.fetch ?? fetch;
  }

  async generate(messages: readonly AgentMessage[]): Promise<string> {
    const response = await this.fetcher(this.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.options.model,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Model provider returned HTTP ${response.status}.`);
    }

    let result: unknown;
    try {
      result = JSON.parse(await response.text()) as unknown;
    } catch {
      throw new Error("Model provider returned invalid JSON.");
    }

    const choices: unknown = isRecord(result)
      ? result.choices
      : undefined;
    const firstChoice = isUnknownArray(choices) ? choices[0] : undefined;
    const message = isRecord(firstChoice) ? firstChoice.message : undefined;
    const content = isRecord(message) ? message.content : undefined;
    if (typeof content !== "string") {
      throw new Error("Model provider response did not contain text.");
    }

    return content;
  }
}
