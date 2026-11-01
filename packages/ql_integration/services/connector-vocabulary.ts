import type {
  ConnectorTokenSource,
  ConnectorVerifyStatus,
} from "@moonwitness/types";

/**
 * Canonical runtime vocabularies for `integration.connector` fields. The
 * scalar unions live in `@moonwitness/types` (type-only); this module owns
 * the ordered tuples used by `enumValidator` on the server and by the
 * connector boundary that reads records back from QlOrm.
 */

export const TOKEN_SOURCES: readonly ConnectorTokenSource[] = [
  "unresolved",
  "env",
  "keychain",
  "config_file",
];

export type ConnectorSyncStatus = "ok" | "partial" | "error";

export const VERIFY_STATUSES: readonly ConnectorVerifyStatus[] = [
  "unverified",
  "ok",
  "invalid",
  "network",
  "missing",
];

export const SYNC_STATUSES: readonly ConnectorSyncStatus[] = [
  "ok",
  "partial",
  "error",
];

export const DEFAULT_TOKEN_SOURCE: ConnectorTokenSource = "unresolved";
export const DEFAULT_VERIFY_STATUS: ConnectorVerifyStatus = "unverified";
