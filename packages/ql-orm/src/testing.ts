import { createQlOrm, type QlAddonManifest, type QlOrm } from "./index.js";

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
    models: [],
    access: [],
    views: [],
  };
}

/**
 * Boot a libsql in-memory ORM against the given manifests, run the supplied
 * async callback with it, and always close the connection afterwards — even
 * when the callback throws.
 */
export async function withMemoryOrm(
  manifests: readonly QlAddonManifest[],
  run: (orm: QlOrm) => Promise<void>,
): Promise<void> {
  const runtime = await createQlOrm("file::memory:", [...manifests]);
  try {
    await run(runtime.orm);
  } finally {
    runtime.close();
  }
}
