# MoonWitness Backend & Data Architecture Conventions: QlOrm Survey & Specification Guide

## 1. Observation

### 1.1 Architectural Mandates from `AGENTS.md`
- **Location & Technology**: All domain models, persistence schemas, ACL rules, view declarations, and seed data must reside in addon packages matching `packages/ql_*` using TypeScript (`AGENTS.md:3-9`).
- **Strictly Prohibited**: Absolutely NO Drizzle ORM, NO Drizzle schema definitions, and NO migration files (`AGENTS.md:4`). All database tables must be defined as QlOrm models and synchronized automatically by the QlOrm runtime engine (`AGENTS.md:4, 20-22`).
- **Model Naming**: All models must follow the format `domain.entity` (e.g. `corpus.work`, `ai.provider`, `res.partner`, `chat.conversation`) (`AGENTS.md:6`).
- **Security & ACL**: Deny-by-default ACL policy with tenant/user isolation via `ownerField`. Secret/sensitive fields must be marked `private: true`, preventing them from being exposed in metadata DTOs, API CRUD responses, user query results, or logs (`AGENTS.md:20-26`).
- **Data Seeding & Rights**: User data or rights-sensitive content must never be seeded without verified authorization. Seeding policies must explicitly declare `insert_only` or `reconcile` (`AGENTS.md:21`).
- **API Boundary & Transport**: All web client communication uses `@moonwitness/moonclient` via the single `moonClient` instance; API endpoints use shared routes and DTOs from `@moonwitness/moonclient` (`AGENTS.md:7-9`).

### 1.2 QlOrm Engine Architecture (`packages/ql-orm/src/index.ts`)
Inspection of `packages/ql-orm/src/index.ts` reveals the exact runtime interfaces, validation rules, and lifecycle methods:

1. **Primitive Storage Types** (`lines 23-38`, imported from `@moonwitness/types`):
   ```ts
   export type FieldType = "char" | "text" | "integer" | "boolean" | "datetime";
   ```
   - `"char"`: Mapped to SQL `TEXT`. Supports `maxLength`, `required`, `unique`, `default`, `validator`, `options`, `selectionKeys`, `private`.
   - `"text"`: Mapped to SQL `TEXT`. For variable/unbounded text strings or serialized payloads. Supports `maxLength`, `required`, `validator`, `private`.
   - `"integer"`: Mapped to LibSql `INTEGER` or Postgres `BIGINT` (`lines 266-277`). Enforced via `Number.isSafeInteger` (`line 384`). Supports `minValue`, `maxValue`, `required`, `unique`, `default`, `validator`, `private`.
   - `"boolean"`: Mapped to LibSql `INTEGER` (0/1) or Postgres `SMALLINT` (0/1) (`lines 271-272`). Mapped to JavaScript `boolean` at runtime (`lines 1698-1700`). Supports `default`, `required`, `private`.
   - `"datetime"`: Mapped to LibSql `INTEGER` (epoch ms) or Postgres `BIGINT` (epoch ms) (`lines 268-270`). Accepts `Date` or ISO date string; defaults to `Date.now()` on insertion when required (`lines 1262-1264, 1439-1441`).

2. **Model Definition Interface (`QlModelDefinition`)** (`lines 45-53`):
   ```ts
   export interface QlModelDefinition {
     name: string;              // Format: domain.entity (regex: ^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$)
     labelKey?: string;         // i18n label key (e.g. web.models.entities.corpus_work)
     description: string;       // Human-readable description
     descriptionKey?: string;   // i18n description key
     tableName: string;         // Database table name (regex: ^[a-z][a-z0-9_]*$)
     fields: Record<string, QlFieldDefinition>;
     ownerField?: string;       // Optional owner isolation field (e.g. "owner_id")
   }
   ```
   - Primary Key: Every table is created with `id TEXT PRIMARY KEY NOT NULL` (`lines 934-935`). Models **must not** declare `id` in `fields`.
   - Field identifier validation: Column identifiers must match `/^[a-z][a-z0-9_]*$/` (`line 158`).

