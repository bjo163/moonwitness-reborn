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
   - Addon/domain changes: update manifest, model, service, view, ACL, bootstrap dependency, and focused tests together as applicable. Every manifest declares `data`; seed only legitimate system/reference records, use stable IDs and an explicit per-record update policy, and leave the list empty for user-owned or rights-sensitive domains without approved defaults.
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

## UI consistency rules (MW-ADR-020)

`@moonwitness/ui` owns tokens, the browser reset, every `.ql-*` rule, and every
reusable control. A web screen composes them; it does not style itself. The gate
is `no-restricted-syntax` at **`error`**, scoped to every `.tsx` under
`apps/web/src`, so each item below fails CI:

- a raw `<button>`, `<input>`, `<textarea>`, `<select>`, or `<style>` — use `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, or `ListOption` for a selectable row
- a raw `<a href="…">` for an in-app route — use `Link`, or `NavLink`/`SidebarBrand` inside a sidebar
- an inline `style={…}` prop
- an arbitrary-value colour (`bg-[#0b110b]`, `shadow-[4px_4px_0_#050706]`) — name a token (`bg-panel-edge`, `shadow-hud-sm`)
- a Tailwind default-palette colour (`text-stone-300`, `bg-white`, `bg-amber-950`) — the token vocabulary is `ink`, `ink-soft`, `muted`, `muted-dim`, `panel*`, `hairline*`, `acid*`, `danger`, `void`

`^ql-` and `^is-` class names stay legal: they are the design system's own vocabulary.

When markup repeats in two or more screens, it moves into
`packages/ui/src/composites/` instead of being copied again. Before adding one:

1. Check what already exists — `WorkspaceSidebar`, `SidebarNav`, `NavLink`,
   `SidebarBrand`, `SidebarFooter`, `PageHeader`, `LoadingScreen`, `EmptyState`,
   `SectionGrid`, `IconTile`, `MetricRow`, `ListOption`, `SidePanel`.
2. Add no user-facing text to the package: all copy arrives as props, and the
   screen reads it from the i18n catalogue (`DataTable` label props are required
   for exactly this reason).
3. Declare a new colour in `packages/ui/styles/tokens.css` only when no existing
   token fits; `packages/ui/tests/tokens.test.ts` fails a component that names a
   token nobody declared, and `components.css` must consume tokens, not literals.
4. Add a rendering test to `packages/ui/tests/` proving the base class survives a
   `className` override and the rendered markup contains no hex or default-palette class.

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
