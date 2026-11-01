# Requirements Traceability Matrix

**Status: canonical requirement catalog and traceability authority.** The target repository (`moonwitness-reborn`) is ratified. The companion [`requirement-catalog.json`](./requirement-catalog.json) preserves 1,891 atomic source statements from the retired planning prompt as stable `MWREQ-*` records. Each record links one canonical specification owner and one or more TODO tasks, while specification review and implementation evidence remain separate status fields. This document maps all 12 pillars, all 31 deliverables, execution phases, acceptance criteria, final-assignment steps, and the absolute constitution. [`task-tracker.json`](./task-tracker.json) is the sole task-status register; [`TODO.md`](../../TODO.md) is a generated Markdown view. A catalog row does not imply implementation, testing, owner ratification, or release approval.

The current code/test/CI evidence snapshot is recorded separately in
[`IMPLEMENTATION_CONFORMANCE_AUDIT.md`](../audit/IMPLEMENTATION_CONFORMANCE_AUDIT.md).
The audit assigns a status and rationale to every catalog row; those triage dispositions do
not certify product conformance. The current counts are 369 `GAP`, 267 `PARTIAL`, 1,255
`UNKNOWN`, and zero `UNVERIFIED`.

The catalog is the canonical atomic requirements inventory, not a second detailed architecture or product specification. The `canonical_home` field assigns exactly one document that owns each requirement's detailed definition; all other documents may reference that ID. Legacy line spans are provenance only and do not keep the deleted source file authoritative. Requirements with unresolved decisions stay `REVIEW_REQUIRED`. `implementation_status` and `implementation_review_basis` are mutable audit fields; the inventory digest covers only immutable migrated source fields. `UNKNOWN` means no direct requirement-specific code/test evidence was established, not that the requirement is implemented.

| Requirement ID | Requirement | Canonical spec | Candidate task(s) | Evidence / test status |
|---|---|---|---|---|
| REQ-PROD-001 | One integrated product and coherent experience | Product Specification; BLUEPRINT; official canon | MW-0601, MW-0616, MW-0905 | Product target documented; implementation audit and first-slice evidence pending |
| REQ-ARCH-001 | One Web/API application, API and identity authority | BLUEPRINT | MW-0601, MW-0802 | Target proposed; conformance not yet audited against current code |
| REQ-ARCH-002 | Domain behavior, models, ACL and views in TypeScript ql addons | BLUEPRINT; local AGENTS.md | MW-0601, MW-1001 | Binding workspace rule; addon-by-addon evidence pending |
| REQ-DATA-001 | QlOrm owns app schema; no Drizzle/migration files | Database Strategy | MW-0601, MW-0807, MW-1103 | Binding; runtime and schema-evolution evidence pending |
| REQ-DATA-002 | Exactly one canonical owner per entity | Domain Registry | MW-0601, MW-0611, MW-1001, MW-1101 | 23-domain registry mapped; implementation and owner ratification pending |
| REQ-DATA-003 | Source, version, rights and provenance trace every imported record | Data Lifecycle; Corpus Plan | MW-0605, MW-0901, MW-0902, MW-1104 | Proposed; rights-approved edition and implementation evidence pending |
| REQ-KNOW-001 | Exact text, translation, commentary and interpretation stay distinct | Corpus Plan; Data Dictionary | MW-0903, MW-0905, MW-1104 | Proposed; first-slice and rights evidence pending |
| REQ-API-001 | Shared moonclient contracts/routes and moonClient web transport | API Contract | MW-0601, MW-0811, MW-1102 | Local code exists; full route/contract conformance audit pending |
| REQ-SEC-001 | Default-deny ACL and cross-owner isolation | Security Blueprint | MW-0601, MW-0809, MW-1105 | Partial implementation; required negative-test evidence pending |
| REQ-SEC-002 | Private secrets never in metadata/CRUD/logs/responses | Security; AI Architecture | MW-0601, MW-0810, MW-1105 | Private-field controls exist in part; full-path audit and tests pending |
| REQ-SEC-003 | Internal service accesses remain owner-scoped | Security Blueprint | MW-0601, MW-0809, MW-1105 | Owner-scope evidence pending |
| REQ-UX-001 | Shared `@moonwitness/ui`, responsive accessible patterns | Master Design | MW-0601, MW-0804, MW-0805, MW-1106, MW-1108 | Package exists; rendered UX and accessibility verification pending |
| REQ-I18N-001 | Initial UI locales id/en and dark/light themes | I18N; Master Design | MW-0607, MW-0805, MW-0806, MW-1107 | Requirements mapped; locale/theme implementation audit pending |
| REQ-AI-001 | AI cannot silently write canonical records or assert final authority | AI Architecture; official canon | MW-0601, MW-1105 | Policy documented; permission, evaluation, and audit evidence pending |
| REQ-OPS-001 | Reproducible build, health, backup/restore and rollback evidence | Infrastructure; Migration Plan | MW-0601, MW-0813, MW-0814, MW-1110–MW-1113 | Deployment/recovery evidence not verified |
| REQ-GOV-001 | Unique tasks and accepted decisions have evidence | TODO; ADR Registry; GitHub Governance | MW-0612–MW-0616 | Goal register created; owner ratification and gated GitHub mapping pending |
| REQ-REL-001 | Release claims are tied to exact SHA and gates | Release Strategy | MW-0616, MW-1201–MW-1208 | Existing release is historical; current release-gate evidence pending |

