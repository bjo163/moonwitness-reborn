import {
  OpenAICompatibleProvider,
  type ModelProvider,
  type OpenAICompatibleProviderOptions,
  type AgentMessage,
} from "@moonwitness/agent-runtime";

export interface RoutedModelProvider {
  id: string;
  name: string;
  config: OpenAICompatibleProviderOptions;
}

export type ModelProviderFactory = (
  config: OpenAICompatibleProviderOptions,
) => ModelProvider;

export function createFallbackProvider(
  configuredProviders: readonly RoutedModelProvider[],
  factory: ModelProviderFactory = (config) =>
    new OpenAICompatibleProvider(config),
): ModelProvider {
  if (configuredProviders.length === 0) {
    throw new Error("At least one enabled model provider is required.");
  }
  const providers = configuredProviders.map(({ id, name, config }) => ({
    id,
    name,
    provider: factory(config),
  }));
  return {
    async generate(messages: readonly AgentMessage[]) {
      const failures: string[] = [];
      for (const { id, name, provider } of providers) {
        try {
          return await provider.generate(messages);
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : "Unknown provider error";
          console.warn(`Model provider '${name}' (${id}) failed: ${reason}`);
          failures.push(name);
        }
      }
      throw new Error(
        `All configured model providers failed: ${failures.join(", ")}.`,
      );
    },
  };
}
