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
- **Branch protection snapshot (2026-11-01):** default branch is `dev`; classic protection exists on `main` with required `validate` and `enforce_admins`, while `dev` requires `validate` with `strict: false` and `enforce_admins: false`. No repository rulesets were observed. This is an uneven baseline, not a claim that protection is complete.
- **Actions CI:** no current CI result has been established for the latest observed `dev` commit (`8fe4713e58c7099b3e52c76d3c64cbeb5d16b50c`). An earlier clean-runner audit reported `pnpm lint` failing with 720 type-aware/type-resolution errors, so typecheck/tests/build were skipped then; do not treat that historical finding as current or claim the latest commit passed.

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
| MW-0558 | Manual browser click-through evidence (member submit → admin approve → PATCH bypass refused) | Pending owner browser verification | Owner | MW-0507 precedent applies — must not be reported as "done" until verified in a real browser. Automated tests already cover the bypass refusal and self-approval refusal (MW-0553/0554/0556); only the end-to-end UI flow needs manual capture |

### Master-prompt gap goals and execution microtasks

The prompt coverage gate currently maps all 87 planning-list items, all 31 deliverables, 23 domains, 20 domain-contract attributes, nine acceptance criteria, and the twelve STEP 8 report items. A mapped item is not necessarily specified or implemented: the 13 planning-list holes remain explicit below. The official A-L-L-A-H.COM identity is ratified in `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`; product, visual-brand, and implementation decisions remain governed separately.

All tasks below are proposed. Planning and audit tasks may proceed without feature coding. Tasks in PHASE 8–12 are blocked until the owner ratifies the relevant baseline and release gates. GitHub Issues, Projects, and Milestones must not be created before the governance task and ratification gates allow them.
The canonical owner for each goal/task in these tables is `bjo163`; an agent may execute a bounded task without changing its owner.

#### Planning gaps and audit goals