Add requirements through a stable ID process. Every accepted requirement links to one canonical spec, domain owner, task, test/evidence and release gate. Do not mark complete by document presence alone.

## Legacy requirement end-to-end crosswalk

The source inventory has four mapped layers: 12 product/architecture pillars, 87 execution-protocol planning-list entries, 35 enumerated build/verification/release entries, and nine acceptance criteria. The tables below preserve the migration crosswalk; `MAPPED / NOT VERIFIED` means a canonical home exists but direct implementation behavior has not been established.

| Legacy scope | Requirement coverage | Canonical carrier(s) | Mapping / evidence state | Goal(s) |
|---|---|---|---|---|
| PILLAR 01 §§1.1–1.5 — Constitution, identity, vision | Product identity, ecosystem boundaries, spiritual/editorial safeguards, north star, principles | `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`; D04; D05 | Identity/narrative canon ratified; product scope/first journey remain proposed; implementation unverified | MW-0601, MW-0602, MW-0616 |
| PILLAR 02 §§2.1–2.6 — Repository intelligence and migration | Audit scope/depth/classification, preservation, reconciliation | D01, D02, D03; `docs/audit/tools/repository_census_gate.py` | Census and 102-row owner roll-up gate pass at recorded HEAD; source-depth, rights, permission scopes, and implementation evidence remain limited | MW-0601, MW-0603, MW-0616 |
| PILLAR 03 §§3.1–3.6 — Single Web/API architecture | Unified application, runtime, modularity, processing, technology, application structure | D06/D07; D13; D14; D18; D19; D23 | Target architecture mapped; current conformance requires code-level audit | MW-0601, MW-0616 |
| PILLAR 04 §§4.1–4.5 — Canonical data and domain ownership | Shared kernel, 23 domains, entities, contracts, dependencies | D08–D14; D30 | 23/23 §4.3 domains and 20/20 §4.4 attributes mapped; per-domain contract depth and events/notifications unresolved; five domains have no estate-source material | MW-0601, MW-0610–MW-0612 |
| PILLAR 05 §§5.1–5.12 — Knowledge, corpus, research | Source, exact text, editions, rights, provenance, research methods/evidence | D11, D12, D15, D16; D29 | Specifications mapped; dataset/edition rights and first-slice evidence remain unapproved; implementation unverified | MW-0601, MW-0605, MW-0901–MW-0905 |
| PILLAR 06 §§6.1–6.5 — Character, story, creative | Person/character/agent/story separation, canon, visual/narrative use, creative studio | D11, D17, D04 | Boundary specification mapped; five-domain/source gap includes `ql_creative`; implementation unverified | MW-0601, MW-0611, MW-1001 |
| PILLAR 07 §§7.1–7.8 — AI, agents, workflows | Provider/config boundary, agents, lifecycle, memory, safety/evaluation, workflows | D18, D19, D28; D22 | Safety and workflow specs mapped; code-level permissions, evaluations, and no-silent-write evidence remain to audit | MW-0601, MW-1001, MW-1105 |
| PILLAR 08 §§8.1–8.8 — UX, design, branding, I18N | One shell, patterns/routes, brand, tokens, components, tenant branding, id/en | D20, D21; `docs/vision/ALLAH_COM_OFFICIAL_CANON.md` | Public identity is canonically defined; visual brand/token inventory and tenant model are partial; current UI is not a verified implementation of the proposed system | MW-0601, MW-0602, MW-0606–MW-0608, MW-0803–MW-0806 |
| PILLAR 09 §§9.1–9.6 — Security, privacy, rights, integrity | Identity/ACL, privacy, rights, religious/research integrity, admin governance | D12, D22, D28; D08; D13 | Requirements mapped; tenant decision, rights evidence, and full negative-test coverage remain open | MW-0601, MW-0605, MW-0608, MW-1104, MW-1105 |
| PILLAR 10 §§10.1–10.10 — Data, API, infrastructure, quality | Database, API, search, storage/media, import/export, observability, performance, tests, NFRs | D13–D16, D23, D24, D29, D31 | Search specification absent; storage decision/threat model and quantitative performance targets incomplete; implementation/CI evidence must be rechecked | MW-0601, MW-0604, MW-0605, MW-0609, MW-0807, MW-0810–MW-0814, MW-1102–MW-1113 |
| PILLAR 11 §§11.1–11.4 — Scope, journeys, roadmap | Personas, seven journeys, horizons, first-release principle | D04, D05, D19, D31 | Product requirements mapped but priority, first journey, and approved dataset remain pending owner ratification | MW-0601, MW-0616, MW-0901–MW-1001 |
| PILLAR 12 §§12.1–12.6 — Governance, documentation, AI execution | Document ownership, traceability, ADRs, TODO/GitHub, branches, agent execution | D25–D30; TODO.md; D27; D28 | Core policies mapped; task dependencies, label taxonomy, GitHub object mapping, and phase-number alignment remain open | MW-0601, MW-0612–MW-0617, MW-1201–MW-1208 |
| Absolute project constitution — rules 1–30 | Single authorities, no duplicate ownership/surfaces, rights/privacy, evidence/status honesty, acceptance, architecture changes | Official canon; D03, D06–D14, D18–D31; `AGENTS.md` | Rules have canonical homes; technical compliance is not inferred from documentation and requires code/tests/evidence | MW-0601, MW-1101–MW-1113 |
| Overlap, scope-resolution, and evidence rules | Seven-step overlap resolution; seven-step scope resolution; status vocabulary | D03, D05–D08, D25, D30, D31; official canon | Mapped as governing policy; each discovered overlap and status claim must be checked against code and evidence | MW-0601, MW-0611, MW-0616 |
| FINAL ASSIGNMENT — STEPS 1–8 | Repository discovery, source audit, capability map, conflict resolution, ownership, D01–D31, TODO, report | D01–D03, D08–D31, TODO.md, `docs/audit/PROMPT_COVERAGE_AND_STEP8_REPORT.md` | Deliverable/report structure mapped; live repository permissions, exact current implementation evidence, and build-phase TODO decomposition are not all verified | MW-0601, MW-0603, MW-0612, MW-0616 |

