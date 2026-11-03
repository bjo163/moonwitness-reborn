# Project Discovery Reference

## Discovery Order & Methodology

### Phase 1: Orientation (Always)
1. **Repository Structure** — `glob **/*`, `tree` — understand monorepo layout, package boundaries, root configs
2. **Agent Instructions** — `AGENTS.md`, `CLAUDE.md`, `.github/instructions/` — understand agent rules, conventions, workflow
3. **README & Root Docs** — `README.md`, `docs/` root — project purpose, quick start, key links
4. **Package Manifests** — `package.json`, `pnpm-workspace.yaml`, `Cargo.toml`, `go.mod`, `pyproject.toml` — workspace, dependencies, scripts

### Phase 2: Product & Requirements
5. **Product Vision** — `docs/vision/`, `docs/product/`, `VISION.md`, `PRODUCT.md` — product purpose, target users, business objectives
6. **Requirements** — `docs/requirements/`, `SPEC.md`, `REQUIREMENTS.md` — functional/non-functional requirements, user stories
7. **Roadmap** — `ROADMAP.md`, `TODO.md`, GitHub Projects — planned work, priorities, timeline

### Phase 3: Architecture & Technical
8. **Architecture Docs** — `docs/architecture/`, `ARCHITECTURE.md`, `DESIGN.md` — system architecture, design decisions, ADRs
9. **Technical Specifications** — `docs/specs/`, `spec/` — detailed technical specs, API contracts, data models
10. **Entry Points** — `main.ts`, `app.ts`, `server.ts`, `cli.ts`, `index.ts` — application bootstrap, routing, middleware

### Phase 4: Implementation
11. **Source Code** — Domain packages, shared packages, application code — understand implementation patterns
12. **Database** — `migrations/`, `schema/`, `prisma/`, `drizzle/`, `sql/` — schemas, migrations, seed data
13. **API Contracts** — `openapi.yaml`, `graphql/schema.graphql`, `proto/`, `tRPC/` — API definitions, schemas
14. **Configuration** — `.env*`, `config/`, `docker-compose.yml`, `k8s/`, `terraform/` — env, infra, deployment config

### Phase 5: Quality & Operations
15. **Tests** — `__tests__/`, `tests/`, `spec/`, `cypress/`, `playwright/` — unit, integration, E2E, contract tests
16. **Build & Deploy** — `Dockerfile`, `.github/workflows/`, `scripts/`, `Makefile`, `justfile` — CI/CD, build, deploy
17. **Changelog** — `CHANGELOG.md`, `RELEASES.md`, GitHub Releases — release history, versioning
18. **GitHub** — Issues, PRs, Projects, Wiki — task tracking, discussions, documentation
19. **Git History** — `git log`, branches, tags — recent changes, patterns, ownership

### Phase 6: Ecosystem (When Relevant)
20. **Related Repositories** — Cross-repo dependencies, shared packages, integration points

## Discovery Tools by Agent Capability

| Tool | Purpose | Command Pattern |
|------|---------|-----------------|
| `glob` | File discovery | `glob "**/*.ts"`, `glob "packages/*/package.json"` |
| `grep` / `rg` | Content search | `rg -n "pattern" --type ts`, `grep -r "TODO" --include="*.md"` |
| `read` | File inspection | Read key files fully, use offset/limit for large files |
| `bash` | Repository commands | `git log --oneline -20`, `pnpm ls --depth=0`, `find . -name "*.md"` |

## Knowledge Classification Framework

Every discovered fact must be classified:

| Classification | Criteria | Example |
|----------------|----------|---------|
| **VERIFIED** | Direct evidence in repo: code, config, docs, tool output | "Package ql_auth exports createToken function at packages/ql_auth/src/token.ts:15" |
| **INFERRED** | Reasonable conclusion from multiple evidence points | "Auth uses JWT with RS256 based on crypto import and config" |
| **ASSUMED** | Temporary working assumption, needs validation | "Assume PostgreSQL 15+ based on docker-compose.yml" |
| **UNKNOWN** | Not yet investigated or inaccessible | "Production deployment architecture unknown" |
| **CONFLICTING** | Sources disagree | "README says REST API, code shows GraphQL" |

