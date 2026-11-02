# SYSTEM OBSERVATORY — Automation & Operational Intelligence Architecture

**Status:** Architecture direction finalized for implementation planning  
**Product owner:** Headquarter  
**Functional region:** System Observatory  
**Target repository:** `bjo163/moonwitness-reborn`  
**Target branch:** `dev`  
**Document type:** Product boundary / system architecture / implementation plan  
**Implementation status:** Not implemented by this document

---

## 1. Executive decision

Automation, monitoring, browser operations, and agent-assisted execution belong inside **Headquarter → System Observatory**. They are not a separate MoonOps product and must not introduce a parallel backend, database authority, identity system, or application shell.

“MoonOps” may be used as an internal shorthand for this operational capability during engineering discussions. It is not a new public product, top-level destination, brand, or independent service boundary.

System Observatory is the operational control and evidence surface for the wider MoonWitness ecosystem. It observes services and integrations, coordinates approved automation, exposes execution status, and preserves evidence and audit history. It does not take ownership of the business or content domains whose work it operates.

**Architecture decision:** build a native MoonWitness operations domain and runtime in the existing TypeScript workspace. Use Playwright as an isolated browser executor. Treat OpenClaw as an optional external agent/runtime adapter, not as the platform foundation. Keep AI provider access behind the existing AI provider/model contracts.

## 2. Product placement and boundaries

Headquarter remains one coherent Spatial Command Center with six functional regions. System Observatory is region 06, not a seventh region or a separate application.

| Area | Owns | Does not own |
|---|---|---|
| Command Deck | Operational overview, priorities, alerts, links to actionable work | Detailed monitoring configuration or execution internals |
| Mission Control | Missions, project work, tasks, milestones, contribution evidence | Scheduler, recurring jobs, runtime execution records |
| Knowledge & Intelligence | Research, sources, evidence review, AI-assisted analysis | Technical service monitoring or job orchestration |
| Universe & Transmissions | Stories, archives, media, publication records and editorial status | Generic automation engine or browser runtime |
| Cockpit | Personal workspace, personal tools and preferences | Ecosystem-wide operational administration |
| System Observatory | Service health, monitoring configuration, incidents, automation definitions, execution visibility, operational audit | Content ownership, mission/task ownership, personal workspace |

Cross-region handoffs must use stable domain references and authorized APIs. For example, a publishing run is executed and observed by System Observatory, while the video, transmission, publication rights, and editorial state remain owned by Universe & Transmissions.

## 3. Existing architecture fit — reuse before adding

The implementation must reconcile against the current `dev` branch before creating new models or services.

| Existing component | Current responsibility | Required treatment |
|---|---|---|
| `ql_workflow` | CAB/change review workflow and project/PM tracking | Reuse for governed change/project work; do not turn it into a scheduler or job queue |
| `ql_integration` | External connector registry and integration audit | Extend only for connector lifecycle/capabilities that fit its ownership |
| `ql_ai` | AI provider configuration and related domain records | Reuse as the model/provider configuration authority |
| `@moonwitness/agent-runtime` | Existing model-provider and agent invocation runtime | Extend behind stable contracts; do not assume it already provides a durable automation executor |
| `@moonwitness/moonclient` | Shared API contracts, DTOs, routes and web communication SDK | All new web/API contracts must be defined here |
| QlOrm / `ql_*` addons | Domain models, persistence, ACL, ownership and views | Remain the only application-domain data authority |

Before implementation, inspect the current models, services, manifests, ACLs, exports, and tests. Reuse or extend an existing owner when appropriate. Do not create duplicate connector, AI-provider, workflow, audit, or task records.

## 4. Responsibility split: observe, orchestrate, execute

These are separate responsibilities and must remain separate in the domain model.

### 4.1 Observability — “What is happening?”

Owns monitored targets, check definitions, check results, service health, incidents, and operational observations.

Initial adapter categories:
- HTTP/HTTPS availability and response checks;
- TCP connection checks;
- DNS resolution checks;
- scheduled application health endpoints;
- SNMP/network checks through bounded adapters;
- provider APIs and webhooks where an authoritative API exists;
- YouTube broadcast/live-chat status through the YouTube connector when authorized.

Monitoring must run independently of AI availability. A model outage must not stop health checks, incident creation, or deterministic notifications.

