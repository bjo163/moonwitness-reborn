import {
  QlNotFoundError,
  QlValidationError,
  attachmentKey,
  chunkKey,
  newStorageId,
  normalizeRange,
  type QlOrm,
  type QlRecord,
  type QlStorageDriver,
  type QlStorageKey,
  type QlStorageRange,
  type QlUserContext,
} from "ql_orm";
import {
  ATTACHMENT_MODEL,
  DEFAULT_CHUNK_BYTES,
  DEFAULT_USER_QUOTA_BYTES,
  MIB,
  QUOTA_SCAN_ROWS,
  SHA256_HEX,
  UPLOAD_MODEL,
  UPLOAD_TTL_MS,
  chunkPlan,
  type AttachmentKind,
} from "./attachment-vocabulary.js";
import {
  IntegrityError,
  QuotaReachedError,
  StorageUnavailableError,
  UploadExpiredError,
  UploadStateError,
  PayloadTooLargeError,
} from "./errors.js";
import {
  assertDeclaredType,
  assertKind,
  assertSizeAllowed,
  normalizeFilename,
  normalizeMimeType,
  reconcileDeclaredType,
} from "./media-policy.js";

const SNIFF_WINDOW_BYTES = 32;
const MIN_FREE_BYTES_DEFAULT = 512 * MIB;

/** QlOrm validates a datetime as a Date or an ISO string, then stores epoch numbers. */
function stamp(value: number): Date {
  return new Date(value);
}

export interface AttachmentPolicy {
  readonly quotaBytes: number;
  readonly chunkBytes: number;
  readonly minFreeBytes: number;
  readonly uploadTtlMs: number;
}

export const DEFAULT_ATTACHMENT_POLICY: AttachmentPolicy = {
  quotaBytes: DEFAULT_USER_QUOTA_BYTES,
  chunkBytes: DEFAULT_CHUNK_BYTES,
  minFreeBytes: MIN_FREE_BYTES_DEFAULT,
  uploadTtlMs: UPLOAD_TTL_MS,
};

export interface AttachmentContext {
  readonly orm: QlOrm;
  readonly user: QlUserContext;
  readonly storage: QlStorageDriver;
  readonly policy: AttachmentPolicy;
  now(): number;
}

export interface CreateUploadInput {
  readonly name?: unknown;
  readonly mimeType?: unknown;
  readonly kind?: unknown;
  readonly sizeBytes?: unknown;
  readonly sha256?: unknown;
  readonly parentModel?: unknown;
  readonly parentRecordId?: unknown;
}

export interface UploadSessionView {
  readonly uploadId: string;
  readonly attachmentId: string;
  readonly chunkBytes: number;
  readonly totalChunks: number;
  readonly maxChunkBytes: number;
  readonly expectedBytes: number;
  readonly expiresAt: number;
}

export interface ChunkProgress {
  readonly receivedChunks: number;
  readonly receivedBytes: number;
  readonly totalChunks: number;
  readonly expectedBytes: number;
  readonly chunkBytes: number;
  /** Indices still absent, so a resumed client sends only what is missing. */
  readonly missingChunks: readonly number[];
}

const MISSING_REPORT_CAP = 2000;

export interface ContentWindow {
  readonly window: Required<QlStorageRange>;
  readonly body: AsyncIterable<Uint8Array>;
}

export interface ContentHandle {
  readonly record: QlRecord;
  readonly name: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly sha256: string | undefined;
  /**
   * Resolved after the caller has turned a wire Range into a window, so the
   * size used to validate the range is the same one the body is cut from.
   */
  read(range?: QlStorageRange): ContentWindow;
}

function optionalText(value: unknown, label: string, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new QlValidationError(`Field '${label}' must be a string of at most ${maxLength} characters.`);
  }
  return value.trim();
}

function optionalDigest(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !SHA256_HEX.test(value)) {
    throw new QlValidationError(`Field '${label}' must be 64 lowercase hex characters.`);
  }
  return value;
}

/** Drops every field the registry marks private before anything leaves the service. */
export function publicize(
  orm: QlOrm,
  modelName: string,
  record: QlRecord,
): QlRecord {
  const model = orm.registry.getModel(modelName);
  const view: QlRecord = {};
  for (const [name, value] of Object.entries(record)) {
    if (name !== "id" && model.fields[name]?.private) continue;
    view[name] = value;
  }
  return view;
}

