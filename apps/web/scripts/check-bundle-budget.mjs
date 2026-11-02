#!/usr/bin/env node
/**
 * Per-route First Load JS budget for `apps/web` (MW-0582).
 *
 * `size-limit` cannot express this number: on the App Router the payload a
 * browser downloads for one route is the union of the chunks listed for that
 * route in `.next/app-build-manifest.json`, plus the shared root chunks, and
 * size-limit only measures file globs. So the budget is computed here, from the
 * manifest Next itself writes, with gzip sizes (what actually crosses the wire).
 *
 *   pnpm --filter @moonwitness/web size            # check against the baseline
 *   pnpm --filter @moonwitness/web size --update   # re-record the baseline
 *
 * Fails when a route exceeds `maxFirstLoadKb`, or grows more than
 * `maxRouteDeltaKb` over the recorded baseline. A route missing from the
 * baseline is reported as new and must be recorded deliberately, so adding a
 * route can never silently widen the budget.
 */
import { gzipSync } from "node:zlib";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const budgetPath = join(appDir, ".size-budget.json");
// Honour the same override `next.config.ts` uses, so the budget can be measured
// in a scratch directory without disturbing a dev server already writing to
// `.next`.
const distDir = process.env.NEXT_DIST_DIR ?? ".next";
const manifestPath = join(appDir, distDir, "app-build-manifest.json");
const update = process.argv.includes("--update");

const budget = JSON.parse(readFileSync(budgetPath, "utf8"));

/**
 * Manifest values are either a flat array of chunk paths or an object with an
 * `initial`/`js` list, depending on the Next channel. Paths are relative to
 * `.next`, and a dev build also lists CSS and non-JS assets.
 */
function chunkPaths(entry) {
  if (Array.isArray(entry)) return entry;
  if (entry && typeof entry === "object") {
    return [...(entry.initial ?? []), ...(entry.js ?? [])];
  }
  return [];
}

function gzippedKb(relativePath) {
  const file = join(appDir, distDir, relativePath);
  if (!existsSync(file)) return 0;
  return gzipSync(readFileSync(file), { level: 9 }).length / 1024;
}

function measuredFirstLoad() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const pages = manifest.pages ?? {};
  const rootFiles = chunkPaths(manifest.rootFiles ?? []);
  const routes = new Map();
  for (const [route, entry] of Object.entries(pages)) {
    const files = new Set([...chunkPaths(entry), ...rootFiles]);
    const kb = [...files]
      .filter((file) => file.endsWith(".js"))
      .reduce((total, file) => total + gzippedKb(file), 0);
    routes.set(route, kb);
  }
  return routes;
}

if (!existsSync(manifestPath)) {
  console.error(
    `No ${manifestPath}. Run \`pnpm --filter @moonwitness/web build\` first.`,
  );
  process.exit(1);
}

// `BUILD_ID` and `required-server-files.json` are written only by `next build`,
// so they prove the directory is not a pure `next dev` artefact. They do NOT
// prove it is current: a dev server that runs afterwards rewrites chunk files
// while leaving both markers in place (observed as 13 of 16 routes and an
// inflated 242 kB for /providers). The stale-manifest case is caught by the
// "removed route" failure below rather than by a filesystem heuristic, because
// `cache/webpack` turns out to exist in production builds too.
if (
  !existsSync(join(appDir, distDir, "BUILD_ID")) ||
  !existsSync(join(appDir, distDir, "required-server-files.json"))
) {
  console.error(
    `${distDir} is not a production build.\n` +
      `Run \`NEXT_DIST_DIR=${distDir} next build\` first, and not into a directory\n` +
      `a \`next dev\` server is also writing to.`,
  );
  process.exit(1);
}

// `--update` records the `BUILD_ID` alongside the sizes so the next check can
// tell a fresh build from a stale one even when every route name matches. A dev
// server that later rewrites chunks under the same route set can otherwise slip
// past the "route missing" check while inflating the reported KB (MW-0584).
const currentBuildId = readFileSync(join(appDir, distDir, "BUILD_ID"), "utf8").trim();
if (
  !update &&
  typeof budget.buildId === "string" &&
  budget.buildId !== currentBuildId
) {
  console.error(
    `${distDir} build id ${currentBuildId} does not match the baseline id ${budget.buildId}.\n` +
      `A dev server may have rewritten this build directory after the baseline was recorded.\n` +
      `Run \`NEXT_DIST_DIR=${distDir} pnpm --filter @moonwitness/web build\` before checking, or\n` +
      `\`pnpm --filter @moonwitness/web size --update\` to intentionally re-record the baseline.`,
  );
  process.exit(1);
}

const measured = measuredFirstLoad();
const baseline = budget.routes ?? {};
const problems = [];
const nextBaseline = { ...baseline };

for (const [route, kb] of [...measured].sort((a, b) => b[1] - a[1])) {
  const label = `${route.padEnd(34)} ${kb.toFixed(1).padStart(6)} kB`;
  // Recording a baseline never fails: every measured route is written, so
  // `--update` after a deliberate change is the only way to widen the budget.
  nextBaseline[route] = Math.round(kb * 10) / 10;
  if (update) continue;
  if (kb > budget.maxFirstLoadKb) {
    problems.push(`${label} — over the ${budget.maxFirstLoadKb} kB ceiling`);
    continue;
  }
  if (!(route in baseline)) {
    problems.push(`${label} — new route, not in the baseline`);
    continue;
  }
  const delta = kb - baseline[route];
  if (delta > budget.maxRouteDeltaKb) {
    problems.push(
      `${label} — grew ${delta.toFixed(1)} kB over the ${baseline[route].toFixed(1)} kB baseline (limit ${budget.maxRouteDeltaKb} kB)`,
    );
  }
}

for (const route of Object.keys(baseline)) {
  if (!measured.has(route)) {
    problems.push(
      `${route.padEnd(34)}  missing from ${distDir} - a dev server may have rewritten this build directory; re-run \`next build\``,
    );
  }
}

if (problems.length > 0 && !update) {
  console.error("First Load JS budget exceeded:\n  " + problems.join("\n  "));
  process.exit(1);
}

if (update) {
  writeFileSync(
    budgetPath,
    JSON.stringify(
      { ...budget, routes: nextBaseline, buildId: currentBuildId },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Baseline recorded for ${Object.keys(nextBaseline).length} routes (build ${currentBuildId}).`,
  );
} else {
  console.log(
    `First Load JS within budget: ${measured.size} routes, ceiling ${budget.maxFirstLoadKb} kB.`,
  );
}