### 4.2 Automation — “What should run, and when?”

Owns automation definitions, triggers, schedules, enablement state, policy references, and links to execution runs.

Supported trigger categories:
- manual operator request;
- scheduled/cron trigger;
- monitor/incident event;
- inbound webhook;
- domain event from an authorized MoonWitness addon.

Automation definitions describe intent and permitted steps. They do not themselves execute arbitrary code in the API process.

### 4.3 Execution — “What actually ran, and what happened?”

Owns execution runs, step attempts, lifecycle state, cancellation, retry metadata, approval decisions, result summaries, and evidence references.

Every run must have:
- a stable run ID and idempotency key;
- initiating actor or system identity;
- source trigger and automation/version reference;
- start/end timestamps and bounded status;
- step-level result and failure reason;
- retry/timeout/cancellation history where applicable;
- evidence/artifact references;
- approval record when policy requires human approval.

Execution status must come from persisted runtime results, never from optimistic UI state or fabricated counters.

## 5. Logical architecture

```text
HEADQUARTER
└── System Observatory (role-restricted UI)
    ├── Overview & Incidents
    ├── Monitors & Targets
    ├── Automation
    ├── Executions & Evidence
    ├── Browser Operations
    ├── Agents & Integrations
    └── Audit

MOONWITNESS APPLICATION
├── @moonwitness/moonclient
│   └── Shared DTOs, route contracts, request/error contract
├── QlOrm domain addons (ql_*)
│   ├── Observability domain
│   ├── Automation definitions
│   ├── Execution lifecycle
│   ├── Existing integration registry
│   └── Existing AI provider configuration
└── TypeScript runtime packages
    ├── Monitor adapters / polling workers
    ├── Automation scheduler / dispatcher
    ├── Execution worker
    ├── Browser runtime adapter (Playwright)
    └── Optional agent runtime adapter (OpenClaw / MoonWitness agent runtime)

EXTERNAL SYSTEMS
├── HTTP / TCP / DNS / SNMP endpoints
├── YouTube and other authorized platform APIs
├── WhatsApp provider (official API or separately approved Web session engine)
├── Playwright-managed browser contexts
└── Optional OpenClaw Gateway
```

This is a logical ownership map, not a requirement to deploy every worker as a separate microservice. Start with the smallest independently restartable processes that satisfy isolation and reliability requirements.

## 6. Runtime and technology decisions

The repository's existing TypeScript / Node.js workspace remains the implementation language and platform.

| Concern | Decision |
|---|---|
| Language/runtime | TypeScript, Node.js 22+, ESM, following workspace conventions |
| API | Existing application API and route conventions; no new Fastify service unless the repository architecture explicitly adopts it |
| Domain persistence | QlOrm models in `ql_*` addons |
| Database | Existing configured QlOrm database; preserve SQLite-first compatibility where supported |
| Browser automation | Playwright in a separately managed worker/process with isolated browser contexts |
| Agent execution | Existing `@moonwitness/agent-runtime`; optional OpenClaw adapter |
| Model access | Existing `ql_ai` / provider contracts, including OpenAI-compatible providers where supported |
| Scheduling | Durable database-backed scheduler/dispatcher first |
| Queue | Database-backed persistent jobs first; add Redis/BullMQ only when measured throughput or locking requirements justify it |
| UI | Existing Next.js app, `@moonwitness/ui`, Moon UI tokens and Headquarter spatial shell |
| API client | `@moonwitness/moonclient` only for web application communication |
| Deployment | Existing Docker/workspace deployment conventions |

Do not introduce a second API server, Drizzle, a second ORM, a second identity store, or a parallel database schema. Do not add Redis merely because a queue is present in the design.

### 6.1 Durable scheduler requirements

A scheduler is not a timer held only in process memory. It must recover after restart and prevent duplicate concurrent execution.

The first implementation must define and test:
- persisted next-run time and schedule timezone semantics;
- safe due-job claiming / lease ownership using supported QlOrm transaction and concurrency capabilities;
- lease expiry and recovery after worker crash;
- bounded concurrency per automation and globally;
- idempotency for manual, webhook, and scheduled triggers;
- retry policy with capped exponential backoff and jitter;
- timeout, cancellation, and graceful shutdown behavior;
- misfire policy after downtime (skip, coalesce, or bounded catch-up);
- run history and retention policy.

