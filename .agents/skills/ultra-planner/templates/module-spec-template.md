# Module Specification Template

**Package:** ql_<domain>
**Module:** <module-name> (e.g., user, token, session, billing)
**Spec ID:** SPEC-MOD-<NNN>
**Version:** 1.0.0
**Status:** DRAFT / REVIEW / APPROVED / BASELINED
**Date:** YYYY-MM-DD
**Author:** [Name]

---

## 1. Module Identity

**Name:** <module-name>
**Type:** Entity / Value Object / Aggregate Root / Domain Service / Repository / Use Case / Event
**File Path:** `src/<layer>/<module-name>.ts`
**Purpose:** [One sentence: what this module does]
**Responsibility:** [Single, clear responsibility]

---

## 2. Interface / API

### Public Interface
```typescript
// For classes
export class <ModuleName> {
  constructor(<dependencies>) {}
  
  async <methodName>(<params>): Promise<ReturnType> {}
}

// For interfaces
export interface <ModuleName> {
  <methodName>(<params>): Promise<ReturnType>;
}

// For functions
export async function <functionName>(<params>): Promise<ReturnType> {}
```

### Exported Types
| Type | Description |
|------|-------------|
| `<Type>` | [Description] |

---

## 3. Functional Behavior

### Inputs
| Input | Type | Required | Constraints | Source |
|-------|------|----------|-------------|--------|
| `<param>` | `<Type>` | Yes/No | [Validation rules] | [Caller] |

### Outputs
| Output | Type | Description |
|--------|------|-------------|
| `<return>` | `<Type>` | [Description] |

### Business Rules
| Rule ID | Rule | Enforcement Point |
|---------|------|-------------------|
| BR-001 | [Rule description] | [Where enforced] |

### Main Workflow
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Alternative Workflows
- **A1:** [Trigger] → [Alternative flow]

### Error Scenarios
| Error | Condition | Response |
|-------|-----------|----------|
| `<ErrorCode>` | [Condition] | [HTTP status / Exception] |

---

## 4. Technical Design

### Internal Structure
[Private methods, helpers, state]

### Dependencies
| Dependency | Type | Purpose |
|------------|------|---------|
| `<Dep>` | Internal/External | [Purpose] |

### State Management
- **Stateless:** [Yes/No]
- **State:** [What state, if any]
- **Concurrency:** [How handled]

---

## 5. Data Contracts (If Applicable)

### Entity / Value Object Definition
```typescript
export interface <Entity> {
  id: <EntityId>;
  <field>: <Type>;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### Persistence Mapping
| Field | Column | Type | Constraints |
|-------|--------|------|-------------|
| id | id | UUID | PK, NOT NULL |
| <field> | <column> | <type> | [Constraints] |

---

## 6. Security

### Trust Boundaries
[Where this module sits in trust architecture]

### Authorization Checks
- [ ] Performs authZ checks
- [ ] Delegates to auth service
- [ ] No authZ (explain why)

### Sensitive Data Handling
| Data | Classification | Protection |
|------|----------------|------------|
| <Field> | PII/Secret/Internal | [Encryption/Hashing/Redaction] |

---

## 7. Reliability

### Failure Modes
| Scenario | Behavior | Recovery |
|----------|----------|----------|
| <Scenario> | <Behavior> | <Recovery> |

### Timeouts
| Operation | Timeout | Retry |
|-----------|---------|-------|
| <Operation> | <Duration> | <Policy> |

### Idempotency
- [ ] Idempotent (describe how)
- [ ] Not idempotent (requires idempotency key)

---

## 8. Testing

### Unit Test Cases
| Test Case | Scenario | Expected |
|-----------|----------|----------|
| `<method>_valid` | Valid input | [Expected] |
| `<method>_invalid` | Invalid input | [Expected error] |
| `<method>_edge` | Edge case | [Expected] |

### Integration Test Cases
| Test Case | Scenario | Dependencies |
|-----------|----------|--------------|
| `<flow>_success` | Happy path | [Deps] |

---

## 9. Acceptance Criteria

| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| AC-001 | <Criterion> | <Method> |
| AC-002 | <Criterion> | <Method> |

---

## 10. Implementation Constraints

- [ ] Follow package conventions
- [ ] Use ql_shared Result<T> for errors
- [ ] No direct infra imports
- [ ] Emit domain events where appropriate
- [ ] All strings externalized for i18n

---

## 11. Open Questions

- [ ] Question 1 — Blocker: [What prevents resolution]

---

## 12. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | YYYY-MM-DD | [Name] | Initial version |