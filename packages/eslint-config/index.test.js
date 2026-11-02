import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { ESLint } from "eslint";
import { moonwitnessConfig } from "./index.js";

// Effective-config tests for the shared ESLint flat-config factory.
//
// These tests load the *composed* config (root composer + factory) through the
// real ESLint API and assert that the rule set that would actually be applied
// to representative workspace paths is the intended one. They fail if the root
// composer stops applying the shared rules or if a representative boundary
// disappears from the effective configuration.
//
// Coverage is split by path family so that a per-path override cannot silently
// weaken a boundary that was previously global:
//   - web TSX (apps/web/src/**)     — UI consistency + browser boundary
//   - web script (apps/web/scripts)  — node globals only, no browser boundary
//   - API TS (apps/api/src/**)       — clean code + credential-store boundary
//   - addon TS (packages/ql_*/src)   — clean code, no browser boundary
//   - test TS (packages/*/src/*.test) — clean code
//   - tooling (root scripts)          — clean code, node globals

// Workspace root, derived from this file's location. `path.resolve` normalises
// the host separator so the tests behave identically on POSIX and Windows.
const ROOT = path.resolve(import.meta.dirname, "..", "..");

// The flat-config composer resolves `overrideConfigFile` relative to the
// process cwd, and this package has no local config. Run from the workspace
// root so the root `eslint.config.mjs` is the one ESLint composes.
process.chdir(ROOT);

function loadConfig(files) {
  const linter = new ESLint({
    overrideConfigFile: `${ROOT}/eslint.config.mjs`,
    cwd: ROOT,
  });
  // `calculateConfigForFile` resolves the flat config for a single file.
  // Pass absolute paths so the resolution is independent of the process cwd
  // and reproducible on CI.
  return linter.calculateConfigForFile(`${ROOT}/${files[0]}`);
}

const webTsx = "apps/web/src/app/page.tsx";
const webScript = "apps/web/scripts/check-bundle-budget.mjs";
const apiTs = "apps/api/src/connectors/os-credential-store.ts";
const addonTs = "packages/ql_ai/models/ai_provider.ts";
const addonTestTs = "packages/agent-runtime/src/index.test.ts";
const toolingTs = "scripts/verify_acls.js";

// ESLint normalises severities to numbers (0 = off, 1 = warn, 2 = error) in
// the effective config, so accept either the numeric or the string form.
function severityLevel(actual) {
  if (actual === undefined) return undefined;
  const level = Array.isArray(actual) ? actual[0] : actual;
  if (level === "off") return 0;
  if (level === "warn") return 1;
  if (level === "error") return 2;
  return level;
}

function assertRule(config, ruleId, expected) {
  const actual = config.rules?.[ruleId];
  assert.notEqual(
    actual,
    undefined,
    `expected rule ${ruleId} to be present in effective config`,
  );
  assert.strictEqual(
    severityLevel(actual),
    severityLevel(expected),
    `expected rule ${ruleId} to be ${expected}, got ${JSON.stringify(actual)}`,
  );
}

function assertRuleAbsent(config, ruleId) {
  assert.strictEqual(
    config.rules?.[ruleId],
    undefined,
    `expected rule ${ruleId} to be absent from effective config`,
  );
}

test("web TSX keeps UI consistency and browser boundary rules", async () => {
  const config = await loadConfig([webTsx]);
  assertRule(config, "no-restricted-syntax", "error");
  assertRule(config, "no-restricted-imports", "error");
  assertRule(config, "no-restricted-properties", "error");
  assertRule(config, "no-restricted-globals", "error");
  assertRule(config, "@next/next/no-html-link-for-pages", "error");
  assertRule(config, "@typescript-eslint/no-explicit-any", "error");
  assertRule(config, "@typescript-eslint/no-non-null-assertion", "error");
  assertRule(config, "no-console", "warn");
});

