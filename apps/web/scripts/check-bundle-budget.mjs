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
  if (!measured.has(route) && !update) {
    problems.push(`${route.padEnd(34)}  removed route`);
  }
}

if (problems.length > 0 && !update) {
  console.error("First Load JS budget exceeded:\n  " + problems.join("\n  "));
  process.exit(1);
}

if (update) {
  writeFileSync(
    budgetPath,
    JSON.stringify({ ...budget, routes: nextBaseline }, null, 2) + "\n",
  );
  console.log(`Baseline recorded for ${Object.keys(nextBaseline).length} routes.`);
} else {
  console.log(
    `First Load JS within budget: ${measured.size} routes, ceiling ${budget.maxFirstLoadKb} kB.`,
  );
}
