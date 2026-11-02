# MoonWitness TODO.md

**Status: Generated Markdown view · Canonical task data lives in `docs/governance/task-tracker.json`**
**Edition:** D30 requirement catalog · Edit the JSON tracker, then run `pnpm tracker:render`; do not edit generated task rows directly.
**Created:** 2026-11-01 · Owner ratification required before any feature implementation

---

## 1. Governance foundation

Per the D30 requirement catalog and `docs/governance/GITHUB_GOVERNANCE.md`:

- **`docs/governance/task-tracker.json`** is the sole canonical task and milestone status register.
- **TODO.md** is a generated Markdown view; CI checks that it matches the JSON source and template.
- **GitHub Issues** are execution records for task IDs only.
- **Every Issue** must contain canonical Task ID, description, scope, acceptance criteria, dependencies, tests, priority, complexity, evidence.
- **No duplicate task IDs.**
- **No multiple issues** implementing the same result.
- **No task** is complete because a PR is merged without required verification.
- **GitHub Projects** are operational visualizations only.
- A task marked **Done** is not evidence that the work was released; only `CHANGELOG.md` records released work.
- Completion timestamps are recorded only when known. Existing Done tasks without a timestamp remain undated.
- **Branch protection snapshot (2026-11-01):** default branch is `dev`; `main` requires a PR and the `validate` check with admin enforcement; `dev` permits direct pushes without a required-check/PR gate while force-push and deletion remain blocked and admin enforcement stays on. No repository rulesets were observed. This snapshot is operational evidence, not owner approval of every future governance policy.
- **Actions CI:** CI passed on `dev` commit `833b1be` before the automatic v0.1.4 promotion. The later synchronized `dev` tip is `64f4828`; no CI result for that exact SHA was confirmed when this snapshot was updated. Do not treat a nearby green run as evidence for another SHA.

### 1.1 Requirement-to-issue linking

Every requirement must link to:
- D30 requirement ID and canonical specification.
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

### 1.3 AI execution packets

Tasks with an `execution_packet` expose a bounded working contract: execution mode, scope, non-goals, canonical spec references, requirement IDs, likely touchpoints, checks, and stop conditions. Use the packet together with the task's dependencies and acceptance criteria; it is not permission to bypass owner, rights, security, or release gates.

- `autonomous`: safe for an AI to implement when the task is pending/proposed and every dependency is done.
- `decision_prep`: prepare evidence and options only unless the user explicitly delegates the decision in the active conversation. If delegated, choose a bounded, evidence-backed option and record it as an agent-made decision under that delegation; this never bypasses rights, security, manual verification, exact-SHA, or release gates, and does not authorize implementation.
- `manual_verification`: requires a human to perform and record the named interaction.
- `gated_implementation`: implementation is blocked until every explicit ratification and release dependency is done.

Do not commit, push, create external GitHub records, change protection, or deploy unless the user explicitly asks. If a packet's source, target ownership, acceptance test, or authorization is unclear, stop and update the task rather than guessing.

---

## 2. Microtask breakdown

### Phase 0 — Live Repository Audit

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| D01/D02 | Repository audit and capability map | Substantial; permission scope incomplete | Agent | Census and implementation audit are pinned to exact SHAs; unavailable repository/team permissions remain explicitly UNKNOWN; no production implementation is performed in this phase |

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

### Workstream MW-0500 — External service integration (Cloudflare DNS)

Owner directive and plan approval on 2026-11-01; MW-ADR-013 and MW-ADR-014 record the two ratified boundaries.

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
<!-- TASK:MW-0501 -->
<!-- TASK:MW-0502 -->
<!-- TASK:MW-0503 -->
<!-- TASK:MW-0504 -->
<!-- TASK:MW-0505 -->
<!-- TASK:MW-0506 -->
<!-- TASK:MW-0507 -->

### Workstream MW-0550 — CAB / Project Management via `ql_workflow`

