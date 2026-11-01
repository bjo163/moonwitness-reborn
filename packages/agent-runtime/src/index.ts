import type { ChatRole } from "@moonwitness/types";

export interface AgentMessage {
  role: "system" | ChatRole;
  content: string;
}

export interface ModelProvider {
  generate(messages: readonly AgentMessage[]): Promise<string>;
}

export { OpenAICompatibleProvider } from "./openai-compatible-provider.js";
export type { OpenAICompatibleProviderOptions } from "./openai-compatible-provider.js";

export interface AgentRequest {
  input: string;
  instructions?: string;
  history?: readonly AgentHistoryMessage[];
}

export interface AgentHistoryMessage {
  role: ChatRole;
  content: string;
}

export async function runAgent(
  provider: ModelProvider,
  request: AgentRequest,
): Promise<string> {
  const input = request.input.trim();
  if (!input) {
    throw new Error("Agent input must not be empty.");
  }

  const messages: AgentMessage[] = [];
  if (request.instructions?.trim()) {
    messages.push({ role: "system", content: request.instructions.trim() });
  }
  for (const message of request.history ?? []) {
    messages.push({ role: message.role, content: message.content });
  }
  messages.push({ role: "user", content: input });

  return provider.generate(messages);
}
