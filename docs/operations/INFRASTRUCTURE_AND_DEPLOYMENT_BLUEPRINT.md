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

### Storage scope decision

Under explicit owner delegation on 2026-11-02, external/object storage is deferred. Do not add product uploads, buckets, or a provider dependency. Local filesystem storage remains development/test-only unless separately approved. Reopen this decision only for a named owner-approved binary-media use case with rights and data-classification evidence, access and size limits, retention/deletion/legal-hold policy, threat model, and tested backup/recovery requirements. This decision does not certify any provider or resolve source rights.

## Transactional mail

Not implemented. Email delivery was removed: the SMTP adapter in `apps/api/src/mail`, the `/auth/forgot-password` and `/auth/reset-password` routes, their `@moonwitness/moonclient` contract, and every `SMTP_*` environment are gone. There is therefore no self-service password recovery; password changes remain manual work on the database. The first owner is created through the one-time setup flow, which is available only while the installation has no active super admin; later public registrations receive the `member` role. Complete this setup from a trusted network before exposing a fresh installation publicly. The Stalwart mail server and Roundcube webmail that were deployed on the Coolify host for the removed email feature are separate infrastructure and still need teardown.

## Current status and gaps

At HEAD `3acab11b2a6dd8291dc971869f45511fc078b82b`, API/web development ports remain 3000/3001 with Next rewrite for `/api`; commits `19086b1` and `3acab11` update Docker build wiring and add a tracked Coolify compose stack. Both Compose files start Postgres while API uses a LibSQL file. Root Compose supplies a known all-zero `PROVIDER_ENCRYPTION_KEY` fallback labelled for local development; Coolify Compose leaves provider credential storage unavailable if the encryption key is empty. A nonlocal deployment must use a protected key and a database service the API actually connects to. GitHub reports no releases, tags, deployments, or configured environments; current Actions run `41271986513` fails at lint. No backup, restore test, monitoring, or rollback evidence was verified. Treat current files as scaffolding, not a verified deployment or production certification.
