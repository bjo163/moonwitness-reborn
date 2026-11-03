# DevEx & Infrastructure Review Reference

## Developer Experience (DevEx)

### Project Setup

| Criterion | Excellent | Good | Poor |
|-----------|-----------|------|------|
| Time to first build | < 5 min | 5-15 min | > 15 min |
| Time to run tests | < 2 min | 2-5 min | > 5 min |
| Documentation | Complete, current | Partial | Missing/outdated |
| Onboarding guide | Step-by-step, verified | Exists | None |
| Prerequisites | Documented, versioned | Listed | Unknown |

### Development Workflow

| Aspect | Good Practice | Anti-Pattern |
|--------|---------------|--------------|
| Commands | `make dev`, `pnpm dev`, single command | Multiple complex commands |
| Hot reload | Works for all code changes | Manual restart needed |
| Type checking | `tsc --watch`, IDE integration | Manual only |
| Linting | Pre-commit + CI, auto-fix | CI only, no auto-fix |
| Debugging | Source maps, launch configs | Print debugging only |

### Dependency Management

| Check | Tool | Target |
|-------|------|--------|
| Lockfile committed | `package-lock.json`, `Cargo.lock`, `go.sum` | Yes |
| Reproducible builds | `pnpm install --frozen-lockfile` | Pass |
| Dependency updates | Dependabot, Renovate, `pnpm outdated` | Weekly PRs |
| Vulnerability scanning | `npm audit`, `cargo audit`, `go vulncheck` | Zero critical/high |
| License compliance | `license-checker`, `cargo deny` | Approved only |

## Build System

### Build Quality

| Metric | Target | Tool |
|--------|--------|------|
| Build time (clean) | < 3 min | CI logs |
| Build time (incremental) | < 30s | CI logs |
| Build determinism | Bit-for-bit reproducible | `reproducible-builds.org` |
| Artifact size | Minimal, no dev deps | `docker history`, `pnpm pack` |
| Multi-arch support | `linux/amd64`, `linux/arm64` | `docker buildx` |

### Build Configuration

| Aspect | Good Practice |
|--------|---------------|
| Build args | Only build-time config, no secrets |
| Base images | Minimal (distroless, alpine), pinned digest |
| Layers | Ordered for cache efficiency |
| Multi-stage | Build → test → runtime |
| Scanning | Trivy/Grype in CI, fail on critical |

## CI/CD Pipeline

### Pipeline Stages

| Stage | Purpose | Gate |
|-------|---------|------|
| Lint | Code style, patterns | Fail on error |
| Typecheck | Static types | Fail on error |
| Unit tests | Fast, isolated | Fail on any failure |
| Build | Compile, package | Fail on error |
| Integration tests | Real dependencies | Fail on any failure |
| E2E tests | Critical user paths | Fail on any failure |
| Security | SAST, deps, containers | Fail on critical/high |
| Deploy staging | Auto on main | Auto |
| Deploy prod | Manual approval | Manual |

### Pipeline Quality

| Metric | Target |
|--------|--------|
| Pipeline time (main) | < 15 min |
| Pipeline time (PR) | < 10 min |
| Flaky test rate | < 1% |
| False positive rate | < 5% |
| Rollback time | < 5 min |

### GitOps / Deployment

| Practice | Implementation |
|----------|----------------|
| Environment parity | Same container, different config |
| Config management | External (ConfigMap, Secret, Vault) |
| Secrets | Never in image, injected at runtime |
| Rollback | One-click, automated on health check failure |
| Canary | Traffic shifting, metrics comparison |
| Blue-green | Zero-downtime, instant rollback |

## Infrastructure

### Container Orchestration (Kubernetes)

| Aspect | Good Practice |
|--------|---------------|
| Resources | Requests = limits (guaranteed QoS) or requests < limits (burstable) |
| Probes | Liveness, readiness, startup configured |
| Autoscaling | HPA (CPU/memory/custom), VPA, cluster autoscaler |
| Network policies | Default deny, explicit allow |
| RBAC | Least privilege, namespace-scoped |
| Secrets | External Secrets Operator, Sealed Secrets |
| Monitoring | Prometheus Operator, ServiceMonitors |

### Cloud Infrastructure

| Aspect | Good Practice |
|--------|---------------|
| IaC | Terraform/OpenTofu, Pulumi, or CDK |
| State | Remote state with locking |
| Modules | Reusable, versioned, tested |
| Environments | Separate state/workspaces per env |
| Drift detection | Regular `terraform plan` in CI |
| Cost management | Infracost, budgets, alerts |

### Observability

| Pillar | Stack | Key Dashboards |
|--------|-------|----------------|
| Logs | Loki, Elasticsearch, Datadog | Error logs, audit trail |
| Metrics | Prometheus, Mimir, Thanos | RED, USE, business |
| Traces | Tempo, Jaeger, Zipkin | Service map, latency |
| Alerting | Alertmanager, PagerDuty, Opsgenie | Symptom-based, runbooks |

### SLO/SLI Definition

| SLI | SLO Target | Measurement |
|-----|------------|-------------|
| Availability | 99.9% (monthly) | Successful requests / total |
| Latency p99 | < 500ms | Histogram bucket |
| Throughput | > 1000 req/s | Rate counter |
| Error rate | < 0.1% | 5xx / total |
| Durability | 99.999999999% | Backup verification |

## Security (Infrastructure)

| Check | Standard |
|-------|----------|
| Network | Private subnets, NAT, no public IPs |
| Encryption | TLS 1.2+ everywhere, mTLS service mesh |
| Secrets | Vault/Secrets Manager, rotation, audit |
| Images | Signed, scanned, distroless, non-root |
| Runtime | Falco, Tetragon, seccomp, AppArmor |
| Compliance | CIS Benchmarks, SOC2, PCI-DSS as needed |

## DevEx Scorecard

| Dimension | Weight | Score | Evidence |
|-----------|--------|-------|----------|
| Setup Speed | 15% | | Time to build, test, run |
| Workflow | 15% | | Commands, hot reload, debugging |
| Dependencies | 10% | | Lockfile, updates, vulnerabilities |
| Build | 15% | | Speed, determinism, multi-arch |
| CI/CD | 20% | | Stages, gates, speed, reliability |
| Infrastructure | 15% | | IaC, observability, security |
| Documentation | 10% | | Onboarding, architecture, runbooks |

## Investigation Checklist

- [ ] Fresh clone → build → test — time it
- [ ] Run `pnpm install --frozen-lockfile` — works?
- [ ] Check CI pipeline — all stages pass on main?
- [ ] Review pipeline time — < 15 min?
- [ ] Check flaky test dashboard — rate < 1%?
- [ ] Verify Docker image — multi-stage, non-root, scanned?
- [ ] Check IaC — Terraform/Pulumi, modules, state?
- [ ] Review Kubernetes manifests — resources, probes, policies?
- [ ] Check observability — dashboards, alerts, runbooks?
- [ ] Verify secrets — none in code, images, config?
- [ ] Test rollback — one-click, < 5 min?
- [ ] Check SLOs — defined, measured, alerted?
- [ ] Review onboarding doc — accurate, complete?
- [ ] Check dependency updates — automated PRs?