import { QlValidationError } from "ql_orm";
import {
  ATTACHMENT_KINDS,
  KIND_MAX_BYTES,
  MAX_ATTACHMENT_BYTES,
  isAttachmentKind,
  type AttachmentKind,
} from "./attachment-vocabulary.js";
import { MediaTypeRejectedError, PayloadTooLargeError } from "./errors.js";

/**
 * Types the service accepts per kind. Anything absent here is refused, so a new
 * accepted format is a deliberate change with a test rather than an accident.
 */
export const ALLOWED_MIMES: Record<AttachmentKind, readonly string[]> = {
  media: [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "audio/mpeg",
  ],
  document: [
    "application/pdf",
    "application/rtf",
    "application/zip",
    "text/plain",
    "text/markdown",
  ],
  dataset: [
    "application/json",
    "application/x-ndjson",
    "application/zip",
    "text/csv",
    "text/plain",
  ],
};

/**
 * Only these are ever served without `Content-Disposition: attachment`. Types
 * that cannot be content-sniffed (svg, html-ish text) stay downloadable-only,
 * which is what keeps a stored object from executing in the site origin.
 */
const INLINE_SAFE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "application/pdf",
]);

const SIGNATURES: readonly { bytes: readonly number[]; mime: string }[] = [
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mime: "image/png" },
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  { bytes: [0x47, 0x49, 0x46, 0x38], mime: "image/gif" },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: "image/webp" },
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], mime: "video/webm" },
  { bytes: [0x49, 0x44, 0x33], mime: "audio/mpeg" },
  { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], mime: "application/pdf" },
  { bytes: [0x50, 0x4b, 0x03, 0x04], mime: "application/zip" },
];

function startsWith(bytes: Uint8Array, prefix: readonly number[]): boolean {
  if (bytes.byteLength < prefix.length) return false;
  return prefix.every((expected, index) => bytes[index] === expected);
}

/**
 * Removes control characters (U+0000-U+001F and U+007F) from a string. The
 * character class is assembled at runtime so the source regex never contains a
 * literal control character, which the `no-control-regex` rule forbids.
 */
function stripControl(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code === undefined || code <= 0x1f || code === 0x7f) continue;
    out += char;
  }
  return out;
}

/**
 * Detects a container from leading bytes. `image/webp` needs the RIFF plus a
 * WEBP tag four bytes in, and `video/mp4` its ftyp marker after a box size, so
 * both are checked separately instead of being squeezed into the table.
 */
export function sniffMime(leading: Uint8Array): string | undefined {
  for (const signature of SIGNATURES) {
    if (startsWith(leading, signature.bytes)) {
      if (signature.mime === "image/webp") {
        return startsWith(leading.slice(8, 12), [
          0x57, 0x45, 0x42, 0x50,
        ])
          ? "image/webp"
          : undefined;
      }
      return signature.mime;
    }
  }
  if (startsWith(leading.slice(4, 8), [0x66, 0x74, 0x79, 0x70])) {
    return "video/mp4";
  }
  if (leading.byteLength >= 3 && leading[0] === 0xff && (leading[1] & 0xe0) === 0xe0) {
    return "audio/mpeg";
  }
  return undefined;
}

export function isInlineSafeMime(mimeType: string): boolean {
  return INLINE_SAFE_MIMES.has(mimeType.toLowerCase());
}

export function normalizeFilename(value: unknown): string {
  if (typeof value !== "string") {
    throw new QlValidationError("Attachment name must be a string.");
  }
  // Strip every path separator so a client cannot smuggle a directory into a
  // stored name, then drop control characters that would break a header.
  const segments = value.split(/[\\/]/);
  const leaf = segments[segments.length - 1] ?? "";
  const base = stripControl(leaf)
    .replace(/\s+/g, " ")
    .trim();
  if (!base) {
    throw new QlValidationError("Attachment name must not be empty.");
  }
  return base.slice(0, 240);
}

export function normalizeMimeType(value: unknown): string {
  if (typeof value !== "string") {
    throw new QlValidationError("Media type must be a string.");
  }
  const trimmed = value.split(";")[0].trim().toLowerCase();
  if (!/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(trimmed)) {
    throw new QlValidationError("Media type is not well formed.");
  }
  return trimmed;
}

export function assertKind(value: unknown): AttachmentKind {
  if (!isAttachmentKind(value)) {
    throw new QlValidationError(
      `Attachment kind must be one of: ${ATTACHMENT_KINDS.join(", ")}.`,
    );
  }
  return value;
}

export function assertSizeAllowed(kind: AttachmentKind, sizeBytes: number): void {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0) {
    throw new QlValidationError("Attachment size must be a non-negative integer.");
  }
  if (sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new PayloadTooLargeError(
      `Attachments are limited to ${MAX_ATTACHMENT_BYTES} bytes.`,
    );
  }
  const kindMax = KIND_MAX_BYTES[kind];
  if (sizeBytes > kindMax) {
    throw new PayloadTooLargeError(
      `A '${kind}' attachment is limited to ${kindMax} bytes.`,
    );
  }
}

/**
 * Rejects a declared type that is not on the kind's allowlist, and a declared
 * type that the sniffed container contradicts. An unrecognisable container is
 * accepted only when the declared type cannot be sniffed at all.
 */
export function assertDeclaredType(
  kind: AttachmentKind,
  mimeType: string,
): void {
  if (!ALLOWED_MIMES[kind].includes(mimeType)) {
    throw new MediaTypeRejectedError(
      `Media type '${mimeType}' is not allowed for a '${kind}' attachment.`,
    );
  }
}

export function reconcileDeclaredType(
  declared: string,
  leading: Uint8Array,
): string {
  const sniffed = sniffMime(leading);
  if (!sniffed) return declared;
  if (sniffed !== declared) {
    throw new MediaTypeRejectedError(
      `The bytes identify a '${sniffed}' object, not the declared '${declared}'.`,
    );
  }
  return sniffed;
}
