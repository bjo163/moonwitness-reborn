# Database & Data Integrity Review Reference

## Schema Quality Evaluation

### 1. Normalization & Structure

| Level | Check | Target |
|-------|-------|--------|
| 1NF | No repeating groups, atomic values | Pass |
| 2NF | No partial dependencies on composite PK | Pass |
| 3NF | No transitive dependencies | Pass |
| BCNF | Every determinant is a candidate key | Pass for core tables |
| Denormalization | Documented, justified, maintained | Only for read performance |

### 2. Constraints & Integrity

| Constraint | When Required | Verification |
|------------|---------------|--------------|
| Primary Key | Every table | `information_schema.table_constraints` |
| Foreign Key | All relationships | `ON DELETE/UPDATE` actions defined |
| Not Null | Required fields | No nullable required columns |
| Unique | Business keys, natural keys | `UNIQUE` constraints |
| Check | Domain constraints (e.g., `age > 0`) | `CHECK` constraints |
| Exclusion | Complex uniqueness (e.g., no overlapping ranges) | `EXCLUDE USING gist` |

### 3. Indexing Strategy

| Index Type | Use Case | Warning Signs |
|------------|----------|---------------|
| B-tree (default) | Equality, range, sorting | Missing on FK columns |
| Hash | Equality only | Rarely needed |
| GIN/GiST | Full-text, JSONB, arrays, geospatial | Missing on JSONB query paths |
| Partial | Filtered subset | `WHERE` clause not indexed |
| Covering | `INCLUDE` columns | Key lookups on wide tables |

**Index Review Queries:**
```sql
-- Missing indexes on foreign keys
SELECT * FROM pg_catalog.pg_indexes 
WHERE tablename IN (SELECT table_name FROM information_schema.table_constraints 
                    WHERE constraint_type = 'FOREIGN KEY')
AND indexdef NOT LIKE '%foreign key%';

-- Unused indexes
SELECT * FROM pg_stat_user_indexes 
WHERE idx_scan = 0 AND schemaname = 'public';

-- Table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Transaction & Concurrency

### Isolation Levels

| Level | Phenomena Prevented | Use Case |
|-------|---------------------|----------|
| Read Uncommitted | None | Rarely used |
| Read Committed | Dirty reads | Default, most OLTP |
| Repeatable Read | Dirty + non-repeatable reads | Consistent snapshots |
| Serializable | All phenomena | Critical financial, inventory |

### Transaction Patterns

| Pattern | Correct Implementation |
|---------|------------------------|
| Short transactions | < 100ms, minimal locks |
| Optimistic locking | `version` column, `WHERE version = X` |
| Pessimistic locking | `SELECT FOR UPDATE` with `NOWAIT`/`SKIP LOCKED` |
| Idempotency | Idempotency keys, `INSERT ... ON CONFLICT` |
| Saga/Compensation | Choreography or orchestration, compensating transactions |

### Deadlock Prevention

- Consistent lock ordering (e.g., always lock parent before child)
- `NOWAIT` or `SKIP LOCKED` for contention hotspots
- Short transactions, minimal lock scope
- Retry with exponential backoff on deadlock error

## Migration Safety

### Migration Checklist

| Check | Tool/Method |
|-------|-------------|
| Backward compatible | Add column nullable, no `DROP COLUMN` without deprecation |
| Reversible | `DOWN` migration tested, or documented rollback |
| Zero-downtime | Expand-contract pattern for breaking changes |
| Tested | Run against production-size data copy |
| Reviewed | Schema diff in PR, DBA review for risky changes |
| Monitored | `pg_stat_activity` during migration, rollback plan |

### Risky Operations

| Operation | Risk | Mitigation |
|-----------|------|------------|
| `DROP COLUMN` | Data loss, app crash | Deprecate → nullable → drop in 3 releases |
| `ALTER TYPE` | Table rewrite, locks | Create new column, migrate, swap |
| `ADD CONSTRAINT` | Full table scan, locks | `VALIDATE` later, or `NOT VALID` + backfill |
| `REINDEX` | Locks | `CONCURRENTLY` (PostgreSQL 12+) |
| Large `DELETE` | Locks, bloat | Batch with `LIMIT`, `pg_sleep` |

## ORM Usage Patterns

### Good Patterns

| Pattern | Example |
|---------|---------|
| Repository pattern | Domain defines interface, infrastructure implements |
| Query objects | Complex queries encapsulated, testable |
| Unit of work | Transaction boundary explicit |
| Lazy loading | Only when explicitly needed, documented |

### Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| N+1 queries | Loop loads relations | Eager load (`include`, `join`, `selectinload`) |
| Leaky abstraction | SQL in domain code | Repository hides persistence |
| Anemic entities | Logic in services | Rich domain model |
| Unbounded queries | No pagination/limits | Cursor pagination, max limits |
| Auto-migration in prod | Uncontrolled schema changes | Explicit migrations only |

## Data Ownership & Multi-Tenancy

### Ownership Model

| Approach | Implementation |
|----------|----------------|
| Row-level security | `RLS` policies, `tenant_id` on all tables |
| Schema per tenant | Separate schemas, shared app |
| Database per tenant | Full isolation, operational complexity |
| Discriminator column | `tenant_id` + application filtering |

### Data Consistency

| Check | Method |
|-------|--------|
| Referential integrity | FK constraints enabled, not deferred |
| Cascade behavior | `ON DELETE CASCADE` only where intended |
| Soft delete | `deleted_at` + partial unique indexes |
| Audit trail | Trigger-based or application-level event sourcing |

## Backup & Recovery

| Requirement | Target |
|-------------|--------|
| RPO (Recovery Point Objective) | < 1 hour (continuous archiving) |
| RTO (Recovery Time Objective) | < 4 hours (tested) |
| Backup encryption | AES-256, keys separate from data |
| Point-in-time recovery | WAL archiving, `pg_basebackup` |
| Cross-region replication | At least 1 replica in different region |
| Restore tested | Quarterly restore drill documented |

## Performance & Scaling

### Query Analysis

```sql
-- Slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 20;

