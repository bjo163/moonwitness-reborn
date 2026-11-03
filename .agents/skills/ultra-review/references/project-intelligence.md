# Project Intelligence Reference

## Knowledge Acquisition Order

Read materials in this sequence to build a reliable project model:

1. **Repository Structure** — `glob **/*`, understand monorepo layout, package boundaries
2. **Agent Instructions** — `AGENTS.md`, `CLAUDE.md`, `.github/instructions/`
3. **Project Introduction** — `README.md`, root documentation
4. **Product Vision** — Product specs, vision docs, `docs/vision/`, `docs/product/`
5. **Technical Specifications** — `docs/specs/`, `docs/architecture/`, `ARCHITECTURE.md`
6. **Package Manifests** — `package.json`, `pnpm-workspace.yaml`, `Cargo.toml`, `go.mod`, `pyproject.toml`
7. **Entry Points** — `main.ts`, `index.ts`, `app.ts`, `server.ts`, `cli.ts`
8. **Source Code** — Domain packages, shared packages, application code
9. **Database** — Migrations, schemas, ORM models, seed files
10. **API Contracts** — OpenAPI, GraphQL schemas, tRPC routers, Protobuf
11. **Configuration** — `.env*`, `config/`, `docker-compose.yml`, `k8s/`
12. **Tests** — Unit, integration, E2E, contract tests, test infrastructure
13. **Build/Deploy** — `Dockerfile`, `.github/workflows/`, `scripts/`, `Makefile`
14. **Changelog** — `CHANGELOG.md`, `RELEASES.md`, GitHub Releases
15. **Roadmap** — `TODO.md`, `ROADMAP.md`, GitHub Projects, Issues
16. **GitHub** — Issues, PRs, Projects, Wiki (when accessible)
17. **Git History** — `git log`, branches, tags, recent commits
18. **Related Repos** — Cross-repo dependencies when accessible

## Context Ledger Format

Maintain a compact investigation ledger:

```markdown
## Context Ledger

| Category | Item | Evidence | Confidence |
|----------|------|----------|------------|
| Verified | [confirmed fact] | [source: file:line or tool output] | CONFIRMED |
| Inferred | [evidence-supported conclusion] | [supporting evidence] | HIGH/MEDIUM |
| Assumed | [temporary assumption] | [why assumed] | LOW |
| Unknown | [missing information] | [what blocks investigation] | UNKNOWN |
| Contradiction | [conflicting sources] | [source A vs source B] | - |
| Investigated | [area inspected] | [files/tools used] | - |
| Pending | [area needing investigation] | [why pending] | - |
```

## Knowledge Consistency Checks

Compare these pairs to identify contradictions:

| Dimension A | Dimension B | Check Method |
|-------------|-------------|--------------|
| Product Vision | Actual Functionality | Trace features to vision doc |
| Documentation | Implementation | Spot-check key claims |
| API Spec | API Behavior | Compare OpenAPI to handler code |
| DB Schema | Runtime Usage | Check ORM models vs migrations |
| Tests | Requirements | Map test coverage to requirements |
| Deploy Config | App Config | Verify env vars, secrets, ports |
| Package Contracts | Actual Deps | `pnpm ls`, `cargo tree`, `go mod graph` |
| Roadmap | Architecture | Check if arch supports planned features |

## Progressive Disclosure Strategy

1. **Phase 1 — Orientation** (scan): Repository structure, README, AGENTS.md, package manifests, entry points
2. **Phase 2 — Architecture** (deep): Architecture docs, package boundaries, dependency graph, data flows
3. **Phase 3 — Implementation** (deep): Source code, tests, configs, database, APIs
4. **Phase 4 — Operations** (deep): CI/CD, deploy, monitoring, documentation, governance
5. **Phase 5 — Synthesis** (cosmic): Cross-cutting analysis, strategic assessment

Only load reference files relevant to the current phase and review mode.

## Evidence Standards

| Evidence Type | Strength | Example |
|---------------|----------|---------|
| Direct code inspection | HIGH | File:line reference |
| Tool output (lint, typecheck, test) | HIGH | Command output |
| Test case demonstrating behavior | HIGH | Test file:line |
| Documentation + code match | MEDIUM | Doc claim verified in code |
| Inferred from patterns | MEDIUM | Consistent pattern across files |
| Assumption | LOW | "Likely because..." |
| Unverified claim | NONE | "Documentation says..." without verification |

## Investigation Ledger Template

```markdown
# Investigation Ledger — [Review ID]

## Scope
- Repository: [name/path]
- Mode: [scan/deep/cosmic/specialized]
- Date: [ISO date]
- Investigator: [agent identifier]

## Verified Facts
- [ ] Fact 1 — Evidence: [source]
- [ ] Fact 2 — Evidence: [source]

## Inferred Conclusions
- [ ] Conclusion 1 — Evidence: [supporting facts] — Confidence: [HIGH/MEDIUM]

## Assumptions (Require Validation)
- [ ] Assumption 1 — Reason: [why assumed] — Validation: [how to verify]

## Unknowns
- [ ] Unknown 1 — Blocked by: [what prevents investigation]

## Contradictions Found
- [ ] Contradiction 1 — Source A: [ref] vs Source B: [ref]

## Areas Investigated
- [ ] Area 1 — Method: [tools/files]

## Areas Pending
- [ ] Area 1 — Reason: [why pending]
```