import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  QlNotFoundError,
  QlValidationError,
  chunkKey,
  createQlOrm,
  type QlOrm,
  type QlUserContext,
} from "ql_orm";
import { LocalDiskStorageDriver } from "ql_orm/storage/local";
import { stubAddonManifest } from "ql_orm/testing";
import attachmentManifest from "../__manifest__.js";
import {
  appendChunk,
  completeUpload,
  createAttachmentContext,
  createUploadSession,
  getAttachment,
  listAttachments,
  openContent,
  reapExpiredUploads,
  removeAttachment,
  type AttachmentContext,
  type AttachmentPolicy,
  type UploadSessionView,
} from "./attachment-service.js";
import {
  IntegrityError,
  MediaTypeRejectedError,
  PayloadTooLargeError,
  QuotaReachedError,
  UploadExpiredError,
  UploadStateError,
} from "./errors.js";

const owner: QlUserContext = { id: "owner-1", groups: ["user"] };
const intruder: QlUserContext = { id: "owner-2", groups: ["user"] };
const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PDF_HEAD = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

interface Harness {
  orm: QlOrm;
  storage: LocalDiskStorageDriver;
  context(user?: QlUserContext): AttachmentContext;
}

function pngBody(size: number): Uint8Array {
  const body = new Uint8Array(Math.max(size, PNG_HEAD.byteLength));
  body.set(PNG_HEAD);
  for (let offset = PNG_HEAD.byteLength; offset < body.byteLength; offset += 1) {
    body[offset] = (offset * 7) % 251;
  }
  return body;
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function* asChunks(
  body: Uint8Array,
  size: number,
): AsyncGenerator<Uint8Array> {
  const empty = new Uint8Array(0);
  for (let offset = 0; offset < body.byteLength; offset += size) {
    yield body.slice(offset, offset + size);
  }
  await Promise.resolve(empty);
}

async function whole(
  source: AsyncIterable<Uint8Array>,
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];
  for await (const chunk of source) parts.push(chunk);
  const total = parts.reduce((size, part) => size + part.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

async function withHarness(
  run: (h: Harness) => Promise<void>,
  options: {
    clock?(): number;
    policy?: Partial<AttachmentPolicy>;
  } = {},
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "ql-attachment-"));
  const storage = new LocalDiskStorageDriver({ rootDir: dir });
  const runtime = await createQlOrm(
    "file::memory:",
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      attachmentManifest,
    ],
    { storage },
  );
  try {
    const policy: Partial<AttachmentPolicy> = { chunkBytes: 64, ...options.policy };
    await run({
      orm: runtime.orm,
      storage,
      context: (user = owner) =>
        createAttachmentContext(runtime.orm, user, { storage, policy, now: options.clock }),
    });
  } finally {
    runtime.close();
    await rm(dir, { recursive: true, force: true });
  }
}

async function openSession(
  h: Harness,
  body: Uint8Array,
  declared?: string,
): Promise<{ ctx: AttachmentContext; session: UploadSessionView }> {
  const ctx = h.context();
  const session = await createUploadSession(ctx, {
    name: "clip.png",
    mimeType: "image/png",
    kind: "media",
    sizeBytes: body.byteLength,
    sha256: declared ?? digest(body),
  });
  return { ctx, session };
}

async function uploadAll(
  ctx: AttachmentContext,
  session: UploadSessionView,
  body: Uint8Array,
  skip: readonly number[] = [],
): Promise<void> {
  let index = 0;
  for await (const chunk of asChunks(body, session.chunkBytes)) {
    if (!skip.includes(index)) {
      await appendChunk(ctx, session.uploadId, index, (async function* () {
        yield chunk;
        await Promise.resolve();
      })());
    }
    index += 1;
  }
}