function textField(record: QlRecord, name: string): string {
  const value = record[name];
  if (typeof value !== "string" || !value) {
    throw new QlValidationError(`Attachment field '${name}' is missing.`);
  }
  return value;
}

function numberField(record: QlRecord, name: string): number {
  const value = record[name];
  if (typeof value !== "number") {
    throw new QlValidationError(`Attachment field '${name}' is missing.`);
  }
  return value;
}

export function createAttachmentContext(
  orm: QlOrm,
  user: QlUserContext,
  overrides: {
    policy?: Partial<AttachmentPolicy>;
    storage?: QlStorageDriver;
    now?(): number;
  } = {},
): AttachmentContext {
  const now = overrides.now ?? Date.now;
  return {
    orm,
    user,
    storage: overrides.storage ?? orm.storage,
    policy: { ...DEFAULT_ATTACHMENT_POLICY, ...overrides.policy },
    now,
  };
}

async function findSession(
  ctx: AttachmentContext,
  uploadId: string,
): Promise<QlRecord> {
  const [session] = await ctx.orm.findManyByService(UPLOAD_MODEL, {
    id: uploadId,
    owner_id: ctx.user.id,
  });
  if (!session) {
    throw new QlNotFoundError("The upload session does not exist.");
  }
  return session;
}

function assertSessionLive(session: QlRecord, now: number): void {
  const state = session["state"];
  if (state !== "open" && state !== "assembling") {
    throw new UploadStateError();
  }
  const expiresAt = session["expires_at"];
  if (typeof expiresAt !== "number" || expiresAt <= now) {
    throw new UploadExpiredError();
  }
}

async function assertCapacity(
  ctx: AttachmentContext,
  incomingBytes: number,
): Promise<void> {
  const free = await ctx.storage.freeBytes();
  if (free === undefined) return;
  if (free < ctx.policy.minFreeBytes + incomingBytes) {
    throw new StorageUnavailableError();
  }
}

/**
 * Sums the largest rows the query window can reach. Because the read is ordered
 * by size descending, exceeding the quota here is always a true statement; a
 * full window simply cannot prove the owner is over.
 */
async function assertWithinQuota(
  ctx: AttachmentContext,
  incomingBytes: number,
): Promise<void> {
  const rows = await ctx.orm.findManyByService(
    ATTACHMENT_MODEL,
    { owner_id: ctx.user.id },
    { limit: QUOTA_SCAN_ROWS, orderBy: { field: "size_bytes", direction: "desc" } },
  );
  const used = rows
    .filter((row) => row["state"] !== "deleted")
    .reduce((total, row) => {
      const size = row["size_bytes"];
      return total + (typeof size === "number" ? size : 0);
    }, 0);
  if (used + incomingBytes > ctx.policy.quotaBytes) {
    throw new QuotaReachedError();
  }
}

export async function createUploadSession(
  ctx: AttachmentContext,
  input: CreateUploadInput,
): Promise<UploadSessionView> {
  const kind: AttachmentKind = assertKind(input.kind);
  const name = normalizeFilename(input.name);
  const mimeType = normalizeMimeType(input.mimeType);
  assertDeclaredType(kind, mimeType);
  const sizeBytes = input.sizeBytes;
  if (typeof sizeBytes !== "number") {
    throw new QlValidationError("Attachment size must be a number.");
  }
  assertSizeAllowed(kind, sizeBytes);
  const declaredSha256 = optionalDigest(input.sha256, "sha256");
  const parentModel = optionalText(input.parentModel, "parentModel", 120);
  const parentRecordId = optionalText(input.parentRecordId, "parentRecordId", 120);
  if ((parentModel === undefined) !== (parentRecordId === undefined)) {
    throw new QlValidationError(
      "parentModel and parentRecordId must be supplied together.",
    );
  }

  const now = ctx.now();
  await assertCapacity(ctx, sizeBytes);
  await assertWithinQuota(ctx, sizeBytes);

  // The blob location is generated here rather than derived from the row id,
  // because the column is required on insert and the row id does not exist yet.
  const storageKey = attachmentKey(newStorageId());
  const attachment = await ctx.orm.createForService(ATTACHMENT_MODEL, ctx.user.id, {
    name,
    kind,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    state: "uploading",
    driver: ctx.storage.id,
    storage_key: storageKey,
    ...(parentModel ? { parent_model: parentModel, parent_record_id: parentRecordId } : {}),
    created_at: stamp(now),
    updated_at: stamp(now),
  });
  const attachmentId = textField(attachment, "id");

  const { chunkBytes, totalChunks } = chunkPlan(sizeBytes, ctx.policy.chunkBytes);
  const session = await ctx.orm.createForService(UPLOAD_MODEL, ctx.user.id, {
    attachment_id: attachmentId,
    state: "open",
    chunk_size: chunkBytes,
    total_chunks: totalChunks,
    expected_bytes: sizeBytes,
    ...(declaredSha256 ? { declared_sha256: declaredSha256 } : {}),
    expires_at: stamp(now + ctx.policy.uploadTtlMs),
    created_at: stamp(now),
    updated_at: stamp(now),
  });

  return {
    uploadId: textField(session, "id"),
    attachmentId,
    chunkBytes,
    totalChunks,
    maxChunkBytes: chunkBytes,
    expectedBytes: sizeBytes,
    expiresAt: numberField(session, "expires_at"),
  };
}

