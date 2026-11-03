# Technology Selection Reference

## Technology Evaluation Framework

### 1. Evaluation Criteria Matrix

| Criterion | Weight | Assessment Method |
|-----------|--------|-------------------|
| **Functional Fit** | 25% | Feature comparison, POC |
| **Maturity & Stability** | 15% | Version history, adoption, LTS |
| **Maintenance Activity** | 10% | Commit frequency, issue response, releases |
| **Ecosystem & Community** | 10% | Packages, docs, StackOverflow, talent pool |
| **Security Posture** | 10% | Vulnerability history, response time, practices |
| **Performance** | 10% | Benchmarks, real-world data |
| **Operational Complexity** | 10% | Ops burden, expertise required |
| **Developer Experience** | 5% | DX, tooling, learning curve |
| **Compatibility** | 5% | Stack fit, migration path |

### 2. Language & Runtime Selection

| Language | Best For | Considerations |
|----------|----------|----------------|
| **TypeScript** | Full-stack, type safety, large teams | Compilation step, ecosystem |
| **Python** | Data, ML, scripting, rapid dev | GIL, performance, packaging |
| **Go** | Microservices, CLI, high concurrency | Verbose, no generics (pre-1.18) |
| **Rust** | Systems, performance-critical, safety | Steep learning curve, compile time |
| **Java/Kotlin** | Enterprise, Spring ecosystem | JVM overhead, verbose |
| **C#/.NET** | Enterprise, Microsoft ecosystem | Windows bias (improving) |

**Recommendation Default:** TypeScript/Node.js for full-stack web, Go for services, Python for data/ML.

### 3. Frontend Framework Selection

| Framework | Best For | Trade-offs |
|-----------|----------|------------|
| **React** | Large apps, ecosystem, hiring | Bundle size, decisions fatigue |
| **Next.js** | SSR/SSG, SEO, full-stack React | Vercel lock-in (mitigable), complexity |
| **Vue** | Progressive adoption, DX | Smaller ecosystem |
| **Svelte** | Performance, simplicity | Smaller ecosystem, hiring |
| **Remix** | Web standards, nested routing | Newer, smaller community |

**Decision Factors:**
- Team expertise
- SSR/SEO requirements
- Ecosystem needs
- Deployment target

### 4. Backend Framework Selection (Node.js)

| Framework | Style | Best For |
|-----------|-------|----------|
| **Fastify** | Fast, schema-based | High-performance APIs |
| **Hono** | Lightweight, edge-ready | Edge, serverless, minimal |
| **NestJS** | Opinionated, DI, decorators | Enterprise, large teams |
| **Express** | Minimal, unopinionated | Simple, legacy |
| **tRPC** | Type-safe, no schema | TS monorepo, React |

### 5. Database Selection

| Database | Type | Best For | Avoid When |
|----------|------|----------|------------|
| **PostgreSQL** | Relational | General purpose, complex queries, JSONB | Massive scale writes, simple key-value |
| **MySQL** | Relational | Read-heavy, established ops | Complex JSON, advanced analytics |
| **SQLite** | Embedded | Local dev, testing, edge, small apps | Concurrent writes, network access |
| **Redis** | Key-value | Cache, sessions, queues, rate limit | Primary data, complex queries |
| **MongoDB** | Document | Flexible schema, rapid prototyping | Transactions, relational data |
| **DynamoDB** | Key-value/doc | Serverless, massive scale, AWS | Complex queries, vendor lock-in |
| **ClickHouse** | Columnar | Analytics, OLAP | Transactional workloads |

**Default Recommendation:** PostgreSQL for primary data, Redis for cache/sessions.

### 6. ORM / Data Access Selection

| Tool | Approach | Best For |
|------|----------|----------|
| **Prisma** | Type-safe, auto-migrations | TypeScript, PostgreSQL, productivity |
| **Drizzle** | Lightweight, SQL-like | Performance, control, TypeScript |
| **TypeORM** | Active Record, decorators | NestJS, complex mappings |
| **Knex** | Query builder | Control, existing SQL skills |
| **Raw SQL** | Maximum control | Complex queries, performance-critical |

**Recommendation:** Prisma for productivity, Drizzle for performance/control.

### 7. Message Queue / Event Streaming

| Technology | Model | Best For | Complexity |
|------------|-------|----------|------------|
| **Redis Streams** | Stream | Simple events, low-medium throughput | Low |
| **RabbitMQ** | Message broker | Complex routing, protocols | Medium |
| **Apache Kafka** | Event streaming | High throughput, replay, audit | High |
| **NATS** | Pub/sub | Lightweight, cloud-native | Low-Medium |
| **Cloud Pub/Sub** | Managed | Serverless, GCP/AWS | Low (managed) |

**Default:** Redis Streams for simple, Kafka for complex/event sourcing.

### 8. Caching Strategy

| Layer | Technology | Use Case |
|-------|------------|----------|
| **CDN** | CloudFlare, CloudFront | Static assets, public pages |
| **Edge** | CloudFlare Workers, Vercel Edge | Dynamic but cacheable |
| **Reverse Proxy** | Nginx, Varnish | HTML, API responses |
| **Application** | Redis, in-memory | Computed data, sessions |
| **Database** | Query cache, materialized views | Repeated expensive queries |
| **Client** | Browser cache, SWR | Static resources, user data |

### 9. Infrastructure & Deployment

| Need | Options | Recommendation |
|------|---------|----------------|
| **Container Orchestration** | Kubernetes (EKS/GKE/AKS), ECS, Nomad | EKS/GKE for scale, ECS for AWS simplicity |
| **Serverless** | Vercel, Netlify, AWS Lambda, Cloudflare Workers | Vercel for Next.js, Workers for edge |
| **IaC** | Terraform/OpenTofu, Pulumi, CDK | Terraform/OpenTofu for portability |
| **Service Mesh** | Istio, Linkerd, Cilium | Linkerd for simplicity, Cilium for eBPF |
| **Secrets** | Vault, AWS Secrets Manager, External Secrets | Vault for self-hosted, AWS SM for AWS |
| **Observability** | Prometheus/Grafana, Datadog, Honeycomb | Prometheus stack for self-hosted |

### 10. Technology Decision Template

```markdown
# Technology Decision: [Component/Category]

## Context
- What needs to be solved
- Constraints (team, timeline, budget, existing stack)

## Options Evaluated
| Option | Functional Fit | Maturity | Performance | Ops Complexity | DX | Score |
|--------|---------------|----------|-------------|----------------|-----|-------|
| Option A | 9/10 | 8/10 | 7/10 | 6/10 | 8/10 | 7.6 |
| Option B | 7/10 | 9/10 | 8/10 | 8/10 | 7/10 | 7.8 |
| Option C | 8/10 | 6/10 | 9/10 | 5/10 | 6/10 | 6.8 |

## Recommendation
**Selected:** Option B
**Rationale:** [Why this option]
**Trade-offs Accepted:** [What we're giving up]
**Risks:** [Identified risks and mitigations]
**Reversal Condition:** [What would make us change]

## Validation
- [ ] POC completed
- [ ] Team feedback collected
- [ ] Security review passed
- [ ] Performance baseline established
```

### Technology Selection Checklist

- [ ] Evaluation criteria defined and weighted
- [ ] At least 2 credible options evaluated per decision
- [ ] POC conducted for high-impact decisions
- [ ] Team expertise assessed
- [ ] Migration path from existing tech documented
- [ ] Vendor lock-in assessed
- [ ] Security posture verified
- [ ] Long-term maintenance considered
- [ ] Decision documented with rationale
- [ ] Reversal conditions defined