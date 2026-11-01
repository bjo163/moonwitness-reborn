import assert from "node:assert/strict";
import test from "node:test";
import { resolveAppBaseUrl, resolveMailConfig } from "./mail-config.js";

const complete = {
  SMTP_HOST: "mail.a-l-l-a-h.com",
  SMTP_USERNAME: "app@a-l-l-a-h.com",
  SMTP_PASSWORD: "a-long-service-password",
  SMTP_FROM: "MoonWitness <app@a-l-l-a-h.com>",
};

void test("mail stays disabled until the SMTP knobs are present", () => {
  assert.deepEqual(resolveMailConfig({}), {
    enabled: false,
    reason: "SMTP_HOST is not set.",
  });
  assert.deepEqual(resolveMailConfig({ SMTP_HOST: "  " }), {
    enabled: false,
    reason: "SMTP_HOST is not set.",
  });
  assert.deepEqual(resolveMailConfig({ SMTP_HOST: "mail.example.com" }), {
    enabled: false,
    reason: "SMTP_USERNAME is not set.",
  });
  assert.deepEqual(
    resolveMailConfig({ SMTP_HOST: "mail.example.com", SMTP_USERNAME: "app" }),
    { enabled: false, reason: "SMTP_PASSWORD is not set." },
  );
  assert.deepEqual(
    resolveMailConfig({
      SMTP_HOST: "mail.example.com",
      SMTP_USERNAME: "app",
      SMTP_PASSWORD: "secret",
    }),
    { enabled: false, reason: "SMTP_FROM is not set." },
  );
});

void test("a complete configuration selects implicit TLS on 465", () => {
  const resolved = resolveMailConfig(complete);
  assert.deepEqual(resolved, {
    enabled: true,
    config: {
      host: "mail.a-l-l-a-h.com",
      port: 465,
      secure: true,
      username: "app@a-l-l-a-h.com",
      password: "a-long-service-password",
      from: "MoonWitness <app@a-l-l-a-h.com>",
    },
  });
});

void test("submission ports other than 465 upgrade with STARTTLS", () => {
  for (const port of ["587", "2525"]) {
    const resolved = resolveMailConfig({ ...complete, SMTP_PORT: port });
    assert.equal(resolved.enabled, true);
    if (resolved.enabled) {
      assert.equal(resolved.config.port, Number(port));
      assert.equal(resolved.config.secure, false);
    }
  }
  const forced = resolveMailConfig({ ...complete, SMTP_SECURE: "true" });
  assert.equal(forced.enabled && forced.config.secure, true);
});

void test("a display name in SMTP_FROM does not hide a broken address", () => {
  const bare = resolveMailConfig({ ...complete, SMTP_FROM: "app@a-l-l-a-h.com" });
  assert.equal(bare.enabled && bare.config.from, "app@a-l-l-a-h.com");
  assert.throws(
    () => resolveMailConfig({ ...complete, SMTP_FROM: "MoonWitness <not-an-address>" }),
    /SMTP_FROM/,
  );
});

void test("an unusable SMTP setting fails fast at boot", () => {
  assert.throws(() => resolveMailConfig({ ...complete, SMTP_PORT: "0" }), /SMTP_PORT/);
  assert.throws(
    () => resolveMailConfig({ ...complete, SMTP_PORT: "2525x" }),
    /SMTP_PORT/,
  );
  assert.throws(
    () => resolveMailConfig({ ...complete, SMTP_SECURE: "maybe" }),
    /SMTP_SECURE/,
  );
  assert.throws(
    () => resolveMailConfig({ ...complete, SMTP_FROM: "not-an-address" }),
    /SMTP_FROM/,
  );
});

void test("the app base URL is trimmed to an origin usable in a link", () => {
  assert.equal(resolveAppBaseUrl({}), "http://localhost:3001");
  assert.equal(
    resolveAppBaseUrl({ APP_BASE_URL: "https://a-l-l-a-h.com///" }),
    "https://a-l-l-a-h.com",
  );
  assert.throws(
    () => resolveAppBaseUrl({ APP_BASE_URL: "ftp://a-l-l-a-h.com" }),
    /APP_BASE_URL/,
  );
});
