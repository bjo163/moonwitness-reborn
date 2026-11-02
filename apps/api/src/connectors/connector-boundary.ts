import type {
  CloudflareRecordDto,
  CloudflareZoneDto,
  ConnectorDto,
  ConnectorKindDto,
  ConnectorVerifyStatus,
  IntegrationAuditDto,
} from "@moonwitness/moonclient";
import { QlNotFoundError, QlValidationError, type QlOrm, type QlRecord } from "ql_orm";
import {
  MAX_CONNECTORS_PER_OWNER,
  CONNECTOR_KINDS,
  connectorKindAllowsWrites,
  connectorKindSupports,
  findConnectorKind,
} from "ql_integration/services/connector-registry";
import {
  DEFAULT_TOKEN_SOURCE,
  DEFAULT_VERIFY_STATUS,
  TOKEN_SOURCES,
  VERIFY_STATUSES,
} from "ql_integration/services/connector-vocabulary";
import { PROXIABLE_TYPES, RECORD_TYPES } from "ql_cloudflare/services/record-types";
import { sanitizeCloudflareMessage } from "ql_cloudflare/services/errors";
import {
  createCloudflareClient,
  type CloudflareClient,
} from "ql_cloudflare/services/cloudflare-client";
import type { RecordDraft } from "ql_cloudflare/services/mutation-service";
import { ConnectorCredentialError, type ResolvedCredential } from "./os-credential-store.js";

export { ConnectorCredentialError };

/** Raised when a role or a read-only connector refuses an action: HTTP 403. */
export class ConnectorAccessError extends Error {
  readonly name = "ConnectorAccessError";
}

function textOf(value: unknown, fallback = ""): string {
  return typeof value === "string" && value ? value : fallback;
}

function isoOf(value: unknown): string | null {
  const timestamp = typeof value === "number" ? value : Number(value ?? NaN);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return new Date(timestamp).toISOString();
}

function enumOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function connectorCatalog(): {
  kinds: ConnectorKindDto[];
  maxPerOwner: number;
} {
  return {
    maxPerOwner: MAX_CONNECTORS_PER_OWNER,
    kinds: CONNECTOR_KINDS.map((definition) => ({
      kind: definition.kind,
      labelKey: definition.labelKey,
      label: definition.label,
      credentialHelpKey: definition.credentialHelpKey,
      credentialHelp: definition.credentialHelp,
      helpUrl: definition.helpUrl,
      capabilities: [...definition.capabilities],
      readonly: definition.readonly,
      ...(connectorKindSupports(definition.kind, "dns")
        ? {
            recordTypes: [...RECORD_TYPES] as string[],
            proxiableTypes: [...PROXIABLE_TYPES] as string[],
          }
        : {}),
    })),
  };
}

export function toConnectorDto(record: QlRecord): ConnectorDto {
  return {
    id: String(record.id),
    kind: textOf(record.kind),
    label: textOf(record.label),
    tokenSource: enumOf(record.token_source, TOKEN_SOURCES, DEFAULT_TOKEN_SOURCE),
    tokenRef: textOf(record.token_ref),
    enabled: record.enabled === true,
    verifyStatus: enumOf<ConnectorVerifyStatus>(
      record.verify_status,
      VERIFY_STATUSES,
      DEFAULT_VERIFY_STATUS,
    ),
    lastVerifyAt: isoOf(record.last_verify_at),
    lastSyncAt: isoOf(record.last_sync_at),
    lastSyncStatus:
      typeof record.last_sync_status === "string" ? record.last_sync_status : null,
    createdAt: isoOf(record.created_at) ?? "",
    updatedAt: isoOf(record.updated_at) ?? "",
  };
}

export function toZoneDto(record: QlRecord): CloudflareZoneDto {
  return {
    id: String(record.id),
    externalId: textOf(record.external_id),
    name: textOf(record.name),
    accountId: textOf(record.account_id),
    status: textOf(record.status, "pending"),
    paused: record.paused === true,
    stale: record.stale === true,
    lastSyncAt: isoOf(record.last_sync_at),
  };
}

export function toRecordDto(record: QlRecord): CloudflareRecordDto {
  return {
    id: String(record.id),
    externalId: textOf(record.external_id),
    zoneId: textOf(record.zone_id),
    name: textOf(record.name),
    type: textOf(record.type),
    content: textOf(record.content),
    ttl: typeof record.ttl === "number" ? record.ttl : Number(record.ttl ?? 1),
    proxied: record.proxied === true,
    managed: record.managed === true,
    stale: record.stale === true,
    comment: textOf(record.comment),
    createdAt: isoOf(record.created_at) ?? "",
    lastSyncAt: isoOf(record.last_sync_at),
  };
}

export function toAuditDto(record: QlRecord): IntegrationAuditDto {
  return {
    id: String(record.id),
    createdAt: isoOf(record.created_at) ?? "",
    connectorId: textOf(record.connector_id),
    action: textOf(record.action),
    outcome: textOf(record.outcome, "ok"),
    target: textOf(record.target),
    zoneId: textOf(record.zone_id),
    recordId: textOf(record.record_id),
    errorCode: textOf(record.error_code),
    errorMessage: textOf(record.error_message),
  };
}

export interface AuditEntry {
  action: string;
  target: string;
  outcome?: "ok" | "error";
  zoneId?: string;
  recordId?: string;
  detail?: string;
  error?: unknown;
}

