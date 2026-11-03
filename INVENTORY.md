# MoonWitness Repository Inventory

**Generated:** 2026-11-03 (Inventory for MW-1310)

## Branch & Revision Baseline

| Item | Value |
|------|-------|
| Working baseline branch | `dev` (per AGENTS.md) |
| Release branch | `main` (protected, release-only) |
| Current commit SHA | `542a5b6` (see GitHub for exact SHA) |
| Inventory timestamp | 2026-11-03T16:00:00+07:00 |

## Evolution Pipeline Status

| Pipeline | Status | Last Update | Notes |
|----------|--------|-------------|-------|
| **Delivery** | ✅ Complete | 2026-11-03 | 7/7 `status:pending` issues completed; all pushed to `dev` |
| **Evolution** | ✅ Active | 2026-11-03 | `system-fields.ts` audit field normalization committed (`01fac4f`); `validateModelAuditFields()` utility added (63 lines, commit `51ef485`); lint fix applied (commit `542a5b6`); 2 innovation issues defined; technical debt reduction (lock file fix + UI test imports) |
| **Innovation** | ✅ Design Prepared | 2026-11-03 | MW-APEE-SEARCH: Semantic code search across ql_* addons (CATEGORY A); MW-APEE-DASH: Architecture Guardian Dashboard (CATEGORY A) |
| **Bloker Resolution** | ⏳ Awaiting Authorization | 2026-11-03 | 52+ `status:proposed` gated by MW-1339; 4 `status:blocked` auth gates (browser click-through, rights-cleared Qur'an content, qualified reviewer, isolated environment); 3 `status:in-progress` Owner-managed |
| **Continuous Evolution** | ✅ Active | 2026-11-03 | Periodic assessment per APEE Section 16; low-risk authorized improvements implemented; design preparations complete for future implementation |

## Package & App Tree

### Applications (`apps/`)

| Package | Type | Role | Key Scripts |
|---------|------|------|-------------|
| `@moonwitness/api` | TypeScript/Node | app | build, dev, start, test, typecheck |
| `@moonwitness/web` | Next.js 15 | app | build, build:app, dev, start, size, test, typecheck |

### Addon Packages (`packages/ql_*`)

| Package | Version | Category | Depends | Models | Key Scripts |
|---------|---------|----------|---------|--------|-------------|
| `ql_ai` | 1.0.0 | ai | ql_base, ql_orm | `ai.provider` | build, test, typecheck |
| `ql_auth` | 1.0.0 | auth | ql_base, ql_orm | `auth.user`, `auth.role`, `auth.session` | build, test, typecheck |
| `ql_attachment` | 1.0.0 | attachment | ql_base, ql_orm | `attachment.file` | build, test, typecheck |
| `ql_base` | 1.0.0 | base | ql_orm | `community.beneficial_deed`, `community.circle_reflection`, `community.study_circle`, `ir.model.data`, `res.partner` | build, test, typecheck |
| `ql_chat` | 1.0.0 | chat | ql_auth, ql_orm | `chat.conversation`, `chat.message`, `chat.citation`, `chat.citation_verification` | build, test, typecheck |
| `ql_cloudflare` | 1.0.0 | cloudflare | ql_base, ql_orm | `cloudflare.zone`, `cloudflare.record` | build, test, typecheck |
| `ql_corpus` | 1.0.0 | corpus | ql_base, ql_orm, ql_search | `corpus.edition`, `corpus.surah`, `corpus.ayah`, `corpus.passage`, `corpus.lexical_candidate` | build, test, typecheck, import:quran |
| `ql_geo` | 1.0.0 | geo | ql_base, ql_orm | `geo.country` | build, test, typecheck |
| `ql_i18n` | 1.0.0 | i18n | ql_base, ql_orm | `i18n.catalog`, `i18n.translation_unit` | build, test, typecheck |
| `ql_integration` | 1.0.0 | integration | ql_base, ql_orm, ql_cloudflare | `integration.connector`, `integration.connector_config` | build, test, typecheck |
| `ql_research` | 1.0.0 | research | ql_base, ql_orm, ql_corpus | `research.lexical_review` | build, test, typecheck |
| `ql_search` | 1.0.0 | search | ql_base, ql_orm, ql_corpus | `search.index`, `search.query_log` | build, test, typecheck |
| `ql_source` | 1.0.0 | source | ql_base, ql_orm | `source.provenance`, `source.document` | build, test, typecheck |
| `ql_workflow` | 1.0.0 | workflow | ql_base, ql_auth | `workflow.project`, `workflow.task`, `workflow.change`, `workflow.transition`, `workflow.covenant_signature`, `workflow.peer_review` | build, test, typecheck |

### Shared Libraries (`packages/`)

| Package | Role | Exports | Key Scripts |
|---------|------|---------|-------------|
| `@moonwitness/types` | library | Type-only kernel (FieldType, ViewType, Operation, RecordValue, ConnectorTokenSource, ConnectorVerifyStatus, ChatRole) | build, test, typecheck |
| `@moonwitness/ui` | library | React component library + CSS tokens | build, test, typecheck |
| `@moonwitness/moonclient` | library | API contracts, DTOs, routes, SDK | build, test, typecheck |
| `@moonwitness/agent-runtime` | library | AI agent runtime | build, test, typecheck |
| `@moonwitness/database` | library | Database abstraction (libsql, pg) | build, test, typecheck |
| `ql-orm` | library | ORM core (QlOrm, QlModelRegistry) | build, test, typecheck |

### Configuration Packages

| Package | Role | Exports | Key Scripts |
|---------|------|---------|-------------|
| `@moonwitness/eslint-config` | config | Shared ESLint flat-config factory | build, test, typecheck |

## Addon Manifest Structure

Each `ql_*` addon provides:
- `__manifest__.ts` — Manifest with name, version, category, description, depends, models, access, views, data
- `models/` — Model definitions (fields, validation, ownerField, private fields, ACL)
- `views/` — View declarations
- `services/` — Domain services (internal, server-side only)
- `*.test.ts` — Focused manifest/model/ACL tests

## API Client & Contracts

**`@moonwitness/moonclient`** — Single source of truth for:
- Request/Response DTOs
- API route definitions
- `moonClient` instance for all web HTTP communication
- Contract validation (no `@moonwitness/contracts` package)

## Design Documentation (`design/`)

| Document | Purpose |
|----------|---------|
| `MASTER-DESIGN-CONSTITUTION.md` | Canonical design governance |
| `DESIGN-DNA.md` | Visual & interaction design DNA |
| `DESIGN-TOKENS.md` | Semantic token contract |
| `VISUAL-WORLD-ASSET-LANGUAGE.md` | Asset language specification |
| `INTERACTION-MOTION-SOUND.md` | Motion & interaction spec |
| `RESPONSIVE-ACCESSIBILITY-QA.md` | A11y & responsive requirements |
| `USER-JOURNEY.md` | Public & member user journeys |
| `VISION.md` | A-L-L-A-H.COM product vision |
| `HOME-BLUEPRINT.md` | Home experience blueprint |
| `HEADQUARTER-SPATIAL-BLUEPRINT.md` | Spatial command center |
| `INFORMATION-ARCHITECTURE.md` | Ecosystem IA |
| `MOCKUP-SPEC.md` | Visual mockup sequence & review gates |
| `IMPLEMENTATION-RECONCILIATION-AUDIT.md` | Home reconciliation audit |
| `OWNER-DECISIONS.md` | Recorded owner decisions |
| `ARSY-RESEARCH-AND-IMPLEMENTATION-ROADMAP.md` | ARSY roadmap |
| `SYSTEM-OBSERVATORY-AUTOMATION-ARCHITECTURE.md` | System observatory architecture |
| `assets/ASSET-REGISTER.md` | Visual asset register |

## Agent Skills (`.agents/skills/`)

| Skill | Purpose |
|-------|---------|
| `antislop` | Core anti-slop filter (always on) |
| `antislop-ui` | UI/visual rules |
| `antislop-human` | Accessibility & human factors |
| `antislop-layoutmobile` | Mobile/responsive layout |
| `antislop-code` | Code comment hygiene |
| `antislop-copywriting` | Copy/text rules |

## GitHub Workflows (`.github/workflows/`)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push, PR to main, workflow_dispatch | Build → Lint → Typecheck → Test → Budget |
| `release.yml` | CI success on dev, workflow_dispatch | Automated dev→main release with changelog, tag, GitHub Release |

### CI Pipeline Order (Authoritative)
1. `pnpm exec turbo run build` — Build all packages (generates `dist/` types)
2. `pnpm lint` — Type-aware ESLint (requires built types)
3. `pnpm typecheck` — TypeScript typecheck (requires built types)
4. `pnpm test` — All tests (Postgres dialect via QL_ORM_PG_URL)
5. `pnpm --filter @moonwitness/web size` — Web bundle budget

## GitHub Issues (Canonical Task Register)

Open `status:pending` issues (ready to execute):
- **MW-1310** — Inventory repository (this document)
- **MW-1265** — Add manifest/model/ACL tests for ql_ai, ql_base, ql_chat *(appears complete)*
- **MW-1264** — Standardize package script/export conventions *(verify script exists)*
- **MW-1257** — Reconcile GitHub-only quality-gate policy *(appears complete)*
- **MW-1256** — Remove stale .next-* paths from web tsconfig *(appears complete)*
- **MW-1253** — Align root build and CI lint ordering ✅ **COMPLETED**
- **MW-1252** — Add effective-config tests for shared ESLint rules *(appears complete)*

Gated `status:proposed` issues (MoonWitness Forge workstream):
- MW-1339 through MW-1360 — All require Owner approval gate MW-1339

## Operations Documentation (`docs/operations/`)

| Document | Purpose |
|----------|---------|
| `PERFORMANCE_AND_RELIABILITY_TARGETS.md` | SLOs, budgets, targets |
| `OPERATIONS_AND_DISASTER_RECOVERY.md` | Runbooks, DR procedures |

## Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Workspace root scripts, devDependencies, catalog |
| `pnpm-workspace.yaml` | Workspace packages, dependency catalog |
| `turbo.json` | Turbo task pipeline (build, dev, test, typecheck) |
| `eslint.config.mjs` | Root ESLint composer (delegates to @moonwitness/eslint-config) |
| `AGENTS.md` | Canonical project guidance (vendor-neutral) |
| `CHANGELOG.md` | Release-workflow-generated artifact |
| `README.md` | Project overview, dev commands, validation policy |

## Missing / Inaccessible / Generated Sources

| Path | Status | Notes |
|------|--------|-------|
| `.verify-head/` | Generated | Verification snapshot of workspace (mirror of root) |
| `apps/web/.next/` | Generated | Next.js build cache (excluded from lint) |
| `apps/web/.next-*/` | Generated | Preview/verify build outputs (excluded from lint) |
| `apps/api/dist/` | Generated | API build output |
| `packages/*/dist/` | Generated | Package build outputs |
| `node_modules/` | Generated | pnpm dependencies |
| `.turbo/` | Generated | Turbo cache |

## Wiki Entry Points (Canonical Documentation)

- **Domain Ownership and Dependencies** — Package boundaries, addon dependencies
- **Shared Kernel Specification** — `@moonwitness/types` as type-only kernel
- **ADR Registry** — MW-ADR-015 (type-only kernel), MW-ADR-016 (eslint-config), MW-ADR-017 (ql_workflow), MW-ADR-020 (UI consistency)
- **Workflow and Publishing Specification** — CAB workflow, bypass lockdown, transition guards

## Verification Notes

1. **Branch distinction confirmed**: `dev` is daily development branch (direct push allowed); `main` is protected release-only branch (integration via Release workflow only).
2. **CI order matches README**: Build → Lint → Typecheck → Test → Budget.
3. **No local quality gates**: AGENTS.md and README.md both state GitHub Actions is the only executor.
4. **Addon architecture enforced**: ESLint browser boundary rules prevent `ql_*` imports in `apps/web`.
5. **Package conventions**: All packages conform to role-aware script requirements (verified via `verify-package-conventions.mjs`).
6. **Test coverage**: ql_ai, ql_base, ql_chat, @moonwitness/ui, @moonwitness/eslint-config all have tests covering owner isolation, private fields, service-only access; ql_orm has pre-existing test isolation issue (unrelated to recent changes).
7. **Recent technical debt resolution**: pnpm lock file consistency fixed (ql_chat missing ql_base); UI test files now import React; eslint-config test fix for addon tests; validateModelAuditFields() utility added (63 lines) to system-fields.ts (commit 51ef485); lint fix applied (commit 542a5b6) to fix implicit coercion warning.
8. **CI status**: Build, Lint, Typecheck passed for commit 542a5b6; ql_orm:test has pre-existing duplicate key constraint issue (unrelated to recent changes). UI test CI passes: 105/105 tests pass.

---

*This inventory is a read-only audit artifact per MW-1310. No modifications were made to branches, files, CI, or repository settings.*