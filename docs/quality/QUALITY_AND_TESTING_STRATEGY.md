# Quality and Testing Strategy

**Status: PROPOSED.** Tests provide evidence only for the executed command, exact commit and observed result.

## Required layers

1. Static: lint, typecheck, dependency/build checks.
2. Addon contracts: manifest validity, dependency graph, model fields, name, owner field, private flags, ACL defaults and view exposure.
3. Unit: domain validation, provenance, rights and workflow transitions.
4. Integration: QlOrm schema sync, data access, owner/tenant ACL, private-field filtering, internal services.
5. API/client: shared moonclient route/DTO contract, request validation, auth, errors and response projection.
6. Web: navigation, forms, locale/theme, accessibility and realistic loading/error states.
7. End-to-end: source-to-publication vertical slice plus negative authorization/rights scenarios.
8. Operations: clean build, startup/health, backup/restore, rollback and failure recovery before release.

## Mandatory security regression coverage

Cross-user read/write; wrong role; private field absent from metadata/public CRUD/logs; server-only secret read remains owner-scoped; anonymous access policy; prompt injection/tool abuse; rights-blocked publication; reviewer conflict; forged workflow transition.

## Workspace gates

Root `pnpm lint`, `pnpm typecheck`, workspace-relevant tests and `pnpm build`. Each addon change must include manifest/model/ACL tests per `AGENTS.md`. CI must reproduce required gates. Record command, exit code, environment, SHA and known skips. Do not claim tests ran when they did not.

## Current evidence

Root CI workflow declares install/lint/typecheck/test/build; nine test files were found across QlOrm, API, moonclient, database and agent-runtime. No per-`ql_*` addon manifest/model/ACL test suite was found, although QlOrm/API tests cover some model validation, owner isolation and private-field behavior. On 2026-11-01, `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all exited 0 in the local workspace at prior SHA `bc32604e70454ed8474d144d40faacac888be533`. `pnpm test` reported 30 passing tests across 14 Turbo tasks. These checks were not rerun after current HEAD `3acab11b2a6dd8291dc971869f45511fc078b82b`; GitHub Actions on current HEAD fails at lint, and the prior clean-runner failure reported 720 type-aware/type-resolution errors. A likely cause is lint resolving sibling package `dist/*.d.ts` exports before build; this is inferred and needs a clean-checkout reproduction. Local green checks used existing outputs, so they do not establish clean-clone CI. These checks do not establish production deployment, rights compliance, complete security coverage, restore evidence or release certification.

## Quality attributes to quantify

Availability, response latency, import throughput, corpus size, test coverage thresholds, accessibility standard, backup RPO/RTO and vulnerability response SLA remain TBD. Select measurable targets before release.
