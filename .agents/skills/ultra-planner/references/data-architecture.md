# Data Architecture Reference

## Data Architecture Principles

### 1. Data Ownership

| Principle | Implementation |
|-----------|----------------|
| **Single Writer** | Each entity owned by exactly one service/package |
| **Read Replicas** | Other services read via API or read replica |
| **Schema Ownership** | Owning service controls migrations |
| **Data Contracts** | Explicit schemas for cross-service data |

### 2. Data Modeling Process

1. **Conceptual Model** — Domain entities, relationships (from domain architecture)
2. **Logical Model** — Normalized schema, constraints, keys
3. **Physical Model** — Indexes, partitioning, storage engine specifics
4. **Migration Strategy** — Versioned, reversible, zero-downtime

### 3. Entity Design Standards

**Naming Conventions:**
- Tables: `snake_case`, plural (`users`, `user_profiles`)
- Columns: `snake_case` (`user_id`, `created_at`, `email_verified`)
- Primary Keys: `id` (UUID) or `<table>_id` (`user_id`)
- Foreign Keys: `<referenced_table>_id` (`user_id` references `users.id`)
- Indexes: `idx_<table>_<columns>` (`idx_users_email`)
- Unique Constraints: `uq_<table>_<columns>` (`uq_users_email`)

**Required Columns (Every Table):**
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
created_by      UUID        -- nullable for system records
updated_by      UUID        -- nullable for system records
version         INTEGER     NOT NULL DEFAULT 1  -- optimistic locking
```

**Soft Delete Pattern (When Needed):**
```sql
deleted_at      TIMESTAMPTZ  -- NULL = active, timestamp = deleted
-- Partial unique index for unique constraints on active rows only
CREATE UNIQUE INDEX uq_users_email_active ON users (email) WHERE deleted_at IS NULL;
```

### 4. Relationship Patterns

| Relationship | Implementation |
|--------------|----------------|
| **One-to-One** | FK on dependent table, unique constraint |
| **One-to-Many** | FK on "many" side, index on FK |
| **Many-to-Many** | Junction table with two FKs, composite PK |
| **Hierarchical** | Adjacency list (`parent_id`) + closure table for deep queries |
| **Polymorphic** | Avoid. Use separate tables or JSONB with type discriminator |

### 5. Constraint Strategy

| Constraint | Level | When |
|------------|-------|------|
| **Primary Key** | Database | Always |
| **Foreign Key** | Database | Always (ON DELETE RESTRICT default) |
| **Not Null** | Database | Required fields |
| **Unique** | Database | Business keys, natural keys |
| **Check** | Database | Domain rules (age > 0, status in enum) |
| **Exclusion** | Database | Complex uniqueness (no overlapping ranges) |
| **Trigger** | Database | Audit, computed columns, cross-table |
| **Application** | Code | Complex business rules, multi-table |

### 6. Indexing Strategy

**Default Indexes:**
- All FK columns (automatic in some DBs, manual in PostgreSQL)
- Columns in WHERE clauses of frequent queries
- Columns in ORDER BY / GROUP BY
- Partial indexes for filtered queries

**Index Types:**
| Type | Use Case |
|------|----------|
| B-tree (default) | Equality, range, sorting |
| Hash | Equality only (rare) |
| GIN | JSONB, arrays, full-text |
| GiST | Geospatial, range types |
| BRIN | Very large tables, sequential data |

**Index Maintenance:**
- Monitor `pg_stat_user_indexes` for unused indexes
- `REINDEX CONCURRENTLY` for bloat
- `pg_stat_clear_snapshot()` after bulk loads

### 7. JSONB Usage Guidelines

**When to Use:**
- Sparse attributes (many optional fields)
- Schema varies by type (polymorphic data)
- Rapid prototyping before schema stabilization
- External API responses (store raw)

**When NOT to Use:**
- Core domain attributes (query, index, constraint)
- Frequently filtered/sorted columns
- Data requiring referential integrity
- When schema is stable and known

**JSONB Best Practices:**
```sql
-- Always define structure in application, not DB
-- Use CHECK constraints for required keys
ALTER TABLE users ADD CONSTRAINT chk_profile_keys
CHECK (profile ? 'name' AND profile ? 'avatar_url');

