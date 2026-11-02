/**
 * `@moonwitness/types` — shared type-only vocabulary kernel.
 *
 * Scope: transport-neutral TypeScript primitives reused across ql_orm (server),
 * moonclient (browser contract layer), and any ql_* addon. This package must
 * stay free of request/response contracts, routes, DTOs, and runtime values —
 * those live in `@moonwitness/moonclient` per AGENTS.md and MW-ADR-004.
 *
 * `package.json` deliberately exposes only the `types` condition so that any
 * attempt to import a value from this package fails at resolution time; every
 * consumer must use `import type` (or `export type`) — which the workspace's
 * `@typescript-eslint/consistent-type-imports` rule already enforces.
 */

/** Field storage type supported by QlOrm model definitions. */
export type FieldType = "char" | "text" | "integer" | "boolean" | "datetime";

/** View shape understood by the view-driven UI layer. */
export type ViewType = "list" | "form" | "landing";

/** Functional domain category of a `ql_*` addon and its models. */
export type AddonCategory =
  | "knowledge"
  | "research"
  | "intelligence"
  | "workflow"
  | "integration"
  | "system";

/** Public landing page section where a declarative landing view is surfaced. */
export type LandingViewSection = "knowledge" | "research" | "foundation";

/** CRUD operation names used by ACL rules and capability maps. */
export type Operation = "read" | "create" | "write" | "unlink";

/** Scalar value stored in a QlRecord field or transmitted over the wire. */
export type RecordValue = string | number | boolean | null;

/** Full record: column name -> scalar value. */
export type RecordValues = Record<string, RecordValue>;

/** Where a connector's credential token physically resolves from. */
export type ConnectorTokenSource =
  | "unresolved"
  | "env"
  | "keychain"
  | "config_file";

/** Result of verifying a connector's token against the upstream provider. */
export type ConnectorVerifyStatus =
  | "unverified"
  | "ok"
  | "invalid"
  | "network"
  | "missing";

/** Chat message author role. */
export type ChatRole = "user" | "assistant";

/** Supported application interface locales. */
export type UiLocale = "id" | "en";

export type {
  CallbackWithVoidThis,
  Result,
} from "./strict-signatures.js";
