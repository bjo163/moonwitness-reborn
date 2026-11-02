# Measurable Performance & Reliability Targets (MW-0609 & MW-1109)

> **Document Version:** 1.0.0  
> **Target Release:** MoonWitness v0.2.0+  
> **Status:** Proposal for Owner Ratification  
> **Task References:** [MW-0609](https://github.com/bjo163/moonwitness-reborn/issues/45), [MW-1109](https://github.com/bjo163/moonwitness-reborn/issues/83)

---

## 1. Executive Summary

This document establishes measurable, reproducible, and verifiable Service Level Objectives (SLOs) and Non-Functional Requirements (NFRs) for MoonWitness. It defines targets across latency, query throughput, corpus scaling, and system availability.

---

## 2. Latency Service Level Objectives (SLOs)

All latency benchmarks are measured under steady-state load with database connection pooling enabled:

| Journey / Endpoint Class | Method | Target (p50) | Target (p95) | Target (p99) | Measurement Environment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Health Check & Heartbeat** (`/health`) | `GET` | < 10 ms | < 30 ms | < 50 ms | Isolated Docker Compose |
| **Passage & Work Lookup** (`/api/corpus/works/*`) | `GET` | < 40 ms | < 120 ms | < 250 ms | Standard 2 CPU, 4GB RAM |
| **Lexical Search Query** (Exact/Trigram match) | `POST` | < 80 ms | < 200 ms | < 450 ms | Standard 2 CPU, 4GB RAM |
| **Transactional Mutate** (`witness`, `mizan`) | `POST` | < 90 ms | < 250 ms | < 500 ms | PostgreSQL 16 (isolated pool) |
| **Automated Quality Evaluation** (LLM-as-a-judge) | Internal | < 1.2 s | < 2.5 s | < 4.0 s | Evaluation Harness Worker |

---

## 3. Capacity & Scaling Targets

1. **Corpus Scale Capacity:**
   - Designed to support at least **150,000 distinct passage records** (`corpus.passage`) without degradation of lookup time.
   - Foreign key indexing on `canonical_id`, `work_id`, and `artifact_id` maintains O(log N) tree depth.
2. **Throughput Targets:**
   - **Read Throughput:** Minimum **100 requests per second (RPS)** per API container instance under 1 CPU / 1GB RAM constraint.
   - **Write Throughput:** Minimum **25 records per second** sustained bulk imports via `import-service.ts`.
3. **Database Concurrency:**
   - Connection pool size configured to 20 connections max per API worker to prevent Postgres pool exhaustion.

---

## 4. Availability & Reliability Targets

- **Target Availability:** **99.5% uptime** in staging and testing observation windows (excluding planned maintenance).
- **Graceful Degradation:**
  - Database transient disconnection must result in structured `503 Service Unavailable` with JSON error payload (fail-closed, no stack traces leaked).
  - External AI connector timeouts fail safely without dropping pending transaction records.

---

## 5. Benchmarking & Verification Methodology

1. **Measurement Harness:**
   - Benchmarks must run in an isolated environment against a local containerized PostgreSQL instance (`docker-compose.yml`).
   - Automated evaluation runs record exact hardware specifications, timestamp, commit SHA, and query distribution.
2. **Release Gate Criteria:**
   - No pull request shall cause a regression exceeding 15% on any p95 latency SLO.
