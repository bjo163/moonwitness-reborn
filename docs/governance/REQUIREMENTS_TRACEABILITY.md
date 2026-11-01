# Requirements Traceability Matrix

**Status: initial skeleton.** The target repository (`moonwitness-reborn`) is ratified; test IDs and issue links remain TBD until product requirements and the remaining planning decisions are ratified. `TODO.md` is the sole task-status register.

| Requirement ID | Requirement | Canonical spec | Candidate task(s) | Evidence / test status |
|---|---|---|---|---|
| REQ-PROD-001 | One integrated product and coherent experience | Product Specification; BLUEPRINT | MW-0201, MW-0306 | Proposed; no E2E evidence |
| REQ-ARCH-001 | One Web/API application, API and identity authority | BLUEPRINT | MW-0002, MW-0301 | Target proposed; local workspace partial |
| REQ-ARCH-002 | Domain behavior, models, ACL and views in TypeScript ql addons | BLUEPRINT; local AGENTS.md | MW-0003, MW-0302, MW-0304 | Binding workspace rule; local audit found partial boundary debt |
| REQ-DATA-001 | QlOrm owns app schema; no Drizzle/migration files | Database Strategy | MW-0203 | Binding; QlOrm partial evolution tests pending |
| REQ-DATA-002 | Exactly one canonical owner per entity | Domain Registry | MW-0202 | Proposed matrix; owner review pending |
| REQ-DATA-003 | Source, version, rights and provenance trace every imported record | Data Lifecycle; Corpus Plan | MW-0102–MW-0103, MW-0401–MW-0402 | Proposed; rights and data audit pending |
| REQ-KNOW-001 | Exact text, translation, commentary and interpretation stay distinct | Corpus Plan; Data Dictionary | MW-0402–MW-0403 | Proposed; no selected edition |
| REQ-API-001 | Shared moonclient contracts/routes and moonClient web transport | API Contract | MW-0305 | Local implementation observed; tests pending |
| REQ-SEC-001 | Default-deny ACL and cross-owner isolation | Security Blueprint | MW-0205, MW-0303 | Partial implementation; required negative tests not run |
| REQ-SEC-002 | Private secrets never in metadata/CRUD/logs/responses | Security; AI Architecture | MW-0205, MW-0303 | Provider field encrypted/private observed; full path tests pending |
| REQ-SEC-003 | Internal service accesses remain owner-scoped | Security Blueprint | MW-0205, MW-0303 | Pending test evidence |
| REQ-UX-001 | Shared `@moonwitness/ui`, responsive accessible patterns | Master Design | MW-0206, MW-0306 | Current package exists; audit/coverage pending |
| REQ-I18N-001 | Initial UI locales id/en and dark/light themes | I18N; Master Design | MW-0206, MW-0306 | Gap locally; proposed |
| REQ-AI-001 | AI cannot silently write canonical records or assert final authority | AI Architecture | MW-0205, MW-0207 | Proposed policy; tests/evals pending |
| REQ-OPS-001 | Reproducible build, health, backup/restore and rollback evidence | Infrastructure; Migration Plan | MW-0307, MW-0407 | CI workflow exists; deployment/recovery not verified |
| REQ-GOV-001 | Unique tasks and accepted decisions have evidence | TODO; ADR Registry; GitHub Governance | MW-0001 | Proposed; no GitHub issue created |
| REQ-REL-001 | Release claims are tied to exact SHA and gates | Release Strategy | MW-0406–MW-0408 | No release evidence for this workspace |

Add requirements through a stable ID process. Every accepted requirement links to one canonical spec, domain owner, task, test/evidence and release gate. Do not mark complete by document presence alone.

## PHASE 0–7 deliverable coverage (planning phases)

`masterprompt.md` §EXECUTION PROTOCOL gives every phase its own list of things to produce. The
`## PHASE n` title check in `docs/audit/tools/prompt_coverage_gate.py` only proved the phase had a
TODO row, so the lists themselves were unverified: a requirement could be dropped silently and no
check would notice. This table is the mapping the gate compares against the prompt line by line.

Carrier names are the deliverable IDs in `docs/audit/DELIVERABLE_REGISTER.md` plus a section name in
that file; the gate resolves each ID against the register and fails if the register does not name a
file that exists. Status is one of `COVERED` (the list item has a written home), `PARTIAL` (it is
named and constrained somewhere but not specified as such) or `NONE` (nothing in the baseline carries
it). Every non-`COVERED` row names the reconciliation entry that records the gap; the gate fails if
that entry is missing.

| Phase | Deliverable required by the prompt | Carrier in this baseline | Status | Gap entry |
|---|---|---|---|---|
| 0 | Identify the correct main repository | D01 §Selected repository findings summary; D26 owner selection of `moonwitness-reborn` | COVERED | — |
| 0 | Inspect GitHub permissions | D27 §Verified `moonwitnessxv` snapshot and §Verified current workspace repository (account `bjo163` admin on both) | PARTIAL | R-51 |
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
| 5 | Brand | no brand section in the baseline; D04 §Identity fixes the name, nothing fixes wordmark, palette ownership or voice | NONE | R-50 |
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

These phases list implementation work rather than documents, so the honest mapping is the count the
prompt requires against what the task register actually decomposes. The gate recomputes each count
from the prompt on every run; a number typed here that no longer matches is a failure, not a typo.

| Phase | Items listed by the prompt | Decomposed into microtasks | State |
|---|---|---|---|
| 8 | 14 | 0 | BUILD — one D31 row stands in for the whole foundation list (R-52) |
| 9 | 0 | 0 | BUILD — the prompt gives this phase prose only, no deliverable list |
| 10 | 0 | 0 | BUILD — prose only; dependency order comes from D08 §Dependency graph |
| 11 | 13 | 0 | BUILD — verification list, no checklist item exists yet (R-52) |
| 12 | 8 | 0 | BUILD — `TODO.md` §2 has no row for this ladder; the release steps have already been executed end to end by another session (PR #1/#2 merged, tag and release `v0.1.0` at `4fdb7c7…`, release workflow `286bde5…` on `dev`) while the plan that governs them is still unratified (R-52) |
