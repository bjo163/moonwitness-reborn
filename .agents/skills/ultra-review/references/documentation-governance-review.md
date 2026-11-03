# Documentation & Governance Review Reference

## Documentation Quality

### Documentation Types & Requirements

| Type | Audience | Required Sections | Freshness |
|------|----------|-------------------|-----------|
| README | All | Purpose, quick start, links | Every release |
| Architecture | Engineers | Context, decisions, diagrams, trade-offs | Major changes |
| API Reference | Consumers | Endpoints, schemas, examples, errors | Every API change |
| Developer Guide | Contributors | Setup, workflow, conventions, testing | Process changes |
| Operations Guide | SRE/Platform | Deploy, rollback, scaling, troubleshooting | Infra changes |
| User Guide | End users | Features, workflows, FAQ | Feature releases |
| Changelog | All | Version, date, changes (added/changed/fixed/removed) | Every release |

### Documentation Quality Criteria

| Criterion | Check |
|-----------|-------|
| Accuracy | Matches implementation (spot-check 10%) |
| Completeness | All public APIs documented |
| Consistency | Terminology, formatting, structure |
| Discoverability | Searchable, linked, indexed |
| Examples | Working, copy-pasteable, realistic |
| Versioning | Versioned with code, not separate |
| Accessibility | Semantic HTML, alt text, contrast |

### Documentation Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Drift | Docs outdated vs code | Docs-as-code, CI validation |
| Fragmentation | Scattered across wiki, README, Notion | Single source, clear index |
| Jargon | Unexplained acronyms, internal terms | Glossary, define on first use |
| Wall of text | No hierarchy, no scanning | Headings, lists, tables, diagrams |
| No examples | Abstract only | At least one per concept |
| Assumed knowledge | "As you know..." | Explain prerequisites |

## Architecture Documentation

### Required Artifacts

| Artifact | Format | Tooling |
|----------|--------|---------|
| System context diagram | C4 Level 1 | Structurizr, Mermaid, PlantUML |
| Container diagram | C4 Level 2 | Same |
| Component diagram | C4 Level 3 (key areas) | Same |
| Sequence diagrams | Key workflows | Mermaid, PlantUML |
| Data model | ERD | dbdocs, Mermaid, pgAdmin |
| Deployment diagram | Infrastructure | Mermaid, Cloudcraft |
| ADRs | Markdown | `adr-tools`, `adr-log` |

### Architecture Decision Records (ADRs)

| Field | Required |
|-------|----------|
| Title | Yes |
| Status | Proposed/Accepted/Deprecated/Superseded |
| Context | Yes |
| Decision | Yes |
| Consequences | Yes (positive, negative, neutral) |
| Date | Yes |
| Supersedes/Related | If applicable |

## Governance

### Ownership Model

| Level | Owner | Responsibility |
|-------|-------|----------------|
| Repository | Team | Overall health, priorities |
| Package/Module | Individual/Team | Code quality, bugs, features |
| Infrastructure | Platform team | Clusters, networking, shared services |
| Data | Data team | Schemas, migrations, quality |
| Security | Security team | Policies, audits, incidents |
| Documentation | Authors + reviewers | Accuracy, freshness |

### Code Review Policy

| Rule | Standard |
|------|----------|
| Required reviewers | 1+ for features, 2+ for security/critical |
| Self-merge | Never |
| Review scope | Logic, tests, docs, security, performance |
| Approval | Explicit "Approved" not "LGTM" |
| Blocking | Security, data loss, breaking changes |

### Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Releases only | Required reviews, status checks, linear history |
| `dev` / `develop` | Integration | Required reviews, status checks |
| `feat/*` | Features | None (local) |
| `fix/*` | Bug fixes | None (local) |
| `release/*` | Release prep | Required reviews |
| `hotfix/*` | Production fixes | Required reviews, fast-track |

### Release Process

| Step | Automation | Gate |
|------|------------|------|
| Version bump | `changesets`, `semantic-release` | Manual trigger |
| Changelog | Auto-generated from commits/PRs | Review |
| Build | CI pipeline | All checks pass |
| Staging deploy | Auto on version tag | Smoke tests |
| Production deploy | Manual approval | Staging verified |
| Rollback | One-click | Monitored |

### Incident Process

| Phase | Actions |
|-------|---------|
| Detection | Alert fires, on-call notified |
| Triage | Severity, impact, owner assigned |
| Mitigation | Restore service (not necessarily fix root cause) |
| Resolution | Root cause fix deployed |
| Postmortem | Blameless, timeline, action items, shared |

## Issue & Project Management

### Issue Quality

| Field | Required |
|-------|----------|
| Title | Clear, specific, actionable |
| Description | Context, problem, desired outcome |
| Acceptance Criteria | Testable, specific |
| Labels | Type, priority, component, effort |
| Assignee | Single owner |
| Milestone | Target release |

### Project Board

| Column | WIP Limit | Policy |
|--------|-----------|--------|
| Backlog | ∞ | Prioritized |
| Ready | 2× team size | Defined, estimated |
| In Progress | 1 per person | Active work |
| Review | 2 per person | Awaiting review |
| Done | ∞ | Released |

## Documentation & Governance Scorecard

| Dimension | Weight | Score | Evidence |
|-----------|--------|-------|----------|
| README | 10% | | Purpose, start, links current |
| Architecture Docs | 20% | | C4 diagrams, ADRs current |
| API Reference | 20% | | Complete, examples, versioned |
| Developer Guide | 15% | | Setup, workflow, conventions |
| Operations Guide | 15% | | Deploy, rollback, troubleshooting |
| Governance | 10% | | Ownership, review, release process |
| Issue Management | 10% | | Quality, board, priorities |

## Investigation Checklist

- [ ] README — purpose clear, quick start works, links valid?
- [ ] Architecture docs — C4 diagrams exist, match code?
- [ ] ADRs — exist for major decisions, current status?
- [ ] API reference — complete, examples work, versioned?
- [ ] Developer guide — setup works, conventions documented?
- [ ] Operations guide — deploy/rollback documented, tested?
- [ ] Changelog — every release, standard format?
- [ ] Ownership — clear for all packages, infra, data?
- [ ] Code review — policy enforced, gates in CI?
- [ ] Branch strategy — followed, protected branches?
- [ ] Release process — automated, gated, rollback tested?
- [ ] Incident process — runbook, postmortems done?
- [ ] Issues — templates, labels, acceptance criteria?
- [ ] Project board — WIP limits, flow visible?