# Migration and Rollback Plan

**Status: PROPOSED.** No data migration was performed. QlOrm ownership means “migration” here is a controlled import/schema rollout plan, not permission to add migration files.

## Repository migration

1. Ratify `moonwitness-reborn` or another target and record exact SHA.
2. Preserve all historical repositories and commit history.
3. Audit current scratch and dirty local checkouts; never overwrite or reset them.
4. Move code in reviewable, bounded commits with source repo/SHA and file mapping.
5. Rebuild conflicting architecture; adopt only compatible reviewed components; import data only with rights/provenance; reference the rest.
6. Compare build/tests and feature evidence before any promotion.

## Data import and rollback

- Freeze exact source snapshot, checksums and rights decision.
- Import into isolated staging using stable canonical ID mappings and idempotency key.
- Keep an import-run manifest and row-level success/reject results, not an untraceable bulk overwrite.
- Verify counts, referential integrity, locale, exact text checksum, ACL and sample review.
- Before publication, capture encrypted backup and restore point; record operator and approver.
- Rollback by disabling new publication/index exposure and restoring a known-good backup or removing the isolated batch only where references and audit are preserved. Define exact safe procedure per chosen DB/QlOrm capabilities.
- Never rewrite historical IDs or delete source records as an implicit rollback.

## Schema rollout under QlOrm

No Drizzle or migration files. Before changing addon models, test fresh install and prior-version schema synchronization. Prefer compatible additive changes; use explicit application-level backfill service with checkpoint, owner and audit when needed. Do not drop/rename data until export, compatibility window, recovery and owner approval are proven. Current QlOrm auto-sync capabilities for destructive changes, concurrent startup and rollback are unverified.

## Release rollback

Version artifacts by commit; retain previous known-good release; use health checks and bounded rollout; define trigger and operator; protect data compatibility; roll back application only when schema/data remain compatible. Test backup restore and rollback in the selected environment before production. RPO/RTO and environment remain TBD.
