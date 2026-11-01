import type {
  AuditListResponseDto,
  ConnectorListResponseDto,
  ConnectorResponseDto,
  ConnectorVerifyStatus,
  RecordListResponseDto,
  RecordResponseDto,
  SyncConnectorResponseDto,
  VerifyConnectorResponseDto,
  ZoneListResponseDto,
} from "@moonwitness/moonclient";
import { QlConflictError, QlNotFoundError, type QlOrm, type QlRecord } from "ql_orm";
import { MAX_CONNECTORS_PER_OWNER } from "ql_integration/services/connector-registry";
import {
  CloudflareApiError,
  CloudflareNetworkError,
  CloudflareRateLimitError,
} from "ql_cloudflare/services/errors";
import {
  createDnsRecord,
  deleteDnsRecord,
  updateDnsRecord,
} from "ql_cloudflare/services/mutation-service";
import { syncConnector as runCloudflareSync } from "ql_cloudflare/services/sync-service";
import {
  assertConnectorEnabled,
  assertConnectorWritable,
  connectorCatalog,
  createConnectorClient,
  loadOwnedConnector,
  parseConfirm,
  parseConnectorCreate,
  parseConnectorUpdate,
  parseRecordDraft,
  stampCredential,
  toAuditDto,
  toConnectorDto,
  toRecordDto,
  toZoneDto,
  writeAudit,
  type AuditEntry,
} from "./connector-boundary.js";
import { ConnectorCredentialError, type ResolvedCredential } from "./os-credential-store.js";

/** The ORM clamps any larger page to this, so `truncated` below stays honest. */
const MIRROR_PAGE_LIMIT = 500;
const AUDIT_PAGE_LIMIT = 200;

export interface ConnectorContext {
  orm: QlOrm;
  ownerId: string;
  /** Resolves the caller's credential from the OS store, for this request only. */
  resolveToken: () => Promise<ResolvedCredential>;
  fetcher: typeof fetch;
}

interface Scope {
  connectorId: string;
  ownerId: string;
}

function scopeOf(ctx: ConnectorContext, connectorId: string): Scope {
  return { connectorId, ownerId: ctx.ownerId };
}

async function connectorDto(ctx: ConnectorContext, connectorId: string) {
  return toConnectorDto(await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId));
}

async function readMirror(
  ctx: ConnectorContext,
  model: "cloudflare.zone" | "cloudflare.record",
  connectorId: string,
  extra: Record<string, string> = {},
): Promise<{ rows: QlRecord[]; truncated: boolean }> {
  const rows = await ctx.orm.findManyByService(
    model,
    { connector_id: connectorId, owner_id: ctx.ownerId, ...extra },
    { limit: MIRROR_PAGE_LIMIT, orderBy: { field: "name", direction: "asc" } },
  );
  return { rows, truncated: rows.length >= MIRROR_PAGE_LIMIT };
}

/**
 * Only states the app can prove: a credential that is not in the OS store, an
 * unreachable Cloudflare, and - when the call's whole purpose was judging the
 * token - a token Cloudflare refused.
 */
function failureStatus(error: unknown, judgesToken: boolean): ConnectorVerifyStatus | undefined {
  if (error instanceof ConnectorCredentialError) return "missing";
  if (error instanceof CloudflareNetworkError || error instanceof CloudflareRateLimitError) {
    return "network";
  }
  if (judgesToken && error instanceof CloudflareApiError) return "invalid";
  return undefined;
}

interface AttemptOptions {
  /** Set for calls whose purpose is to judge the credential itself. */
  judgesToken?: boolean;
}

async function attempt<T>(
  ctx: ConnectorContext,
  scope: Scope,
  entry: AuditEntry,
  work: () => Promise<T>,
  options: AttemptOptions = {},
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    const status = failureStatus(error, options.judgesToken === true);
    if (status) {
      await ctx.orm.updateRecordsForService(
        "integration.connector",
        { id: scope.connectorId, owner_id: scope.ownerId },
        { verify_status: status, last_verify_at: new Date(), updated_at: new Date() },
      );
    }
    await writeAudit(ctx.orm, scope, { ...entry, error });
    throw error;
  }
}

