import assert from "node:assert/strict";
import test from "node:test";
import { QlValidationError } from "ql_orm";
import { DEFAULT_ATTACHMENT_POLICY } from "./attachment-service.js";
import { MAX_CHUNK_BYTES, MIB } from "./attachment-vocabulary.js";
import { attachmentPolicyFromEnv } from "./policy-env.js";

void test("an unset environment leaves every default intact", () => {
  assert.deepEqual(attachmentPolicyFromEnv({}), {});
  assert.deepEqual(
    attachmentPolicyFromEnv({
      ATTACHMENT_CHUNK_BYTES: "",
      ATTACHMENT_USER_QUOTA_BYTES: "  ",
    }),
    {},
  );
  assert.equal(DEFAULT_ATTACHMENT_POLICY.chunkBytes, 4 * MIB);
  assert.equal(DEFAULT_ATTACHMENT_POLICY.quotaBytes, 2 * 1024 * MIB);
});

void test("valid limits are applied without inventing the rest", () => {
  assert.deepEqual(
    attachmentPolicyFromEnv({
      ATTACHMENT_CHUNK_BYTES: String(MAX_CHUNK_BYTES),
      ATTACHMENT_UPLOAD_TTL_MS: "3600000",
    }),
    { chunkBytes: MAX_CHUNK_BYTES, uploadTtlMs: 3_600_000 },
  );
});

void test("a limit outside its bounds fails at boot instead of silently widening", () => {
  const rejects: Record<string, string>[] = [
    { ATTACHMENT_CHUNK_BYTES: "1024" },
    { ATTACHMENT_CHUNK_BYTES: String(MAX_CHUNK_BYTES + MIB) },
    { ATTACHMENT_CHUNK_BYTES: "4.5" },
    { ATTACHMENT_CHUNK_BYTES: "abc" },
    { ATTACHMENT_USER_QUOTA_BYTES: "0" },
    { ATTACHMENT_UPLOAD_TTL_MS: "999" },
    { ATTACHMENT_MIN_FREE_BYTES: "-1" },
  ];
  for (const env of rejects) {
    assert.throws(
      () => attachmentPolicyFromEnv(env),
      QlValidationError,
      Object.keys(env)[0],
    );
  }
});

void test("a headroom gate wider than any real volume is refused", () => {
  assert.throws(
    () =>
      attachmentPolicyFromEnv({
        ATTACHMENT_MIN_FREE_BYTES: String(2 * 1024 * MIB),
      }),
    /ATTACHMENT_MIN_FREE_BYTES/,
  );
});