function partIndex(key: QlStorageKey): number {
  const last = key.split("/").at(-1) ?? "";
  const parsed = Number(last);
  return Number.isSafeInteger(parsed) ? parsed : -1;
}

async function measureParts(
  ctx: AttachmentContext,
  session: QlRecord,
): Promise<ChunkProgress> {
  const uploadId = textField(session, "id");
  const totalChunks = numberField(session, "total_chunks");
  const chunkBytes = numberField(session, "chunk_size");
  const expectedBytes = numberField(session, "expected_bytes");
  const present = new Set(
    (await ctx.storage.list(`tmp/${uploadId}/`))
      .map(partIndex)
      .filter((index) => index >= 0),
  );

  const lastIndex = totalChunks - 1;
  let receivedBytes = 0;
  const missing: number[] = [];
  for (let index = 0; index < totalChunks; index += 1) {
    if (!present.has(index)) {
      if (missing.length < MISSING_REPORT_CAP) missing.push(index);
      continue;
    }
    if (index === lastIndex) {
      // Only the final chunk may be short, so it is the one worth a stat call.
      const stat = await ctx.storage.stat(chunkKey(uploadId, index));
      receivedBytes += stat?.sizeBytes ?? 0;
    } else {
      receivedBytes += chunkBytes;
    }
  }
  return {
    receivedChunks: present.size,
    receivedBytes,
    totalChunks,
    expectedBytes,
    chunkBytes,
    missingChunks: missing,
  };
}

export async function sessionProgress(
  ctx: AttachmentContext,
  uploadId: string,
): Promise<ChunkProgress> {
  const session = await findSession(ctx, uploadId);
  // Reporting on a closed, failed, or expired session would invite a client to
  // resume work the server has already abandoned.
  assertSessionLive(session, ctx.now());
  return measureParts(ctx, session);
}

export async function appendChunk(
  ctx: AttachmentContext,
  uploadId: string,
  index: number,
  source: AsyncIterable<Uint8Array>,
): Promise<ChunkProgress> {
  const session = await findSession(ctx, uploadId);
  assertSessionLive(session, ctx.now());
  const totalChunks = numberField(session, "total_chunks");
  const chunkBytes = numberField(session, "chunk_size");
  if (!Number.isSafeInteger(index) || index < 0 || index >= totalChunks) {
    throw new QlValidationError(
      `Chunk index '${index}' is outside 0..${Math.max(0, totalChunks - 1)}.`,
    );
  }

  const key = chunkKey(uploadId, index);
  const sink = await ctx.storage.write(key);
  const head: Uint8Array[] = [];
  let headLength = 0;
  let written = 0;
  try {
    for await (const chunk of source) {
      written += chunk.byteLength;
      if (written > chunkBytes) {
        throw new PayloadTooLargeError(
          `Chunk ${index} exceeds the negotiated ${chunkBytes} byte size.`,
        );
      }
      if (index === 0 && headLength < SNIFF_WINDOW_BYTES) {
        const sample = chunk.slice(0, SNIFF_WINDOW_BYTES - headLength);
        head.push(sample);
        headLength += sample.byteLength;
      }
      await sink.append(chunk);
    }
    // Rejecting a mislabelled container here, before the part is committed,
    // spares the client the rest of an upload that can never be accepted.
    if (index === 0 && headLength > 0) {
      const declared = await declaredMimeOf(ctx, session);
      reconcileDeclaredType(declared, concatBytes(head, headLength));
    }
    await sink.finish();
  } catch (error) {
    await sink.abort().catch(() => undefined);
    throw error;
  }

  return measureParts(ctx, session);
}

