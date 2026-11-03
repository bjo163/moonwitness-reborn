# Gap Analysis Reference

## Gap Analysis Process

### 1. When to Perform Gap Analysis

- Architecture refactoring projects
- Migration planning
- Feature parity assessment
- Compliance assessment
- Technical debt reduction
- Platform modernization

### 2. Gap Analysis Framework

**Inputs:**
- Current State (verified implementation)
- Target State (requirements, architecture, specifications)
- Constraints (budget, timeline, resources, dependencies)

**Outputs:**
- Gap Matrix
- Prioritized Action Plan
- Risk Register
- Migration Strategy

### 3. Gap Classification

| Gap Type | Description | Examples |
|----------|-------------|----------|
| **Capability Gap** | Missing functionality | No payment integration, no audit logging |
| **Quality Gap** | Non-functional deficiency | p99 > 2s (target 500ms), no HA |
| **Architecture Gap** | Structural misalignment | Circular dependencies, god module |
| **Data Gap** | Schema/integrity issues | Missing FK, no RLS, no backup |
| **Security Gap** | Vulnerability or missing control | No MFA, secrets in code, no WAF |
| **Testing Gap** | Insufficient verification | No integration tests, no contract tests |
| **Documentation Gap** | Missing or outdated docs | No API docs, outdated architecture |
| **Operational Gap** | Missing ops capability | No observability, no runbooks |
| **Skill Gap** | Team capability missing | No Kubernetes expertise, no Rust |
| **Process Gap** | Missing engineering practice | No code review, no CI gate |

### 4. Gap Matrix Template

```markdown
# Gap Analysis: [Project/Context]

## Current State Summary
- Architecture: [Description]
- Key Technologies: [List]
- Team: [Size, skills]
- Constraints: [Budget, timeline, compliance]

## Target State Summary
- Architecture: [Description]
- Key Technologies: [List]
- Requirements: [Link to requirements spec]
- NFR Targets: [Link to NFRs]

## Gap Matrix

| Gap ID | Gap Type | Current State | Target State | Gap Description | Impact | Effort | Priority | Dependencies | Recommended Action |
|--------|----------|---------------|--------------|-----------------|--------|--------|----------|--------------|-------------------|
| GAP-001 | Capability | No payment integration | Stripe + webhook | Missing billing capability | HIGH | L | P1 | API contracts | Implement ql_billing |
| GAP-002 | Quality | p99 2.5s | p99 < 500ms | API latency 5x target | HIGH | M | P1 | DB indexes, caching | Optimize queries, add Redis |
| GAP-003 | Architecture | Circular: ql_user <-> ql_auth | Unidirectional: ql_auth -> ql_user | Circular dependency blocks deployment | HIGH | S | P0 | Package restructuring | Extract shared types |
| GAP-004 | Security | Secrets in .env files | Vault + External Secrets | Credentials in repo | CRITICAL | S | P0 | Vault setup | Migrate to Vault |
| GAP-005 | Testing | 40% unit, 0% integration | 80% unit, 60% integration | Insufficient test coverage | MEDIUM | L | P2 | Test infra | Add integration test suite |
| GAP-006 | Data | No FK constraints | Full referential integrity | Data corruption risk | HIGH | M | P1 | Migration window | Add FKs with validation |
| GAP-007 | Documentation | No API docs | OpenAPI + guides | Consumers can't integrate | MEDIUM | S | P2 | Spec completion | Generate OpenAPI |

## Priority Definitions
- **P0** — Blocking, immediate (security, data loss, deployment blocker)
- **P1** — High impact, next sprint (critical capability, major quality)
- **P2** — Medium impact, planned (quality, testing, documentation)
- **P3** — Low impact, backlog (nice-to-have, tech debt)

## Effort Scale
- **XS** — < 1 day
- **S** — 1-3 days
- **M** — 1-2 weeks
- **L** — 2-4 weeks
- **XL** — 1-3 months
- **XXL** — 3+ months

## Action Plan

### Phase 1: Critical (P0) — Week 1-2
- [ ] GAP-003: Resolve circular dependency
- [ ] GAP-004: Migrate secrets to Vault

### Phase 2: High Priority (P1) — Week 3-6
- [ ] GAP-001: Implement billing integration
- [ ] GAP-002: Optimize API performance
- [ ] GAP-006: Add FK constraints

### Phase 3: Medium Priority (P2) — Month 2-3
- [ ] GAP-005: Build integration test suite
- [ ] GAP-007: Generate API documentation

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Circular dependency fix breaks auth | Medium | High | Feature flag, incremental, rollback plan |
| Vault migration causes downtime | Low | Critical | Blue-green, read-only period |
| Performance optimization introduces bugs | Medium | Medium | Comprehensive tests, canary deploy |

## Success Criteria
- [ ] All P0 gaps resolved
- [ ] All P1 gaps resolved
- [ ] Test coverage > 80% unit, > 60% integration
- [ ] API p99 < 500ms sustained
- [ ] Zero secrets in repository
- [ ] OpenAPI spec published and current
```

### 5. Current State Verification

**Critical:** Distinguish verified vs assumed current state.

| Verification Method | Applies To | Confidence |
|---------------------|------------|------------|
| Code inspection | Implementation, architecture | HIGH |
| Tool output (lint, test, build) | Quality, testing | HIGH |
| Config file review | Infrastructure, deployment | HIGH |
| Database schema inspection | Data architecture | HIGH |
| Running system observation | Performance, ops | HIGH |
| Team interview | Process, skills | MEDIUM |
| Documentation review | Docs, requirements | MEDIUM (verify against code) |
| Assumption | Unverified areas | LOW |

### 6. Gap Analysis for Specific Scenarios

#### Architecture Refactoring
```
Current: Monolithic deployment, shared DB
Target: Modular monolith, separate schemas per domain
Gaps: Package boundaries, data ownership, shared kernel, migration strategy
```

#### Technology Migration
```
Current: Express + JavaScript + MongoDB
Target: Fastify + TypeScript + PostgreSQL
Gaps: Language migration, framework rewrite, data migration, team training
```

#### Compliance (SOC2, GDPR, HIPAA)
```
Current: Basic auth, no audit log, data in US
Target: MFA, full audit trail, EU data residency, encryption
Gaps: Auth upgrade, audit system, multi-region, field-level encryption
```

### 7. Gap Analysis Checklist

- [ ] Current state verified (not assumed)
- [ ] Target state clearly defined (requirements + architecture)
- [ ] All gap types considered
- [ ] Gap matrix complete with all fields
- [ ] Impact assessed (business, technical, risk)
- [ ] Effort estimated with confidence level
- [ ] Priorities assigned (P0-P3)
- [ ] Dependencies between gaps identified
- [ ] Action plan phased and sequenced
- [ ] Risks identified for each major action
- [ ] Success criteria defined and measurable
- [ ] Stakeholder review completed