test("web scripts use node globals and no browser boundary", async () => {
  const config = await loadConfig([webScript]);
  // `.mjs` scripts are plain JavaScript, so the TypeScript clean-code rules do
  // not apply. What must still hold is that the script is not caught by the
  // browser/HTTP boundary that is scoped to the web app's TypeScript sources.
  assertRuleAbsent(config, "no-restricted-globals");
  assertRuleAbsent(config, "no-restricted-imports");
  assertRuleAbsent(config, "no-restricted-properties");
});

test("API connectors keep credential-store and contract boundaries", async () => {
  const config = await loadConfig([apiTs]);
  assertRule(config, "no-restricted-imports", "error");
  assertRule(config, "@typescript-eslint/no-explicit-any", "error");
});

test("addon source keeps clean code but no browser boundary", async () => {
  const config = await loadConfig([addonTs]);
  assertRule(config, "@typescript-eslint/no-explicit-any", "error");
  assertRuleAbsent(config, "no-restricted-globals");
});

test("addon tests keep clean code", async () => {
  const config = await loadConfig([addonTestTs]);
  assertRule(config, "@typescript-eslint/no-explicit-any", "error");
});

test("tooling keeps clean code", async () => {
  const config = await loadConfig([toolingTs]);
  // Root-level tooling is plain JavaScript, so the TypeScript clean-code rules
  // do not apply. What must still hold is that tooling is not caught by the
  // browser/HTTP boundary that is scoped to the web app.
  assertRuleAbsent(config, "no-restricted-globals");
  assertRuleAbsent(config, "no-restricted-imports");
  assertRuleAbsent(config, "no-restricted-properties");
});

test("the factory rejects a missing tsconfigRootDir", () => {
  assert.throws(() => moonwitnessConfig({}), /tsconfigRootDir/);
});

test("the factory composes the shared rule fragments", () => {
  const fragments = moonwitnessConfig({ tsconfigRootDir: ROOT }).length;
  assert.ok(fragments > 0, "moonwitnessConfig must return a non-empty config array");
});

// Regression guard: the shared rules must actually *fire* on offending code,
// not merely be present in the effective config. If the root composer ever
// stops applying the factory's blocks, these lint results flip from failing
// to passing.
//
// The probe file is written into the web app so that the type-aware
// `projectService` resolves it; each test removes it in a `finally` so the
// file never reaches the working tree.
const probePath = `${ROOT}/apps/web/src/app/__boundary_probe__.tsx`;

function writeProbe(source) {
  fs.writeFileSync(probePath, source);
}

function removeProbe() {
  try {
    fs.unlinkSync(probePath);
  } catch {
    // already absent — fine
  }
}

test("a web TSX file importing a server-only addon is rejected", async () => {
  writeProbe(
    `import { orm } from "ql_orm";\nexport default function Page() { return <div />; }\n`,
  );
  try {
    const linter = new ESLint({
      overrideConfigFile: `${ROOT}/eslint.config.mjs`,
      cwd: ROOT,
    });
    const report = await linter.lintFiles([probePath]);
    const messages = report[0]?.messages ?? [];
    const browserBoundary = messages.filter((m) =>
      m.ruleId === "no-restricted-imports",
    );
    assert.ok(
      browserBoundary.length > 0,
      `expected no-restricted-imports to fire on a ql_orm import in apps/web, got ${JSON.stringify(messages.map((m) => m.ruleId))}`,
    );
  } finally {
    removeProbe();
  }
});

test("a web TSX file using raw fetch is rejected", async () => {
  writeProbe(
    `export default function Page() { return fetch("/api"); }\n`,
  );
  try {
    const linter = new ESLint({
      overrideConfigFile: `${ROOT}/eslint.config.mjs`,
      cwd: ROOT,
    });
    const report = await linter.lintFiles([probePath]);
    const messages = report[0]?.messages ?? [];
    const boundary = messages.filter(
      (m) =>
        m.ruleId === "no-restricted-properties" ||
        m.ruleId === "no-restricted-globals",
    );
    assert.ok(
      boundary.length > 0,
      `expected the HTTP boundary to fire on a raw fetch in apps/web, got ${JSON.stringify(messages.map((m) => m.ruleId))}`,
    );
  } finally {
    removeProbe();
  }
});