# MoonWitness Application Blueprint

**Ecosystem context:** A-L-L-A-H.COM is the public identity/gateway; MoonWitness is the integrated platform. Dock, Cockpit and Headquarter are experience roles within the unified product if approved; Moon UI is the shared design system, not a separate application. See [`docs/vision/ALLAH_COM_OFFICIAL_CANON.md`](docs/vision/ALLAH_COM_OFFICIAL_CANON.md).

**Status: PROPOSED · Architecture & single-application design authority**
**Edition:** MASTER FINAL v2.0 · Derived from `masterprompt.md` PILLAR 03–04 and repository evidence

---

## D06 — Master Application Blueprint

### 1. Architectural decision

**MOONWITNESS = ONE INTEGRATED WEB/API APPLICATION.**

All product capability lives in one application, one codebase, one bootstrap, one API boundary, one identity system, one authorization policy, one canonical database authority, one shared configuration model, one release lifecycle, one navigation system. Internal domain modules are allowed; separate independent product applications are not, without an explicit owner-approved ADR.

### 2. Target architecture

```text
                    INTERNET
                       |
                  REVERSE PROXY
                       |
              MOONWITNESS APPLICATION
                       |
          +------------+-------------+
          |                          |
       WEB LAYER                 API LAYER
          |                          |
          +------------+-------------+
                       |
                 APPLICATION CORE
                       |
       +---------------+----------------+
       |               |                |
   PLATFORM          DOMAINS          PRODUCT
   SERVICES          MODULES          EXPERIENCE
       |               |                |
   Identity          Corpus           Reader
   Authorization     Knowledge        Explorer
   I18N              Witness          Workspace
   Search            Story            Creative
   Workflow          Event            Journey
   Storage           Person           Admin UX
   Audit             Research         Character UX
   Jobs              Mizan            AI UX
       |               |                |
       +---------------+----------------+
                       |
                REPOSITORY LAYER
                       |
             CANONICAL DATABASE
                       |
           EXTERNAL INFRASTRUCTURE
           - Object storage
           - Email provider
           - AI providers
           - Other approved integrations
```

### 3. Layer responsibilities

| Layer | Responsibility |
|---|---|
| Web | Rendering, routing, navigation and user interaction |
| API | HTTP contracts, validation, authentication boundary |
| Application | Use cases and application orchestration |
| Domain | Canonical business rules and domain behavior |
| Repository | Data persistence abstraction |
| Platform | Reusable capabilities used across domains |
| Infrastructure | Database, storage, providers, telemetry, networking |

### 4. Modular monolith rules

- One primary application.
- One repository for new MoonWitness implementation.
- One application bootstrap.
- One API boundary.
- One canonical identity system.
- One authorization policy system.
- One primary transactional database authority.
- One shared configuration model.
- One release lifecycle.
- One application navigation system.
- Multiple internal domain modules.

Separate directories and internal packages are allowed when useful. Separate independent product applications are not allowed without an explicit owner-approved ADR.

### 5. Background processing

A background task does not automatically require a microservice. Use internal job abstractions for corpus ingestion, search indexing, AI execution, email notifications, scheduled tasks, file processing, reports and data reconciliation.

If a separate process is technically necessary, it must use the same codebase and release artifact, have a clearly defined process mode, share the existing identity and authorization authority, use the canonical database ownership boundary, avoid creating a second API or independent product, and be deployed only when justified.

Do not promise exactly-once arbitrary side effects. Use idempotency, retry limits, checkpoints and explicit failure handling.

### 6. Technology selection

Prefer the technology that minimizes total complexity and reuse cost. Audit existing choices and compare Node.js/TypeScript, Fastify or another existing HTTP framework, React/Next.js, existing UI packages, existing ORM, PostgreSQL, existing search capabilities, existing workflow and job libraries, and existing telemetry.

Do not introduce Rust, Go, Python, Redis, a graph database, a vector database, or another service simply because it exists in a historical repository. Introduce polyglot or additional infrastructure only when a measurable requirement justifies it.

### 7. Application structure

```text
moonwitness/
├── src/
│   ├── app/
│   │   ├── routes/
│   │   ├── pages/
│   │   ├── layouts/
│   │   └── api/
│   │
│   ├── platform/
│   │   ├── identity/
│   │   ├── authorization/
│   │   ├── tenants/
│   │   ├── i18n/
│   │   ├── search/
│   │   ├── storage/
│   │   ├── workflow/
│   │   ├── jobs/
│   │   ├── notifications/
│   │   ├── audit/
│   │   ├── configuration/
│   │   └── observability/
│   │
│   ├── domains/
│   │   ├── sources/
│   │   ├── corpus/
│   │   ├── ontology/
│   │   ├── persons/
│   │   ├── characters/
│   │   ├── witnesses/
│   │   ├── events/
│   │   ├── stories/
│   │   ├── evidence/
│   │   ├── research/
│   │   ├── legal/
│   │   ├── correlation/
│   │   ├── assessments/
│   │   ├── journeys/
│   │   ├── creative/
│   │   └── agents/
│   │
│   ├── shared/
│   │   ├── contracts/
│   │   ├── identifiers/
│   │   ├── validation/
│   │   ├── errors/
│   │   └── utilities/
│   │
│   ├── database/
│   ├── infrastructure/
│   └── bootstrap/
│
├── public/
├── assets/
├── tests/
├── scripts/
├── docs/
├── migrations/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

This is a reference structure, not a mandatory directory layout. Finalize it using the audited framework and actual project needs.

---

## D07 — Single Web/API Architecture

### 8. Web and API unification

Web and API are one application and one codebase. They are not separate products, portals, or authentication systems.

### 9. Canonical ownership

| Capability | Owner |
|---|---|
| HTTP boundary, authentication, request validation | `apps/api` |
| Shared DTOs, route definitions, web SDK | `@moonwitness/moonclient` |
| Models, fields, constraints, ownership, ACL, views, domain services | `ql_*` addons |
| Schema synchronization and data access | QlOrm (no Drizzle, no migration files) |
| Shared components and tokens | `@moonwitness/ui` |
| Identity | Unique to the unified app; external providers are adapters, not identity authorities |

### 10. Cross-domain rules

Every canonical entity has exactly one addon/domain owner and stable typed references to other domains. One domain may read another domain's data through explicit contracts. One domain must not silently create a copy of a canonical object owned by another domain.

Use: **ONE CANONICAL OWNER · EXPLICIT REFERENCES · REUSABLE CONTRACTS.**

### 11. Non-goals

- Recreate every historic product or repository.
- Operate multiple independent MoonWitness applications, portals, backends or identities.
- Import every dataset before rights and mapping are verified.
- Treat AI output as a canonical write or authoritative verdict.
- Add infrastructure based only on its presence in an old repository.
- Claim production readiness before deployment, recovery, security and acceptance evidence exist.

---

**Gate:** This blueprint is a planning document. No production feature coding, external issue creation, push, branch policy change, or migration begins until the owner reviews and ratifies the planning baseline.