## FINAL ASSIGNMENT step map

| Step | Prompt requirement | Canonical home | Goal/task | State |
|---|---|---|---|---|
| 1 | Repository discovery and source-of-truth selection | D01, D02, D27; MW-ADR-001 | MW-0603, MW-0616 | Repository selected; permission scope incomplete |
| 2 | Complete code/data/source audit | D01, D02, D15–D17 | MW-0601 | Prior repository census exists; implementation audit not yet run |
| 3 | Map features, models, API, screens, sources, characters, assets, workflows | D02 estate roll-up; D08, D11, D13, D17, D19 | MW-0601, MW-0611 | Repository capability map exists; implementation inventory is next |
| 4 | Resolve historical architecture and migration conflicts | D03; D06–D09; D29 | MW-0601, MW-0616 | Conflicts recorded; owner dispositions remain |
| 5 | Finalize canonical domain/entity/schema/dependency ownership | D08–D14 | MW-0610–MW-0612, MW-1001 | 23 domains mapped; contract depth, no-source domains, and implementation evidence remain |
| 6 | Finalize applicable D01–D31 master documents | `docs/audit/DELIVERABLE_REGISTER.md` | MW-0616 | 31/31 canonical document paths registered; proposals still require appropriate review/ratification |
| 7 | Convert approved requirements to unique bounded microtasks with dependencies | TODO.md; MW-0601–MW-1208 | MW-0612, MW-0616 | 58 proposed goals/tasks now have IDs, acceptance criteria, owners, and an acyclic dependency map; implementation tasks remain gated |
| 8 | Present the twelve-item STEP 8 report | This report | — | 12/12 requested report items present; factual evidence remains separately qualified |

