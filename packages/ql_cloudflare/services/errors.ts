/**
 * Messages are truncated and scrubbed before they reach a log line, an audit
 * row, or the browser, because an upstream error can echo request material.
 */
const BEARER = /Bearer\s+[A-Za-z0-9._-]{12,}/gi;
const TOKENISH =
  /(?=[A-Za-z0-9_-]{35,}\b)(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{35,}/g;

export function sanitizeCloudflareMessage(value: string): string {
  return value
    .slice(0, 300)
    .replace(BEARER, "Bearer [redacted]")
    .replace(TOKENISH, "[redacted]");
}

export class CloudflareApiError extends Error {
  readonly name = "CloudflareApiError";
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(sanitizeCloudflareMessage(message));
  }
}

export class CloudflareRateLimitError extends Error {
  readonly name = "CloudflareRateLimitError";
  constructor(readonly retryAfterMs: number) {
    super("Cloudflare membatasi laju permintaan; coba lagi sebentar.");
  }
}

export class CloudflareNetworkError extends Error {
  readonly name = "CloudflareNetworkError";
  constructor(message = "Cloudflare tidak dapat dijangkau.") {
    super(sanitizeCloudflareMessage(message));
  }
}