Owner directive and plan approval on 2026-11-01; MW-ADR-017 records the MVP slice boundaries (one addon, reviewer reuse of `admin`/`operator`, `ql_ops` and `ql_publication` deferred). The state machine is implemented **verbatim** from `docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md:8-12` — no invented states.

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
<!-- TASK:MW-0551 -->
<!-- TASK:MW-0552 -->
<!-- TASK:MW-0553 -->
<!-- TASK:MW-0554 -->
<!-- TASK:MW-0555 -->
<!-- TASK:MW-0556 -->
<!-- TASK:MW-0557 -->
<!-- TASK:MW-0558 -->

### Master-prompt gap goals and execution microtasks

The prompt coverage gate currently maps all 87 planning-list items, all 31 deliverables, 23 domains, 20 domain-contract attributes, nine acceptance criteria, and the twelve STEP 8 report items. A mapped item is not necessarily specified or implemented: the 13 planning-list holes remain explicit below. The official A-L-L-A-H.COM identity is ratified in `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`; product, visual-brand, and implementation decisions remain governed separately.

All tasks below are proposed. Planning and audit tasks may proceed without feature coding. Tasks in PHASE 8–12 are blocked until the owner ratifies the relevant baseline and release gates. GitHub Issues, Projects, and Milestones must not be created before the governance task and ratification gates allow them.
The canonical owner for each goal/task in these tables is `bjo163`; an agent may execute a bounded task without changing its owner.

#### Planning gaps and audit goals

| ID | Goal | Master-prompt mapping | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
<!-- TASK:MW-0601 -->
<!-- TASK:MW-0602 -->
<!-- TASK:MW-0603 -->
<!-- TASK:MW-0604 -->
<!-- TASK:MW-0605 -->
<!-- TASK:MW-0606 -->
<!-- TASK:MW-0607 -->
<!-- TASK:MW-0608 -->
<!-- TASK:MW-0609 -->
<!-- TASK:MW-0610 -->
<!-- TASK:MW-0611 -->
<!-- TASK:MW-0612 -->
<!-- TASK:MW-0613 -->
<!-- TASK:MW-0614 -->
<!-- TASK:MW-0615 -->
<!-- TASK:MW-0616 -->
<!-- TASK:MW-0617 -->
<!-- TASK:MW-0618 -->

#### PHASE 8 — Single Application Foundation

| ID | Prompt item | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|
<!-- TASK:MW-0801 -->
<!-- TASK:MW-0802 -->
<!-- TASK:MW-0803 -->
<!-- TASK:MW-0804 -->
<!-- TASK:MW-0805 -->
<!-- TASK:MW-0806 -->
<!-- TASK:MW-0807 -->
<!-- TASK:MW-0808 -->
<!-- TASK:MW-0809 -->
<!-- TASK:MW-0810 -->
<!-- TASK:MW-0811 -->
<!-- TASK:MW-0812 -->
<!-- TASK:MW-0813 -->
<!-- TASK:MW-0814 -->

#### PHASE 9–10 — First Vertical Slice and Domain Expansion

| ID | Prompt item | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|
<!-- TASK:MW-0901 -->
<!-- TASK:MW-0902 -->
<!-- TASK:MW-0903 -->
<!-- TASK:MW-0904 -->
<!-- TASK:MW-0905 -->
<!-- TASK:MW-1001 -->

##### PHASE 10 — D30 feature slices under the domain-expansion gate

These are source-section work packets, not newly approved product scope. Each packet preserves exact catalog links and stays blocked until its listed owner, first-slice, and task-governance prerequisites are satisfied.

