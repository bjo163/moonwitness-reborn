import nextPlugin from "@next/eslint-plugin-next";
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

/**
 * `@moonwitness/eslint-config` — shared ESLint flat-config factory for the
 * MoonWitness workspace.
 *
 * The root `eslint.config.mjs` remains the single composer (per `AGENTS.md`
 * "Aturan lint workspace dipusatkan di `eslint.config.mjs` dan dijalankan
 * dari root"); this package only exports the reusable rule blocks so that
 * every repo-scoped boundary law is defined exactly once.
 *
 * `tsconfigRootDir` MUST be supplied by the caller (typically the root
 * config file's `import.meta.dirname`) so that `projectService` resolves the
 * workspace's `tsconfig.base.json` from the correct directory — the plugins
 * imported by this module are not what determines type-aware resolution.
 */

const CONTRACTS_BAN_MESSAGE =
  "Use @moonwitness/moonclient for shared API contracts.";
const HTTP_BOUNDARY_MESSAGE =
  "Use moonClient as the single HTTP communication boundary.";
const CREDENTIAL_STORE_MESSAGE =
  "OS credential stores are parsed directly; never spawn processes from the API.";
const BROWSER_BOUNDARY_MESSAGE =
  "Server/addon packages must never be imported by the web app.";
const UI_CONSISTENCY_MESSAGE =
  "Use @moonwitness/ui components and the cn() utility; do not duplicate the design system.";
const UI_PRIMITIVE_BAN_MESSAGE =
  "Use @moonwitness/ui primitives (Button, Input, Textarea, Select, Checkbox, Badge, Alert, Card, DataTable, FormField, RawField, WorkspaceTemplate, CenteredAuth) and its composites (NavLink, SidebarNav, OptionNav, NavSectionLabel, SidebarBrand, SidebarFooter, SidebarTrigger, WorkspaceSidebar, PageHeader, LoadingScreen, EmptyState, SectionGrid, IconTile, MetricRow, ListOption, SidePanel); do not hand-roll them in apps/web.";
const UI_INTERNAL_LINK_MESSAGE =
  "Use Next.js <Link> or @moonwitness/ui NavLink for internal routes in apps/web.";
const UI_INLINE_STYLE_MESSAGE =
  "Prefer Tailwind design tokens (`bg-panel`, `text-acid`, `border-hairline`) or a `ql-*` class; do not use inline `style` props in apps/web.";
const UI_ARBITRARY_HEX_MESSAGE =
  "Use @moonwitness/ui design tokens (`bg-panel`, `text-ink`, `border-hairline`) instead of an arbitrary Tailwind hex value (MW-ADR-020).";
const UI_DEFAULT_PALETTE_MESSAGE =
  "Use the @moonwitness/ui design tokens (`text-ink`, `text-ink-soft`, `text-muted`, `border-hairline`, `bg-panel`) instead of a Tailwind default palette colour (MW-ADR-020).";
const CLEAN_CODE_MESSAGE = "Clean code: avoid implicit any and unused code.";

