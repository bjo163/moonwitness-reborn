# Severity, Confidence & Priority Classification Reference

## Severity Classification

Severity measures the **potential impact** if the finding is exploited or triggered. It is independent of likelihood or confidence.

### CRITICAL (CVSS 9.0-10.0 equivalent)

**Definition:** Severe security vulnerability, data loss, or system failure risk that could cause immediate, irreversible harm.

**Criteria (any one):**
- Remote code execution (RCE) or arbitrary command execution
- Authentication bypass allowing full account takeover
- Authorization bypass allowing access to all data (horizontal/vertical privilege escalation)
- SQL injection with data exfiltration/modification/destruction capability
- Cryptographic failure exposing secrets/keys (private keys, database credentials, API keys)
- Data destruction or corruption without recovery path
- Complete service denial (DoS) with no mitigation
- Supply chain compromise (malicious dependency, build pipeline)
- Regulatory violation with immediate legal consequence (GDPR, HIPAA, PCI-DSS)

**Response:** Immediate mitigation required. Escalate to security team. Consider emergency patch.

### HIGH (CVSS 7.0-8.9 equivalent)

**Definition:** Major functionality, security, reliability, or architectural problem with significant impact.

**Criteria (any one):**
- Authentication weakness (weak passwords, no MFA, session fixation)
- Authorization flaw allowing unauthorized data access (IDOR, missing object-level checks)
- Stored XSS affecting multiple users
- CSRF on state-changing operations
- SSRF allowing internal network access
- Path traversal with file read/write
- Insecure deserialization leading to RCE
- Sensitive data exposure (PII, credentials in logs, debug endpoints)
- Major data integrity issue (race condition causing corruption)
- Critical business logic bypass (payment, permissions, workflow)
- Architecture: circular dependency preventing deployment, god module blocking changes
- Performance: known bottleneck causing SLA breach under normal load
- Reliability: single point of failure with no redundancy

**Response:** Fix in next sprint. Add to security backlog if security-related.

### MEDIUM (CVSS 4.0-6.9 equivalent)

**Definition:** Significant defect or risk with bounded impact.

**Criteria (any one):**
- Reflected XSS requiring user interaction
- Information disclosure (stack traces, version numbers, directory listing)
- Weak cryptography (deprecated algorithms, short keys)
- Missing security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting missing or bypassable
- Input validation gaps (not exploitable directly but defense-in-depth)
- Error handling exposing internal details
- Insufficient logging/auditing for security events
- Code: significant bug affecting non-critical feature
- Architecture: coupling making changes difficult, missing abstraction
- Performance: degradation under load, no monitoring
- Testing: critical path untested, flaky tests blocking CI
- Database: missing index causing slow queries, no FK constraint
- API: missing validation, inconsistent error format

**Response:** Fix in next 1-2 sprints. Track in backlog.

### LOW (CVSS 0.1-3.9 equivalent)

**Definition:** Minor issue with limited impact.

**Criteria (any one):**
- Code style violation (linting, formatting)
- Missing documentation for internal API
- Dead code, unused imports, variables
- Minor naming inconsistency
- Console.log/print statements in production code
- TODO/FIXME without ticket reference
- Suboptimal but functional query
- Missing type annotation on internal function
- Inconsistent formatting in config files
- Deprecated API usage with migration path

**Response:** Fix during routine maintenance. Batch with other changes.

### INFO

**Definition:** Observation or improvement opportunity with no direct risk.

**Criteria:**
- Suggestion for better pattern
- Potential future enhancement
- Architecture observation (not a defect)
- Tooling improvement
- Learning opportunity
- Positive finding (something done well)

**Response:** No action required. Consider for future work.

---

## Confidence Classification

Confidence measures **how certain** the reviewer is that the finding is real and accurately described.

### CONFIRMED

- Directly verified through code inspection, test execution, or tool output
- Reproduced the issue
- Multiple independent evidence sources
- **Standard:** "I have seen this fail/behave incorrectly"

### HIGH

- Strong evidence from code review, but not directly executed
- Consistent pattern across multiple files
- Framework documentation confirms behavior
- Single evidence source but highly reliable
- **Standard:** "I am very confident this is real"

