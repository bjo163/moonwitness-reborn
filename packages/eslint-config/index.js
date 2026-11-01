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
 * @param {object} options
 * @param {string} options.tsconfigRootDir Absolute path used by typescript-eslint's
 *   `projectService`. Pass the caller's `import.meta.dirname`.
 * @param {string} [options.webAppDir] Workspace-relative directory of the Next.js app.
 * @param {string} [options.apiConnectorsDir] Workspace-relative directory of the
 *   API's credential-touching connectors module.
 * @returns {import("eslint").Linter.Config[]}
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
        ...nextPlugin.configs.recommended.rules,
        "@next/next/no-html-link-for-pages": ["error", `${webAppDir}/src/app`],
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
};
