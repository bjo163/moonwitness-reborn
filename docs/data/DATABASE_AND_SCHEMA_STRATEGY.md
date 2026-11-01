# Database and Schema Strategy

**Status: PROPOSED within binding local constraints.** QlOrm and addon model metadata are the schema authority for this workspace.

## Binding rules

- All application tables are described by TypeScript `ql_*` addon models and synchronized automatically by QlOrm.
- Do not add Drizzle, Drizzle schemas or migration files.
- Addon manifests declare fields, type, length/validation, owner, ACL, views and dependencies.
- Every addon manifest declares a `data` array. QlOrm validates and loads default records after schema sync in dependency order, using stable addon external IDs (`ir.model.data`) and a per-record `insert_only` or `reconcile` policy. Empty arrays are valid when no safe system/reference defaults exist; user-owned and rights-sensitive domain records must not be fabricated as seed data.
- `ql_geo` owns the shared `res.country` reference catalog. It seeds the ISO 3166-1 alpha-2 set with English names; country subdivisions and user addresses are outside this scope.
- Domain reads/writes go through QlOrm. Do not create a parallel CRUD/domain layer in API or database packages.
- Test manifest/model/ACL behavior, cross-owner isolation, private fields and internal service calls.

## Current implementation evidence and gap

The local QlOrm uses `@libsql/client`; `syncSchema()` creates tables and adds columns with `ALTER TABLE`. Current model field types include char/text/integer/boolean/datetime. This is implemented, but it does not demonstrate safe rename/drop/backfill, transactional rollout, rollback or multi-instance coordination. No Drizzle or migration files were found in this workspace. Do not infer that every prior repository uses the same schema owner.

## Evolution strategy to resolve before production data

1. Specify supported additive change behavior and schema-version metadata within QlOrm/addon runtime (no separate migration files).
2. Define compatibility window for old/new application versions, defaults, backfill hooks and failure behavior.
3. Reject destructive field changes without an explicit export/backup, compatibility design and recovery procedure.
4. Make schema sync idempotent and safe under concurrent application starts.
5. Test fresh database, repeat sync, prior-version upgrade, invalid schema, partial failure and restore.
6. Choose the primary database engine based on workload and QlOrm support; local `@libsql/client` is current, PostgreSQL remains unselected.

## Integrity and access

Enforce required fields, max length and domain constraints in model/service; owner and ACL on every user-owned model; private-field masking in projections; indexes only for measured query paths. Add referential integrity semantics where QlOrm supports them and test application-level references where it does not. Never allow a generic internal service call to bypass owner predicates.

## Backup and recovery

Before production, document encrypted backup cadence, retention, restore test, RPO/RTO, key separation, point-in-time recovery limits, and incident rollback. No numbers are approved yet.
