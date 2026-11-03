# Finding Template

**Finding ID:** UR-<REVIEW_ID>-<SEQ>
**Review:** <Review ID>
**Date:** <ISO Date>

---

## Classification

| Field | Value |
|-------|-------|
| **Title** | <Descriptive, specific title> |
| **Category** | <Security | Architecture | Code Quality | Performance | Database | API | Testing | UI/UX | DevEx | Documentation | Strategic> |
| **Severity** | <CRITICAL | HIGH | MEDIUM | LOW | INFO> |
| **Confidence** | <CONFIRMED | HIGH | MEDIUM | LOW | UNKNOWN> |
| **Priority** | <P0 | P1 | P2 | P3> |
| **Module/Package** | <package/path> |
| **File** | <path/to/file.ts:123-145> |
| **Function/Component** | <functionName or ComponentName> |
| **Lines** | <Start-End> |

---

## Evidence

**Type:** <Code Inspection | Tool Output | Test Result | Runtime Observation | Inference>

**Details:**
```
<Paste exact code, tool output, test failure, or reproduction steps>
```

**Source:** <file:line, command output, test name, URL>

---

## Technical Explanation

<Clear, detailed explanation of the issue. What happens, why it's a problem, under what conditions.>

---

## Root Cause

<The underlying reason this issue exists. Not the symptom — the cause. Examples:>
- Missing validation layer at API boundary
- Architectural decision to skip authentication on internal endpoints
- ORM configuration disabling foreign key enforcement
- Copy-paste of vulnerable pattern without understanding
- Missing error handling in async flow
- No code review gate for security-sensitive changes

---

## Impact

**If Exploited/Triggered:**
- <Concrete impact: data breach scope, downtime duration, data corruption extent, user impact>

**Affected Users/Systems:**
- <Who/what is affected>

**Business Risk:**
- <Regulatory, financial, reputational, operational>

---

## Reproduction

**Status:** <REPRODUCED | NOT_REPRODUCED_INFERRED | NOT_REPRODUCED_BLOCKED>

**Steps:**
1. <Step 1>
2. <Step 2>
3. <Step 3>

**Expected:** <Correct behavior>
**Actual:** <Observed behavior>

**Environment:** <Local, staging, production, specific config>

---

## Recommended Solution

**Primary Fix:**
<Specific, actionable description of the fix. Include code pattern if helpful.>

**Location:** <File(s) to modify>

**Estimated Effort:** <S | M | L | XL>

---

## Alternative Solutions

| Alternative | Description | Pros | Cons | Effort |
|-------------|-------------|------|------|--------|
| 1 | <Description> | | | |
| 2 | <Description> | | | |

---

## Validation Criteria

**How to verify the fix works:**
- [ ] <Test case 1>
- [ ] <Test case 2>
- [ ] <Manual verification step>
- [ ] <Tool check: lint, typecheck, security scan>

**Regression Test Required:** <YES/NO> — <Test description if yes>

---

## Dependencies

**Blocking:** <Finding IDs that must be fixed first>
**Related:** <Finding IDs with same root cause or area>
**Enables:** <Finding IDs this unblocks>

---

## Self-Critique Notes

**Challenged Assumptions:**
- <What I questioned during self-critique>

**Mitigations Considered:**
- <Existing controls that might reduce severity>

**Confidence Rationale:**
<Why this confidence level>

**Downgrade History:**
| Round | Previous | Current | Reason |
|-------|----------|---------|--------|
| 1 | CRITICAL, CONFIRMED | HIGH, CONFIRMED | Rate limiting mitigates |

---

## Metadata

**Tags:** <security, auth, database, performance, etc.>
**CWE:** <CWE-ID if applicable>
**CVSS:** <Score if security>
**References:** <Links to docs, issues, standards>