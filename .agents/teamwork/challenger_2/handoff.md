# Empirical Adversarial Challenge Report: Data Schemas & Security Models

**Agent ID**: `challenger_2`  
**Working Directory**: `z:\project\moonstranaut\.agents\teamwork\challenger_2`  
**Parent Conversation ID**: `15ce11f1-e3a8-45f6-959a-ed89d1ed23fb`  
**Target Artifact**: `C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md`  
**Overall Risk Assessment**: **HIGH**  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

Direct empirical observations from `plan_30_grand_strategic_tracks.md` compared against `packages/ql-orm/src/index.ts` and `packages/moonclient/src/index.ts`:

### 1.1 QlOrm Schema & Field Type Compliance
- **AST Scan Result (`scripts/verify_plan.js`)**: All 35 declared `QlModelDefinition` models across Tracks 01–30 strictly use the permitted scalar types (`char`, `text`, `integer`, `boolean`, `datetime`).
- **Absence of Forbidden `id` Field**: 0 of 35 models declare an explicit `id` field inside `fields`, adhering to QlOrm's automatic primary key generation (`"id" TEXT PRIMARY KEY NOT NULL` in `packages/ql-orm/src/index.ts:935`).
- **Naming Conventions**: All 35 models adhere to two-tier `domain.entity` naming (`/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/`) and valid SQL table identifiers (`/^[a-z][a-z0-9_]*$/`).
- **Verbatim Defect — `selectionKeys` Array Type Violation**:
  In `packages/ql-orm/src/index.ts:27-28`:
  ```typescript
  export interface QlFieldDefinition {
    selectionKeys?: Record<string, string>;
    options?: readonly string[];
  ```
  However, in 5 separate models across the plan, `selectionKeys` is assigned a string array `string[]`:
  - **Track 21** (`telemetry.metric_snapshot`, line 5255): `selectionKeys: ["healthy", "degraded", "critical"]`
  - **Track 22** (`i18n.catalog_sync_log`, line 5495): `selectionKeys: ["passed", "synced", "failed"]`
  - **Track 24** (`studio.export_job`, lines 5934 & 5940): `selectionKeys: ["pdf", "markdown", "json"]` and `selectionKeys: ["queued", "processing", "ready", "failed"]`
  - **Track 26** (`base.movement_engagement`, lines 6386 & 6398): `selectionKeys: ["hero_arrival", ...]` and `selectionKeys: ["brief", "reading", "contemplative"]`
  - **Track 30** (`system.e2e_run_record`, line 7229): `selectionKeys: ["chromium", "firefox", "webkit"]`
  *Compiler output from `node scripts/typecheck_plan_models.js`*:
  `Type 'string[]' is not assignable to type 'Record<string, string>'. Index signature for type 'string' is missing in type 'string[]'.`

### 1.2 Multi-Tenant Isolation & Collaborative Visibility Conflict
- **QlOrm Query Engine Invariant (`packages/ql-orm/src/index.ts:1118-1120`)**:
  ```typescript
  if (model.ownerField) {
    conditions.push(
      `${quoteIdentifier(model.ownerField)} = ${sql.param(user.id)}`,
    );
  }
  ```
- **Track 18 (`community.study_circle`, line 4541 & `community.circle_reflection`, line 4590)**:
  `community.study_circle` defines `ownerField: "facilitator_id"`.
  `community.circle_reflection` defines `ownerField: "author_id"`.
  Track 18 states in ACL comment (line 4645):
  `read: true, // QlOrm query filter automatically enforces status='approved' for non-authors`
  However, `packages/ql-orm/src/index.ts` contains NO status-based filter in `findMany`. Any query by a non-author executing `findMany("community.circle_reflection", user)` produces `WHERE "author_id" = user.id`, returning 0 records for approved reflections written by other members.
- **Track 19 (`community.beneficial_deed`, line 4829)**:
  Track 19 specifies a *"dignified, non-gamified public ledger recording verified beneficial deeds across the MoonWitness platform"* accessed via `/community/deeds-ledger`.
  However, `community.beneficial_deed` declares `ownerField: "actor_id"`. As a result, `findMany` filters `WHERE "actor_id" = user.id`, rendering deeds by other contributors invisible to the user.
