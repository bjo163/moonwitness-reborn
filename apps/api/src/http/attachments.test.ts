import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { apiRoutes, type CreateAttachmentUploadResponseDto } from "@moonwitness/moonclient";
import { createConversationStore } from "@moonwitness/database";
import { createQlOrm, type QlOrm } from "ql_orm";
import { LocalDiskStorageDriver } from "ql_orm/storage/local";
import attachmentManifest from "ql_attachment/__manifest__";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import { MIB } from "ql_attachment/services/attachment-vocabulary";
import { createApiServer } from "./server.js";

const testPassword = "correct-horse-battery";
const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PDF_HEAD = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const CHUNK_BYTES = 256 * 1024;

let server: Server;
let closeOrm: () => void;
let storageDir: string;
let address = "";
let ownerCookie = "";
let memberCookie = "";

function pngBody(size: number): Uint8Array {
  const body = new Uint8Array(size);
  body.set(PNG_HEAD);
  for (let offset = PNG_HEAD.byteLength; offset < size; offset += 1) {
    body[offset] = (offset * 31) % 256;
  }
  return body;
}

async function call(
  path: string,
  init: RequestInit = {},
  cookie = ownerCookie,
): Promise<Response> {
  return fetch(`${address}${path}`, {
    ...init,
    headers: { cookie, ...(init.headers ?? {}) },
  });
}

/**
 * Reads the body only when the status is wrong: asserting with
 * `await response.text()` as the message argument would consume every response.
 */
async function expectStatus(
  response: Response,
  expected: number,
  label: string,
): Promise<void> {
  if (response.status === expected) return;
  const detail = await response.text().catch(() => "");
  throw new Error(`${label}: expected ${expected}, got ${response.status} ${detail}`);
}

