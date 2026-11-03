# GitHub Issue Template (Generated from Ultra Review)

## Issue Metadata

**Source Review:** UR-<REVIEW_ID>
**Finding ID(s):** UR-<REVIEW_ID>-<SEQ>[, UR-<REVIEW_ID>-<SEQ>]
**Generated:** <ISO Date>
**Priority:** <P0 | P1 | P2 | P3>
**Labels:** <type:bug|enhancement|security|tech-debt|docs>, <priority:p0|p1|p2|p3>, <component:module-name>, <review:ultra-review>

---

## Title

<Clear, actionable title: "Fix SQL injection in user search endpoint" not "Security issue">

---

## Context

**Finding Summary:** <1-2 sentence summary from review finding>

**Root Cause:** <Root cause from finding>

**Current Behavior:** <What happens now>

**Desired Behavior:** <What should happen>

**Module/Package:** <package/path>

**Files Likely Affected:**
- <path/to/file1.ts>
- <path/to/file2.ts>

---

## Problem Statement

<Detailed problem description. Include:>
- What the vulnerability/defect is
- Under what conditions it manifests
- Why it matters (impact)
- Evidence from review (code reference, tool output)

---

## Acceptance Criteria

- [ ] <Specific, testable criterion 1>
- [ ] <Specific, testable criterion 2>
- [ ] <Specific, testable criterion 3>
- [ ] All existing tests pass
- [ ] New test(s) added covering the fix
- [ ] TypeScript compilation passes (`tsc --noEmit`)
- [ ] Linting passes (`eslint .`)
- [ ] Security scan passes (`npm audit` / equivalent)

---

## Scope

### In Scope
- <Specific files/functions to modify>
- <Specific behavior to change>

### Out of Scope
- <Related but not addressed by this issue>
- <Future enhancements>

---

## Implementation Guidance

**Recommended Approach:** <From finding's recommended solution>

**Key Considerations:**
- <Constraint 1: e.g., maintain backward compatibility>
- <Constraint 2: e.g., no schema migration required>
- <Constraint 3: e.g., follow existing validation patterns in ql_auth>

**Reference Implementation:** <Link to similar fix in codebase or external reference>

**Alternative Approaches:** <From finding's alternatives>

---

## Dependencies

**Blocks:** <Issue IDs this issue blocks>
**Blocked By:** <Issue IDs that must complete first>
**Related:** <Issue IDs with shared context>

---

## Verification Requirements

### Automated Verification
- [ ] Unit test: <Description>
- [ ] Integration test: <Description>
- [ ] Contract test: <Description>
- [ ] Security test: <Description>

### Manual Verification
- [ ] <Step 1: e.g., "Send malicious payload to /api/search, verify 400 response">
- [ ] <Step 2: e.g., "Verify legitimate search still works">
- [ ] <Step 3: e.g., "Check audit log contains security event">

### Regression Prevention
- [ ] Add test to prevent regression
- [ ] Document pattern in developer guide
- [ ] Add lint rule if applicable

---

## Effort Estimate

**Size:** <S | M | L | XL>
**Estimated Duration:** <1-2 days | 3-5 days | 1-2 weeks | 2+ weeks>
**Skill Set Required:** <backend | frontend | database | security | infra>

---

## Documentation Updates Required

- [ ] API reference
- [ ] Developer guide
- [ ] Architecture decision record (ADR)
- [ ] Changelog entry
- [ ] README
- [ ] None

---

## Release Notes

**User-facing description:** <One line for changelog>

**Breaking Change:** <YES/NO> — <If yes, describe migration>

---

## Review Checklist (for Assignee)

- [ ] Understanding confirmed — read finding, related code, tests
- [ ] Implementation plan documented in issue comments
- [ ] Branch created: `fix/<issue-number>-<short-description>`
- [ ] Changes follow repository conventions
- [ ] All acceptance criteria verified
- [ ] Self-review completed before PR
- [ ] PR links to this issue

---

## Review Checklist (for Reviewer)

- [ ] Fix addresses root cause, not symptom
- [ ] No new issues introduced
- [ ] Tests are meaningful (not just coverage)
- [ ] Documentation updated
- [ ] Security implications considered
- [ ] Performance impact assessed
- [ ] Backward compatibility maintained (or migration provided)