### MEDIUM

- Reasonable evidence but some gaps
- Inferred from patterns, not directly verified
- Could be mitigated by unseen code
- **Standard:** "This appears to be an issue but I haven't confirmed"

### LOW

- Limited evidence, speculative
- Based on assumption or heuristic
- Contradicted by some evidence
- **Standard:** "This might be an issue"

### UNKNOWN

- Insufficient information to assess
- Blocked from investigation
- **Standard:** "Cannot determine"

---

## Priority Classification

Priority measures **when** the finding should be addressed based on severity, confidence, business context, and effort.

### P0 — Immediate Action

**Trigger:** CRITICAL severity + CONFIRMED/HIGH confidence
**OR** HIGH severity + CONFIRMED confidence + active exploitation risk

**Action:** Stop feature work. Allocate engineers immediately. Emergency process.

### P1 — Next Critical Engineering Task

**Trigger:** 
- CRITICAL + MEDIUM confidence
- HIGH + CONFIRMED/HIGH confidence
- MEDIUM + CONFIRMED confidence + regulatory deadline

**Action:** Top of next sprint. Block other work if needed.

### P2 — Planned Improvement

**Trigger:**
- HIGH + MEDIUM/LOW confidence
- MEDIUM + HIGH/MEDIUM confidence
- LOW + CONFIRMED confidence + low effort

**Action:** Next 1-2 sprints. Normal prioritization.

### P3 — Optional Refinement

**Trigger:**
- MEDIUM + LOW confidence
- LOW + any confidence
- INFO any confidence

**Action:** Backlog. Address during tech debt time or when related work happens.

---

## Classification Decision Matrix

| Severity \ Confidence | CONFIRMED | HIGH | MEDIUM | LOW | UNKNOWN |
|----------------------|-----------|------|--------|-----|---------|
| **CRITICAL** | P0 | P0 | P1 | P1* | P1* |
| **HIGH** | P1 | P1 | P2 | P2* | P2* |
| **MEDIUM** | P2 | P2 | P2 | P3 | P3 |
| **LOW** | P3 | P3 | P3 | P3 | P3 |
| **INFO** | P3 | P3 | P3 | P3 | N/A |

* = Requires explicit justification for confidence level. Never report CRITICAL/HIGH with LOW/UNKNOWN without "UNVERIFIED" label.

---

## Finding ID Format

```
UR-<REVIEW_ID>-<SEQUENCE>

Example: UR-2025-001-042
```

- REVIEW_ID: Date-based or project-based identifier
- SEQUENCE: Sequential number within review

---

## Reporting Requirements by Severity

| Severity | Minimum Evidence | Confidence Required | Label if Lower |
|----------|------------------|---------------------|----------------|
| CRITICAL | Code reference + reproduction steps or tool output | MEDIUM | `[UNVERIFIED]` |
| HIGH | Code reference + explanation | MEDIUM | `[UNVERIFIED]` |
| MEDIUM | Code reference or strong inference | HIGH | N/A |
| LOW | Code reference | HIGH | N/A |
| INFO | N/A | N/A | N/A |

---

## Downgrade Rules

A finding may be downgraded during self-critique if:

1. **Mitigation found** — Existing code handles the issue (reduce severity)
2. **Not reproducible** — Evidence doesn't support finding (reduce confidence)
3. **Intentional design** — Architecture decision documented (reduce severity to INFO)
4. **Duplicate** — Same root cause as another finding (merge, keep highest severity)
5. **Preference not defect** — Style/opinion without functional impact (reduce to INFO)

**Never downgrade** because:
- Fix seems difficult
- "Not a priority right now"
- Team might disagree
- No immediate exploit known (for security findings)

---

## Escalation Path

```
P0 Finding
    ↓
Security Team Lead + Engineering Manager notified immediately
    ↓
Incident channel created (Slack/Teams)
    ↓
Mitigation deployed within 4 hours (security) or 24 hours (reliability)
    ↓
Root cause analysis within 5 business days
    ↓
Postmortem published
```