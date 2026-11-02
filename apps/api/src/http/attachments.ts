import { once } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  apiRoutes,
  type AttachmentDto,
  type CreateAttachmentUploadRequestDto,
  type CreateAttachmentUploadResponseDto,
} from "@moonwitness/moonclient";
import {
  QlValidationError,
  type QlOrm,
  type QlRecord,
  type QlUserContext,
} from "ql_orm";
import {
  appendChunk,
  completeUpload,
  createAttachmentContext,
  createUploadSession,
  getAttachment,
  listAttachments,
  openContent,
  removeAttachment,
  sessionProgress,
  type AttachmentPolicy,
  type UploadSessionView,
} from "ql_attachment/services/attachment-service";
import { isInlineSafeMime } from "ql_attachment/services/media-policy";
import { MAX_CHUNK_BYTES } from "ql_attachment/services/attachment-vocabulary";
import { RequestError, sendJson } from "./respond.js";

/**
 * Route shapes are derived from the shared route table so this file never
 * invents a second copy of an endpoint path. Each shape already carries its own
 * `$` end anchor.
 */
const attachmentRouteShapes = {
  collection: `${apiRoutes.attachments.collection}$`,
  uploads: `${apiRoutes.attachments.uploads}$`,
  chunkKey: `${apiRoutes.attachments.uploads}/([^/]+)/chunks/([^/]+)$`,
  progressKey: `${apiRoutes.attachments.uploads}/([^/]+)/progress$`,
  completeKey: `${apiRoutes.attachments.uploads}/([^/]+)/complete$`,
  contentKey: `${apiRoutes.attachments.prefix}([^/]+)/content$`,
  itemKey: `${apiRoutes.attachments.prefix}([^/]+)$`,
};

const attachmentRoutes = {
  collection: new RegExp(`^${attachmentRouteShapes.collection}`),
  uploads: new RegExp(`^${attachmentRouteShapes.uploads}`),
  chunk: new RegExp(`^${attachmentRouteShapes.chunkKey}`),
  progress: new RegExp(`^${attachmentRouteShapes.progressKey}`),
  complete: new RegExp(`^${attachmentRouteShapes.completeKey}`),
  content: new RegExp(`^${attachmentRouteShapes.contentKey}`),
  item: new RegExp(`^${attachmentRouteShapes.itemKey}`),
};

function segment(match: RegExpMatchArray, index: number): string {
  return decodeURIComponent(match[index] ?? "");
}

function requiredText(record: QlRecord, name: string): string {
  const value = record[name];
  if (typeof value !== "string" || !value) {
    throw new RequestError(`Attachment field '${name}' is missing.`, 500);
  }
  return value;
}

function epochToIso(value: unknown): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return new Date(value).toISOString();
}

export function toAttachmentDto(record: QlRecord): AttachmentDto {
  const kind = requiredText(record, "kind");
  const state = requiredText(record, "state");
  const sizeBytes = record["size_bytes"];
  const dto: AttachmentDto = {
    id: requiredText(record, "id"),
    name: requiredText(record, "name"),
    kind: kind as AttachmentDto["kind"],
    mimeType: requiredText(record, "mime_type"),
    sizeBytes: typeof sizeBytes === "number" ? sizeBytes : 0,
    state: state as AttachmentDto["state"],
    createdAt: epochToIso(record["created_at"]) ?? new Date(0).toISOString(),
    updatedAt: epochToIso(record["updated_at"]) ?? new Date(0).toISOString(),
  };
  const sha256 = record["sha256"];
  if (typeof sha256 === "string") dto.sha256 = sha256;
  const parentModel = record["parent_model"];
  if (typeof parentModel === "string") dto.parentModel = parentModel;
  const parentRecordId = record["parent_record_id"];
  if (typeof parentRecordId === "string") dto.parentRecordId = parentRecordId;
  const uploadedAt = epochToIso(record["uploaded_at"]);
  if (uploadedAt) dto.uploadedAt = uploadedAt;
  return dto;
}

