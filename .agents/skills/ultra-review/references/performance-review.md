# Performance & Scalability Review Reference

## Performance Dimensions

### 1. Latency Targets

| Operation | Target (p99) | Acceptable | Warning |
|-----------|--------------|------------|---------|
| API GET (cached) | < 50ms | < 100ms | > 200ms |
| API GET (uncached) | < 200ms | < 500ms | > 1s |
| API POST (simple) | < 300ms | < 1s | > 2s |
| API POST (complex) | < 1s | < 3s | > 5s |
| DB query (indexed) | < 10ms | < 50ms | > 100ms |
| DB query (complex) | < 100ms | < 500ms | > 1s |
| Page load (LCP) | < 1.5s | < 2.5s | > 4s |
| Page interactive (INP) | < 100ms | < 200ms | > 500ms |

### 2. Throughput Targets

| Metric | Baseline | Target | Scaling Trigger |
|--------|----------|--------|-----------------|
| Requests/sec | Current | 10x headroom | > 70% capacity |
| DB connections | Current | < 80% pool | > 70% used |
| Queue depth | Near 0 | < 100 | Growing trend |
| Memory/instance | Current | < 70% limit | > 80% used |
| CPU/instance | Current | < 60% avg | > 75% sustained |

## Frontend Performance (Web)

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor | Measurement |
|--------|------|-------------------|------|-------------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 2.5-4s | > 4s | Field (RUM) |
| INP (Interaction to Next Paint) | ≤ 200ms | 200-500ms | > 500ms | Field (RUM) |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1-0.25 | > 0.25 | Field (RUM) |
| TTFB (Time to First Byte) | ≤ 800ms | 800-1800ms | > 1800ms | Lab + Field |
| FCP (First Contentful Paint) | ≤ 1.8s | 1.8-3s | > 3s | Lab + Field |

### Bundle Analysis

| Metric | Target | Tool |
|--------|--------|------|
| Initial JS (gzipped) | < 100KB | `webpack-bundle-analyzer`, `vite-bundle-analyzer` |
| Total JS (gzipped) | < 300KB | Same |
| CSS (gzipped) | < 50KB | Same |
| Unused JS | < 10% | Coverage tab, `purgecss` |
| Duplicate modules | 0 | `webpack --json` analysis |

### Rendering Optimization

| Technique | When Applicable |
|-----------|-----------------|
| Code splitting | Route-level, component-level |
| Lazy loading | Below-fold images, heavy components |
| Virtualization | Lists > 50 items |
| Memoization | Expensive computations, referential equality |
| SSR/SSG | SEO, fast FCP |
| Streaming SSR | Slow data dependencies |
| Island architecture | Partial hydration |

### Asset Optimization

| Asset | Optimization |
|-------|--------------|
| Images | WebP/AVIF, responsive `srcset`, `width`/`height`, lazy load |
| Fonts | Subset, `font-display: swap`, preload critical |
| CSS | Critical inline, non-critical async, purge unused |
| JS | Minify, compress (gzip/brotli), tree-shake |
| Third-party | Defer, async, self-host critical, `fetchpriority` |

## Backend Performance

### Database

| Pattern | Optimization |
|---------|--------------|
| Missing indexes | `EXPLAIN ANALYZE`, `pg_stat_statements` |
| N+1 queries | Eager loading, batch loading (DataLoader) |
| Unbounded results | Cursor pagination, `LIMIT` |
| Wide tables | Vertical partitioning, JSONB for sparse |
| Write contention | Partitioning, sharding, async writes |
| Read replicas | Offload analytical queries |

### Caching Strategy

| Layer | TTL | Invalidation | Use Case |
|-------|-----|--------------|----------|
| CDN (edge) | 1h-1y | Purge API, cache keys | Static assets, public pages |
| Reverse proxy | 1s-5m | Tags, keys | HTML, API responses |
| Application (Redis) | 1m-1h | Events, TTL | Computed data, sessions |
| Database (query cache) | N/A | Auto | Repeated queries |
| Client (browser) | Per-resource | `Cache-Control`, `ETag` | Static, semi-static |

**Cache Key Design:** Include version, user context, feature flags

### Concurrency & Async

| Pattern | Implementation |
|---------|----------------|
| Thread pool | CPU-bound: fixed size = CPU cores |
| Event loop | I/O-bound: single thread, async I/O |
| Worker pool | Offload heavy computation |
| Queue | Background jobs, rate limiting |
| Backpressure | Buffer limits, rejection, flow control |

### Resource Management

| Resource | Leak Prevention |
|----------|-----------------|
| Database connections | Pool with timeout, `defer close()` |
| HTTP connections | Pool, keep-alive, timeout |
| File handles | `try-with-resources`, `using`, `defer` |
| Memory | Avoid global accumulation, weak refs for caches |
| Timers/Intervals | Cleanup on unmount/dispose |

## Scalability Patterns

### Horizontal Scaling

| Component | Strategy |
|-----------|----------|
| Stateless API | Add instances, load balance |
| Session | Redis cluster, sticky sessions (avoid) |
| Database reads | Read replicas |
| Database writes | Sharding (last resort) |
| Queue consumers | Competing consumers |
| Cache | Redis Cluster, consistent hashing |

### Vertical Scaling Limits

| Resource | Practical Limit | Beyond |
|----------|-----------------|--------|
| CPU cores | 64-128 | NUMA, diminishing returns |
| RAM | 1-2TB | Cost, GC pauses |
| Disk IOPS | NVMe ~1M | Distributed storage |
| Network | 10-100Gbps | Multiple NICs |

## Performance Testing

### Test Types

| Type | Purpose | Tooling |
|------|---------|---------|
| Load | Expected traffic | k6, Locust, JMeter |
| Stress | Breaking point | Same, ramp to failure |
| Soak | Stability over time | 8-24h sustained load |
| Spike | Sudden traffic surge | Burst patterns |
| Chaos | Failure resilience | Chaos Mesh, Litmus |

### Key Metrics to Capture

- Latency: p50, p90, p95, p99, max
- Throughput: req/s, MB/s
- Errors: rate, types, correlation
- Resources: CPU, memory, disk, network, connections
- Saturation: queue depth, pool usage, GC pauses

## Performance Scorecard

| Dimension | Weight | Score | Evidence |
|-----------|--------|-------|----------|
| Latency (API) | 20% | | p99 targets met |
| Latency (Frontend) | 15% | | Core Web Vitals |
| Throughput | 15% | | Headroom, scaling |
| Resource Efficiency | 15% | | CPU, memory, connections |
| Caching | 10% | | Hit ratios, invalidation |
| Database | 10% | | Query plans, indexes |
| Scalability | 10% | | Horizontal, patterns |
| Testing | 5% | | Load tests, budgets |

## Investigation Checklist

- [ ] Run `EXPLAIN ANALYZE` on top 20 queries
- [ ] Check `pg_stat_statements` for slow/heavy queries
- [ ] Measure API p99 latency under load
- [ ] Run Lighthouse / WebPageTest on key pages
- [ ] Analyze bundle size — `webpack-bundle-analyzer`
- [ ] Check cache hit ratios — Redis, CDN, browser
- [ ] Profile memory — heap snapshots, GC frequency
- [ ] Check connection pool utilization
- [ ] Review queue depths — processing latency
- [ ] Test horizontal scaling — add instance, verify
- [ ] Verify no synchronous external calls in hot path
- [ ] Check for N+1 queries in ORM
- [ ] Verify pagination on all list endpoints
- [ ] Check for unbounded memory growth (caches, buffers)