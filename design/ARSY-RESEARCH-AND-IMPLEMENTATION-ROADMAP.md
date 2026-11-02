# ARSY — Research Synthesis & Native Intelligence Implementation Roadmap

**Working name:** ARSY — AGI Reality System Yard  
**Parent product:** MoonWitness  
**Primary operational surface:** Headquarter → System Observatory  
**Status:** Research-backed architecture proposal; implementation not yet claimed  
**Research snapshot:** 2026-11-02  
**Repository baseline reviewed:** `dev`, current workspace and package conventions

---

## 1. Executive decision

Build ARSY as a **MoonWitness-owned cognitive and agent system**. Do not depend on OpenClaw, LangChain, LangGraph, CrewAI, AutoGen, smolagents, browser-use, or another third-party agent framework for the agent loop, planning, memory, tool routing, policy, orchestration, or execution lifecycle.

This is not a proposal to rewrite foundational infrastructure. Keep TypeScript / Node.js, QlOrm, SQLite/libSQL and PostgreSQL support, the existing API boundary, `@moonwitness/moonclient`, model-provider APIs, and narrow execution libraries such as Playwright where justified.

**AGI Reality System Yard is a research and engineering target, not a claim that MoonWitness is AGI.** The system must demonstrate measurable improvements in task generalization, long-horizon reliability, memory utility, adaptation, calibration, and safety on held-out tasks before any stronger capability claim is made.

### Non-negotiable decisions

1. MoonWitness owns the cognition loop and all consequential state transitions.
2. A model provider supplies inference only; it does not own ARSY's memory, policies, planner, tools, or task state.
3. Monitoring and deterministic operations continue when every model provider is unavailable.
4. Tools are typed capabilities with explicit scope, risk, authorization, and verification.
5. Long-running tasks are persisted and recoverable; no critical state exists only in process memory.
6. Memory is provenance-aware, owner-scoped, correctable, expirable, and auditable.
7. Learning initially changes verified memories and approved skills, not model weights or production code.
8. Human approval is mandatory for sensitive external side effects until a separately reviewed policy permits otherwise.
9. Start with one agent runtime and explicit specialist modules; do not default to a swarm.
10. Every milestone has reproducible evaluations and exact-SHA CI evidence.

---

## 2. Repository audit — what exists today

The following is a source-level architecture audit, not a claim that the proposed capabilities already exist.

| Existing area | Observed responsibility | ARSY implication |
|---|---|---|
| `packages/agent-runtime` | Small runtime surface: `ModelProvider.generate`, `runAgent`, grounded output validation and OpenAI-compatible provider | This is a useful native starting point, but it is not yet a durable cognitive runtime, planner, memory system, or tool executor |
| `apps/api/src/ai/model-router.ts` | Provider fallback and model selection seam | Keep inference routing replaceable; add typed capability, timeout, and error semantics without making the router the cognition owner |
| `packages/ql_ai` | Provider configuration and model settings | Reuse for provider configuration; do not create a second provider registry |
| `packages/ql_integration` | External connector registry and audit | Reuse for connector identity and connection lifecycle; tool authorization remains a separate runtime policy |
| `packages/ql_workflow` | CAB approval workflow and project/task tracking | Reuse for governed human review where appropriate; it is not a scheduler, job queue, or agent execution database |
| `packages/database` | Existing user/session/conversation persistence | Preserve conversation ownership and history; do not duplicate chat history as agent memory |
| `packages/ql_search` and research/corpus addons | Existing search and evidence domains | Audit and reuse retrieval/provenance capabilities before adding another index or vector service |
| `packages/ql-orm` | QlOrm over libSQL and PostgreSQL, addon-owned models, service read/write methods | Remains the domain data authority. Current source and service comments state that QlOrm does not expose an explicit transaction API; durable claims and multi-row atomicity must address this first |
| `@moonwitness/moonclient` | Shared API routes and DTO/client communication | All web/API contracts stay here |
| `AGENTS.md` and CI | ql_* addon ownership, no Drizzle, no parallel data authority, GitHub Actions-only quality gates | All proposed work must obey these gates |

