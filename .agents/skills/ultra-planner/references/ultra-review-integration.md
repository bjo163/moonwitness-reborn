# Ultra Review Integration Reference

## Integration Overview

The Ultra Planner integrates with Ultra Review to transform validated findings into precise technical solutions. This is not a mechanical conversion — it requires independent verification, architectural reasoning, and solution design.

### Integration Principles

1. **Verify Before Planning** — Independently verify high-impact findings before designing solutions
2. **Root Cause Over Symptom** — Address architectural root causes, not surface symptoms
3. **Preserve Working Systems** — Don't redesign what works; target the specific gap
4. **Architectural Coherence** — Solutions must fit the overall architecture, not create new inconsistencies
5. **Traceability** — Preserve original finding IDs throughout the planning chain

## Integration Workflow

### Step 1: Consume Review Report

```markdown
# Review Consumption Checklist

## Executive Summary
- [ ] Overall condition assessed
- [ ] Primary engineering risks identified
- [ ] Critical findings count noted

## Detailed Findings Review
For each finding with Severity ≥ HIGH:
- [ ] Read finding details
- [ ] Inspect cited evidence (code references, tool output)
- [ ] Verify finding still exists in current codebase
- [ ] Check for duplicate root causes across findings
- [ ] Assess confidence level (downgrade if evidence weak)

## Evidence Verification
- [ ] Code references valid (file exists, lines match)
- [ ] Tool output reproducible (run cited commands)
- [ ] Test failures reproducible (run cited tests)
- [ ] Runtime behavior confirmed (if claimed)
```

### Step 2: Root Cause Analysis

For each validated finding:

```
Finding ID: UR-2025-001-042
Original Finding: HS256 used for JWT instead of RS256
Severity: HIGH
Confidence: CONFIRMED

Independent Verification:
- [ ] Located packages/ql_auth/src/token.ts:45
- [ ] Confirmed HS256 algorithm in generateAccessToken()
- [ ] Checked config — no key rotation policy
- [ ] Verified jsonwebtoken v9 supports RS256

Root Cause Analysis:
- [ ] Symptom: Weak token signing algorithm
- [ ] Immediate Cause: HS256 hardcoded in token service
- [ ] Root Cause: No cryptographic standards documented; key management not designed
- [ ] Architectural Gap: Security architecture (SPEC-SEC-001) missing key management section
- [ ] Process Gap: No security review gate for auth changes

Related Findings:
- UR-2025-001-043: No key rotation policy (same root cause)
- UR-2025-001-015: Missing security headers (related: auth security posture)
```

### Step 3: Solution Design

For each root cause, design architectural solution:

```
Root Cause: No cryptographic standards; key management not designed

Solution Options:

Option A: Minimal Fix — Switch to RS256
- Change algorithm in token service
- Generate RSA key pair
- Add key rotation (annual)
- Effort: S
- Risk: Low
- Limitation: Doesn't address broader crypto standards gap

Option B: Comprehensive — Crypto Standards Module
- Create ql_crypto shared package
- Define AlgorithmPolicy (RS256 for JWT, AES-256-GCM for encryption)
- Implement KeyManager (generation, rotation, storage)
- Integrate with Vault/External Secrets
- Update all crypto consumers
- Effort: M
- Risk: Medium (broader change)
- Benefit: Addresses root cause holistically, enables future requirements

Option C: Externalize — Use Auth0/Keycloak
- Offload token management to dedicated IdP
- Effort: L
- Risk: High (vendor dependency, migration)
- Benefit: Eliminates entire class of auth security issues

Recommendation: Option B (Comprehensive)
Rationale: Addresses root cause, maintains control, enables future needs, reasonable effort
Conditions: Team has capacity for M effort; Vault already planned for secrets
```

### Step 4: Implementation Specification

Create detailed specification for the solution:

