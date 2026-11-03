# Domain Architecture Reference

## Domain-Driven Design (DDD) Applied Practically

### When to Use DDD
- Complex business logic with many rules
- Multiple domain experts needed
- Long-lived project with evolving requirements
- Need for clear ubiquitous language

### When NOT to Use Full DDD
- Simple CRUD applications
- Technical domains (infrastructure, tooling)
- Short-lived projects
- Team unfamiliar with DDD

### Core DDD Concepts (Practical Subset)

| Concept | Practical Application |
|---------|----------------------|
| **Ubiquitous Language** | Shared terms in code, docs, conversation. Enforce in PR reviews. |
| **Bounded Context** | Explicit context boundaries. Separate packages, schemas, teams. |
| **Entity** | Identity + lifecycle. Use when identity matters over time. |
| **Value Object** | Immutable, no identity. Use for concepts defined by attributes. |
| **Aggregate** | Consistency boundary. Single transaction. Root entity controls invariants. |
| **Domain Event** | Something that happened. Publish after transaction commits. |
| **Repository** | Abstract persistence. Domain defines interface, infra implements. |
| **Domain Service** | Logic that doesn't fit in entity/VO. Stateless, domain-specific. |
| **Factory** | Complex object creation. Encapsulate construction logic. |

### Domain Modeling Process

1. **Event Storming** (lightweight): Identify domain events, commands, aggregates
2. **Context Mapping**: Draw bounded contexts, relationships
3. **Aggregate Design**: Define consistency boundaries
4. **Entity/VO Identification**: Classify each concept
5. **Business Rules**: Capture invariants per aggregate
6. **Ubiquitous Language**: Document terms, enforce in code

### Aggregate Design Rules

| Rule | Rationale |
|------|-----------|
| One aggregate per transaction | Consistency boundary |
| Reference other aggregates by ID only | Decoupling, clear boundaries |
| Aggregate root controls all mutations | Invariant enforcement |
| Small aggregates preferred | Concurrency, performance |
| No ORM entities as aggregates | Separation of concerns |

### Domain Events

**When to Use:**
- Cross-aggregate consistency (eventual)
- Integration with other bounded contexts
- Audit trail, analytics, notifications
- Decoupling domain from infrastructure

**Event Structure:**
```typescript
interface DomainEvent {
  eventId: string;           // UUID
  eventType: string;         // "UserRegistered"
  aggregateId: string;       // Aggregate root ID
  aggregateType: string;     // "User"
  timestamp: Date;           // ISO 8601
  version: number;           // Event schema version
  payload: Record<string, unknown>; // Domain-relevant data
}
```

**Publishing:**
- After transaction commits (transactional outbox pattern)
- Idempotent consumers
- Schema versioning from day 1

### Context Mapping Patterns

| Pattern | When | Implementation |
|---------|------|----------------|
| **Shared Kernel** | Tight coupling, same team | Shared package, versioned |
| **Customer/Supplier** | One context serves another | Explicit API, consumer-driven contracts |
| **Conformist** | Downstream must follow upstream | Accept upstream model |
| **Anti-Corruption Layer** | Legacy/external integration | Translation layer, adapters |
| **Separate Ways** | No meaningful relationship | No integration |
| **Open Host Service** | Public API for many consumers | Published, versioned, documented |

## Domain Architecture Documentation

### Required Artifacts

1. **Context Map** — Visual + description of bounded contexts
2. **Domain Model** — Entities, VOs, aggregates per context
3. **Ubiquitous Language Glossary** — Terms, definitions, code mappings
4. **Aggregate Catalog** — Each aggregate: root, entities, VOs, invariants, events
5. **Domain Service Catalog** — Services, responsibilities, dependencies
6. **Domain Event Catalog** — Events, publishers, consumers, schemas

### Domain Model Template

```markdown
# Domain Model — [Bounded Context Name]

## Ubiquitous Language
| Term | Definition | Code Representation |
|------|------------|---------------------|
| User | Registered person | User entity (aggregate root) |
| Email | Verified email address | Email VO |
| Subscription | Active paid plan | Subscription entity |

## Aggregates
### User (Aggregate Root)
- **Identity:** UserId (UUID)
- **Entities:** Profile, Preferences
- **Value Objects:** Email, PasswordHash, Name
- **Invariants:**
  - Email must be unique (enforced by repository)
  - Password must meet policy (enforced in factory)
  - User must have verified email to access paid features
- **Domain Events Published:**
  - UserRegistered (after creation)
  - EmailVerified (after verification)
  - PasswordChanged (after change)

### Subscription (Aggregate Root)
- **Identity:** SubscriptionId (UUID)
- **Entities:** BillingCycle, PaymentMethod
- **Value Objects:** PlanId, Price, Currency
- **Invariants:**
  - Only one active subscription per user
  - Cannot cancel during trial period
  - Proration calculated on plan change
- **Domain Events Published:**
  - SubscriptionCreated
  - SubscriptionRenewed
  - SubscriptionCancelled
  - PaymentFailed

## Domain Services
### UserRegistrationService
- **Responsibility:** Orchestrate user creation, email verification, welcome flow
- **Dependencies:** UserRepository, EmailService, VerificationTokenGenerator
- **Used By:** Application service (RegisterUserUseCase)

## Domain Events
| Event | Publisher | Consumers | Schema Version |
|-------|-----------|-----------|----------------|
| UserRegistered | User aggregate | EmailService, Analytics, Billing | v1 |
| SubscriptionCancelled | Subscription aggregate | EmailService, AccessControl, Analytics | v1 |
```

## Integration with Package Architecture

| DDD Concept | Package Mapping |
|-------------|-----------------|
| Bounded Context | Top-level package (ql_billing, ql_auth) |
| Aggregate | Module within package (ql_billing/src/subscription/) |
| Domain Service | Module within package (ql_billing/src/services/) |
| Domain Event | Shared package (ql_events) or package-internal |
| Repository Interface | Package public API (ql_billing/src/repositories/) |
| Repository Implementation | Infrastructure package (ql_db, ql_infra) |

## Domain Architecture Checklist

- [ ] Bounded contexts identified and mapped
- [ ] Ubiquitous language documented
- [ ] Aggregates designed with clear invariants
- [ ] Entities vs Value Objects correctly classified
- [ ] Domain events defined for cross-aggregate needs
- [ ] Repository interfaces defined in domain layer
- [ ] Domain services identified (minimize)
- [ ] Context mapping patterns chosen for integrations
- [ ] Anti-corruption layers for legacy/external systems
- [ ] Package structure reflects domain boundaries