const contractsBanPath = {
  name: "@moonwitness/contracts",
  message: CONTRACTS_BAN_MESSAGE,
};
const httpClientBanPaths = ["axios", "got", "ky", "node-fetch"].map((name) => ({
  name,
  message: HTTP_BOUNDARY_MESSAGE,
}));
const httpBoundaryProperties = [
  { object: "window", property: "fetch" },
  { object: "window", property: "XMLHttpRequest" },
  { object: "globalThis", property: "fetch" },
  { object: "globalThis", property: "XMLHttpRequest" },
].map((entry) => ({ ...entry, message: HTTP_BOUNDARY_MESSAGE }));
const httpBoundaryGlobals = ["fetch", "XMLHttpRequest"].map((name) => ({
  name,
  message: HTTP_BOUNDARY_MESSAGE,
}));
const credentialStorePatterns = [
  {
    group: ["child_process", "node:child_process"],
    message: CREDENTIAL_STORE_MESSAGE,
  },
];
const browserBoundaryPatterns = [
  {
    group: [
      // Addon packages that are server-side only must never be imported by the
      // web app. `ql_i18n` is intentionally excluded: its `catalogs` subpath
      // exposes static browser translation assets used by `messages.ts`.
      "ql_orm",
      "ql_orm/**",
      "ql_base",
      "ql_base/**",
      "ql_auth",
      "ql_auth/**",
      "ql_ai",
      "ql_ai/**",
      "ql_chat",
      "ql_chat/**",
      "ql_cloudflare",
      "ql_cloudflare/**",
      "ql_corpus",
      "ql_corpus/**",
      "ql_integration",
      "ql_integration/**",
      "ql_source",
      "ql_source/**",
      "ql_workflow",
      "ql_workflow/**",
      "@moonwitness/database",
      "@moonwitness/database/**",
      "@moonwitness/agent-runtime",
      "@moonwitness/agent-runtime/**",
      "@libsql/client",
      "pg",
      "pg/**",
    ],
    message: BROWSER_BOUNDARY_MESSAGE,
  },
];
const cssInJsBanPaths = [
  { name: "styled-components", message: UI_CONSISTENCY_MESSAGE },
  { name: "styled-components/**", message: UI_CONSISTENCY_MESSAGE },
  { name: "emotion", message: UI_CONSISTENCY_MESSAGE },
  { name: "@emotion/**", message: UI_CONSISTENCY_MESSAGE },
  { name: "linaria", message: UI_CONSISTENCY_MESSAGE },
  { name: "linaria/**", message: UI_CONSISTENCY_MESSAGE },
  { name: "stitches", message: UI_CONSISTENCY_MESSAGE },
];

/**
 * UI-consistency selectors (MW-ADR-020). Applied to every `.tsx` file under
 * `apps/web/src/features`, so `@moonwitness/ui` internal primitives (which are
 * exactly the button/input/a implementations) stay legal.
 *
 * The `no-restricted-syntax` block bans raw JSX elements and inline
 * `style` props; the `Literal` regex ban rejects arbitrary Tailwind
 * values like `bg-[#0b110b]` in `className` string literals. Together
 * these force apps/web to consume the design system instead of
 * re-rolling it (see AGENTS.md, section "UI dan perubahan").
 *
 * NOTE: never write a recursive glob (double-star, slash, star, extension)
 * inside a block comment here. Its star-slash pair closes the comment
 * early, Node then fails to parse this module, and `pnpm lint` breaks for
 * the whole workspace. Describe a glob in prose or in a line comment.
 */
