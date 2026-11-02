import { createHash, randomUUID } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  mkdirSync,
  type WriteStream,
} from "node:fs";
import { mkdir, readdir, rename, rm, rmdir, stat as fsStat, statfs } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import {
  QlStorageError,
  assertQlStorageKey,
  assertQlStoragePrefix,
  normalizeRange,
  type QlStoredObject,
  type QlStorageDriver,
  type QlStorageKey,
  type QlStorageRange,
  type QlStorageSink,
  type QlStorageStat,
} from "./storage.js";

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

class LocalDiskSink implements QlStorageSink {
  #stream: WriteStream;
  #hash = createHash("sha256");
  #sizeBytes = 0;
  #done = false;

  constructor(
    private readonly key: QlStorageKey,
    private readonly finalPath: string,
    private readonly partPath: string,
  ) {
    // A per-sink part name keeps two concurrent writers to the same key from
    // corrupting one another; the rename below decides which one wins.
    this.#stream = createWriteStream(partPath);
    this.#stream.on("error", () => undefined);
  }

  async append(chunk: Uint8Array): Promise<void> {
    if (this.#done) {
      throw new QlStorageError(`Sink for '${this.key}' is already settled.`);
    }
    this.#hash.update(chunk);
    this.#sizeBytes += chunk.byteLength;
    if (this.#stream.write(chunk)) return;
    await new Promise<void>((resume) => this.#stream.once("drain", () => resume()));
    if (this.#stream.destroyed) {
      throw new QlStorageError(`Write to '${this.key}' failed.`);
    }
  }

  #waitForClose(): Promise<void> {
    return new Promise((settled) => {
      if (this.#stream.closed) settled();
      else this.#stream.once("close", () => settled());
    });
  }

  async finish(): Promise<QlStoredObject> {
    if (this.#done) {
      throw new QlStorageError(`Sink for '${this.key}' is already settled.`);
    }
    this.#done = true;
    try {
      await new Promise<void>((complete, fail) => {
        this.#stream.once("error", fail);
        this.#stream.end((error?: Error | null) => {
          if (error) fail(error);
          else complete();
        });
      });
      // Windows refuses the rename while the descriptor is still open.
      await this.#waitForClose();
      await rename(this.partPath, this.finalPath);
    } catch (error) {
      await rm(this.partPath, { force: true }).catch(() => undefined);
      throw new QlStorageError(
        `Could not publish '${this.key}': ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
    return {
      key: this.key,
      sizeBytes: this.#sizeBytes,
      sha256: this.#hash.digest("hex"),
    };
  }

  async abort(): Promise<void> {
    if (this.#done) return;
    this.#done = true;
    this.#stream.destroy();
    await this.#waitForClose();
    try {
      await rm(this.partPath);
    } catch (error) {
      if (isNotFound(error)) return;
      throw new QlStorageError(
        `Could not discard the scratch part for '${this.key}'.`,
      );
    }
  }
}

export interface LocalDiskStorageDriverOptions {
  readonly rootDir: string;
}

export class LocalDiskStorageDriver implements QlStorageDriver {
  readonly id = "local-disk";
  private readonly rootDir: string;

  constructor(options: LocalDiskStorageDriverOptions) {
    const rootDir = resolve(options.rootDir);
    if (rootDir === resolve(sep)) {
      throw new QlStorageError("Local attachment storage needs a non-root directory.");
    }
    this.rootDir = rootDir;
    // Capacity probes and reads run before the first write, so the root has to
    // exist already rather than appearing with the first object.
    mkdirSync(rootDir, { recursive: true });
  }

  private pathFor(key: string): string {
    assertQlStorageKey(key);
    return this.contained(key);
  }

  private contained(relativePath: string): string {
    const absolute = resolve(this.rootDir, relativePath);
    if (absolute !== this.rootDir && !absolute.startsWith(this.rootDir + sep)) {
      throw new QlStorageError(`Storage path '${relativePath}' escapes the storage root.`);
    }
    return absolute;
  }

  private partPathFor(finalPath: string): string {
    return `${finalPath}.${randomUUID()}.part`;
  }

  async write(key: QlStorageKey): Promise<QlStorageSink> {
    const finalPath = this.pathFor(key);
    await mkdir(dirname(finalPath), { recursive: true });
    return new LocalDiskSink(key, finalPath, this.partPathFor(finalPath));
  }

  async *read(
    key: QlStorageKey,
    range?: QlStorageRange,
  ): AsyncGenerator<Uint8Array, void, unknown> {
    const finalPath = this.pathFor(key);
    let sizeBytes: number;
    try {
      ({ size: sizeBytes } = await fsStat(finalPath));
    } catch (error) {
      if (isNotFound(error)) {
        throw new QlStorageError(`Storage key '${key}' does not exist.`);
      }
      throw error;
    }
    // An empty object has no addressable window, so it reads back as nothing
    // instead of failing the range arithmetic below.
    if (sizeBytes === 0) return;
    const { start, end } = normalizeRange(range, sizeBytes);
    const stream = createReadStream(finalPath, { start, end });
    try {
      for await (const chunk of stream) {
        yield chunk as Uint8Array;
      }
    } finally {
      stream.destroy();
    }
  }

  async stat(key: QlStorageKey): Promise<QlStorageStat | undefined> {
    try {
      const { size } = await fsStat(this.pathFor(key));
      return { sizeBytes: size };
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  }

  async remove(key: QlStorageKey): Promise<boolean> {
    const finalPath = this.pathFor(key);
    try {
      // No `force`: with it rm() swallows ENOENT and every delete would look
      // successful, hiding lost attachments from the caller.
      await rm(finalPath);
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
    // Upload parts live in one directory per session. Without this prune the
    // empty directory outlives every completed upload and nothing can reclaim it.
    // rmdir is the only call that cannot accidentally take a sibling with it:
    // it fails unless the directory is already empty.
    await rmdir(dirname(finalPath)).catch(() => undefined);
    return true;
  }

  async list(prefix: string): Promise<readonly QlStorageKey[]> {
    assertQlStoragePrefix(prefix);
    // Prefixes always end in `/`, so dropping it names a directory rather than
    // an object key.
    const baseDir = this.contained(prefix.slice(0, -1));
    const found: QlStorageKey[] = [];
    await this.collect(baseDir, prefix, found);
    return found;
  }

  async freeBytes(): Promise<number | undefined> {
    // `bavail` is what this process may actually allocate; `bfree` also counts
    // blocks reserved for the superuser.
    const { bsize, bavail } = await statfs(this.rootDir);
    return bsize * bavail;
  }

  private async collect(
    directory: string,
    prefix: string,
    found: QlStorageKey[],
  ): Promise<void> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (isNotFound(error)) return;
      throw error;
    }
    for (const entry of entries) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        await this.collect(absolute, prefix, found);
        continue;
      }
      if (!entry.isFile()) continue;
      const key = absolute
        .slice(this.rootDir.length + 1)
        .split(sep)
        .join("/");
      // `.part` files of in-flight writes sit beside committed objects and
      // must never be reported as readable keys.
      if (key.endsWith(".part")) continue;
      try {
        found.push(assertQlStorageKey(key));
      } catch {
        continue;
      }
    }
  }
}
