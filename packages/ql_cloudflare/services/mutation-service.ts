import type { QlOrm, QlRecord } from "ql_orm";
import type { CloudflareClient, RecordInput } from "./cloudflare-client.js";
import {
  ConnectorUnavailableError,
  upsertRecord,
  type SyncScope,
} from "./sync-service.js";
import { validateRecordCombination } from "./record-types.js";

export class RecordValidationError extends Error {
  readonly name = "RecordValidationError";
}

export interface RecordDraft {
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  comment?: string;
}

export interface ZoneScope extends SyncScope {
  /** Cloudflare zone identifier, not the local mirror row id. */
  zoneId: string;
}

async function requireZoneMirror(orm: QlOrm, scope: ZoneScope): Promise<QlRecord> {
  const zone = await orm.findOneByService("cloudflare.zone", {
    connector_id: scope.connectorId,
    owner_id: scope.ownerId,
    external_id: scope.zoneId,
  });
  if (!zone) {
    throw new ConnectorUnavailableError(
      "Zone belum tersinkron ke MoonWitness; jalankan sync lebih dulu.",
    );
  }
  return zone;
}

function toInput(draft: RecordDraft, zoneName: string): RecordInput {
  const problem = validateRecordCombination({
    name: draft.name,
    type: draft.type,
    content: draft.content,
    ttl: draft.ttl,
    proxied: draft.proxied,
    zoneName,
  });
  if (problem) throw new RecordValidationError(problem);
  return {
    name: draft.name,
    type: draft.type,
    content: draft.content,
    ttl: draft.ttl,
    proxied: draft.proxied,
    comment: draft.comment,
  };
}

export async function createDnsRecord(
  orm: QlOrm,
  client: CloudflareClient,
  scope: ZoneScope,
  draft: RecordDraft,
): Promise<QlRecord> {
  const zone = await requireZoneMirror(orm, scope);
  const input = toInput(draft, String(zone.name));
  const created = await client.createRecord(scope.zoneId, input);
  return upsertRecord(orm, scope, created, Date.now());
}

async function requireRecordMirror(
  orm: QlOrm,
  scope: ZoneScope,
  recordId: string,
): Promise<QlRecord> {
  const row = await orm.findOneByService("cloudflare.record", {
    connector_id: scope.connectorId,
    owner_id: scope.ownerId,
    id: recordId,
  });
  if (!row) {
    throw new ConnectorUnavailableError("Record tidak ditemukan untuk akun ini.");
  }
  if (row.managed === true) {
    throw new RecordValidationError(
      "Record ini dikelola layanan Cloudflare lain sehingga tidak bisa diubah dari sini.",
    );
  }
  return row;
}

export async function updateDnsRecord(
  orm: QlOrm,
  client: CloudflareClient,
  scope: ZoneScope,
  recordId: string,
  draft: RecordDraft,
): Promise<QlRecord> {
  const zone = await requireZoneMirror(orm, scope);
  const row = await requireRecordMirror(orm, scope, recordId);
  const input = toInput(draft, String(zone.name));
  const updated = await client.updateRecord(
    scope.zoneId,
    String(row.external_id),
    input,
  );
  return upsertRecord(orm, scope, updated, Date.now());
}

export async function deleteDnsRecord(
  orm: QlOrm,
  client: CloudflareClient,
  scope: ZoneScope,
  recordId: string,
): Promise<string> {
  const row = await requireRecordMirror(orm, scope, recordId);
  await client.deleteRecord(scope.zoneId, String(row.external_id));
  await orm.deleteForService("cloudflare.record", scope.ownerId, recordId);
  return String(row.name);
}
