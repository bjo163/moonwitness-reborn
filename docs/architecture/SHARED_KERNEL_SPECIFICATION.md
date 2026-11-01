# Shared Kernel Specification

**Status: PROPOSED.** The shared kernel consists of typed primitives/contracts implemented through existing addon and QlOrm capabilities. It must not become a universal “everything” model.

## Required shared concepts

| Concept | Minimum contract | Owner/use |
|---|---|---|
| Canonical ID | Stable opaque ID, explicit domain prefix/type, no semantic data encoded in ID | Created by owning addon |
| Typed reference | `entityType`, `entityId`; validate allowed target domain | Shared contract; source owner remains canonical |
| Source reference | source ID plus version/locator where needed | `ql_source` owns records |
| Provenance reference | origin, method, actor/system, time, transformation and parent inputs | `ql_source`; immutable history where feasible |
| Rights reference | rights record ID, permitted actions, territory/term/attribution constraints and status | `ql_source`; consumers check before use |
| Version | owner-defined revision or content version, with temporal validity when relevant | Domain-specific versioning; no generic versioned blob |
| Audit metadata | actor/service, action, timestamp, request/job correlation; redact secrets | Shared runtime; append-only audit semantics to be designed |
| Review state | draft/submitted/in-review/changes-requested/approved/rejected/withdrawn | `ql_workflow` transitions; domain retains content |
| Publication state | private/unlisted/public/withdrawn or approved taxonomy | workflow/content owner; must be ACL checked |
| Temporal metadata | created/updated/valid-from/valid-to as applicable, timezone explicit | Model owner defines semantics |
| Locale metadata | BCP 47 locale and fallback behavior for localized content | `ql_base` contract; content addon owns translations |
| Owner/tenant scope | owner field and optional organization scope | Domain addon must enforce; no implicit global visibility |

## Rules

- Use explicit typed references and domain-owned model fields; do not flatten all content into one generic table.
- Shared fields still declare type, validation, length, owner, ACL and view metadata in the owning addon manifest/model.
- A reference does not grant access to the referenced record. Every read resolves ACL independently.
- Provenance describes origin/transformation; it does not certify truth.
- Rights are separate from provenance and publication approval.
- Review state is not a confidence score; confidence and evidence quality belong to research assessment.
- Private fields are excluded from public metadata and responses. Server-side service access remains owner-scoped and tested.
- Avoid arbitrary JSON blobs for canonical relationships when typed models/contracts are possible.

## Relationship contract

Every cross-domain relation has a stable relation type, source owner, subject and object typed references, direction/cardinality, temporal scope when relevant, provenance/source link, rights/privacy checks, and status (asserted, under review, accepted, rejected or superseded as defined by the owning domain). The relation does not copy endpoint canonical data or grant permission to read it. Symmetry must be explicit; do not infer a reverse relation unless the relation definition says so. Research evidence relations additionally record method, rationale and uncertainty in `ql_research`. Relationship semantics are declared by the domain that owns the relation; `ql_relationship` is a candidate only for genuinely cross-domain assertions, not a universal graph dumping ground.

## Implementation boundary

Define TypeScript types in the appropriate addon or shared package only when they are stable across domains. Model declarations, view metadata, field ACL and owner information remain in `ql_*` packages and QlOrm. Do not add generic SQL schema, Drizzle metadata or migration files.