void test("a chunked upload assembles, verifies, and flips to ready", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { ctx, session } = await openSession(h, body);
    assert.equal(session.totalChunks, 5);
    assert.equal(session.expectedBytes, 300);

    await uploadAll(ctx, session, body);
    const record = await completeUpload(ctx, session.uploadId);

    assert.equal(record["state"], "ready");
    assert.equal(record["size_bytes"], 300);
    assert.equal(record["sha256"], digest(body));
    assert.equal(record["mime_type"], "image/png");
    assert.equal(record["name"], "clip.png");
    assert.equal("storage_key" in record, false);
    assert.equal("owner_id" in record, false);

    const storedKeys = await h.storage.list("ir/attachment/");
    assert.equal(storedKeys.length, 1, "exactly one object should be published");
    const stored = await whole(h.storage.read(storedKeys[0]));
    assert.deepEqual(stored, body);
    assert.equal((await h.storage.list(`tmp/${session.uploadId}/`)).length, 0);

    const listed = await listAttachments(ctx);
    assert.equal(listed.length, 1);
    assert.equal("storage_key" in listed[0], false);
  });
});

void test("progress is measured from stored parts, not from a counter", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { ctx, session } = await openSession(h, body);

    const first = await appendChunk(ctx, session.uploadId, 0, asChunks(body.slice(0, 64), 64));
    assert.equal(first.receivedChunks, 1);
    assert.equal(first.receivedBytes, 64);

    // Re-sending a chunk the server already has must not double-count it.
    const again = await appendChunk(ctx, session.uploadId, 0, asChunks(body.slice(0, 64), 64));
    assert.equal(again.receivedChunks, 1);

    const last = await appendChunk(
      ctx,
      session.uploadId,
      4,
      asChunks(body.slice(256), 64),
    );
    assert.equal(last.receivedChunks, 2);
    assert.equal(last.receivedBytes, 64 + 44, "only the final chunk may be short");
  });
});

void test("a missing chunk blocks completion and stays recoverable", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { ctx, session } = await openSession(h, body);
    await uploadAll(ctx, session, body, [2]);

    await assert.rejects(
      () => completeUpload(ctx, session.uploadId),
      (error: unknown) =>
        error instanceof IntegrityError && /missing: 2/.test(error.message),
    );
    // Nothing was published and nothing was destroyed by the failed attempt.
    assert.equal((await h.storage.list("ir/attachment/")).length, 0);
    const pending = await getAttachment(ctx, session.attachmentId);
    assert.equal(pending["state"], "uploading");

    await appendChunk(ctx, session.uploadId, 2, asChunks(body.slice(128, 192), 64));
    const record = await completeUpload(ctx, session.uploadId);
    assert.equal(record["state"], "ready");
  });
});

void test("an oversized chunk is refused and leaves no orphan part", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { ctx, session } = await openSession(h, body);
    await assert.rejects(
      () => appendChunk(ctx, session.uploadId, 1, asChunks(body.slice(0, 200), 200)),
      PayloadTooLargeError,
    );
    assert.equal(await h.storage.stat(chunkKey(session.uploadId, 1)), undefined);
    assert.equal((await h.storage.list(`tmp/${session.uploadId}/`)).length, 0);
  });
});

void test("a chunk index outside the plan is refused", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { ctx, session } = await openSession(h, body);
    for (const index of [5, 99, -1, 1.5]) {
      await assert.rejects(
        () => appendChunk(ctx, session.uploadId, index, asChunks(body.slice(0, 8), 8)),
        QlValidationError,
      );
    }
  });
});

void test("a wrong declared digest discards the object, parts, and row", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { ctx, session } = await openSession(h, body, digest(pngBody(301)));
    await uploadAll(ctx, session, body);

    await assert.rejects(
      () => completeUpload(ctx, session.uploadId),
      (error: unknown) =>
        error instanceof IntegrityError && /declared digest/.test(error.message),
    );
    assert.equal((await h.storage.list("ir/attachment/")).length, 0);
    assert.equal((await h.storage.list(`tmp/${session.uploadId}/`)).length, 0);
    await assert.rejects(() => getAttachment(ctx, session.attachmentId), QlNotFoundError);
    assert.deepEqual(await listAttachments(ctx), []);
  });
});

void test("bytes that contradict the declared type are rejected on the first chunk", async () => {
  await withHarness(async (h) => {
    const fake = new Uint8Array(300);
    fake.set(PDF_HEAD);
    const ctx = h.context();
    const session = await createUploadSession(ctx, {
      name: "actually-a-pdf.png",
      mimeType: "image/png",
      kind: "media",
      sizeBytes: fake.byteLength,
    });
    await assert.rejects(
      () => appendChunk(ctx, session.uploadId, 0, asChunks(fake.slice(0, 64), 64)),
      MediaTypeRejectedError,
    );
    assert.equal((await h.storage.list(`tmp/${session.uploadId}/`)).length, 0);
  });
});

