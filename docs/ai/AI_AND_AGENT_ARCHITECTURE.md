# AI and Agent Architecture

**Status: PROPOSED.** AI is a bounded capability in one product, not a separate authority or application.

## Ownership and boundary

`ql_ai` owns provider configuration, model/tool capability policy, invocation audit and usage controls. `ql_chat` owns conversation/message records. A user-facing fictional persona belongs to `ql_character`; executable prompt/tool configuration belongs to `ql_ai`. API authenticates, validates and calls the addon service; web uses `moonClient` only.

## Provider secrets

Provider keys are private fields, encrypted at rest before persistence, write-only on update, and never returned after receipt. They are excluded from metadata, CRUD projections, logs, traces, error messages and browser state. Enforce owner/admin scope for server-side internal access. Rotate/revoke support and key management are open design items.

## Tool and write policy

- Explicit allowlist per task, principal and environment.
- Read operations are owner/ACL scoped; no unrestricted shell, network, or database tools from product agent context.
- Canonical writes require a user-authorized use case and domain validation; sensitive publication requires human review.
- No silent writes, no hidden delegation or privilege escalation.
- AI cannot declare theological or historical final truth.
- Retain source references, model/provider/version, prompt/template version, tool calls, actor and outcome according to a privacy-minimized audit policy.

## Failure and safety

Bound time, tokens, retries and spend; handle provider outage, refusal, malformed output, prompt injection and tool error. Treat retrieved text as untrusted input. Avoid logging raw secrets/private user content. Do not promise deterministic outputs or exactly-once side effects. Evaluation sets must include source-grounding, access-control, refusal, private-data leakage and regression checks.

## Current local evidence

`ql_ai` addon exists, but provider route/service and encrypted key handling are in API-side code. Provider keys are AES-256-GCM encrypted there and the field is private in model metadata. This is partial implementation; relocate business behavior to addon/runtime boundary and add private-field, owner-scope and internal service tests before expanding.