## Historical implementation audit snapshot

This earlier baseline is retained for audit history only. Its package and workspace findings
were superseded by the current [Implementation Conformance Audit](../audit/IMPLEMENTATION_CONFORMANCE_AUDIT.md).

| Requirement area | Evidence observed | State and limitation |
|---|---|---|
| Workspace build/type safety | `pnpm typecheck` passed: 26 Turbo tasks succeeded; 25 were cached. | PARTIAL — a workspace-level result only; it does not prove runtime behavior or acceptance of the dirty changes. |
| Lint | `pnpm lint` exited successfully. | PARTIAL — current dirty workspace only; not a clean-SHA verification. |
| Automated tests | `pnpm test` exited successfully: 20 Turbo tasks succeeded. | PARTIAL — suite coverage is not equivalent to every requirement's positive/negative acceptance evidence. |
| Addon implementation coverage | The workspace contains manifests for `ql_ai`, `ql_auth`, `ql_base`, `ql_chat`, `ql_cloudflare`, and `ql_integration`. Of these, `ql_ai` and `ql_auth` are §4.3 domain owners; the other four are listed as non-domain addons by the coverage gate. | GAP — the proposed §4.3 registry has 23 domains, but this scan found no implementation manifests for the other 21 domain owners. Scope and implementation order remain governed by owner ratification and TODO. |
| Web HTTP boundary | A source scan found no direct `fetch`, `XMLHttpRequest`, or `axios` use under `apps/web`. `apps/web/src/features/auth/auth-page.tsx` imports `moonClient` for session, registration, and login operations. | PARTIAL — this is a targeted source scan and one inspected flow, not a route-by-route audit of every web feature or transport path. |
| ORM constraint | A source scan found no `drizzle` references under `apps/` or `packages/`. | PARTIAL — the scan does not prove all schema and persistence behavior is implemented through QlOrm; addon/model/bootstrap review remains pending. |

The source file has been retired independently of product implementation because every source
block is preserved in D30 and both catalog-backed gates and their prompt-free regression tests
pass. The latest audit found addon implementations for only three of 23 target domains in the
dirty workspace; 20 target domains have no addon manifest. The detailed findings and command
evidence are in [Implementation Conformance Audit](../audit/IMPLEMENTATION_CONFORMANCE_AUDIT.md).
MW-0601 remains in progress because the 1,891 catalog entries have not yet been individually
mapped to implementation evidence or an explicit `GAP` / `UNKNOWN` status. Retirement does not
imply product readiness or owner ratification.