If QlOrm cannot safely provide atomic claim/lease semantics, resolve that capability in the existing ORM/runtime architecture before choosing an external queue. Do not bypass the repository's data-access rules with ad-hoc SQL.

## 7. Executor strategy: Playwright and OpenClaw are not alternatives

### 7.1 Playwright — deterministic browser executor

Use Playwright for explicit, testable browser tasks:
- synthetic website journeys and login checks;
- navigation, form interaction and UI verification;
- screenshots, traces and failure evidence;
- controlled publishing workflows only when no suitable authorized API exists.

Playwright is not the monitoring scheduler, AI agent, workflow database, or policy authority. Browser jobs must run outside the API process.

Required isolation:
- isolated browser context per run/account;
- allowlisted target origins and controlled outbound network access;
- no unrestricted local filesystem or shell access;
- bounded CPU, memory, duration, page count and download size;
- secrets injected only at execution time and never included in logs, traces, screenshots or artifacts;
- artifact access controlled by the same authorization rules as the originating run.

Prefer official APIs over browser automation when they provide the required capability and authorization.

### 7.2 OpenClaw — optional external agent/runtime adapter

OpenClaw may be connected as an external agent execution provider for agent-oriented tasks. It must remain replaceable and must not become a required dependency for core monitoring, scheduling, persistence, or deterministic automation.

Integration requirements:
- use a documented and versioned integration contract;
- treat OpenClaw as an untrusted executor boundary;
- pass only scoped task context and explicitly granted tools;
- receive results through authenticated callbacks or a controlled polling adapter;
- persist request, response summary, status and evidence references in MoonWitness;
- enforce MoonWitness ACL, policy and approval checks before any consequential action;
- support timeout, cancellation, retry and provider-unavailable states;
- never expose MoonWitness database credentials or unrestricted internal APIs to the agent.

### 7.3 Model provider versus agent executor

An OpenAI-compatible endpoint supplies model inference; it does not automatically supply browser control, durable jobs, tool permissions, or an agent orchestration lifecycle. Keep model-provider selection separate from executor selection.

## 8. Event and automation lifecycle

```text
MONITOR / WEBHOOK / SCHEDULE / OPERATOR
                 |
                 v
          NORMALIZED EVENT
                 |
                 v
       TRIGGER MATCH + POLICY CHECK
                 |
          +------+------+
          |             |
       DENIED        APPROVAL NEEDED
          |             |
       AUDIT         WAIT FOR APPROVAL
                        |
                        v
                 CREATE EXECUTION
                        |
                        v
               DISPATCH ALLOWED STEPS
                 /       |        \
                v        v         v
             API      PLAYWRIGHT  AGENT
                 \       |        /
                  v      v       v
                  STEP RESULTS + EVIDENCE
                           |
                           v
                   PERSIST RUN STATE
                           |
                 +---------+---------+
                 |                   |
              COMPLETE             FAILED
                 |                   |
                 v                   v
          DOMAIN EVENT /       RETRY POLICY /
          NOTIFICATION         INCIDENT / AUDIT
```

A failed or unavailable executor must produce a truthful failure state. Never mark a run successful merely because it was dispatched.

## 9. Domain model proposal — subject to repository reconciliation

The following are proposed ownership concepts, not approved schema declarations. Exact model names, fields, relations, constraints, indexes, ACLs, and views must be reconciled with current addons and QlOrm capabilities before implementation.

| Addon boundary | Candidate model names | Responsibility |
|---|---|---|
| `ql_observability` | `observability.target`, `observability.check`, `observability.result`, `observability.incident` | Targets, checks, observations, incidents |
| `ql_automation` | `automation.definition`, `automation.trigger`, `automation.schedule` | Automation intent and activation |
| `ql_execution` | `execution.run`, `execution.step`, `execution.approval`, `execution.artifact` | Runtime lifecycle and evidence references |
| `ql_integration` (existing) | Existing connector and integration audit models | External connector configuration and integration-level audit |
| `ql_ai` (existing) | Existing provider/model configuration | Model provider authority |

Do not create a second generic workflow/task model. `ql_workflow` continues to own CAB and project-management workflow. Do not duplicate `integration.audit` with a second connector audit table; define the boundary between connector-level audit and execution-level run history.

