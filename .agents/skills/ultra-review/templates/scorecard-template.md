# Engineering Scorecard Template

**Review ID:** UR-<REVIEW_ID>
**Project:** <Project Name>
**Date:** <ISO Date>

---

## Scoring Rubric (0-100)

| Score | Label | Description |
|-------|-------|-------------|
| 90-100 | EXCELLENT | Industry-leading, best practices throughout |
| 75-89 | GOOD | Solid, minor gaps only |
| 60-74 | FAIR | Functional but notable weaknesses |
| 40-59 | POOR | Significant problems, needs investment |
| 0-39 | CRITICAL | Fundamental failures, urgent action needed |
| N/A | NOT ASSESSED | Insufficient evidence to score |

---

## Scorecard

| # | Dimension | Weight | Score | Confidence | Evidence Summary | Strengths | Weaknesses | Recommended Improvements |
|---|-----------|--------|-------|------------|------------------|-----------|------------|-------------------------|
| 1 | Product Alignment | % | | | | | | |
| 2 | Architecture | % | | | | | | |
| 3 | Code Quality | % | | | | | | |
| 4 | Security | % | | | | | | |
| 5 | Database & Data Integrity | % | | | | | | |
| 6 | API Quality | % | | | | | | |
| 7 | Performance | % | | | | | | |
| 8 | Reliability | % | | | | | | |
| 9 | Testing | % | | | | | | |
| 10 | UI/UX | % | | | | | | |
| 11 | DevEx | % | | | | | | |
| 12 | Documentation | % | | | | | | |
| 13 | Maintainability | % | | | | | | |
| 14 | Scalability | % | | | | | | |
| 15 | Operational Readiness | % | | | | | | |

**TOTAL WEIGHT:** 100%
**WEIGHTED SCORE:** <Calculated> / 100

---

## Dimension Evaluation Criteria

### 1. Product Alignment
- Features match documented requirements
- User workflows supported end-to-end
- Business rules correctly implemented
- No missing critical functionality
- Product/engineering communication effective

### 2. Architecture
- Clear module boundaries, separation of concerns
- Dependency direction correct (no cycles)
- Appropriate coupling/cohesion
- Extensibility without over-engineering
- Failure boundaries defined
- ADRs for major decisions

### 3. Code Quality
- Type safety (strict mode, no `any`)
- Correctness (validation, error handling, null safety)
- Readability (naming, complexity, structure)
- Maintainability (duplication, dead code, coupling)
- Defensive programming (timeouts, retries, contracts)
- Consistency (style, patterns, conventions)

### 4. Security
- Authentication (MFA, sessions, tokens)
- Authorization (RBAC/ABAC, object-level, default deny)
- Input validation (layers, parameterized queries)
- Secrets management (no hardcoded, rotation)
- Cryptography (TLS, hashing, key management)
- Supply chain (audit, pinning, provenance)
- Logging/audit (events, redaction, alerts)
- Infrastructure (containers, network, runtime)

### 5. Database & Data Integrity
- Schema quality (normalization, constraints, naming)
- Indexing strategy (coverage, unused, missing FK)
- Transactions (isolation, locking, deadlock prevention)
- Migrations (safe, reversible, zero-downtime)
- ORM usage (patterns, anti-patterns, N+1)
- Ownership/tenancy (RLS, isolation, consistency)
- Backup/recovery (RPO/RTO, encryption, tested)

### 6. API Quality
- Contract completeness (OpenAPI/GraphQL, examples)
- REST/design (nouns, semantics, status codes)
- Validation (layers, error format, codes)
- Versioning (strategy, backward compat)
- Resilience (timeouts, retry, circuit breaker)
- Documentation (examples, guides, changelog)
- Testing (contract, E2E, load)

### 7. Performance
- Latency targets met (API, frontend, DB)
- Throughput headroom (10x target)
- Resource efficiency (CPU, memory, connections)
- Caching strategy (hit ratios, invalidation)
- Database queries (plans, indexes, N+1)
- Scalability patterns (horizontal, vertical)
- Load testing (regular, budgets)

### 8. Reliability
- Observability (logs, metrics, traces, alerts)
- RED/USE metrics defined and monitored
- Failure scenarios tested (chaos, resilience)
- Error handling (graceful degradation)
- SLO/SLI defined and measured
- Incident process (detection, mitigation, postmortem)

### 9. Testing
- Test pyramid (unit/integration/E2E balance)
- Unit quality (isolation, determinism, coverage)
- Integration quality (real deps, contracts, rollback)
- E2E quality (journeys, stability, selectors)
- Contract testing (consumer/provider, schema)
- CI reliability (flaky rate, pipeline speed, gates)

### 10. UI/UX
- Accessibility (WCAG 2.1 AA)
- Design system (tokens, components, consistency)
- Responsiveness (breakpoints, touch targets)
- UI states (loading, empty, error, partial)
- Interaction (feedback, motion, purpose)
- i18n (no hardcoded strings, RTL)
- Frontend performance (Core Web Vitals, bundle)

### 11. DevEx
- Setup speed (build, test, run time)
- Workflow (commands, hot reload, debugging)
- Dependencies (lockfile, updates, vulnerabilities)
- Build (speed, determinism, multi-arch)
- CI/CD (stages, gates, speed, reliability)
- Infrastructure (IaC, observability, security)
- Documentation (onboarding, architecture, runbooks)

### 12. Documentation
- README (purpose, quick start, links)
- Architecture docs (C4 diagrams, ADRs current)
- API reference (complete, examples, versioned)
- Developer guide (setup, workflow, conventions)
- Operations guide (deploy, rollback, troubleshooting)
- Governance (ownership, review, release process)
- Issue management (quality, board, priorities)

### 13. Maintainability
- Technical debt (quantified, prioritized, paydown)
- Code ownership clear
- Change impact predictable
- Refactoring safety (tests, types)
- Migration paths documented
- Bus factor managed

### 14. Scalability
- Current limits known
- Scaling triggers defined
- Horizontal scaling capability
- Database scaling strategy
- Cache scaling strategy
- Cost-aware scaling

### 15. Operational Readiness
- Deployment (automated, rollback, canary)
- Configuration (external, validated, secretless)
- Monitoring (dashboards, alerts, runbooks)
- Capacity planning (trends, budgets)
- Disaster recovery (tested, RPO/RTO)
- Security operations (scanning, patching, response)

---

## Score Calculation

```
WEIGHTED SCORE = Σ(Dimension Score × Weight) / 100

Example:
- Architecture: 75 × 0.15 = 11.25
- Security: 60 × 0.15 = 9.00
- Code Quality: 80 × 0.15 = 12.00
... etc

Total = 72.5 / 100
```

**Important:** A high overall score does NOT compensate for CRITICAL findings in any dimension. CRITICAL findings must be called out separately regardless of score.

---

## Confidence Levels

| Confidence | Basis |
|------------|-------|
| HIGH | Direct inspection of most relevant code/config, tools run |
| MEDIUM | Partial inspection, some inference, tools partially run |
| LOW | Limited access, significant inference, tools not run |

---

## Calibration Notes

- Scores must be justified with specific evidence in "Evidence Summary"
- "NOT ASSESSED" for dimensions not in scope — exclude from weighted average
- Document any dimension where score seems inconsistent with findings
- Cross-reference with detailed findings section