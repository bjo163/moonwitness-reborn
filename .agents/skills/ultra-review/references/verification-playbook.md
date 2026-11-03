# Verification Playbook Reference

## Investigation Methods

### 1. Static Analysis

| Tool | Purpose | Command Pattern |
|------|---------|-----------------|
| TypeScript `tsc --noEmit` | Type errors | `tsc --noEmit --project tsconfig.json` |
| ESLint | Linting, security rules | `eslint . --ext .ts,.tsx --format json` |
| `grep`/`rg` | Pattern search | `rg -n "pattern" --type ts` |
| `glob` | File discovery | `glob "**/*.test.ts"` |
| Semgrep | Security patterns | `semgrep --config=auto .` |
| SonarQube | Quality gate | CI integration |
| CodeQL | Deep semantic analysis | GitHub Actions |

### 2. Dynamic Analysis

| Method | Purpose | Implementation |
|--------|---------|----------------|
| Unit tests | Function correctness | `pnpm test -- --reporter=verbose` |
| Integration tests | Module interactions | Testcontainers, localstack |
| E2E tests | User workflows | Playwright, Cypress |
| Contract tests | API compatibility | Pact, Spring Cloud Contract |
| Load tests | Performance | k6, Locust |
| Chaos tests | Resilience | Chaos Mesh, Litmus |
| Mutation tests | Test quality | Stryker, Pitest |

### 3. Runtime Verification

| Check | Method |
|-------|--------|
| API behavior | `curl -v`, Postman, automated contract tests |
| Database queries | `EXPLAIN ANALYZE`, `pg_stat_statements` |
| Memory/CPU | Profiling (`node --inspect`, `py-spy`, `pprof`) |
| Network | `tcpdump`, `wireshark`, distributed tracing |
| Logs | Structured log query (Loki, Elasticsearch) |
| Metrics | PromQL queries, dashboard inspection |

## Evidence Collection Standards

### Code Evidence

```
File: packages/ql_auth/src/services/token.ts:45-52
Function: generateAccessToken
Issue: Uses HS256 algorithm instead of RS256
Evidence: Direct code inspection
Confidence: CONFIRMED
```

### Tool Output Evidence

```
Command: tsc --noEmit
Output: error TS2322: Type 'string | null' is not assignable to type 'string'.
File: packages/ql_user/src/models/user.ts:128
Confidence: CONFIRMED
```

### Test Evidence

```
Test: packages/ql_auth/__tests__/token.test.ts:45
Scenario: Expired refresh token should be rejected
Result: FAIL - returns 200 instead of 401
Confidence: CONFIRMED
```

### Runtime Evidence

```
Command: curl -v https://api.example.com/users/123 -H "Authorization: Bearer invalid"
Response: HTTP/1.1 200 OK (should be 401)
Confidence: CONFIRMED
```

## Verification Patterns by Finding Type

### Security Findings

| Finding Type | Verification Steps |
|--------------|-------------------|
| SQL Injection | 1. Find parameterized query usage 2. Attempt injection payload 3. Check query logs |
| XSS | 1. Identify user input reflection 2. Inject payload 3. Check CSP headers 4. Test in browser |
| Auth Bypass | 1. Map auth flow 2. Test without token 3. Test with expired token 4. Test with other user's token |
| AuthZ Bypass | 1. Identify permission check 2. Access resource as different user 3. Check object-level enforcement |
| Secrets in Code | 1. `git log --all --full-history --oneline -- "*secret*" "*.key" "*.pem"` 2. `trufflehog` 3. Check CI logs |
| Weak Crypto | 1. Identify algorithm usage 2. Check key sizes 3. Verify key rotation |

### Code Quality Findings

| Finding Type | Verification Steps |
|--------------|-------------------|
| Null Pointer | 1. Trace callers 2. Check if null possible 3. Look for guards 4. Write test case |
| Race Condition | 1. Identify shared state 2. Check synchronization 3. Stress test concurrent access |
| Resource Leak | 1. Find resource acquisition 2. Trace all exit paths 3. Check cleanup 4. Load test |
| Dead Code | 1. `knip`/`depcheck` 2. Search callers 3. Check dynamic imports 4. Verify test coverage |

### Architecture Findings

| Finding Type | Verification Steps |
|--------------|-------------------|
| Circular Dependency | 1. `madge --circular` 2. Trace import chain 3. Verify runtime impact |
| God Module | 1. Count LOC, imports, responsibilities 2. Check coupling metrics 3. Verify change impact |
| Leaky Abstraction | 1. Find interface 2. Check implementations 3. Find direct implementation usage |
| Missing Abstraction | 1. Find duplicated logic 2. Check if parameterizable 3. Assess extraction value |

