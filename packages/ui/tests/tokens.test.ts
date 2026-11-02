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
// `@theme` feeds Tailwind utilities; the `:root` blocks hold the `--ql-*`
// component palette and the legacy `--ql-ui-*` aliases. There is more than one
// `:root` block, so every one of them has to be collected.
const themeBlock = [...tokensCss.matchAll(/@theme\s*\{([^}]*)\}/g)]
  .map((match) => match[1])
  .join("\n");
const rootBlocks = [...tokensCss.matchAll(/:root\s*\{([^}]*)\}/g)]
  .map((match) => match[1])
  .join("\n");

const declared = new Set<string>();
for (const block of [themeBlock, rootBlocks]) {
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
const designStems = ["ink", "muted", "panel", "hairline", "acid", "danger", "success", "warning", "void", "hud"];

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
    "--color-success",
    "--color-warning",
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

void test("no stylesheet outside tokens.css writes a colour literal of its own", () => {
  // A `var(--token, #hex)` / `var(--token, rgba(…))` fallback is allowed: it is
  // defensive text for a token declared right here in tokens.css. Anything else
  // is a colour that escaped the single source of truth (MW-ADR-020) — the
  // browser audit of this migration found `rgba()` tints living in
  // `components.css` that this rule would not have caught with a hex-only check.
  const offenders: string[] = [];
  for (const file of cssFiles(STYLES)) {
    if (!file.endsWith(".css") || file.endsWith("tokens.css")) continue;
    const withoutFallbacks = readFileSync(file, "utf8").replace(
      /var\(\s*--[\w-]+\s*,\s*(?:"[^"]*"|'[^']*'|[^)]*)\)/g,
      "",
    );
    for (const match of withoutFallbacks.matchAll(
      /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(/g,
    )) {
      offenders.push(`${file}: ${match[0]}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "colour literals must be declared in tokens.css and consumed via var()",
  );
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
    assert.equal(rootBlocks.includes(`${alias}:`), true, `${alias} was removed`);
  }
});