All application-domain models must use the existing addon manifest, model, view, seed, ACL, and dependency conventions. Follow the repository's `AGENTS.md`; no Drizzle schemas or migrations.

## 10. API and client contract

The endpoint names below are illustrative capability groups, not frozen route strings. Before implementation, define exact DTOs, routes, validation, errors, pagination, and SDK methods in `@moonwitness/moonclient`.

| Capability | Contract surface |
|---|---|
| Observability | targets, checks, health summaries, incidents, result history |
| Automation | definitions, triggers, schedules, enable/disable, dry-run validation |
| Execution | run list/detail, step results, cancel, retry where policy permits |
| Approval | pending approval list, approve/reject with reason and audit |
| Evidence | authorized screenshot, trace, log excerpt and artifact metadata |
| Integrations | connector status and permitted test action |
| Agent operations | provider/executor status and bounded run summaries |

The web application must communicate through the existing `moonClient` instance. Server-side ACL and ownership checks are mandatory; hiding controls in the UI is not authorization.

## 11. System Observatory experience

System Observatory should expose operational concepts without turning the Headquarter environment into a generic SaaS admin template.

Suggested direct-navigation destinations:
1. **Overview** — verified service health, active incidents, pending approvals, recent executions.
2. **Monitors & Targets** — monitored endpoints/devices, check configuration, last result and provenance.
3. **Incidents** — timeline, severity, affected targets, evidence, acknowledgement and resolution.
4. **Automation** — definitions, triggers, schedules, enablement and policy summary.
5. **Executions** — run timeline, steps, retries, actor, result and evidence.
6. **Browser Operations** — isolated browser runs, screenshots/traces and resource status.
7. **Agents & Integrations** — connector health, configured executor providers and capability status.
8. **Audit** — immutable or append-only operational action history according to the existing audit contract.

Command Deck may surface high-priority incidents and pending approvals, but detailed configuration and execution remain in System Observatory.

Every view must support truthful loading, empty, error, restricted, offline and success states. Never display demo counters or fabricated “live” status as real telemetry.

## 12. Security, governance and safety

- System Observatory is role-restricted; enforce authorization server-side and deny by default.
- Use existing identity, membership, role, ACL and ownership contracts.
- Store secrets in the established secret-management mechanism; database records hold references/metadata only.
- Redact credentials, tokens, cookies, authorization headers, private message content and sensitive payloads from logs and artifacts.
- Require explicit approval for destructive, external-facing, financial, publication, account, infrastructure, or otherwise consequential actions according to policy.
- Provide dry-run/preview where practical.
- Scope agents to named tools and resources; no unrestricted shell, database, or internal-network access.
- Apply SSRF protections to URL monitors and browser navigation: origin allowlists, private/link-local address blocking, DNS rebinding defenses, redirect revalidation and egress controls.
- Isolate browser processes and enforce resource/time limits.
- Record actor, trigger, policy decision, approval, executor, result and evidence references for every consequential action.
- Provide kill switch / disable controls for automation definitions and executor providers.
- Respect platform terms, API permissions, rate limits, privacy, copyright and account restrictions. Prefer official APIs for YouTube and WhatsApp business operations; unofficial WhatsApp Web automation is an explicitly separate risk-managed connector, not an assumed supported capability.

## 13. Cross-region examples

| Scenario | Domain owner | System Observatory responsibility |
|---|---|---|
| OLT / network health | Network/integration domain | Run checks, record incidents, expose evidence and notify |
| Website synthetic journey | Website/service owner | Schedule Playwright run, isolate browser, record result |
| YouTube Live monitoring | Universe/authorized media integration | Consume authorized live status/chat events, persist operational events and expose monitoring |
| YouTube video publishing | Universe & Transmissions | Execute authorized connector action, record run evidence and return publication result |
| WhatsApp Status publishing | Universe & Transmissions | Execute through an approved connector, record outcome and delivery limitations |
| Research assistant | Knowledge & Intelligence | Provide bounded execution and operational trace; research/source ownership remains there |
| Personal reminder | Cockpit | Offer shared runtime capabilities through personal permissions, not Headquarter admin access |

## 14. Delivery roadmap and gates

### Phase 0 — Architecture and repository reconciliation
- Verify current addon manifests, models, services, runtime exports, API route patterns, QlOrm transaction semantics and ACL conventions.
- Confirm no existing domain model already owns the proposed records.
- Record decisions and implementation tasks in the canonical GitHub Wiki / Issues.

