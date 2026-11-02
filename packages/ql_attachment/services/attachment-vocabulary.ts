export const ATTACHMENT_MODEL = "ir.attachment";
export const UPLOAD_MODEL = "ir.attachment.upload";

export const ATTACHMENT_KINDS = ["media", "document", "dataset"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export const ATTACHMENT_STATES = [
  "uploading",
  "verifying",
  "ready",
  "deleted",
] as const;
export type AttachmentState = (typeof ATTACHMENT_STATES)[number];

export const UPLOAD_STATES = ["open", "assembling", "failed", "closed"] as const;
export type UploadState = (typeof UPLOAD_STATES)[number];

export const MIB = 1024 * 1024;

export const MIN_CHUNK_BYTES = 256 * 1024;
export const DEFAULT_CHUNK_BYTES = 4 * MIB;
export const MAX_CHUNK_BYTES = 8 * MIB;

/** Ceiling of the `size_bytes` column, so no record can claim more than it. */
export const MAX_ATTACHMENT_BYTES = 500 * MIB;

export const KIND_MAX_BYTES: Record<AttachmentKind, number> = {
  media: 500 * MIB,
  document: 50 * MIB,
  dataset: 500 * MIB,
};

export const UPLOAD_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Quota sums read at most this many rows, matching the hard window of
 * `findManyByService`. The query is ordered by `size_bytes desc`, so the sum is
 * a lower bound: exceeding it proves the owner is over quota, while an
 * unfinished window can never clear them.
 */
export const QUOTA_SCAN_ROWS = 500;

export const DEFAULT_USER_QUOTA_BYTES = 2 * 1024 * MIB;

export const SHA256_HEX = /^[a-f0-9]{64}$/;

export function isAttachmentKind(value: unknown): value is AttachmentKind {
  return (ATTACHMENT_KINDS as readonly unknown[]).includes(value);
}

export function chunkPlan(sizeBytes: number, chunkBytes: number): {
  chunkBytes: number;
  totalChunks: number;
} {
  return {
    chunkBytes,
    totalChunks:
      sizeBytes === 0 ? 0 : Math.ceil(sizeBytes / chunkBytes),
  };
}
