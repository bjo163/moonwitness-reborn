# MoonWitness Ecosystem Context Reference

## MoonWitness Engineering Preferences

When planning for MoonWitness ecosystem projects, adapt to these verified preferences.

### Architecture Principles

| Principle | Application |
|-----------|-------------|
| **Clean Modular Architecture** | ql_* packages, single domain per package, explicit public API |
| **Reusable & Composable** | Shared kernel (ql_shared), composites over primitives, composition over inheritance |
| **Enterprise-Grade Maintainability** | Strict TypeScript, comprehensive tests, documentation-first, audit before implementation |
| **Clear Package Ownership** | Each package has owning team, explicit responsibilities, no shared ownership |
| **Strong Separation of Concerns** | Domain → Application → Infrastructure layering, no cross-layer leaks |
| **Documentation-First Development** | Specs before code, ADRs for major decisions (when requested), living docs |
| **Deep Audit Before Implementation** | Ultra Review before major changes, evidence-based decisions |
| **Small Independent GitHub Issues** | Single responsibility, verifiable ACs, dependency-aware sequencing |
| **Consistent Shared Design Systems** | ql_ui primitives/composites, design tokens, MoonWitness aesthetic |
| **Proper Cross-Repository Contracts** | Shared packages versioned, API contracts published, consumer-driven contracts |
| **Strict But Practical Standards** | ESLint + TypeScript strict, but pragmatic — no dogma |
| **Avoid Unnecessary Complexity** | No microservices without need, no event sourcing without audit need, no abstractions without reuse |
| **Avoid ADR Bureaucracy** | Document decisions in specs, only formal ADRs when explicitly requested |

### Branch & Release Conventions

| Convention | Pattern |
|------------|---------|
| **Branch Naming** | `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>` |
| **Branch Promotion** | `dev` → `main` via Release workflow |
| **Commit Messages** | Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:` |
| **Versioning** | Semantic versioning per package, workspace lockstep |
| **Changelog** | Auto-generated from commits, manual curation for releases |

### MoonWitness UI Design Direction

When planning UI/UX for MoonWitness projects, respect the documented aesthetic:

| Style | Characteristics | When to Apply |
|-------|----------------|---------------|
| **Funky Gen-Z** | Bold colors, asymmetric layouts, experimental typography, playful | Consumer-facing, creative tools |
| **Grunge** | Textured, distressed, raw, imperfect, high contrast | Edgy brands, music, youth culture |
| **Industrial** | Monospace, technical, utilitarian, grid-based, raw materials | Developer tools, B2B, technical products |
| **Manga-Inspired** | Dynamic lines, speed lines, dramatic contrast, expressive | Gaming, entertainment, youth |
| **Neobrutalist** | Raw, unpolished, bold borders, high contrast, system fonts | Bold statements, anti-corporate |
| **Futuristic** | Gradients, glow, glassmorphism (restrained), motion | Tech-forward, AI, innovation |
| **Premium Game HUD** | Data-dense, real-time, layered, glass/dark panels, high info density | Dashboards, monitoring, gaming |

**Application Rules:**
- Design direction specified per project in `DESIGN.md` or equivalent
- Use design tokens exclusively — no hardcoded values
- Antislop rules apply: no generic AI patterns, purposeful techniques only
- Accessibility mandatory: WCAG 2.1 AA minimum
- Component library: ql_ui primitives + composites

### Package Structure (MoonWitness Standard)

```
packages/
├── ql_shared/           # Kernel: types, Result<T>, base classes, utilities
├── ql_kernel/           # Core infrastructure: events, clock, UUID, config
├── ql_auth/             # Authentication & authorization domain
├── ql_user/             # User management domain
├── ql_billing/          # Billing & payments domain
├── ql_api/              # API gateway & routing
├── ql_web/              # Frontend application (Next.js)
├── ql_ui/               # Design system (primitives, composites, tokens)
├── ql_db/               # Database infrastructure (Prisma, migrations)
├── ql_cache/            # Caching infrastructure (Redis)
├── ql_events/           # Event bus infrastructure (Kafka/Redis Streams)
├── ql_infra/            # Shared infrastructure (Docker, K8s configs)
└── ql_docs/             # Documentation tooling
```

### Cross-Repository Integration

| Repository | Relationship | Contract |
|------------|--------------|----------|
| `moonwitness-reborn` | Main monorepo | — |
| `moonclient` | Shared SDK | OpenAPI + TypeScript types |
| `moonwitness-ui` | Design system | ql_ui package + tokens |
| `moonwitness-docs` | Documentation | Markdown + tooling |
| `moonwitness-infra` | Infrastructure | Terraform modules + Helm charts |

**Integration Rules:**
- Shared packages published to private registry
- API contracts via OpenAPI, validated in CI
- Consumer-driven contracts for breaking changes
- Version alignment via workspace protocol

### MoonWitness Planning Adaptations

When using Ultra Planner for MoonWitness projects:

1. **Default to ql_* package architecture** — Don't propose alternative structures without justification
2. **Use MoonWitness conventions** — Branch naming, commit format, versioning
3. **Respect design direction** — Check `DESIGN.md` for project-specific aesthetic
4. **Leverage existing packages** — ql_shared, ql_kernel, ql_ui, ql_auth, ql_user, ql_billing
5. **Plan for cross-repo contracts** — moonclient SDK, OpenAPI, shared types
6. **Include MoonWitness quality gates** — TypeScript strict, ESLint, tests, security scan
7. **Document in MoonWitness style** — Specs in `spec/`, living documentation
8. **Avoid ADRs unless requested** — Decisions in specs with trade-off sections

### MoonWitness Context Checklist

- [ ] Project confirmed as MoonWitness ecosystem
- [ ] Design direction identified (DESIGN.md or stakeholder)
- [ ] Existing ql_* packages inventoried
- [ ] Cross-repo dependencies mapped
- [ ] MoonWitness conventions applied (branching, commits, versioning)
- [ ] Design system (ql_ui) leveraged for UI work
- [ ] Quality gates aligned (TypeScript strict, ESLint, test pyramid)
- [ ] Documentation structure follows `spec/` convention
- [ ] ADRs only created if explicitly requested
- [ ] Release workflow compatible (dev → main)