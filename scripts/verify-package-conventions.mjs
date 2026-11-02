#!/usr/bin/env node
// Workspace package script and export conventions validator
//
// This script validates that all packages in the workspace follow the
// role-aware conventions for scripts and exports.
//
// Package roles:
//   - apps: dev, build, start, size, typecheck (optionally test)
//   - addons (ql_*): build, typecheck (optionally test)
//   - libraries (moonclient, ql-orm, etc.): build, test, typecheck
//   - config-only (eslint-config): test (if any), typecheck
//
// Apps must have `size` script (web bundle budget) - only web app has this.
//
// Addon packages must export `__manifest__`, `models`, `views` (optional),
// `services` (optional), `catalogs` (optional) based on their actual content.
//
// Config-only packages must not have domain-specific scripts (build, typecheck) if they
// are pure config, but can have `test` and `typecheck`.

import { fileURLToPath } from "node:url";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const ROLE_PATTERNS = {
  apps: {
    dir: "apps",
    requiredScripts: ["build", "dev", "typecheck"],
    optionalScripts: ["test", "start", "size"],
    // Note: Only web app has "size" script, api has "start"
  },
  addons: {
    dir: "packages",
    prefix: "ql_",
    requiredScripts: ["build", "typecheck"],
    optionalScripts: ["test"],
    requiredExports: ["__manifest__", "models"],
    optionalExports: ["views", "services", "catalogs"],
  },
  libraries: {
    dir: "packages",
    // Not ql_*, not config-only (eslint-config, types, ui, moonclient, ql-orm)
    requiredScripts: ["build", "test", "typecheck"],
    optionalScripts: [],
    requiredExports: ["."], // main entry
  },
  config: {
    dir: "packages",
    pattern: ["eslint-config", "types", "ui"],
    requiredScripts: ["test", "typecheck"],
    optionalScripts: [],
    requiredExports: ["."],
  },
};

// Documented exceptions for packages with unique responsibilities
const PACKAGE_EXCEPTIONS = {
  "apps/api": {
    // API server needs start script for running the server
    requiredScripts: ["build", "dev", "start", "typecheck"],
  },
  "apps/web": {
    // Web app has size script for bundle budget
    requiredScripts: ["build", "dev", "start", "typecheck", "size"],
  },
  "packages/eslint-config": {
    // Config package - only needs test and typecheck
    requiredScripts: ["test", "typecheck"],
    optionalScripts: [],
    requiredExports: ["."],
  },
  "packages/types": {
    // Type definitions package - build script is acceptable for type compilation
    requiredScripts: ["typecheck"],
    optionalScripts: ["build"],
    requiredExports: ["."],
  },
  "packages/ui": {
    // UI library - has build for CSS/JS but no test
    requiredScripts: ["build", "typecheck"],
    optionalScripts: ["test"],
    requiredExports: ["."],
  },
  "packages/ql_corpus": {
    // Corpus package has import script for Quran data
    requiredScripts: ["build", "typecheck"],
    optionalScripts: ["test", "import:quran"],
    requiredExports: ["__manifest__", "models"],
  },
};

function isAppsPackage(pkgDir) {
  return pkgDir.startsWith("apps/");
}

function isAddonPackage(pkgDir) {
  return pkgDir.startsWith("packages/ql_");
}

function isConfigPackage(pkgDir) {
  const name = pkgDir.split("/").pop();
  return ROLE_PATTERNS.config.pattern.includes(name);
}

function isLibraryPackage(pkgDir) {
  return pkgDir.startsWith("packages/") && !isAddonPackage(pkgDir) && !isConfigPackage(pkgDir);
}

function getPackageRole(pkgDir) {
  if (isAppsPackage(pkgDir)) return "apps";
  if (isAddonPackage(pkgDir)) return "addons";
  if (isConfigPackage(pkgDir)) return "config";
  if (isLibraryPackage(pkgDir)) return "libraries";
  return null;
}

async function readPackageJson(pkgDir) {
  const path = join(ROOT, pkgDir, "package.json");
  const content = await readFile(path, "utf8");
  return JSON.parse(content);
}

async function checkPackage(pkgDir) {
  const pkg = await readPackageJson(pkgDir);
  const role = getPackageRole(pkgDir);
  if (!role) {
    return [`${pkgDir}: unknown package role`];
  }

  // Apply package-specific exceptions
  const roleDef = { ...ROLE_PATTERNS[role] };
  if (PACKAGE_EXCEPTIONS[pkgDir]) {
    Object.assign(roleDef, PACKAGE_EXCEPTIONS[pkgDir]);
  }

  const errors = [];

  // Check scripts
  const scripts = pkg.scripts || {};
  for (const req of roleDef.requiredScripts) {
    if (!scripts[req]) {
      errors.push(`${pkgDir}: missing required script "${req}"`);
    }
  }
  // Warn if there are scripts not in expected lists
  const allowed = new Set([...roleDef.requiredScripts, ...roleDef.optionalScripts]);
  for (const script of Object.keys(scripts)) {
    if (!allowed.has(script)) {
      errors.push(`${pkgDir}: unexpected script "${script}" (allowed: ${[...allowed].join(", ")})`);
    }
  }

  // Check exports
  if (roleDef.requiredExports) {
    const exports = pkg.exports || {};
    for (const exp of roleDef.requiredExports) {
      // exports keys can be "./__manifest__" or "__manifest__"
      const found = exp in exports || `./${exp}` in exports;
      if (!found) {
        errors.push(`${pkgDir}: missing required export "${exp}"`);
      }
    }
  }

  return errors;
}

async function main() {
  const pkgDirs = [];

  // Collect package directories
  for (const dir of ["apps", "packages"]) {
    const entries = await readdir(join(ROOT, dir));
    for (const entry of entries) {
      pkgDirs.push(join(dir, entry).replace(/\\/g, "/"));
    }
  }

  let allErrors = [];
  for (const pkgDir of pkgDirs) {
    try {
      const errors = await checkPackage(pkgDir);
      allErrors.push(...errors);
    } catch (err) {
      allErrors.push(`${pkgDir}: error reading package.json: ${err.message}`);
    }
  }

  if (allErrors.length > 0) {
    console.error("Package convention violations:");
    for (const err of allErrors) {
      console.error(`  ${err}`);
    }
    process.exit(1);
  } else {
    console.log("✅ All packages follow role-aware conventions");
  }
}

main().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});