void test("another user cannot touch an upload or the resulting attachment", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { session } = await openSession(h, body);
    const attacker = h.context(intruder);

    await assert.rejects(
      () => appendChunk(attacker, session.uploadId, 0, asChunks(body.slice(0, 64), 64)),
      QlNotFoundError,
    );
    await assert.rejects(
      () => completeUpload(attacker, session.uploadId),
      QlNotFoundError,
    );
    await assert.rejects(
      () => getAttachment(attacker, session.attachmentId),
      QlNotFoundError,
    );
    await assert.rejects(
      () => openContent(attacker, session.attachmentId),
      QlNotFoundError,
    );
    await assert.rejects(
      () => removeAttachment(attacker, session.attachmentId),
      QlNotFoundError,
    );
    assert.deepEqual(await listAttachments(attacker), []);
    assert.equal((await h.storage.list("ir/attachment/")).length, 0);
  });
});

void test("an unfinished attachment is never served", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { ctx, session } = await openSession(h, body);
    await uploadAll(ctx, session, body);
    await assert.rejects(
      () => openContent(ctx, session.attachmentId),
      UploadStateError,
    );
  });
});

void test("content serving honours byte windows", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { ctx, session } = await openSession(h, body);
    await uploadAll(ctx, session, body);
    await completeUpload(ctx, session.uploadId);

    const handle = await openContent(ctx, session.attachmentId);
    assert.equal(handle.sizeBytes, 300);
    assert.equal(handle.sha256, digest(body));
    assert.deepEqual(handle.read().window, { start: 0, end: 299 });
    assert.deepEqual(await whole(handle.read().body), body);

    const partial = handle.read({ start: 8, end: 15 });
    assert.deepEqual(partial.window, { start: 8, end: 15 });
    assert.deepEqual(await whole(partial.body), body.slice(8, 16));

    assert.deepEqual(await whole(handle.read({ start: 296 }).body), body.slice(296));
    assert.throws(() => handle.read({ start: 400 }), /beyond/);
  });
});

void test("a zero byte attachment completes and reads back empty", async () => {
  await withHarness(async (h) => {
    const ctx = h.context();
    const session = await createUploadSession(ctx, {
      name: "empty.png",
      mimeType: "image/png",
      kind: "media",
      sizeBytes: 0,
    });
    assert.equal(session.totalChunks, 0);
    const record = await completeUpload(ctx, session.uploadId);
    assert.equal(record["state"], "ready");
    assert.equal(record["size_bytes"], 0);
    const content = await openContent(ctx, session.attachmentId);
    assert.deepEqual(content.read().window, { start: 0, end: -1 });
    assert.deepEqual(await whole(content.read().body), new Uint8Array());
  });
});

void test("an expired session refuses further chunks", async () => {
  const clock = { current: 1_000 };
  await withHarness(
    async (h) => {
      const body = pngBody(300);
      const { ctx, session } = await openSession(h, body);
      await appendChunk(ctx, session.uploadId, 0, asChunks(body.slice(0, 64), 64));
      clock.current = 1_000 + 7 * 60 * 60 * 1000;
      await assert.rejects(
        () => appendChunk(ctx, session.uploadId, 1, asChunks(body.slice(64, 128), 64)),
        UploadExpiredError,
      );
      await assert.rejects(
        () => completeUpload(ctx, session.uploadId),
        UploadExpiredError,
      );
    },
    { clock: () => clock.current },
  );
});

