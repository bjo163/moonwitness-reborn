# Implementation Readiness Reference

## Implementation Readiness Gate

A plan is not implementation-ready merely because it contains a roadmap. Before declaring readiness, verify all criteria below.

### Readiness Classification

| Classification | Criteria | Action |
|----------------|----------|--------|
| **READY** | All mandatory criteria met, no blocking unknowns | Proceed to implementation |
| **CONDITIONALLY READY** | Mandatory criteria met, but identified prerequisites incomplete | Proceed after prerequisites resolved |
| **NOT READY** | Critical criteria unmet, blocking unknowns, or contradictions | Return to planning |

### Mandatory Readiness Criteria

| # | Criterion | Verification Method | Status |
|---|-----------|---------------------|--------|
| 1 | **Requirements Clear** | All FRs testable, NFRs measurable, traceability matrix complete | ☐ |
| 2 | **Scope Defined** | In-scope/out-of-scope explicit, boundaries documented | ☐ |
| 3 | **Architecture Coherent** | No circular deps, clear boundaries, dependency direction correct | ☐ |
| 4 | **Component Responsibilities Clear** | Every package/module has single owner, explicit public API | ☐ |
| 5 | **Dependencies Identified** | Internal/external deps mapped, versions locked, compatibility verified | ☐ |
| 6 | **Interfaces Defined** | API contracts (OpenAPI), event schemas, repo interfaces specified | ☐ |
| 7 | **Data Contracts Defined** | Entities, schemas, constraints, migration behavior specified | ☐ |
| 8 | **Security Requirements Addressed** | Threat model complete, authN/authZ designed, data classification done | ☐ |
| 9 | **Failure Scenarios Considered** | Error handling, timeouts, retries, circuit breakers, fallbacks specified | ☐ |
| 10 | **Migration Constraints Documented** | Data migration plan, compatibility matrix, rollback procedures | ☐ |
| 11 | **Testing Strategy Exists** | Unit/integration/contract/E2E scope, tools, coverage targets | ☐ |
| 12 | **Acceptance Criteria Verifiable** | Every AC has test method (automated preferred), pass/fail defined | ☐ |
| 13 | **Risks Identified** | Risk register complete with likelihood, impact, mitigation | ☐ |
| 14 | **Open Questions Visible** | All unknowns documented with owner and target resolution date | ☐ |
| 15 | **Conflicting Specifications Resolved** | Cross-spec validation passed, no contradictions | ☐ |
| 16 | **Implementation Sequencing Sensible** | Dependency order respected, parallelization identified, buffer included | ☐ |

### Verification Methods

| Criterion | Verification Approach |
|-----------|----------------------|
| Requirements Clear | Review traceability matrix, attempt to write test for each FR/NFR |
| Architecture Coherent | Run `madge --circular`, review dependency graph, verify layer rules |
| Component Responsibilities | Review package `index.ts` exports, verify single domain per package |
| Interfaces Defined | Validate OpenAPI spec, check event schema registry, review repo interfaces |
| Data Contracts | Review Prisma/Drizzle schema, verify constraints, check migration scripts |
| Security | Review threat model (STRIDE), verify authN/authZ design, check data classification |
| Failure Scenarios | Review each component for: timeout, retry, circuit breaker, fallback, idempotency |
| Migration | Review expand-contract steps, verify dual-write, check rollback time targets |
| Testing | Review test plan: pyramid, tools, coverage targets, contract test strategy |
| Acceptance Criteria | For each AC, identify: automated test / manual test / inspection / demo |
| Risks | Review risk register: all > Medium have mitigation, owner, trigger |
| Open Questions | List all UNKNOWN/ASSUMED items, assign owner, set deadline |
| Conflicts | Run cross-spec validation: API↔Data, Events↔Consumers, Types↔Implementations |
| Sequencing | Review phase dependency graph, verify no cycles, check parallel tracks |

### Conditional Readiness Items

These may be resolved during early implementation but must be tracked:

