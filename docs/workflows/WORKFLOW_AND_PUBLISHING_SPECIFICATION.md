# Workflow and Publishing Specification

**Status: PARTIALLY IMPLEMENTED (MVP slice, MW-ADR-017).** `ql_workflow` ships the state machine below verbatim as four models (`workflow.project` + `workflow.task` for the PM tracker, `workflow.change` + `workflow.transition` for the CAB queue) behind a `/workflow/*` prefix handler. Reviewer group reuses existing `admin`/`operator` — a dedicated `reviewer` role is deferred to its own ADR. `ql_workflow` owns transitions and review tasks; domain addons own content; `ql_auth` owns actor identity. Rights clearance, publication handoff (`ql_publication`), and notification fan-out (`ql_ops`) remain PROPOSED and out of MVP scope.

## Content workflow

```text
DRAFT → SUBMITTED → IN_REVIEW → APPROVED → PUBLISHED
                    │              │            │
                    ├→ CHANGES_REQUESTED       ├→ WITHDRAWN
                    └→ REJECTED                 └→ SUPERSEDED
```

Transition guards are role/action based, evaluated server-side and recorded with actor, timestamp, content version, decision and reason. A submitter cannot approve their own work unless a future explicit policy allows it. `APPROVED` does not imply rights clearance; publication requires both content approval and a valid rights decision.

## Source-to-publication journey

1. Register identified source/version and rights metadata.
2. Select a rights-compatible work/edition/passage.
3. Draft an attributed claim or research note with source/evidence references.
4. Validate required fields, owner scope, stable references and provenance.
5. Submit into a review queue; freeze the reviewed revision or detect changes.
6. Reviewer records approve/request-changes/reject with rationale.
7. Publisher checks rights, privacy, locale and public projection; publishes a version.
8. Corrections create a new version; withdrawal follows retention and audit rules.

## Workflow controls

Idempotent submission; no duplicate active review for the same version; role checks at every transition; explicit reviewer assignment and conflict policy; no bypass endpoint; immutable audit event where feasible; notifications contain no private payload; retries bounded; orphaned task recovery defined. Workflow status is not evidence-quality score.

## First-slice acceptance

Demonstrate the full path with an approved small dataset. Verify wrong-owner and wrong-role denial, review trail, rights block, correction/withdrawal, `id`/`en` views, and safe public DTO. No production coding before planning ratification.
