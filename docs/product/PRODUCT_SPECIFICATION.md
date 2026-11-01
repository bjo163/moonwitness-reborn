# Product Specification

**Ecosystem context:** A-L-L-A-H.COM / EMPIRE OF THE LIGHT identity is governed by [`../vision/ALLAH_COM_OFFICIAL_CANON.md`](../vision/ALLAH_COM_OFFICIAL_CANON.md). This specification owns MoonWitness user needs, product scope and acceptance criteria only.

**Status: PROPOSED · Canonical product requirements owner**

## Product outcome

MoonWitness provides one connected Web/API experience where a user can preserve an identified source, find a relevant work/edition/passage, inspect provenance and rights, connect it to a claim or research question, review contribution and uncertainty, then publish a human-approved result.

## User roles (candidate; identity/authorization still to be designed)

| Role | Primary need | Guardrail |
|---|---|---|
| Reader | Discover and inspect source material and published records | Public access follows rights and publication state |
| Researcher/contributor | Record claims, evidence, relationships and methods | Attribution, source links, and uncertainty required |
| Reviewer/editor | Check source, rights, quality and presentation | Review decision is auditable and attributable |
| Publisher/administrator | Control publication, roles and configuration | Least privilege and explicit approval |
| System operator | Maintain service health and integrations | Operational access separated from content authority |

These are role hypotheses, not a final role or permission matrix.

## Capabilities and stages

| Horizon | Candidate outcome | Gate |
|---|---|---|
| Foundation | Single app shell, id/en, identity/ACL, addon runtime, audit trail, source and rights model | Reproducible local build and security tests |
| First slice | Source → work/edition/passage → claim/evidence → human review → publication | Rights-cleared dataset and end-to-end acceptance |
| Core expansion | Search, ontology, people, events, witness, research, story and relationships | Domain ownership tests; no duplicate canonical records |
| Creative/action | Characters, journeys, accountable action and controlled AI support | Editorial and AI safety approval |
| Scale | Larger corpora, analytics, interoperability and additional locales | Measured need and operational readiness |

## Functional requirements (initial)

- Each published text, claim and relationship resolves to its owner and source/provenance where applicable.
- User contribution has explicit review and publication states; a draft cannot be mistaken for a verified finding.
- Exact text, translation, commentary, user annotation and AI-generated text have distinct types and provenance.
- Rights and permitted use are queryable before display/export/indexing.
- Private fields never appear in public metadata, user CRUD or logs.
- Search and discovery preserve locale and source context.
- Idempotent import records rejected/duplicate rows and can be resumed safely.
- API inputs are shape- and size-validated; domain validation is shared with the addon service.
- Navigation and forms work in Indonesian and English and on responsive layouts.

## Non-functional requirements (to quantify before build)

Availability, latency, throughput, corpus size, restore point/time, retention and accessibility conformance are **TBD**. Set measurable targets in a later ADR before a production claim. Initial release must have structured logs without secrets, health checks, backup/restore evidence and a rollback route.

## Product acceptance for first slice

1. User can open an allowed source/edition/passage and see attribution and rights state.
2. A contributor can draft a sourced claim and attach evidence without overwriting source text.
3. A reviewer can approve, reject or request changes with actor, time and reason captured.
4. Only approved, rights-compatible records become publicly visible.
5. Cross-owner attempts and private fields are denied and covered by tests.
6. The same journey works in `id` and `en`, keyboard accessible, with honest loading/error/empty states.
7. The behavior runs in the unified application and uses the canonical client/API contracts.

## Open product decisions

First persona; initial dataset/edition; anonymous browsing; contribution policy; publication roles; meaning of “verified”; initial search; data retention; launch audience and success metrics.
