# Infrastructure and Deployment Blueprint

**Status: PROPOSED; no production environment or provider selected.**

## Deployment principle

One application and one release artifact/process family. Web/API may run as modes or processes of the same codebase if runtime requires it; this does not authorize separate product identity or independently versioned domain services. Prefer the simplest topology supported by measured workload and security.

## Environments and configuration

Local development, CI and production use validated typed configuration. Secrets come from a protected runtime secret store; never commit them, expose them to browser bundles or place them in logs. Distinguish public, server-only and secret values. No provider account is assumed configured.

## Operations foundation

- Reproducible install/build with pinned lockfile and recorded runtime versions.
- Container image/deployment plan and environment-specific health/readiness checks.
- Structured logs, correlation IDs, metrics and traces with privacy redaction.
- Graceful shutdown and bounded background work; failed tasks visible and resumable.
- Encrypted backups, tested restore, key separation, retention, RPO/RTO targets.
- Release version, changelog, commit SHA, CI result and rollback artifact recorded.
- Rights-aware storage lifecycle and deletion/retention policy.

## Integrations

Object storage, email, AI providers and possible MOONSKY/ECHOLOG adapters are optional dependencies. Each needs a threat model, owner, contract, timeout/retry policy, data classification, and degraded mode. ECHOLOG's separate operator identity and MOONSKY's separate console do not become MoonWitness identity.

## Transactional mail

`/auth/forgot-password` sends through an SMTP adapter in `apps/api/src/mail` (nodemailer pool, implicit TLS on 465 or forced STARTTLS on 587/2525, one connection, 5 s connect/greeting and 10 s socket timeouts, one attempt and a 10 s hard deadline). There is no `ql_mail` addon and no message store: Stalwart owns queueing and retries, and a submission failure returns the same `200 {sent:false}` shape as an unknown address. With `SMTP_HOST`/`SMTP_USERNAME`/`SMTP_PASSWORD`/`SMTP_FROM` unset the API still boots and mail stays disabled.

Planned sender infrastructure is a self-hosted Stalwart container on the Coolify host `163.61.134.104`, submitting as `app@a-l-l-a-h.com`, with DNS-only MX/SPF/DKIM/DMARC records in Cloudflare. Two gates remain outside the repository: outbound port 25 from that VPS, and a PTR the owner does not control from a panel — the current reverse of `.104` is `mail.e-isp.id`, so either the hosting provider issues `mail.a-l-l-a-h.com` or the HELO name must match the existing PTR. Records must stay DNS-only; Cloudflare cannot proxy MX or SMTP.

## Current status and gaps

At HEAD `3acab11b2a6dd8291dc971869f45511fc078b82b`, API/web development ports remain 3000/3001 with Next rewrite for `/api`; commits `19086b1` and `3acab11` update Docker build wiring and add a tracked Coolify compose stack. Both Compose files start Postgres while API uses a LibSQL file. Root Compose supplies a known all-zero `PROVIDER_ENCRYPTION_KEY` fallback labelled for local development; Coolify Compose leaves provider credential storage unavailable if the encryption key is empty. A nonlocal deployment must use a protected key and a database service the API actually connects to. GitHub reports no releases, tags, deployments, or configured environments; current Actions run `41271986513` fails at lint. No backup, restore test, monitoring, or rollback evidence was verified. Treat current files as scaffolding, not a verified deployment or production certification.
