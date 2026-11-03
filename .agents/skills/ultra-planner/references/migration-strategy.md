# Migration Strategy Reference

## Migration Strategy Framework

### 1. Migration Categories

| Category | Examples | Complexity | Typical Duration |
|----------|----------|------------|------------------|
| **Framework Upgrade** | Express → Fastify, React 17→18 | Low-Medium | Days-Weeks |
| **Language Migration** | JavaScript → TypeScript, Python 2→3 | Medium | Weeks-Months |
| **Database Migration** | MongoDB → PostgreSQL, MySQL → PostgreSQL | High | Months |
| **ORM Migration** | Prisma → Drizzle, TypeORM → Prisma | Medium | Weeks |
| **API Migration** | REST → GraphQL, v1 → v2 | Medium-High | Months |
| **Infrastructure Migration** | VMs → K8s, AWS → GCP, Self-hosted → Managed | High | Months |
| **Auth Migration** | Custom → Auth0, Session → JWT | Medium | Weeks |
| **Package System** | npm → pnpm, Monorepo restructure | Low-Medium | Days-Weeks |
| **Architecture Migration** | Monolith → Microservices, Layered → Clean | Very High | Quarters-Years |

### 2. Migration Principles

1. **Strangler Fig Pattern** — Incrementally replace, never big bang
2. **Backward Compatibility** — Old and new coexist during transition
3. **Reversibility** — Every step must be rollbackable
4. **Observability** — Monitor both old and new paths
5. **Data Integrity** — Zero data loss, verified at each step
6. **User Impact** — Zero or minimal user-facing disruption
7. **Team Velocity** — Don't halt feature work entirely

### 3. Migration Patterns

#### Expand-Contract (Database Schema)
```
Phase 1 (Expand): Add new column/table, dual-write, backfill
  - Add column nullable
  - Write to both old and new
  - Backfill historical data
  - Verify data consistency

Phase 2 (Migrate): Switch reads to new column
  - Update read paths
  - Validate with shadow reads
  - Monitor for discrepancies

Phase 3 (Contract): Remove old column
  - Stop dual-write
  - Drop old column/index
  - Clean up code
```

#### Strangler Fig (Service Extraction)
```
Phase 1: Identify bounded context
  - Define new service boundaries
  - Create new package/service
  - Implement interface in old system

Phase 2: Proxy & Dual-write
  - Add proxy/facade
  - Route subset of traffic to new
  - Dual-write to old and new
  - Compare results

Phase 3: Cutover
  - Increase traffic to new
  - Monitor error rates, latency
  - Decommission old code
```

#### Parallel Run (Algorithm/Logic Migration)
```
Phase 1: Implement new logic alongside old
  - New function/class with same interface
  - Feature flag controls which executes

Phase 2: Shadow mode
  - Execute both, compare results
  - Log discrepancies
  - Fix new logic until parity

Phase 3: Switch
  - Flip feature flag
  - Monitor for regressions
  - Remove old code
```

### 4. Migration Planning Template