void test("the reaper closes expired uploads and clears their bytes", async () => {
  const clock = { current: 1_000 };
  await withHarness(
    async (h) => {
      const body = pngBody(300);
      const { ctx, session } = await openSession(h, body);
      await uploadAll(ctx, session, body, [4]);

      const later = 1_000 + 7 * 60 * 60 * 1000;
      const result = await reapExpiredUploads(h.orm, h.storage, { now: later });
      assert.equal(result.closedSessions, 1);
      assert.equal(result.removedObjects, 4);
      assert.equal(result.removedRows, 1);
      assert.equal((await h.storage.list(`tmp/${session.uploadId}/`)).length, 0);
      assert.equal((await h.storage.list("ir/attachment/")).length, 0);
      await assert.rejects(() => getAttachment(ctx, session.attachmentId), QlNotFoundError);

      // A second pass must converge to no work rather than reporting ghosts.
      const again = await reapExpiredUploads(h.orm, h.storage, { now: later });
      assert.deepEqual(again, { closedSessions: 0, removedObjects: 0, removedRows: 0 });
    },
    { clock: () => clock.current },
  );
});

void test("the reaper keeps the bytes of an attachment that is already ready", async () => {
  const clock = { current: 1_000 };
  await withHarness(
    async (h) => {
      const body = pngBody(300);
      const { ctx, session } = await openSession(h, body);
      await uploadAll(ctx, session, body);
      await completeUpload(ctx, session.uploadId);

      const result = await reapExpiredUploads(h.orm, h.storage, {
        now: 1_000 + 7 * 60 * 60 * 1000,
      });
      // The session closed on completion, so a reaper pass must not find it at
      // all, let alone reclaim the bytes it points at.
      assert.deepEqual(result, { closedSessions: 0, removedObjects: 0, removedRows: 0 });
      assert.equal((await h.storage.list("ir/attachment/")).length, 1);
      assert.equal((await listAttachments(ctx)).length, 1);
    },
    { clock: () => clock.current },
  );
});

void test("quota accounting refuses an upload that cannot fit", async () => {
  await withHarness(
    async (h) => {
      const ctx = h.context();
      await assert.rejects(
        () =>
          createUploadSession(ctx, {
            name: "big.png",
            mimeType: "image/png",
            kind: "media",
            sizeBytes: 300,
          }),
        QuotaReachedError,
      );
      // A refusal must not leave a half-created row behind.
      assert.deepEqual(await listAttachments(ctx), []);
    },
    { policy: { quotaBytes: 200 } },
  );
});

void test("removing an attachment drops both the row and the bytes", async () => {
  await withHarness(async (h) => {
    const body = pngBody(300);
    const { ctx, session } = await openSession(h, body);
    await uploadAll(ctx, session, body);
    await completeUpload(ctx, session.uploadId);

    const [published] = await h.storage.list("ir/attachment/");
    assert.equal(typeof published, "string");
    assert.equal(await removeAttachment(ctx, session.attachmentId), true);
    assert.equal(await h.storage.stat(published), undefined);
    assert.equal((await h.storage.list("ir/attachment/")).length, 0);
    await assert.rejects(() => getAttachment(ctx, session.attachmentId), QlNotFoundError);
    assert.deepEqual(await listAttachments(ctx), []);
    await assert.rejects(
      () => removeAttachment(ctx, session.attachmentId),
      QlNotFoundError,
    );
  });
});

void test("a disallowed media type for the kind is refused before any storage", async () => {
  await withHarness(async (h) => {
    const ctx = h.context();
    await assert.rejects(
      () =>
        createUploadSession(ctx, {
          name: "page.html",
          mimeType: "text/html",
          kind: "document",
          sizeBytes: 1024,
        }),
      MediaTypeRejectedError,
    );
    assert.deepEqual(await listAttachments(ctx), []);
    assert.equal((await h.storage.list("ir/attachment/")).length, 0);
  });
});

void test("parent links must be supplied as a pair", async () => {
  await withHarness(async (h) => {
    const ctx = h.context();
    await assert.rejects(
      () =>
        createUploadSession(ctx, {
          name: "clip.png",
          mimeType: "image/png",
          kind: "media",
          sizeBytes: 64,
          parentModel: "corpus.edition",
        }),
      QlValidationError,
    );
    const session = await createUploadSession(ctx, {
      name: "clip.png",
      mimeType: "image/png",
      kind: "media",
      sizeBytes: 64,
      parentModel: "corpus.edition",
      parentRecordId: "edition-1",
    });
    const record = await getAttachment(ctx, session.attachmentId);
    assert.equal(record["parent_model"], "corpus.edition");
    assert.equal(record["parent_record_id"], "edition-1");
  });
});
