import { resolve } from "node:path";
import { createQlOrm } from "ql_orm";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import corpusManifest from "../__manifest__.js";
import sourceManifest from "ql_source/__manifest__";
import { importQuranSlice, undoImportRun } from "./import-service.js";

/**
 * `pnpm --filter ql_corpus import:quran [-- --dataset <id>] [--dry-run]
 *   [--resume] [--undo-run <import_run_id>]`
 *
 * A thin argv parser around `import-service.ts`. Kept inside `services/**`
 * (not `scripts/**`) so it is covered by `tsconfig.addon.json`'s `include`
 * and by the workspace's type-aware ESLint `projectService`. See the plan
 * section "Kenapa `services/import-quran-cli.ts`, bukan `scripts/`".
 */

interface Cli {
  mode: "import" | "undo";
  datasetId?: string;
  dryRun: boolean;
  checkpointDir?: string;
  importRunId?: string;
  manifestPath: string;
}

function parseArgv(argv: readonly string[]): Cli {
  const args = argv.slice(2);
  const out: Cli = {
    mode: "import",
    dryRun: false,
    manifestPath: resolve(process.cwd(), "datasets/quran-manifest.json"),
  };
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--dry-run") out.dryRun = true;
    else if (token === "--dataset") out.datasetId = args[++i];
    else if (token === "--checkpoint-dir") out.checkpointDir = args[++i];
    else if (token === "--manifest") out.manifestPath = resolve(args[++i] ?? out.manifestPath);
    else if (token === "--undo-run") {
      out.mode = "undo";
      out.importRunId = args[++i];
    }
  }
  return out;
}

async function main(): Promise<void> {
  const cli = parseArgv(process.argv);
  if (cli.mode === "undo") {
    if (!cli.importRunId) {
      console.error("--undo-run requires an import_run_id");
      process.exit(2);
    }
    const runtime = await createQlOrm(
      process.env.DATABASE_URL ?? "file:../../data/moonwitness.db",
      [baseManifest, authManifest, sourceManifest, corpusManifest],
    );
    try {
      const removed = await undoImportRun(runtime.orm, cli.importRunId);
      console.log(
        JSON.stringify(
          { undo: cli.importRunId, removedPassages: removed },
          null,
          2,
        ),
      );
    } finally {
      runtime.close();
    }
    return;
  }
  const runtime = await createQlOrm(
    process.env.DATABASE_URL ?? "file:../../data/moonwitness.db",
    [baseManifest, authManifest, sourceManifest, corpusManifest],
  );
  try {
    const reports = await importQuranSlice(runtime.orm, cli.manifestPath, {
      dryRun: cli.dryRun,
      ...(cli.datasetId ? { datasetId: cli.datasetId } : {}),
      ...(cli.checkpointDir ? { checkpointDir: cli.checkpointDir } : {}),
    });
    console.log(JSON.stringify({ dryRun: cli.dryRun, reports }, null, 2));
    for (const report of reports) {
      if (
        report.observed !== report.expected ||
        report.inserted + report.skippedConflict !== report.expected
      ) {
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          status: "aborted",
          reason: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  } finally {
    runtime.close();
  }
}

void main();
