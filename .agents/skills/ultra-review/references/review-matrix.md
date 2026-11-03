# Review Matrix Reference

## Mode-to-Pass Mapping

| Review Mode | Passes Executed | Depth | Typical Duration |
|-------------|-----------------|-------|------------------|
| **SCAN** | 01, 02 (partial), 03 (partial), 04 (critical only) | Surface | 5-15 min |
| **DEEP** | 01-12 (targeted scope) | Comprehensive | 30-120 min |
| **COSMIC** | 01-12 (full) + cross-repo | Exhaustive | 2-8 hours |
| **FULL SYSTEM** | 01-12 (full) | Exhaustive | 2-4 hours |
| **DEEP CODE** | 03, 04, 05, 06, 07, 08 | Code-focused | 30-90 min |
| **ARCHITECTURE** | 01, 02, 06, 12 | Architecture-focused | 30-60 min |
| **SECURITY** | 02, 03, 04, 05, 06, 10, 12 | Security-focused | 45-120 min |
| **DATABASE** | 02, 03, 05, 06, 07, 12 | Data-focused | 30-60 min |
| **API & INTEGRATION** | 01, 02, 03, 04, 06, 07, 12 | Integration-focused | 30-60 min |
| **PERFORMANCE** | 02, 03, 05, 06, 07, 10, 12 | Performance-focused | 30-90 min |
| **UI/UX** | 01, 03, 06, 07, 09, 10, 11 | Frontend-focused | 30-60 min |
| **TESTING & RELIABILITY** | 02, 03, 05, 06, 07, 08, 10, 12 | Quality-focused | 30-60 min |
| **DEVOPS & INFRA** | 02, 04, 05, 07, 10, 11, 12 | Ops-focused | 30-60 min |
| **DOCUMENTATION** | 01, 02, 06, 11, 12 | Docs-focused | 20-45 min |
| **DEPENDENCY** | 02, 03, 04, 07, 10, 12 | Supply-chain focused | 20-45 min |
| **PR/DIFF** | 03, 04, 06, 07, 08 (changed files only) | Change-focused | 10-30 min |
| **PRE-RELEASE** | 02, 03, 04, 05, 06, 07, 08, 10, 12 | Release-focused | 45-120 min |
| **AI AGENT/SKILL** | 02, 03, 04, 08, 10, 11, 12 | AI-system focused | 30-60 min |
| **POST-FIX** | 03, 04, 06, 07, 08 (fix scope only) | Verification-focused | 10-30 min |
| **CROSS-REPO** | 01, 02, 06, 12 (multi-repo) | Ecosystem-focused | 60-180 min |
| **PRODUCT** | 01, 02, 09, 11, 12 | Product-focused | 30-60 min |

## Pass Descriptions

### PASS 01 — Product & Domain Intelligence
**When to run:** Always (foundational understanding)
**Scope:** Product vision, user problems, business objectives, domain entities, business rules, workflows, requirements
**Key questions:**
- What problem does this product solve?
- Who are the users and what are their workflows?
- What are the core domain entities and business rules?
- Does implementation match product intent?

### PASS 02 — System Architecture
**When to run:** All modes except trivial PR reviews
**Scope:** Architecture style, module boundaries, dependencies, cohesion, coupling, layering, runtime architecture
**Key questions:**
- Are module boundaries clear and respected?
- Is dependency direction correct (no cycles)?
- Are there god modules or duplicate subsystems?
- Does architecture support stated requirements?

### PASS 03 — Code Quality & Logic
**When to run:** DEEP, COSMIC, DEEP CODE, SECURITY, PERFORMANCE, PR/DIFF, PRE-RELEASE, POST-FIX
**Scope:** Correctness, readability, type safety, error handling, concurrency, edge cases
**Key questions:**
- Is code correct for all inputs and states?
- Are errors handled appropriately?
- Are there race conditions or resource leaks?
- Is the code maintainable and readable?

### PASS 04 — Security & Threat Model
**When to run:** COSMIC, SECURITY, PRE-RELEASE, DEEP (if auth/crypto present)
**Scope:** AuthN/AuthZ, secrets, injection, XSS/CSRF/SSRF, crypto, supply chain, logging
**Key questions:**
- Are trust boundaries enforced?
- Is user input validated at boundaries?
- Are secrets properly managed?
- Are dependencies free of known vulnerabilities?

### PASS 05 — Database & Data Integrity
**When to run:** COSMIC, DATABASE, DEEP (if DB-heavy), PRE-RELEASE
**Scope:** Schema, constraints, transactions, migrations, integrity, backup/recovery
**Key questions:**
- Are constraints enforced at DB level?
- Are migrations safe and reversible?
- Is referential integrity maintained?
- Is data ownership clear?