/**
 * Audit must never turn a completed DNS change into a 500, so failures here are
 * logged and swallowed. Sanitized so no credential can ride along in a message.
 */
export async function writeAudit(
  orm: QlOrm,
  scope: { connectorId: string; ownerId: string },
  entry: AuditEntry,
): Promise<void> {
  try {
    const failure = entry.error;
    await orm.createRecordForService("integration.audit", {
      connector_id: scope.connectorId,
      owner_id: scope.ownerId,
      action: entry.action.slice(0, 24),
      target: entry.target.slice(0, 253),
      outcome: entry.outcome ?? (failure ? "error" : "ok"),
      zone_id: (entry.zoneId ?? "").slice(0, 64),
      record_id: (entry.recordId ?? "").slice(0, 64),
      detail: sanitizeCloudflareMessage(entry.detail ?? ""),
      error_code: failure ? String(errorCodeOf(failure)).slice(0, 24) : "",
      error_message: failure ? sanitizeCloudflareMessage(errorMessageOf(failure)) : "",
    });
  } catch (error) {
    console.error("Audit write failed; the domain change itself is unaffected.", error);
  }
}

function errorCodeOf(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "number" || typeof code === "string") return String(code);
    return error.name;
  }
  return "unknown";
}

function errorMessageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
}

export async function loadOwnedConnector(
  orm: QlOrm,
  ownerId: string,
  connectorId: string,
): Promise<QlRecord> {
  const connector = await orm.findOneByService("integration.connector", {
    id: connectorId,
    owner_id: ownerId,
  });
  if (!connector) {
    throw new QlNotFoundError("Konektor tidak ditemukan untuk akun ini.");
  }
  return connector;
}

export function assertConnectorEnabled(connector: QlRecord): void {
  if (connector.enabled !== true) {
    throw new QlValidationError("Konektor dinonaktifkan; aktifkan terlebih dahulu.");
  }
}

export function assertConnectorWritable(connector: QlRecord): void {
  const kind = textOf(connector.kind);
  if (findConnectorKind(kind) === undefined) {
    throw new QlValidationError(`Jenis konektor '${kind}' tidak dikenal.`);
  }
  if (!connectorKindAllowsWrites(kind)) {
    throw new ConnectorAccessError(
      "Konektor ini read-only; pembuatan, perubahan, dan penghapusan record ditolak.",
    );
  }
}

export function createConnectorClient(
  credential: ResolvedCredential,
  fetcher: typeof fetch,
): CloudflareClient {
  return createCloudflareClient({ token: credential.token, fetcher });
}

/** Records where the credential was actually found; never the value itself. */
export async function stampCredential(
  orm: QlOrm,
  scope: { connectorId: string; ownerId: string },
  credential: ResolvedCredential,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await orm.updateRecordsForService(
    "integration.connector",
    { id: scope.connectorId, owner_id: scope.ownerId },
    {
      token_source: credential.source,
      token_ref: credential.ref.slice(0, 200),
      ...extra,
    },
  );
}

function requiredText(body: Record<string, unknown>, field: string, max: number): string {
  const value = body[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new QlValidationError(`Field '${field}' wajib diisi.`);
  }
  if (value.length > max) {
    throw new QlValidationError(`Field '${field}' terlalu panjang (maks ${max}).`);
  }
  return value.trim();
}

export function parseConnectorCreate(body: Record<string, unknown>): {
  kind: string;
  label: string;
} {
  const kind = requiredText(body, "kind", 40).toLowerCase();
  if (findConnectorKind(kind) === undefined) {
    throw new QlValidationError(`Jenis konektor '${kind}' tidak tersedia.`);
  }
  return { kind, label: requiredText(body, "label", 80) };
}

export function parseConnectorUpdate(body: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  if (body.label !== undefined) values.label = requiredText(body, "label", 80);
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== "boolean") {
      throw new QlValidationError("Field 'enabled' harus berupa boolean.");
    }
    values.enabled = body.enabled;
  }
  if (Object.keys(values).length === 0) {
    throw new QlValidationError("Tidak ada perubahan yang dikirim.");
  }
  return values;
}

export function parseConfirm(
  body: Record<string, unknown>,
  field: string,
  expected: string,
): void {
  const value = body[field];
  if (typeof value !== "string" || value.trim() !== expected) {
    throw new QlValidationError(
      `Konfirmasi destruktif gagal: ketik '${expected}' persis di kolom '${field}'.`,
    );
  }
}

export function parseRecordDraft(body: Record<string, unknown>): RecordDraft {
  const ttl = body.ttl;
  if (ttl !== 1 && (typeof ttl !== "number" || !Number.isInteger(ttl))) {
    throw new QlValidationError("Field 'ttl' harus berupa angka integer (1 = Auto).");
  }
  const proxied = body.proxied;
  if (typeof proxied !== "boolean") {
    throw new QlValidationError("Field 'proxied' harus berupa boolean.");
  }
  return {
    name: requiredText(body, "name", 253),
    type: requiredText(body, "type", 20).toUpperCase(),
    content: requiredText(body, "content", 2048),
    ttl,
    proxied,
    ...(typeof body.comment === "string" && body.comment.trim()
      ? { comment: body.comment.trim().slice(0, 500) }
      : {}),
  };
}
