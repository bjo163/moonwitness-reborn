# Investigation Ledger Template

**Review ID:** UR-<YYYY-MM-DD>-<SEQ>
**Project:** <Project Name>
**Repository:** <URL or path>
**Mode:** <SCAN | DEEP | COSMIC | SPECIALIZED: <mode>>
**Date Started:** <ISO Date>
**Date Updated:** <ISO Date>
**Investigator:** <Agent identifier>

---

## Scope

- **Target:** <Repository, packages, or modules>
- **Exclusions:** <What's explicitly out of scope>
- **Focus Areas:** <Priority areas for this review>

---

## Verified Facts

| # | Fact | Evidence | Source | Confidence |
|---|------|----------|--------|------------|
| 1 | <Confirmed fact> | <Code ref, tool output, test result> | <File:line, command, test> | CONFIRMED |
| 2 | <Confirmed fact> | <Code ref, tool output, test result> | <File:line, command, test> | CONFIRMED |

---

## Inferred Conclusions

| # | Conclusion | Supporting Evidence | Confidence | Validation Needed |
|---|------------|---------------------|------------|-------------------|
| 1 | <Inferred conclusion> | <Verified facts supporting this> | HIGH/MEDIUM | <How to confirm> |
| 2 | <Inferred conclusion> | <Verified facts supporting this> | HIGH/MEDIUM | <How to confirm> |

---

## Assumptions (Require Validation)

| # | Assumption | Reason for Assumption | Validation Method | Status |
|---|------------|----------------------|-------------------|--------|
| 1 | <Assumption> | <Why assumed> | <How to verify> | PENDING / VALIDATED / INVALIDATED |
| 2 | <Assumption> | <Why assumed> | <How to verify> | PENDING / VALIDATED / INVALIDATED |

---

## Unknowns

| # | Unknown | Blocker | Impact if Wrong | Mitigation |
|---|---------|---------|-----------------|------------|
| 1 | <What we don't know> | <Why blocked> | <Impact> | <How to handle> |
| 2 | <What we don't know> | <Why blocked> | <Impact> | <How to handle> |

---

## Contradictions Found

| # | Contradiction | Source A | Source B | Resolution |
|---|---------------|----------|----------|------------|
| 1 | <Description> | <Doc says X> | <Code does Y> | <Which is correct, or both> |
| 2 | <Description> | <Config says X> | <Runtime shows Y> | <Which is correct, or both> |

---

## Areas Investigated

| # | Area | Method | Files/Tools | Coverage | Time Spent |
|---|------|--------|-------------|----------|------------|
| 1 | <Area name> | <Read, grep, static analysis, test execution> | <Specific files, commands> | <Percentage or description> | <Approx> |
| 2 | <Area name> | <Read, grep, static analysis, test execution> | <Specific files, commands> | <Percentage or description> | <Approx> |

---

## Areas Pending Investigation

| # | Area | Reason Pending | Priority | Estimated Effort |
|---|------|----------------|----------|------------------|
| 1 | <Area name> | <Blocked by X, time, scope> | HIGH/MEDIUM/LOW | <S/M/L> |
| 2 | <Area name> | <Blocked by X, time, scope> | HIGH/MEDIUM/LOW | <S/M/L> |

---

## Tool Execution Log

| # | Command | Purpose | Result | Output Location |
|---|---------|---------|--------|-----------------|
| 1 | `tsc --noEmit` | Type checking | PASS/FAIL - <error count> | <Inline or file> |
| 2 | `eslint . --ext .ts,.tsx` | Linting | PASS/FAIL - <error count> | <Inline or file> |
| 3 | `pnpm test` | Unit tests | PASS/FAIL - <pass/fail> | <Inline or file> |
| 4 | `npm audit` | Security audit | <vuln count by severity> | <Inline or file> |
| 5 | `rg -n "pattern"` | Pattern search | <Match count> | <Inline or file> |

---

## Evidence Index

| Finding ID | Evidence Type | Location | Summary |
|------------|---------------|----------|---------|
| UR-XXX-001 | Code inspection | packages/ql_auth/src/token.ts:45 | HS256 algorithm used |
| UR-XXX-001 | Tool output | `npm audit` | No vulns in jsonwebtoken |
| UR-XXX-002 | Test result | packages/ql_auth/__tests__/token.test.ts:45 | Expired token accepted |

---

## Coverage Summary

| Dimension | Target | Actual | Gap | Reason |
|-----------|--------|--------|-----|--------|
| Repository structure | 100% | 100% | 0% | |
| Architecture docs | 100% | 80% | 20% | Some outdated |
| Source code (in scope) | 100% | 90% | 10% | Generated files skipped |
| Tests | 100% | 70% | 30% | E2E not executed |
| Database schema | 100% | 100% | 0% | |
| CI/CD workflows | 100% | 100% | 0% | |
| Infrastructure config | 100% | 60% | 40% | No cluster access |
| **Overall Effective** | | **<weighted %>** | | |

---

## Time Tracking

| Phase | Start | End | Duration |
|-------|-------|-----|----------|
| Orientation (Phase 1) | | | |
| Architecture (Phase 2) | | | |
| Implementation (Phase 3) | | | |
| Operations (Phase 4) | | | |
| Synthesis (Phase 5) | | | |
| **Total** | | | |

---

## Next Steps

- [ ] Complete pending investigations
- [ ] Validate assumptions
- [ ] Resolve contradictions
- [ ] Run additional verification for low-confidence findings
- [ ] Perform self-critique pass
- [ ] Generate report