### Performance Findings

| Finding Type | Verification Steps |
|--------------|-------------------|
| Slow Query | 1. `EXPLAIN ANALYZE` 2. Check indexes 3. Check row counts 4. Test with production data volume |
| N+1 Query | 1. Enable query logging 2. Execute operation 3. Count queries 4. Verify eager loading fixes |
| Memory Leak | 1. Heap snapshot before/after 2. Compare retained size 3. Identify retaining path 4. Load test |
| Bundle Size | 1. `webpack-bundle-analyzer` 2. Identify large modules 3. Check for duplicates 4. Tree-shaking |

### Database Findings

| Finding Type | Verification Steps |
|--------------|-------------------|
| Missing FK | 1. Check `information_schema` 2. Verify orphaned rows 3. Test delete cascade |
| Missing Index | 1. `pg_stat_statements` 2. `EXPLAIN` slow queries 3. Check sequential scans |
| Migration Risk | 1. Review migration SQL 2. Check locking 3. Test on production-size data 4. Verify rollback |

## Reproduction Templates

### API Issue Reproduction

```bash
# 1. Set up test data
curl -X POST https://api.example.com/test/setup -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Execute problematic request
curl -v -X POST https://api.example.com/api/v1/endpoint \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'

# 3. Verify unexpected behavior
# Expected: 400 with validation error
# Actual: 500 or 200 with wrong data
```

### Frontend Issue Reproduction

```javascript
// 1. Navigate to page
await page.goto('/dashboard');

// 2. Perform action
await page.click('[data-testid="submit-button"]');

// 3. Verify state
await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
// Expected: Error message shown
// Actual: Nothing happens, console error
```

### Database Issue Reproduction

```sql
-- 1. Create test scenario
INSERT INTO users (id, email) VALUES ('test-1', 'test@example.com');
INSERT INTO orders (id, user_id, total) VALUES ('order-1', 'test-1', 100);

-- 2. Execute problematic query
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 'test-1';

-- 3. Verify plan
-- Expected: Index scan
-- Actual: Sequential scan
```

## Verification Checklist

Before reporting any finding:

- [ ] **Located exact artifact** — file, line, function, query
- [ ] **Understood intended behavior** — read docs, tests, comments
- [ ] **Traced dependencies** — callers, callees, data flow
- [ ] **Checked for mitigations** — guards, validation, fallback
- [ ] **Attempted reproduction** — safe, non-destructive
- [ ] **Searched for existing issues** — GitHub Issues, code comments
- [ ] **Assessed confidence** — CONFIRMED/HIGH/MEDIUM/LOW/UNKNOWN
- [ ] **Classified severity** — CRITICAL/HIGH/MEDIUM/LOW/INFO
- [ ] **Assigned priority** — P0/P1/P2/P3
- [ ] **Documented evidence** — code ref, tool output, test result
- [ ] **Proposed solution** — specific, actionable, with alternatives
- [ ] **Defined validation criteria** — how to verify fix

## Evidence Ledger Format

```markdown
## Evidence Ledger — Finding UR-2025-001-042

| Step | Action | Result | Evidence | Confidence |
|------|--------|--------|----------|------------|
| 1 | Code inspection: token.ts:45 | HS256 used | File reference | CONFIRMED |
| 2 | Check config | No key rotation | config/auth.ts | CONFIRMED |
| 3 | Test token decode | Works with any secret | Manual test | CONFIRMED |
| 4 | Search for RS256 usage | None found | rg "RS256" | HIGH |
| 5 | Check dependency | jsonwebtoken v9 | package.json | CONFIRMED |
```

## Tool Availability Detection

```bash
# Check available tools
command -v tsc && echo "TypeScript: OK"
command -v eslint && echo "ESLint: OK"
command -v rg && echo "ripgrep: OK"
command -v jq && echo "jq: OK"
command -v curl && echo "curl: OK"
command -v psql && echo "PostgreSQL: OK"
command -v redis-cli && echo "Redis: OK"
command -v docker && echo "Docker: OK"
command -v kubectl && echo "kubectl: OK"
command -v gh && echo "GitHub CLI: OK"
```

## When Verification is Blocked

Document exactly what prevents verification:

```markdown
## Blocked Verification — Finding UR-2025-001-099

**Finding:** Potential SSRF in webhook handler
**Blocked by:** No test environment with external network access
**Required:** Staging deployment or network simulation
**Partial Evidence:** Code inspection shows user-controlled URL passed to fetch()
**Confidence:** MEDIUM (inferred, not reproduced)
**Recommendation:** Deploy to staging and test with controlled external endpoint
```