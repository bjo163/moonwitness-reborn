# Security Architecture Reference

## Security Architecture Principles

### 1. Zero Trust Architecture

**Core Tenets:**
- Never trust, always verify
- Least privilege access
- Assume breach
- Verify explicitly
- Encrypt everything

**Implementation:**
- mTLS for all service-to-service
- Short-lived tokens (JWT 15min, refresh 7d)
- Continuous authorization (not just at login)
- Device/context awareness

### 2. Authentication Architecture

**Identity Provider (IdP) Pattern:**
```
User → Auth Service (IdP) → JWT → Resource Server
                    ↓
              MFA, Session Mgmt
              User Store (DB/LDAP)
```

**Token Strategy:**
| Token Type | Lifetime | Storage | Rotation |
|------------|----------|---------|----------|
| Access Token (JWT) | 15 min | Memory | Silent refresh |
| Refresh Token | 7 days | HttpOnly Secure Cookie | Rotation on use |
| API Key | 1 year | Secret Manager | Manual rotation |
| Service Token | 1 hour | Vault/Secret Manager | Auto-rotation |

**Authentication Flows:**
- **Web App:** Authorization Code + PKCE
- **SPA:** Authorization Code + PKCE (no client secret)
- **Mobile:** Authorization Code + PKCE + biometric
- **Service-to-Service:** Client Credentials + mTLS
- **CLI:** Device Authorization Grant

### 3. Authorization Architecture

**Models:**
| Model | Best For | Implementation |
|-------|----------|----------------|
| **RBAC** | Clear role hierarchies | Role → Permissions, User → Roles |
| **ABAC** | Dynamic, context-aware | Policy engine (OPA, Cedar) |
| **ReBAC** | Resource-specific access | Relationship tuples (Google Zanzibar) |
| **Hybrid** | Most real systems | RBAC base + ABAC for exceptions |

**Authorization Layers:**
1. **Gateway** — Coarse (role, scope)
2. **Application** — Fine-grained (object-level)
3. **Database** — Row-level security (RLS)

**Object-Level Authorization Pattern:**
```typescript
// Every resource access
async function getUser(userId: string, actor: Actor): Promise<User> {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError();
  
  // Authorization check
  if (!actor.can('read', 'user', user)) {
    throw new ForbiddenError();
  }
  return user;
}
```

### 4. Secrets Management

**Hierarchy:**
| Secret Type | Storage | Rotation | Access |
|-------------|---------|----------|--------|
| **Root Keys** | HSM / Cloud KMS | Annual | Platform team only |
| **Service Secrets** | Vault / Secrets Manager | 90 days | Service identity |
| **Database Credentials** | Vault dynamic secrets | Per-use / 1hr | Service identity |
| **API Keys (External)** | Vault / Secrets Manager | Per-provider | Service identity |
| **Encryption Keys** | Cloud KMS | Annual | Service identity |

**Principles:**
- Never in code, config files, Docker images, CI logs
- Inject at runtime via sidecar, init container, or SDK
- Audit all access
- Automatic rotation with zero-downtime

### 5. Data Protection

**Classification:**
| Level | Examples | Encryption | Access |
|-------|----------|------------|--------|
| **Public** | Marketing content | TLS only | Anyone |
| **Internal** | Business metrics | TLS + at-rest | Employees |
| **Confidential** | User PII, payments | TLS + at-rest + field-level | Need-to-know |
| **Restricted** | Secrets, keys | TLS + at-rest + field-level + HSM | Minimal |

**Encryption Standards:**
- **In Transit:** TLS 1.2+ everywhere, HSTS, certificate pinning for mobile
- **At Rest:** AES-256-GCM, keys in KMS/HSM
- **Field-Level:** Application-layer for PII (email, phone, SSN)
- **Key Management:** Envelope encryption (DEK encrypted by KEK in KMS)

### 6. Input Validation & Output Encoding

