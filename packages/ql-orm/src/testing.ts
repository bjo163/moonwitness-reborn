import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createQlOrm,
  type QlAddonManifest,
  type QlModelDefinition,
  type QlOrm,
} from "./index.js";
import { LocalDiskStorageDriver } from "./storage-local.js";
import type { QlStorageDriver } from "./storage.js";

const externalIdModel: QlModelDefinition = {
  name: "ir.model.data",
  description: "External identifiers for stable addon seed data.",
  tableName: "ir_model_data",
  fields: {
    external_id: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 255,
      private: true,
    },
    model_name: {
      type: "char",
      required: true,
      maxLength: 120,
      private: true,
    },
    record_id: {
      type: "char",
      required: true,
      maxLength: 120,
      private: true,
    },
  },
};

/**
 * `ql_orm/testing` — helpers shared by the workspace's addon test suites.
 * Only `.test.ts` files may import from this subpath; production code in
 * `apps/**` and package `src/**` must not (enforced by convention + code
 * review — the subpath is intentionally not re-exported from `ql_orm`).
 */

/**
 * Build a minimal `QlAddonManifest` for a named dependency so an addon under
 * test can be booted without pulling in every other real addon.
 */
export function stubAddonManifest(name: string): QlAddonManifest {
  return {
    name,
    version: "1.0.0",
    description: name,
    depends: [],
    models: name === "ql_base" ? [externalIdModel] : [],
    access: [],
    views: [],
    data: [],
  };
}

/**
 * Boot a libsql in-memory ORM against the given manifests, run the supplied
 * async callback with it, and always close the connection afterwards — even
 * when the callback throws.
 *
 * Pass `storage: "temp"` to install a throwaway local-disk driver, or supply
 * your own. Without it no driver is installed, so `orm.storage` throws.
 */
export async function withMemoryOrm(
  manifests: readonly QlAddonManifest[],
  run: (orm: QlOrm) => Promise<void>,
  options: { storage?: QlStorageDriver | "temp" } = {},
): Promise<void> {
  let storage: QlStorageDriver | undefined;
  let tempDir: string | undefined;
  if (options.storage === "temp") {
    tempDir = await mkdtemp(join(tmpdir(), "ql-orm-"));
    storage = new LocalDiskStorageDriver({ rootDir: tempDir });
  } else {
    storage = options.storage;
  }
  const runtime = await createQlOrm("file::memory:", [...manifests], {
    ...(storage ? { storage } : {}),
  });
  try {
    await run(runtime.orm);
  } finally {
    runtime.close();
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}
