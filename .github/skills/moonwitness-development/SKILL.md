---
name: moonwitness-development
description: "Use when implementing, debugging, testing, or reviewing code in the MoonWitness monorepo. Covers architecture boundaries, focused changes, and GitHub Actions-only validation."
---

# MoonWitness Development

Follow root [AGENTS.md](../../../AGENTS.md) and read the [GitHub Issues workflow](../github-issues/SKILL.md) before coding. Issues are the task source; the GitHub Wiki is the project-documentation source.

## Fast implementation path

1. Select one open `status:pending` Issue with closed dependencies and an execution packet that permits the work. If the task is blocked or requires owner/security/legal/release evidence, stop and report the blocker.
2. Locate the owning package, the nearest implementation pattern, and its focused tests. Trace other layers only when the change crosses their boundary.
3. State the smallest coherent scope, preserve unrelated worktree changes, then implement at the correct boundary:
   - Domain data, ACL, views, and services belong in TypeScript `ql_*` addons managed by QlOrm. Manifests declare fields, validation, ownership, access, views, and `data`; seed only legitimate system/reference records with stable IDs and an explicit update policy.
   - API routes and DTOs come from `@moonwitness/moonclient`; API remains the authentication, request-validation, and service-calling boundary.
   - Web HTTP uses `moonClient`; shared controls come from `@moonwitness/ui`; user-facing copy stays in both `id` and `en` catalogs.
4. Add or update tests at changed boundaries and preserve acceptance criteria. For UI work, follow the shared policy in the root [AGENTS.md](../../../AGENTS.md); GitHub Copilot also loads its scoped instruction adapter when available.
5. Do not run lint, build, typecheck, tests, or other quality gates locally. GitHub Actions is the only gate executor. Check the run for the exact commit SHA; if there is no matching successful run, report validation as pending. Do not commit, push, or deploy unless explicitly authorized.
6. Report the Issue, changed scope, exact GitHub Actions run/SHA and conclusion, and any warnings or blockers. Never claim CI success without observing it.

## Debugging and collaboration

- Reproduce by reading the failing GitHub Actions step and its logs. Preserve the expected contract and inspect the implementation before changing tests.
- Fix root causes with typed narrowing and existing helpers. Avoid `as any`, success-shaped fallbacks, blanket catches, and unrelated warning cleanup.
- If CI exposes an unrelated failure, identify it separately; do not broaden the patch without authorization.
- Delegate only independent work with non-overlapping files/interfaces. Give bounded ownership; one integrator reviews the combined diff and the GitHub Actions result.

An explicit owner delegation may authorize a bounded, evidence-backed decision from a `decision_prep` packet. Record the decision as agent-made under delegation and follow the limits in root instructions and the GitHub Issues skill. Delegation does not supply missing rights/security evidence, measurements, manual verification, exact-SHA ratification, or release approval.