export async function listConnectors(
  ctx: ConnectorContext,
): Promise<ConnectorListResponseDto> {
  const rows = await ctx.orm.findManyByService(
    "integration.connector",
    { owner_id: ctx.ownerId },
    {
      limit: MAX_CONNECTORS_PER_OWNER,
      orderBy: { field: "created_at", direction: "asc" },
    },
  );
  const catalog = connectorCatalog();
  return {
    connectors: rows.map(toConnectorDto),
    kinds: catalog.kinds,
    maxPerOwner: catalog.maxPerOwner,
  };
}

export async function createConnector(
  ctx: ConnectorContext,
  body: Record<string, unknown>,
): Promise<ConnectorResponseDto> {
  const input = parseConnectorCreate(body);
  const owned = await ctx.orm.findManyByService(
    "integration.connector",
    { owner_id: ctx.ownerId },
    { limit: MAX_CONNECTORS_PER_OWNER + 1 },
  );
  if (owned.length >= MAX_CONNECTORS_PER_OWNER) {
    throw new QlConflictError(
      `Maksimal ${MAX_CONNECTORS_PER_OWNER} konektor per akun. Hapus yang tidak dipakai dulu.`,
    );
  }
  const now = new Date();
  const created = await ctx.orm.createRecordForService("integration.connector", {
    kind: input.kind,
    label: input.label,
    enabled: true,
    token_source: "unresolved",
    verify_status: "unverified",
    owner_id: ctx.ownerId,
    created_at: now,
    updated_at: now,
  });
  const scope = scopeOf(ctx, String(created.id));
  // A missing token is not a reason to refuse the row; the connector shows up
  // with an unresolved source and Verify explains what to do next.
  try {
    await stampCredential(ctx.orm, scope, await ctx.resolveToken());
  } catch (error) {
    if (!(error instanceof ConnectorCredentialError)) throw error;
    await ctx.orm.updateRecordsForService(
      "integration.connector",
      { id: String(created.id), owner_id: ctx.ownerId },
      { verify_status: "missing", updated_at: new Date() },
    );
  }
  await writeAudit(ctx.orm, scope, { action: "create", target: input.label });
  return { connector: await connectorDto(ctx, String(created.id)) };
}

export async function updateConnector(
  ctx: ConnectorContext,
  connectorId: string,
  body: Record<string, unknown>,
): Promise<ConnectorResponseDto> {
  const connector = await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  const values = parseConnectorUpdate(body);
  await ctx.orm.updateRecordsForService(
    "integration.connector",
    { id: connectorId, owner_id: ctx.ownerId },
    { ...values, updated_at: new Date() },
  );
  await writeAudit(ctx.orm, scopeOf(ctx, connectorId), {
    action: "update",
    target: String(connector.label ?? connectorId),
    detail: Object.keys(values).join(","),
  });
  return { connector: await connectorDto(ctx, connectorId) };
}

export async function deleteConnector(
  ctx: ConnectorContext,
  connectorId: string,
  body: Record<string, unknown>,
): Promise<{ deleted: boolean }> {
  const connector = await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  const label = String(connector.label ?? "");
  parseConfirm(body, "confirmLabel", label);
  // The mirror goes with the connector; the audit trail stays as evidence.
  await ctx.orm.deleteRecordsForService("cloudflare.record", {
    connector_id: connectorId,
    owner_id: ctx.ownerId,
  });
  await ctx.orm.deleteRecordsForService("cloudflare.zone", {
    connector_id: connectorId,
    owner_id: ctx.ownerId,
  });
  await ctx.orm.deleteForService("integration.connector", ctx.ownerId, connectorId);
  await writeAudit(ctx.orm, scopeOf(ctx, connectorId), {
    action: "delete_connector",
    target: label,
  });
  return { deleted: true };
}

