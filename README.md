# MoonWitness

MoonWitness is a TypeScript workspace for an AI assistant platform built around
model-driven addons.

## Canonical project records

- Task scope, dependencies, status, and evidence live in
  [GitHub Issues](https://github.com/bjo163/moonwitness-reborn/issues).
- Product, architecture, governance, and other project documentation live in
  the [GitHub Wiki](https://github.com/bjo163/moonwitness-reborn/wiki).
- The root `CHANGELOG.md` is retained only as a release-workflow-generated
  artifact.
- The root [AGENTS.md](./AGENTS.md) is the tool-neutral project guidance for
  coding agents that support the `AGENTS.md` convention. Provider-specific
  integrations, including GitHub Copilot configuration, live under
  [.github/](./.github/) and should reference rather than duplicate that policy.

## Development

Requirements: Node.js 22+ and pnpm 10.

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

## Validation

GitHub Actions is the only required executor for build, lint, typecheck, tests,
and quality gates. The [CI workflow](./.github/workflows/ci.yml) runs them on
branch pushes and pull requests to `main`, in this order:

- Workspace build
- Type-aware workspace lint
- Workspace typecheck
- Workspace tests
- Web bundle-size budget

Do not run these gates locally. Check the GitHub Actions run for the exact commit
SHA being reviewed. If no matching successful run exists, validation is pending,
not passed. Local development servers are for product development, not gate
evidence.

For UI work, follow the shared UI policy in `AGENTS.md` and the installed
antislop skills. Visual or interaction evidence is separate from automated CI
and must not be claimed unless it was actually observed.
