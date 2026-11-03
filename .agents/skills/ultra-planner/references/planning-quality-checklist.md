# Planning Quality Checklist Reference

## Comprehensive Quality Gates for Planning Artifacts

### 1. Requirements Quality

| Check | Pass Criteria |
|-------|---------------|
| **Completeness** | All user journeys covered, no missing critical features |
| **Clarity** | Each requirement unambiguous, single interpretation |
| **Testability** | Every FR has acceptance criteria, every NFR has measurable target |
| **Traceability** | Each requirement linked to source, spec sections, test cases |
| **Prioritization** | MoSCoW assigned, stakeholder alignment confirmed |
| **Conflict-Free** | No contradictory requirements, trade-offs explicit |
| **Scope Boundaries** | In-scope/out-of-scope explicit, no scope creep vectors |
| **Feasibility** | Technical feasibility assessed, constraints documented |

### 2. Architecture Quality

| Check | Pass Criteria |
|-------|---------------|
| **Functional Fit** | Architecture satisfies all requirements (traceability) |
| **Modularity** | Clear boundaries, high cohesion, low coupling, no cycles |
| **Scalability** | Theoretical limits identified, scaling strategy defined |
| **Maintainability** | Change impact localized, clear ownership, low cognitive load |
| **Operability** | Observability designed, deployment strategy clear, rollback ready |
| **Security** | Trust boundaries defined, threat model complete, least privilege |
| **Cost-Effectiveness** | Infrastructure estimate reasonable, no gold-plating |
| **Technology Justification** | Every major tech choice has documented rationale |
| **Reversibility** | Key decisions have reversal conditions documented |

### 3. Specification Quality

| Check | Pass Criteria |
|-------|---------------|
| **Completeness** | All applicable template sections filled |
| **Consistency** | No internal contradictions, cross-spec alignment verified |
| **Implementability** | Developer can implement without guessing |
| **Traceability** | Stable IDs, requirements ↔ specs ↔ tests ↔ ACs |
| **Verifiability** | Every AC has pass/fail test method |
| **Version Control** | Semver, change log, baseline process |
| **Review Status** | Stakeholder review completed, sign-offs obtained |
| **Constraints Documented** | Conventions, prohibited approaches, migration requirements |

### 4. Data Architecture Quality

| Check | Pass Criteria |
|-------|---------------|
| **Ownership Clear** | Every entity has single writer |
| **Constraints at DB Level** | PK, FK, NOT NULL, CHECK, UNIQUE enforced |
| **Indexing Strategy** | FK indexed, query patterns covered, no unused indexes |
| **Migration Safety** | Expand-contract, reversible, tested, zero-downtime |
| **Multi-Tenancy** | Pattern chosen, implemented, tested |
| **Retention Defined** | Per data type, compliant, automated |
| **Backup/Recovery** | RPO/RTO defined, tested, cross-region |
| **PII Protected** | Identified, encrypted, deletable, audited |

### 5. API Quality

| Check | Pass Criteria |
|-------|---------------|
| **Contract Complete** | OpenAPI valid, all endpoints, all codes, examples |
| **REST Conventions** | Nouns, plural, proper HTTP semantics, status codes |
| **Validation Layers** | Gateway → Framework → Application → Database |
| **Error Consistency** | Standard format, taxonomy, request IDs |
| **Versioning** | Strategy defined, backward compatibility, deprecation |
| **Resilience** | Timeouts, retries (idempotent only), circuit breakers |
| **Security** | AuthN/AuthZ, rate limiting, input validation, headers |
| **Documentation** | Published, current, getting started, SDKs |

### 6. Security Quality

| Check | Pass Criteria |
|-------|---------------|
| **Zero Trust** | Never trust, always verify, least privilege |
| **AuthN** | MFA, short-lived tokens, secure flows, PKCE |
| **AuthZ** | RBAC/ABAC, object-level, default deny |
| **Secrets** | Never in code, rotated, audited, Vault/KMS |
| **Data Protection** | Classified, TLS 1.2+, AES-256-GCM, field-level PII |
| **Validation** | All layers, parameterized queries, output encoding |
| **Headers** | CSP, HSTS, X-Frame-Options, etc. |
| **Logging** | Security events, structured, no secrets, alerting |
| **Supply Chain** | Lockfiles, scanning, provenance, minimal images |
| **Infrastructure** | Private networks, mTLS, RBAC, runtime security |

### 7. Roadmap & Phasing Quality

