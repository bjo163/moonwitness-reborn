# Package Specification Template

**Package:** ql_<domain>
**Spec ID:** SPEC-PKG-<NNN>
**Version:** 1.0.0
**Status:** DRAFT / REVIEW / APPROVED / BASELINED
**Date:** YYYY-MM-DD
**Author:** [Name]
**Reviewers:** [Names]
**Owner Team:** [Team]

---

## 1. Package Identity

**Name:** ql_<domain>
**Type:** Domain / Application / Infrastructure / Shared
**Domain:** [Business domain, e.g., Authentication, User Management, Billing]
**Purpose:** [One sentence: what this package does and why it exists]
**Responsibilities:** [Explicit list of what this package owns]
**Non-Responsibilities:** [What this package explicitly does NOT do]

---

## 2. Public API (Exports)

**File:** `src/index.ts`

```typescript
// Public API - ONLY these exports
export { <Entity> } from './domain/<entity>';
export { <Repository> } from './repositories/<entity>-repository';
export { <UseCase> } from './use-cases/<use-case>';
export { <DomainEvent> } from './domain/events/<event>';
export type { <Type> } from './domain/types';
```

**Exported Symbols:**
| Symbol | Type | Description |
|--------|------|-------------|
| `<Entity>` | Class | Domain entity / aggregate root |
| `<Repository>` | Interface | Persistence abstraction |
| `<UseCase>` | Class | Application service |
| `<DomainEvent>` | Class | Domain event |
| `<Type>` | Type | Domain-specific types |

**Package.json Exports:**
```json
{
  "name": "ql_<domain>",
  "exports": {
    ".": "./src/index.ts",
    "./domain": "./src/domain/index.ts",
    "./repositories": "./src/repositories/index.ts"
  }
}
```

---

## 3. Domain Model

### Entities (Aggregate Roots)
| Entity | Identity | Key Attributes | Invariants |
|--------|----------|----------------|------------|
| `<Entity>` | `<EntityId>` (UUID) | [attrs] | [business rules] |

### Value Objects
| VO | Attributes | Validation | Equality |
|----|------------|------------|----------|
| `<VO>` | [attrs] | [rules] | Structural |

### Domain Events
| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `<Event>` | `<Entity>` | [fields] | [packages] |

### Domain Services
| Service | Responsibility | Dependencies |
|---------|----------------|--------------|
| `<Service>` | [What it does] | [deps] |

---

## 4. Repository Interfaces

**Location:** `src/repositories/`

```typescript
// Example: user-repository.ts
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
```

| Repository | Methods | Implementation Package |
|------------|---------|------------------------|
| `<Entity>Repository` | findById, findBy..., save, delete | ql_db / ql_infra |

---

## 5. Use Cases (Application Services)

**Location:** `src/use-cases/`

| Use Case | Input | Output | Business Rules | Transactions |
|----------|-------|--------|----------------|--------------|
| `<UseCase>` | `<Input>` | `<Output>` | [rules] | [boundary] |

---

## 6. Dependencies

### Internal Dependencies
| Package | Purpose | Version |
|---------|---------|---------|
| ql_shared | Types, Result<T>, base | workspace:* |
| ql_kernel | Events, Clock, UUID | workspace:* |
| ql_<other> | [Purpose] | workspace:* |

### External Dependencies
| Dependency | Version | Purpose |
|------------|---------|---------|
| <dep> | ^x.y.z | [Purpose] |

### Dependency Direction Compliance
- ✓ Depends only on: ql_shared, ql_kernel, ql_<downstream-domain>
- ✗ Does NOT depend on: ql_db, ql_api, ql_<upstream-domain>, infrastructure

---

## 7. Data Contracts

### Persistence Schema (if applicable)
| Table | Columns | Constraints |
|-------|---------|-------------|
| `<entity>s` | id (PK), ..., created_at, updated_at, version | PK, FK, UK, CHECK |

### Migration Behavior
- [ ] Backward compatible (add nullable columns)
- [ ] Reversible (DOWN migration tested)
- [ ] Zero-downtime (expand-contract pattern)

---

## 8. API Contracts (if package exposes HTTP)

### Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/v1/<domain>/<action> | [Description] | JWT/API Key |

### Request/Response
[Reference to API spec or inline examples]

---

## 9. Security

### Trust Boundaries
[Diagram or description of where this package sits]

### Authorization
- **Model:** RBAC / ABAC / ReBAC
- **Permissions:** [List permissions this package defines/checks]
- **Object-Level:** [How object-level access is enforced]

### Sensitive Data
| Data | Classification | Protection |
|------|----------------|------------|
| [Field] | PII / Secret / Internal | Encryption, masking, audit |

### Threat Scenarios
| Threat | Mitigation |
|--------|------------|
| [Threat] | [Mitigation] |

---

## 10. Reliability

### Failure Modes
| Scenario | Behavior | Recovery |
|----------|----------|----------|
| Dependency unavailable | Circuit breaker / fallback / error | Auto-recover / manual |
| Invalid input | Validation error (400/422) | Client retry |
| Concurrency conflict | Optimistic lock error (409) | Client retry with backoff |

### Timeouts & Retries
| Operation | Timeout | Retry Policy |
|-----------|---------|--------------|
| DB query | 3s | 2x with exponential backoff |
| External API | 10s | 3x (idempotent only) |

### Idempotency
- [ ] Mutations use idempotency keys
- [ ] Events are idempotent (deduplication by eventId)

---

## 11. Performance

### Targets
| Operation | p99 Target | Load |
|-----------|------------|------|
| <Operation> | <Target> | <RPS> |

### Optimization
- [ ] Connection pooling
- [ ] Prepared statements
- [ ] Caching strategy
- [ ] Async processing for heavy operations

---

## 12. Testing Requirements

### Unit Tests (Domain Logic)
| Test Case | Scenario | Coverage Target |
|-----------|----------|-----------------|
| `<Entity>_invariant` | Invariant enforcement | 100% branches |
| `<Service>_rule` | Business rule | 100% branches |

### Integration Tests (Use Cases)
| Test Case | Scenario | Dependencies |
|-----------|----------|--------------|
| `<UseCase>_success` | Happy path | Testcontainers DB |
| `<UseCase>_failure` | Error paths | Testcontainers DB |

### Contract Tests
- [ ] Repository interface contract tests
- [ ] Event schema validation

---

## 13. Acceptance Criteria

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| AC-001 | Package builds and passes typecheck | `tsc --noEmit` |
| AC-002 | All exports accessible via public API | Import test |
| AC-003 | No internal modules leaked | `eslint no-restricted-imports` |
| AC-004 | Dependency rules enforced | `madge --circular` |
| AC-005 | Unit tests pass with >90% coverage | `pnpm test` |
| AC-006 | Domain events published correctly | Integration test |

---

## 14. Implementation Constraints

- [ ] Follow ql_* package structure
- [ ] Use ql_shared Result<T> for error handling
- [ ] Emit domain events from aggregates (not use cases)
- [ ] Repository interfaces in domain, implementations in infra
- [ ] No direct database imports (use repository interface)
- [ ] Follow MoonWitness naming conventions
- [ ] All strings externalized for i18n

---

## 15. Open Questions

- [ ] Question 1 — Blocker: [What prevents resolution]
- [ ] Question 2 — Blocker: [What prevents resolution]

---

## 16. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | YYYY-MM-DD | [Name] | Initial version |