| ID | Feature slice | D30 source | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
<!-- TASK:MW-1215 -->
<!-- TASK:MW-1216 -->
<!-- TASK:MW-1217 -->
<!-- TASK:MW-1218 -->
<!-- TASK:MW-1219 -->
<!-- TASK:MW-1220 -->
<!-- TASK:MW-1221 -->
<!-- TASK:MW-1222 -->
<!-- TASK:MW-1223 -->
<!-- TASK:MW-1224 -->
<!-- TASK:MW-1225 -->
<!-- TASK:MW-1226 -->
<!-- TASK:MW-1227 -->
<!-- TASK:MW-1228 -->
<!-- TASK:MW-1229 -->
<!-- TASK:MW-1230 -->
<!-- TASK:MW-1231 -->
<!-- TASK:MW-1232 -->
<!-- TASK:MW-1233 -->
<!-- TASK:MW-1234 -->
<!-- TASK:MW-1235 -->
<!-- TASK:MW-1236 -->

#### PHASE 11 — Integration and Hardening

| ID | Prompt item | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|
<!-- TASK:MW-1101 -->
<!-- TASK:MW-1102 -->
<!-- TASK:MW-1103 -->
<!-- TASK:MW-1104 -->
<!-- TASK:MW-1105 -->
<!-- TASK:MW-1106 -->
<!-- TASK:MW-1107 -->
<!-- TASK:MW-1108 -->
<!-- TASK:MW-1109 -->
<!-- TASK:MW-1110 -->
<!-- TASK:MW-1111 -->
<!-- TASK:MW-1112 -->
<!-- TASK:MW-1113 -->

#### PHASE 12 — Release and Continuous Improvement

| ID | Prompt item | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|
<!-- TASK:MW-1201 -->
<!-- TASK:MW-1202 -->
<!-- TASK:MW-1203 -->
<!-- TASK:MW-1204 -->
<!-- TASK:MW-1205 -->
<!-- TASK:MW-1206 -->
<!-- TASK:MW-1207 -->
<!-- TASK:MW-1208 -->

---

## 3. Acceptance criteria summary

### Production-ready gates (tracked by D30 and the release specifications):

1. **Planning baseline ratified.** All D01–D31 deliverables reviewed and approved by owner.
2. **Branch protection complete and consistent.** Required protection is enforced on the active development branch and release branch; verify branch rules, required checks and review policy against the actual repository before marking this gate complete. The 2026-11-01 snapshot is uneven (see §1).
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
| **Phase 1** | Reconciliation **register** complete, reconciliation **decided** not: all 53 discrepancy entries (R-01–R-53) carry file/line/bridge/evidence rows with exact SHAs, and 18 of them still block ratification |
| **Phase 1 — repository census (D02)** | **CENSUS COMPLETE**: 92 individually SHA-pinned rows = 90 filter-matched candidates (84 with a commit, 6 verified empty) + 2 carried rows; produced by the three-source union census (search + user listing + org listing) after the fork-exclusion and org-vs-user defects were found; coverage and SHA freshness enforced by `docs/audit/tools/repository_census_gate.py`, currently green (`GATE: PASS`) with one documented moving-tip exemption |
| **Phase 1 — capability mapping (D02/D08)** | **MAPPING COMPLETE**: every one of the 102 matrix rows (92 repositories + 10 XV component slices) has a target canonical owner in the estate-wide roll-up, enforced by the same gate (`ROLLUP_COVERAGE 102 of 102`); 38 rows resolve to `NONE` (empty, independent, excluded or illegal to depend on), 3 to `MULTIPLE`, 2 stay `TBD` for want of an inventory, and the roll-up surfaced two new owner decisions (R-43 single-owner capacity, R-44 material with no ratified domain) |
| **Prompt PHASE 0** | Repository census and capability map are documented; complete GitHub/org/team permissions inventory and code-level implementation audit remain pending |
| **Prompt PHASE 1** | Reconciliation register has 53 evidence-backed entries; 18 owner decisions remain open |
| **Prompt PHASE 2** | Official A-L-L-A-H.COM identity is ratified; product specification, audience, first journey, and product scope still need ratification |
| **Prompt PHASE 3** | BLUEPRINT.md and D06/D07 architecture exist as target design; implementation conformance and search specification remain open; external/object storage is explicitly deferred pending an approved use case |
| **Prompt PHASE 4** | 23/23 candidate domains and 20/20 contract attributes map to the proposed registry; hybrid contract depth is selected, but the per-domain owner/evidence matrix and unresolved domain ratification remain open; a general event bus and outbound notifications are deferred |
| **Prompt PHASE 5** | Scoped text-wordmark, public-voice, palette-ownership, and no-tenant-brand decisions plus an observed, non-ratified token snapshot are recorded; the overall design system, approved palette, light-theme values, semantic scales, UI conformance, and broader owner ratification remain open |
| **Prompt PHASE 6** | Single-installation tenant scope is selected; numeric performance targets remain TBD; current CI and recovery evidence remain open |
| **Prompt PHASE 7** | TODO is the sole task register; task dependency, label, issue/project/milestone mapping are tracked; a separate D30 phase-ID crosswalk is recorded without renaming existing headings |

