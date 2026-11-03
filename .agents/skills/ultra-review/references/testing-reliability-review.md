# Testing & Reliability Review Reference

## Test Pyramid & Distribution

### Ideal Distribution

| Level | Count | Speed | Scope | Confidence |
|-------|-------|-------|-------|------------|
| Unit | 70% | < 10ms | Single function/class | Low (implementation) |
| Integration | 20% | < 1s | Module interactions | Medium (contracts) |
| E2E | 10% | < 30s | User workflows | High (behavior) |
| Contract | Variable | < 5s | API/event schemas | High (compatibility) |

### Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Ice cream cone | Many E2E, few unit | Invert pyramid |
| Hourglass | Many unit + E2E, few integration | Add integration |
| Trophy | Only E2E | Add unit/integration |
| Test duplication | Same logic tested at multiple levels | Test at lowest appropriate level |

## Test Quality Evaluation

### Unit Tests

| Criterion | Good | Poor |
|-----------|------|------|
| Isolation | No shared state, no I/O | DB, network, filesystem, time |
| Determinism | Same result every run | Flaky, depends on order |
| Speed | < 10ms each | > 100ms |
| Coverage | Branches, edge cases, errors | Happy path only |
| Naming | `should_X_when_Y` | `test1`, `testMethod` |
| Arrangement | AAA pattern, builders | Inline setup, magic values |

### Integration Tests

| Criterion | Good | Poor |
|-----------|------|------|
| Real dependencies | Testcontainers, localstack, real DB | Mocked everything |
| Transaction rollback | Each test in transaction, rolled back | Shared state, manual cleanup |
| Contract focus | Test boundaries, not internals | Implementation-coupled |
| Data builders | Reusable, composable | Hardcoded fixtures |

### E2E Tests

| Criterion | Good | Poor |
|-----------|------|------|
| User journeys | Critical paths, not every permutation | Every click |
| Selectors | Data-testid, stable attributes | CSS classes, XPath |
| State management | Independent, reset between tests | Depends on previous test |
| Parallelizable | No shared accounts/data | Sequential only |
| Flakiness | < 1% | > 5% |

### Contract Tests

| Type | Tool | Purpose |
|------|------|---------|
| Consumer-driven | Pact | Consumer defines expectations |
| Provider-driven | Spring Cloud Contract | Provider defines contracts |
| Schema | OpenAPI/GraphQL validation | Request/response match schema |

## Test Coverage Quality

### Coverage Metrics (Not Targets)

| Metric | Meaning | Limitation |
|--------|---------|------------|
| Line coverage | % lines executed | Misses branch logic |
| Branch coverage | % branches taken | Misses condition combinations |
| Mutation coverage | % mutants killed | Computationally expensive |
| Critical path coverage | Key workflows covered | Manual identification needed |

### What Coverage Misses

- Missing requirements (code not written)
- Wrong requirements (code does wrong thing)
- Integration failures (components work alone)
- Performance issues
- Security vulnerabilities
- Usability problems

## Reliability Patterns

### Observability

| Pillar | Implementation | Key Metrics |
|--------|----------------|-------------|
| Logs | Structured (JSON), correlation IDs, levels | Error rate, latency p99 |
| Metrics | Prometheus/OpenTelemetry, RED/USE | Request rate, error rate, duration |
| Traces | OpenTelemetry, W3C TraceContext | Service graph, bottleneck spans |
| Alerts | Prometheus Alertmanager, PagerDuty | Symptoms, not causes |

### RED Method (Request/Error/Duration)

| Metric | Target | Alert |
|--------|--------|-------|
| Request rate | Baseline ± 20% | Drop > 50%, spike > 3x |
| Error rate | < 0.1% (5xx) | > 1% for 5m |
| Duration p99 | < SLA | > SLA for 5m |

### USE Method (Utilization/Saturation/Errors)

| Resource | Utilization Alert | Saturation Alert |
|----------|-------------------|------------------|
| CPU | > 70% avg | > 90% sustained |
| Memory | > 70% | > 85% |
| Disk | > 70% | > 85% |
| Network | > 50% | > 80% |
| Connections | > 70% pool | > 90% pool |

## Failure Scenarios to Test

| Scenario | Test Method | Expected Behavior |
|----------|-------------|-------------------|
| Dependency down | Chaos: kill service | Circuit breaker, fallback, graceful degradation |
| Dependency slow | Chaos: latency injection | Timeout, retry, circuit breaker |
| Network partition | Chaos: network split | Split-brain handling, quorum |
| Disk full | Chaos: fill disk | Graceful error, alert, no corruption |
| OOM | Chaos: memory pressure | OOM killer target, restart, no data loss |
| Clock drift | Chaos: time skew | NTP, logical clocks for ordering |
| Certificate expiry | Chaos: expired cert | Alert 30d before, auto-renewal |
| Config error | Chaos: bad config | Fail fast at startup, validation |

## CI/CD Reliability

### Pipeline Quality

| Stage | Checks | Gate |
|-------|--------|------|
| Lint | ESLint, ruff, clippy, golangci-lint | Fail on error |
| Typecheck | tsc, mypy, go vet | Fail on error |
| Unit test | All unit tests | Fail on any failure, coverage threshold |
| Build | Compile, bundle, container build | Fail on error |
| Integration test | Against test DB/services | Fail on any failure |
| E2E test | Critical paths | Fail on any failure |
| Security scan | SAST, dependency audit | Fail on critical/high |
| Deploy | Canary, blue-green, rollback | Manual approval for prod |

### Flaky Test Management

| Action | Tool/Process |
|--------|--------------|
| Detection | Run tests multiple times, track history |
| Quarantine | Separate flaky suite, don't block merge |
| Root cause | Investigate within 1 week |
| Fix or delete | Fix preferred, delete if no value |

## Testing Scorecard

| Dimension | Weight | Score | Evidence |
|-----------|--------|-------|----------|
| Test Pyramid | 20% | | Distribution, speed |
| Unit Quality | 20% | | Isolation, determinism, coverage |
| Integration Quality | 20% | | Real deps, contracts, rollback |
| E2E Quality | 15% | | Journeys, stability, selectors |
| Contract Testing | 10% | | Consumer/provider, schema |
| Observability | 10% | | Logs, metrics, traces, alerts |
| CI Reliability | 5% | | Flaky rate, pipeline speed, gates |

## Investigation Checklist

- [ ] Run full test suite — all pass?
- [ ] Check flaky test rate — < 1%?
- [ ] Review coverage — critical paths covered?
- [ ] Check test pyramid distribution
- [ ] Verify integration tests use real dependencies
- [ ] Check E2E selectors — data-testid used?
- [ ] Verify contract tests exist for APIs
- [ ] Review CI pipeline — all gates enforced?
- [ ] Check observability — RED/USE metrics?
- [ ] Review alerting — symptom-based, actionable?
- [ ] Test failure scenarios — chaos engineering?
- [ ] Check test data management — builders, factories?
- [ ] Verify test isolation — no shared state?
- [ ] Review mutation testing — if available?
- [ ] Check test documentation — run instructions?