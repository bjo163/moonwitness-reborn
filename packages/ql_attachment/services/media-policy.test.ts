import assert from "node:assert/strict";
import test from "node:test";
import { QlValidationError } from "ql_orm";
import {
  assertDeclaredType,
  assertKind,
  assertSizeAllowed,
  isInlineSafeMime,
  normalizeFilename,
  normalizeMimeType,
  reconcileDeclaredType,
  sniffMime,
} from "./media-policy.js";
import { MAX_ATTACHMENT_BYTES } from "./attachment-vocabulary.js";
import { MediaTypeRejectedError, PayloadTooLargeError } from "./errors.js";

function head(...bytes: readonly number[]): Uint8Array {
  return new Uint8Array(bytes);
}

void test("sniffMime identifies the containers the policy serves inline", () => {
  assert.equal(sniffMime(head(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  assert.equal(sniffMime(head(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(sniffMime(head(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)), "image/gif");
  assert.equal(sniffMime(head(0x25, 0x50, 0x44, 0x46, 0x2d)), "application/pdf");
  assert.equal(sniffMime(head(0x50, 0x4b, 0x03, 0x04)), "application/zip");
  assert.equal(sniffMime(head(0x1a, 0x45, 0xdf, 0xa3)), "video/webm");
  assert.equal(sniffMime(head(0x49, 0x44, 0x33, 0x04)), "audio/mpeg");
  assert.equal(sniffMime(head(0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70)), "video/mp4");
});

void test("sniffMime refuses to call a RIFF file a WEBP it is not", () => {
  const wav = head(0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45);
  assert.equal(sniffMime(wav), undefined);
  const webp = head(0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50);
  assert.equal(sniffMime(webp), "image/webp");
  assert.equal(sniffMime(head(0x52, 0x49, 0x46, 0x46)), undefined);
});

void test("sniffMime ignores short and unknown buffers", () => {
  assert.equal(sniffMime(head()), undefined);
  assert.equal(sniffMime(head(0x00, 0x01, 0x02)), undefined);
});

void test("only the inline-safe list may be served without a download disposition", () => {
  assert.equal(isInlineSafeMime("image/png"), true);
  assert.equal(isInlineSafeMime("APPLICATION/PDF"), true);
  // SVG and HTML-ish payloads can carry script, so they stay download-only.
  assert.equal(isInlineSafeMime("image/svg+xml"), false);
  assert.equal(isInlineSafeMime("text/html"), false);
  assert.equal(isInlineSafeMime("text/plain"), false);
});

void test("normalizeFilename removes path parts and header-breaking control characters", () => {
  assert.equal(normalizeFilename("C:\\Users\\me\\photo.png"), "photo.png");
  assert.equal(normalizeFilename("../../etc/passwd"), "passwd");
  assert.equal(normalizeFilename("a\r\nb"), "ab");
  assert.equal(normalizeFilename("   spaced   name  "), "spaced name");
  assert.equal(normalizeFilename("x".repeat(400)).length, 240);
  for (const rejected of ["", "   ", "///", 42, undefined]) {
    assert.throws(() => normalizeFilename(rejected), QlValidationError);
  }
});

void test("normalizeMimeType strips parameters and rejects junk", () => {
  assert.equal(normalizeMimeType("Image/PNG; charset=x"), "image/png");
  assert.equal(normalizeMimeType("application/pdf"), "application/pdf");
  for (const rejected of ["", "png", "a/b/c", "sp ace/type", undefined, 7]) {
    assert.throws(() => normalizeMimeType(rejected), QlValidationError);
  }
});

void test("kind and size limits are enforced per kind", () => {
  assert.equal(assertKind("media"), "media");
  assert.throws(() => assertKind("executable"), QlValidationError);
  assert.throws(() => assertKind(undefined), QlValidationError);
  assertSizeAllowed("document", 50 * 1024 * 1024);
  assert.throws(() => assertSizeAllowed("document", 51 * 1024 * 1024), PayloadTooLargeError);
  assert.throws(
    () => assertSizeAllowed("media", MAX_ATTACHMENT_BYTES + 1),
    PayloadTooLargeError,
  );
  assert.throws(() => assertSizeAllowed("media", 1.5), QlValidationError);
  assert.throws(() => assertSizeAllowed("media", -1), QlValidationError);
});

void test("assertDeclaredType restricts each kind to its allowlist", () => {
  assertDeclaredType("media", "video/mp4");
  assertDeclaredType("dataset", "application/x-ndjson");
  assert.throws(() => assertDeclaredType("document", "video/mp4"), MediaTypeRejectedError);
  assert.throws(() => assertDeclaredType("media", "text/html"), MediaTypeRejectedError);
});

void test("reconcileDeclaredType trusts the bytes over the declaration", () => {
  const png = head(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  assert.equal(reconcileDeclaredType("image/png", png), "image/png");
  assert.throws(
    () => reconcileDeclaredType("application/pdf", png),
    MediaTypeRejectedError,
  );
  // Unrecognisable containers keep the declared type rather than being guessed.
  assert.equal(reconcileDeclaredType("text/csv", head(0x61, 0x62)), "text/csv");
  assert.equal(reconcileDeclaredType("application/json", head()), "application/json");
});
