import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import {
  ConnectorCredentialError,
  extractToken,
  parseKeychainPlist,
  resolveCloudflareToken,
  type CredentialStoreRuntime,
} from "./os-credential-store.js";

const TOKEN = "v1z0abcdefghijklmnopqrstuvwxyz0123456";

function runtimeFor(
  files: Record<string, string>,
  overrides: Partial<CredentialStoreRuntime> = {},
): CredentialStoreRuntime {
  const home = "/home/tester";
  return {
    env: {},
    platform: "linux",
    homedir: () => home,
    readFile: (path: string) => {
      const key = Object.keys(files).find((name) => name === path);
      if (key === undefined) return Promise.reject(new Error("ENOENT"));
      return Promise.resolve(files[key]);
    },
    ...overrides,
  };
}

const xdgPath = join("/home/tester", ".config", "cloudflare", "token");

void test("the environment variable wins over any file", async () => {
  const credential = await resolveCloudflareToken(
    runtimeFor({ [xdgPath]: TOKEN }, { env: { CLOUDFLARE_API_TOKEN: `  ${TOKEN}  ` } }),
  );
  assert.equal(credential.source, "env");
  assert.equal(credential.ref, "env:CLOUDFLARE_API_TOKEN");
  assert.equal(credential.token, TOKEN);
});

void test("the CLI file format is parsed with quotes and line endings", async () => {
  const credential = await resolveCloudflareToken(
    runtimeFor({ [xdgPath]: `CF_API_TOKEN="${TOKEN}"\r\n` }),
  );
  assert.equal(credential.source, "config_file");
  assert.equal(credential.token, TOKEN);
  assert.equal(credential.ref, `file:${xdgPath}`);
});

void test("a bare single-line token file is accepted", async () => {
  const credential = await resolveCloudflareToken(runtimeFor({ [xdgPath]: TOKEN }));
  assert.equal(credential.token, TOKEN);
});

void test("the macOS keychain mirror is read without shelling out", async () => {
  const plistPath = join(
    "/home/tester",
    "Library",
    "Preferences",
    "plist",
    "dev.auth0.github.macos.KeychainAccess",
  );
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0">\n<dict>\n` +
    `  <key>com.cloudflare.api.access.token</key>\n  <string>CF_API_TOKEN=${TOKEN}</string>\n</dict>\n</plist>`;
  const credential = await resolveCloudflareToken(
    runtimeFor({ [plistPath]: xml, [xdgPath]: "should-not-be-used" }, { platform: "darwin" }),
  );
  assert.equal(credential.source, "keychain");
  assert.equal(credential.token, TOKEN);
});

void test("windows looks in APPDATA before the home config", async () => {
  const credential = await resolveCloudflareToken(
    runtimeFor(
      { [join("C:\\Users\\t\\AppData\\Roaming", "cloudflare", "token")]: `CF_API_TOKEN=${TOKEN}` },
      { platform: "win32", env: { APPDATA: "C:\\Users\\t\\AppData\\Roaming" }, homedir: () => "C:\\Users\\t" },
    ),
  );
  assert.equal(credential.token, TOKEN);
});

void test("a missing token is a clear error that never contains a value", async () => {
  await assert.rejects(
    () => resolveCloudflareToken(runtimeFor({})),
    (error: unknown) => {
      assert.ok(error instanceof ConnectorCredentialError);
      assert.match(error.message, /tidak ditemukan/i);
      assert.ok(!error.message.includes(TOKEN));
      return true;
    },
  );
});

void test("an unreadable file is reported as unreadable, not missing", async () => {
  await assert.rejects(
    () => resolveCloudflareToken(runtimeFor({ [xdgPath]: "one\n.two\nthree" })),
    /tidak terbaca|tidak dikenali/i,
  );
});

void test("extractToken ignores junk but keeps the documented format", () => {
  assert.equal(extractToken(`# comment\nCF_API_TOKEN=${TOKEN}`), TOKEN);
  assert.equal(extractToken(""), undefined);
  assert.equal(extractToken("a b c"), undefined);
  assert.equal(extractToken(`${TOKEN}\n${TOKEN}`), undefined);
  assert.equal(extractToken(`${"x".repeat(600)}`), undefined);
});

void test("plist parsing survives entity escaping and misses absent keys", () => {
  const xml = `<dict><key>com.cloudflare.api.access.token</key><string>v1&amp;${TOKEN}&lt;</string></dict>`;
  assert.equal(parseKeychainPlist(xml, "com.cloudflare.api.access.token"), `v1&${TOKEN}<`);
  assert.equal(parseKeychainPlist("<dict></dict>", "com.cloudflare.api.access.token"), undefined);
});
