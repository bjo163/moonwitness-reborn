import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

const markerName = ".bundle-budget-build.json";

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read build metadata at '${filePath}'.`, {
      cause: error,
    });
  }
}

function pathList(value, label) {
  if (
    !Array.isArray(value) ||
    !value.every((path) => typeof path === "string")
  ) {
    throw new Error(`Invalid bundle manifest paths in '${label}'.`);
  }
  return value;
}

export function bundleChunkPaths(entry, label = "manifest entry") {
  if (Array.isArray(entry)) {
    return pathList(entry, label);
  }
  if (!isRecord(entry)) {
    throw new Error(`Invalid bundle manifest entry in '${label}'.`);
  }
  return [
    ...pathList(entry.initial ?? [], `${label}.initial`),
    ...pathList(entry.js ?? [], `${label}.js`),
  ];
}

function safeAssetPath(distDir, relativePath) {
  const resolvedDistDir = resolve(distDir);
  const assetPath = resolve(resolvedDistDir, relativePath);
  const relativeAssetPath = relative(resolvedDistDir, assetPath);
  if (
    relativeAssetPath === ".." ||
    relativeAssetPath.startsWith(`..${sep}`) ||
    isAbsolute(relativeAssetPath)
  ) {
    throw new Error(`Bundle manifest path escapes the build directory: '${relativePath}'.`);
  }
  return assetPath;
}

export function createBundleBudgetSnapshot(distDir) {
  const buildIdPath = join(distDir, "BUILD_ID");
  const requiredServerFilesPath = join(distDir, "required-server-files.json");
  const manifestPath = join(distDir, "app-build-manifest.json");
  for (const filePath of [
    buildIdPath,
    requiredServerFilesPath,
    manifestPath,
  ]) {
    if (!existsSync(filePath)) {
      throw new Error(`Production build is missing '${filePath}'.`);
    }
  }

  const buildId = readFileSync(buildIdPath, "utf8").trim();
  if (!buildId) {
    throw new Error("Production build has an empty BUILD_ID.");
  }

  const manifestBytes = readFileSync(manifestPath);
  const manifest = readJsonFile(manifestPath);
  if (!isRecord(manifest) || !isRecord(manifest.pages)) {
    throw new Error("Production build has an invalid app-build-manifest.json.");
  }

  const assets = new Set(
    [
      ...bundleChunkPaths(manifest.rootFiles ?? [], "rootFiles"),
      ...Object.entries(manifest.pages).flatMap(([route, entry]) =>
        bundleChunkPaths(entry, `pages.${route}`),
      ),
    ].filter((path) => path.endsWith(".js")),
  );
  const fingerprint = createHash("sha256");
  fingerprint.update(buildId);
  fingerprint.update(readFileSync(requiredServerFilesPath));
  fingerprint.update(manifestBytes);
  for (const asset of [...assets].sort()) {
    const assetPath = safeAssetPath(distDir, asset);
    if (!existsSync(assetPath)) {
      throw new Error(`Production build is missing JS chunk '${asset}'.`);
    }
    fingerprint.update(asset);
    fingerprint.update(readFileSync(assetPath));
  }

  return {
    version: 1,
    buildId,
    fingerprint: fingerprint.digest("hex"),
  };
}

export function recordBundleBudgetBuild(distDir) {
  const snapshot = createBundleBudgetSnapshot(distDir);
  writeFileSync(
    join(distDir, markerName),
    `${JSON.stringify(snapshot)}\n`,
  );
}

export function assertBundleBudgetBuildUnchanged(distDir) {
  const markerPath = join(distDir, markerName);
  if (!existsSync(markerPath)) {
    throw new Error(
      "No bundle-budget build snapshot found. Run the production build before checking sizes.",
    );
  }

  const recorded = readJsonFile(markerPath);
  if (
    !isRecord(recorded) ||
    recorded.version !== 1 ||
    typeof recorded.buildId !== "string" ||
    typeof recorded.fingerprint !== "string"
  ) {
    throw new Error("Bundle-budget build snapshot is invalid.");
  }

  const current = createBundleBudgetSnapshot(distDir);
  if (
    recorded.buildId !== current.buildId ||
    recorded.fingerprint !== current.fingerprint
  ) {
    throw new Error(
      "Production build output changed after its bundle-budget snapshot. Rebuild before checking sizes.",
    );
  }
}