async function declaredMimeOf(
  ctx: AttachmentContext,
  session: QlRecord,
): Promise<string> {
  const [row] = await ctx.orm.findManyByService(ATTACHMENT_MODEL, {
    id: textField(session, "attachment_id"),
    owner_id: ctx.user.id,
  });
  if (!row) {
    throw new QlNotFoundError("The attachment for this upload no longer exists.");
  }
  return textField(row, "mime_type");
}

function concatBytes(
  parts: readonly Uint8Array[],
  length: number,
): Uint8Array {
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

async function removeParts(
  storage: QlStorageDriver,
  uploadId: string,
): Promise<number> {
  let removed = 0;
  for (const part of await storage.list(`tmp/${uploadId}/`)) {
    if (await storage.remove(part)) removed += 1;
  }
  return removed;
}

async function abandonSession(
  ctx: AttachmentContext,
  session: QlRecord,
  cause: unknown,
): Promise<never> {
  const uploadId = textField(session, "id");
  const attachmentId = textField(session, "attachment_id");
  const ownerId = textField(session, "owner_id");
  await ctx.orm.updateForService(UPLOAD_MODEL, ownerId, uploadId, {
    state: "failed",
    updated_at: stamp(ctx.now()),
  });
  await removeParts(ctx.storage, uploadId);
  const [row] = await ctx.orm.findManyByService(ATTACHMENT_MODEL, {
    id: attachmentId,
    owner_id: ownerId,
  });
  if (row) {
    // Assembly can succeed and then fail a digest check, so the object may
    // already exist. Deleting the row alone would strand those bytes forever.
    await ctx.storage.remove(textField(row, "storage_key"));
    await ctx.orm.deleteForService(ATTACHMENT_MODEL, ownerId, attachmentId);
  }
  throw cause;
}

export async function completeUpload(
  ctx: AttachmentContext,
  uploadId: string,
): Promise<QlRecord> {
  const session = await findSession(ctx, uploadId);
  assertSessionLive(session, ctx.now());
  const ownerId = textField(session, "owner_id");
  const attachmentId = textField(session, "attachment_id");
  const totalChunks = numberField(session, "total_chunks");
  const expectedBytes = numberField(session, "expected_bytes");
  const declared = optionalDigest(session["declared_sha256"], "declared_sha256");

  const [attachmentRow] = await ctx.orm.findManyByService(ATTACHMENT_MODEL, {
    id: attachmentId,
    owner_id: ownerId,
  });
  if (!attachmentRow) {
    throw new QlNotFoundError("The attachment for this upload no longer exists.");
  }
  const objectKey = textField(attachmentRow, "storage_key");
  const declaredType = textField(attachmentRow, "mime_type");

  const present = new Set(
    (await ctx.storage.list(`tmp/${uploadId}/`))
      .map(partIndex)
      .filter((index) => index >= 0),
  );
  const missing: number[] = [];
  for (let index = 0; index < totalChunks; index += 1) {
    if (!present.has(index)) missing.push(index);
  }
  const extra = [...present].filter((index) => index >= totalChunks).sort();
  if (missing.length > 0 || extra.length > 0) {
    throw new IntegrityError(
      `Upload is incomplete or misaligned (missing: ${clampList(missing)}, unexpected: ${clampList(extra)}).`,
    );
  }

  await ctx.orm.updateForService(ATTACHMENT_MODEL, ownerId, attachmentId, {
    state: "verifying",
    updated_at: stamp(ctx.now()),
  });
  await ctx.orm.updateForService(UPLOAD_MODEL, ownerId, uploadId, {
    state: "assembling",
    updated_at: stamp(ctx.now()),
  });

  let assembled;
  try {
    assembled = await assemble(ctx, uploadId, totalChunks, objectKey);
  } catch (error) {
    return abandonSession(ctx, session, error);
  }

  if (assembled.sizeBytes !== expectedBytes) {
    return abandonSession(
      ctx,
      session,
      new IntegrityError(
        `Assembled ${assembled.sizeBytes} bytes but expected ${expectedBytes}.`,
      ),
    );
  }
  if (declared && declared !== assembled.sha256) {
    return abandonSession(
      ctx,
      session,
      new IntegrityError("The assembled digest does not match the declared digest."),
    );
  }

  let mimeType: string;
  try {
    const head = await readHead(ctx, objectKey);
    mimeType = reconcileDeclaredType(declaredType, head);
  } catch (error) {
    return abandonSession(ctx, session, error);
  }

  await ctx.orm.updateForService(ATTACHMENT_MODEL, ownerId, attachmentId, {
    state: "ready",
    sha256: assembled.sha256,
    size_bytes: assembled.sizeBytes,
    mime_type: mimeType,
    uploaded_at: stamp(ctx.now()),
    updated_at: stamp(ctx.now()),
  });
  await ctx.orm.updateForService(UPLOAD_MODEL, ownerId, uploadId, {
    state: "closed",
    updated_at: stamp(ctx.now()),
  });
  await removeParts(ctx.storage, uploadId);

  const [ready] = await ctx.orm.findManyByService(ATTACHMENT_MODEL, {
    id: attachmentId,
    owner_id: ownerId,
  });
  if (!ready) {
    throw new QlNotFoundError("The completed attachment could not be loaded.");
  }
  return publicize(ctx.orm, ATTACHMENT_MODEL, ready);
}

function clampList(values: readonly number[]): string {
  return values.length <= 8 ? values.join(",") : `${values.slice(0, 8).join(",")}+${values.length - 8}`;
}

async function assemble(
  ctx: AttachmentContext,
  uploadId: string,
  totalChunks: number,
  objectKey: QlStorageKey,
) {
  const sink = await ctx.storage.write(objectKey);
  try {
    for (let index = 0; index < totalChunks; index += 1) {
      for await (const chunk of ctx.storage.read(chunkKey(uploadId, index))) {
        await sink.append(chunk);
      }
    }
    return await sink.finish();
  } catch (error) {
    await sink.abort().catch(() => undefined);
    await ctx.storage.remove(objectKey).catch(() => undefined);
    throw error;
  }
}

async function readHead(
  ctx: AttachmentContext,
  objectKey: QlStorageKey,
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];
  let length = 0;
  for await (const chunk of ctx.storage.read(objectKey, {
    start: 0,
    end: SNIFF_WINDOW_BYTES - 1,
  })) {
    const sample = chunk.slice(0, SNIFF_WINDOW_BYTES - length);
    parts.push(sample);
    length += sample.byteLength;
    if (length >= SNIFF_WINDOW_BYTES) break;
  }
  return concatBytes(parts, length);
}