**Validation Layers:**
1. **Client** — UX only, never trusted
2. **Gateway/WAF** — Size, known attacks, rate limit
3. **API Framework** — Schema validation (Zod, etc.)
4. **Application** — Business rules
5. **Database** — Constraints (final line)

**Output Encoding:**
| Context | Encoding |
|---------|----------|
| HTML | HTML entity encoding |
| JavaScript | JS string encoding |
| CSS | CSS encoding |
| URL | Percent encoding |
| SQL | Parameterized queries (never string concat) |
| Shell | Never pass user input to shell |

### 7. Security Headers (Web)

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Strict, nonce-based | XSS prevention |
| X-Frame-Options | DENY | Clickjacking |
| X-Content-Type-Options | nosniff | MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Privacy |
| Permissions-Policy | Minimal features | Feature control |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | HTTPS enforcement |
| Cross-Origin-Opener-Policy | same-origin | COOP |
| Cross-Origin-Resource-Policy | same-origin | CORP |

### 8. Logging & Auditing

**Security Events to Log:**
- Authentication: success, failure, MFA, lockout
- Authorization: access granted, denied, privilege changes
- Data Access: PII read, export, deletion
- Admin Actions: config changes, user management
- Security Events: WAF blocks, rate limits, anomalies

**Log Format (Structured):**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "WARN",
  "event": "AUTHORIZATION_DENIED",
  "actor": { "type": "user", "id": "user-123" },
  "resource": { "type": "subscription", "id": "sub-456" },
  "action": "read",
  "reason": "insufficient_permissions",
  "request_id": "req-abc123",
  "source_ip": "192.168.1.1"
}
```

**Protection:**
- No secrets in logs (automatic redaction)
- Immutable storage (append-only, signed)
- Retention per compliance
- Alerting on anomalous patterns

### 9. Supply Chain Security

**Dependency Management:**
- Lockfiles committed (`package-lock.json`, `Cargo.lock`, `go.sum`)
- `npm ci` / `cargo build --locked` in CI
- Automated updates (Dependabot, Renovate) with PRs
- Vulnerability scanning in CI (`npm audit`, `cargo audit`, `go vulncheck`)
- License compliance checking
- Provenance verification (Sigstore, SLSA)

**Container Security:**
- Minimal base images (distroless, alpine)
- Non-root user (`USER nonroot`)
- Read-only root filesystem
- Drop all capabilities, add only required
- Image signing (cosign, Notary)
- Runtime scanning (Trivy, Grype in CI)

### 10. Infrastructure Security

**Network:**
- Private subnets, no public IPs for services
- NAT gateway for egress
- Security groups: default deny, explicit allow
- VPC endpoints for AWS services
- Service mesh for mTLS (Istio, Linkerd, Consul)

**Kubernetes:**
- RBAC: least privilege, namespace-scoped
- Network policies: default deny
- Pod security standards: restricted
- Admission controllers: OPA Gatekeeper, Kyverno
- Secrets: External Secrets Operator, Sealed Secrets
- Runtime security: Falco, Tetragon

**Cloud:**
- IAM: least privilege, condition keys
- CloudTrail: all regions, all services
- Config: compliance rules
- GuardDuty / Security Hub enabled
- Encryption: default on all services

### Security Architecture Checklist

- [ ] Zero trust principles applied
- [ ] Authentication: MFA, short-lived tokens, secure flows
- [ ] Authorization: RBAC/ABAC, object-level, default deny
- [ ] Secrets: Never in code, rotated, audited
- [ ] Data: Classified, encrypted (transit + rest + field)
- [ ] Input: Validated at all layers, output encoded
- [ ] Headers: Security headers on all web responses
- [ ] Logging: Security events, structured, no secrets
- [ ] Supply Chain: Lockfiles, scanning, provenance
- [ ] Containers: Minimal, non-root, signed, scanned
- [ ] Network: Private, segmented, mTLS
- [ ] Kubernetes: RBAC, policies, admission control
- [ ] Cloud: IAM least privilege, logging, encryption
- [ ] Incident Response: Plan, runbooks, tested