#### D30 phase-ID crosswalk (existing TODO headings retained)

The owner delegated the non-destructive crosswalk option on 2026-11-02. Existing TODO headings and task IDs remain unchanged; this table maps them to the D30 phase catalog only.

| Existing TODO heading/workstream | D30 phase ID | Treatment |
|---|---|---|
| Phase 0 — Live Repository Audit | PHASE 0 | Retain |
| Phase 1 — Reconciliation | PHASE 1 | Retain |
| Phase 2 — Master Vision Narrative | PHASE 2 | Retain |
| Phase 3 — Product Specification | PHASE 3 | Retain |
| Phase 4 — Master Blueprint | PHASE 4 | Retain |
| Phase 5 — Master Design System | PHASE 5 | Retain |
| Phase 6 — Engineering & Security Specifications | PHASE 6 | Retain |
| Governance and task-planning goals currently outside the numbered lane | PHASE 7 | Map governance goals; do not relabel foundation work |
| Phase 7 — Single Application Foundation | PHASE 8 | Keep heading; D30 ID is PHASE 8 |
| Phase 8 — First Vertical Slice | PHASE 9 | Keep heading; D30 ID is PHASE 9 |
| Phase 9 — Domain Expansion | PHASE 10 | Keep heading; D30 ID is PHASE 10 |
| Phase 10 — Integration & Hardening | PHASE 11 | Keep heading; D30 ID is PHASE 11 |
| Phase 11 — Release Preparation | PHASE 12 | Keep heading; D30 ID is PHASE 12 |
| MW-0500 — Cloudflare DNS integration workstream | Not a numbered phase | Keep separate; cross-reference integration evidence to PHASE 11 only, never label it PHASE 12 |

### Developer tooling — UI centralisation

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
<!-- TASK:MW-0571 -->
<!-- TASK:MW-0572 -->
<!-- TASK:MW-0573 -->
<!-- TASK:MW-0574 -->
<!-- TASK:MW-0575 -->
<!-- TASK:MW-0576 -->
<!-- TASK:MW-0577 -->
<!-- TASK:MW-0578 -->
<!-- TASK:MW-0579 -->
<!-- TASK:MW-0580 -->
<!-- TASK:MW-0581 -->
<!-- TASK:MW-0582 -->
<!-- TASK:MW-0583 -->

### Developer tooling — canonical project task tracker

