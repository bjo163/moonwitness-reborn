# Security Review Reference

## Threat Modeling Framework (STRIDE)

| Threat | Description | Mitigation Patterns |
|--------|-------------|---------------------|
| **S**poofing | Impersonating identity | Strong authN, MFA, cert pinning |
| **T**ampering | Unauthorized data modification | Integrity checks, signatures, WAF |
| **R**epudiation | Denying actions | Audit logs, non-repudiation, signatures |
| **I**nformation Disclosure | Unauthorized data access | Encryption, least privilege, masking |
| **D**enial of Service | Service unavailable | Rate limiting, circuit breakers, scaling |
| **E**levation of Privilege | Unauthorized privilege gain | Least privilege, RBAC/ABAC, sandboxing |

## Authentication & Authorization

### Authentication Checks

| Check | Verification Method |
|-------|---------------------|
| Password policy | Min length, complexity, breach check (HaveIBeenPwned) |
| MFA support | TOTP, WebAuthn, backup codes |
| Session management | Secure cookies, HttpOnly, SameSite, rotation |
| Token handling | JWT: short expiry, refresh rotation, revocation |
| Brute force protection | Rate limit, account lockout, CAPTCHA |
| OAuth/OIDC | PKCE, state parameter, token validation |

### Authorization Checks

| Check | Verification Method |
|-------|---------------------|
| RBAC/ABAC enforced | Every endpoint checks permissions |
| Object-level auth | `user.can(action, resource)` not just role check |
| Privilege separation | Admin functions isolated |
| Trust boundaries | Service-to-service auth (mTLS, signed tokens) |
| Default deny | No implicit allow |

## Input Validation & Injection Prevention

| Vector | Prevention |
|--------|------------|
| SQL Injection | Parameterized queries only, ORM with safe API |
| NoSQL Injection | Typed queries, validation, no `$where` |
| Command Injection | No shell exec, allowlist arguments |
| LDAP Injection | Escape, parameterized filters |
| XPath/XQuery Injection | Parameterized queries |
| Header Injection | Validate/encode headers |
| Path Traversal | `path.resolve()`, allowlist, no user paths |

### Validation Layers

1. **Client-side** — UX only, never trusted
2. **API Gateway/WAF** — Rate limit, known attack patterns
3. **Application** — Schema validation (Zod, Joi, Pydantic, etc.)
4. **Domain** — Business rule validation
5. **Database** — Constraints, triggers (last line)

## Cryptographic Practices

| Practice | Requirement |
|----------|-------------|
| TLS | TLS 1.2+ everywhere, HSTS, cert transparency |
| Encryption at rest | AES-256-GCM, keys in KMS/HSM |
| Encryption in transit | TLS for all service communication |
| Password hashing | Argon2id, bcrypt, scrypt (never MD5/SHA) |
| Token signing | RS256/ES256 (not HS256 for distributed) |
| Key rotation | Automated, documented, tested |
| Random numbers | CSPRNG (`crypto.randomBytes`, `secrets`, `getrandom`) |

## Secrets Management

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Secrets in code | Environment variables, secret manager |
| Secrets in config files | `.env` in `.gitignore`, injected at runtime |
| Secrets in logs | Structured logging with redaction |
| Secrets in Docker images | Build args, multi-stage, runtime injection |
| Hardcoded keys | Key management service (Vault, AWS Secrets Manager) |

## Dependency & Supply Chain Security

| Check | Tool |
|-------|------|
| Known vulnerabilities | `npm audit`, `cargo audit`, `go vulncheck`, `pip-audit` |
| License compliance | `license-checker`, `cargo deny`, `fossa` |
| Typosquatting | `npm audit`, `cargo deny check advisories` |
| Pinned versions | Lockfiles committed, `npm ci`, `cargo build --locked` |
| Provenance | Sigstore, SLSA, attestations |
| Malware scanning | Socket, Snyk, GitHub Dependabot |

## Security Headers (Web)

| Header | Recommended Value |
|--------|-------------------|
| Content-Security-Policy | Strict, nonce-based, no `unsafe-inline` |
| X-Frame-Options | `DENY` or `SAMEORIGIN` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | Minimal features |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` |
| Cross-Origin-Opener-Policy | `same-origin` |
| Cross-Origin-Resource-Policy | `same-origin` |

## Logging & Auditing

| Requirement | Implementation |
|-------------|----------------|
| Security events logged | Auth success/failure, permission changes, data access |
| No secrets in logs | Automatic redaction, structured logging |
| Immutable logs | Append-only, signed, off-site backup |
| Correlation IDs | Request ID propagated through all services |
| Alerting | Failed auth spikes, privilege escalation, data export |

## Container & Infrastructure Security

| Check | Standard |
|-------|----------|
| Base image | Minimal (distroless, alpine), regularly updated |
| Non-root user | `USER nonroot` in Dockerfile |
| Read-only rootfs | `readOnlyRootFilesystem: true` |
| Capabilities | Drop all, add only required |
| Network policies | Default deny, explicit allow |
| Secrets in K8s | `Secret` objects, not ConfigMaps, encrypted at rest |
| Image scanning | Trivy, Grype, Syft in CI |
| Runtime security | Falco, Tetragon, or equivalent |

## Security Scorecard

| Dimension | Weight | Score | Evidence |
|-----------|--------|-------|----------|
| Authentication | 20% | | MFA, session, token handling |
| Authorization | 20% | | RBAC/ABAC, object-level, default deny |
| Input Validation | 15% | | Layers, parameterized queries |
| Cryptography | 10% | | TLS, hashing, key management |
| Secrets Management | 10% | | No secrets in code, rotation |
| Supply Chain | 10% | | Audit, pinning, provenance |
| Logging/Audit | 10% | | Events, redaction, alerts |
| Infrastructure | 5% | | Containers, network, runtime |

## Investigation Checklist

- [ ] Run dependency audit — zero critical/high?
- [ ] Check for hardcoded secrets — `git log --all --full-history --oneline -- "*secret*" "*.key" "*.pem"`
- [ ] Verify TLS everywhere — `curl -I`, check certs
- [ ] Test auth bypass — access protected endpoint without token
- [ ] Test authorization — access other user's data
- [ ] Test input validation — SQLi, XSS, path traversal payloads
- [ ] Check security headers — `curl -I` on web endpoints
- [ ] Review CORS — not `*`, credentials not with wildcard
- [ ] Check rate limiting — burst and sustained
- [ ] Verify error messages — no stack traces, no internal details
- [ ] Check logging — security events, no secrets
- [ ] Review container configs — non-root, read-only, capabilities
- [ ] Check network policies — default deny
- [ ] Verify backup encryption — at rest and in transit