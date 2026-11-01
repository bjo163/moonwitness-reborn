---
name: moonwitness-development
description: "Use when implementing, debugging, testing, or reviewing code in the MoonWitness monorepo. Covers addon boundaries, shared API contracts, efficient validation, i18n, and safe parallel work."
---

# MoonWitness Development

Use the repository's [AGENTS.md](../../../AGENTS.md) as the always-on source of architecture and safety rules. Before every coding task, load and follow the mandatory [task-tracker skill](../task-tracker/SKILL.md). This skill provides the repeatable implementation workflow without duplicating the full policy.

## Workflow

1. **Find the owning package and existing pattern.** Trace the route, model/addon, client contract, UI, and nearest tests only as far as the change requires. Confirm whether the requested behavior belongs in a `ql_*` addon, `@moonwitness/moonclient`, API boundary, or web feature.
2. **State the smallest coherent scope.** Identify affected files, behavior that must remain unchanged, and the focused test or build command. Do not expand into unrelated worktree changes.
3. **Implement at the correct boundary.**
   - Addon/domain changes: update manifest, model, service, view, ACL, bootstrap dependency, and focused tests together as applicable.
   - API changes: reuse route and DTO definitions from `@moonwitness/moonclient`; keep API logic at the auth, request-validation, and service-calling boundary.
   - Web changes: use `moonClient` for HTTP and shared components from `@moonwitness/ui`. Keep localized copy in both `id` and `en` catalogs and use catalog keys.
4. **Validate in increasing scope.** Start with the narrow test/build for changed packages. Then run the applicable workspace gates. For a clean checkout, or after package/dependency changes, build workspace dependencies before type-aware lint:

   ```powershell
   pnpm exec turbo run build
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

   `pnpm build` runs `pnpm lint` before `turbo run build`; on a clean checkout, use the CI order above rather than assuming generated package types already exist.
5. **Validate governance when applicable.** If the change touches the canonical task tracker or its generator, run:

   ```powershell
   pnpm tracker:check
   pnpm tracker:test
   ```

6. **Report evidence precisely.** Name the commands run and their outcomes. Report lint errors and warnings separately; a successful lint with warnings is not warning-free. Do not claim CI, deployment, commit, or push results without direct evidence.

## Efficient debugging

- Reproduce the failing check first and preserve its exact expected contract.
- Read the implementation that defines the contract before changing a test. Keep test assertions aligned with actual package boundaries and serialized shapes.
- Fix root causes with typed narrowing and existing helpers; avoid `as any`, success-shaped fallbacks, blanket catch blocks, and unrelated warning cleanup.
- Run one targeted command after a fix, then the smallest broader suite that covers the changed behavior.
- If a broader gate exposes unrelated failures, separate them from regressions caused by the patch and report both.

## Parallel work

- Parallelize only independent tasks with non-overlapping files or agreed interfaces.
- Give each worker a bounded objective, explicit owned files, and a concrete validation command.
- Do not have multiple workers edit the same file or independently redesign a shared DTO, route, model, or manifest.
- Assign one integrator to reconcile results, inspect the combined diff, and run final validation.