| ID | Goal | Master-prompt mapping | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
<!-- TASK:MW-1209 -->
<!-- TASK:MW-1210 -->
<!-- TASK:MW-1212 -->
<!-- TASK:MW-1213 -->
<!-- TASK:MW-1214 -->
<!-- TASK:MW-1237 -->
<!-- TASK:MW-1239 -->
<!-- TASK:MW-1240 -->
| **Prompt PHASE 8** | Partial foundation exists in-workspace; all 14 foundation outcomes are separate blocked tasks pending ratification and implementation audit |
| **Prompt PHASE 9** | First source-to-publication slice is not verified; five lifecycle goals are defined and blocked on rights, product decisions, and foundation gates |
| **Prompt PHASE 10** | MW-1001 is decomposed into 22 source-section child tasks covering 365 exact MWREQ rows; two cross-cutting rows stay on the parent. Every child remains blocked on owner/product/release gates and must pass addon-specific DoD |
| **Prompt PHASE 11** | Integration/hardening evidence is not complete; all 13 verification outcomes are separately tracked and blocked |
| **Prompt PHASE 12** | Historical `v0.1.0` exists, but current release gates are not evidenced; all eight release steps are separately tracked and blocked |
| **MW-0500 workstream** | MW-0501–MW-0507 code is present and addon/HTTP suites were previously reported green; browser verification and latest commit CI status remain unverified |

### Developer tooling — local development infrastructure

| ID | Goal | Master-prompt mapping | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
<!-- TASK:MW-1211 -->

### Addon platform — default data and reference catalogs

| ID | Goal | Status | Owner | Acceptance criterion |
|---|---|---|---|---|
<!-- TASK:MW-1238 -->

### Phase 12 — Release & Continuous Improvement

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| MW-1201–MW-1208 | Prompt-aligned release and continuous-improvement gates | Proposed; prior release evidence requires reconciliation | Owner | Each PHASE 12 microtask is completed against an exact SHA and its acceptance evidence; do not infer completion from the existing `v0.1.0` release |

---

## 5. Ratification blockers (before feature implementation)

