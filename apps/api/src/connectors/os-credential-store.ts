import { readFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { join } from "node:path";

/**
 * Cloudflare credentials live in the OS store owned by the CLI/connector the
 * owner already installed, never in this app's database. This module reads it;
 * it must never shell out, log, or return the value to a client.
 */

export type CredentialSourceName = "env" | "keychain" | "config_file";

export interface ResolvedCredential {
  token: string;
  source: CredentialSourceName;
  /** Human-readable location that is safe to show and audit; never the value. */
  ref: string;
}

export class ConnectorCredentialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectorCredentialError";
  }
}

export interface CredentialStoreRuntime {
  env: Record<string, string | undefined>;
  platform: NodeJS.Platform;
  homedir: () => string;
  readFile: (path: string) => Promise<string>;
}

const TOKEN_ENV_VAR = "CLOUDFLARE_API_TOKEN";
const TOKEN_FILE_NAME = "token";
const TOKEN_VALUE_PREFIX = "CF_API_TOKEN=";
const KEYCHAIN_TOKEN_KEY = "com.cloudflare.api.access.token";
const MAX_TOKEN_LENGTH = 512;

const defaultRuntime: CredentialStoreRuntime = {
  env: process.env,
  platform: platform(),
  homedir,
  readFile: (path) => readFile(path, "utf8"),
};

export async function resolveCloudflareToken(
  runtime: CredentialStoreRuntime = defaultRuntime,
): Promise<ResolvedCredential> {
  const fromEnv = runtime.env[TOKEN_ENV_VAR]?.trim();
  if (fromEnv) {
    return { token: fromEnv, source: "env", ref: `env:${TOKEN_ENV_VAR}` };
  }

  if (runtime.platform === "darwin") {
    const plistPath = join(
      runtime.homedir(),
      "Library",
      "Preferences",
      "plist",
      "dev.auth0.github.macos.KeychainAccess",
    );
    try {
      const token = extractToken(
        parseKeychainPlist(await runtime.readFile(plistPath), KEYCHAIN_TOKEN_KEY) ?? "",
      );
      if (token) {
        return { token, source: "keychain", ref: `keychain:${KEYCHAIN_TOKEN_KEY}` };
      }
    } catch {
      // No mirrored keychain item is the normal case on non-CLI installs.
    }
  }

  const tried: string[] = [];
  for (const path of configFilePaths(runtime)) {
    let raw: string;
    try {
      raw = await runtime.readFile(path);
    } catch {
      continue;
    }
    tried.push(path);
    const token = extractToken(raw);
    if (token) {
      return { token, source: "config_file", ref: `file:${path}` };
    }
  }

  throw new ConnectorCredentialError(
    tried.length > 0
      ? `Token Cloudflare tidak terbaca dari ${tried.join(", ")}; format file tidak dikenali.`
      : `Token Cloudflare tidak ditemukan. Simpan di ${configFilePaths(runtime).join(" atau ")} atau set ${TOKEN_ENV_VAR}.`,
  );
}

/** Windows uses %APPDATA%, everything else uses the XDG-style home config. */
function configFilePaths(runtime: CredentialStoreRuntime): string[] {
  const appData = runtime.env.APPDATA;
  const candidates = [
    ...(appData ? [join(appData, "cloudflare", TOKEN_FILE_NAME)] : []),
    join(
      runtime.env.XDG_CONFIG_HOME?.trim() || join(runtime.homedir(), ".config"),
      "cloudflare",
      TOKEN_FILE_NAME,
    ),
  ];
  return [...new Set(candidates)];
}

/**
 * Mirrors the CLI's file format: `CF_API_TOKEN=<value>` on one line, quotes
 * optional. A bare single-line token is accepted too, because that is what the
 * connector that installed this owner's token actually writes.
 */
export function extractToken(raw: string): string | undefined {
  for (const line of raw.split("\n")) {
    if (!line.startsWith(TOKEN_VALUE_PREFIX)) continue;
    const value = line
      .slice(TOKEN_VALUE_PREFIX.length)
      .trim()
      .replace(/^"+/, "")
      .replace(/"+$/, "");
    if (value) return value;
  }

  const single = raw.trim();
  if (single && !/\s/.test(single) && single.length <= MAX_TOKEN_LENGTH) {
    return single;
  }
  return undefined;
}

/**
 * The macOS keychain mirror is an XML property list where the token sits as a
 * `<string>` right after its `<key>`. Parsed by hand: no dependency, and no
 * `security` subprocess (it cannot unlock a keychain without a TTY).
 */
export function parseKeychainPlist(xml: string, key: string): string | undefined {
  const keyIndex = xml.indexOf(`<key>${key}</key>`);
  if (keyIndex < 0) return undefined;
  const rest = xml.slice(keyIndex + `<key>${key}</key>`.length);
  const match = /<string>([\s\S]*?)<\/string>|<data>([\s\S]*?)<\/data>/.exec(rest);
  if (!match) return undefined;
  if (match[2] !== undefined) {
    const decoded = Buffer.from(match[2].replace(/\s+/g, ""), "base64").toString("utf8");
    return decoded.trim() || undefined;
  }
  const value = unescapeXml(match[1] ?? "").trim();
  return value || undefined;
}

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