| Item | Typical Resolution | Tracking |
|------|-------------------|----------|
| Third-party API details | During integration sprint | Spike ticket |
| Exact performance baseline | After first load test | Benchmark ticket |
| Team capacity changes | Sprint planning | Capacity tracker |
| Stakeholder feedback on UX | Design review | Design review ticket |
| Compliance interpretation | Legal review | Compliance ticket |

### Readiness Assessment Template

```markdown
# Implementation Readiness Assessment: [Project/Feature]

## Assessment Info
- **Date:** YYYY-MM-DD
- **Assessor:** [Name/Role]
- **Spec Version:** [Version]
- **Previous Assessment:** [Date or "First"]

## Criteria Evaluation

| # | Criterion | Status | Evidence | Blockers |
|---|-----------|--------|----------|----------|
| 1 | Requirements Clear | ✅/⚠️/❌ | [Traceability matrix v1.2] | |
| 2 | Scope Defined | ✅/⚠️/❌ | [Scope doc section 3] | |
| 3 | Architecture Coherent | ✅/⚠️/❌ | [Madge output: 0 circular] | |
| 4 | Component Responsibilities | ✅/⚠️/❌ | [Package index review] | |
| 5 | Dependencies Identified | ✅/⚠️/❌ | [Dep matrix v1.0] | |
| 6 | Interfaces Defined | ✅/⚠️/❌ | [OpenAPI v3.0 valid] | |
| 7 | Data Contracts Defined | ✅/⚠️/❌ | [Prisma schema + migrations] | |
| 8 | Security Requirements | ✅/⚠️/❌ | [Threat model v2.1] | |
| 9 | Failure Scenarios | ✅/⚠️/❌ | [Spec section 8] | |
| 10 | Migration Constraints | ✅/⚠️/❌ | [Migration plan v1.3] | |
| 11 | Testing Strategy | ✅/⚠️/❌ | [Test plan v1.0] | |
| 12 | Acceptance Criteria | ✅/⚠️/❌ | [AC matrix: 47/47 verifiable] | |
| 13 | Risks Identified | ✅/⚠️/❌ | [Risk register: 12 risks] | |
| 14 | Open Questions | ✅/⚠️/❌ | [3 unknowns, owners assigned] | |
| 15 | Conflicts Resolved | ✅/⚠️/❌ | [Cross-spec validation passed] | |
| 16 | Sequencing Sensible | ✅/⚠️/❌ | [Phase graph: no cycles] | |

## Open Questions (from Criterion 14)

| Question | Owner | Target Date | Impact if Unresolved |
|----------|-------|-------------|---------------------|
| [Question] | [Name] | YYYY-MM-DD | [Impact] |

## Conditional Items

| Item | Resolution Plan | Target Date |
|------|----------------|-------------|
| [Item] | [Plan] | YYYY-MM-DD |

## Overall Classification

**Classification:** READY / CONDITIONALLY READY / NOT READY

**Rationale:**
[Summary of why this classification]

**Conditions (if CONDITIONALLY READY):**
1. [Condition 1] — Target: [Date]
2. [Condition 2] — Target: [Date]

**Blockers (if NOT READY):**
1. [Blocker 1] — Owner: [Name] — Target: [Date]
2. [Blocker 2] — Owner: [Name] — Target: [Date]

## Sign-off
- **Technical Lead:** [Name] — [Date] — ✅/❌
- **Engineering Manager:** [Name] — [Date] — ✅/❌
- **Product Owner:** [Name] — [Date] — ✅/❌
- **Security Lead:** [Name] — [Date] — ✅/❌ (if security-relevant)
```

### Implementation Readiness Checklist

- [ ] All 16 mandatory criteria assessed
- [ ] Evidence cited for each criterion
- [ ] Blockers identified with owners and dates
- [ ] Open questions tracked with owners and deadlines
- [ ] Conditional items have resolution plans
- [ ] Overall classification assigned with rationale
- [ ] Required sign-offs obtained
- [ ] Assessment versioned and dated