## Goal links for planning-list gaps

Each PARTIAL/NONE entry in PHASE 0–7 has a concrete TODO goal. These goals make the gap actionable; they do not upgrade its coverage status until the acceptance criterion is evidenced.

| Phase | Prompt item | Goal in TODO.md | Status before goal evidence |
|---|---|---|---|
| 0 | Inspect GitHub permissions | MW-0603 | PARTIAL |
| 3 | Search | MW-0604 | NONE |
| 3 | Storage | MW-0605 | PARTIAL |
| 5 | Brand | MW-0606 | PARTIAL — official identity is ratified; visual brand specification is not complete |
| 5 | Design Tokens | MW-0607 | PARTIAL |
| 6 | Tenant Model | MW-0608 | PARTIAL |
| 6 | Performance Requirements | MW-0609 | PARTIAL |
| 7 | Microtask breakdown | MW-0612 | PARTIAL |
| 7 | Dependencies | MW-0612 | PARTIAL |
| 7 | GitHub Issues | MW-0614 | PARTIAL — creation deliberately gated |
| 7 | GitHub Project | MW-0614 | PARTIAL — creation deliberately gated |
| 7 | Labels | MW-0613 | NONE |
| 7 | Milestones | MW-0614 | PARTIAL — creation deliberately gated |

## PHASE 0–7 deliverable coverage (planning phases)

The legacy §EXECUTION PROTOCOL gave every phase its own list of things to produce. This table
preserves the migration mapping for the 87 planning-list entries; its source line spans now live in
the D30 catalog and are provenance, not a live-file dependency.

Carrier names are deliverable IDs in `docs/audit/DELIVERABLE_REGISTER.md` plus a section name in
that file. Status is one of `COVERED` (the list item has a written home), `PARTIAL` (it is named and
constrained somewhere but not specified as such) or `NONE` (nothing in the baseline carries it).
Every non-`COVERED` row names the reconciliation entry that records the gap. These statuses were
assigned during the migration and are not recalculated by the independent catalog-integrity gate.