1. **Approve domain/addon names and exact-text/corpus owner.**
2. **Approve initial journey and dataset/edition after rights check.**
3. **Keep external/object storage deferred** until an owner-approved binary-media use case has rights, data-classification, lifecycle, threat-model, and recovery requirements.
4. **Review and ratify the remaining planning baseline before feature implementation.**
5. **Name the citation target for the shared "EMPIRE OF THE LIGHT" foundation-design baseline** — `bjo163/A-L-L-A-H` and `bjo163/empire-of-the-light` both publish the identical title block and the verbatim "FOUNDATION DESIGN BASELINE — PROPOSED" status line (R-37).
6. **Rule on the broken supersession pointer** — `ecosystem-foundation` declares LEGACY and mandates `universe-foundation`, which now redirects to `universal-ontology-engine` (R-38).
7. **State whether `bjo163/ArsyBelovedLabs` (the account-local repository, not the organization) is a plan of record** — it carries competing `FINAL-ADR-RATIFICATION-V1` / `FINAL-MIGRATION-MATRIX` / `ARCHITECTURE-TRUTH-MATRIX` documents (R-39).
8. **Confirm disposition of the third-party code inside the account** — `surealdb-rebrand-mwdb` is a SurrealDB fork under BSL 1.1 whose grant forbids use "as a Database Service", and `mooncripsy` is an unlinked copy of an external CDP assistant agent that is **still being developed in this account** (tip `bf580cb…`; its second commit (07:45:06Z) added a `PRODUCT.md` that protects its "no API key / no MCP / no tunnel" positioning as a product commitment and its third (08:09:06Z) rewrote the desktop UI under an automated design agent); both are currently excluded from migration, `rocksoul-mind` stays an upstream MiniMind reference (R-40, R-41).
9. **Accept that ratification is SHA-bound** — `bjo163/moonwitness-reborn` `main` kept advancing through the whole audit (twelve tips by 08:29Z, `7d801c3…`, `validate` **green**), then the commits this workspace held locally were merged through PR #1 and PR #2 and cut as tag and release `v0.1.0` at `4fdb7c7…`, with classic `main` protection (required `validate`, `enforce_admins`) switched on — all of it by another session, while this audit's planning documents were, at that reading, still sitting outside git (they are committed now; blocker 11 names the SHAs). Whether this workspace sits ahead of or behind `origin/main` changes within minutes; the governance gates report branch/upstream and commit evidence. Reading "ahead of `origin/main`" as "unpushed" was itself an error this audit made and corrected, because a checkout on `dev` is ahead of `main` by every `dev` commit. The open decision is stabilization: ratification must name a commit, and that commit must then be held, or every ratified plan expires on the next merge (R-42).
10. **Ratify the single-owner capacity rule** — the estate-wide roll-up maps 7 design-system sources, 2 contract sources, 10 separate web surfaces and 4 worker/API designs onto slots that `AGENTS.md` allows exactly once each; adopting from any of them means absorbing into `@moonwitness/ui` / `@moonwitness/moonclient` / one `apps/web`, never adding a second package or shell (R-43).
11. **Ratify the baseline at a named commit** — the current choice is to defer exact-SHA ratification while this worktree is dirty. A future decision must name a clean commit, disposition already-landed work, and stabilize that exact baseline (R-49/R-42; MW-0616).
12. **Preserve the separate phase crosswalk** — mapping is recorded above without renaming existing headings. GitHub milestones remain gated on the broader baseline decision (R-42/R-49; MW-0616).
13. **Complete the hybrid §4.4 domain contract matrix** — hybrid documentation depth and explicit deferral of a general event bus/outbound notifications are recorded; the per-domain owner/evidence rows and unresolved domain ratification are still incomplete (R-46).
14. **Ratify the six §4.3 domains added by the coverage pass** — `ql_evidence`, `ql_law`, `ql_creative`, `ql_publication`, `ql_search` and `ql_ops`, plus the three owner narrowings that came with them (evidence records out of `ql_research`, publication records out of `ql_workflow`, creative production out of `ql_story`). Then rule on whether `rocksoul-aws`'s LAW corpus enters scope as an import candidate and whether the two `TBD` private repositories (`moonwitness-xiv`, `bjo163/mw-core`) justify a commissioned inventory (R-44).
15. **Rule on the five §4.3 domains with no estate material** — `ql_creative`, `ql_journey`, `ql_org`, `ql_person` and `ql_search` receive zero mapped rows from the 102-row roll-up, so they are required by the prompt but nothing in the estate feeds them; decide whether each is in-scope-by-design or a placeholder owner (R-48).
16. **Close the six phase-list gaps** — all 87 PHASE 0–7 planning items are mapped; 13 remain PARTIAL/NONE and each now links to a TODO goal (MW-0603–MW-0609, MW-0612–MW-0614). Search has no specification; storage and tenant scope have explicit deferrals/selections; visual-brand boundaries are recorded but palette values and tokens remain incomplete; performance targets remain deferred. Write the missing specification or retain an explicit trigger (R-50).
17. **Approve the governance mechanics** — GitHub Issues, Projects, and Milestones remain uncreated until ratification. The missing label taxonomy, task dependencies, task decomposition, and issue/project/milestone mapping now have TODO goals (MW-0612–MW-0614). Existing branch-protection state is an observed baseline, not a fully ratified policy (R-51/R-52).
18. **Decide release sequencing and prior work** — the 14 PHASE 8, 13 PHASE 11, and 8 PHASE 12 list items now each map to separate TODO goals; PHASE 9/10 prose outcomes also have explicit goals. Owner must decide whether `v0.1.0` and work landed before ratification are accepted retroactively, and the current exact-SHA gates must pass before new release work proceeds (R-52; MW-0616, MW-0801–MW-1208).

---

**Gate:** No production feature coding, external issue creation, push, branch policy change, or migration begins until the owner reviews and ratifies the planning baseline. `PENDING` means no evidence has been established; it must not be presented as complete.

**Owner:** `bjo163` — per workspace `AGENTS.md` and the A-L-L-A-H.COM Official Canon.