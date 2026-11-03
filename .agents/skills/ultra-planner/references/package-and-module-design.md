# Package and Module Design Reference

## Package Architecture Principles

### 1. Package Responsibility Rules

| Rule | Description |
|------|-------------|
| **Single Domain** | Each package owns one business domain |
| **Explicit Public API** | Only `index.ts` (or equivalent) exports public interface |
| **Internal Encapsulation** | Internal modules not importable from outside |
| **Dependency Direction** | Domain → Shared → Infrastructure (never reverse) |
| **Versioned Together** | All packages in workspace version in lockstep |
| **Independent Build** | Each package builds, tests, lints independently |

### 2. Package Types in Monorepo

| Type | Naming | Purpose | Dependencies |
|------|--------|---------|--------------|
| **Domain** | `ql_<domain>` | Business logic, entities, rules | Shared only |
| **Application** | `ql_<app>` | Use cases, orchestration | Domain, Shared |
| **Infrastructure** | `ql_<infra>` | DB, cache, queue, external APIs | Domain (interfaces) |
| **Shared/Kernel** | `ql_shared`, `ql_kernel` | Types, utilities, base classes | None (or minimal) |
| **Interface** | `ql_<protocol>` | API clients, SDKs | Shared |
| **Platform** | `ql_platform` | Build, deploy, dev tools | None |

### 3. Package Structure Template

```
packages/ql_<domain>/
├── package.json           # Name, version, dependencies, exports
├── tsconfig.json          # Extends root, strict mode
├── src/
│   ├── index.ts           # PUBLIC API ONLY - re-exports
│   ├── domain/            # Entities, VOs, aggregates, events
│   │   ├── <entity>.ts
│   │   ├── <value-object>.ts
│   │   └── events/
│   ├── repositories/      # Repository INTERFACES (port)
│   │   └── <entity>-repository.ts
│   ├── services/          # Domain services
│   │   └── <service>.ts
│   ├── use-cases/         # Application services (optional)
│   │   └── <use-case>.ts
│   └── types/             # Domain-specific types
├── tests/                 # Unit tests (domain logic)
│   └── <entity>.test.ts
└── README.md              # Package purpose, API docs
```

### 4. Export Discipline

**Root `index.ts` — ONLY public API:**
```typescript
// GOOD: Explicit, controlled exports
export { User } from './domain/user';
export { UserRepository } from './repositories/user-repository';
export { RegisterUser } from './use-cases/register-user';
export { UserRegistered } from './domain/events/user-registered';
export type { UserId, Email } from './domain/types';

// BAD: Wildcard exports, internal leakage
export * from './domain';           // Exposes internals
export * from './repositories';     // Exposes implementation details
export { UserFactory } from './domain/user-factory'; // Internal
```

**`package.json` exports field:**
```json
{
  "name": "ql_user",
  "exports": {
    ".": "./src/index.ts",
    "./domain": "./src/domain/index.ts",
    "./repositories": "./src/repositories/index.ts"
  }
}
```

### 5. Module Design Within Package

| Module Type | Responsibility | Testing |
|-------------|----------------|---------|
| **Entity** | Identity, lifecycle, invariants | Unit: invariants, state transitions |
| **Value Object** | Immutable, equality, validation | Unit: construction, equality, serialization |
| **Aggregate Root** | Consistency boundary, event publishing | Unit: commands, invariants, events |
| **Domain Service** | Cross-entity logic, no state | Unit: business rules, mock repositories |
| **Repository Interface** | Persistence abstraction | Contract tests |
| **Use Case** | Orchestration, transactions, auth | Integration: flow, authZ, side effects |
| **Event** | Domain occurrence, payload | Unit: serialization, schema validation |

### 6. Dependency Rules Enforcement

**Allowed:**
```
ql_user (domain) → ql_shared (types, utils)
ql_auth (domain) → ql_user (domain), ql_shared
ql_api (app) → ql_auth, ql_user, ql_billing
ql_db (infra) → ql_user (implements UserRepository)
```

**Forbidden:**
```
ql_user → ql_auth (circular)
ql_user → ql_db (domain depends on infra)
ql_shared → ql_* (shared depends on domain)
ql_api → ql_db (app depends on infra directly)
```

**Enforcement Tools:**
- ESLint: `import/no-restricted-paths`, `import/order`
- Custom script: `madge --circular`
- TypeScript: `tsc --noEmit` with strict `compilerOptions.paths`

### 7. Shared Package Design

**What Belongs in Shared:**
- Primitive types (UserId, Email, Money, Result<T>)
- Base classes (Entity, ValueObject, AggregateRoot, DomainEvent)
- Utilities (date, string, validation helpers)
- Constants (error codes, regex patterns)
- Interfaces (Repository<T>, EventBus, Clock, UUIDGenerator)

**What Does NOT Belong:**
- Business logic
- Domain-specific types (use domain package)
- Database-specific code
- Framework-specific code
- Anything that changes frequently

### 8. Package Communication Patterns

| Pattern | Implementation | When |
|---------|----------------|------|
| **Direct Import** | `import { User } from 'ql_user'` | Same repo, domain → domain/app |
| **Interface Injection** | Constructor receives `UserRepository` | Domain uses repo interface |
| **Event Bus** | `eventBus.publish(new UserRegistered(...))` | Cross-domain, async |
| **Application Service** | `registerUser.execute(input)` | Orchestration, transactions |

### 9. Package Evolution

| Change Type | Strategy |
|-------------|----------|
| **Add export** | Minor version, backward compatible |
| **Remove export** | Major version, deprecation cycle |
| **Change signature** | Major version, migration guide |
| **Internal refactor** | Patch version, no API change |
| **Split package** | New package, old delegates, deprecate |
| **Merge packages** | New package, old deprecated, migration |

## Package Design Checklist

- [ ] Each package has single, clear domain responsibility
- [ ] Public API explicitly defined in `src/index.ts`
- [ ] No internal modules leaked via exports
- [ ] Dependency direction follows rules (domain → shared → infra)
- [ ] No circular dependencies (verified with tooling)
- [ ] Shared package contains only truly shared primitives
- [ ] Repository interfaces in domain, implementations in infra
- [ ] Domain events published from aggregates, not use cases
- [ ] Package.json exports field configured
- [ ] README documents purpose, API, usage examples
- [ ] Tests organized: unit (domain), integration (use cases)
- [ ] Versioning strategy documented