export async function listAttachments(
  ctx: AttachmentContext,
  limit = 100,
): Promise<QlRecord[]> {
  const rows = await ctx.orm.findMany(ATTACHMENT_MODEL, ctx.user, { limit });
  return rows.filter((row) => row["state"] !== "deleted");
}

async function loadOwned(
  ctx: AttachmentContext,
  attachmentId: string,
): Promise<QlRecord> {
  const [row] = await ctx.orm.findManyByService(ATTACHMENT_MODEL, {
    id: attachmentId,
    owner_id: ctx.user.id,
  });
  if (!row) {
    throw new QlNotFoundError("Attachment not found.");
  }
  return row;
}

export async function getAttachment(
  ctx: AttachmentContext,
  attachmentId: string,
): Promise<QlRecord> {
  return publicize(ctx.orm, ATTACHMENT_MODEL, await loadOwned(ctx, attachmentId));
}

export async function openContent(
  ctx: AttachmentContext,
  attachmentId: string,
): Promise<ContentHandle> {
  const row = await loadOwned(ctx, attachmentId);
  if (textField(row, "state") !== "ready") {
    throw new UploadStateError("This attachment is not ready to be served.");
  }
  const objectKey = textField(row, "storage_key");
  const stat = await ctx.storage.stat(objectKey);
  if (!stat) {
    throw new QlNotFoundError("The stored bytes for this attachment are missing.");
  }
  if (stat.sizeBytes !== numberField(row, "size_bytes")) {
    throw new IntegrityError("The stored size differs from the recorded size.");
  }
  const sizeBytes = stat.sizeBytes;
  const sha256 = row["sha256"];
  return {
    record: publicize(ctx.orm, ATTACHMENT_MODEL, row),
    name: textField(row, "name"),
    mimeType: textField(row, "mime_type"),
    sizeBytes,
    sha256: typeof sha256 === "string" ? sha256 : undefined,
    read: (range) => {
      // A zero byte object has no addressable window; it reads back as nothing
      // rather than failing the range arithmetic.
      const window =
        sizeBytes === 0
          ? { start: 0, end: -1 }
          : normalizeRange(range, sizeBytes);
      return { window, body: ctx.storage.read(objectKey, window) };
    },
  };
}

