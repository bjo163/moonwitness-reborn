import { QlValidationError } from "ql_orm";
import type { AttachmentPolicy } from "./attachment-service.js";
import { MAX_CHUNK_BYTES, MIB, MIN_CHUNK_BYTES } from "./attachment-vocabulary.js";

const MAX_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_GIB = 1024 * MIB;

function parseBound(
  name: string,
  value: string | undefined,
  min: number,
  max: number,
): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value.trim());
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new QlValidationError(
      `${name} must be an integer between ${min} and ${max}.`,
    );
  }
  return parsed;
}

/**
 * Reads the deployment's attachment limits. Keys that are absent keep the
 * packaged defaults, so an unset variable never silently means "unlimited".
 */
export function attachmentPolicyFromEnv(
  env: Record<string, string | undefined>,
): Partial<AttachmentPolicy> {
  const chunkBytes = parseBound(
    "ATTACHMENT_CHUNK_BYTES",
    env.ATTACHMENT_CHUNK_BYTES,
    MIN_CHUNK_BYTES,
    MAX_CHUNK_BYTES,
  );
  const quotaBytes = parseBound(
    "ATTACHMENT_USER_QUOTA_BYTES",
    env.ATTACHMENT_USER_QUOTA_BYTES,
    MIB,
    MAX_GIB,
  );
  const minFreeBytes = parseBound(
    "ATTACHMENT_MIN_FREE_BYTES",
    env.ATTACHMENT_MIN_FREE_BYTES,
    0,
    MAX_GIB,
  );
  const uploadTtlMs = parseBound(
    "ATTACHMENT_UPLOAD_TTL_MS",
    env.ATTACHMENT_UPLOAD_TTL_MS,
    60 * 1000,
    MAX_TTL_MS,
  );
  return {
    ...(chunkBytes === undefined ? {} : { chunkBytes }),
    ...(quotaBytes === undefined ? {} : { quotaBytes }),
    ...(minFreeBytes === undefined ? {} : { minFreeBytes }),
    ...(uploadTtlMs === undefined ? {} : { uploadTtlMs }),
  };
}
