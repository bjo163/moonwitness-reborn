export class ProviderConfigurationError extends Error {}

export function normalizeProviderBaseUrl(value: unknown): string {
  if (typeof value !== "string" || value.length > 300) {
    throw new ProviderConfigurationError(
      "Base URL must be a URL under 300 characters.",
    );
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ProviderConfigurationError("Base URL must be a valid URL.");
  }
  const isLoopback =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new ProviderConfigurationError(
      "Provider URL must use HTTPS (HTTP is allowed only for localhost) and must not contain credentials, query, or fragment.",
    );
  }
  return value.replace(/\/+$/, "");
}

export function validateProviderBaseUrl(value: unknown): string | undefined {
  try {
    normalizeProviderBaseUrl(value);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid provider URL.";
  }
}