**Exit gate:** ownership map, dependency graph, data lifecycle and security model reviewed.

### Phase 1 — Observability foundation
- Minimal target/check/result/incident domain.
- HTTP/TCP health adapters and deterministic polling worker.
- Incident lifecycle and truthful Command Deck/System Observatory read models.
- Audit and notification event integration.

**Exit gate:** checks survive restart, results are persisted, duplicate incidents are controlled, and monitoring runs without AI.

### Phase 2 — Durable automation and execution
- Definitions, triggers, persistent schedules, dispatcher and execution lifecycle.
- Idempotency, leases, retry, timeout, cancellation and concurrency tests.
- Human approval and policy gates.

**Exit gate:** no duplicate concurrent runs under tested restart/crash conditions; every run has traceable actor, trigger and result.

### Phase 3 — Browser operations
- Isolated Playwright worker and browser context lifecycle.
- Target allowlists, secret injection, artifact redaction and retention.
- Website synthetic checks and evidence viewer.

**Exit gate:** browser worker cannot access prohibited local resources or unapproved network targets; failure evidence is access-controlled.

### Phase 4 — Agent and external executor adapters
- Reuse existing agent-runtime and AI provider contracts.
- Add optional OpenClaw adapter only after its API, trust boundary and failure semantics are documented.
- MCP/tool exposure through explicit permission grants.

**Exit gate:** AI/executor outage does not affect monitoring or scheduler; agent cannot bypass MoonWitness ACL or approval.

### Phase 5 — Platform and media connectors
- YouTube API integration and authorized live monitoring.
- WhatsApp connector selection: official Meta API for business use; evaluate unofficial status publishing separately.
- Domain-owned publishing workflows with execution evidence.

**Exit gate:** platform permissions, quota/rate limits, user consent, publishing approval and failure handling are verified.

### Phase 6 — Intelligence and correlation
- Incident correlation and AI-assisted diagnosis.
- Suggested remediation with evidence and confidence/qualification.
- Human-approved remediation before any consequential action.

**Exit gate:** AI recommendations are distinguishable from verified observations and cannot silently perform restricted actions.

## 15. Non-goals

This architecture does not authorize:
- a standalone MoonOps product or separate application;
- replacing Headquarter's six-region information architecture;
- replacing QlOrm or introducing Drizzle;
- a second API server or identity provider;
- making OpenClaw mandatory;
- running Playwright inside the API process;
- using AI for deterministic health checks or job scheduling;
- unrestricted agent shell/browser/database access;
- automatic publication or infrastructure remediation without policy and approval;
- claiming any capability is implemented, tested, verified or deployed before evidence exists.

## 16. Acceptance criteria for implementation planning

- [ ] System Observatory remains region 06 inside Headquarter.
- [ ] No new top-level product or parallel backend is introduced.
- [ ] Observability, automation definitions and execution lifecycle have non-overlapping ownership.
- [ ] Existing `ql_workflow`, `ql_integration`, `ql_ai`, agent-runtime and `moonclient` responsibilities are reconciled before new models are added.
- [ ] All domain persistence uses QlOrm `ql_*` addons and repository ACL/ownership conventions.
- [ ] Web API contracts live in `@moonwitness/moonclient`.
- [ ] Monitoring and scheduling continue when AI/OpenClaw is unavailable.
- [ ] Scheduler is durable, idempotent and crash-recoverable.
- [ ] Playwright runs in an isolated worker with network/resource/security boundaries.
- [ ] OpenClaw remains optional and cannot bypass MoonWitness policy.
- [ ] All consequential actions have actor, policy, approval, result and evidence traceability.
- [ ] UI states and metrics are backed by authoritative data.
- [ ] Documentation, GitHub Issues and Wiki remain aligned; no task status is duplicated in design docs.

## 17. Source and status

Prepared against the `dev` branch on 2026-11-02. This document records architecture direction for planning. It is not evidence that any proposed addon, runtime, UI, connector, API, or monitoring capability exists.

Re-check the current branch, `AGENTS.md`, manifests, models, services, QlOrm capabilities and GitHub Actions before implementation. The GitHub Wiki remains the canonical project documentation location where applicable; this repository design document provides the detailed design/implementation contract for the System Observatory experience.