3. **Owner Field Isolation Invariants** (`lines 692-701`, `1117-1121`, `1257-1258`, `1303-1305`, `1316-1320`):
   - If `model.ownerField` is declared, it MUST exist in `fields`, must be of type `"char"`, and must have `required: true` (`lines 692-701`).
   - Private field pairing: Standard practice is `owner_id: { type: "char", required: true, private: true }`.
   - User `create()` automatically injects `values[model.ownerField] = user.id` (`line 1258`).
   - User `findMany()` automatically appends `WHERE "${model.ownerField}" = user.id` (`lines 1117-1121`).
   - User `update()` enforces ownership check `AND "${model.ownerField}" = user.id` and throws `QlValidationError("Record ownership cannot be changed.")` if input contains `ownerField` (`lines 1303-1305, 1316-1320`).
   - User `delete()` enforces ownership check `AND "${model.ownerField}" = user.id` (`lines 1339-1343`).
   - Models with `ownerField` **cannot** declare seed data in `manifest.data` (`lines 813-817`).
   - Models with `ownerField` **cannot** declare landing views with `publicCountFilter` (`lines 789-793`).

4. **Private Field Invariants** (`lines 1111-1113`, `1250-1252`, `1307-1309`):
   - User queries (`findMany`, `findManyById`) filter out private fields (`Object.keys(model.fields).filter((name) => !model.fields[name].private)`).
   - User mutations (`create`, `update`) throw `QlValidationError("Field '<name>' cannot be written through this API.")` if a private field is included in input (`lines 1251, 1308`).
   - Only service methods (`createRecordForService`, `updateRecordsForService`, `findManyByService`, `createForService`) can access or write private fields (`lines 1424-1545`).

5. **Computed Fields & Computed Models**:
   - **Computed Field** (`lines 40-43, 609-612, 645-691, 1710-1721`):
     ```ts
     export interface QlComputedFieldDefinition {
       dependsOn: readonly string[];
       resolve(record: Readonly<QlRecord>): QlServiceValue;
     }
     ```
     Cannot have defaults or unique constraints. Dependency graph is topologically sorted and checked for cycles. Public computed fields cannot depend on private fields (`lines 677-681`).
   - **Computed Model** (`lines 55-75, 705-749, 1138-1238`):
     Virtual, read-only entity derived dynamically at query time (e.g. `corpus.lexical_candidate`). Declares `sources` (base models, validated for user read access), optional `queryFields` (max 20 public query filters), `fields`, and `compute(context: QlComputedModelContext): Promise<readonly QlRecord[]>`.

6. **Access Control List (ACL)** (`lines 77-84, 750-759, 912-921, 1725-1733`):
   ```ts
   export interface QlAccessRule {
     model: string;
     group: string;
     read: boolean;
     write: boolean;
     create: boolean;
     unlink: boolean;
   }
   ```
   - Deny-by-default: If no matching rule for a user's group grants the requested operation (`read`, `create`, `write`, `unlink`), QlOrm throws `QlAccessError` (`line 1731`).
   - Recognized role groups across the system: `"root"`, `"admin"`, `"operator"`, `"user"` (or `"member"`), `"viewer"`.

7. **Declarative Views (`views/index.ts`)** (`lines 86-104, 760-803`):
   ```ts
   export interface QlViewDefinition {
     name: string;
     labelKey?: string;
     helpKey?: string;
     model: string;
     type: "list" | "form" | "landing";
     fields: string[];
     landing?: QlLandingViewConfig;
   }
   ```
   - All fields in `fields` must exist on the target model.
   - Landing views (`type: "landing"`): Must define `landing.href` starting with `"/"`, must not include private fields in `fields`, and if `publicCountFilter` is specified, the target model must NOT have an `ownerField` and filter keys cannot be private (`lines 775-802`).

8. **Seed Data & External ID Registry** (`lines 106-112, 462-507, 805-846, 987-1097`):
   ```ts
   export interface QlSeedDataRecord {
     id: string;                                           // e.g. "role_admin", "country_id"
     model: string;                                        // Must be owned by declaring addon
     key: { field: string; value: QlServiceValue };        // Lookup key: must be a public unique field
     values: Record<string, QlServiceValue>;               // Values to set (cannot be private/computed)
     updatePolicy: "insert_only" | "reconcile";
   }
   ```
   - Addon can ONLY seed models it defines (`lines 808-812`).
   - Addon cannot seed owner-scoped models (`lines 813-817`).
   - External IDs are tracked in `ir.model.data` as `${addonName}.${seed.id}` (`lines 1010-1097`).
   - Policy `"reconcile"` updates existing records to match manifest values; `"insert_only"` preserves existing values.