| Check | Pass Criteria |
|-------|---------------|
| **Vision Alignment** | Roadmap delivers strategic goals |
| **Horizon Clarity** | Now/Next/Later/Future appropriately detailed |
| **Phase Coherence** | Each phase has objective, entry/exit criteria, deliverables |
| **Dependency Graph** | No cycles, critical path identified, parallel tracks clear |
| **Capacity Realistic** | Team capacity matches allocation, 20% buffer |
| **Risk Awareness** | Risks per phase, mitigations, contingencies |
| **Review Cadence** | Weekly/bi-weekly/monthly/quarterly defined |
| **Communication Plan** | Internal/stakeholder/customer channels defined |

### 8. Implementation Readiness

| Check | Pass Criteria |
|-------|---------------|
| **All 16 Criteria Met** | See implementation-readiness.md |
| **Evidence Cited** | Not assertions — code refs, tool output, doc links |
| **Blockers Tracked** | Owners, dates, impact assessed |
| **Open Questions** | Owners, deadlines, escalation path |
| **Sign-offs Obtained** | Technical, Engineering, Product, Security leads |

### 9. Handoff Quality (to Issue Forge)

| Check | Pass Criteria |
|-------|---------------|
| **Spec Coverage** | All P0/P1 specs READY |
| **Traceability** | Requirements → Specs → ACs → Issues |
| **Issue Granularity** | Independent, verifiable, right-sized |
| **Dependencies** | Correctly modeled, no cycles |
| **Parallelization** | Tracks identified, mutual exclusion handled |
| **Labels/Milestones** | Consistent, automation-ready |

### 10. MoonWitness Compliance (When Applicable)

| Check | Pass Criteria |
|-------|---------------|
| **Package Structure** | ql_* packages, single domain, explicit exports |
| **Conventions** | Branching, commits, versioning, promotion |
| **Design System** | ql_ui tokens/components, MoonWitness aesthetic |
| **Quality Gates** | TypeScript strict, ESLint, test pyramid, security scan |
| **Documentation** | `spec/` structure, living docs |
| **Cross-Repo** | moonclient SDK, OpenAPI, shared types |
| **ADR Policy** | Only when requested, decisions in specs |

## Master Planning Quality Gate

Before declaring any planning artifact complete:

```
PLANNING QUALITY GATE — [Artifact Name]

## Requirements
☐ Complete  ☐ Clear  ☐ Testable  ☐ Traceable  ☐ Prioritized  ☐ Conflict-Free  ☐ Scoped  ☐ Feasible

## Architecture
☐ Functional Fit  ☐ Modularity  ☐ Scalability  ☐ Maintainability  ☐ Operability  ☐ Security  ☐ Cost  ☐ Justified  ☐ Reversible

## Specifications
☐ Complete  ☐ Consistent  ☐ Implementable  ☐ Traceable  ☐ Verifiable  ☐ Versioned  ☐ Reviewed  ☐ Constrained

## Data
☐ Ownership  ☐ Constraints  ☐ Indexing  ☐ Migration  ☐ Tenancy  ☐ Retention  ☐ Backup  ☐ PII

## API
☐ Contract  ☐ REST  ☐ Validation  ☐ Errors  ☐ Versioning  ☐ Resilience  ☐ Security  ☐ Docs

## Security
☐ Zero Trust  ☐ AuthN  ☐ AuthZ  ☐ Secrets  ☐ Data  ☐ Validation  ☐ Headers  ☐ Logging  ☐ Supply Chain  ☐ Infra

## Roadmap
☐ Vision  ☐ Horizons  ☐ Phases  ☐ Dependencies  ☐ Capacity  ☐ Risks  ☐ Cadence  ☐ Communication

## Readiness
☐ All 16 Criteria  ☐ Evidence  ☐ Blockers  ☐ Questions  ☐ Sign-offs

## Handoff
☐ Spec Coverage  ☐ Traceability  ☐ Granularity  ☐ Dependencies  ☐ Parallelization  ☐ Automation

## MoonWitness (if applicable)
☐ Packages  ☐ Conventions  ☐ Design System  ☐ Quality Gates  ☐ Docs  ☐ Cross-Repo  ☐ ADR Policy

## OVERALL:  PASS / CONDITIONAL / FAIL

### Conditions (if CONDITIONAL):
1. [Condition] — Owner: [Name] — Due: [Date]

### Blockers (if FAIL):
1. [Blocker] — Owner: [Name] — Due: [Date]

**Assessed By:** [Name] — **Date:** [YYYY-MM-DD] — **Signature:** [Name]
```