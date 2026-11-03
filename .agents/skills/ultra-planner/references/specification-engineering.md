# Specification Engineering Reference

## Specification Engineering Process

### 1. Specification Lifecycle

```
REQUIREMENTS → ARCHITECTURE → SPECIFICATION → REVIEW → BASELINE → IMPLEMENT → VERIFY
```

**States:**
- **DRAFT** — Initial version, under development
- **IN_REVIEW** — Submitted for stakeholder review
- **APPROVED** — Stakeholders signed off
- **BASELINED** — Versioned, change-controlled
- **IMPLEMENTED** — Code matches specification
- **VERIFIED** — Tests pass, acceptance criteria met
- **DEPRECATED** — Superseded by newer version

### 2. Specification Hierarchy

| Level | Scope | Audience | Example |
|-------|-------|----------|---------|
| **Master Blueprint** | Entire system | All stakeholders | `spec/blueprint/` |
| **System Spec** | Deployable unit | Architects, leads | `spec/system/api-gateway.md` |
| **Domain Spec** | Business domain | Domain experts, devs | `spec/domain/billing.md` |
| **Package Spec** | Package/module | Package owners | `spec/packages/ql_auth.md` |
| **Feature Spec** | User feature | PM, devs, QA | `spec/features/user-registration.md` |
| **Interface Spec** | API/contract | Consumers, implementers | `spec/interfaces/auth-api.md` |
| **Test Spec** | Test requirements | QA, devs | `spec/test/auth-test-plan.md` |

### 3. Specification Template (Universal)

