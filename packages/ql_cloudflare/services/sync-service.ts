import type { QlOrm, QlRecord } from "ql_orm";
import {
  MAX_PAGES,
  type CloudflareClient,
  type CloudflareDnsRecord,
  type CloudflareZoneSummary,
} from "./cloudflare-client.js";
import { normalizeName } from "./record-types.js";

export const SYNC_COOLDOWN_MS = 30_000;

export class ConnectorUnavailableError extends Error {
  readonly name = "ConnectorUnavailableError";
}

export class SyncCooldownError extends Error {
  readonly name = "SyncCooldownError";
  constructor(readonly retryAfterMs: number) {
    super("Sinkronisasi terakhir terlalu baru; tunggu sebelum mengulang.");
  }
}

export interface SyncResult {
  zones: number;
  records: number;
  partial: boolean;
  /** Zone names whose record pages could not be read, so their mirror may be stale. */
  incompleteZones: string[];
}

export interface SyncScope {
  connectorId: string;
  ownerId: string;
}

function asDate(value: string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function textOf(value: string | null | undefined, fallback = ""): string {
  return typeof value === "string" && value ? value : fallback;
}

async function upsertZone(
  orm: QlOrm,
  scope: SyncScope,
  zone: CloudflareZoneSummary,
  syncedAt: number,
): Promise<void> {
  const stamp = new Date(syncedAt);
  const values = {
    connector_id: scope.connectorId,
    external_id: zone.id,
    name: normalizeName(zone.name),
    account_id: textOf(zone.accountId),
    status: textOf(zone.status, "pending"),
    paused: zone.paused,
    stale: false,
    last_sync_at: stamp,
    updated_at: stamp,
  };
  const filter = {
    connector_id: scope.connectorId,
    owner_id: scope.ownerId,
    external_id: zone.id,
  };
  if (await orm.findOneByService("cloudflare.zone", filter)) {
    await orm.updateRecordsForService("cloudflare.zone", filter, values);
    return;
  }
  await orm.createRecordForService("cloudflare.zone", {
    ...values,
    owner_id: scope.ownerId,
    created_at: stamp,
  });
}

export async function upsertRecord(
  orm: QlOrm,
  scope: SyncScope,
  record: CloudflareDnsRecord,
  syncedAt: number,
): Promise<QlRecord> {
  const stamp = new Date(syncedAt);
  const values = {
    connector_id: scope.connectorId,
    zone_id: record.zoneId,
    external_id: record.id,
    name: normalizeName(record.name),
    type: record.type.toUpperCase(),
    content: record.content,
    ttl: record.ttl,
    proxied: record.proxied,
    comment: textOf(record.comment).slice(0, 500),
    managed: record.managed,
    remote_created_at: asDate(record.createdOn),
    stale: false,
    last_sync_at: stamp,
    updated_at: stamp,
  };
  const filter = {
    connector_id: scope.connectorId,
    owner_id: scope.ownerId,
    external_id: record.id,
  };
  if (await orm.findOneByService("cloudflare.record", filter)) {
    await orm.updateRecordsForService("cloudflare.record", filter, values);
  } else {
    await orm.createRecordForService("cloudflare.record", {
      ...values,
      owner_id: scope.ownerId,
      created_at: stamp,
    });
  }
  const stored = await orm.findOneByService("cloudflare.record", filter);
  if (!stored) {
    throw new Error("Record mirror tidak dapat dibaca kembali setelah sinkron.");
  }
  return stored;
}

async function collectAll<T>(
  first: Promise<{ items: T[]; page: number; totalPages: number }>,
  next: (page: number) => Promise<{ items: T[]; page: number; totalPages: number }>,
): Promise<{ items: T[]; partial: boolean }> {
  const initial = await first;
  const items = [...initial.items];
  const wanted = Math.max(initial.totalPages, 1);
  const capped = Math.min(wanted, MAX_PAGES);
  for (let page = initial.page + 1; page <= capped; page += 1) {
    const following = await next(page);
    items.push(...following.items);
  }
  return { items, partial: capped < wanted };
}

async function runSync(
  orm: QlOrm,
  client: CloudflareClient,
  scope: SyncScope,
  cooldownMs: number,
): Promise<SyncResult> {
  const connector = await orm.findOneByService("integration.connector", {
    id: scope.connectorId,
    owner_id: scope.ownerId,
  });
  if (!connector) {
    throw new ConnectorUnavailableError("Konektor tidak ditemukan untuk akun ini.");
  }
  if (connector.enabled !== true) {
    throw new ConnectorUnavailableError("Konektor dinonaktifkan; aktifkan sebelum sinkron.");
  }

  const now = Date.now();
  const lastSync = typeof connector.last_sync_at === "number" ? connector.last_sync_at : 0;
  if (cooldownMs > 0 && lastSync && now - lastSync < cooldownMs) {
    throw new SyncCooldownError(cooldownMs - (now - lastSync));
  }

  // Mark first so the sweep at the end can distinguish rows Cloudflare no longer reports.
  await orm.updateRecordsForService(
    "cloudflare.zone",
    { connector_id: scope.connectorId, owner_id: scope.ownerId },
    { stale: true },
  );
  await orm.updateRecordsForService(
    "cloudflare.record",
    { connector_id: scope.connectorId, owner_id: scope.ownerId },
    { stale: true },
  );

  const zones = await collectAll(
    client.listZones(),
    (page) => client.listZones({ page }),
  );

  let records = 0;
  let partial = zones.partial;
  const incompleteZones: string[] = [];
  for (const zone of zones.items) {
    if (!zone.id) continue;
    await upsertZone(orm, scope, zone, now);
    try {
      const paged = await collectAll(
        client.listRecords(zone.id),
        (page) => client.listRecords(zone.id, { page }),
      );
      for (const record of paged.items) {
        if (!record.id) continue;
        await upsertRecord(orm, scope, record, now);
        records += 1;
      }
      // A truncated page set leaves rows we cannot prove absent, so keep them.
      if (paged.partial) {
        partial = true;
        incompleteZones.push(zone.name);
      } else {
        await orm.deleteRecordsForService("cloudflare.record", {
          connector_id: scope.connectorId,
          owner_id: scope.ownerId,
          zone_id: zone.id,
          stale: true,
        });
      }
    } catch {
      partial = true;
      incompleteZones.push(zone.name);
    }
  }

  if (!partial) {
    await orm.deleteRecordsForService("cloudflare.record", {
      connector_id: scope.connectorId,
      owner_id: scope.ownerId,
      stale: true,
    });
    await orm.deleteRecordsForService("cloudflare.zone", {
      connector_id: scope.connectorId,
      owner_id: scope.ownerId,
      stale: true,
    });
  }

  await orm.updateRecordsForService(
    "integration.connector",
    { id: scope.connectorId, owner_id: scope.ownerId },
    {
      last_sync_at: new Date(now),
      last_sync_status: partial ? "partial" : "ok",
      updated_at: new Date(now),
    },
  );

  return { zones: zones.items.length, records, partial, incompleteZones };
}

const inFlight = new Map<string, Promise<SyncResult>>();

/** Single-flight per connector keeps a double click from doubling Cloudflare load. */
export function syncConnector(
  orm: QlOrm,
  client: CloudflareClient,
  scope: SyncScope,
  options: { cooldownMs?: number } = {},
): Promise<SyncResult> {
  const key = `${scope.ownerId}:${scope.connectorId}`;
  const running = inFlight.get(key);
  if (running) return running;
  const task = runSync(
    orm,
    client,
    scope,
    options.cooldownMs ?? SYNC_COOLDOWN_MS,
  ).finally(() => inFlight.delete(key));
  inFlight.set(key, task);
  return task;
}