| ID | Goal | Master-prompt mapping | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
| MW-0601 | Audit implementation against the canon and all 12 pillars | PILLAR 01–12; acceptance A–I; D01–D31 | — | Done | The audit report records the dirty-worktree scope and committed baseline `40c04f172ff91d8002c8d51c4922c8abc6b59a37`. All 1,891 catalog rows now have an explicit status and review basis: 369 `GAP`, 267 `PARTIAL`, 1,255 `UNKNOWN`, zero `UNVERIFIED`; TODO links are retained and gates validate the inventory. Current lint/typecheck/test/build and traceability checks pass. This closes audit triage only—not implementation, owner ratification, production certification, or release approval. |
| MW-0602 | Reconcile product identity references to the official canon | PILLAR 01; STEP 6 | — | Proposed | Audit references to A-L-L-A-H.COM and MoonWitness; canonical wording links to `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`; no companion document redefines identity or confers religious authority. |
| MW-0603 | Complete repository and GitHub permission inventory | PHASE 0: GitHub permissions; PILLAR 02 | — | Proposed | Record account, organization, repository, team, role, and inaccessible/unknown scopes with evidence and exact observation time; distinguish verified access from unavailable data. |
| MW-0604 | Specify search and indexing boundaries | PHASE 3: Search; PILLAR 10 §10.4 | — | Proposed | Define `ql_search` inputs, source-of-truth boundary, indexing/update/delete lifecycle, rights/private-field exclusions, query API, ownership, failure behavior, and tests; no canonical content is owned by indexes. |
| MW-0605 | Decide storage scope and write its security contract | PHASE 3: Storage; PILLAR 10 §10.5 | — | Proposed | Decide whether external/object storage is in the approved scope; if yes, specify ownership, access, encryption, rights, retention/deletion, limits, threat model, and verification; if no, record the deferral and trigger. |
| MW-0606 | Complete the visual brand specification under the official identity | PHASE 5: Brand; PILLAR 08 §§8.5–8.7 | MW-0602 | Proposed | Define approved wordmark/identity usage, voice, palette ownership, and tenant-brand boundary in the canonical design document; preserve the official canon and label concept art as illustrative until approved. |
| MW-0607 | Inventory and name design tokens | PHASE 5: Design Tokens; PILLAR 08 §8.5 | MW-0606 | Proposed | Publish semantic token names and values for light/dark themes, typography, spacing, elevation, borders/radii, focus, and status; verify every token has one canonical owner in `@moonwitness/ui`. |
| MW-0608 | Decide and specify the tenant and workspace model | PHASE 6: Tenant Model; PILLAR 08 §8.7; PILLAR 09 | — | Proposed | Record whether and how tenants exist, membership/ownership rules, isolation and sharing boundaries, identity/ACL effects, and migration implications; add cross-tenant negative tests to the acceptance plan. |
| MW-0609 | Set measurable performance and reliability targets | PHASE 6: Performance Requirements; PILLAR 10 §§10.8, 10.10 | — | Proposed | Owner-approved targets cover latency, throughput, corpus/search scale, availability, and recovery where applicable; each target names measurement method, environment, and release gate. |
| MW-0610 | Specify per-domain contracts and events/notifications | PILLAR 04 §4.4; R-46/R-48 | — | Proposed | Select a single contract-depth policy; define the previously missing events/notifications contract, then map every required §4.4 attribute to its canonical owner and a test/evidence source. |
| MW-0611 | Resolve domains without estate-source material | PILLAR 04 §4.3; PILLAR 11 | MW-0610 | Proposed | Owner disposition exists for `ql_creative`, `ql_journey`, `ql_org`, `ql_person`, and `ql_search`; in-scope domains have first-principles scope, entities, dependencies, and acceptance criteria rather than invented source data. |
| MW-0612 | Define task dependency and domain DoD rules | PHASE 7: Dependencies and Microtask breakdown; PILLAR 12 §12.4 | MW-0601 | Proposed | Every proposed task has explicit prerequisite task IDs or `—`; every approved domain has a bounded DoD covering manifest, models/views, ACL, contract, and tests; the task graph is acyclic. |
| MW-0613 | Define the GitHub label taxonomy | PHASE 7: Labels; PILLAR 12 §12.4 | MW-0612 | Proposed | Document a small label set for task ID, domain, type, priority, and status with definitions and usage rules; no label is created until owner approval. |
| MW-0614 | Map GitHub Issues, Projects, and Milestones to TODO goals | PHASE 7: Issues, Project, Milestones; PILLAR 12 §12.4 | MW-0612, MW-0613 | Proposed | Define one-to-one issue/task linking, required issue fields, project fields, and milestone mapping; prepare the mapping without creating platform objects. |
| MW-0615 | Reconcile TODO phase numbering with the legacy phase catalog | PHASE 0–12; R-45 | MW-0612 | Proposed | Owner-approved mapping uses the D30 catalog's phase IDs; Cloudflare MW-0500 workstream is explicitly cross-referenced without mislabeling it as catalog PHASE 12. |
| MW-0616 | Ratify a stable planning baseline and disposition prior work | PILLAR 12; acceptance I; R-42/R-49/R-52 | MW-0601, MW-0602, MW-0603, MW-0604, MW-0605, MW-0606, MW-0607, MW-0608, MW-0609, MW-0610, MW-0611, MW-0612, MW-0613, MW-0614, MW-0615 | Proposed; owner action | Owner records accept/amend decisions against an exact commit SHA, including already-landed work and its evidence; the release/implementation gate is explicit and reproducible. |
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
| MW-0806 | I18N | MW-0803, MW-0607 | Blocked by ratification | Indonesian and English catalogs have type-safe keys, parity tests, route persistence, and locale-aware formatting. |
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
| MW-1001 | Expand only approved domains in dependency order | MW-0905, MW-0611, MW-0612 | Blocked by ratification | Each approved domain has its own TODO task and DoD; dependencies follow the ratified domain graph; each addon passes manifest/model/ACL/view/contract tests before integration. |

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
| **Prompt PHASE 3** | BLUEPRINT.md and D06/D07 architecture exist as target design; implementation conformance and search/storage decisions remain open |
| **Prompt PHASE 4** | 23/23 domains and 20/20 contract attributes map to owners; per-domain contract depth, events/notifications, and five no-source domains remain open |
| **Prompt PHASE 5** | Master design and I18N specs exist; visual identity system, design-token inventory, UI conformance, and owner ratification remain open |
| **Prompt PHASE 6** | Security, infrastructure, quality, migration, and release specs exist; tenant model, performance targets, current CI, and recovery evidence remain open |
| **Prompt PHASE 7** | TODO is the sole task register; task dependency, label, issue/project/milestone mapping, and phase-number reconciliation are now explicit goals |