```markdown
# Spec: Cryptographic Standards Module (SPEC-CRYPTO-001)

## Metadata
- Spec ID: SPEC-CRYPTO-001
- Version: 1.0.0
- Status: DRAFT
- Related Findings: UR-2025-001-042, UR-2025-001-043
- Root Cause: No cryptographic standards; key management not designed

## 1. Purpose
Establish centralized cryptographic standards and key management for the platform.

## 2. Scope
### In Scope
- Algorithm policies (JWT signing, encryption, hashing)
- Key generation, rotation, storage, revocation
- Integration with Vault/External Secrets
- Migration from HS256 to RS256

### Out of Scope
- Authentication flows (handled by ql_auth)
- Authorization logic (handled by ql_auth)
- Certificate management for TLS (infrastructure)

## 3. Functional Behavior
### 3.1 Algorithm Policy
| Use Case | Algorithm | Parameters | Rotation |
|----------|-----------|------------|----------|
| JWT Signing | RS256 | 2048-bit RSA | Annual |
| Data Encryption | AES-256-GCM | 256-bit key | 90 days |
| Password Hashing | Argon2id | t=3, m=64MB, p=4 | N/A (re-hash on login) |
| Token Signing (internal) | ES256 | P-256 | Annual |

### 3.2 Key Management
- Keys generated via Web Crypto API / Node crypto
- Private keys stored in Vault (never in memory long-term)
- Public keys distributed via JWKS endpoint
- Rotation: automated via cron + Vault rotation
- Revocation: immediate via key version deactivation

## 4. Technical Design
### 4.1 Package: ql_crypto
```
packages/ql_crypto/
├── src/
│   ├── index.ts              # Public API
│   ├── algorithms/
│   │   ├── policy.ts         # AlgorithmPolicy type + defaults
│   │   ├── jwt.ts            # JWT sign/verify with RS256
│   │   ├── encryption.ts     # AES-256-GCM encrypt/decrypt
│   │   └── hashing.ts        # Argon2id wrapper
│   ├── keys/
│   │   ├── manager.ts        # KeyManager class
│   │   ├── vault.ts          # Vault integration
│   │   └── jwks.ts           # JWKS endpoint
│   └── types.ts              # KeyId, Algorithm, KeyPair
```

### 4.2 Integration Points
- ql_auth: Uses ql_crypto for token signing/verification
- ql_billing: Uses ql_crypto for webhook signature verification
- ql_api: Exposes JWKS endpoint at /.well-known/jwks.json

## 5. Security
- Private keys never leave Vault
- Key rotation zero-downtime (overlap period)
- Algorithm agility: policy versioned, consumers read policy
- Audit logging for all key operations

## 6. Acceptance Criteria
| AC ID | Criterion | Verification |
|-------|-----------|--------------|
| AC-001 | ql_crypto exports sign/verify for RS256 | Unit test |
| AC-002 | Key rotation completes without downtime | Integration test |
| AC-003 | JWKS endpoint returns valid public keys | Contract test |
| AC-004 | ql_auth migrated to RS256 | E2E test |
| AC-005 | Old HS256 tokens rejected after migration | E2E test |
| AC-006 | Vault integration works in staging | Deployment test |

## 7. Migration Plan
1. Create ql_crypto package with RS256 support
2. Deploy ql_crypto to staging
3. Migrate ql_auth to use ql_crypto (dual-support HS256/RS256 during transition)
4. Generate RSA key pair in Vault
5. Enable RS256 for new tokens
6. Set HS256 token expiry to 1 hour (force migration)
7. After 24h: remove HS256 support
8. Update documentation

## 8. Traceability
- Root Cause: No crypto standards (UR-2025-001-042/043)
- Spec: SPEC-CRYPTO-001
- Implementation: ql_crypto package
- Tests: ql_crypto tests, ql_auth integration tests
- Deployment: Staging → Production
```

### Step 5: Verification Requirements

Define how to verify the fix addresses the original finding:

```
Finding: UR-2025-001-042 (HS256 used for JWT)

Verification Requirements:
1. Code Verification
   - [ ] ql_auth no longer imports HS256 algorithm
   - [ ] ql_auth uses ql_crypto.jwt.sign/verify
   - [ ] ql_crypto uses RS256 exclusively

2. Functional Verification
   - [ ] New tokens are RS256 (decode header shows "alg": "RS256")
   - [ ] RS256 tokens validate correctly
   - [ ] HS256 tokens rejected (after migration)

3. Security Verification
   - [ ] Private key not in codebase (trufflehog scan clean)
   - [ ] Private key in Vault (audit log shows)
   - [ ] Key rotation tested (manual trigger)

4. Regression Verification
   - [ ] All auth tests pass
   - [ ] Login/registration flows work
   - [ ] Token refresh works
   - [ ] MFA flows work

5. Performance Verification
   - [ ] Token generation < 50ms p99
   - [ ] Token verification < 10ms p99
```

## Categorization of Review Findings

Not all findings become implementation work:

| Category | Action | Example |
|----------|--------|---------|
| **Confirmed Defect Remediation** | Immediate implementation spec | SQL injection, auth bypass |
| **Risk Reduction** | Architecture improvement spec | Missing circuit breaker, weak crypto |
| **Architecture Improvement** | Refactor spec with migration plan | Circular dependency, god module |
| **Technical Debt** | Prioritized in roadmap, not immediate | Code duplication, dead code |
| **Optional Enhancement** | Backlog, future consideration | New pattern, nicer API |
| **Strategic Future Capability** | Vision document, not current scope | Microservices migration, AI features |

## Integration Checklist

- [ ] Review report consumed systematically
- [ ] High-severity findings independently verified
- [ ] Root causes identified (not just symptoms)
- [ ] Duplicate root causes consolidated
- [ ] Solution options evaluated with trade-offs
- [ ] Recommended solution documented with rationale
- [ ] Implementation specification created
- [ ] Verification requirements defined per finding
- [ ] Original finding IDs preserved in traceability
- [ ] Findings categorized (remediation vs enhancement vs strategic)
- [ ] Dependencies between remediation work identified
- [ ] Implementation sequencing respects dependencies