### PASS 06 — API & Integration
**When to run:** COSMIC, API, DEEP, SECURITY, PRE-RELEASE, ARCHITECTURE
**Scope:** Contracts, validation, versioning, error handling, idempotency, circuit breakers
**Key questions:**
- Are contracts well-defined and validated?
- Is backward compatibility maintained?
- Are timeouts and retries configured?
- Are external failures handled gracefully?

### PASS 07 — Performance & Scalability
**When to run:** COSMIC, PERFORMANCE, PRE-RELEASE, DEEP (if perf-critical)
**Scope:** CPU, memory, I/O, queries, caching, algorithms, scaling
**Key questions:**
- Are there measurable bottlenecks?
- Is caching strategy appropriate?
- Can the system scale horizontally?
- Are resource leaks present?

### PASS 08 — Testing & Quality Assurance
**When to run:** COSMIC, TESTING, PRE-RELEASE, DEEP, POST-FIX, PR/DIFF
**Scope:** Unit, integration, E2E, contract tests, coverage quality, CI reliability
**Key questions:**
- Do tests verify actual requirements?
- Are failure scenarios covered?
- Is CI reliable and fast?
- Are tests isolated and deterministic?

### PASS 09 — UI/UX & Design System
**When to run:** COSMIC, UI/UX, DEEP (if frontend), PRODUCT
**Scope:** Information architecture, accessibility, components, design tokens, states
**Key questions:**
- Is the UI accessible (WCAG AA)?
- Are loading/empty/error states implemented?
- Is the design system consistent?
- Does UX match product requirements?

### PASS 10 — DevEx & Infrastructure
**When to run:** COSMIC, DEVOPS, PRE-RELEASE, DEEP
**Scope:** Setup, build, CI/CD, deploy, monitoring, logging, developer docs
**Key questions:**
- Can a new developer set up in <30 min?
- Is CI/CD reliable and fast?
- Are deployments safe and reversible?
- Is observability sufficient?

### PASS 11 — Documentation & Governance
**When to run:** COSMIC, DOCUMENTATION, DEEP, PRE-RELEASE
**Scope:** Docs quality, accuracy, specs, changelog, governance, ownership
**Key questions:**
- Is documentation accurate and current?
- Are architectural decisions recorded?
- Is ownership clear for all components?
- Are release processes documented?

### PASS 12 — Strategic & Future-Proofing
**When to run:** COSMIC, ARCHITECTURE, SECURITY, PRE-RELEASE, AI AGENT
**Scope:** Technical debt, vendor lock-in, scaling limits, migration cost, evolution
**Key questions:**
- What is the cost of future migrations?
- Are there vendor lock-in risks?
- Does architecture support product evolution?
- Where is technical debt accumulating?

## Scope Definitions

### Scan Scope
- Root package.json / workspace config
- README, AGENTS.md
- Top-level architecture doc (if exists)
- Entry points (main, app, server)
- CI/CD workflow files
- Critical security config (auth, secrets)
- Test infrastructure config

### Deep Scope (Targeted)
- User-specified packages/modules
- All passes relevant to mode
- Full source code in scope
- Tests in scope
- Config in scope

### Cosmic Scope (Full)
- Entire repository (all packages)
- All 12 passes
- Cross-package analysis
- Related repos (if accessible and relevant)
- Git history for context

## Tool Integration Matrix

| Tool | Passes | Purpose |
|------|--------|---------|
| `grep` / `glob` | All | Code search, pattern detection |
| TypeScript `tsc --noEmit` | 02, 03, 06 | Type checking |
| ESLint | 03, 04, 08 | Linting, security rules |
| `pnpm test` / `cargo test` / `go test` | 08 | Test execution |
| `pnpm build` | 03, 07, 10 | Build validation |
| `npm audit` / `cargo audit` | 04, 12 | Dependency vulnerabilities |
| `gh` CLI | 11, 12 | GitHub Issues, PRs, Wiki |
| Database CLI | 05 | Schema inspection, query analysis |
| Profiling tools | 07 | Performance analysis |
| Accessibility tools | 09 | WCAG validation |

## Output Requirements by Mode

| Mode | Minimum Output |
|------|----------------|
| SCAN | Executive summary, top 5 risks, recommended next review mode |
| DEEP | Full report (sections 1-17), scorecard, prioritized findings |
| COSMIC | Full report + architecture maps + cross-repo analysis + roadmap |
| SPECIALIZED | Full report focused on relevant passes, targeted findings |

## Confidence Thresholds for Reporting

| Finding Severity | Minimum Confidence to Report |
|------------------|-------------------------------|
| CRITICAL | MEDIUM |
| HIGH | MEDIUM |
| MEDIUM | HIGH |
| LOW | HIGH |
| INFO | CONFIRMED or HIGH |

Never report CRITICAL or HIGH findings with LOW confidence without explicit "UNVERIFIED" label.