```markdown
# Migration Plan: [From] → [To]

## Context
- Current System: [Description]
- Target System: [Description]
- Business Driver: [Why migrate]
- Timeline Constraint: [Hard/soft deadline]

## Scope
### In Scope
- [Component 1]
- [Component 2]

### Out of Scope
- [Component] — Reason: [Why]

## Current State Analysis
### Inventory
| Component | Technology | Lines of Code | Tests | Dependencies | Owner |
|-----------|------------|---------------|-------|--------------|-------|
| Auth Service | Express/JS | 5,000 | 60% | DB, Redis, Email | @team-auth |

### Technical Debt
- [Debt 1]
- [Debt 2]

## Target State Design
### Architecture
[Diagram + description]

### Technology Stack
| Layer | Current | Target |
|-------|---------|--------|
| Runtime | Node.js 18 | Node.js 20 |
| Framework | Express | Fastify |
| Language | JavaScript | TypeScript |
| Database | MongoDB | PostgreSQL |

### Data Model Changes
| Entity | Current | Target | Migration Strategy |
|--------|---------|--------|-------------------|
| User | Embedded in doc | Normalized table | Expand-contract |

## Migration Strategy
### Approach
[Strangler Fig / Expand-Contract / Parallel Run / Big Bang (justify)]

### Phases
#### Phase 1: Foundation (Week 1-2)
- [ ] Set up target infrastructure
- [ ] Create shared types/contracts
- [ ] Implement data migration framework
- [ ] Establish monitoring/observability

#### Phase 2: Incremental Migration (Week 3-8)
- [ ] Migrate Module A (lowest risk)
- [ ] Validate with shadow traffic
- [ ] Migrate Module B
- [ ] ...

#### Phase 3: Cutover (Week 9-10)
- [ ] Full traffic to new system
- [ ] Decommission old components
- [ ] Clean up migration code

#### Phase 4: Stabilization (Week 11-12)
- [ ] Performance tuning
- [ ] Documentation update
- [ ] Team knowledge transfer

## Data Migration Plan
### Strategy
[Expand-contract / Dual-write / ETL / CDC]

### Steps
| Step | Description | Validation | Rollback |
|------|-------------|------------|----------|
| 1 | Add new schema | Schema diff | Drop new |
| 2 | Dual-write | Row count match | Disable dual-write |
| 3 | Backfill | Checksum compare | Truncate new |
| 4 | Switch reads | Shadow read compare | Revert reads |
| 5 | Drop old | No old access | Restore from backup |

### Data Validation
- Row counts match
- Checksums match
- Sample data integrity check
- Application functional tests pass

## Compatibility Matrix
| Component | Old System | New System | Compatibility |
|-----------|------------|------------|---------------|
| Auth API | v1 | v2 | Breaking (migrate clients) |
| User API | v1 | v1 | Compatible |
| Events | Legacy format | CloudEvents | Adapter needed |

## Risk Register
| Risk | Likelihood | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| Data corruption during migration | Low | Critical | Checksums, parallel run, point-in-time recovery | Restore from backup |
| Performance regression | Medium | High | Load test each phase, canary deploy | Rollback to old |
| Client integration breaks | Medium | High | API versioning, deprecation period, communication | Maintain v1 compatibility |
| Team knowledge gap | High | Medium | Pair programming, docs, training | Extend timeline |

## Rollback Plan
### Triggers
- Error rate > 1%
- p99 latency > 2x baseline
- Data inconsistency detected
- Critical functionality broken

### Rollback Procedure
1. [Step 1: Feature flag off]
2. [Step 2: Redirect traffic]
3. [Step 3: Verify old system healthy]
4. [Step 4: Communicate]

### Rollback Time Target
- Phase 1-2: < 5 minutes
- Phase 3: < 30 minutes

## Testing Strategy
### Pre-Migration
- [ ] Baseline performance benchmarks
- [ ] Functional test suite passes
- [ ] Chaos engineering baseline

### Per Phase
- [ ] Unit tests for new code
- [ ] Integration tests for migrated components
- [ ] Contract tests (old ↔ new)
- [ ] Shadow traffic validation
- [ ] Load test at 50% target

### Post-Migration
- [ ] Full regression suite
- [ ] Load test at 100% target
- [ ] Chaos engineering
- [ ] Data integrity audit

## Success Criteria
- [ ] Zero data loss
- [ ] Zero downtime (or within maintenance window)
- [ ] Performance meets or exceeds baseline
- [ ] All functional tests pass
- [ ] Error rate < baseline
- [ ] Team confident in new system

## Communication Plan
| Audience | Channel | Frequency | Content |
|----------|---------|-----------|---------|
| Engineering | Slack + Standup | Daily | Progress, blockers |
| Stakeholders | Email | Weekly | Milestones, risks |
| Customers | Status page | As needed | Scheduled maintenance |

## Dependencies
- [ ] Dependency 1 — Owner — Due Date
- [ ] Dependency 2 — Owner — Due Date

## Sign-off
- Technical Lead: [Name] — Date
- Engineering Manager: [Name] — Date
- Product Owner: [Name] — Date
```

### 5. Migration Checklist

- [ ] Migration approach selected and justified
- [ ] Current state inventoried and verified
- [ ] Target state designed
- [ ] Data migration strategy defined (expand-contract preferred)
- [ ] Compatibility matrix complete
- [ ] Phases defined with clear entry/exit criteria
- [ ] Risk register complete with mitigations
- [ ] Rollback plan defined and tested
- [ ] Testing strategy per phase
- [ ] Success criteria measurable
- [ ] Communication plan defined
- [ ] Dependencies identified and tracked
- [ ] Stakeholder sign-off obtained