-- Table/index sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Cache hit ratio
SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) 
FROM pg_statio_user_tables;
```

### Scaling Strategies

| Strategy | When | Complexity |
|----------|------|------------|
| Read replicas | Read-heavy, acceptable lag | Low |
| Connection pooling | High connection count (PgBouncer) | Low |
| Partitioning | Large tables, time-series | Medium |
| Sharding | Write-heavy, horizontal scale | High |
| Caching | Hot data, read-heavy | Medium |

## Database Scorecard

| Dimension | Weight | Score | Evidence |
|-----------|--------|-------|----------|
| Schema Quality | 25% | | Normalization, constraints, naming |
| Indexing | 15% | | Coverage, unused, missing FK indexes |
| Transactions | 15% | | Isolation, locking, deadlock prevention |
| Migrations | 15% | | Safety, reversibility, zero-downtime |
| ORM Usage | 10% | | Patterns, anti-patterns, N+1 |
| Ownership/Tenancy | 10% | | RLS, isolation, consistency |
| Backup/Recovery | 10% | | RPO/RTO, encryption, tested |

## Investigation Checklist

- [ ] List all tables — any without PK?
- [ ] Check FK constraints — all relationships enforced?
- [ ] Check indexes — FK columns indexed? Unused indexes?
- [ ] Run `EXPLAIN ANALYZE` on top 10 slow queries
- [ ] Check migration history — reversible? backward compatible?
- [ ] Verify RLS policies if multi-tenant
- [ ] Check backup status — last successful, test restore date
- [ ] Review connection pool sizing — exhaustion errors?
- [ ] Check for `SELECT *` in production code
- [ ] Verify no raw SQL with string interpolation
- [ ] Check for N+1 in ORM usage
- [ ] Review cascade delete — any unintended?
- [ ] Check table bloat — `pgstattuple` or `pg_freespacemap`