- **Track 16 (`workflow.covenant_signature`, line 4017)**:
  Specifies a `CovenantLedgerTable` to show public verified signers, but defines `ownerField: "owner_id"`. Queries by user `A` only return user `A`'s signature.

### 1.3 Service Query Signature Mismatch (Runtime Crash)
- In Track 17 (`submitPeerReviewForService`, lines 4330–4353):
  ```typescript
  const [change] = await orm.findManyByService("workflow.change", {
    filter: { id: changeId },
    limit: 1,
  });
  const reviews = await orm.findManyByService("workflow.peer_review", {
    filter: { change_id: changeId, decision: "approved" },
  });
  ```
  In `packages/ql-orm/src/index.ts:1365`:
  ```typescript
  async findManyByService(
    modelName: string,
    filters: Record<string, QlServiceValue>,
    options: QlServiceQueryOptions = {},
  ): Promise<QlRecord[]>
  ```
  And line 1376:
  ```typescript
  if (name !== "id" && !model.fields[name]) {
    throw new QlValidationError(`Unknown field '${name}' on model '${modelName}'.`);
  }
  ```
  Because the object `{ filter: { ... }, limit: 1 }` is passed as the 2nd parameter, QlOrm checks `model.fields["filter"]`, which does not exist, throwing a runtime `QlValidationError`.

### 1.4 MoonClient SDK Contracts & SSRF Vectors
- **Track 24 Binary Response Bug (line 6012)**:
  `moonClient.exportResearchArtifact` calls:
  ```typescript
  const response = await this.rawRequest(apiRoutes.research.export(input.format), ...);
  return response.blob();
  ```
  `rawRequest` does not exist on `MoonClient` in `packages/moonclient/src/index.ts`. Furthermore, `MoonClient.request()` unconditionally runs `JSON.parse(await response.text())`, which throws when an endpoint returns an `application/pdf` binary stream.
- **Track 07 SSRF Vector (`ai.provider_mesh_config`, line 1849 & 1927)**:
  `endpoint_url` is declared with `maxLength: 512` without protocol constraints (`https:`) or private/loopback IP validation.
  Additionally, ACL grants `viewer: read: true` on `ai.provider_mesh_config` (line 1927), exposing all backend AI inference endpoint URLs to unauthenticated anonymous visitors.

---

## 2. Logic Chain

```
[Observation 1.1: selectionKeys assigned string[]]
   └──> QlOrm QlFieldDefinition requires selectionKeys?: Record<string, string>
   └──> tsc compiler fails with type mismatch
   └──> CONCLUSION: Compile-time typecheck gate fails on 5 models.

[Observation 1.2: ownerField applied to collaborative/public models]
   └──> QlOrm findMany() unconditionally appends WHERE ownerField = user.id
   └──> QlOrm has no "status='approved' bypass" for ownerField
   └──> Study circle members cannot view circles or approved reflections by peers
   └──> Public visitors cannot view beneficial deeds or covenant signatures
   └──> CONCLUSION: Multi-tenant isolation model is architecturally misapplied to shared records.

[Observation 1.3: findManyByService passed { filter: ... }]
   └──> QlOrm findManyByService expects filters directly as 2nd argument: Record<string, QlServiceValue>
   └──> QlOrm iterates object keys and validates each against model.fields
   └──> model.fields["filter"] does not exist
   └──> QlOrm throws QlValidationError at runtime
   └──> CONCLUSION: Sanad peer review pipeline crashes during quorum evaluation.

[Observation 1.4: MoonClient calls nonexistent rawRequest & JSON.parse on PDF]
   └──> MoonClient only exports request<T> which executes JSON.parse()
   └──> Binary PDF payloads cause JSON.parse to throw MoonClientError
   └──> CONCLUSION: Studio Multi-Format Exporter fails in production browser runtime.
```

---

## 3. Challenges & Attack Scenarios