9. **Addon Manifest (`__manifest__.ts`)** (`lines 114-125, 509-544`):
   ```ts
   export interface QlAddonManifest {
     name: string;                          // Regex: ^ql_[a-z][a-z0-9_]*$
     version: string;
     description: string;
     category?: AddonCategory;             // "knowledge" | "research" | "intelligence" | "workflow" | "integration" | "system"
     depends: string[];                     // Array of prerequisite addon names (e.g. ["ql_base", "ql_auth"])
     models: QlModelDefinition[];
     computedModels?: QlComputedModelDefinition[];
     access: QlAccessRule[];
     views: QlViewDefinition[];
     data: readonly QlSeedDataRecord[];
   }
   ```
   - `loadAddons()` validates names, ensures no duplicates, and computes a topological sort over `depends`. Dependency cycles or missing dependencies throw errors immediately (`lines 524-543`).

10. **Lifecycle & Schema Synchronization Engine** (`lines 930-985, 1740-1767`):
    - Invoked via `createQlOrm(databaseUrl, manifests)` (`apps/api/src/index.ts:43-57`).
    - Drivers: LibSql/SQLite (when URL starts with `file:` or `libsql:`) or PostgreSQL (when URL matches `/^postgres(ql)?:\/\//i`).
    - `syncSchema()`:
      1. Generates `CREATE TABLE IF NOT EXISTS "tableName" ("id" TEXT PRIMARY KEY NOT NULL, ...)`.
      2. If Postgres, adds `"ql_seq" BIGSERIAL`.
      3. Introspects existing table columns (`PRAGMA table_info` in SQLite, `information_schema.columns` in Postgres).
      4. For any field declared on the model that does not yet exist in the table, issues `ALTER TABLE "tableName" ADD COLUMN "name" <SQL_TYPE> [DEFAULT ...]`.
      5. For unique fields, issues `CREATE UNIQUE INDEX IF NOT EXISTS "tableName_field_unique" ON "tableName" ("field")`.
    - `loadDefaultData()` runs immediately after schema sync, applying seeds in dependency order.

### 1.3 Inspection of Real Addon Packages
- **`packages/ql_base`**: Defines `ir.model.data` (external IDs for stable seeding) and `res.partner` (`ownerField: "owner_id"`). Exports `./__manifest__` and `./models`.
- **`packages/ql_auth`**: Defines `res.users`, `res.sessions`, `res.verification`, and `res.role`. Seeds `ROLE_CATALOG` (`data: ROLE_CATALOG.map(...)`) with `updatePolicy: "reconcile"`. Depends on `ql_base`.
- **`packages/ql_corpus`**: Knowledge category addon. Defines canonical models: `corpus.work`, `corpus.edition`, `corpus.passage`, `corpus.annotation`, `corpus.term`, `corpus.concept`, and computed model `corpus.lexical_candidate`. Implements strict storage-level invariants (`authorityValidator` enforcing distinction between scripture verbatim and commentary/translations). Depends on `["ql_base", "ql_auth", "ql_source"]`. Views include list, form, and landing view with `publicCountFilter: { stage: "published" }`.
- **`packages/ql_source`**: Source provenance layer (`source.artifact`, `source.version`, `source.rights`, `source.provenance`). Append-only audit ledger where mutations are restricted to service methods.
- **`packages/ql_geo`**: Seeds `countryData` into `res.country` with `updatePolicy: "reconcile"`.
- **`packages/ql_ai` & `ql_chat`**: Define `ai.provider`, `chat.conversation`, and `chat.message`.
- **`packages/ql_workflow`**: Defines workflow state machine (`workflow.definition`, `workflow.step`, `workflow.transition`).

### 1.4 Test Infrastructure (`packages/ql-orm/src/testing.ts`)
- Addon test suites run via Node test runner (`node:test`) and utilize `withMemoryOrm(manifests, async (orm) => { ... })` and `stubAddonManifest(name)` to boot an isolated in-memory LibSql SQLite database per test without cross-suite side effects.