```markdown
# [Specification Title]

## Metadata
- **Spec ID:** SPEC-<NNN> (stable, never changes)
- **Version:** 1.0.0 (semver)
- **Status:** DRAFT | IN_REVIEW | APPROVED | BASELINED | IMPLEMENTED | VERIFIED | DEPRECATED
- **Date:** YYYY-MM-DD
- **Author:** [Name]
- **Reviewers:** [Names]
- **Approvers:** [Names]
- **Related Requirements:** REQ-001, REQ-002
- **Supersedes:** SPEC-XXX (if applicable)
- **Superseded By:** SPEC-YYY (if applicable)

## 1. Purpose
[Why this specification exists. What problem it solves. Who uses it.]

## 2. Scope
### In Scope
- [Capability 1]
- [Capability 2]

### Out of Scope
- [Excluded capability 1] — Reason: [Why]

## 3. Functional Behavior
### 3.1 Inputs
| Input | Type | Required | Constraints | Source |
|-------|------|----------|-------------|--------|
| email | string | Yes | Valid email format | User |

### 3.2 Outputs
| Output | Type | Description |
|--------|------|-------------|
| user | User | Created user entity |
| token | AuthToken | Access + refresh tokens |

### 3.3 Business Rules
| Rule ID | Rule | Enforcement Point |
|---------|------|-------------------|
| BR-001 | Email must be unique | Database constraint + application check |
| BR-002 | Password min 12 chars | Application validation |

### 3.4 Workflows
#### Main Flow: User Registration
1. Validate input (email format, password strength)
2. Check email not registered
3. Hash password
4. Create user record (status: PENDING_VERIFICATION)
5. Generate verification token
6. Send verification email
7. Return success response

#### Alternative Flow: Duplicate Email
1. Validation detects existing email
2. Return 409 Conflict with code EMAIL_EXISTS

#### Failure Flow: Email Service Down
1. User created with PENDING_VERIFICATION
2. Verification email queued for retry
3. Return 202 Accepted with message "Verification email queued"

### 3.5 State Transitions
```
PENDING_VERIFICATION → (verify) → ACTIVE
ACTIVE → (suspend) → SUSPENDED
SUSPENDED → (reactivate) → ACTIVE
ACTIVE → (delete) → DELETED
```

## 4. Technical Design
### 4.1 Architecture
[Component diagram, module structure, dependencies]

### 4.2 Module Responsibilities
| Module | Responsibility | Public Interface |
|--------|----------------|------------------|
| UserRepository | Persistence abstraction | findByEmail, save, findById |
| PasswordHasher | Bcrypt wrapper | hash, verify |
| VerificationTokenService | Token generation | generate, validate, consume |

### 4.3 Data Flow
[Sequence diagram or description]

### 4.4 Dependencies
| Dependency | Type | Version | Purpose |
|------------|------|---------|---------|
| bcrypt | External | ^5.1.0 | Password hashing |
| ql_shared | Internal | workspace:* | Types, Result<T> |

## 5. Data Contract
### 5.1 Entities
```typescript
interface User {
  id: UserId;
  email: Email;
  passwordHash: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### 5.2 Persistence Schema
| Table | Column | Type | Constraints |
|-------|--------|------|-------------|
| users | id | UUID | PK, NOT NULL |
| users | email | VARCHAR(255) | UNIQUE, NOT NULL |
| users | password_hash | VARCHAR(255) | NOT NULL |

### 5.3 Migration Behavior
- [ ] Backward compatible
- [ ] Reversible
- [ ] Zero-downtime

## 6. API Contract
### 6.1 Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/register | Register new user |

### 6.2 Request/Response
**POST /api/v1/auth/register**
```json
// Request
{ "email": "user@example.com", "password": "securePass123" }

// Success Response (201)
{ "user": { "id": "...", "email": "...", "status": "PENDING_VERIFICATION" } }

// Error Response (409)
{ "error": { "code": "EMAIL_EXISTS", "message": "Email already registered", "status": 409 } }
```

### 6.3 Authentication & Authorization
- Auth: None (public endpoint)
- Rate Limit: 5 req/min per IP

## 7. Security
### 7.1 Trust Boundaries
[Diagram or description]

### 7.2 Threat Scenarios
| Threat | Mitigation |
|--------|------------|
| Brute force registration | Rate limiting, CAPTCHA |
| Email enumeration | Generic error messages |
| Weak passwords | Strength validation, breach check |

### 7.3 Sensitive Data Handling
- Password: Bcrypt (cost 12), never logged
- Email: PII, encrypted at rest, audit access

## 8. Reliability
### 8.1 Failure Modes
| Scenario | Behavior | Recovery |
|----------|----------|----------|
| DB unavailable | Return 503, retry with backoff | Auto-recover |
| Email queue full | Return 202, queue locally | Process when available |

### 8.2 Timeouts & Retries
| Operation | Timeout | Retry |
|-----------|---------|-------|
| DB query | 3s | 2x with backoff |
| Email send | 10s | 3x with backoff |

### 8.3 Idempotency
- Registration: Not idempotent (creates resource)
- Verification: Idempotent (token consumed once)

## 9. Performance
### 9.1 Targets
| Operation | p99 Target | Load |
|-----------|------------|------|
| Register | < 500ms | 100 RPS |

### 9.2 Optimization
- Connection pooling
- Prepared statements
- Async email queue

## 10. UI/UX (If Applicable)
### 10.1 User Interactions
[Wireframe references, flow descriptions]

### 10.2 States
- Loading: Skeleton for form
- Empty: N/A
- Error: Inline field errors, toast for server errors
- Success: Toast + redirect to dashboard

### 10.3 Accessibility
- WCAG 2.1 AA compliant
- Focus management
- Screen reader tested

## 11. Testing
### 11.1 Unit Tests
| Test Case | Scenario | Expected |
|-----------|----------|----------|
| register_valid | Valid input | User created, email queued |
| register_duplicate | Existing email | 409 EMAIL_EXISTS |
| register_weak_password | Password < 12 chars | 400 WEAK_PASSWORD |

### 11.2 Integration Tests
| Test Case | Scenario |
|-----------|----------|
| register_e2e | Full flow via API |

### 11.3 Contract Tests
- Provider: Auth API matches OpenAPI spec
- Consumer: Frontend matches expected responses

### 11.4 Edge Cases
- Concurrent registration same email
- Verification token expiry
- Email service degradation

## 12. Acceptance Criteria
| AC ID | Criterion | Verification Method |
|-------|-----------|---------------------|
| AC-001 | Valid registration returns 201 with user | Automated test |
| AC-002 | Duplicate email returns 409 | Automated test |
| AC-003 | Weak password returns 400 | Automated test |
| AC-004 | Verification email sent | Integration test + email capture |
| AC-005 | p99 latency < 500ms at 100 RPS | Load test |

## 13. Implementation Constraints
- Must use ql_shared Result<T> for error handling
- Must follow ql_auth package structure
- Must use Prisma for database access
- Must emit UserRegistered domain event
- Must not import from ql_db directly (use repository interface)

## 14. Open Questions
- [ ] Question 1 — Blocker: [What prevents resolution]
- [ ] Question 2 — Blocker: [What prevents resolution]

## 15. Change Log
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | YYYY-MM-DD | [Name] | Initial version |
```

### 4. Specification Quality Checklist

- [ ] **Complete** — All applicable sections filled
- [ ] **Consistent** — No contradictions within or across specs
- [ ] **Traceable** — Every requirement linked to spec sections
- [ ] **Testable** — Acceptance criteria are verifiable
- [ ] **Implementable** — Sufficient detail for developer to implement
- [ ] **Versioned** — Semver, change log maintained
- [ ] **Reviewed** — Stakeholder review completed
- [ ] **Baselined** — Version locked for implementation

### 5. Cross-Specification Consistency

**Validation Rules:**
- API contracts match data contracts
- Domain events match event catalog
- Repository interfaces match implementations
- Error codes consistent across specs
- Type definitions single-sourced from ql_shared
- Business rules not duplicated

**Tooling:**
- Automated spec validation in CI
- TypeScript compilation of shared types
- OpenAPI spec validation
- Schema registry for events

### Specification Engineering Checklist

- [ ] Specification hierarchy defined
- [ ] Universal template used
- [ ] Metadata complete (ID, version, status, traceability)
- [ ] Purpose and scope clear
- [ ] Functional behavior detailed (inputs, outputs, rules, workflows, states)
- [ ] Technical design specified (architecture, modules, data flow, dependencies)
- [ ] Data contract defined (entities, schema, migration)
- [ ] API contract defined (endpoints, request/response, auth)
- [ ] Security addressed (boundaries, threats, sensitive data)
- [ ] Reliability specified (failures, timeouts, retries, idempotency)
- [ ] Performance targets set
- [ ] UI/UX specified (if applicable)
- [ ] Testing requirements detailed (unit, integration, contract, edge cases)
- [ ] Acceptance criteria verifiable
- [ ] Implementation constraints documented
- [ ] Open questions tracked
- [ ] Change log maintained
- [ ] Cross-spec consistency validated