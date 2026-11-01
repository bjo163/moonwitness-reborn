# Data Lifecycle and Provenance Specification

**Status: PROPOSED.** Source, rights, review and publication are separate dimensions; a record's publication does not upgrade source reliability or rights.

## Lifecycle

```text
DISCOVERED → REGISTERED → RIGHTS CHECKED → INGEST STAGED → VALIDATED
→ MAPPED TO CANONICAL IDS → REVIEWED → APPROVED FOR USE → PUBLISHED
                                                   ↘ REJECTED / QUARANTINED
PUBLISHED → SUPERSEDED / WITHDRAWN / CORRECTED (retain auditable history)
```

Each transition records actor/service, timestamp, input version, decision, reason and correlation ID. No transition silently overwrites the original. Reprocessing is idempotent and linked to the prior import run.

## Provenance record minimum

- Source artifact ID and exact version/edition; original URI or physical locator when lawful.
- Acquired/observed date, responsible actor or process, method and tool version.
- Input checksum where permitted; transformation code/version and output checksum.
- Parent inputs and canonical ID mapping, including rejected/ambiguous mappings.
- License/rights record, attribution, permitted use, jurisdiction/term and unresolved status.
- Validation result, reviewer and disposition.

## Rights gates

Before import, indexing, display, transformation, export or publication, evaluate the applicable rights action. Unknown or conflicting rights block the affected use. Public repository visibility is not a license. Keep metadata-only references when content rights are unclear and that metadata use is itself permitted. Respect takedown, retention and territorial/term limits.

## Uncertainty and corrections

Store source assertion, editorial interpretation, research assessment and confidence as distinct concepts. Confidence includes method and assessor, not an unexplained universal percentage. Corrections create a new version and a relation to the superseded assertion. Withdrawal hides content according to policy without erasing required audit/provenance.

## Import controls

1. Freeze and identify source snapshot (repo, branch, SHA or dataset release).
2. Inventory format, schema, IDs, counts and generated/materialized status.
3. Review source-specific rights and privacy.
4. Create explicit mapping and collision report; never remap IDs silently.
5. Validate schema, count reconciliation, references, text integrity and locale.
6. Stage in a reversible, isolated batch; use idempotency and checkpoints.
7. Review rejected/ambiguous records and sample output.
8. Record signed-off evidence and rollback procedure before publication.

## Privacy and retention

Private fields, witness safety data, credentials and secrets have narrower access/retention than public source metadata. Retention, deletion, export and legal-hold policy is still an open decision. Logs contain identifiers/correlation but not secrets or unnecessary raw testimony.