### Developer tooling — canonical project task tracker

| ID | Goal | Master-prompt mapping | Depends on | Status | Acceptance criterion |
|---|---|---|---|---|---|
| MW-1209 | Add mandatory task-tracker workflow and a local status editor | D26 — Master TODO with Microtasks | — | Implemented; focused tests and browser verification pass | A mandatory repository skill maps every coding task to the canonical register; a Python stdlib localhost-only UI safely edits task state, preserves custom status labels, records known completion times, and regenerates TODO.md; focused tests and tracker gates pass. |
| **Prompt PHASE 8** | Partial foundation exists in-workspace; all 14 foundation outcomes are separate blocked tasks pending ratification and implementation audit |
| **Prompt PHASE 9** | First source-to-publication slice is not verified; five lifecycle goals are defined and blocked on rights, product decisions, and foundation gates |
| **Prompt PHASE 10** | Domain expansion is not verified; approved domains must receive separate tasks and pass addon-specific DoD |
| **Prompt PHASE 11** | Integration/hardening evidence is not complete; all 13 verification outcomes are separately tracked and blocked |
| **Prompt PHASE 12** | Historical `v0.1.0` exists, but current release gates are not evidenced; all eight release steps are separately tracked and blocked |
| **MW-0500 workstream** | MW-0501–MW-0507 code is present and addon/HTTP suites were previously reported green; browser verification and latest commit CI status remain unverified |

### Phase 12 — Release & Continuous Improvement

