# API and Integration Design Reference

## API Design Principles

### 1. API Style Selection

| Style | Best For | Trade-offs |
|-------|----------|------------|
| **REST** | CRUD, resources, wide compatibility | Over-fetching, multiple round trips |
| **GraphQL** | Complex queries, multiple clients, federation | Complexity, caching, N+1 risk |
| **gRPC** | High-performance internal, streaming | Browser support, debugging |
| **tRPC** | TypeScript monorepo, type safety | TS-only, no schema registry |
| **Async/Events** | Decoupling, workflows, notifications | Eventual consistency, debugging |

**Decision Matrix:**
- External consumers → REST (OpenAPI)
- Internal service-to-service → gRPC or tRPC
- Complex UI queries → GraphQL or REST + query params
- Background workflows → Async events

### 2. REST API Design Standards

**Resource Modeling:**
- Nouns, not verbs: `/users`, `/orders`, not `/getUsers`
- Plural collections: `/users/123`, not `/user/123`
- Hierarchical for ownership: `/users/123/orders`
- Flat for independent: `/orders?userId=123&status=open`

**HTTP Semantics:**
| Method | Idempotent | Safe | Use Case |
|--------|------------|------|----------|
| GET | Yes | Yes | Retrieve |
| HEAD | Yes | Yes | Metadata |
| POST | No | No | Create, complex operations |
| PUT | Yes | No | Full replace |
| PATCH | No* | No | Partial update |
| DELETE | Yes | No | Remove |
| OPTIONS | Yes | Yes | Discover |

*PATCH can be idempotent with proper semantics (JSON Merge Patch)

**Status Codes:**
- 200 OK — Success with body
- 201 Created — Resource created (Location header)
- 204 No Content — Success, no body
- 400 Bad Request — Malformed request
- 401 Unauthorized — Missing/invalid auth
- 403 Forbidden — Auth valid, insufficient permissions
- 404 Not Found — Resource doesn't exist
- 409 Conflict — Business rule violation
- 422 Unprocessable Entity — Valid syntax, invalid semantics
- 429 Too Many Requests — Rate limited
- 500 Internal Server Error — Unexpected failure
- 503 Service Unavailable — Temporary overload

**Never:** 200 for errors, 404 for auth failures

### 3. Request/Response Standards

**Request Validation Layers:**
1. Gateway/WAF — Size limits, known attacks, rate limit
2. Framework — Schema validation (Zod, Pydantic, class-validator)
3. Handler — Business rules, authorization
4. Database — Constraints (last line)

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "status": 422,
    "details": [
      { "field": "email", "code": "INVALID_FORMAT", "message": "Invalid email" }
    ],
    "request_id": "req_abc123"
  }
}
```

**Error Code Taxonomy:**
| Category | Codes |
|----------|-------|
| Auth | `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS` |
| AuthZ | `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`, `RESOURCE_DENIED` |
| Validation | `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_REQUIRED_FIELD` |
| Business | `CONFLICT`, `PRECONDITION_FAILED`, `QUOTA_EXCEEDED` |
| Not Found | `NOT_FOUND`, `RESOURCE_GONE` |
| Rate Limit | `RATE_LIMITED`, `QUOTA_EXCEEDED` |
| Server | `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `GATEWAY_TIMEOUT` |

### 4. API Versioning

**Strategies:**
| Strategy | Pros | Cons |
|----------|------|------|
| URL Path (`/v1/`) | Explicit, cacheable | URL changes |
| Header (`Accept: application/vnd.api.v1+json`) | Clean URLs | Less visible |
| Query Param (`?version=1`) | Simple | Caching issues |

**Recommendation:** URL path for major versions, header for minor

**Versioning Rules:**
- Major version = breaking changes
- Minor version = backward-compatible additions
- Deprecation: 6-month notice, sunset header
- Never break existing versions

### 5. Pagination

| Style | Response | Use Case |
|-------|----------|----------|
| Cursor | `{ data, next_cursor, has_more }` | Large datasets, real-time |
| Offset/Limit | `{ data, total, page, per_page }` | Small datasets, UI pagination |
| Keyset | `WHERE id > last_id ORDER BY id LIMIT n` | High performance, ordered |

**Standards:**
- Default page size: 20
- Max page size: 100 (configurable per endpoint)
- Always include total count for offset pagination
- Cursor must be opaque, versioned

### 6. Resilience Patterns

**Timeouts:**
| Call Type | Timeout | Configuration |
|-----------|---------|---------------|
| Internal service | 5-10s | Per-service |
| External API | 10-30s | Per-provider |
| Database | 3-5s | Query-specific |
| Long-running | Async + polling/webhook | Not sync |

**Retry Strategy:**
| Scenario | Strategy |
|----------|----------|
| Idempotent GET | Exponential backoff, 3 retries, jitter |
| Idempotent PUT/DELETE | Same |
| Non-idempotent POST | **Never auto-retry** — idempotency key required |
| Transient errors (5xx, timeout, network) | Retry |
| Permanent errors (4xx except 429) | **Never retry** |

**Circuit Breaker:**
| State | Behavior |
|-------|----------|
| Closed | Normal operation, count failures |
| Open | Fail fast, return fallback/error |
| Half-open | Probe with limited requests |

Config: Failure threshold (50%), timeout (60s), probe requests (3)

### 7. Integration Patterns

**API Gateway Responsibilities:**
- Authentication (JWT validation, API keys)
- Rate limiting (per-client, per-endpoint)
- Request/response transformation
- Protocol translation (REST ↔ gRPC)
- Observability (logging, metrics, tracing)

**Service-to-Service Auth:**
- mTLS for service mesh
- Short-lived JWT with service identity
- Header-based for simpler setups

**Webhook Security:**
- Signature verification (HMAC-SHA256)
- Replay protection (timestamp + nonce)
- Idempotency keys for processing

**Event Integration:**
- Schema registry (Avro, Protobuf, JSON Schema)
- Consumer-driven contracts (Pact)
- Dead letter queue for failed deliveries
- At-least-once delivery, idempotent consumers

### 8. API Documentation

**Required Artifacts:**
- OpenAPI 3.x spec (machine-readable)
- Human-readable reference (Redoc, Scalar)
- Getting started guide
- Authentication guide
- Error code reference
- Rate limit documentation
- Changelog
- SDKs/client libraries (if provided)

**OpenAPI Quality Checklist:**
- [ ] All endpoints documented
- [ ] All parameters (path, query, header, cookie)
- [ ] Request bodies with schemas + examples
- [ ] All response codes (2xx, 4xx, 5xx)
- [ ] Error schemas with examples
- [ ] Security schemes defined
- [ ] Servers configured
- [ ] Tags for grouping
- [ ] Deprecated fields marked
- [ ] Examples for complex objects

### API Design Checklist

- [ ] API style chosen and justified
- [ ] Resource modeling follows REST conventions
- [ ] HTTP semantics correct (methods, status codes)
- [ ] Request validation at all layers
- [ ] Error format consistent across all endpoints
- [ ] Versioning strategy defined
- [ ] Pagination implemented for all collections
- [ ] Resilience patterns: timeouts, retries, circuit breakers
- [ ] Integration security: auth, webhooks, events
- [ ] OpenAPI spec complete and validated
- [ ] Documentation published and current
- [ ] Contract tests for consumer/provider
- [ ] Rate limiting configured and documented
- [ ] Idempotency for non-GET operations