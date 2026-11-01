# MoonWitness TODO.md

**Status: PROPOSED gated microtask plan · Sole task and milestone status register**
**Edition:** MASTER FINAL v2.0 · `masterprompt.md` PILLAR 12 §2422: `TODO.md` is the sole canonical task and milestone status register
**Created:** 2026-11-01 · Owner ratification required before any feature implementation

---

## 1. Governance foundation

Per `masterprompt.md` PILLAR 12 §2492–2516:

- **TODO.md** remains the sole canonical task and milestone status register.
- **GitHub Issues** are execution records for task IDs only.
- **Every Issue** must contain canonical Task ID, description, scope, acceptance criteria, dependencies, tests, priority, complexity, evidence.
- **No duplicate task IDs.**
- **No multiple issues** implementing the same result.
- **No task** is complete because a PR is merged without required verification.
- **GitHub Projects** are operational visualizations only.
- **Branch protection:** zero rulesets and no classic `main` protection currently; must be added during ratification.
- **Actions CI:** runs on current SHA fail at `pnpm lint`; typecheck, tests and build are skipped; 720 type-aware/type-resolution errors reported on clean runner.

### 1.1 Requirement-to-issue linking

Every requirement must link to:
- Master document.
- Domain.
- ADR if applicable.
- TODO task.
- GitHub issue.
- Test.
- Evidence.
- Release gate.

No requirement without an owner. No task without an acceptance criterion.

### 1.2 Duplicate and conflict prevention

- No duplicate task IDs across `TODO.md`, GitHub Issues, or any other register.
- No multiple issues implementing the same result.
- Each canonical entity has one addon/domain owner; same principle applies to task IDs.

---

## 2. Microtask breakdown

### Phase 1 — Reconciliation (COMPLETE)

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| R-01 to R-35 | Discrepancy register entries | Substantial | Owner | All 35 entries carry file/line/bridge/evidence rows with exact SHAs |
| D01–D31 | Deliverable register | Substantial | Owner | All 31 deliverables documented as planning baseline |

### Phase 2 — Master Vision Narrative

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D04 | Master Vision Narrative | Proposed | Owner | Narrative reviewed and ratified per PILLAR 01 §1.5 |

### Phase 3 — Product Specification

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D05 | Product Specification | Proposed | Owner | Canonical product requirements ratified |

### Phase 4 — Master Blueprint

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D06/D07 | Master Application Blueprint / Single Web/API Architecture | Proposed | Owner | Architecture blueprint ratified; no second product application |

### Phase 5 — Master Design System

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D20 | Master Design System | Proposed | Owner | Visual system, theme, i18n and component inventory ratified |

### Phase 6 — Engineering & Security Specifications

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D21 | Internationalization Specification | Proposed | Owner | `id`/`en` catalog with type-safe keys, parity tests |
| D22 | Security and Privacy Blueprint | Proposed | Owner | Auth/ACL model, private-field protection, rights gates |
| D23 | Infrastructure and Deployment Blueprint | Proposed | Owner | Docker, Coolify, health checks, deployment ratification |
| D24 | Quality and Testing Strategy | Proposed | Owner | `pnpm lint/typecheck/build` green; 0 type-aware errors |
| D25 | ADR Registry | Proposed | Owner | All accepted decisions recorded in `docs/decisions/ADR_REGISTRY.md` |
| D26 | Master TODO with Microtasks | Proposed gated microtask plan | Owner | Task register complete; branch protection; CI green |
| D27 | GitHub Governance | Snapshot and recommendation | Owner | Branch protection rules; rulesets enforced |
| D28 | AI Execution Contract | Proposed | Owner | AI bounded; provider secrets private; no silent writes |
| D29 | Migration and Rollback Plan | Proposed | Owner | Idempotent import; checkpoint/recovery procedure |
| D30 | Requirements Traceability | Initial skeleton | Owner | Every requirement links to master doc, domain, test, evidence |
| D31 | Release and Acceptance Strategy | Proposed | Owner | Structured logs; health checks; backup/restore evidence; rollback route |

### Phase 7 — Single Application Foundation

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D31 | Release and Acceptance Strategy | Proposed | Owner | Application actually runs; health checks pass |

### Phase 8 — First Vertical Slice

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D31 | Release and Acceptance Strategy | Proposed | Owner | Source-to-publication lifecycle verified with approved small dataset |

