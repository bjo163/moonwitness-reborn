import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

/**
 * `packages/ui/styles/tokens.css` is declared the single source of truth for
 * colours and typography (MW-ADR-020), and MW-0572 froze the legacy
 * `--ql-ui-*` aliases so existing `.ql-*` rules keep resolving. Both claims are
 * verifiable statically, and both are easy to break from either side: a rule
 * can reach for a token nobody declared, a screen can invent a colour name, or
 * an alias can silently disappear during a cleanup.
 */
const STYLES = join(import.meta.dirname, "..", "styles");
const SOURCE = join(import.meta.dirname, "..", "src");

const tokensCss = readFileSync(join(STYLES, "tokens.css"), "utf8");
const themeBlock = /@theme\s*\{([^}]*)\}/.exec(tokensCss)?.[1] ?? "";
const rootBlock = /:root\s*\{([^}]*)\}/.exec(tokensCss)?.[1] ?? "";

const declared = new Set<string>();
for (const block of [themeBlock, rootBlock]) {
  for (const match of block.matchAll(/(--[\w-]+)\s*:/g)) {
    declared.add(match[1]);
  }
}

const colourNamespaces = new Set([
  "bg",
  "text",
  "border",
  "divide",
  "outline",
  "ring",
  "placeholder",
  "accent",
  "fill",
  "stroke",
]);

/**
 * The design system's own colour vocabulary. A utility that reaches for one of
 * these stems must resolve to a declared token; `text-sm`, `border-t` and
 * `font-semibold` are Tailwind scale utilities and are deliberately out of
 * scope here, so the check stays free of a maintained scale allowlist.
 */
const designStems = ["ink", "muted", "panel", "hairline", "acid", "danger", "void", "hud"];

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? cssFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

void test("the theme and root blocks declare the tokens the package relies on", () => {
  for (const token of [
    "--color-ink",
    "--color-ink-soft",
    "--color-muted",
    "--color-panel",
    "--color-panel-raised",
    "--color-panel-deep",
    "--color-panel-deeper",
    "--color-panel-edge",
    "--color-panel-well",
    "--color-hairline",
    "--color-hairline-soft",
    "--color-hairline-strong",
    "--color-acid",
    "--color-acid-dark",
    "--color-acid-muted",
    "--color-acid-shadow",
    "--color-danger",
    "--color-void",
    "--font-sans",
    "--font-mono",
    "--shadow-hud",
    "--shadow-hud-sm",
  ]) {
    assert.equal(declared.has(token), true, `tokens.css does not declare ${token}`);
  }
});

void test("every --ql-ui-* alias consumed by the CSS layers is still declared", () => {
  const used = new Set<string>();
  for (const file of cssFiles(STYLES)) {
    if (!file.endsWith(".css")) continue;
    const css = readFileSync(file, "utf8");
    for (const match of css.matchAll(/var\(\s*(--[\w-]+)\s*[,)]/g)) {
      used.add(match[1]);
    }
  }
  for (const token of used) {
    assert.equal(
      declared.has(token),
      true,
      `${token} is consumed by the stylesheet but never declared in tokens.css`,
    );
  }
});

void test("every design-token utility used by a component resolves to a declared token", () => {
  const offenders: string[] = [];
  for (const file of cssFiles(SOURCE)) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/className=\{?\{?\s*["'`]([^"'`]+)["'`]/g)) {
      for (const token of match[1].split(/\s+/)) {
        const utility = /^(?:[\w-]+:)*([\w-]+)-([\w-]+)$/.exec(token);
        if (!utility || !colourNamespaces.has(utility[1])) continue;
        const suffix = utility[2];
        if (!designStems.some((stem) => suffix === stem || suffix.startsWith(`${stem}-`))) {
          continue;
        }
        if (!declared.has(`--color-${suffix}`)) {
          offenders.push(`${file}: ${token}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], "components use undeclared design tokens");
});

void test("shadow utilities used by components resolve to a declared shadow token", () => {
  const offenders: string[] = [];
  for (const file of cssFiles(SOURCE)) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    for (const match of readFileSync(file, "utf8").matchAll(/["'`]([^"'`]*\bshadow-[\w-]+[^"'`]*)["'`]/g)) {
      for (const token of match[1].split(/\s+/)) {
        const utility = /^(?:[\w-]+:)*shadow-([\w-]+)$/.exec(token);
        if (!utility) continue;
        if (!["hud", "hud-sm"].includes(utility[1])) continue;
        if (!declared.has(`--shadow-${utility[1]}`)) {
          offenders.push(`${file}: ${token}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], "components use undeclared shadow tokens");
});

void test("the legacy --ql-ui-* surface documented by MW-0572 is intact", () => {
  for (const alias of [
    "--ql-ui-ink",
    "--ql-ui-muted",
    "--ql-ui-panel",
    "--ql-ui-panel-raised",
    "--ql-ui-border",
    "--ql-ui-acid",
    "--ql-ui-acid-dark",
    "--ql-ui-danger",
    "--ql-ui-font-mono",
    "--ql-ui-font-sans",
  ]) {
    assert.equal(rootBlock.includes(`${alias}:`), true, `${alias} was removed`);
  }
});
