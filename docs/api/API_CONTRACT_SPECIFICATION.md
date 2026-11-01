# API Contract Specification

**Status: PROPOSED contract policy.** Canonical implementation location is `@moonwitness/moonclient`, per workspace `AGENTS.md`.

## Ownership and shape

- Define each route once in moonclient alongside request/response DTOs and the `moonClient` SDK.
- API handlers consume shared constants/DTOs; do not hard-code a second endpoint path table in `apps/api`.
- Web code calls only `moonClient`; no fetch, XMLHttpRequest, axios, or independent transport client.
- Validate request shape and size at API boundary; domain-specific rules live in owning addon/service and are reused there.
- Use stable, explicit error codes and a typed response envelope; never return stack traces, database internals, secrets or private metadata.
- Version contracts deliberately; breaking changes require compatibility plan and tests.

## Authentication and authorization

Authentication establishes a principal; each addon service authorizes action and record scope. The browser does not decide ACL. Denials must not disclose whether an inaccessible private record exists. Session cookies remain HttpOnly, secure in production and SameSite policy as approved. Mutating browser requests need CSRF protection appropriate to the chosen cookie/origin model.

## DTO policy

DTOs are public projections, not ORM model serialization. Define separate create/update/read projections. Exclude password hashes, provider secrets, token hashes, internal notes and private fields. Return source/rights/review/publication status needed for an honest UX without leaking restricted content. Use explicit locale and pagination limits. Reject oversized bodies before domain work.

## Error and observability contract

Errors include stable code, safe message, optional field issues, retryability and correlation ID. Logs correlate request and service call while redacting credentials, exact private testimony where unnecessary, and provider responses that may contain sensitive material.

## Contract test matrix

For each route: valid input; malformed/oversized input; unauthenticated; authenticated wrong owner; insufficient role; private-field exclusion; domain rejection; successful response projection; duplicate/idempotent operation; stable error shape. Tests belong in moonclient/API/addon workspaces as appropriate.

## Route registry

The local implementation already centralizes route constants in `packages/moonclient/src/index.ts`. Keep that as the sole route registry. Route inventory and method/path DTO definitions must be generated from the actual moonclient source during a future code audit; this planning document intentionally does not repeat a competing endpoint list.

## API ownership matrix (proposed)

| Capability | Contract/SDK owner | Domain/service owner | API boundary responsibility |
|---|---|---|---|
| Identity/session | moonclient | `ql_auth` | Authenticate, validate request, invoke session service |
| Source/rights/provenance | moonclient | `ql_source` | Validate request shape, invoke owner-scoped source service |
| Corpus/reader | moonclient | `ql_corpus` | Apply auth boundary and return rights-aware projection |
| Research/evidence | moonclient | `ql_research` | Invoke service; no duplicate assessment rules |
| Review/publication | moonclient | `ql_workflow` + content owner | Authenticate transition and return safe status |
| AI/chat | moonclient | `ql_ai` / `ql_chat` | Enforce ingress size/auth, call bounded service, safe error mapping |

Candidate package names remain subject to the canonical domain registry. Every route is assigned exactly one domain service; routes must not create a second persistence/ACL authority in API.