---

## 2. Logic Chain

1. **Rejection of Drizzle ORM**:
   - `AGENTS.md` explicitly forbids Drizzle ORM and schema migration files because MoonWitness's core data philosophy centers on modular, self-contained, domain-isolated addons (`packages/ql_*`).
   - The custom `QlOrm` engine performs automated zero-migration schema synchronization (`syncSchema()`), column introspection, safe non-destructive column addition (`ALTER TABLE ADD COLUMN`), index synthesis, and idempotent seed data reconciliation (`ir.model.data`).
   - Introducing Drizzle would bypass QlOrm's access control (`can()`), owner isolation (`ownerField`), private field stripping, custom field validators, and external ID seed tracking.

2. **Compliance Requirements for the 30 Strategic Tracks**:
   - Every one of the 30 strategic tracks requiring data persistence must implement its domain models within a `packages/ql_*` addon.
   - For tracks extending existing domains (e.g. Tracks 01-05 extending Sacred Corpus, Tracks 06-10 extending Cognitive AI, Tracks 16-20 extending Governance/Community), models must be added to existing addons (`ql_corpus`, `ql_ai`, `ql_chat`, `ql_search`, `ql_workflow`) or dedicated new `ql_*` addons (`ql_community`, `ql_telemetry`).
   - Models must strictly follow `domain.entity` naming and `ql_seq` Postgres compatibility.
   - User-generated or member-scoped entities (e.g. bookmarks, reflections, covenant signatures, private AI settings) must declare `ownerField: "owner_id"`.
   - Audit records and ledgers (e.g. Activity Ledger, Sanad verification events) must declare `write: false, unlink: false` in ACL to ensure append-only immutability.

---

## 3. Caveats

1. **Non-destructive Alterations Only**: `QlOrm.syncSchema()` only executes `CREATE TABLE` and `ALTER TABLE ... ADD COLUMN`. It does NOT drop columns or rename columns automatically. Schema changes must be backward-compatible (new columns must be nullable or provide defaults).
2. **Composite Indexes**: QlOrm does not natively generate composite multi-column unique indexes directly from single-field definitions. When a composite unique key is required (e.g., `passage_key = <edition_id>|<locator>` or `rights_key = <version_id>|<action>`), addons use a computed/synthetic composite string field with `unique: true` (`packages/ql_corpus/models/corpus_passage.ts:63`).
3. **No Direct Joins in User API**: The user API operates on single models. Complex joins or aggregated relations must be encapsulated either in service layer methods (e.g. `reader-service.ts`) or declared as `QlComputedModelDefinition` (e.g. `corpus.lexical_candidate`).

---

## 4. Conclusion & Concrete Specification Guidelines

### 4.1 Canonical Package Layout for any `ql_*` Addon
Every addon package in `packages/ql_<name>` must conform to this exact directory structure:

```
packages/ql_<name>/
├── package.json
├── tsconfig.json
├── __manifest__.ts
├── models/
│   ├── index.ts
│   ├── index.test.ts
│   ├── <domain>_<entity_a>.ts
│   └── <domain>_<entity_b>.ts
├── views/
│   └── index.ts
├── services/               (optional domain service & validation layer)
│   ├── <name>-service.ts
│   └── field-validators.ts
└── data/                   (optional seed data)
    └── index.ts
```

#### Canonical `package.json` Template
```json
{
  "name": "ql_<name>",
  "private": true,
  "type": "module",
  "exports": {
    "./__manifest__": {
      "types": "./dist/__manifest__.d.ts",
      "import": "./dist/__manifest__.js"
    },
    "./models": {
      "types": "./dist/models/index.d.ts",
      "import": "./dist/models/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@moonwitness/types": "workspace:*",
    "ql_orm": "workspace:*"
  }
}
```

### 4.2 Standard QlOrm Model Definition Template