const uiPrimitiveBans = [
  { selector: 'JSXOpeningElement[name.name="button"]', message: UI_PRIMITIVE_BAN_MESSAGE },
  { selector: 'JSXOpeningElement[name.name="input"]', message: UI_PRIMITIVE_BAN_MESSAGE },
  { selector: 'JSXOpeningElement[name.name="textarea"]', message: UI_PRIMITIVE_BAN_MESSAGE },
  { selector: 'JSXOpeningElement[name.name="select"]', message: UI_PRIMITIVE_BAN_MESSAGE },
  { selector: 'JSXOpeningElement[name.name="style"]', message: UI_PRIMITIVE_BAN_MESSAGE },
];
const uiInternalAnchorBan = {
  // `JSXAttribute` holds a `Literal` directly — there is no intermediate
  // `JSXValue` node in the TypeScript JSX AST, so the earlier
  // `> JSXValue > Literal` chain never matched and internal anchors went
  // unreported. A leading-slash value test also fails: esquery's regex lexer
  // ends the pattern at the `\x2f`-style escape, so the rule is scoped by
  // element + literal `href` instead. Every literal `href` on a raw `<a>` in
  // this app is an in-app route today; a genuinely external link passes an
  // expression (`href={url}`) and stays legal.
  selector:
    'JSXOpeningElement[name.name="a"] JSXAttribute[name.name="href"] Literal',
  message: UI_INTERNAL_LINK_MESSAGE,
};
const uiInlineStyleBan = {
  selector: 'JSXAttribute[name.name="style"]',
  message: UI_INLINE_STYLE_MESSAGE,
};
const uiArbitraryHexBan = {
  // Matches a JSX `className="…"` string literal that contains a Tailwind
  // arbitrary-value bracket wrapping a hex colour, e.g. `bg-[#0b110b]`.
  // Kept intentionally simple: `[value=/#[0-9a-f]+/i]` — esquery parses
  // the regex between the slashes and does not allow `{n,m}` bounds or
  // nested `[…]` character classes without escapes, so the pattern
  // trades precision for stability.
  selector: 'JSXAttribute[name.name="className"] Literal[value=/#[0-9a-fA-F]+/i]',
  message: UI_ARBITRARY_HEX_MESSAGE,
};
// Rejects Tailwind's default colour scale (`text-stone-300`, `bg-amber-950`, …)
// in app markup. The numeric step is required because a bare colour family
// name (`text-stone`) is not a utility; `white`/`black` have no step and are
// matched separately. Same esquery constraint as above: no `{n,m}` bounds and
// no `/` inside the pattern.
const uiDefaultPaletteBan = {
  selector:
    'JSXAttribute[name.name="className"] Literal[value=/(?:bg|text|border|divide|outline|ring|placeholder|from|via|to|fill|stroke|accent|decoration|shadow)-(?:stone|zinc|neutral|gray|slate|amber|emerald|green|red|rose|sky|blue|indigo|violet|purple|pink|cyan|teal|lime|orange|yellow|fuchsia)-\\d/]',
  message: UI_DEFAULT_PALETTE_MESSAGE,
};
const uiPurePaletteBan = {
  selector:
    'JSXAttribute[name.name="className"] Literal[value=/(?:bg|text|border|divide|outline|ring|fill|stroke)-(?:white|black)(?:[^a-zA-Z0-9]|$)/]',
  message: UI_DEFAULT_PALETTE_MESSAGE,
};

/**
 * @param {object} options
 * @param {string} options.tsconfigRootDir Absolute path used by typescript-eslint's
 *   `projectService`. Pass the caller's `import.meta.dirname`.
 * @param {string} [options.webAppDir] Workspace-relative directory of the Next.js app.
 * @param {string} [options.apiConnectorsDir] Workspace-relative directory of the
 *   API's credential-touching connectors module.
 * @returns {import("typescript-eslint").ConfigArray}
 */