async function register(email: string): Promise<string> {
  const response = await fetch(`${address}${apiRoutes.auth.register}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Member", email, password: testPassword }),
  });
  assert.equal(response.status, 201);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

async function createSession(
  sizeBytes: number,
  options: { mimeType?: string; kind?: string; name?: string; sha256?: string } = {},
  cookie = ownerCookie,
): Promise<{
  uploadId: string;
  attachmentId: string;
  chunkBytes: number;
  totalChunks: number;
}> {
  const response = await call(apiRoutes.attachments.uploads, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: options.name ?? "clip.png",
      mimeType: options.mimeType ?? "image/png",
      kind: options.kind ?? "media",
      sizeBytes,
      ...(options.sha256 ? { sha256: options.sha256 } : {}),
    }),
  }, cookie);
  await expectStatus(response, 201, "create upload session");
  return await response.json() as CreateAttachmentUploadResponseDto;
}

async function putChunk(
  uploadId: string,
  index: number,
  body: Uint8Array,
  cookie = ownerCookie,
  contentType = "application/octet-stream",
): Promise<Response> {
  return call(
    apiRoutes.attachments.chunk(uploadId, index),
    { method: "PUT", headers: { "content-type": contentType }, body: new Uint8Array(body) },
    cookie,
  );
}

async function upload(
  body: Uint8Array,
  options: { mimeType?: string; kind?: string; name?: string; sha256?: string } = {},
  cookie = ownerCookie,
): Promise<string> {
  const session = await createSession(body.byteLength, options, cookie);
  let offset = 0;
  let index = 0;
  while (offset < body.byteLength) {
    const slice = body.slice(offset, offset + session.chunkBytes);
    const response = await putChunk(session.uploadId, index, slice, cookie);
    await expectStatus(response, 200, `upload chunk ${index}`);
    offset += slice.byteLength;
    index += 1;
  }
  const done = await call(apiRoutes.attachments.complete(session.uploadId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  }, cookie);
  await expectStatus(done, 200, "complete upload");
  const payload = (await done.json()) as { attachment: { id: string } };
  return payload.attachment.id;
}

before(async () => {
  storageDir = await mkdtemp(join(tmpdir(), "ql-api-attachments-"));
  const storage = new LocalDiskStorageDriver({ rootDir: storageDir });
  const runtime: { orm: QlOrm; close(): void } = await createQlOrm(
    "file::memory:",
    [baseManifest, authManifest, attachmentManifest],
    { storage },
  );
  const store = createConversationStore(runtime.orm);
  server = createApiServer(undefined, store, runtime.orm, {
    attachmentPolicy: { chunkBytes: CHUNK_BYTES },
  });
  closeOrm = runtime.close;
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const where = server.address() as AddressInfo;
  address = `http://127.0.0.1:${where.port}`;
  const setup = await fetch(`${address}${apiRoutes.auth.setup}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Owner",
      email: "owner-attachments@example.test",
      password: testPassword,
    }),
  });
  assert.equal(setup.status, 201);
  ownerCookie = (setup.headers.get("set-cookie") ?? "").split(";", 1)[0];
  memberCookie = await register("member-attachments@example.test");
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  closeOrm();
  await rm(storageDir, { recursive: true, force: true });
});

void test("attachment routes require a session", async () => {
  const anonymous = await call(apiRoutes.attachments.collection, {}, "");
  assert.equal(anonymous.status, 401);
  const chunk = await putChunk("upload-1", 0, PNG_HEAD, "");
  assert.equal(chunk.status, 401);
});

void test("an upload session reports a server-decided chunk plan", async () => {
  const session = await createSession(1_000_000);
  assert.equal(session.chunkBytes, CHUNK_BYTES);
  assert.equal(session.totalChunks, Math.ceil(1_000_000 / CHUNK_BYTES));
  assert.equal(typeof session.attachmentId, "string");
  assert.match(session.uploadId, /^[0-9a-f-]{36}$/);
});

void test("a chunk body must be octet-stream", async () => {
  const session = await createSession(1024);
  const response = await putChunk(session.uploadId, 0, PNG_HEAD, ownerCookie, "text/plain");
  assert.equal(response.status, 415);
});

void test("a chunk index beyond the plan is refused", async () => {
  const session = await createSession(1024);
  assert.equal(session.totalChunks, 1);
  const response = await putChunk(session.uploadId, 7, PNG_HEAD);
  assert.equal(response.status, 400);
});

void test("an incomplete upload cannot be completed over HTTP", async () => {
  const body = pngBody(CHUNK_BYTES * 3);
  const session = await createSession(body.byteLength);
  await putChunk(session.uploadId, 0, body.slice(0, CHUNK_BYTES));
  await putChunk(session.uploadId, 2, body.slice(CHUNK_BYTES * 2));
  const done = await call(apiRoutes.attachments.complete(session.uploadId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(done.status, 409);
  const payload = (await done.json()) as { code?: string; error: string };
  assert.equal(payload.code, "ATTACHMENT_INTEGRITY");
  assert.match(payload.error, /missing: 1/);
});

void test("a full upload is listed and served with byte-range support", async () => {
  const body = pngBody(40_000);
  const id = await upload(body);

  const list = await call(apiRoutes.attachments.collection);
  assert.equal(list.status, 200);
  const listed = (await list.json()) as {
    attachments: { id: string; state: string; sizeBytes: number }[];
  };
  const mine = listed.attachments.filter((entry) => entry.id === id);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].state, "ready");
  assert.equal(mine[0].sizeBytes, body.byteLength);

  const full = await call(apiRoutes.attachments.content(id));
  assert.equal(full.status, 200);
  assert.equal(full.headers.get("content-type"), "image/png");
  assert.equal(full.headers.get("accept-ranges"), "bytes");
  assert.equal(full.headers.get("x-content-type-options"), "nosniff");
  assert.equal(full.headers.get("content-length"), String(body.byteLength));
  assert.match(full.headers.get("content-disposition") ?? "", /^inline;/);
  assert.match(full.headers.get("etag") ?? "", /^"[0-9a-f]{64}"$/);
  assert.equal(full.headers.get("vary"), "Cookie");
  assert.deepEqual(new Uint8Array(await full.arrayBuffer()), body);

  const partial = await call(apiRoutes.attachments.content(id), {
    headers: { range: "bytes=8-15" },
  });
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get("content-range"), `bytes 8-15/${body.byteLength}`);
  assert.equal(partial.headers.get("content-length"), "8");
  assert.deepEqual(
    new Uint8Array(await partial.arrayBuffer()),
    body.slice(8, 16),
  );

  const openEnded = await call(apiRoutes.attachments.content(id), {
    headers: { range: "bytes=39992-" },
  });
  assert.equal(openEnded.status, 206);
  assert.equal(
    openEnded.headers.get("content-range"),
    `bytes 39992-${body.byteLength - 1}/${body.byteLength}`,
  );

  const suffix = await call(apiRoutes.attachments.content(id), {
    headers: { range: "bytes=-4" },
  });
  assert.equal(suffix.status, 206);
  assert.deepEqual(new Uint8Array(await suffix.arrayBuffer()), body.slice(-4));

  const impossible = await call(apiRoutes.attachments.content(id), {
    headers: { range: `bytes=${body.byteLength}-` },
  });
  assert.equal(impossible.status, 416);
  assert.equal(
    impossible.headers.get("content-range"),
    `bytes */${body.byteLength}`,
  );

  const garbage = await call(apiRoutes.attachments.content(id), {
    headers: { range: "bytes=abc" },
  });
  assert.equal(garbage.status, 200);
  await garbage.arrayBuffer();

  const head = await call(apiRoutes.attachments.content(id), { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("content-length"), String(body.byteLength));
  assert.equal((await head.arrayBuffer()).byteLength, 0);
});

void test("a type that cannot be shown safely is only downloadable", async () => {
  const zip = new Uint8Array(2_000);
  zip.set([0x50, 0x4b, 0x03, 0x04]);
  for (let offset = 4; offset < zip.byteLength; offset += 1) zip[offset] = offset % 251;
  const id = await upload(zip, {
    name: "bundle.zip",
    mimeType: "application/zip",
    kind: "dataset",
  });
  const response = await call(apiRoutes.attachments.content(id));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-disposition") ?? "", /^attachment;/);
});

void test("a stored filename cannot break out of the response header", async () => {
  const id = await upload(pngBody(1_024), { name: 'evil"\r\nx-evil: yes.png' });
  const response = await call(apiRoutes.attachments.content(id));
  const disposition = response.headers.get("content-disposition") ?? "";
  assert.equal(disposition.includes("\r"), false);
  assert.equal(disposition.includes("\n"), false);
  assert.match(disposition, /filename\*=UTF-8''/);
  // The path segment is decoded by fetch, so a smuggled header never lands.
  assert.equal(response.headers.get("x-evil"), null);
});

void test("no response ever carries the private storage key", async () => {
  const id = await upload(pngBody(1_024));
  const surfaces = await Promise.all([
    call(apiRoutes.attachments.collection).then((r) => r.text()),
    call(apiRoutes.attachments.item(id)).then((r) => r.text()),
  ]);
  for (const text of surfaces) {
    assert.equal(text.includes("storage_key"), false, text.slice(0, 200));
    assert.equal(text.includes("ir/attachment/"), false, text.slice(0, 200));
  }
});

void test("another member cannot see, serve, or delete the attachment", async () => {
  const body = pngBody(1_024);
  const id = await upload(body);

  assert.deepEqual(
    (await (await call(apiRoutes.attachments.collection, {}, memberCookie)).json()).attachments,
    [],
  );
  assert.equal((await call(apiRoutes.attachments.item(id), {}, memberCookie)).status, 404);
  assert.equal((await call(apiRoutes.attachments.content(id), {}, memberCookie)).status, 404);
  assert.equal(
    (await call(apiRoutes.attachments.item(id), { method: "DELETE" }, memberCookie)).status,
    404,
  );
  // The owner's copy is untouched by the failed probes.
  assert.equal((await call(apiRoutes.attachments.content(id))).status, 200);
});

void test("delete removes the record and the stored bytes", async () => {
  const body = pngBody(CHUNK_BYTES + 10);
  const id = await upload(body);
  const response = await call(apiRoutes.attachments.item(id), { method: "DELETE" });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deleted: true });
  assert.equal((await call(apiRoutes.attachments.item(id))).status, 404);
  const list = (await (await call(apiRoutes.attachments.collection)).json()) as {
    attachments: { id: string }[];
  };
  assert.equal(
    list.attachments.some((entry) => entry.id === id),
    false,
  );
});

void test("a declared digest that does not match is rejected at completion", async () => {
  const body = pngBody(1_024);
  const session = await createSession(body.byteLength, {
    sha256: createHash("sha256").update(pngBody(2_048)).digest("hex"),
  });
  await putChunk(session.uploadId, 0, body);
  const done = await call(apiRoutes.attachments.complete(session.uploadId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(done.status, 409);
  // Abandonment deletes the row outright, so a later read is a 404 rather than
  // a lingering record whose bytes never arrived.
  assert.equal(
    await call(apiRoutes.attachments.content(session.attachmentId)).then((r) => r.status),
    404,
  );
  const surfaces = (await (await call(apiRoutes.attachments.collection)).json()) as {
    attachments: { id: string }[];
  };
  assert.equal(
    surfaces.attachments.some((entry) => entry.id === session.attachmentId),
    false,
  );
});

void test("bytes that contradict the declared media type are refused early", async () => {
  const fake = new Uint8Array(1_024);
  fake.set(PDF_HEAD);
  const session = await createSession(fake.byteLength, { mimeType: "image/png" });
  const response = await putChunk(session.uploadId, 0, fake);
  assert.equal(response.status, 415);
});

void test("an unlisted media type is refused before any storage is used", async () => {
  const response = await call(apiRoutes.attachments.uploads, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "script.html",
      mimeType: "text/html",
      kind: "document",
      sizeBytes: 512,
    }),
  });
  assert.equal(response.status, 415);
});

void test("the JSON body cap still guards session creation", async () => {
  const response = await call(apiRoutes.attachments.uploads, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "x".repeat(80 * 1024),
      mimeType: "image/png",
      kind: "media",
      sizeBytes: 10,
    }),
  });
  assert.equal(response.status, 413);
});

void test("an upload far beyond the JSON body cap still completes intact", async () => {
  const body = pngBody(8 * MIB);
  const id = await upload(body);
  const served = await call(apiRoutes.attachments.content(id));
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-length"), String(body.byteLength));
  const bytes = new Uint8Array(await served.arrayBuffer());
  assert.deepEqual(bytes, body);
  const item = (await (await call(apiRoutes.attachments.item(id))).json()) as {
    attachment: { sha256?: string };
  };
  assert.equal(item.attachment.sha256, createHash("sha256").update(body).digest("hex"));
});

void test("an unknown upload field is rejected", async () => {
  const response = await call(apiRoutes.attachments.uploads, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "clip.png",
      mimeType: "image/png",
      kind: "media",
      sizeBytes: 10,
      storage_key: "ir/attachment/00000000-0000-4000-8000-000000000000",
    }),
  });
  assert.equal(response.status, 400);
});

void test("progress reporting lists the chunks a resumed client must still send", async () => {
  const body = pngBody(CHUNK_BYTES * 3);
  const session = await createSession(body.byteLength);
  await putChunk(session.uploadId, 0, body.slice(0, CHUNK_BYTES));
  await putChunk(session.uploadId, 2, body.slice(CHUNK_BYTES * 2));

  const first = await call(apiRoutes.attachments.progress(session.uploadId));
  assert.equal(first.status, 200);
  const progress = (await first.json()) as {
    receivedChunks: number;
    receivedBytes: number;
    totalChunks: number;
    missingChunks: number[];
  };
  assert.equal(progress.receivedChunks, 2);
  assert.equal(progress.totalChunks, 3);
  assert.deepEqual(progress.missingChunks, [1]);
  // Two chunks are stored; the gap at index 1 is not counted as received.
  assert.equal(progress.receivedBytes, CHUNK_BYTES * 2);

  // Sending only the missing index is enough to make the upload whole.
  await putChunk(session.uploadId, 1, body.slice(CHUNK_BYTES, CHUNK_BYTES * 2));
  const done = await call(apiRoutes.attachments.complete(session.uploadId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(done.status, 200);

  // A closed session has nothing left to report.
  const after = await call(apiRoutes.attachments.progress(session.uploadId));
  assert.equal(after.status, 409);

  const other = await call(
    apiRoutes.attachments.progress(session.uploadId),
    {},
    memberCookie,
  );
  assert.equal(other.status, 404);
});

void test("methods outside the attachment surface are not allowed", async () => {
  const session = await createSession(10);
  const cases: [string, RequestInit][] = [
    [apiRoutes.attachments.collection, { method: "POST" }],
    [apiRoutes.attachments.uploads, { method: "GET" }],
    [apiRoutes.attachments.chunk(session.uploadId, 0), { method: "GET" }],
    [apiRoutes.attachments.item(session.attachmentId), { method: "PATCH" }],
  ];
  for (const [path, init] of cases) {
    const response = await call(path, init);
    assert.equal(response.status, 405, `${init.method ?? "GET"} ${path}`);
  }
});