export async function removeAttachment(
  ctx: AttachmentContext,
  attachmentId: string,
): Promise<boolean> {
  const row = await loadOwned(ctx, attachmentId);
  const ownerId = textField(row, "owner_id");
  const state = row["state"];
  if (state === "uploading" || state === "verifying") {
    const [session] = await ctx.orm.findManyByService(UPLOAD_MODEL, {
      attachment_id: attachmentId,
      owner_id: ownerId,
    });
    if (session) {
      await removeParts(ctx.storage, textField(session, "id"));
      await ctx.orm.updateForService(UPLOAD_MODEL, ownerId, textField(session, "id"), {
        state: "failed",
        updated_at: stamp(ctx.now()),
      });
    }
  }
  // Mark first: if the byte delete fails, the tombstone stays invisible and the
  // reaper retries it, instead of a silent half-delete.
  await ctx.orm.updateForService(ATTACHMENT_MODEL, ownerId, attachmentId, {
    state: "deleted",
    updated_at: stamp(ctx.now()),
  });
  const removed = await ctx.storage.remove(textField(row, "storage_key"));
  await ctx.orm.deleteForService(ATTACHMENT_MODEL, ownerId, attachmentId);
  return removed;
}

export interface ReapResult {
  readonly closedSessions: number;
  readonly removedObjects: number;
  readonly removedRows: number;
}

/**
 * Idempotent by necessity: without a transaction API an interrupted upload can
 * leave a session, parts, or a row behind, and a re-run must converge rather
 * than assume the previous pass finished.
 */
export async function reapExpiredUploads(
  orm: QlOrm,
  storage: QlStorageDriver,
  options: { now?: number } = {},
): Promise<ReapResult> {
  const now = options.now ?? Date.now();
  const stale: QlRecord[] = [];
  for (const state of ["open", "assembling"]) {
    for (const row of await orm.findManyByService(UPLOAD_MODEL, { state })) {
      const expiresAt = row["expires_at"];
      if (typeof expiresAt !== "number" || expiresAt <= now) {
        stale.push(row);
      }
    }
  }

  let closedSessions = 0;
  let removedObjects = 0;
  let removedRows = 0;
  for (const session of stale) {
    const uploadId = textField(session, "id");
    const ownerId = textField(session, "owner_id");
    removedObjects += await removeParts(storage, uploadId);
    await orm.updateForService(UPLOAD_MODEL, ownerId, uploadId, {
      state: "failed",
      updated_at: stamp(now),
    });
    closedSessions += 1;
    const [row] = await orm.findManyByService(ATTACHMENT_MODEL, {
      id: textField(session, "attachment_id"),
      owner_id: ownerId,
    });
    // A ready attachment keeps its bytes; only its session was left unclosed.
    if (row && row["state"] !== "ready") {
      if (await storage.remove(textField(row, "storage_key"))) removedObjects += 1;
      if (await orm.deleteForService(ATTACHMENT_MODEL, ownerId, textField(row, "id"))) {
        removedRows += 1;
      }
    }
  }

  const tombstones = await orm.findManyByService(ATTACHMENT_MODEL, {
    state: "deleted",
  });
  for (const row of tombstones) {
    const ownerId = textField(row, "owner_id");
    if (await storage.remove(textField(row, "storage_key"))) removedObjects += 1;
    if (await orm.deleteForService(ATTACHMENT_MODEL, ownerId, textField(row, "id"))) {
      removedRows += 1;
    }
  }

  return { closedSessions, removedObjects, removedRows };
}
