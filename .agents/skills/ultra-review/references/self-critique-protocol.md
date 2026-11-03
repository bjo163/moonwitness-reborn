# Self-Critique Protocol Reference

## Purpose

Before finalizing any substantial review, perform an independent critical verification pass. Challenge every major conclusion to ensure intellectual honesty and prevent false certainty.

## Self-Critique Checklist

### For Each Major Finding

Ask and answer in writing:

1. **What if this finding is incorrect?**
   - What evidence would disprove it?
   - Have I searched for that evidence?

2. **What relevant code have I not examined?**
   - Untested code paths?
   - Configuration that changes behavior?
   - Environment-specific code?
   - Generated code?

3. **Does the framework already handle this?**
   - Built-in protection (CSRF, XSS, SQLi)?
   - Middleware that mitigates?
   - Default secure configuration?

4. **Is there a mitigation elsewhere?**
   - WAF rule?
   - Infrastructure protection?
   - Upstream validation?
   - Compensating control?

5. **Is this an intentional architectural choice?**
   - Documented in ADR?
   - Trade-off explicitly accepted?
   - Team convention?

6. **Is the issue reproducible?**
   - Did I actually reproduce it?
   - Or only inferred from code reading?
   - What conditions are required?

7. **What evidence is missing?**
   - Test case demonstrating the bug?
   - Production incident?
   - Tool output confirming?
   - Second opinion?

8. **Does the proposed solution introduce new problems?**
   - Performance regression?
   - Breaking change?
   - New attack surface?
   - Operational complexity?

9. **Is there a simpler solution?**
   - Configuration change vs code change?
   - Library update vs custom fix?
   - Documentation vs implementation?

10. **Is the issue actually important?**
    - Real user impact?
    - Security exploitability?
    - Business risk?
    - Or just technical preference?

11. **Are two findings describing the same root cause?**
    - Same code location?
    - Same architectural flaw?
    - Same missing pattern?

12. **Have I confused technical preference with actual defect?**
    - "I would write it differently" vs "This is wrong"
    - Style vs correctness
    - Modern vs legacy (but functional)

## Self-Critique Process

### Step 1: List All Findings

Export all findings with IDs, severity, confidence.

### Step 2: Apply Checklist to Each

For each finding with severity ≥ MEDIUM or confidence ≤ MEDIUM:

```
Finding: UR-2025-001-042 (HIGH, MEDIUM)
Question 1: What if incorrect? HS256 might be acceptable for short-lived tokens with rotation.
Question 3: Framework handles? jsonwebtoken supports both, no default.
Question 6: Reproducible? Yes, decoded token with different secret.
Question 11: Duplicate? Related to UR-2025-001-043 (no key rotation).
Action: Merge 042 and 043, keep HIGH severity, note root cause = key management.
```

### Step 3: Cross-Finding Analysis

| Check | Method |
|-------|--------|
| Duplicate root causes | Group by file, module, pattern |
| Conflicting recommendations | Fix A breaks Fix B? |
| Severity inflation | Too many CRITICAL/HIGH? |
| Confidence inflation | Too many CONFIRMED without reproduction? |
| Coverage gaps | Areas not investigated but claimed? |

### Step 4: Apply Downgrades

| Original | After Critique | Reason |
|----------|----------------|--------|
| CRITICAL, CONFIRMED | HIGH, CONFIRMED | Mitigation found (rate limiting) |
| HIGH, HIGH | MEDIUM, HIGH | Not exploitable without chaining |
| MEDIUM, CONFIRMED | INFO, CONFIRMED | Intentional design (ADR-042) |
| Two HIGH findings | One HIGH finding | Same root cause (missing validation layer) |

### Step 5: Separate Verified vs Strategic

```
VERIFIED DEFECTS (require fix):
- UR-2025-001-001: SQL injection in user search (CRITICAL, CONFIRMED)
- UR-2025-001-005: Missing authZ on admin endpoint (HIGH, CONFIRMED)

STRATEGIC RECOMMENDATIONS (optional):
- UR-2025-001-012: Extract validation library (MEDIUM, HIGH)
- UR-2025-001-018: Migrate to OpenTelemetry (LOW, HIGH)
```

### Step 6: Final Confidence Calibration

