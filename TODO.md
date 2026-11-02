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
| MW-0501 | RBAC roles in `ql_auth` (`res.role`, `res.users.role`, boot seeding that repairs drift) | Implemented; tests green | Owner | `pnpm --filter ql_auth test` passes; role groups come from the compiled catalog; anti-lockout guard keeps one super_admin |
| MW-0502 | Bootstrap root account via `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_TOKEN` | Implemented; one-time-use | Owner | Grants root only while zero super_admins exist; env must be removed after first owner login |
| MW-0503 | `/admin/users` role management (API guard + UI) | Implemented | Owner | `admin` group gate; own-account and last-super_admin protections; role list from `res.role` |
| MW-0504 | `ql_integration` addon: `integration.connector`, `integration.audit`, kind catalog | Implemented; no secret column | Owner | Manifest ACL + model tests pass; catalog marks `cloudflare_read` read-only |
| MW-0505 | `ql_cloudflare` addon: zone/record mirror, API client, sync, DNS mutations | Implemented; tests green | Owner | Client/sync/record-rule suites pass; mirror rows are owner-scoped |
| MW-0506 | moonclient contract + 12 API connector routes | Implemented; tests green | Owner | Routes stay under `/settings/connectors`; no contract field can carry a token; group gates fire before body reads |
| MW-0507 | Web `/connectors` and `/connectors/[id]/dns` workspaces | Implemented; not yet exercised in a browser | Owner | No token input anywhere; "Sumber token" displayed; typed confirmations for destructive actions; nav entry gated on `connector`/`operator` |

### Workstream MW-0550 — CAB / Project Management via `ql_workflow`

