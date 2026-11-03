# API & Integration Review Reference

## API Contract Quality

### 1. Contract Definition

| Format | Validation | Tooling |
|--------|------------|---------|
| OpenAPI 3.x | Schema validation, examples | `speccy`, `swagger-codegen` |
| GraphQL | SDL validation, introspection | `graphql-schema-linter` |
| tRPC | Type-safe, inferred | TypeScript compiler |
| gRPC | Protobuf, buf lint | `buf lint`, `buf breaking` |
| AsyncAPI | Event schemas | `asyncapi` validator |

### 2. Contract Completeness Checklist

| Element | Required | Verification |
|---------|----------|--------------|
| Path/Operation | Yes | All endpoints documented |
| Parameters | Yes | Path, query, header, cookie |
| Request Body | Yes | Schema + examples |
| Responses | Yes | All status codes (2xx, 4xx, 5xx) |
| Error Schema | Yes | Consistent error format |
| Authentication | Yes | Security schemes defined |
| Rate Limits | Recommended | Headers documented |
| Pagination | If applicable | Cursor/offset, limits |
| Versioning | Yes | Strategy documented |

### 3. Request Validation

| Layer | Responsibility |
|-------|----------------|
| Gateway/WAF | Size limits, known attacks, rate limit |
| Framework | Schema validation (Zod, Pydantic, class-validator) |
| Handler | Business rule validation, authorization |
| Database | Constraints (last line) |

**Validation Failures Must Return:**
- `400 Bad Request` — malformed request
- `422 Unprocessable Entity` — valid syntax, invalid semantics
- Consistent error format: `{ code, message, field?, details? }`

## REST API Design

### Resource Modeling

| Principle | Good | Bad |
|-----------|------|-----|
| Nouns not verbs | `/users`, `/orders` | `/getUsers`, `/createOrder` |
| Plural collections | `/users/123` | `/user/123` |
| Hierarchical for relationships | `/users/123/orders` | `/orders?userId=123` |
| Non-hierarchical for independent | `/orders?status=open` | `/orders/open` |

### HTTP Semantics

| Method | Idempotent | Safe | Use Case |
|--------|------------|------|----------|
| GET | Yes | Yes | Retrieve |
| HEAD | Yes | Yes | Metadata only |
| POST | No | No | Create, complex ops |
| PUT | Yes | No | Full replace |
| PATCH | No* | No | Partial update |
| DELETE | Yes | No | Remove |
| OPTIONS | Yes | Yes | Discover |

*PATCH can be idempotent with proper semantics

### Status Codes

| Category | Codes | Usage |
|----------|-------|-------|
| 2xx Success | 200, 201, 204 | Standard |
| 3xx Redirect | 301, 302, 304 | Rare in APIs |
| 4xx Client Error | 400, 401, 403, 404, 409, 422, 429 | Specific |
| 5xx Server Error | 500, 502, 503, 504 | Generic, log details |

**Never:** 200 for errors, 404 for auth failures (use 401/403)

## API Versioning

| Strategy | Pros | Cons |
|----------|------|------|
| URL path (`/v1/`) | Explicit, cacheable | URL changes |
| Header (`Accept: application/vnd.api.v1+json`) | Clean URLs | Less visible |
| Query param (`?version=1`) | Simple | Caching issues |
| Media type | Most RESTful | Complex clients |

**Recommendation:** URL path for major versions, header for minor

## Pagination

| Style | Response | Use Case |
|-------|----------|----------|
| Cursor | `{ data, next_cursor, has_more }` | Large datasets, real-time |
| Offset/Limit | `{ data, total, page, per_page }` | Small datasets, UI pagination |
| Keyset | `WHERE id > last_id ORDER BY id LIMIT n` | High performance, ordered |

**Always:** Document max page size, default page size

## Error Handling

### Standard Error Format

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

### Error Code Taxonomy

| Category | Codes |
|----------|-------|
| Auth | `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS` |
| AuthZ | `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`, `RESOURCE_DENIED` |
| Validation | `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_REQUIRED_FIELD` |
| Business | `CONFLICT`, `PRECONDITION_FAILED`, `QUOTA_EXCEEDED` |
| Not Found | `NOT_FOUND`, `RESOURCE_GONE` |
| Rate Limit | `RATE_LIMITED`, `QUOTA_EXCEEDED` |
| Server | `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `GATEWAY_TIMEOUT` |

## Resilience Patterns

### Timeouts

| Call Type | Timeout | Config |
|-----------|---------|--------|
| Internal service | 5-10s | Per-service |
| External API | 10-30s | Per-provider |
| Database | 3-5s | Query-specific |
| Long-running | Async + polling/webhook | Not sync |

### Retry Strategy

| Scenario | Strategy |
|----------|----------|
| Idempotent GET | Exponential backoff, 3 retries, jitter |
| Idempotent PUT/DELETE | Same |
| Non-idempotent POST | **Never auto-retry** — idempotency key required |
| Transient errors (5xx, timeout, network) | Retry |
| Permanent errors (4xx except 429) | **Never retry** |

### Circuit Breaker

| State | Behavior |
|-------|----------|
| Closed | Normal operation, count failures |
| Open | Fail fast, return fallback/error |
| Half-open | Probe with limited requests |

**Config:** Failure threshold (50%), timeout (60s), probe requests (3)

### Bulkhead

- Separate connection pools per downstream service
- Thread pool isolation for CPU-bound work
- Queue depth limits with rejection

## Integration Testing

| Test Type | Scope | Tooling |
|-----------|-------|---------|
| Contract | Provider/consumer match | Pact, Spring Cloud Contract |
| Schema | Request/response match OpenAPI | `swagger-codegen` validate |
| E2E | Full flow | Postman, Playwright, custom |
| Chaos | Failure injection | Chaos Mesh, Litmus, Gremlin |
| Load | Performance under load | k6, Locust, Artillery |

## API Scorecard

| Dimension | Weight | Score | Evidence |
|-----------|--------|-------|----------|
| Contract Quality | 20% | | Complete, validated, versioned |
| REST/Design | 15% | | Nouns, semantics, status codes |
| Validation | 15% | | Layers, error format, codes |
| Versioning | 10% | | Strategy, backward compat |
| Resilience | 20% | | Timeouts, retry, circuit breaker |
| Documentation | 10% | | Examples, guides, changelog |
| Testing | 10% | | Contract, E2E, load |

## Investigation Checklist

- [ ] OpenAPI/GraphQL schema — valid, complete, examples?
- [ ] Run contract tests — provider matches consumer expectations?
- [ ] Test error format — consistent across all endpoints?
- [ ] Test auth — 401 vs 403 correct? Token refresh works?
- [ ] Test validation — 400 for malformed, 422 for semantic?
- [ ] Test pagination — cursor works? max limit enforced?
- [ ] Test rate limiting — headers present? 429 on exceed?
- [ ] Test timeouts — external calls have limits?
- [ ] Test retries — idempotent only? idempotency keys for POST?
- [ ] Test circuit breaker — fails fast after threshold?
- [ ] Check versioning — breaking changes versioned? deprecation policy?
- [ ] Review webhook security — signatures, replay protection?
- [ ] Check CORS — not wildcard with credentials?
- [ ] Verify API keys — scoped, rotatable, revocable?