| Severity | Minimum Confidence to Report | If Lower |
|----------|------------------------------|----------|
| CRITICAL | MEDIUM | Label `[UNVERIFIED]` |
| HIGH | MEDIUM | Label `[UNVERIFIED]` |
| MEDIUM | HIGH | Downgrade to LOW or remove |
| LOW | HIGH | Downgrade to INFO or remove |
| INFO | N/A | N/A |

## Red Team Review (Simulated)

Adopt an adversarial mindset:

| Perspective | Questions |
|-------------|-----------|
| **Attacker** | How would I exploit this? What's the blast radius? |
| **Defender** | What detects this? What contains it? |
| **Maintainer** | How hard to fix? Will it break? How to test? |
| **Product Owner** | Does user care? Business impact? |
| **Auditor** | Evidence sufficient? Reproducible? Compliant? |

## Bias Checks

| Bias | Detection | Mitigation |
|------|-----------|------------|
| Confirmation bias | Only looked for problems | Actively search for mitigations |
| Severity inflation | Everything is CRITICAL | Calibrate against CVSS, real incidents |
| Tool worship | "Tool says X so it's true" | Verify tool output manually |
| Novelty bias | New pattern = better | Compare to existing working code |
| Sunk cost | "I spent time investigating" | Discard unsupported findings |
| Authority bias | "Senior dev wrote this" | Judge code, not author |
| Recency bias | Recent issues weighted higher | Systematic coverage |

## Final Report Integrity

Before delivering report:

- [ ] All findings have unique IDs
- [ ] Severity, confidence, priority consistent
- [ ] Evidence cited for every finding ≥ MEDIUM
- [ ] No `[UNVERIFIED]` findings without label
- [ ] Duplicate root causes merged
- [ ] Verified defects separated from recommendations
- [ ] Strengths section populated (not empty)
- [ ] Limitations section honest (not empty)
- [ ] Scorecard matches findings
- [ ] Executive summary accurate (not exaggerated)
- [ ] No fabricated code references, test results, or tool output
- [ ] All "CONFIRMED" findings actually reproduced or directly observed

## Self-Critique Log Template

```markdown
# Self-Critique Log — Review UR-2025-001

## Findings Reviewed: 47
## Findings Modified: 12
## Findings Removed: 3
## Findings Merged: 4 (into 2)

### Major Changes

| Finding ID | Original | Revised | Reason |
|------------|----------|---------|--------|
| UR-2025-001-042 | CRITICAL, CONFIRMED | HIGH, CONFIRMED | Rate limiting mitigates brute force |
| UR-2025-001-015 | HIGH, HIGH | MEDIUM, HIGH | Requires chained exploit, not direct |
| UR-2025-001-028 | MEDIUM, CONFIRMED | INFO, CONFIRMED | Intentional per ADR-012 |
| UR-2025-001-033 | HIGH, MEDIUM | REMOVED | Duplicate of UR-2025-001-011 |

### Duplicate Root Causes Merged

| Root Cause | Findings Merged | Kept As |
|------------|-----------------|---------|
| Missing input validation layer | 005, 008, 012, 019 | UR-2025-001-005 (HIGH) |
| No key rotation policy | 042, 043 | UR-2025-001-042 (HIGH) |

### Verified vs Strategic Separation

| Category | Count |
|----------|-------|
| Verified Defects (P0/P1) | 8 |
| Verified Defects (P2/P3) | 15 |
| Strategic Recommendations | 12 |
| Positive Findings | 6 |

### Confidence Calibration

| Severity | CONFIRMED | HIGH | MEDIUM | LOW | UNKNOWN |
|----------|-----------|------|--------|-----|---------|
| CRITICAL | 2 | 1 | 0 | 0 | 0 |
| HIGH | 5 | 3 | 1* | 0 | 0 |
| MEDIUM | 8 | 4 | 0 | 0 | 0 |
| LOW | 3 | 2 | 0 | 0 | 0 |
| INFO | 6 | - | - | - | - |

* = Labeled [UNVERIFIED] in report

### Honesty Checks Passed

- [ ] No fabricated evidence
- [ ] No tool output claimed without execution
- [ ] No test results claimed without running
- [ ] All code references verified
- [ ] Limitations section complete
- [ ] Strengths section non-empty
- [ ] Executive summary matches detailed findings
```