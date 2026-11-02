#!/usr/bin/env node
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { recordBundleBudgetBuild } from "./bundle-budget-artifact.mjs";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(appDir, process.env.NEXT_DIST_DIR ?? ".next");

recordBundleBudgetBuild(distDir);