### Phase 9 — Domain Expansion

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D31 | Release and Acceptance Strategy | Proposed | Owner | Approved domains implemented per dependency order |

### Phase 10 — Integration & Hardening

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D31 | Release and Acceptance Strategy | Proposed | Owner | Domain boundaries verified; API consistency; database integrity |

### Phase 11 — Release Preparation

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D31 | Release and Acceptance Strategy | Proposed | Owner | Structured logs; health checks; backup/restore evidence; rollback route |

### Phase 12 — External service integration (Cloudflare DNS)

Owner directive and plan approval on 2026-11-01; MW-ADR-013 and MW-ADR-014 record the two ratified boundaries.

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| MW-0501 | RBAC roles in `ql_auth` (`res.role`, `res.users.role`, boot seeding that repairs drift) | Implemented; tests green | Owner | `pnpm --filter ql_auth test` passes; role groups come from the compiled catalog; anti-lockout guard keeps one super_admin |
| MW-0502 | Bootstrap root account via `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_TOKEN` | Implemented; one-time-use | Owner | Grants root only while zero super_admins exist; env must be removed after first owner login |
| MW-0503 | `/admin/users` role management (API guard + UI) | Implemented | Owner | `admin` group gate; own-account and last-super_admin protections; role list from `res.role` |
| MW-0504 | `ql_integration` addon: `integration.connector`, `integration.audit`, kind catalog | Implemented; no secret column | Owner | Manifest ACL + model tests pass; catalog marks `cloudflare_read` read-only |
| MW-0505 | `ql_cloudflare` addon: zone/record mirror, API client, sync, DNS mutations | Implemented; tests green | Owner | Client/sync/record-rule suites pass; mirror rows are owner-scoped |
| MW-0506 | moonclient contract + 12 API connector routes | Implemented; tests green | Owner | Routes stay under `/settings/connectors`; no contract field can carry a token; group gates fire before body reads |
| MW-0507 | Web `/connectors` and `/connectors/[id]/dns` workspaces | Implemented; not yet exercised in a browser | Owner | No token input anywhere; "Sumber token" displayed; typed confirmations for destructive actions; nav entry gated on `connector`/`operator` |

---

## 3. Acceptance criteria summary

### Production-ready gates (per `masterprompt.md` §3040):

1. **Planning baseline ratified.** All D01–D31 deliverables reviewed and approved by owner.
2. **Branch protection added.** Rulesets enforced on `main`; no direct pushes without PR.
3. **CI pipeline green.** `pnpm lint` passes with 0 type-aware/type-resolution errors. `pnpm typecheck` passes. `pnpm build` passes.
4. **Health checks pass.** Application startup and readiness endpoints respond.
5. **Structured logs present.** No secrets in log output.
6. **Backup/restore evidence.** Rollback route verified in staging.

### Microtask ownership model

- Each task ID has **one owner**. No shared/task-less ownership.
- Acceptance criteria are **explicit and testable**. "Green CI" means all workspace-level `pnpm` scripts pass. "Health checks pass" means the application responds to its health endpoint.
- No task is marked complete because a PR is merged without required verification.
- GitHub Issues are **mirrors** of TODO.md task IDs, not the other way around.
- New tasks cannot be created without mapping to a deliverable owner and acceptance criterion.

---

## 4. Current state (2026-11-01)

