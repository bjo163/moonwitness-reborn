# Standard Operations Runbook: Backup, Restore, Deployment & Disaster Recovery

> **Document Version:** 1.0.0  
> **Target Release:** MoonWitness v0.2.0+  
> **Status:** Standard Operating Procedure (SOP)  
> **Task References:** [MW-1110](https://github.com/bjo163/moonwitness-reborn/issues/84), [MW-1111](https://github.com/bjo163/moonwitness-reborn/issues/85), [MW-1112](https://github.com/bjo163/moonwitness-reborn/issues/86), [MW-1113](https://github.com/bjo163/moonwitness-reborn/issues/87)

---

## 1. Overview & Architecture

MoonWitness operates with a microservice/container model coordinated via `docker-compose.yml`:
- **Web App (`apps/web`):** Next.js 15 UI on port `3030:3001` (loopback).
- **API Server (`apps/api`):** Fastify HTTP server on port `3000:3000` (loopback).
- **Database (`postgres:16-alpine`):** PostgreSQL on port `5434:5432` (loopback) with persistent volume `postgres_data`.
- **API Data Volume:** `api_data` mounted at `/app/data` for local state.

---

## 2. Docker Deployment Procedure (MW-1112)

### A. Prerequisites
- Docker Engine 24.0+ & Docker Compose v2.20+.
- Ports `3000`, `3030`, and `5434` free on the host.

### B. Clean Deployment Steps
```bash
# 1. Clone repository and verify exact commit SHA
git checkout dev # or release tag v0.2.0

# 2. Build and launch services in detached mode
docker compose up --build -d

# 3. Verify health status of all containers
docker compose ps
```

### C. Healthcheck Verification
- **API Health:** `curl -f http://127.0.0.1:3000/health` $\rightarrow$ returns HTTP 200 `{ "status": "ok" }`.
- **Web Health:** `curl -f http://127.0.0.1:3030/` $\rightarrow$ returns HTTP 200 HTML.
- **Postgres Health:** Evaluated automatically by `pg_isready -U moonwitness -d moonwitness`.

---

## 3. Persistent Data Backup Procedure (MW-1110)

### A. Database Backup (`pg_dump`)
```bash
# Export custom-format PostgreSQL dump
docker compose exec postgres pg_dump -U moonwitness -d moonwitness -Fc -f /tmp/moonwitness_backup.dump

# Copy backup dump archive to host safe storage
docker compose cp postgres:/tmp/moonwitness_backup.dump ./backups/moonwitness_$(date +%Y%m%d_%H%M%S).dump

# Verify backup archive checksum and integrity
docker compose exec postgres pg_restore --list /tmp/moonwitness_backup.dump > /dev/null
```

### B. Secrets & Sanitization Notice
- Secrets (`PROVIDER_ENCRYPTION_KEY`, tokens) are stored in environment variables, never committed into data dumps.
- Backup files must be stored with permissions `600` (read/write only by system administrator).

---

## 4. Disaster Recovery & Restore Procedure (MW-1111)

### A. Restoring Database in Isolated Environment
```bash
# 1. Stop active API container to prevent live writes
docker compose stop api

# 2. Re-create clean target database
docker compose exec postgres dropdb -U moonwitness --if-exists moonwitness
docker compose exec postgres createdb -U moonwitness moonwitness

# 3. Restore from verified dump archive
docker compose cp ./backups/target_backup.dump postgres:/tmp/restore.dump
docker compose exec postgres pg_restore -U moonwitness -d moonwitness /tmp/restore.dump

# 4. Restart services and synchronize schema
docker compose start api
```

### B. Integrity Verification Post-Restore
Run automated model verification query or health inspect:
```bash
curl -f http://127.0.0.1:3000/health
```

---

## 5. Dependency Failure & Crash Recovery (MW-1113)

### A. Database Injected Disconnection
- **Behavior:** If PostgreSQL is temporarily unreachable, QlOrm connection pool retries with exponential backoff.
- **Fail-Closed Guarantee:** API endpoints immediately reject mutating requests with structured `503 Service Unavailable`, preventing silent data loss or partial writes.

### B. Container Crash & Restart Policy
- All services specify `restart: unless-stopped`. If process termination occurs, Docker daemon automatically restarts the container within 5 seconds.
- Healthcheck retries (`retries: 5`) ensure the API only resumes routing incoming traffic when database connectivity is fully re-established.
