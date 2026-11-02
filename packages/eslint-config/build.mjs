#!/usr/bin/env node
// Build step for `@moonwitness/eslint-config`.
//
// The package ships no compiled output: it is plain ESM consumed by ESLint and
// by the root composer at load time. Its "build" therefore only has to prove
// that the export contract the workspace composes against is intact, which is
// exactly what a missing artifact would catch for a compiled package.
import assert from "node:assert/strict";
import * as config from "./index.js";

assert.equal(
  typeof config.moonwitnessConfig,
  "function",
  "@moonwitness/eslint-config must export the moonwitnessConfig factory",
);
assert.ok(
  Array.isArray(config.moonwitnessConfig({ tsconfigRootDir: import.meta.dirname })),
  "moonwitnessConfig must compose a flat-config array",
);
console.log("@moonwitness/eslint-config: export contract intact");