export async function verifyConnector(
  ctx: ConnectorContext,
  connectorId: string,
): Promise<VerifyConnectorResponseDto> {
  const connector = await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  const scope = scopeOf(ctx, connectorId);
  const label = String(connector.label ?? connectorId);
  const probe = await attempt(
    ctx,
    scope,
    { action: "verify", target: label },
    async () => {
      const credential = await ctx.resolveToken();
      const client = createConnectorClient(credential, ctx.fetcher);
      const info = await client.verifyToken();
      const status: ConnectorVerifyStatus =
        info.status === "active" ? "ok" : "invalid";
      await stampCredential(ctx.orm, scope, credential, {
        verify_status: status,
        last_verify_at: new Date(),
      });
      return { info, credential, status };
    },
    { judgesToken: true },
  );
  await writeAudit(ctx.orm, scope, {
    action: "verify",
    target: label,
    outcome: probe.status === "ok" ? "ok" : "error",
    detail: `status=${probe.info.status} source=${probe.credential.source}`,
  });
  return {
    connector: await connectorDto(ctx, connectorId),
    message:
      probe.status === "ok"
        ? `Token aktif, sumber ${probe.credential.source}.`
        : `Cloudflare membalas dengan status '${probe.info.status}'.`,
  };
}

export async function syncConnectorNow(
  ctx: ConnectorContext,
  connectorId: string,
): Promise<SyncConnectorResponseDto> {
  const connector = await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  assertConnectorEnabled(connector);
  const scope = scopeOf(ctx, connectorId);
  const label = String(connector.label ?? connectorId);
  const run = await attempt(
    ctx,
    scope,
    { action: "sync", target: label },
    async () => {
      const credential = await ctx.resolveToken();
      const client = createConnectorClient(credential, ctx.fetcher);
      const result = await runCloudflareSync(ctx.orm, client, scope);
      await stampCredential(ctx.orm, scope, credential, {
        verify_status: "ok",
        last_verify_at: new Date(),
      });
      return { result, credential };
    },
    { judgesToken: true },
  );
  await writeAudit(ctx.orm, scope, {
    action: "sync",
    target: label,
    outcome: run.result.partial ? "error" : "ok",
    detail: `zones=${run.result.zones} records=${run.result.records} partial=${run.result.partial}`,
  });
  return {
    connector: await connectorDto(ctx, connectorId),
    zones: run.result.zones,
    records: run.result.records,
    partial: run.result.partial,
    incompleteZones: run.result.incompleteZones,
    message: run.result.partial
      ? `Sebagian tersinkron: ${run.result.zones} zone, ${run.result.records} record. Belum lengkap: ${
          run.result.incompleteZones.join(", ") || "-"
        }.`
      : `Tersinkron penuh: ${run.result.zones} zone, ${run.result.records} record.`,
  };
}

export async function listConnectorZones(
  ctx: ConnectorContext,
  connectorId: string,
): Promise<ZoneListResponseDto> {
  await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  const { rows } = await readMirror(ctx, "cloudflare.zone", connectorId);
  return { zones: rows.map(toZoneDto) };
}

export async function listConnectorRecords(
  ctx: ConnectorContext,
  connectorId: string,
  zoneId: string,
  filter: { name?: string | null; type?: string | null },
): Promise<RecordListResponseDto> {
  await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  const { rows, truncated } = await readMirror(
    ctx,
    "cloudflare.record",
    connectorId,
    { zone_id: zoneId },
  );
  const needle = (filter.name ?? "").trim().toLowerCase();
  const wantedType = (filter.type ?? "").trim().toUpperCase();
  const matched = rows.filter((row) => {
    if (wantedType && String(row.type) !== wantedType) return false;
    if (!needle) return true;
    return (
      String(row.name).toLowerCase().includes(needle) ||
      String(row.content).toLowerCase().includes(needle)
    );
  });
  const zone = await ctx.orm.findOneByService("cloudflare.zone", {
    connector_id: connectorId,
    owner_id: ctx.ownerId,
    external_id: zoneId,
  });
  return {
    records: matched.map(toRecordDto),
    zone: zone ? toZoneDto(zone) : null,
    truncated,
  };
}