function sessionDto(session: UploadSessionView): CreateAttachmentUploadResponseDto {
  return {
    uploadId: session.uploadId,
    attachmentId: session.attachmentId,
    chunkBytes: session.chunkBytes,
    totalChunks: session.totalChunks,
    maxChunkBytes: session.maxChunkBytes,
    expectedBytes: session.expectedBytes,
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}

const ATTR_CHAR = /^[a-zA-Z0-9!#$&^_.+~-]$/;

/** RFC 5987 encoding, so a stored filename cannot break out of the header. */
function encodeExtended(value: string): string {
  let out = "";
  for (const byte of new TextEncoder().encode(value)) {
    const character = String.fromCharCode(byte);
    out += ATTR_CHAR.test(character)
      ? character
      : `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  return out;
}

function asciiFallback(value: string): string {
  const stripped = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^ -~]/g, "_")
    .replace(/["\\]/g, "_");
  return stripped.slice(0, 120) || "download";
}

export function contentDisposition(
  inline: boolean,
  filename: string,
): string {
  return `${inline ? "inline" : "attachment"}; filename="${asciiFallback(filename)}"; filename*=UTF-8''${encodeExtended(filename)}`;
}

interface ByteWindow {
  readonly start?: number;
  readonly end?: number;
}

interface ParsedRange {
  readonly window: ByteWindow;
  readonly partial: boolean;
  readonly unsatisfiable: boolean;
}

/**
 * Only a single range is honoured. Anything else is treated as absent, which
 * HTTP permits and which keeps a byte-serving path from having to emit
 * multipart/byteranges.
 */
export function parseRange(
  header: string | undefined,
  sizeBytes: number,
): ParsedRange {
  if (!header) return { window: {}, partial: false, unsatisfiable: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) {
    return { window: {}, partial: false, unsatisfiable: false };
  }
  if (match[1] === "") {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) {
      return { window: {}, partial: false, unsatisfiable: true };
    }
    return {
      window: { start: Math.max(0, sizeBytes - suffix), end: sizeBytes - 1 },
      partial: sizeBytes > 0,
      unsatisfiable: sizeBytes === 0,
    };
  }
  const start = Number(match[1]);
  if (!Number.isSafeInteger(start) || start >= sizeBytes) {
    return { window: {}, partial: false, unsatisfiable: true };
  }
  const rawEnd = match[2] === "" ? sizeBytes - 1 : Number(match[2]);
  if (!Number.isSafeInteger(rawEnd) || rawEnd < start) {
    return { window: {}, partial: false, unsatisfiable: true };
  }
  return { window: { start, end: Math.min(rawEnd, sizeBytes - 1) }, partial: true, unsatisfiable: false };
}

async function jsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 64 * 1024) {
      throw new RequestError("Request body is too large.", 413);
    }
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new RequestError("Request body must be valid JSON.", 400);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new RequestError("Request body must be a JSON object.", 400);
  }
  return parsed as Record<string, unknown>;
}

function parseCreateUpload(body: Record<string, unknown>): CreateAttachmentUploadRequestDto {
  const known = new Set([
    "name",
    "mimeType",
    "kind",
    "sizeBytes",
    "sha256",
    "parentModel",
    "parentRecordId",
  ]);
  for (const key of Object.keys(body)) {
    if (!known.has(key)) {
      throw new RequestError(`Upload request contains an unknown field '${key}'.`, 400);
    }
  }
  const { name, mimeType, kind, sizeBytes } = body;
  if (typeof name !== "string" || typeof mimeType !== "string" || typeof kind !== "string") {
    throw new RequestError("Upload requires a name, a media type, and a kind.", 400);
  }
  if (typeof sizeBytes !== "number" || !Number.isSafeInteger(sizeBytes) || sizeBytes < 0) {
    throw new RequestError("Upload requires an integer sizeBytes.", 400);
  }
  const sha256 = body.sha256;
  if (sha256 !== undefined && typeof sha256 !== "string") {
    throw new RequestError("Upload sha256 must be a string.", 400);
  }
  const parentModel = body.parentModel;
  const parentRecordId = body.parentRecordId;
  if (
    (parentModel === undefined) !== (parentRecordId === undefined) ||
    (parentModel !== undefined && typeof parentModel !== "string") ||
    (parentRecordId !== undefined && typeof parentRecordId !== "string")
  ) {
    throw new RequestError(
      "parentModel and parentRecordId must be supplied together as strings.",
      400,
    );
  }
  return {
    name,
    mimeType,
    kind: kind as CreateAttachmentUploadRequestDto["kind"],
    sizeBytes,
    ...(typeof sha256 === "string" ? { sha256 } : {}),
    ...(typeof parentModel === "string" ? { parentModel } : {}),
    ...(typeof parentRecordId === "string" ? { parentRecordId } : {}),
  };
}

async function streamTo(
  response: ServerResponse,
  body: AsyncIterable<Uint8Array>,
): Promise<void> {
  for await (const chunk of body) {
    if (!response.write(chunk)) {
      await once(response, "drain");
    }
  }
  response.end();
}

async function handleChunk(
  ctx: ReturnType<typeof createAttachmentContext>,
  request: IncomingMessage,
  response: ServerResponse,
  uploadId: string,
  rawIndex: string,
): Promise<void> {
  const contentType = request.headers["content-type"];
  const rejectEarly = (error: unknown): never => {
    // Chunks are capped small, so draining the remainder is cheap and it lets
    // the client actually receive this status instead of a reset connection.
    request.resume();
    throw error;
  };
  if (contentType !== "application/octet-stream") {
    rejectEarly(new RequestError("Chunk bodies must be application/octet-stream.", 415));
  }
  const index = Number(rawIndex);
  if (!Number.isSafeInteger(index) || index < 0) {
    rejectEarly(new QlValidationError(`Chunk index '${rawIndex}' is not a valid position.`));
  }
  const declaredLength = Number(request.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_CHUNK_BYTES + 64 * 1024) {
    rejectEarly(new RequestError("Chunk is larger than the allowed maximum.", 413));
  }
  try {
    // The request stream is handed to the service as-is: nothing here buffers a
    // chunk, which is what keeps a large upload from becoming a large allocation.
    const progress = await appendChunk(ctx, uploadId, index, request);
    sendJson(response, 200, progress);
  } catch (error) {
    rejectEarly(error);
  }
}

async function handleContent(
  ctx: ReturnType<typeof createAttachmentContext>,
  request: IncomingMessage,
  response: ServerResponse,
  attachmentId: string,
): Promise<void> {
  const handle = await openContent(ctx, attachmentId);
  const etag = handle.sha256 ? `"${handle.sha256}"` : undefined;
  const baseHeaders: Record<string, string> = {
    "content-type": handle.mimeType,
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=300, must-revalidate",
    "x-content-type-options": "nosniff",
    vary: "Cookie",
    "content-disposition": contentDisposition(
      isInlineSafeMime(handle.mimeType),
      handle.name,
    ),
  };
  if (etag) baseHeaders.etag = etag;

  const ifRange = request.headers["if-range"];
  const rangeHonoured =
    typeof ifRange !== "string" || !etag || ifRange === etag;
  const parsed = rangeHonoured
    ? parseRange(request.headers.range, handle.sizeBytes)
    : { window: {}, partial: false, unsatisfiable: false } satisfies ParsedRange;

  if (parsed.unsatisfiable) {
    sendJson(
      response,
      416,
      { error: "Requested range is not satisfiable." },
      { "content-range": `bytes */${handle.sizeBytes}` },
    );
    return;
  }

  const { window, body } = handle.read(parsed.window);
  const partial = parsed.partial && handle.sizeBytes > 0;
  response.writeHead(partial ? 206 : 200, {
    ...baseHeaders,
    "content-length": String(
      partial ? window.end - window.start + 1 : handle.sizeBytes,
    ),
    ...(partial
      ? {
          "content-range": `bytes ${window.start}-${window.end}/${handle.sizeBytes}`,
        }
      : {}),
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  await streamTo(response, body);
}

export async function handleAttachmentRequest(
  request: IncomingMessage,
  response: ServerResponse,
  user: QlUserContext,
  orm: QlOrm,
  pathname: string,
  policy: Partial<AttachmentPolicy> = {},
): Promise<boolean> {
  const method = request.method ?? "GET";
  const ctx = createAttachmentContext(orm, user, { policy });

  if (attachmentRoutes.uploads.test(pathname)) {
    if (method !== "POST") return false;
    const session = await createUploadSession(
      ctx,
      parseCreateUpload(await jsonBody(request)),
    );
    sendJson(response, 201, sessionDto(session));
    return true;
  }

  const chunkMatch = pathname.match(attachmentRoutes.chunk);
  if (chunkMatch) {
    if (method !== "PUT") return false;
    await handleChunk(ctx, request, response, segment(chunkMatch, 1), segment(chunkMatch, 2));
    return true;
  }

  const progressMatch = pathname.match(attachmentRoutes.progress);
  if (progressMatch) {
    if (method !== "GET") return false;
    // A reload needs to learn which chunks the server already holds before it
    // sends anything, otherwise resuming would re-upload the whole file.
    sendJson(response, 200, await sessionProgress(ctx, segment(progressMatch, 1)));
    return true;
  }

  const completeMatch = pathname.match(attachmentRoutes.complete);
  if (completeMatch) {
    if (method !== "POST") return false;
    // Completion carries no fields, but the body is still read so the request
    // stream is consumed before the response is written.
    await jsonBody(request);
    const record = await completeUpload(ctx, segment(completeMatch, 1));
    sendJson(response, 200, { attachment: toAttachmentDto(record) });
    return true;
  }

  if (attachmentRoutes.collection.test(pathname)) {
    if (method !== "GET") return false;
    const records = await listAttachments(ctx);
    sendJson(response, 200, { attachments: records.map(toAttachmentDto) });
    return true;
  }

  const contentMatch = pathname.match(attachmentRoutes.content);
  if (contentMatch) {
    if (method !== "GET" && method !== "HEAD") return false;
    await handleContent(ctx, request, response, segment(contentMatch, 1));
    return true;
  }

  const itemMatch = pathname.match(attachmentRoutes.item);
  if (itemMatch) {
    const attachmentId = segment(itemMatch, 1);
    if (method === "GET") {
      sendJson(response, 200, { attachment: toAttachmentDto(await getAttachment(ctx, attachmentId)) });
      return true;
    }
    if (method === "DELETE") {
      sendJson(response, 200, { deleted: await removeAttachment(ctx, attachmentId) });
      return true;
    }
    return false;
  }

  return false;
}