Owner directive and plan approval on 2026-11-01; MW-ADR-017 records the MVP slice boundaries (one addon, reviewer reuse of `admin`/`operator`, `ql_ops` and `ql_publication` deferred). The state machine is implemented **verbatim** from `docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md:8-12` — no invented states.

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| MW-0551 | `ql_workflow` addon skeleton + registration in `apps/api` bootstrap | Implemented; `turbo run build --filter=@moonwitness/api...` green | Owner | `loadAddons` accepts the manifest with `depends: ["ql_base","ql_auth"]`; `ql_workflow` is a `dependency` (not devDep) of `apps/api` so the Docker `--filter=@moonwitness/api...` closure includes it |
| MW-0552 | PM tracker models `workflow.project` + `workflow.task` (view-driven, zero new UI) | Implemented; tests green | Owner | Both models appear in `/models` metadata via the existing generic handler; ACL allows user CRUD; `owner_id` is `private:true`; test asserts no view lists a private field |
| MW-0553 | CAB state machine service (`canTransition` table transcribed 1:1 from spec) | Implemented; tests green | Owner | Table-driven test verifies every legal edge from `docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md:8-12`; every other pair rejects; `submit` requires the change owner; `approve`/`reject`/`publish`/`supersede` require the `admin`/`operator` reviewer group AND forbid self-approval (`QlConflictError`) |
| MW-0554 | `workflow.change` + `workflow.transition` models with bypass-lockdown ACL | Implemented; tests green | Owner | ACL declares `write:false, create:false, unlink:false` for every group on `workflow.change` (only `user` group's `create:true` stays, and the ORM auto-stamps `owner_id`); the bypass-lock regression test asserts `orm.update("workflow.change", ownerA, id, {state:"approved"})` throws `QlAccessError`; `workflow.transition` has zero write/unlink ACL in every group (append-only audit) |
| MW-0555 | moonclient contract: `workflow.*` DTOs, `/workflow/*` routes, transition/queue SDK | Implemented; `pnpm --filter @moonwitness/moonclient test` green | Owner | `apiRoutes.workflow` is a sibling appended after `connectors`; existing routes untouched; new `workflow routes stay under the /workflow prefix` test passes alongside the credential scanner (8/8 moonclient tests) |
| MW-0556 | API boundary: `handleWorkflowRequest` + one dispatch `if` block | Implemented; apps/api suite green (7 workflow tests + 38 existing) | Owner | Handler returns `Promise<boolean>` and follows the `handleConnectorRequest` shape; `requireGroup(user, "admin", "operator")` gates the queue and reviewer transitions; error path uses existing `handleRequestError` (unchanged) which already maps `QlAccessError→403`, `QlConflictError→409`, `QlValidationError→400`, `QlNotFoundError→404` |
| MW-0557 | Web `/workflow` review-queue screen + gated sidebar entry | Implemented; `pnpm exec turbo run build --filter=@moonwitness/web` green | Owner | Screen imports only `@moonwitness/moonclient` + `@moonwitness/ui` (root browser-boundary lint rule from MW-ADR-016 stays clean); nav link and dashboard card are gated on a `moonClient.listModels()` probe finding a `workflow.*` model — remove the bootstrap line in `apps/api/src/index.ts` and every surface disappears at once |
| MW-0558 | Manual browser click-through evidence (member submit → admin approve → PATCH bypass refused) | Blocked by manual-verification stop condition: isolated local workflow environment and non-production test accounts are unavailable | Owner | MW-0507 precedent applies — must not be reported as "done" until verified in a real browser. Automated tests already cover the bypass refusal and self-approval refusal (MW-0553/0554/0556); only the end-to-end UI flow needs manual capture |

### Master-prompt gap goals and execution microtasks

The prompt coverage gate currently maps all 87 planning-list items, all 31 deliverables, 23 domains, 20 domain-contract attributes, nine acceptance criteria, and the twelve STEP 8 report items. A mapped item is not necessarily specified or implemented: the 13 planning-list holes remain explicit below. The official A-L-L-A-H.COM identity is ratified in `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`; product, visual-brand, and implementation decisions remain governed separately.

All tasks below are proposed. Planning and audit tasks may proceed without feature coding. Tasks in PHASE 8–12 are blocked until the owner ratifies the relevant baseline and release gates. GitHub Issues, Projects, and Milestones must not be created before the governance task and ratification gates allow them.
The canonical owner for each goal/task in these tables is `bjo163`; an agent may execute a bounded task without changing its owner.

#### Planning gaps and audit goals

| ID | Goal | Master-prompt mapping | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
| MW-0601 | Audit implementation against the canon and all 12 pillars | PILLAR 01–12; acceptance A–I; D01–D31 | — | Done | The audit report records the dirty-worktree scope and committed baseline `40c04f172ff91d8002c8d51c4922c8abc6b59a37`. All 1,891 catalog rows now have an explicit status and review basis: 369 `GAP`, 267 `PARTIAL`, 1,255 `UNKNOWN`, zero `UNVERIFIED`; TODO links are retained and gates validate the inventory. Current lint/typecheck/test/build and traceability checks pass. This closes audit triage only—not implementation, owner ratification, production certification, or release approval. |
| MW-0602 | Reconcile product identity references to the official canon | PILLAR 01; STEP 6 | — | Audit passed: companion identity references align with the ratified canon; no conflicting identity or religious-authority claims found | Audit references to A-L-L-A-H.COM and MoonWitness; canonical wording links to `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`; no companion document redefines identity or confers religious authority. |
| MW-0603 | Complete repository and GitHub permission inventory | PHASE 0: GitHub permissions; PILLAR 02 | — | Read-only account, organization, repository, and team inventory recorded; unavailable scopes labeled UNKNOWN | Record account, organization, repository, team, role, and inaccessible/unknown scopes with evidence and exact observation time; distinguish verified access from unavailable data. |
| MW-0604 | Specify search and indexing boundaries | PHASE 3: Search; PILLAR 10 §10.4 | — | Decision brief prepared; unratified owner choices remain at MW-0616 | Define `ql_search` inputs, source-of-truth boundary, indexing/update/delete lifecycle, rights/private-field exclusions, query API, ownership, failure behavior, and tests; no canonical content is owned by indexes. |
| MW-0605 | Decide storage scope and write its security contract | PHASE 3: Storage; PILLAR 10 §10.5 | — | Delegated decision recorded in infrastructure blueprint: external/object storage is deferred with a binary-media, rights, lifecycle, threat-model, and recovery trigger; no provider or product upload is approved | Decide whether external/object storage is in the approved scope; if yes, specify ownership, access, encryption, rights, retention/deletion, limits, threat model, and verification; if no, record the deferral and trigger. |
| MW-0606 | Complete the visual brand specification under the official identity | PHASE 5: Brand; PILLAR 08 §§8.5–8.7 | MW-0602 | Delegated identity, voice, semantic-token ownership, and tenant-brand boundaries recorded in MASTER_DESIGN.md; no logo, palette values, or broader design-system authority is implied | Define approved wordmark/identity usage, voice, palette ownership, and tenant-brand boundary in the canonical design document; preserve the official canon and label concept art as illustrative until approved. |
| MW-0607 | Inventory and name design tokens | PHASE 5: Design Tokens; PILLAR 08 §8.5 | MW-0606 | Snapshot token saat ini sudah didokumentasikan, tetapi acceptance masih membutuhkan keputusan direction/palette dan token light theme, typography scale, spacing, elevation, radius, focus, serta status yang belum disetujui. Tidak ada nilai baru yang dipilih. | Publish semantic token names and values for light/dark themes, typography, spacing, elevation, borders/radii, focus, and status; verify every token has one canonical owner in `@moonwitness/ui`. |
| MW-0608 | Decide and specify the tenant and workspace model | PHASE 6: Tenant Model; PILLAR 08 §8.7; PILLAR 09 | — | Delegated single-installation scope recorded in product and security specifications; owner isolation, denied-by-default organization access, no tenant migration, and future negative-test gates are explicit | Record whether and how tenants exist, membership/ownership rules, isolation and sharing boundaries, identity/ACL effects, and migration implications; add cross-tenant negative tests to the acceptance plan. |
| MW-0609 | Set measurable performance and reliability targets | PHASE 6: Performance Requirements; PILLAR 10 §§10.8, 10.10 | — | Delegated decision recorded to defer numeric targets; remains blocked until critical journeys, rights-cleared workload, isolated measurement environment, observation windows, and release gates are approved | Owner-approved targets cover latency, throughput, corpus/search scale, availability, and recovery where applicable; each target names measurement method, environment, and release gate. |
| MW-0610 | Specify per-domain contracts and events/notifications | PILLAR 04 §4.4; R-46/R-48 | — | Draf matriks P0 §4.4 untuk 23 domain dan 20 atribut sudah dicatat; tetap blocked karena bukti/owner per-domain belum lengkap, kandidat owner belum diratifikasi, dan test coverage belum dibuktikan. Tidak ada domain/event implementation yang disetujui. | Select a single contract-depth policy; define the previously missing events/notifications contract, then map every required §4.4 attribute to its canonical owner and a test/evidence source. |
| MW-0611 | Resolve domains without estate-source material | PILLAR 04 §4.3; PILLAR 11 | MW-0610 | Blocked by MW-0610 and owner disposition: no scope, entities, or dependencies will be invented for the five domains | Owner disposition exists for `ql_creative`, `ql_journey`, `ql_org`, `ql_person`, and `ql_search`; in-scope domains have first-principles scope, entities, dependencies, and acceptance criteria rather than invented source data. |
| MW-0612 | Define task dependency and domain DoD rules | PHASE 7: Dependencies and Microtask breakdown; PILLAR 12 §12.4 | MW-0601 | Validated AI execution packets, 22 gated D30 feature slices, exact catalog links, and mini-UI visibility | Every new feature task has a validated execution packet with mode, bounded scope, non-goals, canonical source references, exact MWREQ IDs, touchpoints, checks, and stop conditions; packets render in TODO.md and the local tracker UI, and the AI skill explains safe execution. Split the MW-1001 inventory into 22 source-section tasks covering 365 exact MWREQ rows while retaining two cross-cutting rows on the parent; link every packet ID back to its catalog task and keep all new implementation tasks blocked on owner/product/release gates. The dependency graph remains acyclic; tracker, requirement inventory, and traceability gates pass. |
| MW-0613 | Define the GitHub label taxonomy | PHASE 7: Labels; PILLAR 12 §12.4 | MW-0612 | Proposed taxonomy documented; no GitHub labels created | Document a small label set for task ID, domain, type, priority, and status with definitions and usage rules; no label is created until owner approval. |
| MW-0614 | Map GitHub Issues, Projects, and Milestones to TODO goals | PHASE 7: Issues, Project, Milestones; PILLAR 12 §12.4 | MW-0612, MW-0613 | Issue/project/milestone mapping documented; no GitHub objects created | Define one-to-one issue/task linking, required issue fields, project fields, and milestone mapping; prepare the mapping without creating platform objects. |
| MW-0615 | Reconcile TODO phase numbering with the legacy phase catalog | PHASE 0–12; R-45 | MW-0612 | Delegated non-destructive D30 crosswalk added to TODO.template.md; existing headings and task IDs are unchanged, and Cloudflare MW-0500 is explicitly separate from PHASE 12 | The mapping selected under explicit owner delegation uses the D30 catalog's phase IDs; Cloudflare MW-0500 is explicitly cross-referenced without mislabeling it as catalog PHASE 12. |
| MW-0616 | Ratify a stable planning baseline and disposition prior work | PILLAR 12; acceptance I; R-42/R-49/R-52 | MW-0601, MW-0602, MW-0603, MW-0604, MW-0605, MW-0606, MW-0607, MW-0608, MW-0609, MW-0610, MW-0611, MW-0612, MW-0613, MW-0614, MW-0615 | Delegated choice is to defer exact-SHA ratification until dirty worktree changes are dispositioned; current HEAD is context only and the baseline audit remains incomplete | Owner records accept/amend decisions against an exact commit SHA, including already-landed work and its evidence; the release/implementation gate is explicit and reproducible. |
| MW-0617 | Create approved GitHub governance records | PHASE 7; PILLAR 12 §12.4 | MW-0613, MW-0614, MW-0616 | Blocked by ratification | Only after owner approval, create agreed labels, task-linked Issues, Project fields, and milestone records; verify each external record maps to exactly one TODO task and no duplicate scope exists. |
| MW-0618 | Retire the legacy master prompt after requirement migration | PILLAR 12 §12.1–12.2; D30 | MW-0601, MW-0612, MW-0616 | Done | All 1,891 source statements are preserved in D30 with one canonical document and task link; implementation status is triaged separately (369 GAP, 267 PARTIAL, 1,255 UNKNOWN; none UNVERIFIED), not certified; both catalog-backed gates and their prompt-free regression tests pass; no live authority or tooling reads the retired file. |

#### PHASE 8 — Single Application Foundation

| ID | Prompt item | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|
| MW-0801 | Repository foundation | MW-0616 | Blocked by ratification | Approved repository structure, scripts, and ownership rules are documented and verified by clean install and baseline checks. |
| MW-0802 | Unified Web/API bootstrap | MW-0801 | Blocked by ratification | One web and one API bootstrap start successfully; no duplicate application or identity authority is introduced. |
| MW-0803 | Routing | MW-0802 | Blocked by ratification | Approved routes resolve in the unified app, with role gates and localized route behavior tested. |
| MW-0804 | Application shell | MW-0803, MW-0606 | Blocked by ratification | One accessible shell supports required navigation, profile/context controls, and truthful loading/error/empty states. |
| MW-0805 | Design system | MW-0804, MW-0607 | Blocked by ratification | `@moonwitness/ui` owns reusable components and semantic tokens; required control states and theme variants pass component tests. |
| MW-0806 | I18N | MW-0803, MW-0607 | Catalog parity, locale persistence, metadata, and workspace copy verified | Indonesian and English catalogs have type-safe keys, parity tests, route persistence, and locale-aware formatting. |
| MW-0807 | Database | MW-0801, MW-0610 | Blocked by ratification | Addon models synchronize through QlOrm; no Drizzle schema or migration files; integrity and ownership tests pass. |
| MW-0808 | Authentication | MW-0802, MW-0807 | Blocked by ratification | Approved identity/session flow works end-to-end; session lifecycle and negative authentication tests pass. |
| MW-0809 | Authorization | MW-0808, MW-0608 | Blocked by ratification | Deny-by-default route/model ACL and owner/tenant isolation pass cross-owner and cross-tenant negative tests. |
| MW-0810 | Logging and error handling | MW-0802 | Blocked by ratification | Structured errors/logs are actionable, correlation-aware, and contain no secrets or private payloads in tests. |
| MW-0811 | API contracts | MW-0802, MW-0610 | Blocked by ratification | DTOs, paths, and SDK calls have one owner in `@moonwitness/moonclient`; contract tests cover success and invalid input. |
| MW-0812 | Tests | MW-0803, MW-0804, MW-0805, MW-0806, MW-0807, MW-0808, MW-0809, MW-0810, MW-0811 | Blocked by ratification | Relevant unit, addon, API, UI, accessibility, and negative security tests pass on a clean run. |
| MW-0813 | Docker | MW-0802, MW-0810 | Blocked by ratification | Clean build and container startup succeed from the documented compose/deployment path without undeclared local state. |
| MW-0814 | Health checks | MW-0813 | Blocked by ratification | Readiness/liveness behavior is documented and verified for healthy, starting, and unavailable dependencies. |

#### PHASE 9–10 — First Vertical Slice and Domain Expansion

| ID | Prompt item | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|
| MW-0901 | Source-to-publication lifecycle: select and identify an approved source/edition | MW-0814, MW-0605 | Blocked by ratification | Selected source and edition have recorded owner, rights basis, version, provenance, and stable identifiers. |
| MW-0902 | Source-to-publication lifecycle: validate rights and stage content | MW-0901 | Blocked by ratification | Import rejects or quarantines records without required rights/provenance; repeat import is idempotent and reports rejected rows. |
| MW-0903 | Source-to-publication lifecycle: create sourced claim and attach evidence | MW-0902, MW-0610 | Blocked by ratification | Claim, evidence, interpretation, and exact source text remain distinct and traceable; cross-owner/private-field tests pass. |
| MW-0904 | Source-to-publication lifecycle: human review and publication decision | MW-0903 | Blocked by ratification | Reviewer decisions capture actor, timestamp, reason, and state; unapproved or rights-incompatible records are not public. |
| MW-0905 | Source-to-publication lifecycle: end-to-end acceptance | MW-0904, MW-0812 | Blocked by ratification | The complete approved Horizon 1 journey passes in `id` and `en`, keyboard-accessibly, with auditable provenance and honest failure states. |
| MW-1001 | Expand only approved domains in dependency order | MW-0905, MW-0611, MW-0612, MW-1215, MW-1216, MW-1217, MW-1218, MW-1219, MW-1220, MW-1221, MW-1222, MW-1223, MW-1224, MW-1225, MW-1226, MW-1227, MW-1228, MW-1229, MW-1230, MW-1231, MW-1232, MW-1233, MW-1234, MW-1235, MW-1236 | Blocked by ratification | Every approved D30 feature section has its own source-linked child task; all child tasks follow the ratified domain graph and pass addon manifest/model/view/ACL/contract tests before integration. Parent gate closes only after every approved child outcome is implemented or explicitly deferred with owner evidence. |

##### PHASE 10 — D30 feature slices under the domain-expansion gate

These are source-section work packets, not newly approved product scope. Each packet preserves exact catalog links and stays blocked until its listed owner, first-slice, and task-governance prerequisites are satisfied.

| ID | Feature slice | D30 source | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
| MW-1215 | AI platform foundation | docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.1 AI Platform | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1216 | AI assistant capabilities | docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.2 AI Assistants | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1217 | Agent registry and policies | docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.3 Agent Registry | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1218 | Agent lifecycle | docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.4 Agent Lifecycle | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1219 | AI memory architecture | docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.5 Memory Architecture | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1220 | AI safety and bounded actions | docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.6 AI Safety | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1221 | AI evaluation and quality gates | docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.7 AI Evaluation | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1222 | Workflow engine and orchestration | docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md#7.8 Workflow Engine | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1223 | UNILEX ontology | docs/data/CANONICAL_DATA_DICTIONARY.md#5.3 UNILEX / Ontology | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1224 | Witness intelligence | docs/data/CANONICAL_DATA_DICTIONARY.md#5.4 Witness Intelligence | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1225 | STORY / MFTL | docs/data/CANONICAL_DATA_DICTIONARY.md#5.5 STORY / MFTL | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1226 | EVENT / LEGEND intelligence | docs/data/CANONICAL_DATA_DICTIONARY.md#5.6 EVENT / LEGEND | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1227 | PERSON / SUPERHERO intelligence | docs/data/CANONICAL_DATA_DICTIONARY.md#5.7 PERSON / SUPERHERO | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1228 | Evidence intelligence | docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.8 Evidence Intelligence | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1229 | Research intelligence | docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.9 Research Intelligence | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1230 | LAW / AWS | docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.10 LAW / AWS | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1231 | MIZAN assessment | docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.11 MIZAN / Assessment | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1232 | Relationship / CORRELATION | docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.12 Relationship / CORRELATION | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1233 | Character Bible | docs/creative/CHARACTER_BIBLE.md#6.1 Character Bible | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1234 | Character classifications | docs/creative/CHARACTER_BIBLE.md#6.2 Character Classifications | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1235 | Character usage and appearances | docs/creative/CHARACTER_BIBLE.md#6.4 Character Usage | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |
| MW-1236 | Creative studio | docs/product/PRODUCT_SPECIFICATION.md#6.5 Creative Studio | MW-0616, MW-0905, MW-0611, MW-0612 | Blocked pending owner ratification, first-slice acceptance, and domain/task governance gates | For every listed MWREQ ID, implement only the owner-approved scope in its canonical owner addon with applicable manifest/model/view/ACL/client-contract tests, or record an explicit approved deferral with evidence; all focused package and workspace gates pass. |

#### PHASE 11 — Integration and Hardening

| ID | Prompt item | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|
| MW-1101 | Verify domain boundaries | MW-1001 | Blocked by ratification | Ownership, dependency, and prohibited-write tests pass; no duplicate canonical owner or forbidden dependency remains. |
| MW-1102 | Verify API consistency | MW-0905, MW-1001 | Blocked by ratification | All routes and DTOs match shared moonclient contracts; contract tests pass for each shipped route. |
| MW-1103 | Verify database integrity | MW-0807, MW-1001 | Blocked by ratification | Constraints, QlOrm sync, referential integrity, isolation, and rollback tests pass on a clean database. |
| MW-1104 | Verify rights | MW-0905, MW-1001 | Blocked by ratification | Every displayed, indexed, exported, or published source has current rights and attribution evidence; denied rights fail closed. |
| MW-1105 | Verify security | MW-0809, MW-1001 | Blocked by ratification | Auth, ACL, ownership, private fields, secrets, input limits, and abuse cases pass documented negative tests. |
| MW-1106 | Verify UX | MW-0804, MW-0905 | Blocked by ratification | Primary journeys and all functional controls are verified at supported viewport sizes; no dead controls or misleading states. |
| MW-1107 | Verify I18N | MW-0806, MW-0905 | Blocked by ratification | Translation parity, long-string layout, date/number formatting, locale switching, and fallback tests pass. |
| MW-1108 | Verify accessibility | MW-0805, MW-0905 | Blocked by ratification | Keyboard, focus, labels, contrast, screen-reader semantics, and reduced-motion checks pass against the agreed standard. |
| MW-1109 | Verify performance | MW-0609, MW-0905, MW-1001 | Blocked by ratification | Benchmarks meet owner-approved targets and include reproducible environment, workload, and measured results. |
| MW-1110 | Verify backup | MW-0813, MW-0605 | Blocked by ratification | Backup completes for approved persistent data; integrity and retention evidence are recorded without exposing secrets. |
| MW-1111 | Verify restore | MW-1110 | Blocked by ratification | Restore is executed in an isolated environment and meets approved recovery-point/time targets with evidence. |
| MW-1112 | Verify Docker deployment | MW-0813, MW-1105 | Blocked by ratification | Clean deployment, health checks, configuration validation, and rollback are exercised using the documented container path. |
| MW-1113 | Verify failure recovery | MW-1111, MW-1112 | Blocked by ratification | Injected dependency and process failures recover or fail closed as specified; data integrity and user-visible errors are verified. |

#### PHASE 12 — Release and Continuous Improvement

| ID | Prompt item | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|
| MW-1201 | Merge to `dev` | MW-1101, MW-1102, MW-1103, MW-1104, MW-1105, MW-1106, MW-1107, MW-1108, MW-1109, MW-1110, MW-1111, MW-1112, MW-1113, MW-0616 | Blocked by release gates | Approved PR targets `dev`; required review and checks pass on the exact merge SHA. |
| MW-1202 | Verify integration | MW-1201 | Blocked by release gates | Integration suite, build, and acceptance evidence pass on the exact `dev` SHA. |
| MW-1203 | Promote to `main` | MW-1202 | Blocked by release gates | Only verified `dev` is promoted through the approved protected-branch process; resulting SHA is recorded. |
| MW-1204 | Generate version | MW-1203 | Blocked by release gates | Version follows the approved release policy and uniquely identifies the promoted source SHA. |
| MW-1205 | Update changelog | MW-1204 | Blocked by release gates | Changelog matches included work and links each shipped task/decision to evidence. |
| MW-1206 | Publish release | MW-1205 | Blocked by release gates | Release artifact/tag is published from the verified SHA and passes post-publish checks. |
| MW-1207 | Update documentation | MW-1206 | Blocked by release gates | User, API, architecture, and operations docs match the released behavior; no proposal is described as shipped. |
| MW-1208 | Begin the next approved milestone | MW-1207, MW-0614, MW-0617 | Blocked by release gates | Next milestone is owner-approved, has unique TODO task IDs, dependencies, acceptance evidence, and no duplicate GitHub issues. |

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
| MW-0571 | Governance ratification for UI centralisation (MW-ADR-020 + AGENTS.md + DOMAIN row + workstream rows) | Implemented; docs only | Owner | `docs/decisions/ADR_REGISTRY.md` carries MW-ADR-020; `AGENTS.md` §UI dan perubahan names the one-line `@import "@moonwitness/ui/preset.css"` rule and bans hardcoded Tailwind hex classes; `docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md` has a `@moonwitness/ui` row; `git diff --stat` shows only markdown files |
| MW-0572 | Split `packages/ui/styles.css` into tokens/base/components/preset and add Tailwind v4 `@theme` | Implemented; zero breaking change | Owner | `packages/ui/styles/{tokens,base,components,preset}.css` exist; legacy `--ql-ui-*` variables remain as `:root` aliases so no `.ql-*` rule renamed; `packages/ui/styles.css` becomes a three-`@import` aggregator; `packages/ui/package.json` exports map + sideEffects list every new stylesheet; `pnpm exec turbo run build --filter=@moonwitness/ui` and `pnpm --filter @moonwitness/web build` are both green; web First Load JS delta stays under 2 kB per route |
| MW-0573 | Collapse `apps/web/src/app/globals.css` to a single `@import` | Implemented; visual smoke check on `/` and `/corpus` | Owner | `apps/web/src/app/globals.css` is one line `@import "@moonwitness/ui/preset.css";`; body font Inter, dark colour scheme, `::selection`, and font-inherit on form elements come from `packages/ui/styles/base.css`; `pnpm --filter @moonwitness/web build` green |
| MW-0574 | Ship composite primitives in `packages/ui/src/composites/` with rendering tests | Implemented; 37 rendering/token tests green under `turbo run test` (row was reopened because none of them had existed) — 16 behaviour tests plus a table-driven `className`-override contract that asserts every composite keeps its design-system class (`ql-nav-link`, `ql-hud-brand`, `ql-sidebar-nav`, `ql-icon-tile`, `ql-metric-row`, `ql-list-option`, `ql-side-panel`, `ql-card`, `ql-hud-app`, `ql-eyebrow` path) and renders no hex or default-palette class | Owner | `NavLink`, `SidebarBrand`, `SidebarFooter`, `PageHeader`, `LoadingScreen`, `EmptyState`, `SectionGrid` exported from `@moonwitness/ui`; `next` added as peerDependency of `@moonwitness/ui` for `NavLink`; every composite is a Server Component (no `"use client"`); `packages/ui` has a `test` script executed by `turbo run test`; every composite has a test asserting the base `ql-*` class survives a `className` override and that rendered markup contains no hex value or Tailwind default-palette class |
| MW-0575 | Add UI-consistency ESLint overrides covering every web screen | Implemented; overrides fire and are proven against a probe file — the `size-limit` half of the original row never landed and is re-tracked as MW-0582 | Owner | `packages/eslint-config/index.js` adds override blocks scoped to `apps/web/src/features/**/*.tsx`: (a) `no-restricted-syntax` rejects raw `<button>`/`<input>`/`<textarea>`/`<select>`/`<style>` and internal `<a href="/...">`, (b) regex selector rejects Tailwind arbitrary hex values (`bg-[#0b110b]`), (c) inline `style={}` prop rejected — all at severity `warn`; `packages/eslint-config/package.json` adds any new plugin dependency; `apps/web/.size-limit.json` caps first-load JS at 150 kB; `.github/workflows/ci.yml` runs `pnpm --filter @moonwitness/web size` after `pnpm test`; `pnpm lint` still exits 0 |
| MW-0576 | Migrate `apps/web` screens to composite primitives and design tokens (14 sub-screens) | Complete — all 14 screens compose from `@moonwitness/ui`; the last hand-rolled metric `<dl>` on `/command-center` and the three hand-applied `ql-sidebar-nav` shells moved to `MetricList`/`MetricRow`/`OptionNav`; browser-verified at 1280px: 3 `.ql-metric-row` on `/` and `/command-center` with identical computed geometry (baseline, space-between, 16px padding, 18px tabular-nums value), 0 `div.flex.items-baseline.justify-between` leftovers, 0 elements carrying a hex/`stone-*`/`bg-white` class, localized `DataTable` labels, UI consistency and RTL contract verified | Owner | Every `apps/web/src/**/*.tsx` consumes `@moonwitness/ui` instead of re-implementing nav rows, brand marks, page headers, loading surfaces, empty states, card grids, icon tiles or editor panels; no `bg-[#...]`/`text-[#...]`/`border-[#...]`/`stone-*`/`bg-white` remains in web source; no raw `<button>`/`<input>`/`<textarea>`/`<select>`/`<a href="/...">` remains; `DataTable` receives `emptyMessage`/`actionsLabel`/`yesLabel`/`noLabel` from the i18n catalogue at every call site; `pnpm test` unchanged (only markup migrated, no DTO or ACL touched); `dir="rtl" lang="ar"` invariant preserved on `/corpus` Arabic edition (MW-ADR-019 regression lock) |
| MW-0577 | Flip UI-consistency ESLint overrides from `warn` to `error` | Implemented; every UI-consistency override is `error` and `pnpm lint` reports 0 errors | Owner | Precondition: `pnpm lint` reports 0 findings for the MW-0575 rules under `apps/web/src/**` (unrelated workspace warnings — `strict-boolean-expressions`, `max-lines`, `no-console` — are outside this gate and are not suppressed by it). Flip severity of every rule added in MW-0575 to `error`; adding a new arbitrary-hex class, a Tailwind default-palette class or a raw `<button>` in web now fails CI |
| MW-0578 | Update skill and package documentation (`.github/skills/moonwitness-development`, `packages/ui/README.md`) | Implemented; `moonwitness-development` skill has a UI Consistency Rules section pointing at MW-ADR-020 with the add-a-token procedure, `packages/ui/README.md` documents every layer with one example usage per primitive and composite (now including `OptionNav`) plus a table of the raw `.ql-*` class contracts a screen may still apply, AGENTS.md and the domain row list the shipped surface; `pnpm tracker:check` green | Owner | `moonwitness-development` skill has a UI Consistency Rules section pointing at MW-ADR-020 with instructions on adding a new token; `packages/ui/README.md` documents every primitive and composite with an example usage; `pnpm tracker:check` green |
| MW-0579 | Complete the design-token vocabulary and make Tailwind scanning deterministic | Implemented; tokens verified in the built stylesheet | Owner | `packages/ui/styles/tokens.css` declares `--color-ink-soft`, `--color-muted-dim`, `--color-hairline-soft`, `--color-panel-well`, `--color-void`, `--color-acid-shadow` and the `--shadow-hud`/`--shadow-hud-sm` box-shadow tokens inside the existing `@theme` block, leaving the legacy `--ql-ui-*` aliases intact; `packages/ui/styles/preset.css` declares `@source "../src"`; after `pnpm --filter @moonwitness/web build` the emitted stylesheet contains a utility that only ever appears inside `packages/ui/src`; `pnpm lint` reports 0 hex or default-palette findings under `apps/web/src/**` |
| MW-0580 | Ship SidebarNav, IconTile, MetricRow, ListOption, SidePanel and WorkspaceSidebar composites | Implemented; exported from `@moonwitness/ui` and consumed by apps/web screens, plus `OptionNav` for the sidebar lists whose rows are selectable options (model picker, DNS zones, chat history) so no screen writes `className="ql-sidebar-nav"` any more; `PageHeader`'s eyebrow now renders the shared `.ql-eyebrow` rule instead of a utility copy (measured in the browser: 0.65rem/650/uppercase, the same rule `SidePanel` uses) | Owner | Each composite lives under `packages/ui/src/composites/`, is exported from `@moonwitness/ui`, carries no `"use client"`, takes all copy through props, and colours come only from design tokens or a `.ql-*` rule; `SidePanel` replaces the screen-scoped `.ql-model-editor` usage through a grouped selector so no `.ql-*` rule is renamed (MW-0572 invariant); `WorkspaceSidebar` owns the brand row, nav list and identity footer that every workspace re-assembled by hand |
| MW-0581 | Convert the three light-theme screens to the dark HUD surface vocabulary | Verified in a browser on 2026-11-01 against a local build and re-verified on the post-refactor production build at 1280px: /providers, /admin/users and /admin/translations compute to rgb(17,23,19) panels with 1px rgb(56,68,58) hairlines and border-radius 0, zero elements with a near-white background (scripted scan of every node), the 500 catalogue rows all resolve to radius 0 with rgb(18,26,19) on selection, the auth input focus shows the lime inset bar rgb(215,255,99) 3px 0 0 inset with rgb(158,189,66) border, and /models with the API stopped renders the shared dark auth card plus a `ql-alert--error` surface; screenshots in the run record | Owner | `providers`, `admin/users` and `admin/translations` render with `Card`/`Select`/`Button`/`Badge` and `bg-panel`/`text-ink`/`border-hairline` instead of `bg-white`/`text-stone-950`/`border-stone-200`; no default-palette class remains in those files; a rendered before/after screenshot of each of the three routes is recorded as evidence in this task |
| MW-0582 | Measure and lock per-route First Load JS with a workspace-local budget check | Implemented; 16 routes baselined at 101–143 kB against the 150 kB ceiling, check passes and gates CI | Owner | `apps/web/scripts/check-bundle-budget.mjs` reads `apps/web/.next/app-build-manifest.json`, sums gzipped `initial` chunks per route, fails above a 150 kB first-load ceiling or a 2 kB per-route delta against the `apps/web/.size-budget.json` baseline, and rewrites that baseline with `--update`; `pnpm --filter @moonwitness/web size` runs it; `.github/workflows/ci.yml` runs that command after `pnpm test`; MW-ADR-020 is amended to name this check instead of `size-limit`, with the reason recorded |
| MW-0583 | Remove design-system CSS that reached into `apps/web` markup | Implemented; 74 lines of app-coupled rules deleted, then the 8 legacy names left behind (`.ql-model-workspace`, `.ql-model-heading`, `.ql-model-table-content`, `.ql-model-editor`, `.ql-model-editor__header`, `.ql-model-editor__form`, `.ql-model-checkbox`, `.ql-page-heading`) removed once a source scan proved no reference; the production CSS build now contains 0 occurrences of `ql-model-`/`ql-page-heading` | Owner | `packages/ui/styles/components.css` contains no rule that selects a Tailwind default-palette class (`text-stone-*`, `border-stone-200`, `bg-white`, `bg-emerald-500`) or an `aria-label` string owned by a screen, and keeps no `!important` whose only purpose was to beat app-side utilities; every deleted selector is proven dead by a source scan of `apps/web/src/**/*.tsx`; `.ql-hud-brand` reads a token instead of a hardcoded hex; `pnpm exec turbo run build` stays green |

### Developer tooling — canonical project task tracker

| ID | Goal | Master-prompt mapping | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
| MW-1209 | Add mandatory task-tracker workflow and a local status editor | D26 — Master TODO with Microtasks | — | Implemented; focused tests and browser verification pass | A mandatory repository skill maps every coding task to the canonical register; a Python stdlib localhost-only UI safely edits task state, preserves custom status labels, records known completion times, and regenerates TODO.md; focused tests and tracker gates pass. |
| MW-1210 | Automate CI-gated promotion and release from dev | D30 — CI/CD and release governance | — | CI-gated promotion, protected release PR, tag/release, and main-to-dev sync verified end to end | Direct pushes to dev run CI without a required-check bypass warning; only a successful CI run for the latest green dev SHA can promote through a protected PR to main; the exact candidate is validated before auto-merge; a unique patch tag and GitHub Release are published from the merged main SHA; failed or stale runs do not promote or release; manual dry-run remains available; main still requires a PR and validate; focused workflow and tracker checks pass. |
| MW-1212 | Harden workspace i18n metadata coverage | MW-0806 | Blocked: addon metadata key parity and anonymous locale/error fallback checks pass; locale controls meet 44px at 375/768/1280px with no overflow and locale persists on reload. Authenticated workspace locale flows still need a safe non-production account/session. | All supported web UI copy and dynamic addon/API metadata translation keys are audited; missing id/en keys fail focused tests in CI; source/domain text remains unchanged; locale switch, fallback, long-copy, loading/error/empty states, and desktop/mobile rendering are verified for id and en; relevant build, lint, typecheck, test, and tracker gates pass. This does not close MW-1107 while MW-0905 remains blocked. |
| MW-1213 | Add declarative compute fields and corpus discovery models | — | Feature complete; focused checks pass; full build blocked by existing @moonwitness/ui module resolution | QlOrm supports typed declarative virtual computed fields that are validated, read-only, excluded from DB schema, and safe across public/private read paths; addons can expose ACL-gated bounded read-only computed models across source models through shared Moonclient contracts; an approved small fixture pilot returns Asmaulhusna lexical candidates with source verse provenance, algorithm version, confidence, and human-review status without presenting machine output as verified religious conclusions; focused tests and relevant workspace/tracker gates pass. |
| MW-1214 | Add auditable human review for lexical research | MW-1213 | Implemented and verified exploratory lexical semantics and auditable human review workflow | The lexical computed model is explicitly described as exploratory token frequency and exposes no unmeasured confidence score; ql_research provides append-only human assessments tied to reproducible edition/source/checksum and algorithm/normalization provenance, with reviewer authorization and immutable actor/time; API contracts and UI use shared Moonclient and moonClient; no assessment writes corpus text or treats model output as verified religious conclusions; tests cover source snapshot validation, unauthorized/cross-user access, privacy, rights, read-only compute, normalization fixture behavior, and query bounds; relevant build/lint/typecheck/test and task-tracker checks pass, with unrelated pre-existing UI build issues reported separately. |
| MW-1237 | Expose the local task-tracker UI through pnpm | D26 — Master TODO with Microtasks | — | pnpm tracker:ui starts the localhost-only server on demand; HTTP smoke test passed and the server was stopped | The root package exposes `pnpm tracker:ui` to run the existing localhost-only Python server on demand; it does not start automatically; the command is verified to serve the tracker UI and remains stoppable with Ctrl+C; tracker checks pass. |
| MW-1239 | Recording delegated decision authority and safe owner choices | Explicit owner-delegated decision workflow | — | Delegated choices and workflow guidance are documented; exact-SHA ratification and account-gated verification remain separate blockers. | Record only evidence-backed, reversible delegated choices for MW-0605, MW-0606, MW-0608, MW-0610, and MW-0615 in their canonical documents; keep MW-0609 and MW-0616 blocked where targets or clean-baseline ratification cannot be supplied; update root and agent workflow instructions so explicit owner delegation can authorize bounded decisions without overriding rights, direct-evidence, manual-verification, or release gates; synchronize tracker and generated TODO; run tracker and focused documentation gates. |
| MW-1240 | Migrate canonical task and documentation sources to GitHub | GitHub Issues and Wiki canonical-source migration | — | Inventarisasi migrasi task, dokumentasi, tautan, dan dependensi dimulai; belum membuat Issue/Wiki atau menghapus sumber lokal. | Migrate every pre-existing task ID to exactly one GitHub Issue while preserving status, dependencies, scope, acceptance criteria, evidence, and execution constraints; migrate all human-authored non-code project documentation to GitHub Wiki and repair its references; update local agent bootstrap, CI, audit tooling, and all repository references; remove local task-tracker JSON, generated TODO/template, tracker-only UI/server/tests, and migrated non-code docs only after their remote canonical replacements and consumers are verified. Preserve necessary code/build/test assets and unrelated dirty worktree changes. Use no GitHub Project. |
| **Prompt PHASE 8** | Partial foundation exists in-workspace; all 14 foundation outcomes are separate blocked tasks pending ratification and implementation audit |
| **Prompt PHASE 9** | First source-to-publication slice is not verified; five lifecycle goals are defined and blocked on rights, product decisions, and foundation gates |
| **Prompt PHASE 10** | MW-1001 is decomposed into 22 source-section child tasks covering 365 exact MWREQ rows; two cross-cutting rows stay on the parent. Every child remains blocked on owner/product/release gates and must pass addon-specific DoD |
| **Prompt PHASE 11** | Integration/hardening evidence is not complete; all 13 verification outcomes are separately tracked and blocked |
| **Prompt PHASE 12** | Historical `v0.1.0` exists, but current release gates are not evidenced; all eight release steps are separately tracked and blocked |
| **MW-0500 workstream** | MW-0501–MW-0507 code is present and addon/HTTP suites were previously reported green; browser verification and latest commit CI status remain unverified |

### Developer tooling — local development infrastructure

| ID | Goal | Master-prompt mapping | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
| MW-1211 | Configure local development for PostgreSQL | D30 — Infrastructure and runtime environments | — | Compose and host PostgreSQL verified; QlOrm PostgreSQL tests pass | A gitignored root .env configures the host API for the local Compose PostgreSQL service; the API container uses the service DNS name and internal port; Compose configuration and database readiness are verified; the Coolify stack remains unchanged. |

### Addon platform — default data and reference catalogs

| ID | Goal | Status | Owner | Acceptance criterion |
|---|---|---|---|---|
| MW-1238 | Standardize addon default data and add country reference data | Default data standard and ql_geo res.country verified; workspace lint passes with existing warnings, build, typecheck, tests, and tracker gates pass | Owner | Every ql_* addon manifest explicitly declares default data; a shared QlOrm runner validates and applies it after schema sync in dependency order with stable external IDs and per-record insert-only/reconcile policy; existing ql_auth and ql_i18n defaults use the shared mechanism; ql_geo provides res.country for all ISO 3166-1 alpha-2 countries with English names; empty seed lists are allowed only where no safe, legitimate system/reference data exists; no synthetic user-owned or unlicensed corpus/source records are introduced; focused tests, documentation, workspace quality gates, and task-tracker checks pass. |

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

## AI execution packets

<details>
<summary><code>MW-0558</code> — Manual browser click-through evidence (member submit → admin approve → PATCH bypass refused)</summary>

**Mode:** `manual_verification`

**Scope:** On an isolated local environment, verify member submission, admin approval, the resulting UI state, and refusal of a direct unauthorized PATCH; record the exact commit and reproducible evidence.

**Non-goals**

- Do not use production accounts, production data, or live approval records.
- Do not change workflow semantics or mark the task done without human browser evidence.

**Canonical references**

- docs/governance/REQUIREMENTS_TRACEABILITY.md#approval workflow

**Likely touchpoints**

- Local workflow UI and API only
- Existing ql_workflow tests and manual browser evidence

**Checks**

- Run the existing workflow-focused tests before browser verification.
- Capture the member-submit and admin-approve sequence plus the refused PATCH on the same local build.

**Stop conditions**

- Stop if a separate local test environment and non-production test accounts are unavailable.
- Stop if a request would reach a production service.

</details>

<details>
<summary><code>MW-0602</code> — Reconcile product identity references to the official canon</summary>

**Mode:** `autonomous`

**Scope:** Audit identity references against the ratified official canon and correct only unambiguous contradictions; preserve historic/source citations and report conflicts instead of rewriting canon.

**Non-goals**

- Do not redefine product identity, brand voice, or religious authority.
- Do not generate or approve new visual-brand assets.

**Canonical references**

- docs/vision/ALLAH_COM_OFFICIAL_CANON.md#official identity
- docs/governance/REQUIREMENTS_TRACEABILITY.md#PILLAR 01

**Likely touchpoints**

- Canonical vision and brand documents named by the audit
- docs/governance/REQUIREMENTS_TRACEABILITY.md

**Checks**

- python -B docs/audit/tools/requirement_coverage_gate.py
- pnpm tracker:check

**Stop conditions**

- Stop and record evidence if a reference conflicts with the official canon in a way that needs an owner decision.
- Do not alter official canon text without explicit owner approval.

**Requirement IDs:** `MWREQ-00015`, `MWREQ-00016`, `MWREQ-00017`, `MWREQ-00018`, `MWREQ-00019`, `MWREQ-00020`, `MWREQ-00021`, `MWREQ-00022`, `MWREQ-00023`, `MWREQ-00024`, `MWREQ-00025`, `MWREQ-00026`, `MWREQ-00027`, `MWREQ-00028`, `MWREQ-00029`, `MWREQ-00030`, `MWREQ-00031`, `MWREQ-00032`

</details>

<details>
<summary><code>MW-0603</code> — Complete repository and GitHub permission inventory</summary>

**Mode:** `autonomous`

**Scope:** Record repository/account/org/team access that can be verified through authorized read-only evidence; label inaccessible scopes UNKNOWN and include observation time and evidence source.

**Non-goals**

- Do not change GitHub permissions, branch rules, secrets, or organization settings.
- Do not infer access from repository visibility or a successful unrelated API call.

**Canonical references**

- docs/governance/GITHUB_GOVERNANCE.md#verified access
- docs/audit/REPOSITORY_CAPABILITY_MATRIX.md#repository access

**Likely touchpoints**

- docs/governance/GITHUB_GOVERNANCE.md
- Read-only GitHub CLI/API evidence only

**Checks**

- python -B docs/audit/tools/requirement_coverage_gate.py
- pnpm tracker:check

**Stop conditions**

- If a scope is unavailable, record UNKNOWN with the failed/unsupported read and stop; do not request or grant broader access.
- Stop before any write-capable GitHub operation.

**Requirement IDs:** `MWREQ-00084`, `MWREQ-00085`, `MWREQ-00086`, `MWREQ-00087`, `MWREQ-00088`, `MWREQ-00089`, `MWREQ-00090`, `MWREQ-00091`, `MWREQ-00092`, `MWREQ-00093`, `MWREQ-00094`, `MWREQ-00095`, `MWREQ-00096`, `MWREQ-00097`, `MWREQ-00098`, `MWREQ-00099`, `MWREQ-00100`, `MWREQ-00101`, `MWREQ-00102`, `MWREQ-00103`, `MWREQ-00104`, `MWREQ-00105`, `MWREQ-00106`, `MWREQ-00107`, `MWREQ-00108`, `MWREQ-00109`, `MWREQ-00110`, `MWREQ-00111`, `MWREQ-00112`, `MWREQ-00113`, `MWREQ-00114`, `MWREQ-00115`, `MWREQ-00116`, `MWREQ-00117`, `MWREQ-00118`, `MWREQ-00119`, `MWREQ-00120`, `MWREQ-00121`, `MWREQ-00122`, `MWREQ-00123`, `MWREQ-00124`, `MWREQ-00125`, `MWREQ-00126`, `MWREQ-00127`, `MWREQ-00128`, `MWREQ-00129`, `MWREQ-00130`, `MWREQ-00131`, `MWREQ-00132`, `MWREQ-00133`, `MWREQ-00134`

</details>

<details>
<summary><code>MW-0604</code> — Specify search and indexing boundaries</summary>

**Mode:** `decision_prep`

**Scope:** Prepare a bounded search/indexing proposal covering source-of-truth ownership, update/delete lifecycle, access filtering, rights/private-field exclusions, query API, and failure behavior; cite the exact D30 requirement IDs.

**Non-goals**

- Do not create a search addon, index, endpoint, or database schema.
- Do not select a provider or approve scope on the owner&#x27;s behalf.

**Canonical references**

- docs/governance/REQUIREMENTS_TRACEABILITY.md#PILLAR 10 section 10.4
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#domain owners

**Likely touchpoints**

- docs/governance/REQUIREMENTS_TRACEABILITY.md
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md
- Search architecture specification if later approved

**Checks**

- python -B docs/audit/tools/requirement_coverage_gate.py
- pnpm tracker:check

**Stop conditions**

- Stop at a clearly labeled owner decision; do not implement search or treat the proposal as ratified.
- Stop if rights or private-field boundaries cannot be supported by canonical policy.

**Requirement IDs:** `MWREQ-01168`, `MWREQ-01169`, `MWREQ-01170`, `MWREQ-01171`, `MWREQ-01172`, `MWREQ-01173`, `MWREQ-01174`, `MWREQ-01175`, `MWREQ-01176`, `MWREQ-01177`, `MWREQ-01178`, `MWREQ-01179`, `MWREQ-01180`, `MWREQ-01181`, `MWREQ-01182`, `MWREQ-01183`, `MWREQ-01184`

</details>

<details>
<summary><code>MW-0605</code> — Decide storage scope and write its security contract</summary>

**Mode:** `decision_prep`

**Scope:** Prepare an owner decision brief for whether object/external storage is in scope, including the conditional security, ownership, retention, rights, limits, and recovery requirements.

**Non-goals**

- Do not add storage providers, credentials, buckets, or media upload code.
- Do not claim rights or retention choices that have not been approved.

**Canonical references**

- docs/operations/INFRASTRUCTURE_AND_DEPLOYMENT_BLUEPRINT.md#storage
- docs/security/SECURITY_AND_PRIVACY_BLUEPRINT.md#data protection

**Likely touchpoints**

- docs/operations/INFRASTRUCTURE_AND_DEPLOYMENT_BLUEPRINT.md
- docs/security/SECURITY_AND_PRIVACY_BLUEPRINT.md

**Checks**

- python -B docs/audit/tools/requirement_coverage_gate.py
- pnpm tracker:check

**Stop conditions**

- Stop before selecting a storage service or changing data flows.
- Stop if content rights, retention, or deletion policy needs an owner decision.

**Requirement IDs:** `MWREQ-01185`, `MWREQ-01186`, `MWREQ-01187`, `MWREQ-01188`, `MWREQ-01189`, `MWREQ-01190`, `MWREQ-01191`, `MWREQ-01192`, `MWREQ-01193`, `MWREQ-01194`, `MWREQ-01195`, `MWREQ-01196`, `MWREQ-01197`, `MWREQ-01198`, `MWREQ-01199`, `MWREQ-01200`, `MWREQ-01201`, `MWREQ-01202`, `MWREQ-01203`, `MWREQ-01204`, `MWREQ-01205`

</details>

<details>
<summary><code>MW-0608</code> — Decide and specify the tenant and workspace model</summary>

**Mode:** `decision_prep`

**Scope:** Prepare a tenant/workspace decision brief describing membership, ownership, isolation, sharing, identity/ACL impact, and migration implications from canonical requirements.

**Non-goals**

- Do not add tenant tables, workspace APIs, or cross-tenant sharing behavior.
- Do not assume the product is single-tenant or multi-tenant without approval.

**Canonical references**

- docs/governance/REQUIREMENTS_TRACEABILITY.md#PILLAR 08 section 8.7
- docs/security/SECURITY_AND_PRIVACY_BLUEPRINT.md#identity and isolation

**Likely touchpoints**

- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md
- docs/security/SECURITY_AND_PRIVACY_BLUEPRINT.md
- docs/data/CANONICAL_DATA_DICTIONARY.md

**Checks**

- python -B docs/audit/tools/requirement_coverage_gate.py
- pnpm tracker:check

**Stop conditions**

- Stop before schema or ACL changes until the owner selects and ratifies a model.
- Stop if an option cannot state how cross-user and cross-tenant access is denied or granted.

**Requirement IDs:** `MWREQ-00981`, `MWREQ-00982`, `MWREQ-00983`, `MWREQ-00984`, `MWREQ-00985`, `MWREQ-00986`, `MWREQ-00987`, `MWREQ-00988`, `MWREQ-00989`, `MWREQ-00990`, `MWREQ-00991`, `MWREQ-00992`, `MWREQ-00993`, `MWREQ-00994`, `MWREQ-00995`, `MWREQ-00996`, `MWREQ-00997`, `MWREQ-00998`, `MWREQ-00999`, `MWREQ-01000`, `MWREQ-01001`

</details>

<details>
<summary><code>MW-0609</code> — Set measurable performance and reliability targets</summary>

**Mode:** `decision_prep`

**Scope:** Prepare measurable performance and reliability target options with a metric, workload, environment, measurement method, and proposed release gate for each target.

**Non-goals**

- Do not invent an SLA or claim a benchmark has passed.
- Do not run load tests against production or an unapproved external service.

**Canonical references**

- docs/product/PRODUCT_SPECIFICATION.md#non-functional requirements
- docs/operations/INFRASTRUCTURE_AND_DEPLOYMENT_BLUEPRINT.md#reliability and performance

**Likely touchpoints**

- docs/product/PRODUCT_SPECIFICATION.md
- docs/operations/INFRASTRUCTURE_AND_DEPLOYMENT_BLUEPRINT.md

**Checks**

- python -B docs/audit/tools/requirement_coverage_gate.py
- pnpm tracker:check

**Stop conditions**

- Stop before setting targets as binding until the owner approves them.
- Stop if a metric cannot be measured reproducibly with the stated environment and workload.

**Requirement IDs:** `MWREQ-01234`, `MWREQ-01235`, `MWREQ-01236`, `MWREQ-01237`, `MWREQ-01238`, `MWREQ-01239`, `MWREQ-01240`, `MWREQ-01241`, `MWREQ-01242`, `MWREQ-01243`, `MWREQ-01244`, `MWREQ-01245`, `MWREQ-01246`, `MWREQ-01247`, `MWREQ-01292`, `MWREQ-01293`, `MWREQ-01294`, `MWREQ-01295`, `MWREQ-01296`, `MWREQ-01297`, `MWREQ-01298`, `MWREQ-01299`, `MWREQ-01300`, `MWREQ-01301`, `MWREQ-01302`, `MWREQ-01303`, `MWREQ-01304`, `MWREQ-01305`, `MWREQ-01306`, `MWREQ-01307`, `MWREQ-01308`, `MWREQ-01309`, `MWREQ-01310`, `MWREQ-01311`

</details>

<details>
<summary><code>MW-0610</code> — Specify per-domain contracts and events/notifications</summary>

**Mode:** `decision_prep`

**Scope:** Draft a domain-contract matrix mapping all 20 section 4.4 attributes to canonical owners, tests, and evidence; include options for events/notifications and per-domain versus shared defaults.

**Non-goals**

- Do not create new domain addons or events.
- Do not choose a contract-depth policy on the owner&#x27;s behalf.

**Canonical references**

- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#domain contract
- docs/governance/REQUIREMENTS_TRACEABILITY.md#PILLAR 04 section 4.4

**Likely touchpoints**

- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md
- docs/governance/REQUIREMENTS_TRACEABILITY.md

**Checks**

- python -B docs/audit/tools/requirement_coverage_gate.py
- pnpm tracker:check

**Stop conditions**

- Stop at the documented owner choice; do not mark unresolved contract requirements as accepted.
- Stop if an attribute has no evidence-backed owner or test boundary.

**Requirement IDs:** `MWREQ-00421`, `MWREQ-00422`, `MWREQ-00423`, `MWREQ-00424`, `MWREQ-00425`, `MWREQ-00426`, `MWREQ-00427`, `MWREQ-00428`, `MWREQ-00429`, `MWREQ-00430`, `MWREQ-00431`, `MWREQ-00432`, `MWREQ-00433`, `MWREQ-00434`, `MWREQ-00435`, `MWREQ-00436`, `MWREQ-00437`, `MWREQ-00438`, `MWREQ-00439`, `MWREQ-00440`, `MWREQ-00441`

</details>

<details>
<summary><code>MW-0612</code> — Define task dependency and domain DoD rules</summary>

**Mode:** `autonomous`

**Scope:** Define and validate structured task execution packets, then split the D30 requirements currently aggregated under MW-1001 into traceable, bounded child tasks without implementing product features.

**Non-goals**

- Do not invent product scope or change canonical requirement statements.
- Do not create GitHub Issues, Projects, Milestones, commits, or releases.
- Do not unblock feature implementation that still requires owner ratification, rights approval, or release gates.

**Canonical references**

- docs/governance/REQUIREMENTS_TRACEABILITY.md#PHASE 7
- docs/governance/requirement-catalog.json#MW-1001
- docs/governance/AI_EXECUTION_CONTRACT.md

**Likely touchpoints**

- docs/governance/task-tracker.json
- docs/governance/TODO.template.md
- docs/audit/tools/task_tracker.py
- docs/audit/tools/test_task_tracker.py
- .github/skills/github-issues/SKILL.md

**Checks**

- pnpm tracker:check
- pnpm tracker:test
- python -B docs/audit/tools/requirement_coverage_gate.py

**Stop conditions**

- Stop before changing or implementing a requirement whose source is missing, contradictory, rights-restricted, or awaits an owner decision.
- Stop if a proposed dependency would create a cycle or if an existing task already owns the same outcome.

</details>

<details>
<summary><code>MW-1215</code> — AI platform foundation</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.1 AI Platform after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.1 AI Platform
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00763`, `MWREQ-00764`, `MWREQ-00765`, `MWREQ-00766`, `MWREQ-00767`, `MWREQ-00768`, `MWREQ-00769`, `MWREQ-00770`, `MWREQ-00771`, `MWREQ-00772`, `MWREQ-00773`, `MWREQ-00774`, `MWREQ-00775`, `MWREQ-00776`, `MWREQ-00777`, `MWREQ-00778`, `MWREQ-00779`

</details>

<details>
<summary><code>MW-1216</code> — AI assistant capabilities</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.2 AI Assistants after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.2 AI Assistants
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00780`, `MWREQ-00781`, `MWREQ-00782`, `MWREQ-00783`, `MWREQ-00784`, `MWREQ-00785`, `MWREQ-00786`, `MWREQ-00787`, `MWREQ-00788`, `MWREQ-00789`, `MWREQ-00790`, `MWREQ-00791`, `MWREQ-00792`

</details>

<details>
<summary><code>MW-1217</code> — Agent registry and policies</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.3 Agent Registry after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.3 Agent Registry
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00793`, `MWREQ-00794`, `MWREQ-00795`, `MWREQ-00796`, `MWREQ-00797`, `MWREQ-00798`, `MWREQ-00799`, `MWREQ-00800`, `MWREQ-00801`, `MWREQ-00802`, `MWREQ-00803`, `MWREQ-00804`, `MWREQ-00805`, `MWREQ-00806`, `MWREQ-00807`, `MWREQ-00808`, `MWREQ-00809`, `MWREQ-00810`

</details>

<details>
<summary><code>MW-1218</code> — Agent lifecycle</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.4 Agent Lifecycle after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.4 Agent Lifecycle
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00811`

</details>

<details>
<summary><code>MW-1219</code> — AI memory architecture</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.5 Memory Architecture after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.5 Memory Architecture
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00812`, `MWREQ-00813`, `MWREQ-00814`, `MWREQ-00815`, `MWREQ-00816`, `MWREQ-00817`, `MWREQ-00818`, `MWREQ-00819`, `MWREQ-00820`, `MWREQ-00821`, `MWREQ-00822`, `MWREQ-00823`, `MWREQ-00824`, `MWREQ-00825`, `MWREQ-00826`, `MWREQ-00827`, `MWREQ-00828`, `MWREQ-00829`

</details>

<details>
<summary><code>MW-1220</code> — AI safety and bounded actions</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.6 AI Safety after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.6 AI Safety
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00830`, `MWREQ-00831`, `MWREQ-00832`, `MWREQ-00833`, `MWREQ-00834`, `MWREQ-00835`, `MWREQ-00836`, `MWREQ-00837`, `MWREQ-00838`, `MWREQ-00839`, `MWREQ-00840`, `MWREQ-00841`, `MWREQ-00842`, `MWREQ-00843`, `MWREQ-00844`, `MWREQ-00845`, `MWREQ-00846`, `MWREQ-00847`

</details>

<details>
<summary><code>MW-1221</code> — AI evaluation and quality gates</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.7 AI Evaluation after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md#7.7 AI Evaluation
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/ai/AI_AND_AGENT_ARCHITECTURE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00848`, `MWREQ-00849`, `MWREQ-00850`, `MWREQ-00851`, `MWREQ-00852`, `MWREQ-00853`, `MWREQ-00854`, `MWREQ-00855`, `MWREQ-00856`, `MWREQ-00857`, `MWREQ-00858`, `MWREQ-00859`, `MWREQ-00860`, `MWREQ-00861`, `MWREQ-00862`, `MWREQ-00863`, `MWREQ-00864`, `MWREQ-00865`, `MWREQ-00866`

</details>

<details>
<summary><code>MW-1222</code> — Workflow engine and orchestration</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md#7.8 Workflow Engine after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md#7.8 Workflow Engine
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00867`, `MWREQ-00868`, `MWREQ-00869`, `MWREQ-00870`, `MWREQ-00871`, `MWREQ-00872`, `MWREQ-00873`, `MWREQ-00874`, `MWREQ-00875`, `MWREQ-00876`, `MWREQ-00877`, `MWREQ-00878`, `MWREQ-00879`, `MWREQ-00880`, `MWREQ-00881`, `MWREQ-00882`, `MWREQ-00883`, `MWREQ-00884`, `MWREQ-00885`, `MWREQ-00886`

</details>

<details>
<summary><code>MW-1223</code> — UNILEX ontology</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/data/CANONICAL_DATA_DICTIONARY.md#5.3 UNILEX / Ontology after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/data/CANONICAL_DATA_DICTIONARY.md#5.3 UNILEX / Ontology
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/data/CANONICAL_DATA_DICTIONARY.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00510`, `MWREQ-00511`, `MWREQ-00512`, `MWREQ-00513`, `MWREQ-00514`, `MWREQ-00515`, `MWREQ-00516`, `MWREQ-00517`, `MWREQ-00518`, `MWREQ-00519`, `MWREQ-00520`, `MWREQ-00521`, `MWREQ-00522`, `MWREQ-00523`, `MWREQ-00524`, `MWREQ-00525`, `MWREQ-00526`

</details>

<details>
<summary><code>MW-1224</code> — Witness intelligence</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/data/CANONICAL_DATA_DICTIONARY.md#5.4 Witness Intelligence after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/data/CANONICAL_DATA_DICTIONARY.md#5.4 Witness Intelligence
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/data/CANONICAL_DATA_DICTIONARY.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00527`, `MWREQ-00528`, `MWREQ-00529`, `MWREQ-00530`, `MWREQ-00531`, `MWREQ-00532`, `MWREQ-00533`, `MWREQ-00534`, `MWREQ-00535`, `MWREQ-00536`, `MWREQ-00537`, `MWREQ-00538`, `MWREQ-00539`, `MWREQ-00540`, `MWREQ-00541`, `MWREQ-00542`, `MWREQ-00543`

</details>

<details>
<summary><code>MW-1225</code> — STORY / MFTL</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/data/CANONICAL_DATA_DICTIONARY.md#5.5 STORY / MFTL after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/data/CANONICAL_DATA_DICTIONARY.md#5.5 STORY / MFTL
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/data/CANONICAL_DATA_DICTIONARY.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00544`, `MWREQ-00545`, `MWREQ-00546`, `MWREQ-00547`, `MWREQ-00548`, `MWREQ-00549`, `MWREQ-00550`, `MWREQ-00551`, `MWREQ-00552`, `MWREQ-00553`, `MWREQ-00554`, `MWREQ-00555`, `MWREQ-00556`, `MWREQ-00557`, `MWREQ-00558`, `MWREQ-00559`, `MWREQ-00560`, `MWREQ-00561`, `MWREQ-00562`

</details>

<details>
<summary><code>MW-1226</code> — EVENT / LEGEND intelligence</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/data/CANONICAL_DATA_DICTIONARY.md#5.6 EVENT / LEGEND after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/data/CANONICAL_DATA_DICTIONARY.md#5.6 EVENT / LEGEND
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/data/CANONICAL_DATA_DICTIONARY.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00563`, `MWREQ-00564`, `MWREQ-00565`, `MWREQ-00566`, `MWREQ-00567`, `MWREQ-00568`, `MWREQ-00569`, `MWREQ-00570`, `MWREQ-00571`, `MWREQ-00572`, `MWREQ-00573`, `MWREQ-00574`, `MWREQ-00575`, `MWREQ-00576`, `MWREQ-00577`, `MWREQ-00578`

</details>

<details>
<summary><code>MW-1227</code> — PERSON / SUPERHERO intelligence</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/data/CANONICAL_DATA_DICTIONARY.md#5.7 PERSON / SUPERHERO after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/data/CANONICAL_DATA_DICTIONARY.md#5.7 PERSON / SUPERHERO
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/data/CANONICAL_DATA_DICTIONARY.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00579`, `MWREQ-00580`, `MWREQ-00581`, `MWREQ-00582`, `MWREQ-00583`, `MWREQ-00584`, `MWREQ-00585`, `MWREQ-00586`, `MWREQ-00587`, `MWREQ-00588`, `MWREQ-00589`, `MWREQ-00590`, `MWREQ-00591`, `MWREQ-00592`, `MWREQ-00593`, `MWREQ-00594`, `MWREQ-00595`, `MWREQ-00596`

</details>

<details>
<summary><code>MW-1228</code> — Evidence intelligence</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.8 Evidence Intelligence after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.8 Evidence Intelligence
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00597`, `MWREQ-00598`, `MWREQ-00599`, `MWREQ-00600`, `MWREQ-00601`, `MWREQ-00602`, `MWREQ-00603`, `MWREQ-00604`, `MWREQ-00605`, `MWREQ-00606`, `MWREQ-00607`, `MWREQ-00608`, `MWREQ-00609`, `MWREQ-00610`, `MWREQ-00611`

</details>

<details>
<summary><code>MW-1229</code> — Research intelligence</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.9 Research Intelligence after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.9 Research Intelligence
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00612`, `MWREQ-00613`, `MWREQ-00614`, `MWREQ-00615`, `MWREQ-00616`, `MWREQ-00617`, `MWREQ-00618`, `MWREQ-00619`, `MWREQ-00620`, `MWREQ-00621`, `MWREQ-00622`, `MWREQ-00623`, `MWREQ-00624`, `MWREQ-00625`, `MWREQ-00626`, `MWREQ-00627`, `MWREQ-00628`, `MWREQ-00629`, `MWREQ-00630`, `MWREQ-00631`, `MWREQ-00632`, `MWREQ-00633`, `MWREQ-00634`

</details>

<details>
<summary><code>MW-1230</code> — LAW / AWS</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.10 LAW / AWS after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.10 LAW / AWS
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00635`, `MWREQ-00636`, `MWREQ-00637`, `MWREQ-00638`, `MWREQ-00639`, `MWREQ-00640`, `MWREQ-00641`, `MWREQ-00642`, `MWREQ-00643`, `MWREQ-00644`, `MWREQ-00645`, `MWREQ-00646`, `MWREQ-00647`, `MWREQ-00648`, `MWREQ-00649`, `MWREQ-00650`

</details>

<details>
<summary><code>MW-1231</code> — MIZAN assessment</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.11 MIZAN / Assessment after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.11 MIZAN / Assessment
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00651`, `MWREQ-00652`, `MWREQ-00653`, `MWREQ-00654`, `MWREQ-00655`, `MWREQ-00656`, `MWREQ-00657`, `MWREQ-00658`, `MWREQ-00659`, `MWREQ-00660`, `MWREQ-00661`, `MWREQ-00662`, `MWREQ-00663`, `MWREQ-00664`, `MWREQ-00665`, `MWREQ-00666`, `MWREQ-00667`

</details>

<details>
<summary><code>MW-1232</code> — Relationship / CORRELATION</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.12 Relationship / CORRELATION after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md#5.12 Relationship / CORRELATION
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00668`, `MWREQ-00669`, `MWREQ-00670`, `MWREQ-00671`, `MWREQ-00672`, `MWREQ-00673`, `MWREQ-00674`, `MWREQ-00675`, `MWREQ-00676`, `MWREQ-00677`, `MWREQ-00678`, `MWREQ-00679`, `MWREQ-00680`, `MWREQ-00681`, `MWREQ-00682`, `MWREQ-00683`

</details>

<details>
<summary><code>MW-1233</code> — Character Bible</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/creative/CHARACTER_BIBLE.md#6.1 Character Bible after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/creative/CHARACTER_BIBLE.md#6.1 Character Bible
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/creative/CHARACTER_BIBLE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00684`, `MWREQ-00685`, `MWREQ-00686`, `MWREQ-00687`, `MWREQ-00688`, `MWREQ-00689`, `MWREQ-00690`, `MWREQ-00691`, `MWREQ-00692`, `MWREQ-00693`, `MWREQ-00694`, `MWREQ-00695`, `MWREQ-00696`, `MWREQ-00697`, `MWREQ-00698`, `MWREQ-00699`, `MWREQ-00700`, `MWREQ-00701`, `MWREQ-00702`, `MWREQ-00703`, `MWREQ-00704`, `MWREQ-00705`, `MWREQ-00706`, `MWREQ-00707`, `MWREQ-00708`, `MWREQ-00709`, `MWREQ-00710`, `MWREQ-00711`, `MWREQ-00712`

</details>

<details>
<summary><code>MW-1234</code> — Character classifications</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/creative/CHARACTER_BIBLE.md#6.2 Character Classifications after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/creative/CHARACTER_BIBLE.md#6.2 Character Classifications
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/creative/CHARACTER_BIBLE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00713`, `MWREQ-00714`, `MWREQ-00715`, `MWREQ-00716`, `MWREQ-00717`, `MWREQ-00718`, `MWREQ-00719`, `MWREQ-00720`, `MWREQ-00721`, `MWREQ-00722`, `MWREQ-00723`

</details>

<details>
<summary><code>MW-1235</code> — Character usage and appearances</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/creative/CHARACTER_BIBLE.md#6.4 Character Usage after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/creative/CHARACTER_BIBLE.md#6.4 Character Usage
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/creative/CHARACTER_BIBLE.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00736`, `MWREQ-00737`, `MWREQ-00738`, `MWREQ-00739`, `MWREQ-00740`, `MWREQ-00741`, `MWREQ-00742`, `MWREQ-00743`, `MWREQ-00744`, `MWREQ-00745`, `MWREQ-00746`, `MWREQ-00747`

</details>

<details>
<summary><code>MW-1236</code> — Creative studio</summary>

**Mode:** `gated_implementation`

**Scope:** Implement only the MWREQ IDs listed in this packet from docs/product/PRODUCT_SPECIFICATION.md#6.5 Creative Studio after all task dependencies are done and the canonical owner/package is confirmed.

**Non-goals**

- Do not add adjacent features or reinterpret the canonical source statements.
- Do not create a second owner or duplicate existing ql_* package behavior; reconcile existing implementation first.
- Do not publish unverified research or religious claims as authoritative conclusions.

**Canonical references**

- docs/product/PRODUCT_SPECIFICATION.md#6.5 Creative Studio
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md#canonical owner and dependencies

**Likely touchpoints**

- docs/product/PRODUCT_SPECIFICATION.md
- The single owner-approved ql_* addon identified by the domain registry; do not invent a package name.
- @moonwitness/moonclient only if the approved feature adds an API contract.

**Checks**

- Run the owning addon focused manifest/model/view/ACL/service/contract tests that apply to this scope.
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm tracker:check

**Stop conditions**

- Stop while any listed dependency is not done; do not infer owner ratification from this task existing.
- Stop if domain ownership, source rights, product behavior, or religious/academic interpretation needs an unresolved owner decision.
- Stop if implementation would violate AGENTS.md package boundaries or require an unapproved external service.

**Requirement IDs:** `MWREQ-00748`, `MWREQ-00749`, `MWREQ-00750`, `MWREQ-00751`, `MWREQ-00752`, `MWREQ-00753`, `MWREQ-00754`, `MWREQ-00755`, `MWREQ-00756`, `MWREQ-00757`, `MWREQ-00758`, `MWREQ-00759`, `MWREQ-00760`, `MWREQ-00761`, `MWREQ-00762`

</details>

<details>
<summary><code>MW-1239</code> — Recording delegated decision authority and safe owner choices</summary>

**Mode:** `autonomous`

**Scope:** Record the owner&#x27;s explicit chat delegation and make conservative, evidence-backed decisions from the prepared options for storage, brand boundary, tenancy, domain-contract depth/events, and phase crosswalk; update the decision records and agent instructions for this bounded delegation pattern.

**Non-goals**

- Do not ratify an exact commit SHA or accept dirty-worktree changes.
- Do not invent numeric performance targets or claim measurements.
- Do not claim rights, legal, security, provider, production, or external approvals without their required evidence.
- Do not fabricate account-gated browser evidence or mark manual-verification tasks done.
- Do not commit, push, create GitHub records, or deploy.

**Canonical references**

- AGENTS.md#Alur kerja dan validasi
- .github/skills/github-issues/SKILL.md
- docs/decisions/ADR_REGISTRY.md

**Likely touchpoints**

- AGENTS.md
- .github/agents/moonwitness-engineer.agent.md
- .github/skills/github-issues/SKILL.md
- docs/governance/TODO.template.md
- docs/governance/task-tracker.json
- docs/governance/REQUIREMENTS_TRACEABILITY.md
- docs/decisions/ADR_REGISTRY.md
- docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md
- MASTER_DESIGN.md
- docs/product/PRODUCT_SPECIFICATION.md
- docs/operations/INFRASTRUCTURE_AND_DEPLOYMENT_BLUEPRINT.md
- docs/security/SECURITY_AND_PRIVACY_BLUEPRINT.md

**Checks**

- pnpm tracker:render
- pnpm tracker:check
- pnpm tracker:test
- python -B docs/audit/tools/requirement_coverage_gate.py

**Stop conditions**

- Keep any decision blocked if its acceptance requires exact-SHA ratification, legal/rights evidence, an approved numeric workload, or an actual non-production browser/account interaction.
- Do not infer that a bounded delegated decision authorizes implementation, release, or external action.

</details>

<details>
<summary><code>MW-1240</code> — Migrate canonical task and documentation sources to GitHub</summary>

**Mode:** `autonomous`

**Scope:** Inventory and migrate the canonical task tracker and human-authored documentation to GitHub Issues and Wiki, then retire local duplicates and update agent/CI/tool references. Preserve all task data and unrelated worktree changes.

**Non-goals**

- Do not create a GitHub Project, commit or push repository code, deploy, or change branch protection.
- Do not delete local sources until remote copies, task mappings, and consumers have been verified.
- Do not drop requirement catalog data or audit checks without a verified replacement.
- Do not discard or overwrite unrelated dirty worktree changes.

**Canonical references**

- docs/governance/GITHUB_GOVERNANCE.md
- .github/skills/github-issues/SKILL.md
- AGENTS.md

**Likely touchpoints**

- docs/governance/task-tracker.json
- docs/governance/TODO.template.md
- TODO.md
- docs/audit/tools/task_tracker.py
- docs/audit/tools/task_tracker_server.py
- docs/audit/tools/test_task_tracker.py
- docs/audit/tools/test_tracker_invariants.py
- .github/workflows/ci.yml
- AGENTS.md
- .github/skills/github-issues/SKILL.md
- .github/skills/moonwitness-development/SKILL.md
- .github/agents/moonwitness-engineer.agent.md
- docs/governance/GITHUB_GOVERNANCE.md

**Checks**

- Verify one GitHub Issue per task ID with preserved status, dependencies, acceptance criteria, and evidence.
- Verify migrated Wiki pages, internal links, and local cross-references.
- Run relevant lint, typecheck, build, and test commands after local cutover.

**Stop conditions**

- Stop before local source deletion if Wiki or Issue write access is unavailable or remote replacement content cannot be verified.
- Stop if any task or document cannot be mapped without losing status, evidence, rights constraints, or provenance.
- Stop if a touched dirty file contains conflicting user changes that cannot be safely integrated.

</details>
