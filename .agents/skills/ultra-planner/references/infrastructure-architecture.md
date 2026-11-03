# Infrastructure Architecture Reference

## Infrastructure Design Principles

### 1. Environment Strategy

| Environment | Purpose | Parity | Data |
|-------------|---------|--------|------|
| **Local** | Development | Code only | Synthetic/seed |
| **Preview** | PR validation | Infra subset | Anonymized subset |
| **Staging** | Integration testing | Full mirror | Production-like (sanitized) |
| **Production** | Live traffic | N/A | Real |

**Principles:**
- Same container image across all environments
- Config differs, code doesn't
- Infrastructure as Code for all environments
- Ephemeral preview environments per PR

### 2. Container Architecture

**Base Image Standards:**
- Distroless or Alpine (minimal attack surface)
- Pinned digest (not tag): `gcr.io/distroless/nodejs20@sha256:...`
- Non-root user: `USER nonroot`
- Read-only root filesystem
- Dropped capabilities

**Multi-Stage Build:**
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Test
FROM builder AS tester
RUN npm test

# Stage 3: Runtime
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER nonroot
ENTRYPOINT ["node", "dist/main.js"]
```

**Image Scanning:**
- Trivy/Grype in CI pipeline
- Fail on CRITICAL/HIGH vulnerabilities
- SBOM generation (Syft)

### 3. Orchestration (Kubernetes)

**Resource Management:**
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```
- Requests = Limits for Guaranteed QoS (critical services)
- Requests < Limits for Burstable (batch workers)
- LimitRanges per namespace

**Probes (All Services):**
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

**Autoscaling:**
```yaml
# HPA - Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

**Network Policies (Default Deny):**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-from-ingress
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
```

### 4. Service Mesh (When Justified)

**When to Use:**
- mTLS required between services
- Complex traffic management (canary, mirroring)
- Fine-grained observability
- Zero-trust network

**Options:**
- **Istio** — Feature-rich, complex
- **Linkerd** — Lightweight, Rust-based
- **Cilium** — eBPF-based, network + security
- **Consul Connect** — If already using Consul

### 5. Configuration Management

**Config Sources (Priority Order):**
1. Kubernetes Secrets (secrets)
2. Kubernetes ConfigMaps (config)
3. Environment variables (overrides)
4. Application defaults (code)

**External Secrets Operator:**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: ClusterSecretStore
  target:
    name: db-credentials
  data:
  - secretKey: username
    remoteRef:
      key: prod/db
      property: username
  - secretKey: password
    remoteRef:
      key: prod/db
      property: password
```

### 6. CI/CD Pipeline

**Pipeline Stages:**
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Lint      │──▶│  Typecheck  │──▶│  Unit Test  │──▶│   Build     │
│  (eslint)   │   │  (tsc)      │   │  (vitest)   │   │  (docker)   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
                                                                   │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Deploy     │◀──│  Security   │◀──│  Integration│◀──│  Push       │
│  Staging    │   │  Scan       │   │  Test       │   │  Registry   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
                                                                   │
┌─────────────┐   ┌─────────────┐
│  Deploy     │◀──│  Manual     │
│  Production │   │  Approval   │
└─────────────┘   └─────────────┘
```

**Quality Gates (All Must Pass):**
- Lint: 0 errors
- Typecheck: 0 errors
- Unit tests: 100% pass, coverage thresholds
- Build: Successful, image scanned
- Integration tests: 100% pass
- Security scan: 0 CRITICAL/HIGH
- Contract tests: Consumer/provider match

**Deployment Strategies:**
| Strategy | When | Implementation |
|----------|------|----------------|
| **Rolling** | Default, stateless | `maxSurge: 25%, maxUnavailable: 0` |
| **Blue-Green** | Critical, instant rollback | Two namespaces, switch ingress |
| **Canary** | Risk mitigation | KEDA/Flagger, traffic splitting |
| **Recreate** | Stateful, singleton | Downtime acceptable |

### 7. GitOps (ArgoCD / Flux)

**Principles:**
- Git = single source of truth
- Declarative desired state
- Automated sync
- Drift detection and alerting

**Structure:**
```
clusters/
├── production/
│   ├── apps/
│   │   ├── api.yaml
│   │   └── worker.yaml
│   └── infrastructure/
│       ├── ingress.yaml
│       └── cert-manager.yaml
├── staging/
└── preview/
    └── pr-123/
```

### 8. Observability Stack

**Metrics (Prometheus + Grafana):**
- RED: Rate, Errors, Duration (per service)
- USE: Utilization, Saturation, Errors (per resource)
- Business: Revenue, signups, conversion

**Logs (Loki / Elasticsearch):**
- Structured JSON
- Correlation IDs (trace_id, span_id)
- Labels: service, environment, level

**Traces (Tempo / Jaeger):**
- W3C TraceContext propagation
- Sampling: 10% baseline, 100% errors
- Service graph generation

**Alerting (Alertmanager + PagerDuty):**
- Symptom-based (not cause-based)
- Runbook links in every alert
- Tiered: Page (critical) → Ticket (warning) → Log (info)

### 9. Database Infrastructure

**PostgreSQL (Managed - RDS/Cloud SQL):**
- Multi-AZ for HA
- Read replicas for scaling reads
- PgBouncer for connection pooling
- Automated backups + point-in-time recovery
- `pg_stat_statements` enabled
- Logical replication for upgrades

**Redis (Cluster Mode):**
- Cluster for > 10GB
- Persistence: AOF + RDB
- Eviction policy: `allkeys-lru`
- TLS enabled

### 10. Disaster Recovery

| Metric | Target | Implementation |
|--------|--------|----------------|
| **RPO** | < 1 hour | Continuous WAL archiving |
| **RTO** | < 4 hours | Automated failover, tested quarterly |
| **Backup** | Daily + WAL | Cross-region replication |
| **Drill** | Quarterly | Full restore to staging |

### Infrastructure Architecture Checklist

- [ ] Environment strategy defined (local → preview → staging → prod)
- [ ] Container images: distroless, non-root, scanned, signed
- [ ] Kubernetes: resources, probes, HPA, network policies
- [ ] Service mesh: justified or not used
- [ ] Config: External Secrets, ConfigMaps, no secrets in images
- [ ] CI/CD: All quality gates, deployment strategies
- [ ] GitOps: ArgoCD/Flux, drift detection
- [ ] Observability: Metrics, logs, traces, alerting
- [ ] Database: Managed, HA, pooling, backups, PITR
- [ ] DR: RPO/RTO defined, tested, documented
- [ ] Cost: Monitoring, budgets, rightsizing