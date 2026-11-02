import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  QlConfigurationError,
  QlStorageError,
  attachmentKey,
  assertQlStorageKey,
  assertQlStoragePrefix,
  chunkKey,
  createQlOrm,
  newStorageId,
  normalizeRange,
} from "./index.js";
import { LocalDiskStorageDriver } from "./storage-local.js";
import type { QlStorageSink } from "./storage.js";

async function withDriver(
  run: (driver: LocalDiskStorageDriver, dir: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "ql-storage-"));
  try {
    await run(new LocalDiskStorageDriver({ rootDir: dir }), dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function drain(
  sink: QlStorageSink,
  chunks: readonly Uint8Array[],
): Promise<void> {
  for (const chunk of chunks) {
    await sink.append(chunk);
  }
  await sink.finish();
}

async function readAll(
  source: AsyncIterable<Uint8Array>,
): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];
  for await (const chunk of source) {
    parts.push(chunk);
  }
  const total = parts.reduce((size, part) => size + part.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

function bytes(...values: readonly number[]): Uint8Array {
  return new Uint8Array(values);
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true });
  return entries.map(String);
}

const baseManifest = {
  name: "ql_base",
  version: "1.0.0",
  description: "Base",
  depends: [],
  models: [],
  access: [],
  views: [],
  data: [],
};

void test("storage keys accept only server-generated shapes", () => {
  const id = newStorageId();
  assert.equal(assertQlStorageKey(attachmentKey(id)), `ir/attachment/${id}`);
  assert.equal(assertQlStorageKey(chunkKey(id, 0)), `tmp/${id}/0`);
  for (const rejected of [
    "ir/attachment/../../etc/passwd",
    "ir/attachment/NOT-A-UUID",
    "/absolute/path",
    `tmp/${id}/..`,
    `tmp/${id}/0/extra`,
    `other/${id}`,
    "",
  ]) {
    assert.throws(() => assertQlStorageKey(rejected), QlStorageError);
  }
  assert.throws(() => chunkKey(id, -1), /index/);
  assert.throws(() => chunkKey(id, 1.5), /index/);
});

void test("storage prefixes are an explicit allowlist", () => {
  const id = newStorageId();
  assert.equal(assertQlStoragePrefix("ir/attachment/"), "ir/attachment/");
  assert.equal(assertQlStoragePrefix("tmp/"), "tmp/");
  assert.equal(assertQlStoragePrefix(`tmp/${id}/`), `tmp/${id}/`);
  for (const rejected of ["", "/", "ir/", `tmp/${id}`, "../", `x/${id}/`]) {
    assert.throws(() => assertQlStoragePrefix(rejected), QlStorageError);
  }
});

void test("range normalization clamps the end and rejects bad windows", () => {
  assert.deepEqual(normalizeRange(undefined, 100), { start: 0, end: 99 });
  assert.deepEqual(normalizeRange({ start: 10 }, 100), { start: 10, end: 99 });
  assert.deepEqual(normalizeRange({ start: 0, end: 999 }, 100), {
    start: 0,
    end: 99,
  });
  assert.deepEqual(normalizeRange({ start: 4, end: 4 }, 100), {
    start: 4,
    end: 4,
  });
  assert.throws(() => normalizeRange({ start: 100 }, 100), /beyond/);
  assert.throws(() => normalizeRange({ start: 9, end: 3 }, 100), /invalid/);
  assert.throws(() => normalizeRange({ start: -1 }, 100), /invalid/);
});

void test("local driver round-trips bytes and reports a real digest", async () => {
  await withDriver(async (driver) => {
    const key = attachmentKey(newStorageId());
    const parts = [bytes(1, 2, 3), bytes(250, 251, 252, 253)];
    const expected = bytes(1, 2, 3, 250, 251, 252, 253);
    const sink = await driver.write(key);
    for (const part of parts) {
      await sink.append(part);
    }
    const stored = await sink.finish();
    assert.equal(stored.key, key);
    assert.equal(stored.sizeBytes, expected.byteLength);
    assert.equal(
      stored.sha256,
      createHash("sha256").update(expected).digest("hex"),
    );
    assert.deepEqual(await readAll(driver.read(key)), expected);
    assert.deepEqual(
      await readAll(driver.read(key, { start: 1, end: 3 })),
      expected.slice(1, 4),
    );
    assert.deepEqual(await readAll(driver.read(key, { start: 4 })), expected.slice(4));
    assert.deepEqual(await driver.stat(key), { sizeBytes: expected.byteLength });
  });
});