| Category | Status |
|---|---|
| **Phase 1** | Reconciliation complete; all 44 discrepancy entries (R-01–R-44) evidenced with exact SHAs |
| **Phase 1 — repository census (D02)** | **CENSUS COMPLETE**: 92 individually SHA-pinned rows = 90 filter-matched candidates (84 with a commit, 6 verified empty) + 2 carried rows; produced by the three-source union census (search + user listing + org listing) after the fork-exclusion and org-vs-user defects were found; coverage and SHA freshness enforced by `docs/audit/tools/repository_census_gate.py`, currently green (`GATE: PASS`) with one documented moving-tip exemption |
| **Phase 1 — capability mapping (D02/D08)** | **MAPPING COMPLETE**: every one of the 102 matrix rows (92 repositories + 10 XV component slices) has a target canonical owner in the estate-wide roll-up, enforced by the same gate (`ROLLUP_COVERAGE 102 of 102`); 38 rows resolve to `NONE` (empty, independent, excluded or illegal to depend on), 3 to `MULTIPLE`, 2 stay `TBD` for want of an inventory, and the roll-up surfaced two new owner decisions (R-43 single-owner capacity, R-44 material with no ratified domain) |
| **Phase 2** | Master Vision Narrative exists; owner ratification pending |
| **Phase 3** | Product Specification exists; owner ratification pending |
| **Phase 4** | BLUEPRINT.md created; architecture design ratified |
| **Phase 5** | MASTER_DESIGN.md created; visual system and i18n design ratified |
| **Phase 6** | D21–D26 in progress; D21 (i18n catalog) and D22 (security) need implementation detail |
| **Phase 7** | Not started; foundation build pending Phase 8 gate |
| **Phase 8** | Not started; first vertical slice pending Phase 7 completion |
| **Phase 9** | Not started; domain expansion pending first-slice gate |
| **Phase 10** | Not started; integration and hardening pending domain completion |
| **Phase 11** | Not started; release preparation pending integration completion |
| **Phase 12** | MW-0501–MW-0507 implemented in-workspace and covered by the addon/HTTP suites; owner browser verification and ADR-013/014 formal ratification pending; nothing pushed or deployed |

---

## 5. Ratification blockers (before feature implementation)