-- GIN index for query performance
CREATE INDEX idx_users_profile_gin ON users USING GIN (profile);

-- Extract to columns when query patterns stabilize
ALTER TABLE users ADD COLUMN display_name TEXT
GENERATED ALWAYS AS (profile->>'name') STORED;
```

### 8. Migration Strategy

**Migration Principles:**
1. **Backward Compatible** — Add columns nullable, no DROP COLUMN without deprecation
2. **Reversible** — Every migration has DOWN or documented rollback
3. **Zero-Downtime** — Expand-contract pattern for breaking changes
4. **Tested** — Run against production-size data copy
5. **Reviewed** — Schema diff in PR, DBA review for risky changes

**Expand-Contract Pattern:**
```
Phase 1 (Expand):  Add new column, dual-write, backfill
Phase 2 (Migrate): Switch reads to new column
Phase 3 (Contract): Remove old column, cleanup
```

**Migration Checklist:**
- [ ] `UP` migration tested on staging
- [ ] `DOWN` migration tested (or rollback plan documented)
- [ ] Lock timeout set (`SET lock_timeout = '5s'`)
- [ ] No long-running transactions
- [ ] Large table changes batched
- [ ] Index creation `CONCURRENTLY` (PostgreSQL 12+)
- [ ] Rollback plan communicated to team

### 9. Multi-Tenancy Patterns

| Pattern | Implementation | Isolation | Complexity |
|---------|----------------|-----------|------------|
| **Shared Schema + RLS** | `tenant_id` column, Row Level Security | Logical | Low |
| **Schema per Tenant** | Separate schema, shared app | Strong | Medium |
| **Database per Tenant** | Separate DB, connection pooling | Complete | High |
| **Hybrid** | Shared for most, dedicated for large | Flexible | High |

**RLS Implementation (PostgreSQL):**
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Set per request in middleware
SET LOCAL app.current_tenant = 'tenant-uuid';
```

### 10. Data Lifecycle & Retention

| Data Type | Retention | Archive Strategy | Deletion |
|-----------|-----------|------------------|----------|
| **Transactional** | 7 years (legal) | Partition by year, move to cold storage | GDPR/legal request |
| **Analytics** | 2 years | Aggregate, downsample | Auto-delete |
| **Logs/Audit** | 1-3 years | Compress, S3/Blob storage | Auto-delete |
| **Session/Cache** | TTL (hours-days) | N/A | Auto-expiry |
| **PII** | Minimal necessary | Encrypt at rest | Right to erasure |

### 11. Backup & Recovery

| Requirement | Target | Verification |
|-------------|--------|--------------|
| **RPO (Recovery Point Objective)** | < 1 hour | Continuous archiving (WAL) |
| **RTO (Recovery Time Objective)** | < 4 hours | Quarterly restore drill |
| **Encryption** | AES-256 | Keys separate from data |
| **Cross-Region** | 1+ replica in different region | Failover test annually |
| **Point-in-Time Recovery** | Any second in retention window | `pg_basebackup` + WAL replay |

### Data Architecture Checklist

- [ ] Data ownership assigned per entity
- [ ] Naming conventions documented and enforced
- [ ] Required columns on all tables
- [ ] Constraints at database level (not just application)
- [ ] Indexing strategy for query patterns
- [ ] JSONB usage justified and constrained
- [ ] Migration process: backward compatible, reversible, tested
- [ ] Multi-tenancy pattern chosen and implemented
- [ ] Retention policies defined per data type
- [ ] Backup/RPO/RTO defined and tested
- [ ] PII identified, encrypted, deletable
- [ ] Audit trail for sensitive changes