| ID | Subject | Status | Owner | Acceptance Criterion |
|---|---|---|---|---|
| MW-1201–MW-1208 | Prompt-aligned release and continuous-improvement gates | Proposed; prior release evidence requires reconciliation | Owner | Each PHASE 12 microtask is completed against an exact SHA and its acceptance evidence; do not infer completion from the existing `v0.1.0` release |

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
9. **Accept that ratification is SHA-bound** — `bjo163/moonwitness-reborn` `main` kept advancing through the whole audit (twelve tips by 08:29Z, `7d801c3…`, `validate` **green**), then the commits this workspace held locally were merged through PR #1 and PR #2 and cut as tag and release `v0.1.0` at `4fdb7c7…`, with classic `main` protection (required `validate`, `enforce_admins`) switched on — all of it by another session, while this audit's planning documents were, at that reading, still sitting outside git (they are committed now; blocker 11 names the SHAs). Whether this workspace sits ahead of or behind `origin/main` changes within minutes; the governance gates report branch/upstream and commit evidence. Reading "ahead of `origin/main`" as "unpushed" was itself an error this audit made and corrected, because a checkout on `dev` is ahead of `main` by every `dev` commit. The open decision is stabilization: ratification must name a commit, and that commit must then be held, or every ratified plan expires on the next merge (R-42).
10. **Ratify the single-owner capacity rule** — the estate-wide roll-up maps 7 design-system sources, 2 contract sources, 10 separate web surfaces and 4 worker/API designs onto slots that `AGENTS.md` allows exactly once each; adopting from any of them means absorbing into `@moonwitness/ui` / `@moonwitness/moonclient` / one `apps/web`, never adding a second package or shell (R-43).
11. **Ratify the baseline at a named commit** — the documents are now in git: `8016edc…` on `dev` carries `BLUEPRINT.md`, `MASTER_DESIGN.md`, every register document path except the three under `docs/data/`, and the two gate scripts (29 files, +3454/−114), and its child `85feec0…` unblocked those three, which `.gitignore` line 9 (`data/`, unanchored) had made un-committable (R-53). The coverage gate measures against HEAD, so the child commit is what makes it read `0 not in HEAD` — staging alone used to print zero, which is why the earlier claim "26 of 29 untracked — an owner decision" was partly a tooling defect and partly a flattering instrument, not a refusal. What is left is the owner's accept/amend decision against a named commit and the stabilization that decision requires (R-49/R-42).
12. **Reconcile phase meanings** — TODO now has headings for all catalog PHASE 0–12, and Cloudflare is a separate MW-0500 workstream. However, the older task-lane meanings for PHASE 3–11 still do not align with the catalog's architecture/data/design/governance/build sequence. Approve a single mapping before GitHub milestones are created (R-45; MW-0615).
13. **Decide what "per domain" means for §4.4** — the twenty contract attributes are currently covered by estate-wide rules plus this registry, not by a written contract per domain; attribute 13 (events and notifications) is defined nowhere. Choose between defaults-plus-addon-manifests and one contract block per domain (R-46).
14. **Ratify the six §4.3 domains added by the coverage pass** — `ql_evidence`, `ql_law`, `ql_creative`, `ql_publication`, `ql_search` and `ql_ops`, plus the three owner narrowings that came with them (evidence records out of `ql_research`, publication records out of `ql_workflow`, creative production out of `ql_story`). Then rule on whether `rocksoul-aws`'s LAW corpus enters scope as an import candidate and whether the two `TBD` private repositories (`moonwitness-xiv`, `bjo163/mw-core`) justify a commissioned inventory (R-44).
15. **Rule on the five §4.3 domains with no estate material** — `ql_creative`, `ql_journey`, `ql_org`, `ql_person` and `ql_search` receive zero mapped rows from the 102-row roll-up, so they are required by the prompt but nothing in the estate feeds them; decide whether each is in-scope-by-design or a placeholder owner (R-48).
16. **Close the six phase-list gaps** — all 87 PHASE 0–7 planning items are mapped; 13 remain PARTIAL/NONE and each now links to a TODO goal (MW-0603–MW-0609, MW-0612–MW-0614). Search has no specification; storage, visual brand, tokens, tenant model, and performance targets are incomplete. Write the missing specification or explicitly defer it with an owner decision (R-50).
17. **Approve the governance mechanics** — GitHub Issues, Projects, and Milestones remain uncreated until ratification. The missing label taxonomy, task dependencies, task decomposition, and issue/project/milestone mapping now have TODO goals (MW-0612–MW-0614). Existing branch-protection state is an observed baseline, not a fully ratified policy (R-51/R-52).
18. **Decide release sequencing and prior work** — the 14 PHASE 8, 13 PHASE 11, and 8 PHASE 12 list items now each map to separate TODO goals; PHASE 9/10 prose outcomes also have explicit goals. Owner must decide whether `v0.1.0` and work landed before ratification are accepted retroactively, and the current exact-SHA gates must pass before new release work proceeds (R-52; MW-0616, MW-0801–MW-1208).

---

**Gate:** No production feature coding, external issue creation, push, branch policy change, or migration begins until the owner reviews and ratifies the planning baseline. `PENDING` means no evidence has been established; it must not be presented as complete.

**Owner:** `bjo163` — per workspace `AGENTS.md` and the A-L-L-A-H.COM Official Canon.