1. **Approve domain/addon names and exact-text/corpus owner.**
2. **Approve initial journey and dataset/edition after rights check.**
3. **Decide whether object storage and messaging are external integrations at all.**
4. **Review and ratify the remaining planning baseline before feature implementation.**
5. **Name the citation target for the shared "EMPIRE OF THE LIGHT" foundation-design baseline** — `bjo163/A-L-L-A-H` and `bjo163/empire-of-the-light` both publish the identical title block and the verbatim "FOUNDATION DESIGN BASELINE — PROPOSED" status line (R-37).
6. **Rule on the broken supersession pointer** — `ecosystem-foundation` declares LEGACY and mandates `universe-foundation`, which now redirects to `universal-ontology-engine` (R-38).
7. **State whether `bjo163/ArsyBelovedLabs` (the account-local repository, not the organization) is a plan of record** — it carries competing `FINAL-ADR-RATIFICATION-V1` / `FINAL-MIGRATION-MATRIX` / `ARCHITECTURE-TRUTH-MATRIX` documents (R-39).
8. **Confirm disposition of the third-party code inside the account** — `surealdb-rebrand-mwdb` is a SurrealDB fork under BSL 1.1 whose grant forbids use "as a Database Service", and `mooncripsy` is an unlinked copy of an external CDP assistant agent that is **still being developed in this account** (tip `bf580cb…`; its second commit (07:45:06Z) added a `PRODUCT.md` that protects its "no API key / no MCP / no tunnel" positioning as a product commitment and its third (08:09:06Z) rewrote the desktop UI under an automated design agent); both are currently excluded from migration, `rocksoul-mind` stays an upstream MiniMind reference (R-40, R-41).
9. **Accept that ratification is SHA-bound** — `bjo163/moonwitness-reborn` `main` kept advancing through the whole audit (twelve tips by 08:29Z, `7d801c3…`, `validate` **green**), then the commits this workspace held locally were merged through PR #1 and PR #2 and cut as tag and release `v0.1.0` at `4fdb7c7…`, with classic `main` protection (required `validate`, `enforce_admins`) switched on — all of it by another session, while this audit's planning documents were, at that reading, still sitting outside git (they are committed now; blocker 11 names the SHAs). Whether this workspace sits ahead of or behind `origin/main` changes within minutes, so `prompt_coverage_gate.py` prints the branch, its upstream, the unpushed count, tracked-modified files, HEAD, `origin/main` and both counts every run and no sentence carries them — reading "ahead of `origin/main`" as "unpushed" was itself an error this audit made and corrected, because a checkout on `dev` is ahead of `main` by every `dev` commit. The open decision is stabilization: ratification must name a commit, and that commit must then be held, or every ratified plan expires on the next merge (R-42).
10. **Ratify the single-owner capacity rule** — the estate-wide roll-up maps 7 design-system sources, 2 contract sources, 10 separate web surfaces and 4 worker/API designs onto slots that `AGENTS.md` allows exactly once each; adopting from any of them means absorbing into `@moonwitness/ui` / `@moonwitness/moonclient` / one `apps/web`, never adding a second package or shell (R-43).
11. **Ratify the baseline at a named commit** — the documents are now in git: `8016edc…` on `dev` carries `BLUEPRINT.md`, `MASTER_DESIGN.md`, every register document path except the three under `docs/data/`, and the two gate scripts (29 files, +3454/−114), and its child commit unblocked those three, which `.gitignore` line 9 (`data/`, unanchored) had made un-committable (R-53). `prompt_coverage_gate.py` measures against HEAD, so the child commit is what makes it read `0 not in HEAD` — staging alone used to print zero, which is why the earlier claim "26 of 29 untracked — an owner decision" was partly a tooling defect and partly a flattering instrument, not a refusal. What is left is the owner's accept/amend decision against a named commit and the stabilization that decision requires (R-49/R-42).
12. **Choose one phase numbering** — `TODO.md` runs a twelve-lane ladder whose "Phase 12 — External service integration (Cloudflare DNS)" is `masterprompt.md`'s PHASE 12 "RELEASE & CONTINUOUS IMPROVEMENT", while the prompt's PHASE 4 (Master Data & Domain Design) and PHASE 7 (Master TODO & GitHub Governance) have no row here at all. Pick the prompt's numbering or declare the lanes canonical, and give PHASE 4 and PHASE 7 a home either way (R-45).
13. **Decide what "per domain" means for §4.4** — the twenty contract attributes are currently covered by estate-wide rules plus this registry, not by a written contract per domain; attribute 13 (events and notifications) is defined nowhere. Choose between defaults-plus-addon-manifests and one contract block per domain (R-46).
14. **Ratify the six §4.3 domains added by the coverage pass** — `ql_evidence`, `ql_law`, `ql_creative`, `ql_publication`, `ql_search` and `ql_ops`, plus the three owner narrowings that came with them (evidence records out of `ql_research`, publication records out of `ql_workflow`, creative production out of `ql_story`). Then rule on whether `rocksoul-aws`'s LAW corpus enters scope as an import candidate and whether the two `TBD` private repositories (`moonwitness-xiv`, `bjo163/mw-core`) justify a commissioned inventory (R-44).
15. **Rule on the five §4.3 domains with no estate material** — `ql_creative`, `ql_journey`, `ql_org`, `ql_person` and `ql_search` receive zero mapped rows from the 102-row roll-up, so they are required by the prompt but nothing in the estate feeds them; decide whether each is in-scope-by-design or a placeholder owner (R-48).
16. **Rule on the six phase-list holes** — the EXECUTION PROTOCOL's per-phase deliverable lists are now mapped item by item in `docs/governance/REQUIREMENTS_TRACEABILITY.md`, and six items have no specification behind them: Search and Storage (PHASE 3), Brand and Design Tokens (PHASE 5), Tenant Model and Performance Requirements (PHASE 6). Write the missing spec or de-scope it explicitly for the first slice (R-50).
17. **Approve the governance-mechanics deferral list** — GitHub Issues, Projects and Milestones remain uncreated *on purpose* until ratification (zero open issues, no board inventory). Branch protection is no longer on that list: `main` gained classic protection with a required `validate` check and `enforce_admins` enabled (observed 2026-11-01T09:00Z), created by the release session rather than by this plan — but unevenly: `dev` requires `validate` with `strict: false` and `enforce_admins: false`, `main`'s review object demands zero approvals, there are no rulesets at all, and the default branch was flipped to `dev` at 09:09:20Z (R-52). Two items are genuine omissions rather than deferrals: no label scheme exists anywhere in the baseline, and no task row declares its dependencies (R-51).
18. **Decide the build-phase sequencing** — PHASE 8 (14 listed items), PHASE 11 (13) and PHASE 12 (8) have no microtask decomposition, while MW-0501…MW-0507 implement RBAC, connectors, transport and UI, and PR #2 has already executed PHASE 12's list end to end: merge, verify, promote to `main`, generate version, update changelog, publish release `v0.1.0`. Either accept the released work retroactively or hold the rest of the build phases until this baseline is ratified — but the baseline cannot be ratified against a commit the next merge moves (R-52).

---

**Gate:** No production feature coding, external issue creation, push, branch policy change, or migration begins until the owner reviews and ratifies the planning baseline. `PENDING` means no evidence has been established; it must not be presented as complete.

**Owner:** `bjo163` — per workspace `AGENTS.md` and `masterprompt.md` §1.4 Product North Star.