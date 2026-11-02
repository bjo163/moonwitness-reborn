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

export interface FallbackProviderOptions {
  timeoutMs?: number;
  maxRetries?: number;
  onAuditLog?: (event: {
    providerId: string;
    providerName: string;
    attempt: number;
    success: boolean;
    latencyMs: number;
    error?: string;
  }) => void;
}

export function createFallbackProvider(
  configuredProviders: readonly RoutedModelProvider[],
  factory: ModelProviderFactory = (config) =>
    new OpenAICompatibleProvider(config),
  options: FallbackProviderOptions = {},
): ModelProvider {
  if (configuredProviders.length === 0) {
    throw new Error("At least one enabled model provider is required.");
  }
  const timeoutMs = options.timeoutMs ?? 3000;
  const maxRetries = options.maxRetries ?? 0;
  const providers = configuredProviders.map(({ id, name, config }) => ({
    id,
    name,
    provider: factory(config),
  }));

  return {
    async generate(messages: readonly AgentMessage[]) {
      const failures: string[] = [];

      for (const { id, name, provider } of providers) {
        let attempt = 0;
        let lastError: Error | undefined;

        while (attempt <= maxRetries) {
          attempt += 1;
          const startTime = Date.now();
          try {
            // Race with timeout
            const result = await Promise.race([
              provider.generate(messages),
              new Promise<never>((_, reject) => {
                setTimeout(
                  () =>
                    reject(
                      new Error(
                        `Provider '${name}' timed out after ${timeoutMs}ms.`,
                      ),
                    ),
                  timeoutMs,
                );
              }),
            ]);

            const latencyMs = Date.now() - startTime;
            options.onAuditLog?.({
              providerId: id,
              providerName: name,
              attempt,
              success: true,
              latencyMs,
            });

            return result;
          } catch (error) {
            const latencyMs = Date.now() - startTime;
            const reason =
              error instanceof Error ? error.message : "Unknown provider error";
            lastError = error instanceof Error ? error : new Error(reason);

            options.onAuditLog?.({
              providerId: id,
              providerName: name,
              attempt,
              success: false,
              latencyMs,
              error: reason,
            });

            console.warn(
              `Model provider '${name}' (${id}) attempt ${attempt} failed: ${reason}`,
            );
          }
        }

        failures.push(`${name} (${lastError?.message ?? "failed"})`);
      }

      throw new Error(
        `All configured model providers failed: ${failures.join(", ")}.`,
      );
    },
  };
}