### [Critical] Challenge 1: Collaborative Data Blindness via `ownerField` Misapplication
- **Assumption Challenged**: That setting `ownerField: "author_id"` on `community.circle_reflection` and `ownerField: "actor_id"` on `community.beneficial_deed` safely isolates records while allowing public/shared reads.
- **Attack / Failure Scenario**: User B submits a reflection in a study circle. Facilitator approves it. User A opens the study circle. The browser invokes `moonClient.getCircleReflections(circleId)`, which routes to QlOrm `findMany`. QlOrm injects `WHERE author_id = userA.id`. User A receives an empty array and cannot see User B's approved reflection. Similarly, public visitors browsing `/community/deeds-ledger` receive 0 records.
- **Blast Radius**: Core collaborative features (Tracks 16, 18, 19) are completely broken for non-authors.
- **Mitigation**:
  1. For `community.study_circle`: Remove `ownerField` so all users with `read: true` can list active circles; isolate write/update operations to facilitators via server-side service methods (`updateRecordsForService`).
  2. For `community.circle_reflection`: Remove `ownerField` from the stored model, OR declare a `QlComputedModelDefinition` (`community.public_reflection`) that queries approved reflections via service and projects them without author private data.
  3. For `community.beneficial_deed`: Remove `ownerField` from the public entity, using server service emitters to append deeds.

### [High] Challenge 2: Runtime Crash in Sanad Pipeline Quorum Evaluation
- **Assumption Challenged**: That `orm.findManyByService` accepts a Knex/Mongoose-style `{ filter: { ... }, limit: 1 }` envelope.
- **Attack / Failure Scenario**: A scholar submits a peer review via `submitPeerReviewForService`. The function executes:
  `await orm.findManyByService("workflow.change", { filter: { id: changeId }, limit: 1 })`.
  QlOrm's schema validator immediately throws `QlValidationError: Unknown field 'filter' on model 'workflow.change'`. The entire transaction aborts with HTTP 500; the review is never recorded and quorum is never reached.
- **Blast Radius**: Complete halt of the Sanad peer-review publication pipeline (Track 17).
- **Mitigation**:
  Correct the call signature in Track 17 to:
  ```typescript
  const [change] = await orm.findManyByService("workflow.change", { id: changeId }, { limit: 1 });
  const reviews = await orm.findManyByService("workflow.peer_review", { change_id: changeId, decision: "approved" });
  ```

### [High] Challenge 3: TypeScript Typecheck Gate Failure via `selectionKeys: string[]`
- **Assumption Challenged**: That `selectionKeys` in `QlModelDefinition` accepts an array of strings.
- **Attack / Failure Scenario**: When developer builds `packages/ql_*`, `tsc --noEmit` runs. TypeScript flags 7 properties across 5 files: `Type 'string[]' is not assignable to type 'Record<string, string>'`. The CI pipeline `pnpm run typecheck` fails.
- **Blast Radius**: Build gate in `.github/workflows/ci.yml` is blocked.
- **Mitigation**:
  Replace `selectionKeys: ["a", "b"]` with `options: ["a", "b"]` (or a dictionary `selectionKeys: { a: "key.a", b: "key.b" }`) in Tracks 21, 22, 24, 26, 30.

### [Medium] Challenge 4: SSRF Vector & Anonymous Reconnaissance on AI Mesh
- **Assumption Challenged**: That storing arbitrary URLs in `ai.provider_mesh_config.endpoint_url` with viewer read access is safe.
- **Attack / Failure Scenario**: An attacker inspects `GET /api/models/ai.provider_mesh_config` as an unauthenticated viewer (permitted by Track 07 ACL). The attacker discovers all internal and upstream provider endpoints. If an internal operator configures a private VPC or loopback endpoint (`http://169.254.169.254/` or `http://localhost:8080`), the server's failover circuit breaker sends HTTP requests containing the API key to that endpoint, resulting in SSRF or secret exfiltration.
- **Blast Radius**: Internal infrastructure discovery and potential SSRF.
- **Mitigation**:
  1. Restrict `ai.provider_mesh_config` ACL: change `group: "viewer", read: true` to `read: false`.
  2. In the AI provider mesh service, enforce strict URL parsing: protocol MUST be `https:`, and hostname MUST NOT resolve to private, loopback, or cloud-metadata IP ranges.