export function moonwitnessConfig({
  tsconfigRootDir,
  webAppDir = "apps/web",
  apiConnectorsDir = "apps/api/src/connectors",
}) {
  if (!tsconfigRootDir) {
    throw new Error(
      "moonwitnessConfig requires `tsconfigRootDir` — pass the root eslint.config.mjs's `import.meta.dirname`.",
    );
  }

  /** @type {import("typescript-eslint").ConfigWithExtends["rules"]} */
  const cleanCodeRules = {
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { fixStyle: "separate-type-imports", prefer: "type-imports" },
    ],
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-argument": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/no-empty-object-type": "error",
    "@typescript-eslint/no-empty-interface": "error",
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { args: "after-used", ignoreRestSiblings: true },
    ],
    "@typescript-eslint/prefer-readonly": "warn",
    "@typescript-eslint/strict-boolean-expressions": "warn",
    "@typescript-eslint/method-signature-style": ["error", "method"],
    "@typescript-eslint/unbound-method": "warn",
    "max-len": [
      "warn",
      { code: 120, ignoreUrls: true, ignoreComments: false, ignoreRegExpLiterals: true, ignoreStrings: true, ignoreTemplateLiterals: true },
    ],
    "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
    "max-statements": ["warn", { max: 40 }],
    "max-params": ["warn", { max: 4 }],
    "max-nested-callbacks": ["warn", { max: 2 }],
    "complexity": ["warn", { max: 15 }],
    "eqeqeq": ["error", "always"],
    "no-constant-binary-expression": "error",
    "no-duplicate-imports": "error",
    "no-unreachable": "error",
    "prefer-const": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-eval": "error",
    "no-empty": "error",
    "no-implicit-coercion": "error",
    "no-lonely-if": "error",
    "no-nested-ternary": "warn",
    "no-negated-condition": "warn",
    "no-plusplus": "warn",
    "prefer-arrow-callback": "warn",
    "prefer-template": "error",
  };
  // Next's declarations widen each valid rule severity to `string`.
  const nextRecommendedRules =
    /** @type {import("typescript-eslint").ConfigWithExtends["rules"]} */ (
      nextPlugin.configs.recommended.rules
    );

  return tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
      ...config,
      files: ["**/*.{ts,tsx}"],
    })),
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        globals: { ...globals.browser, ...globals.node },
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: cleanCodeRules,
    },
    {
      files: [`${apiConnectorsDir}/**/*.ts`],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [contractsBanPath],
            patterns: credentialStorePatterns,
          },
        ],
      },
    },
    {
      files: [`${webAppDir}/**/*.{js,mjs,ts,tsx}`],
      plugins: { "@next/next": nextPlugin },
      rules: {
        ...nextRecommendedRules,
        "@next/next/no-html-link-for-pages": ["error", `${webAppDir}/src/app`],
      },
    },
    {
      files: [`${webAppDir}/scripts/**/*.mjs`],
      languageOptions: {
        globals: globals.node,
      },
    },
    {
      files: [`${webAppDir}/src/**/*.{ts,tsx}`],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [contractsBanPath, ...httpClientBanPaths, ...cssInJsBanPaths],
            patterns: browserBoundaryPatterns,
          },
        ],
        "no-restricted-properties": ["error", ...httpBoundaryProperties],
        "no-restricted-globals": ["error", ...httpBoundaryGlobals],
      },
    },
    {
      // MW-ADR-020 UI-consistency rules. Scoped to every `.tsx` file under
      // the web app's `src` (not just `src/features`) so the landing page,
      // the root layout, and the locale widgets are held to the same bar as
      // the workspaces. Flipped from `warn` to `error` in MW-0577 once every
      // `apps/web` screen had been migrated to the design system; adding a raw
      // control, an internal `<a>`, an inline `style`, a hex value, or a
      // default-palette colour in the app now fails CI.
      files: [`${webAppDir}/src/**/*.tsx`],
      rules: {
        "no-restricted-syntax": [
          "error",
          ...uiPrimitiveBans,
          uiInternalAnchorBan,
          uiInlineStyleBan,
          uiArbitraryHexBan,
          uiDefaultPaletteBan,
          uiPurePaletteBan,
        ],
      },
    },
    {
      files: ["**/*.tsx"],
      plugins: { "react-hooks": reactHooks },
      rules: {
        "react-hooks/exhaustive-deps": "warn",
        "react-hooks/rules-of-hooks": "error",
      },
    },
  );
}

/**
 * Individual rule fragments exported for future per-package compositions.
 * Root composer prefers `moonwitnessConfig`, but these are available so an
 * app can layer an override block that reuses the same message wording.
 */
export const boundaryMessages = {
  contractsBan: CONTRACTS_BAN_MESSAGE,
  httpBoundary: HTTP_BOUNDARY_MESSAGE,
  credentialStore: CREDENTIAL_STORE_MESSAGE,
  browserBoundary: BROWSER_BOUNDARY_MESSAGE,
  uiConsistency: UI_CONSISTENCY_MESSAGE,
  uiPrimitiveBan: UI_PRIMITIVE_BAN_MESSAGE,
  uiInternalLink: UI_INTERNAL_LINK_MESSAGE,
  uiInlineStyle: UI_INLINE_STYLE_MESSAGE,
  uiArbitraryHex: UI_ARBITRARY_HEX_MESSAGE,
  uiDefaultPalette: UI_DEFAULT_PALETTE_MESSAGE,
  cleanCode: CLEAN_CODE_MESSAGE,
};
export const sharedRuleFragments = {
  contractsBanPath,
  httpClientBanPaths,
  cssInJsBanPaths,
  httpBoundaryProperties,
  httpBoundaryGlobals,
  credentialStorePatterns,
  browserBoundaryPatterns,
  uiPrimitiveBans,
  uiInternalAnchorBan,
  uiInlineStyleBan,
  uiArbitraryHexBan,
  uiDefaultPaletteBan,
  uiPurePaletteBan,
};