| Phase | Legacy deliverable requirement | Carrier in this baseline | Status | Gap entry |
|---|---|---|---|---|
| 0 | Identify the correct main repository | D01 §Selected repository findings summary; D26 owner selection of `moonwitness-reborn` | COVERED | — |
| 0 | Inspect GitHub permissions | D27 §Verified `moonwitnessxv` snapshot and §Verified current workspace repository (account `bjo163` admin on both); full organization/team scope remains unverified | PARTIAL | R-51 |
| 0 | Inspect default branch and working branch | D02 per-row branch and tip column; D27 §Verified current workspace repository | COVERED | — |
| 0 | Capture exact SHA | D02 per-row SHA at every census row; `docs/audit/tools/repository_census_gate.py` fails on a stale one | COVERED | — |
| 0 | Audit all relevant repositories | D02 roll-up, 102 rows (92 repositories plus 10 XV component slices) | COVERED | — |
| 0 | Audit actual applications and packages | D02 applications/packages column; D01 §Local implementation reality | COVERED | — |
| 0 | Audit actual API routes | D01 §Source-level inspection of the selected repository; D13 §Route registry | COVERED | — |
| 0 | Audit database and migrations | D14 §Current implementation evidence and gap; D01 §Local implementation reality | COVERED | — |
| 0 | Audit source datasets | D15 §Observed source; D01 §Corpus candidate inventory snapshot | COVERED | — |
| 0 | Audit characters and assets | D17 §Audit disposition; D02 asset rows (`rocksoul-assets` rights review) | COVERED | — |
| 0 | Audit GitHub governance | D27 whole file; D01 §Governance snapshot | COVERED | — |
| 0 | Run available safe verification commands when the environment permits | D01 §Verification evidence; the two offline gates in `docs/audit/tools/` | COVERED | — |
| 1 | Old vision documents | D03 §Authority order and §Applicability of historical decisions | COVERED | — |
| 1 | Old architecture | D03 §Discrepancy register | COVERED | — |
| 1 | Current implementation | D01 §Local implementation reality; D03 §Discrepancy register | COVERED | — |
| 1 | Historical ADR | D03 §Applicability of historical decisions; D25 | COVERED | — |
| 1 | Database models | D03 §Target ownership decisions; D14 §Binding rules | COVERED | — |
| 1 | Application ownership | D03 §Target ownership decisions; D06 §D07 Single Web/API Architecture | COVERED | — |
| 1 | Repository responsibilities | D02 roll-up owner column; D03 §XV capability migration matrix | COVERED | — |
| 1 | Narrative and product terminology | D03 §Discrepancy register; D04 §Identity | COVERED | — |
| 1 | Branch and automation rules | D27 §Proposed policy after repository selection; D03 R-42 | COVERED | — |
| 2 | Product identity | D04 §Identity | COVERED | — |
| 2 | Ecosystem boundaries | D04 §Ecosystem boundary | COVERED | — |
| 2 | Mission | D04 §Mission and promise | COVERED | — |
| 2 | Values | D04 §Product principles (the baseline states values as principles, not as a separate list) | COVERED | — |
| 2 | User promise | D04 §Mission and promise | COVERED | — |
| 2 | Product scope | D05 §Product outcome and §Open product decisions | COVERED | — |
| 2 | Core capability map | D05 §Capabilities and stages; D02 per-family capability views | COVERED | — |
| 2 | Character and narrative boundaries | D04 §Editorial and spiritual boundaries; D17 §Canonical distinction | COVERED | — |
| 3 | One Web/API architecture | D06 §D07 Single Web/API Architecture | COVERED | — |
| 3 | Application structure | D06 §7 Application structure | COVERED | — |
| 3 | Runtime | D06 §6 Technology selection | COVERED | — |
| 3 | Domain ownership | D06 §9 Canonical ownership; D08 §Addon/domain table | COVERED | — |
| 3 | Shared kernel | D10 | COVERED | — |
| 3 | Data model | D11 | COVERED | — |
| 3 | Database | D14 | COVERED | — |
| 3 | API | D13 | COVERED | — |
| 3 | Search | D08 `ql_search` owner row and its dependency arrows only — no search specification exists | NONE | R-50 |
| 3 | Storage | D23 §Integrations names object storage as an optional dependency that still needs a threat model; no storage specification | PARTIAL | R-50 |
| 3 | AI | D18 | COVERED | — |
| 3 | Workflow | D19 | COVERED | — |
| 3 | Security | D22 | COVERED | — |
| 3 | Deployment | D23 | COVERED | — |
| 4 | Domain Catalog | D08 §Addon/domain table (27 rows, 23 §4.3 domains) | COVERED | — |
| 4 | Canonical Entity Registry | D08 §Addon/domain table and §Estate-wide landing map; D11 entity rows | COVERED | — |
| 4 | Domain Dependency Graph | D08 §Dependency graph (one graph; a duplicated second copy was deleted) | COVERED | — |
| 4 | Data Dictionary | D11 | COVERED | — |
| 4 | API Ownership Matrix | D13 §API ownership matrix (proposed) | COVERED | — |
| 4 | Relationship Contract | D10 §Relationship contract; D08 `ql_relationship` row | COVERED | — |
| 4 | Source and Provenance Contract | D12 §Provenance record minimum; D10 §Required shared concepts | COVERED | — |
| 4 | Data Lifecycle | D12 §Lifecycle | COVERED | — |
| 4 | Migration Specification | D29 §Data import and rollback and §Schema rollout under QlOrm | COVERED | — |
| 5 | Brand | `docs/vision/ALLAH_COM_OFFICIAL_CANON.md` fixes the A-L-L-A-H.COM identity, vision, promise and declaration; no approved visual wordmark, palette ownership, or full voice/usage specification | PARTIAL | R-50 |
| 5 | Visual System | D20 §2 Visual system requirements | COVERED | — |
| 5 | Application Shell | D20 §9 Application shell | COVERED | — |
| 5 | Navigation | D20 §5 Navigation plus the §9 role-checked routes | COVERED | — |
| 5 | Design Tokens | D20 §2 mandates semantic tokens and §3 records that `@moonwitness/ui` tokens are dark-only; there is no token inventory or naming rule | PARTIAL | R-50 |
| 5 | Component System | D20 §5 Component system | COVERED | — |
| 5 | Character Bible | D17 | COVERED | — |
| 5 | Page Templates | D20 §5 Templates (reader, explorer, workspace, admin, creative) | COVERED | — |
| 5 | Dark/Light | D20 §4 Theme system | COVERED | — |
| 5 | I18N | D20 §6 and D21 | COVERED | — |
| 5 | Accessibility | D20 §7 | COVERED | — |
| 5 | Responsive Behavior | D20 §8 | COVERED | — |
| 6 | ADRs | D25 | COVERED | — |
| 6 | Authentication | D22 §Required controls; D13 §Authentication and authorization | COVERED | — |
| 6 | Authorization | D22 §Required controls; D08 §4.3 coverage ACL column | COVERED | — |
| 6 | Tenant Model | D10 §Owner/tenant scope and the D08 `ql_org` row; D22 says "tenant scope only if adopted", and D01 keeps the tenant decision open | PARTIAL | R-50 |
| 6 | Database Security | D14 §Integrity and access; D22 §Required controls | COVERED | — |
| 6 | Data Rights | D12 §Rights gates | COVERED | — |
| 6 | API Contracts | D13 | COVERED | — |
| 6 | AI Safety | D18 §Failure and safety; D28 | COVERED | — |
| 6 | Testing Strategy | D24 | COVERED | — |
| 6 | Performance Requirements | D24 §Quality attributes to quantify and D05 §Non-functional requirements both state the numbers are still to be set; none are set | PARTIAL | R-50 |
| 6 | Backup and Recovery | D14 §Backup and recovery; D29; D31 | COVERED | — |
| 6 | Deployment | D23 | COVERED | — |
| 7 | Unique milestone register | D26 §2 Microtask breakdown; D27 §Task and issue governance (TODO is the sole register) | COVERED | — |
| 7 | Microtask breakdown | D26 §2 carries document-level rows for the planning phases; the build phases have one D31 row each and no microtasks | PARTIAL | R-52 |
| 7 | Dependencies | D08 §Dependency graph is domain-level; no task row declares its dependencies | PARTIAL | R-51 |
| 7 | Acceptance Criteria | D26 §Acceptance Criterion column and §3 Acceptance criteria summary; D31 | COVERED | — |
| 7 | GitHub Issues | D27 §Task and issue governance writes the rule; zero issues exist because creation waits for ratification | PARTIAL | R-51 |
| 7 | GitHub Project | D26 line 19 and D27 rule that boards visualize only; D27 records that no project-board inventory is claimed | PARTIAL | R-51 |
| 7 | Labels | nothing in the baseline proposes a label scheme | NONE | R-51 |
| 7 | Milestones | D26 phase sections act as milestones; no milestone-to-GitHub mapping is written | PARTIAL | R-51 |
| 7 | Branch Protection | D27 §Re-observed at 2026-11-01T09:00Z — classic protection on `main`: required `validate` check (`strict`), required PR reviews, `enforce_admins` enabled; zero rulesets | COVERED | — |
| 7 | CI | `.github/workflows/ci.yml`; D03 R-42 records the run states the gate prints | COVERED | — |
| 7 | Release Automation | D31 §release route; PR #2 merged and tag/release `v0.1.0` published at `4fdb7c7…` — executed by another session before ratification | COVERED | — |

