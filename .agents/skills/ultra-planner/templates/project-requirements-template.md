# Project Requirements Template

**Project:** [Project Name]
**Document ID:** REQ-<YYYY-MM-DD>-<SEQ>
**Version:** 1.0.0
**Status:** DRAFT / REVIEW / APPROVED / BASELINED
**Date:** YYYY-MM-DD
**Author:** [Name]
**Reviewers:** [Names]
**Approvers:** [Names]

---

## 1. Product Context

**Vision Reference:** [Link to vision doc]
**Stakeholders:** [List with roles]
**Target Release:** [Version/Date]
**Related Documents:** [Architecture, specs, designs]

---

## 2. Functional Requirements

| ID | Requirement | Priority | Source | Acceptance Criteria | Traceability |
|----|-------------|----------|--------|---------------------|--------------|
| FR-001 | The system shall allow users to register with email and password. | MUST | Vision 3.1 | AC-001, AC-002 | SPEC-AUTH-001, TC-AUTH-001 |
| FR-002 | The system shall send a verification email upon registration. | MUST | Vision 3.1 | AC-003, AC-004 | SPEC-AUTH-001, TC-AUTH-003 |
| FR-003 | The system shall allow verified users to log in. | MUST | Vision 3.2 | AC-005, AC-006 | SPEC-AUTH-001, TC-AUTH-005 |

**Priority Scale:** MUST (release blocker) > SHOULD (important, workaround) > COULD (nice to have) > WON'T (explicitly excluded)

---

## 3. Non-Functional Requirements

| ID | Requirement | Category | Priority | Measurable Target | Verification Method |
|----|-------------|----------|----------|-------------------|---------------------|
| NFR-001 | The API shall respond to 99th percentile requests within 200ms under normal load (1000 RPS). | Performance | MUST | p99 < 200ms at 1000 RPS | k6 load test, 10 min sustained |
| NFR-002 | The system shall be available 99.9% of the time (monthly). | Availability | MUST | 99.9% uptime | Uptime monitoring |
| NFR-003 | The system shall enforce MFA for all admin accounts. | Security | MUST | 100% admin MFA enrollment | Audit + automated check |
| NFR-004 | The system shall encrypt all PII at rest using AES-256-GCM. | Security | MUST | Zero unencrypted PII in DB | Automated scan |
| NFR-005 | The system shall support deployment to Kubernetes with zero-downtime rolling updates. | Operability | MUST | Deploy < 10 min, rollback < 5 min | Deployment drill |
| NFR-006 | The UI shall comply with WCAG 2.1 Level AA. | Accessibility | MUST | axe-core: 0 violations | Automated + manual audit |

---

## 4. User Stories

| ID | Story | Preconditions | Main Flow | Alternative Flows | Failure Flows | Acceptance Criteria |
|----|-------|---------------|-----------|-------------------|---------------|---------------------|
| US-001 | As a new user, I want to register with my email, so that I can access the platform. | Valid email, not registered | 1. Navigate to /register\n2. Enter email/password\n3. Submit\n4. Validate\n5. Create account\n6. Send verification email\n7. Show success | A1: Email exists → Show error\nA2: Weak password → Show requirements | F1: Email service down → Queue, show pending\nF2: DB error → Show retry | AC-001..AC-007 |
| US-002 | As a registered user, I want to log in, so that I can access my account. | Verified email, correct password | 1. Navigate to /login\n2. Enter credentials\n3. Submit\n4. Validate\n5. Issue tokens\n6. Redirect to dashboard | A1: Unverified → Resend verification\nA2: MFA required → Challenge | F1: Invalid creds → Generic error\nF2: Account locked → Unlock flow | AC-008..AC-012 |

---

## 5. Out of Scope

| ID | Item | Reason | Future Reference |
|----|------|--------|------------------|
| OOS-001 | Social login (Google, GitHub) | Phase 2, not MVP | FR-045 in backlog |
| OOS-002 | Multi-factor authentication (beyond admin) | Complexity, not required for launch | NFR-012 in backlog |
| OOS-003 | Real-time notifications | Requires WebSocket infrastructure | US-023 in backlog |
| OOS-004 | Admin dashboard | Separate product, different users | New project |

---

## 6. Traceability Matrix

| Req ID | Type | Source | Architecture Component | Spec Section | Test Cases | Status |
|--------|------|--------|------------------------|--------------|------------|--------|
| FR-001 | Functional | Vision 3.1 | Auth Module (PKG-003) | SPEC-AUTH-001 | TC-AUTH-001..005 | Defined |
| NFR-001 | Performance | SLA Doc | API Gateway (PKG-001) | SPEC-API-001 | TC-PERF-001 | Defined |
| US-001 | User Story | Stakeholder | Auth Module, Email Service | SPEC-AUTH-001 | TC-AUTH-001, TC-E2E-001 | Defined |

---

## 7. Assumptions & Dependencies

### Assumptions
| Assumption | Validation Method | Status |
|------------|-------------------|--------|
| PostgreSQL 15+ available | Check docker-compose / infra | VALIDATED |
| Team has TypeScript/React expertise | Skills assessment | VALIDATED |
| Stripe account available for billing | Confirm with finance | PENDING |

### Dependencies
| Dependency | Version | Owner | Status |
|------------|---------|-------|--------|
| ql_shared (internal) | workspace:* | @team-platform | READY |
| Stripe API | 2023-10 | @team-billing | PENDING |
| SendGrid | Latest | @team-platform | READY |

---

## 8. Open Questions

| Question | Blocker | Owner | Target Date |
|----------|---------|-------|-------------|
| What is the exact password policy? (min length, special chars, breach check) | Blocks FR-001 AC | @team-auth | YYYY-MM-DD |
| Is multi-tenancy required for launch? | Affects data architecture | @team-core | YYYY-MM-DD |
| What are the SLO targets for each service? | Affects NFR-001, NFR-002 | @team-platform | YYYY-MM-DD |

---

## 9. Acceptance Criteria Catalog

| AC ID | Criterion | Requirement | Verification Method |
|-------|-----------|-------------|---------------------|
| AC-001 | POST /api/v1/auth/register with valid email/password returns 201 with user object | FR-001 | Automated test |
| AC-002 | Duplicate email returns 409 with error code EMAIL_EXISTS | FR-001 | Automated test |
| AC-003 | Invalid email format returns 400 with error code INVALID_EMAIL | FR-001 | Automated test |
| AC-004 | Password < 12 chars returns 400 with error code WEAK_PASSWORD | FR-001 | Automated test |
| AC-005 | Verification email sent within 5 seconds | FR-002 | Integration test |
| AC-006 | Verification link expires after 24 hours | FR-002 | Automated test |
| AC-007 | Verified user can log in with correct credentials | FR-003 | Automated test |
| AC-008 | Invalid credentials return 401 with generic error | FR-003 | Automated test |

---

## 10. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | YYYY-MM-DD | [Name] | Initial version |