### Current gaps to prove and close

- No durable agent run/step state machine has been established in the inspected runtime.
- No first-class typed tool registry and capability policy has been established in the inspected runtime.
- No ARSY-owned working/episodic/semantic/procedural memory lifecycle has been established in the inspected runtime.
- No general planning, replanning, reflection, or outcome-verification loop has been established in the inspected runtime.
- No benchmark harness currently ties reasoning, memory, tool use, generalization, latency, cost, and safety into one repeatable scorecard.
- QlOrm transaction/locking semantics must be audited before designing a crash-safe scheduler or atomic execution ledger.

Do not create a new addon or package until the canonical owner and existing package overlap have been reconciled.

---

## 3. Research and ecosystem review

The papers below are architectural evidence and evaluation inspiration. They are not plug-and-play proof of AGI.

### 3.1 Research papers

| Work | Useful result for ARSY | What not to infer |
|---|---|---|
| [Generative Agents (UIST 2023)](https://arxiv.org/abs/2304.03442) | Observation records, memory synthesis/reflection, retrieval, and planning form a useful loop; ablations support the contribution of observation, planning, and reflection | Believable simulation is not general intelligence |
| [MemGPT (2023)](https://arxiv.org/abs/2310.08560) | Hierarchical memory and virtual-context management can extend work beyond a model's immediate context window | A memory manager alone does not create reliable learning |
| [Reflexion (NeurIPS 2023)](https://arxiv.org/abs/2303.11366) | Verbal feedback and episodic reflection can improve later attempts without changing model weights | Self-critique can be wrong; reflections need external outcome evidence |
| [Voyager (TMLR 2024)](https://arxiv.org/abs/2305.16291) | Skill libraries, automatic curriculum, execution feedback, and self-verification provide useful patterns for cumulative capability | Minecraft results do not establish cross-domain generalization |
| [AgentBench (ICLR 2024)](https://arxiv.org/abs/2308.03688) | Agent capability must be evaluated across interactive environments, not just text QA | One benchmark score is not an AGI certificate |
| [GAIA (ICLR 2024)](https://arxiv.org/abs/2311.12983) | Real-world tasks combine reasoning, browsing, multimodality, and tool use; useful as a general-assistant evaluation reference | Benchmark familiarity or contamination can inflate apparent generality |
| [SWE-agent (NeurIPS 2024)](https://arxiv.org/abs/2405.15793) | Agent-computer interfaces materially affect agent performance; tools should be designed for agents, not merely exposed as raw APIs | A specialized software-engineering interface is not a universal computer interface |
| [OSWorld-Human (MLSys 2026)](https://proceedings.mlsys.org/paper_files/paper/2026/hash/5edb57c05c81d04beb716ef1d542fe9e-Abstract-Conference.html) | Computer-use agents must be evaluated for task efficiency and step/latency overhead, not success rate alone | More steps or more model calls do not imply better reasoning |

### 3.2 Repositories and current ecosystem signals

GitHub trending is a moving popularity signal, not a quality or security endorsement. Snapshot reviewed on **2026-11-02**.

| Project | Observed idea worth studying | ARSY treatment |
|---|---|---|
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | Lifecycle capture, SQLite + FTS5, progressive disclosure, summaries and citations | Study storage/retrieval and context-budget patterns; do not adopt its plugin/hook runtime |
| [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight) | Retain / recall / reflect and memory intended to improve future decisions, not merely retrieve history | Study its memory evaluation and consolidation model; implement a native ARSY-owned design |
| [beenuar/AiSOC](https://github.com/beenuar/AiSOC) | Replayable decision ledger, telemetry correlation, auditable agent investigations, human-approved responses | Study auditability, evidence chains, and approval gates for System Observatory |
| [CopilotKit/OpenBot](https://github.com/CopilotKit/OpenBot) | Isolated per-agent computer/browser, least-privilege tools, action records, human takeover | Study execution isolation and operator handoff; do not adopt its agent stack or database |
| [THUDM/AgentBench](https://github.com/THUDM/AgentBench) | Multi-environment agent evaluation and reproducible task workers | Use as benchmark inspiration; select only environments ARSY can run legally and reliably |
| [noahshinn024/reflexion](https://github.com/noahshinn024/reflexion) | Reflection from observed feedback | Reimplement the minimal pattern with verifiable outcome signals |
| [joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents) | Memory stream, reflection, retrieval, and plan generation | Study the decomposition; do not copy the simulation as ARSY's world model |
| [OSWorld](https://github.com/xlang-ai/OSWorld) | Real computer-use tasks and controlled evaluation environments | Use selected tasks as a later executor benchmark, not as an early production dependency |

The 2026-11-02 trending snapshot also highlighted Claude-Mem, OpenMausBot, AiSOC, OpenBot, Hindsight, and several agent skill collections. Star velocity is volatile; ARSY should extract design patterns, inspect source and licenses, and avoid treating trending status as a dependency-selection criterion.

### 3.3 Protocol and platform documentation

- [OpenAI Agents documentation](https://developers.openai.com/api/docs/guides/agents/sdk) is useful as a capability checklist: agent loop, tools, state, guardrails, approvals, tracing, and evaluations. ARSY will implement its own runtime rather than importing that SDK as its orchestration authority.
- [Model Context Protocol tool specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/server/tools.mdx) is a protocol reference for typed tool discovery and invocation. MCP may be an optional adapter at the boundary; it must not become the internal cognitive model or authorization authority.
- [MCP authorization specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-11-25/basic/authorization.mdx) is a security reference for remote tool authorization. ARSY still enforces its own actor, tenant, resource, and action policy.
- [SQLite WAL documentation](https://www.sqlite.org/wal.html) explains reader/writer concurrency and the same-host limitation of WAL. Do not put a WAL database on a network filesystem or assume SQLite permits multiple concurrent writers.

---

## 4. Native ARSY architecture

### 4.1 Control plane and cognition plane

Keep these planes separate.

**Control plane**
- identity and actor context;
- tool and connector registry;
- permission/capability grants;
- approval requirements;
- execution lifecycle and durable state;
- secrets references and redaction;
- audit, tracing, observability, retention.

**Cognition plane**
- goal interpretation;
- context assembly;
- memory retrieval;
- world/context state construction;
- planning and plan revision;
- model inference calls;
- tool selection proposals;
- outcome interpretation and reflection;
- learning proposals.

The cognition plane proposes actions. The control plane validates and authorizes them. A model must never grant itself permissions or directly mutate the policy authority.

### 4.2 Core modules

| Module | Responsibility | First implementation boundary |
|---|---|---|
| Cognitive Core | Goal interpretation, reasoning steps, structured decisions | Typed request/result and bounded single-run loop |
| Context Builder | Assemble user, task, source, policy, memory, and tool context | Deterministic ordering, token budget, provenance |
| Memory Engine | Working, episodic, semantic, and procedural memory | Start with episodic capture and explicit retrieval |
| World/State Model | Represent current task and observed external state | Evidence-backed state snapshots; no speculative hidden-state claims |
| Planner | Decompose goals, order steps, revise on verified failures | Bounded plans with explicit preconditions and stop conditions |
| Tool Registry | Describe tools, schemas, scopes, risk, and executor | Typed contracts and capability IDs |
| Policy Engine | Authorize every action; enforce approval and limits | Deny-by-default; no model-controlled grants |
| Execution Runtime | Persist runs, steps, attempts, cancellation and recovery | Durable state machine with idempotency |
| Reflection/Learning | Evaluate outcomes and propose memory/skill updates | Evidence-backed proposals; human review for promotion |
| Evaluation Engine | Run benchmark suites and compare versions | Golden tasks, regression sets, held-out tasks, scorecards |

### 4.3 Runtime lifecycle

1. Accept a goal with authenticated actor, scope, and correlation ID.
2. Resolve permissions and applicable policy before any model call that could expose private context.
3. Retrieve only owner-authorized context and memory.
4. Ask the model for a structured, schema-validated plan or decision.
5. Validate plan bounds, tool arguments, resource limits, and action risk.
6. Request human approval when required.
7. Persist the step intent before invoking an external side effect.
8. Execute through a bounded executor with idempotency and timeout.
9. Verify the external result independently; do not trust the model's claim of success.
10. Persist the result and append audit/evidence.
11. Evaluate outcome and propose memory/skill updates.
12. Finalize the run with a truthful status and provenance.

A model response is not proof that an action happened. A tool response is not proof that the intended external state changed. Verification is a separate stage.

### 4.4 Memory model

Use four logical memory classes, but do not immediately create four databases or four addons.

- **Working memory:** current run context, short-lived, bounded, and discardable.
- **Episodic memory:** observed events, tool results, decisions, failures, and their provenance.
- **Semantic memory:** consolidated claims/entities/relationships with source, confidence, valid-time, and correction history.
- **Procedural memory:** tested skills/workflows with version, preconditions, tool requirements, and success evidence.

Memory write policy:
- capture facts separately from model interpretations;
- preserve source and actor provenance;
- deduplicate and supersede without erasing history;
- support correction, expiry, retention, and owner deletion;
- never silently promote speculation to verified knowledge;
- never store credentials, access tokens, browser cookies, or unnecessary personal data;
- retrieve only records authorized for the active actor and task.

Begin with deterministic ID/filter retrieval and the repository's existing search capabilities. Evaluate lexical/FTS and semantic retrieval before adding an embedding service or vector database. Any vector index is a derived, rebuildable index, never the canonical record store.

### 4.5 Learning model

Phase one is **in-context and memory-based adaptation**, not autonomous foundation-model training.

Permitted early learning:
- capture verified outcomes;
- create reflection proposals;
- score skill versions on test fixtures;
- promote only after evaluation and required review;
- roll back a skill version when its regression score worsens.

Not permitted in the initial runtime:
- self-modifying production code;
- autonomous package installation;
- automatic model-weight updates;
- self-granted permissions;
- unreviewed changes to policies, ACLs, or safety constraints;
- learning private information across owners or tenants.

---

## 5. Runtime, persistence, and infrastructure decisions

| Concern | Decision |
|---|---|
| Language | TypeScript, Node.js 22+, ESM, existing workspace conventions |
| Model inference | Existing `ql_ai` provider records and replaceable provider contracts |
| Agent loop | Native `@moonwitness/agent-runtime`, evolved incrementally |
| Domain persistence | QlOrm and owner-approved `ql_*` addons only |
| API and DTO | Existing API patterns and `@moonwitness/moonclient` |
| Database | SQLite/libSQL-first where the deployment and concurrency model support it; PostgreSQL for measured multi-writer / multi-host needs |
| Scheduler | Persisted database-backed schedules and leases; never in-memory timers as the source of truth |
| Browser | Direct Playwright library in an isolated worker, not a browser-agent framework |
| External tools | Official APIs first; narrow adapters behind typed tool contracts |
| Queue | Do not add Redis/BullMQ until measured concurrency, throughput, or cross-host requirements justify it |
| Observability | Native run/step/event records, correlated logs and traces; no fabricated status |

### 5.1 Critical QlOrm gate

The inspected QlOrm source and service comments state that an explicit transaction API is not currently exposed. This is a hard architectural prerequisite for safe multi-record state transitions and atomic job claims.

Before implementing durable scheduling:
1. document supported transaction behavior for libSQL and PostgreSQL;
2. add an explicit, tested transaction boundary to QlOrm if needed;
3. define atomic compare-and-set / lease-claim semantics;
4. test concurrent claims, rollback, crash recovery, and idempotency;
5. only then implement scheduler workers.

SQLite WAL allows readers and a writer to proceed concurrently, but it still has a single-writer model and requires all processes to be on the same host. A multi-host deployment must not pretend a shared SQLite WAL file is a distributed queue.

### 5.2 Executor isolation

- Run browser and other side-effecting tools outside the API request process.
- Give each run an isolated browser context and bounded resource envelope.
- Apply origin allowlists and outbound network restrictions to prevent SSRF.
- Do not expose arbitrary shell, host filesystem, database credentials, or unrestricted internal network access to the model.
- Resolve secrets server-side at execution time; redact logs, traces, screenshots, and artifacts.
- Persist action intent before side effects and verify the resulting external state.
- Require approvals for publication, messaging, deletion, payments, account changes, and other consequential operations.

---

## 6. Evaluation: how ARSY earns capability claims

Do not define success as "it can call tools" or "it remembers a conversation".

### 6.1 Evaluation dimensions

1. Task completion and correctness.
2. Multi-step planning and replanning.
3. Evidence grounding and citation correctness.
4. Memory retrieval precision/recall and temporal consistency.
5. Long-horizon continuity and recovery after interruption.
6. Generalization to held-out tasks and unfamiliar tool combinations.
7. Calibration, abstention, and uncertainty handling.
8. Tool safety, permission adherence, and resistance to prompt injection.
9. Reliability under provider timeout, malformed output, and tool failure.
10. End-to-end latency, token cost, tool count, and unnecessary-step ratio.

### 6.2 Benchmark portfolio

| Suite | Intended use |
|---|---|
| GAIA | General assistant tasks involving research, reasoning, browsing, and tools |
| AgentBench | Diverse interactive environments and multi-turn agent behavior |
| OSWorld / OSWorld-Human | Computer-use success and efficiency |
| LongMemEval / LoCoMo | Long-term conversational memory and retrieval |
| SWE-bench / SWE-agent patterns | Software-task decomposition and repository interaction, if relevant |
| MoonWitness task suite | First-party tasks from research, publishing, monitoring, and operations with authorized fixtures |

Benchmark licenses, dataset terms, hidden test availability, contamination risks, and data privacy must be reviewed before importing datasets. Keep public benchmark scores separate from internal task-suite scores.

### 6.3 Capability scorecard

Every benchmark run records:
- model/provider and model version;
- runtime commit SHA and configuration version;
- dataset/split and evaluation harness version;
- sample count and exclusions;
- task success and partial success;
- error categories and safety violations;
- latency, token use, tool calls, and retries;
- memory read/write provenance;
- human-review outcomes where applicable.

Never publish an AGI label from a single score or benchmark. Report capability boundaries and known failure modes.

---

## 7. Dependency policy

### Excluded from the ARSY core

- OpenClaw;
- LangChain and LangGraph;
- CrewAI and AutoGen;
- smolagents and browser-use;
- any external agent SDK/framework that owns the agent loop, memory, planning, or policy.

### Allowed as narrow replaceable infrastructure

- foundation-model inference APIs and compatible providers;
- Node.js, TypeScript, SQLite/libSQL, PostgreSQL, Docker;
- Playwright as a browser automation library;
- protocol adapters such as MCP, only at the boundary and never as the policy authority;
- embedding/reranking providers behind interfaces if evaluation demonstrates measurable value.

### Removal rule

Do not remove a package merely because it is on the exclusion list. First search manifests, imports, build scripts, runtime paths, lockfile references, and tests. Remove only a dependency proven unused or redundant, with a focused regression test and exact-SHA GitHub Actions evidence.

---

## 8. Implementation sequence

The detailed execution backlog is managed only in GitHub Issues. This document is the architecture reference, not a second task tracker.

### Phase A — Reconciliation and foundations
- Ratify ARSY scope and no-external-agent-framework boundary.
- Audit existing agent runtime, model router, conversation store, search, connector, workflow, and QlOrm capabilities.
- Decide canonical domain/addon ownership.
- Resolve transaction and atomic-claim prerequisites.

### Phase B — Native runtime contracts
- Define typed run, step, event, plan, tool, policy, approval, and provider contracts.
- Add structured model output validation and error taxonomy.
- Build context assembly with token budgets and provenance.
- Implement the minimal single-agent execution loop.

### Phase C — Governed execution
- Add tool registry and capability grants.
- Add deny-by-default policy and approval gates.
- Add durable run/step persistence, idempotency, leases, cancellation, retry, and recovery.
- Add append-only trace/evidence records and verification steps.

### Phase D — Memory and learning
- Add episodic memory and retrieval.
- Add semantic consolidation and temporal correction.
- Add privacy, retention, deletion, and provenance.
- Add reflection and evaluated skill promotion.

### Phase E — Generalization and reality interfaces
- Add planner/replanner and bounded world/context model.
- Add benchmark harness and held-out MoonWitness task suite.
- Add isolated Playwright executor and authorized API adapters.
- Add YouTube monitoring/publishing and official WhatsApp API adapters as separately governed tools.

### Phase F — Operational readiness
- Add System Observatory run/step/evidence views.
- Add incident handling, audit search, metrics, and resource budgets.
- Conduct security red-team and failure-injection exercises.
- Publish a measured capability report; no AGI claim without evidence.

---

## 9. Acceptance gates for every implementation issue

- One stable scope and one owning package/domain.
- No duplicate provider, connector, workflow, conversation, or persistence authority.
- Typed inputs/outputs and explicit validation.
- ACL deny-by-default and owner isolation.
- Secrets and private fields never reach browser DTOs or logs.
- Failure is explicit; no silent fallback that reports success.
- Idempotency and recovery for external side effects.
- Tests cover positive, negative, boundary, authorization, and failure cases.
- Build, lint, typecheck, tests, and web budget are verified only by GitHub Actions on the exact commit SHA.
- Update the canonical GitHub Wiki when a package/domain boundary or architecture decision changes.
- Keep task status only in GitHub Issues.

---

## 10. Source register

### Papers
- Park et al., *Generative Agents: Interactive Simulacra of Human Behavior*, UIST 2023. https://arxiv.org/abs/2304.03442
- Packer et al., *MemGPT: Towards LLMs as Operating Systems*, 2023. https://arxiv.org/abs/2310.08560
- Shinn et al., *Reflexion: Language Agents with Verbal Reinforcement Learning*, NeurIPS 2023. https://arxiv.org/abs/2303.11366
- Wang et al., *Voyager: An Open-Ended Embodied Agent with Large Language Models*, TMLR 2024. https://arxiv.org/abs/2305.16291
- Liu et al., *AgentBench: Evaluating LLMs as Agents*, ICLR 2024. https://arxiv.org/abs/2308.03688
- Mialon et al., *GAIA: a benchmark for General AI Assistants*, ICLR 2024. https://arxiv.org/abs/2311.12983
- Yang et al., *SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering*, NeurIPS 2024. https://arxiv.org/abs/2405.15793
- Abhyankar et al., *OSWorld-Human: Benchmarking the Efficiency of Computer-Use Agents*, MLSys 2026. https://proceedings.mlsys.org/paper_files/paper/2026/hash/5edb57c05c81d04beb716ef1d542fe9e-Abstract-Conference.html

### Repositories
- https://github.com/thedotmack/claude-mem
- https://github.com/vectorize-io/hindsight
- https://github.com/beenuar/AiSOC
- https://github.com/CopilotKit/OpenBot
- https://github.com/THUDM/AgentBench
- https://github.com/noahshinn024/reflexion
- https://github.com/joonspk-research/generative_agents
- https://github.com/xlang-ai/OSWorld

### Specifications and documentation
- OpenAI Agents SDK guide: https://developers.openai.com/api/docs/guides/agents/sdk
- MCP tools specification: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/server/tools.mdx
- MCP authorization specification: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-11-25/basic/authorization.mdx
- SQLite WAL: https://www.sqlite.org/wal.html

---

## 11. Status and limitations

This document records research, architecture, repository findings, and an implementation sequence. It does not claim that ARSY runtime modules, new addons, migrations, scheduler workers, memory stores, browser executors, or benchmark harnesses have been implemented.

The GitHub Wiki is the project's canonical human-authored documentation surface. Repository documentation and this PR prepare the detailed proposal; Wiki synchronization must be completed through an authorized Wiki editing path.
