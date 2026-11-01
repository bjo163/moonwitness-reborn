export interface SmtpMailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
}

export type MailConfigResult =
  | { enabled: true; config: SmtpMailConfig }
  | { enabled: false; reason: string };

const DEFAULT_SUBMISSION_PORT = 465;
const DEFAULT_APP_BASE_URL = "http://localhost:3001";

export function resolveAppBaseUrl(env: NodeJS.ProcessEnv): string {
  const raw = readTrimmed(env.APP_BASE_URL) ?? DEFAULT_APP_BASE_URL;
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`APP_BASE_URL must be an http(s) URL, got '${raw}'.`);
  }
  return raw.replace(/\/+$/, "");
}

function readTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// "MoonWitness <app@example.com>" is a valid From header, so only the address
// part is checked; the display name is passed through for the mail client.
function assertDeliverableAddress(from: string): void {
  const address = from.includes("<")
    ? from.slice(from.lastIndexOf("<") + 1, from.lastIndexOf(">"))
    : from;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new Error(`SMTP_FROM must contain an email address, got '${from}'.`);
  }
}

export function resolveMailConfig(env: NodeJS.ProcessEnv): MailConfigResult {
  const host = readTrimmed(env.SMTP_HOST);
  if (!host) {
    return { enabled: false, reason: "SMTP_HOST is not set." };
  }

  const rawPort = readTrimmed(env.SMTP_PORT);
  const port = rawPort ? Number(rawPort) : DEFAULT_SUBMISSION_PORT;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`SMTP_PORT must be an integer between 1 and 65535, got '${rawPort}'.`);
  }

  const rawSecure = readTrimmed(env.SMTP_SECURE);
  if (rawSecure !== undefined && !["true", "false"].includes(rawSecure.toLowerCase())) {
    throw new Error(`SMTP_SECURE must be 'true' or 'false', got '${rawSecure}'.`);
  }
  // 465 is implicit TLS; 587 and 2525 upgrade with STARTTLS after a plain connect.
  const secure =
    rawSecure === undefined ? port === 465 : rawSecure.toLowerCase() === "true";

  const username = readTrimmed(env.SMTP_USERNAME);
  if (!username) {
    return { enabled: false, reason: "SMTP_USERNAME is not set." };
  }
  const password = readTrimmed(env.SMTP_PASSWORD);
  if (!password) {
    return { enabled: false, reason: "SMTP_PASSWORD is not set." };
  }
  const from = readTrimmed(env.SMTP_FROM);
  if (!from) {
    return { enabled: false, reason: "SMTP_FROM is not set." };
  }
  assertDeliverableAddress(from);

  return {
    enabled: true,
    config: { host, port, secure, username, password, from },
  };
}
