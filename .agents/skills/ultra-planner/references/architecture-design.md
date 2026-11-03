# Architecture Design Reference

## Architecture Design Process

### 1. Architecture Decision Framework

For each significant architectural decision:

```
Decision: [What is being decided]
Context: [Why this decision is needed now]
Options: [At least 2 credible alternatives]
Criteria: [Evaluation criteria with weights]
Evaluation: [Score each option against criteria]
Recommendation: [Selected option with rationale]
Trade-offs: [What is gained/lost]
Risks: [Associated risks and mitigations]
Reversibility: [How hard to change later]
```

### 2. Architecture Styles & When to Use

| Style | Best For | Avoid When | Complexity |
|-------|----------|------------|------------|
| **Modular Monolith** | Single team, clear domains, low scaling need | Multiple teams, independent deployment needs | Low |
| **Microservices** | Multiple teams, independent scaling, polyglot | Small team, simple domain, low traffic | Very High |
| **Serverless** | Event-driven, variable load, no ops capacity | Long-running, stateful, predictable high load | Medium |
| **Event-Driven** | Loose coupling, async workflows, audit trail | Simple CRUD, low latency requirements | High |
| **Layered** | Traditional apps, clear separation | High performance, complex domain logic | Low |
| **Clean/Hexagonal** | Testability, framework independence | Simple apps, rapid prototyping | Medium |
| **CQRS/Event Sourcing** | Complex domain, audit, temporal queries | Simple CRUD, team unfamiliar | Very High |

### 3. System Boundary Definition

**Application Boundaries:**
- What constitutes "the system" vs external dependencies
- Ownership: which team owns which boundary
- Communication: sync (REST/gRPC) vs async (events)
- Data ownership: who is system of record

**Domain Boundaries (Bounded Contexts):**
- Business capability alignment
- Ubiquitous language consistency
- Data model independence
- Team ownership alignment

**Module Boundaries (Packages):**
- Single responsibility
- High cohesion, low coupling
- Explicit public interface
- Versioning strategy

### 4. Dependency Rules

**Direction Principles:**
- Domain → Application → Infrastructure (never reverse)
- Shared packages: only types, interfaces, utilities
- No circular dependencies (enforce with tooling)
- Feature packages depend on core, not vice versa

**Enforcement:**
```
# Package.json "dependabot" or custom script
# ESLint import/order rules
# Madge for circular detection
# Architectural decision tests
```

### 5. Communication Patterns

| Pattern | Use Case | Coupling | Latency | Complexity |
|---------|----------|----------|---------|------------|
| **Sync REST** | Query, command, CRUD | Medium | Low | Low |
| **Sync gRPC** | High-perf internal, streaming | Medium | Very Low | Medium |
| **Async Events** | Domain events, notifications | Low | Variable | Medium |
| **Async Commands** | Background jobs, workflows | Low | Variable | Medium |
| **Message Queue** | Reliable delivery, retries | Low | Higher | High |
| **Event Sourcing** | Audit, temporal, replay | Low | Variable | Very High |

### 6. Failure Boundary Design

**Principles:**
- Failures don't cascade across boundaries
- Each boundary has: timeout, retry, circuit breaker, fallback
- Bulkhead: separate resource pools per downstream
- Graceful degradation: reduced function vs total failure

**Pattern:**
```
Client → Circuit Breaker → Timeout → Retry (idempotent) → Fallback
                    ↓
              Metrics/Alerting
```

### 7. Architecture Documentation Structure

For each architecture level:

| Level | Document | Audience | Detail |
|-------|----------|----------|--------|
| **System** | System Context Diagram (C4 L1) | All | High-level |
| **Container** | Container Diagram (C4 L2) | Engineers | Services, DBs, queues |
| **Component** | Component Diagram (C4 L3) | Team | Modules, responsibilities |
| **Code** | Class/Module diagrams | Developers | Implementation |

**Required Artifacts:**
- Context diagram (system + users + external systems)
- Container diagram (deployable units + communication)
- Component diagram (for complex containers)
- Sequence diagrams (critical workflows)
- Data model (ERD or equivalent)
- Deployment diagram (infrastructure)
- ADR index (if ADRs exist)

### 8. Architecture Evaluation Criteria

| Criterion | Weight | Assessment Method |
|-----------|--------|-------------------|
| **Functional Fit** | 25% | Requirements traceability |
| **Modularity** | 15% | Coupling/cohesion metrics |
| **Scalability** | 15% | Load test, theoretical limits |
| **Maintainability** | 15% | Change impact analysis |
| **Operability** | 10% | Observability, deployment |
| **Security** | 10% | Threat model, boundaries |
| **Cost** | 10% | Infrastructure estimate |

### 9. Anti-Patterns to Avoid

| Anti-Pattern | Symptom | Fix |
|--------------|---------|-----|
| **Distributed Monolith** | Services share DB, deploy together | Extract true bounded contexts |
| **God Service** | One service > 30% of codebase | Decompose by domain |
| **Chatty Services** | Sync calls for every operation | Batch, async, denormalize |
| **Shared Database** | Multiple services read/write same tables | API-only access, data ownership |
| **Circular Dependencies** | A→B→C→A imports | Invert dependency, extract shared |
| **Leaky Abstraction** | Implementation details in interface | Hide behind interface, DDD |
| **Premature Microservices** | Microservices before proven need | Start modular monolith |
| **Framework Coupling** | Business logic in framework code | Clean architecture, ports/adapters |

## Architecture Design Checklist

- [ ] System context defined (users, external systems)
- [ ] Container diagram complete (deployable units)
- [ ] Component diagrams for complex containers
- [ ] Domain boundaries identified and documented
- [ ] Package/module boundaries defined
- [ ] Dependency direction rules established
- [ ] Communication patterns selected per use case
- [ ] Failure boundaries designed
- [ ] Security boundaries defined
- [ ] Data ownership assigned
- [ ] Sequence diagrams for critical workflows
- [ ] Deployment architecture defined
- [ ] Observability strategy defined
- [ ] Technology choices justified
- [ ] Trade-offs documented for key decisions
- [ ] Reversibility assessed
- [ ] Anti-patterns reviewed and avoided