## Project Knowledge Ledger Template

```markdown
# Project Knowledge Ledger — [Project Name]

## Product Vision
- **VERIFIED:** [From docs/vision.md]
- **INFERRED:** [From README + issue analysis]
- **UNKNOWN:** [Monetization model, target metrics]

## Current Architecture
- **VERIFIED:** Modular monolith with ql_* packages (pnpm-workspace.yaml)
- **VERIFIED:** PostgreSQL primary database (docker-compose.yml, migrations)
- **INFERRED:** Event-driven billing (Kafka topics in code)
- **UNKNOWN:** Service mesh, external API integrations

## Technical Stack
- **VERIFIED:** TypeScript, Node.js, React, Next.js (package.json)
- **VERIFIED:** PostgreSQL, Redis (docker-compose.yml)
- **INFERRED:** Prisma ORM (schema.prisma exists)
- **ASSUMED:** Kubernetes deployment (k8s/ directory exists)

## Constraints
- **VERIFIED:** Must maintain backward compatibility with v1 API (CHANGELOG.md)
- **VERIFIED:** Zero-downtime deployments required (docs/architecture/deployment.md)
- **ASSUMED:** Team prefers incremental migration over big bang

## Open Questions
- [ ] What is the exact auth token format? (JWT vs opaque)
- [ ] Is multi-tenancy required? (Not in current schema)
- [ ] What are the SLO targets? (Not documented)
```

## Staged Discovery for Large Repositories

### Stage 1: Index (5-10 min)
- `glob "packages/*/package.json"` — list all packages
- `glob "docs/**/*.md"` — list all documentation
- `glob ".github/workflows/*.yml"` — list CI/CD
- Read: AGENTS.md, README.md, pnpm-workspace.yaml

### Stage 2: Architecture (15-30 min)
- Read architecture docs
- Read package manifests for dependency graph
- Read entry points
- Build module responsibility map

### Stage 3: Deep Dive (As Needed)
- Targeted reading of specific packages
- Database schema inspection
- API contract review
- Test infrastructure analysis

### Stage 4: Synthesis
- Consolidate findings
- Identify contradictions
- Classify all knowledge
- Document open questions

## Evidence Standards for Planning

| Evidence Type | Strength | Use For |
|---------------|----------|---------|
| Code inspection | HIGH | Implementation patterns, actual behavior |
| Config files | HIGH | Actual settings, dependencies, scripts |
| Tool output (lint, test, build) | HIGH | Verified working state |
| Documentation + code match | MEDIUM | Intent vs implementation |
| Inferred from patterns | MEDIUM | Conventions, likely behavior |
| Assumption | LOW | Planning starting points only |
| Unverified claim | NONE | Never base decisions on this |

## Discovery Checklist

- [ ] Repository structure mapped
- [ ] Agent instructions read
- [ ] README and root docs read
- [ ] Package manifests analyzed
- [ ] Product vision documented
- [ ] Requirements cataloged
- [ ] Architecture docs reviewed
- [ ] Technical specs reviewed
- [ ] Entry points identified
- [ ] Source code patterns understood
- [ ] Database schema reviewed
- [ ] API contracts reviewed
- [ ] Configuration mapped
- [ ] Test infrastructure understood
- [ ] CI/CD pipelines reviewed
- [ ] Changelog reviewed
- [ ] GitHub Issues/Projects reviewed (if accessible)
- [ ] Git history scanned
- [ ] Related repos identified (if ecosystem)
- [ ] Knowledge ledger created with classifications
- [ ] Contradictions documented
- [ ] Open questions listed