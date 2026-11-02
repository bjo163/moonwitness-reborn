import { randomUUID } from "node:crypto";

export class QlConfigurationError extends Error {}

export class QlStorageError extends Error {}

/**
 * Opaque, server-generated object location. User-supplied text never becomes a
 * key: filenames, mime types, and record ids stay in metadata columns.
 */
export type QlStorageKey = string;

const UUID_SOURCE = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const OBJECT_KEY_RE = new RegExp(`^ir/attachment/${UUID_SOURCE}$`);
const PART_KEY_RE = new RegExp(`^tmp/${UUID_SOURCE}/\\d{1,6}$`);

export function newStorageId(): string {
  return randomUUID();
}

export function attachmentKey(id: string): QlStorageKey {
  const key = `ir/attachment/${id}`;
  return assertQlStorageKey(key);
}

export function chunkKey(uploadId: string, index: number): QlStorageKey {
  if (!Number.isSafeInteger(index) || index < 0) {
    throw new QlStorageError(`Chunk index '${index}' is invalid.`);
  }
  const key = `tmp/${uploadId}/${index}`;
  return assertQlStorageKey(key);
}

export function assertQlStorageKey(key: string): QlStorageKey {
  if (!OBJECT_KEY_RE.test(key) && !PART_KEY_RE.test(key)) {
    throw new QlStorageError(`Storage key '${key}' is not an allowed shape.`);
  }
  return key;
}

const ALLOWED_PREFIXES = ["ir/attachment/", "tmp/"];

export function assertQlStoragePrefix(prefix: string): string {
  if (ALLOWED_PREFIXES.includes(prefix)) return prefix;
  const uploadPrefix = new RegExp(`^tmp/${UUID_SOURCE}/$`);
  if (uploadPrefix.test(prefix)) return prefix;
  throw new QlStorageError(`Storage prefix '${prefix}' is not an allowed shape.`);
}

/** Inclusive byte window, matching HTTP Range and `fs.createReadStream` semantics. */
export interface QlStorageRange {
  start?: number;
  end?: number;
}

export interface QlStorageStat {
  sizeBytes: number;
}

export interface QlStoredObject {
  key: QlStorageKey;
  sizeBytes: number;
  sha256: string;
}

export interface QlStorageSink {
  append(chunk: Uint8Array): Promise<void>;
  finish(): Promise<QlStoredObject>;
  abort(): Promise<void>;
}

/**
 * Byte storage seam. Deliberately stream-only: no method returns a whole
 * object, so a 500 MiB attachment cannot be pulled into memory by accident.
 */
export interface QlStorageDriver {
  readonly id: string;
  write(key: QlStorageKey): Promise<QlStorageSink>;
  read(key: QlStorageKey, range?: QlStorageRange): AsyncIterable<Uint8Array>;
  stat(key: QlStorageKey): Promise<QlStorageStat | undefined>;
  remove(key: QlStorageKey): Promise<boolean>;
  list(prefix: string): Promise<readonly QlStorageKey[]>;
  /**
   * Bytes the driver can still accept. Resolve `undefined` when the backend has
   * no known ceiling, which lets a quota gate skip itself rather than read
   * "unknown" as "full".
   */
  freeBytes(): Promise<number | undefined>;
}

export function normalizeRange(
  range: QlStorageRange | undefined,
  sizeBytes: number,
): Required<QlStorageRange> {
  const start = range?.start ?? 0;
  if (!Number.isSafeInteger(start) || start < 0) {
    throw new QlStorageError(`Range start '${start}' is invalid.`);
  }
  // Checked before the window comparison so a start past EOF reports as
  // unsatisfiable rather than as a malformed range.
  if (start >= sizeBytes) {
    throw new QlStorageError(`Range start '${start}' is beyond the object end.`);
  }
  const requestedEnd = range?.end ?? sizeBytes - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) {
    throw new QlStorageError(`Range end '${requestedEnd}' is invalid.`);
  }
  return { start, end: Math.min(requestedEnd, sizeBytes - 1) };
}