#### Template A: Tenant / Owner-Scoped Model (User Data)
```ts
import type { QlModelDefinition } from "ql_orm";

export const domainEntity: QlModelDefinition = {
  name: "domain.entity",
  labelKey: "web.models.entities.domain_entity",
  description: "User-scoped entity description.",
  descriptionKey: "web.models.descriptions.domain_entity",
  tableName: "domain_entity",
  ownerField: "owner_id",
  fields: {
    title: {
      type: "char",
      required: true,
      maxLength: 200,
      labelKey: "web.models.fieldTitle",
    },
    content: {
      type: "text",
      required: true,
      maxLength: 10000,
    },
    status: {
      type: "char",
      required: true,
      maxLength: 32,
      default: "draft",
      options: ["draft", "submitted", "approved", "archived"],
    },
    is_active: {
      type: "boolean",
      required: true,
      default: true,
    },
    // The ownerField MUST be char, required: true, and private: true
    owner_id: {
      type: "char",
      required: true,
      maxLength: 64,
      private: true,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

#### Template B: Reference / Platform-Owned Model (Immutable / Service-Only Writes)
```ts
import type { QlModelDefinition } from "ql_orm";

export const domainReference: QlModelDefinition = {
  name: "domain.reference",
  labelKey: "web.models.entities.domain_reference",
  description: "Platform reference data, written via service only.",
  tableName: "domain_reference",
  fields: {
    code: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 64,
    },
    name: {
      type: "char",
      required: true,
      maxLength: 160,
    },
    sequence: {
      type: "integer",
      required: true,
      default: 10,
      minValue: 0,
      maxValue: 10000,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

#### Template C: Addon Manifest Template (`__manifest__.ts`)
```ts
import type { QlAddonManifest } from "ql_orm";
import { models, computedModels } from "./models/index.js";
import { views } from "./views/index.js";
import { seedData } from "./data/index.js";

const manifest: QlAddonManifest = {
  name: "ql_<name>",
  version: "1.0.0",
  category: "knowledge", // "knowledge" | "research" | "intelligence" | "workflow" | "integration" | "system"
  description: "Detailed description of the addon responsibility.",
  depends: ["ql_base", "ql_auth"],
  models,
  computedModels: [...computedModels],
  access: [
    // Deny-by-default: Explicitly grant permissions per role group
    {
      model: "domain.entity",
      group: "user",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    {
      model: "domain.reference",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "domain.reference",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "domain.reference",
      group: "root",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
  ],
  views,
  data: seedData,
};

export default manifest;
```

---

### 4.3 Mapping of the 30 Strategic Tracks to QlOrm Models & Addons

| Track # | Strategic Track Title | Target Addon | Primary QlOrm Models (`domain.entity`) | Owner Scope / Immutability |
|---|---|---|---|---|
| **T01** | Mushaf Typography & Diacritics | `ql_corpus` | `corpus.font_manifest`, `corpus.script_rule` | Platform reference, public read, admin write |
| **T02** | Dual-Stream Hermeneutic Reader | `ql_corpus` | `corpus.edition`, `corpus.passage`, `corpus.alignment_pair` | Platform reference, `stage: "published"` |
| **T03** | Semantic Cross-Surah Graph | `ql_search` | `search.semantic_edge`, `search.thematic_node` | Platform reference, operator curated |
| **T04** | Verifiable Ayah Proofs | `ql_source`, `ql_corpus` | `corpus.ayah_proof`, `source.provenance` | Append-only audit ledger, read-only |
| **T05** | Audio Tilawah Spatial Resonance | `ql_corpus` | `corpus.reciter`, `corpus.audio_track`, `corpus.timestamp_sync` | Platform reference with rights verification |
| **T06** | Hallucination-Shielded Chat | `ql_chat` | `chat.conversation`, `chat.message`, `chat.evidence_citation` | Owner-scoped (`user_id`), private messages |
| **T07** | Multi-Provider Failover Mesh | `ql_ai` | `ai.provider`, `ai.endpoint_telemetry` | Admin-configured, encrypted secret fields |
| **T08** | Lexical Morphology Search | `ql_corpus`, `ql_search` | `corpus.term`, `corpus.root_lemma`, `corpus.lexical_candidate` | Computed model + platform reference |
| **T09** | Morphological Visualizer | `ql_corpus` | `corpus.word_morphology`, `corpus.syntax_segment` | Platform reference (UNILEX ontology) |
| **T10** | Local-First Private AI Mode | `ql_ai` | `ai.local_profile`, `ai.client_preference` | Owner-scoped (`ownerField: "owner_id"`) |
| **T11** | Universal Ambient Canvas | `@moonwitness/ui` | *(No backend storage required; CSS/Canvas tokens)* | N/A |
| **T12** | 5-Region 3D Holographic Orbit | `apps/web` | *(State in navigation/session)* | N/A |
| **T13** | Micro-Chime Web Audio System | `ql_base` | `res.user_preference` (`audio_enabled: boolean`) | Owner-scoped (`owner_id`) |
| **T14** | Sanctuary Minimalist Mode | `ql_base` | `res.user_preference` (`zen_mode: boolean`) | Owner-scoped (`owner_id`) |
| **T15** | Adaptive Spatial Density | `ql_base` | `res.user_preference` (`density: char`) | Owner-scoped (`owner_id`) |
| **T16** | Architectural Covenant Ledger | `ql_community` | `community.covenant_signatory`, `community.covenant_revision` | Append-only, owner-scoped signature |
| **T17** | Sanad-Verified Review Pipeline | `ql_workflow` | `workflow.review_item`, `workflow.peer_endorsement` | Append-only transition ledger |
| **T18** | Collaborative Harbor Circles | `ql_community` | `community.study_circle`, `community.circle_membership`, `community.shared_note` | Owner-scoped circle & membership |
| **T19** | Proof-of-Beneficial-Deeds | `ql_community` | `community.activity_ledger` | Append-only ledger, no gamification |
| **T20** | Editorial Ethics Checklist | `ql_research` | `research.ethics_attestation` | Append-only linked to research paper |
| **T21** | Realtime Telemetry Orbit Monitor | `ql_telemetry` | `telemetry.node_heartbeat`, `telemetry.endpoint_latency` | Ephemeral / service-only writes |
| **T22** | Automated PO Parity Syncer | `ql_i18n` | `i18n.catalog_entry`, `i18n.translation_draft` | Platform reference with review stage |
| **T23** | Next-Gen Spotlight Palette | `ql_search` | `search.command_registry` | Platform reference |
| **T24** | Studio Multi-Format Exporter | `ql_research` | `research.export_artifact` | Owner-scoped (`ownerField: "owner_id"`) |
| **T25** | Resilient Offline PWA Sync | `apps/web` | *(Client IndexedDB caching verified against QlOrm checksums)* | N/A |
| **T26** | Modular Movement Components | `apps/web` | *(UI modularization, clean component boundaries)* | N/A |
| **T27** | Zero-Warning Strict Typing | *All packages* | *(ESLint & TypeScript compiler compliance)* | N/A |
| **T28** | Web Bundle Budget Hardening | `apps/web` | *(`.size-budget.json` bundle limits)* | N/A |
| **T29** | Autonomous Workflow State Machine | `ql_workflow` | `workflow.state_machine_spec`, `workflow.lock_guard` | Strict verification test suites |
| **T30** | Comprehensive E2E Playwright | *e2e* | *(Automated browser tests across 4 viewports)* | N/A |

---

## 5. Verification Method

To independently verify the findings and specifications in this report:

1. **Verify Prohibited ORM Absence**:
   Run grep across the entire workspace to confirm that neither `drizzle-orm` nor migration folders exist:
   ```powershell
   git grep "drizzle-orm" packages/
   ```
   (Must return 0 matches outside of any obsolete documentation mentions).

2. **Verify Existing QlOrm Test Suites**:
   Run the native tests for the existing `ql_*` addons using `withMemoryOrm`:
   ```powershell
   node --test packages/ql-orm/dist/index.test.js
   node --test packages/ql_corpus/dist/models/index.test.js
   node --test packages/ql_workflow/dist/models/index.test.js
   ```

3. **Verify Model Naming & Addon Loading**:
   Inspect `packages/ql-orm/src/index.ts:509-544` and `lines 601-704` to verify the regular expressions enforcing `ql_[a-z][a-z0-9_]*` for addon names and `[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*` for model names.

4. **Verify ACL and Owner Isolation Enforcement**:
   Inspect `packages/ql-orm/src/index.ts:1117-1121` (read owner filtering), `lines 1257-1258` (create owner stamping), `lines 1303-1305` (ownership update prohibition), and `lines 1725-1733` (deny-by-default `requireAccess`).
