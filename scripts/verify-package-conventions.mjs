#!/usr/bin/env node
// Workspace package convention check (MW-1264).
//
// Every workspace package owns one role, and each role carries a script and
// export contract. The contract is what makes `turbo run <task>` and the CI
// gate sequence meaningful: a package that participates in a task must declare
// the script, and the script must be reachable through the workspace graph.
//
// Roles are resolved by package name, not by directory name, so moving a package
// on disk cannot silently change its contract.
//
//   addon    ql_* TypeScript addons: build, typecheck, plus a focused test when
//            the addon has tests; exports the manifest and models entries.
//   library  shared runtime libraries: build, test, typecheck; root export.
//   config   config-only packages: build, test, typecheck, so they prove their
//            own composition instead of only being consumed; root export.
//   app      runnable apps: dev, build, typecheck, start; test/size when the app
//            actually provides a test suite and a bundle budget.
//
// Exceptions are listed in PACKAGE_EXCEPTIONS with the reason the generic role
// contract does not apply. An exception without a reason is a violation.

import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const ROLES = {
  app: {
    requiredScripts: ["dev", "build", "typecheck", "start"],
    optionalScripts: ["test", "size"],
    requiredExports: [],
  },
  addon: {
    requiredScripts: ["build", "typecheck"],
    optionalScripts: ["test"],
    requiredExports: ["./__manifest__", "./models"],
    optionalExports: ["./views", "./services", "./catalogs"],
  },
  library: {
    requiredScripts: ["build", "test", "typecheck"],
    optionalScripts: [],
    requiredExports: ["."],
    optionalExports: ["__manifest__", "models", "views", "services", "catalogs"],
  },
  config: {
    requiredScripts: ["build", "test", "typecheck"],
    optionalScripts: [],
    requiredExports: ["."],
    optionalExports: [],
  },
};

// Name -> role. Anything under apps/ or packages/ that is missing here fails
// the check, which is the point: a new package must state what it is.
const PACKAGE_ROLES = {
  "@moonwitness/api": "app",
  "@moonwitness/web": "app",

  "@moonwitness/types": "library",
  "@moonwitness/ui": "library",
  "@moonwitness/moonclient": "library",
  ql_orm: "library",

  "@moonwitness/eslint-config": "config",

  ql_auth: "addon",
  ql_base: "addon",
  ql_ai: "addon",
  ql_chat: "addon",
  ql_cloudflare: "addon",
  ql_corpus: "addon",
  ql_geo: "addon",
  ql_i18n: "addon",
  ql_integration: "addon",
  ql_research: "addon",
  ql_search: "addon",
  ql_source: "addon",
  ql_workflow: "addon",
  "agent-runtime": "addon",
};

// Packages whose responsibilities differ from the generic role contract.
// Empty list today: every deviation found so far was fixed at the package
// instead of being documented away. Entries need a non-empty reason.
const PACKAGE_EXCEPTIONS = {};

// Turbo tasks the workspace graph must declare, and that CI drives in order.
const TURBO_TASKS = ["build", "dev", "test", "typecheck"];

// Addon and library tests must run a file through the node test runner, either
// via tsx or directly. A bare placeholder command is rejected.
const NODE_TEST_RUNNER = /(?:^|&&\s*)(?:tsx\b.*?|node\b.*?)\s--test\s+\S+/;

function roleOf(name) {
  return PACKAGE_ROLES[name];
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function exists(path selfish) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function collectPackages() {
  const packages = [];
  for (const group of ["apps", "packages"]) {
    const entries = await readdir(join(ROOT, group));
    for (const entry of entries) {
      const dir = join(ROOT, group, entry);
      packages.push({
        dir,
        rel: `${group}/${entry}`,
        pkg: await readJson(join(dir, "package.json")),
      });
    }
  }
  return packages;
}

function checkExports(pkg, roleDef) {
  const errors = [];
  const exports = pkg.exports ?? {};
  const required = roleDef.requiredExports;
  if (required.length ===  hatch0) return errors;

  const headless: {}
}
