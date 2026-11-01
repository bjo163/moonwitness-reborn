import { moonwitnessConfig } from "@moonwitness/eslint-config";

/**
 * Root ESLint flat-config composer.
 *
 * Per `AGENTS.md` the workspace lint ruleset is centralised in this file and
 * executed from the root (`pnpm lint`). Every reusable boundary block lives
 * in `@moonwitness/eslint-config`; this file only supplies repo-scoped
 * `ignores` and passes `tsconfigRootDir` so type-aware linting still
 * resolves `tsconfig.base.json` from the workspace root.
 */
export default [
  {
    ignores: [
      "**/*.d.ts",
      "**/dist/**",
      "**/.next/**",
      "**/.next-*/**",
      "**/node_modules/**",
      ".turbo/**",
    ],
  },
  ...moonwitnessConfig({ tsconfigRootDir: import.meta.dirname }),
];
