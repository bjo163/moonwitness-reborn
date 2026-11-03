#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const ROLES = {
  app: { req: ["dev", "build", "start", "typecheck"], opt: ["test", "size"], reqExp: [], optExp: [] },
  addon: { req: ["build", "typecheck"], opt: ["test"], reqExp: [], optExp: [] },
  library: { req: ["build", "test", "typecheck"], opt: [], reqExp: [], optExp: [] },
  config: { req: ["build", "test", "typecheck"], opt: [], reqExp: [], optExp: [] },
};

const PACKAGE_ROLES = {
  "@moonwitness/api": "app",
  "@moonwitness/web": "app",
  "@moonwitness/types": "library",
  "@moonwitness/ui": "library",
  "@moonwitness/moonclient": "library",
  "@moonwitness/agent-runtime": "library",
  "@moonwitness/database": "library",
  "ql_orm": "library",
  "@moonwitness/eslint-config": "config",
  "ql_ai": "addon",
  "ql_auth": "addon",
  "ql_attachment": "addon",
  "ql_base": "addon",
  "ql_chat": "addon",
  "ql_cloudflare": "addon",
  "ql_corpus": "addon",
  "ql_geo": "addon",
  "ql_i18n": "addon",
  "ql_integration": "addon",
  "ql_research": "addon",
  "ql_search": "addon",
  "ql_source": "addon",
  "ql_workflow": "addon",
};

const PACKAGE_EXCEPTIONS = {
  "@moonwitness/web": {
    scripts: { build: "build:app" },
    reason: "The workspace build is named `build:app` so a package build cannot recurse into the root all-packages build; the package still runs a full Next build plus the bundle-budget record step.",
  },
  "@moonwitness/types": {
    reason: "types is a type-only kernel with no runtime values, so its export map intentionally has no `import` condition.",
  },
  "ql_corpus": {
    extra: ["import:quran"],
    reason: "The addon ships a separate long-running CLI that imports the canonical Qur'an dataset; it is a data tool, not a quality gate, so it is optional but must still be declared per role.",
  },
  "@moonwitness/ui": {
    reason: "ui is a component library whose public surface is the component entrypoint plus CSS style exports, not an addon manifest.",
  },
};

// Scripts whose name is itself a Turbo task must not be pkg-local aliases of
// some other command; CI and `pnpm <task>` then run the same graph.
const TURBO_TASKS = ["build", "dev", "test", "typecheck"];

// A package test must invoke a real runner on at least one file.
const TEST_RUNNER = /(?:^|&&\s*)(?:tsx|node)\b[^&]*\s--test\s+\S+/;

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isDir(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

// An export target may be a string, a conditional map, or an array of those;
// the check applies to every string leaf, one condition at a time.
function exportTargets(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(exportTargets);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(exportTargets);
  }
  return [];
}

async function collectPackages() {
  const packages = [];
  for (const group of ["apps", "packages"]) {
    const entries = await readdir(join(ROOT, group));
    for (const entry of entries) {
      const dir = join(ROOT, group, entry);
      if (!(await isDir(dir))) continue;
      const pkg = await readJson(join(dir, "package.json"));
      packages.push({ dir, rel: `${group}/${entry}`, pkg });
    }
  }
  return packages;
}

function roleOf(name) {
  return PACKAGE_ROLES[name];
}

async function checkPackage({ dir, rel, pkg }) {
  const errors = [];
  const role = roleOf(pkg.name);
  if (!role) {
    errors.push(`${rel}: unknown package role; add it to PACKAGE_ROLES`);
    return errors;
  }

  const roleDef = ROLES[role];
  const exception = PACKAGE_EXCEPTIONS[pkg.name];
  if (exception && exception.reason.trim() === "") {
    errors.push(`${pkg.name}: exception must carry a reason`);
  }
  const scripts = pkg.scripts ?? {};

  for (const name of roleDef.req) {
    if (!(name in scripts)) {
      errors.push(`${pkg.name}: missing required "${name}" script`);
    }
  }

  const extra = exception?.extra ?? [];
  const allowed = new Set([...roleDef.req, ...roleDef.opt, ...extra]);
  for (const name of Object.keys(scripts)) {
    const allowedHere =
      allowed.has(name) ||
      (name.includes(":") && allowed.has(name.split(":")[0]));
    if (!allowedHere) {
      errors.push(
        `${pkg.name}: unexpected script "${name}" (allowed: ${[...allowed].join(", ")})`,
      );
    }
  }

  if ("test" in scripts && !TEST_RUNNER.test(scripts.test)) {
    errors.push(
      `${pkg.name}: "test" must run a test runner on files, got "${scripts.test}"`,
    );
  }

  const exportMap = pkg.exports ?? {};
  for (const [name, value] of Object.entries(exportMap)) {
    for (const target of exportTargets(value)) {
      if (!target.startsWith("./")) {
        errors.push(
          `${pkg.name}: export "${name}" must resolve from the package directory, got "${target}"`,
        );
        continue;
      }
      if (!(await isFile(join(dir, target)))) {
        errors.push(`${pkg.name}: export "${name}" points at missing file ${target}`);
      }
    }
  }

  return errors;
}

async function checkTaskGraph(packages) {
  const errors = [];
  const turboJson = await readJson(join(ROOT, "turbo.json"));
  const tasks = turboJson.tasks ?? {};
  const rootPkg = await readJson(join(ROOT, "package.json"));
  const rootScripts = rootPkg.scripts ?? {};
  for (const task of TURBO_TASKS) {
    if (!(task in tasks)) {
      errors.push(`turbo.json: task "${task}" is not declared`);
    }
    const command = rootScripts[task];
    if (!command) {
      errors.push(`root package.json: missing workspace "${task}" script`);
      continue;
    }
    const usesDevPreflight =
      task === "dev" && command.includes("scripts/dev-preflight.mjs");
    if (!command.startsWith(`turbo run ${task}`) && !usesDevPreflight) {
      errors.push(`root package.json: "${task}" must run 'turbo run ${task}', got "${command}"`);
    }
  }
  return errors;
}

async function main() {
  const packages = await collectPackages();
  const errors = [...(await checkTaskGraph(packages))];
  for (const pkg of packages) {
    errors.push(...(await checkPackage(pkg)));
  }
  if (errors.length > 0) {
    console.error("Package convention violations:");
    for (const message of errors) console.error(`  - ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Package conventions OK: ${packages.length} packages checked`);
}

await main();