export async function createConnectorRecord(
  ctx: ConnectorContext,
  connectorId: string,
  zoneId: string,
  body: Record<string, unknown>,
): Promise<RecordResponseDto> {
  const connector = await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  assertConnectorEnabled(connector);
  assertConnectorWritable(connector);
  const draft = parseRecordDraft(body);
  const scope = scopeOf(ctx, connectorId);
  const row = await attempt(ctx, scope, { action: "create", target: draft.name, zoneId }, async () => {
    const client = createConnectorClient(await ctx.resolveToken(), ctx.fetcher);
    return createDnsRecord(ctx.orm, client, { ...scope, zoneId }, draft);
  });
  await writeAudit(ctx.orm, scope, {
    action: "create",
    target: draft.name,
    zoneId,
    recordId: String(row.id),
  });
  return { record: toRecordDto(row) };
}

export async function updateConnectorRecord(
  ctx: ConnectorContext,
  connectorId: string,
  zoneId: string,
  recordId: string,
  body: Record<string, unknown>,
): Promise<RecordResponseDto> {
  const connector = await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  assertConnectorEnabled(connector);
  assertConnectorWritable(connector);
  const draft = parseRecordDraft(body);
  const scope = scopeOf(ctx, connectorId);
  const row = await attempt(
    ctx,
    scope,
    { action: "update", target: draft.name, zoneId, recordId },
    async () => {
      const client = createConnectorClient(await ctx.resolveToken(), ctx.fetcher);
      return updateDnsRecord(ctx.orm, client, { ...scope, zoneId }, recordId, draft);
    },
  );
  await writeAudit(ctx.orm, scope, {
    action: "update",
    target: draft.name,
    zoneId,
    recordId,
  });
  return { record: toRecordDto(row) };
}

export async function deleteConnectorRecord(
  ctx: ConnectorContext,
  connectorId: string,
  zoneId: string,
  recordId: string,
  body: Record<string, unknown>,
): Promise<{ deleted: boolean; name: string }> {
  const connector = await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  assertConnectorEnabled(connector);
  assertConnectorWritable(connector);
  const row = await ctx.orm.findOneByService("cloudflare.record", {
    id: recordId,
    connector_id: connectorId,
    owner_id: ctx.ownerId,
  });
  if (!row) {
    throw new QlNotFoundError("Record tidak ditemukan untuk akun ini.");
  }
  const name = String(row.name ?? "");
  parseConfirm(body, "confirmName", name);
  const scope = scopeOf(ctx, connectorId);
  const deletedName = await attempt(
    ctx,
    scope,
    { action: "delete", target: name, zoneId, recordId },
    async () => {
      const client = createConnectorClient(await ctx.resolveToken(), ctx.fetcher);
      return deleteDnsRecord(ctx.orm, client, { ...scope, zoneId }, recordId);
    },
  );
  await writeAudit(ctx.orm, scope, { action: "delete", target: deletedName, zoneId });
  return { deleted: true, name: deletedName };
}

export async function listConnectorAudit(
  ctx: ConnectorContext,
  connectorId: string,
): Promise<AuditListResponseDto> {
  await loadOwnedConnector(ctx.orm, ctx.ownerId, connectorId);
  const rows = await ctx.orm.findManyByService(
    "integration.audit",
    { connector_id: connectorId, owner_id: ctx.ownerId },
    {
      limit: AUDIT_PAGE_LIMIT,
      orderBy: { field: "created_at", direction: "desc" },
    },
  );
  return { entries: rows.map(toAuditDto) };
}