void test("local driver publishes only on finish and leaves nothing on abort", async () => {
  await withDriver(async (driver, dir) => {
    const key = attachmentKey(newStorageId());
    const pending = await driver.write(key);
    await pending.append(bytes(7, 7, 7));
    // An un-finished sink is invisible at the final key: no half-written state.
    assert.equal(await driver.stat(key), undefined);
    await assert.rejects(() => readAll(driver.read(key)), QlStorageError);

    const aborted = await driver.write(key);
    await aborted.append(bytes(9));
    await aborted.abort();
    await aborted.abort();
    assert.equal(await driver.stat(key), undefined);
    await pending.abort();
    assert.deepEqual(
      (await listFiles(dir)).filter((name) => name.endsWith(".part")),
      [],
    );
    await drain(await driver.write(key), [bytes(1)]);
    assert.deepEqual(await readAll(driver.read(key)), bytes(1));
  });
});

void test("local driver tolerates a zero byte object", async () => {
  await withDriver(async (driver) => {
    const key = attachmentKey(newStorageId());
    const stored = await (await driver.write(key)).finish();
    assert.equal(stored.sizeBytes, 0);
    assert.equal(
      stored.sha256,
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    assert.deepEqual(await readAll(driver.read(key)), bytes());
    assert.deepEqual(await driver.stat(key), { sizeBytes: 0 });
  });
});

void test("concurrent writers to one key never interleave", async () => {
  await withDriver(async (driver) => {
    const key = attachmentKey(newStorageId());
    const first = await driver.write(key);
    const second = await driver.write(key);
    await drain(first, [bytes(1, 1, 1, 1)]);
    await drain(second, [bytes(2, 2)]);
    const body = await readAll(driver.read(key));
    const uniform = (value: number): boolean =>
      body.every((byte) => byte === value);
    assert.ok(uniform(1) || uniform(2), "published object mixes two writers");
    assert.equal(body.byteLength, uniform(1) ? 4 : 2);
  });
});

void test("list returns committed keys and skips scratch files", async () => {
  await withDriver(async (driver) => {
    const uploadId = newStorageId();
    await drain(await driver.write(chunkKey(uploadId, 0)), [bytes(1)]);
    await drain(await driver.write(chunkKey(uploadId, 1)), [bytes(2)]);
    const pending = await driver.write(chunkKey(uploadId, 2));
    await pending.append(bytes(3));
    const listed = await driver.list(`tmp/${uploadId}/`);
    assert.deepEqual(
      [...listed].sort(),
      [chunkKey(uploadId, 0), chunkKey(uploadId, 1)].sort(),
    );
    assert.deepEqual(await driver.list("tmp/"), listed);
    await pending.abort();
    assert.equal((await driver.list(`tmp/${uploadId}/`)).length, 2);
  });
});

void test("remove reports whether the key existed", async () => {
  await withDriver(async (driver) => {
    const key = attachmentKey(newStorageId());
    assert.equal(await driver.remove(key), false);
    await drain(await driver.write(key), [bytes(4)]);
    assert.equal(await driver.remove(key), true);
    assert.equal(await driver.stat(key), undefined);
    assert.equal(await driver.remove(key), false);
  });
});

void test("a driver rooted at the filesystem is refused", () => {
  assert.throws(
    () => new LocalDiskStorageDriver({ rootDir: "/" }),
    QlStorageError,
  );
});

void test("a sink cannot be reused after settling", async () => {
  await withDriver(async (driver) => {
    const sink = await driver.write(attachmentKey(newStorageId()));
    await sink.finish();
    await assert.rejects(() => sink.append(bytes(1)), QlStorageError);
    await assert.rejects(() => sink.finish(), QlStorageError);
  });
});

void test("orm.storage throws when no driver is installed", async () => {
  const bare = await createQlOrm("file::memory:", [baseManifest]);
  try {
    assert.throws(() => bare.orm.storage, QlConfigurationError);
  } finally {
    bare.close();
  }

  const dir = await mkdtemp(join(tmpdir(), "ql-storage-orm-"));
  try {
    const driver = new LocalDiskStorageDriver({ rootDir: dir });
    const wired = await createQlOrm("file::memory:", [baseManifest], {
      storage: driver,
    });
    try {
      assert.equal(wired.orm.storage, driver);
      assert.equal(wired.orm.storage.id, "local-disk");
    } finally {
      wired.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