## PHASE 8–12 lists (build phases)

These phases list implementation work rather than documents. The counts below are the migration
crosswalk, not live parsing results. The independent gate checks catalog integrity and links; it does
not compare this table with a retired source file or certify task decomposition.

| Phase | Legacy catalog items | Decomposed into microtasks | State |
|---|---|---|---|
| 8 | 14 | 0 | BUILD — one D31 row stands in for the whole foundation list (R-52) |
| 9 | 0 | 0 | BUILD — the legacy catalog gives this phase prose only, no deliverable list |
| 10 | 0 | 0 | BUILD — prose-only legacy requirements; dependency order comes from D08 §Dependency graph |
| 11 | 13 | 0 | BUILD — verification list, no checklist item exists yet (R-52) |
| 12 | 8 | 0 | BUILD — `TODO.md` §2 has no row for this ladder; the release steps have already been executed end to end by another session (PR #1/#2 merged, tag and release `v0.1.0` at `4fdb7c7…`, release workflow `286bde5…` on `dev`) while the plan that governs them is still unratified (R-52) |

## Item-level goal map

All numbered build, verification, and release items are mapped individually below. PHASE 9 and 10 are prose requirements rather than numbered lists, so each has one explicit goal row. Task IDs and acceptance criteria are defined in TODO.md; status remains blocked until its gates are met.

| Phase | Prompt item | Goal ID | State |
|---|---|---|---|
| 8 | Repository foundation | MW-0801 | BLOCKED |
| 8 | Unified Web/API bootstrap | MW-0802 | BLOCKED |
| 8 | Routing | MW-0803 | BLOCKED |
| 8 | Application shell | MW-0804 | BLOCKED |
| 8 | Design system | MW-0805 | BLOCKED |
| 8 | I18N | MW-0806 | BLOCKED |
| 8 | Database | MW-0807 | BLOCKED |
| 8 | Authentication | MW-0808 | BLOCKED |
| 8 | Authorization | MW-0809 | BLOCKED |
| 8 | Logging and error handling | MW-0810 | BLOCKED |
| 8 | API contracts | MW-0811 | BLOCKED |
| 8 | Tests | MW-0812 | BLOCKED |
| 8 | Docker | MW-0813 | BLOCKED |
| 8 | Health checks | MW-0814 | BLOCKED |
| 9 | Implement the source-to-publication lifecycle defined in Horizon 1 | MW-0901, MW-0902, MW-0903, MW-0904, MW-0905 | BLOCKED |
| 10 | Implement approved domains according to dependency order and priority; each domain must pass its own definition of done | MW-1001 | BLOCKED |
| 11 | Domain boundaries | MW-1101 | BLOCKED |
| 11 | API consistency | MW-1102 | BLOCKED |
| 11 | Database integrity | MW-1103 | BLOCKED |
| 11 | Rights | MW-1104 | BLOCKED |
| 11 | Security | MW-1105 | BLOCKED |
| 11 | UX | MW-1106 | BLOCKED |
| 11 | I18N | MW-1107 | BLOCKED |
| 11 | Accessibility | MW-1108 | BLOCKED |
| 11 | Performance | MW-1109 | BLOCKED |
| 11 | Backup | MW-1110 | BLOCKED |
| 11 | Restore | MW-1111 | BLOCKED |
| 11 | Docker | MW-1112 | BLOCKED |
| 11 | Failure recovery | MW-1113 | BLOCKED |
| 12 | Merge to `dev` | MW-1201 | BLOCKED |
| 12 | Verify integration | MW-1202 | BLOCKED |
| 12 | Promote to `main` | MW-1203 | BLOCKED |
| 12 | Generate version | MW-1204 | BLOCKED |
| 12 | Update changelog | MW-1205 | BLOCKED |
| 12 | Publish release | MW-1206 | BLOCKED |
| 12 | Update documentation | MW-1207 | BLOCKED |
| 12 | Begin the next approved milestone | MW-1208 | BLOCKED |
