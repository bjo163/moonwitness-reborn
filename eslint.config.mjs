import nextPlugin from "@next/eslint-plugin-next";
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/*.d.ts",
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      ".turbo/**",
    ],
  },
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
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "eqeqeq": ["error", "always"],
      "no-constant-binary-expression": "error",
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
      "prefer-const": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@moonwitness/contracts",
              message: "Use @moonwitness/moonclient for shared API contracts.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/api/src/connectors/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@moonwitness/contracts",
              message: "Use @moonwitness/moonclient for shared API contracts.",
            },
          ],
          patterns: [
            {
              group: ["child_process", "node:child_process"],
              message:
                "OS credential stores are parsed directly; never spawn processes from the API.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/web/**/*.{js,mjs,ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      "@next/next/no-html-link-for-pages": [
        "error",
        "apps/web/src/app",
      ],
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@moonwitness/contracts",
              message: "Use @moonwitness/moonclient for shared API contracts.",
            },
            ...["axios", "got", "ky", "node-fetch"].map((name) => ({
              name,
              message: "Use moonClient as the single HTTP communication boundary.",
            })),
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "fetch",
          message: "Use moonClient as the single HTTP communication boundary.",
        },
        {
          object: "window",
          property: "XMLHttpRequest",
          message: "Use moonClient as the single HTTP communication boundary.",
        },
        {
          object: "globalThis",
          property: "fetch",
          message: "Use moonClient as the single HTTP communication boundary.",
        },
        {
          object: "globalThis",
          property: "XMLHttpRequest",
          message: "Use moonClient as the single HTTP communication boundary.",
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message: "Use moonClient as the single HTTP communication boundary.",
        },
        {
          name: "XMLHttpRequest",
          message: "Use moonClient as the single HTTP communication boundary.",
        },
      ],
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
    },
  },
);