### [Medium] Challenge 5: MoonClient Inability to Stream Binary Artifacts
- **Assumption Challenged**: That `MoonClient.exportResearchArtifact` can invoke `this.rawRequest` and return a `Blob`.
- **Attack / Failure Scenario**: User clicks "Export PDF" in the UI. `moonClient.exportResearchArtifact` executes `this.rawRequest(...)`. In TypeScript and JavaScript runtime, `this.rawRequest is not a function` error is thrown. If rewritten to use `this.request`, `JSON.parse` crashes on the PDF binary stream.
- **Blast Radius**: Track 24 export feature is non-functional in the browser.
- **Mitigation**:
  Add `public async requestBlob(path: string, options?: ...): Promise<Blob>` to `MoonClient` in `packages/moonclient/src/index.ts`.

---

## 4. Stress Test Results Summary

| Test Scenario | Target | Expected Behavior | Observed / Predicted Behavior | Result |
|---|---|---|---|---|
| **ST-01: AST Schema Field Types** | All 35 Models | Only `char, text, integer, boolean, datetime` | Permitted scalar types only. No forbidden `id` fields. | **PASS** |
| **ST-02: QlOrm Typecheck Gate** | 35 Models against `QlModelDefinition` | Zero TypeScript compile errors | 7 errors: `string[]` assigned to `selectionKeys: Record<string, string>` | **FAIL** |
| **ST-03: Peer Review Service Query** | Track 17 `submitPeerReviewForService` | Clean query execution & quorum check | Crashes: `QlValidationError: Unknown field 'filter'` | **FAIL** |
| **ST-04: Multi-Tenant Circle Isolation** | Track 18 `community.circle_reflection` | Members can read approved peer reflections | Blocked: `ownerField` filters out all peer reflections | **FAIL** |
| **ST-05: Public Deeds Ledger Access** | Track 19 `community.beneficial_deed` | Public can browse verified deeds | Blocked: `ownerField` forces user-only filter; viewers denied | **FAIL** |
| **ST-06: MoonClient Binary PDF Stream** | Track 24 `exportResearchArtifact` | Downloads PDF binary blob | Runtime error: `this.rawRequest is not a function` | **FAIL** |
| **ST-07: Route Parameter Encoding** | Tracks 01–30 `apiRoutes` | All parameters URI-encoded | 17/17 parameterized routes use `segment` or `encodeURIComponent` | **PASS** |
| **ST-08: AI Mesh Infrastructure Privacy** | Track 07 `ai.provider_mesh_config` | Internal endpoints hidden from public | Leak: `viewer: read: true` exposes all endpoint URLs | **FAIL** |

---

## 5. Caveats
- No runtime database connection to Postgres was established during this phase; verification was executed against QlOrm's authoritative TypeScript runtime source (`packages/ql-orm/src/index.ts`) using the TypeScript 5.9 AST compiler.
- Realtime SSE / WebSocket streaming telemetry was reviewed at the API contract layer, but socket socket connection saturation was not benchmarked.

---

## 6. Conclusion & Verdict

**Verdict**: **REQUEST_CHANGES**

The specification exhibits exemplary adherence to core QlOrm primitives (100% compliance on permitted scalar types and zero forbidden `id` fields) and rigorous route parameter encoding. However, it cannot be approved in its current state due to four critical flaws:
1. **Compile-time schema defect**: 5 models assign `string[]` to `selectionKeys`, causing TypeScript compilation failures.
2. **Multi-tenant isolation conflict**: Applying `ownerField` to collaborative and public entities (`study_circle`, `circle_reflection`, `beneficial_deed`, `covenant_signature`) mathematically breaks cross-user visibility.
3. **Runtime service crash**: `findManyByService` in Track 17 uses an invalid parameter envelope (`{ filter: ... }`), throwing runtime errors.
4. **MoonClient binary streaming omission**: Track 24 relies on a nonexistent `rawRequest` method and fails on binary PDF streams.

The specification must be updated with the mitigations detailed above before implementation begins.

---

## 7. Verification Method

To independently reproduce and verify all findings empirically:

```powershell
# 1. Verify schema AST, permitted types, and absence of 'id' fields:
node z:\project\moonstranaut\scripts\verify_plan.js

# 2. Reproduce TypeScript compiler errors on selectionKeys:
node z:\project\moonstranaut\scripts\find_selection_keys.js
node z:\project\moonstranaut\scripts\typecheck_plan_models.js

# 3. Verify complete ACL coverage across all 35 models:
node z:\project\moonstranaut\scripts\verify_acls.js

# 4. Verify route parameter encoding:
node z:\project\moonstranaut\scripts\verify_routes.js
```
