#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { watch } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const watchedRoots = ["apps", "packages", "scripts"];
const ignoredSegments = new Set([
  "node_modules",
  "dist",
  ".next",
  ".turbo",
  ".git",
]);
const sourceExtensions = new Set([".css", ".js", ".jsx", ".json", ".mjs", ".ts", ".tsx"]);
let watchTimer;
let running = false;
let pending = false;
let devProcess;

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(`[dev gate] command error: ${result.error.message}`);
  }
  if (result.signal) {
    console.error(`[dev gate] command terminated by ${result.signal}`);
  }
  return result.status === 0;
}

function runInitialGates() {
  const gates = [
    ["workspace build", pnpm, ["exec", "turbo", "run", "build"]],
    ["package conventions", pnpm, ["verify:package-conventions"]],
    ["i18n consistency", pnpm, ["i18n:sync:check"]],
    ["lint", pnpm, ["lint"]],
    ["typecheck", pnpm, ["typecheck"]],
    ["UI consistency", pnpm, ["ui:check"]],
  ];
  for (const [label, command, args] of gates) {
    console.log(`\n[dev gate] ${label}`);
    if (!run(command, args)) {
      console.error(`\n[dev gate] FAILED: ${label}`);
      return false;
    }
  }
  return true;
}

function runWatchedGates() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  const gates = [
    ["i18n consistency", ["i18n:sync:check"]],
    ["lint", ["lint"]],
    ["typecheck", ["typecheck"]],
    ["UI consistency", ["ui:check"]],
  ];
  for (const [label, args] of gates) {
    console.log(`\n[dev watch] ${label}`);
    if (!run(pnpm, args)) {
      console.error(`[dev watch] FAILED: ${label}`);
      break;
    }
  }
  running = false;
  if (pending) {
    pending = false;
    scheduleWatchedGates();
  }
}

function scheduleWatchedGates() {
  clearTimeout(watchTimer);
  watchTimer = setTimeout(runWatchedGates, 350);
}

function isSourceChange(filename) {
  if (!filename) return false;
  const segments = filename.split(/[\\/]/);
  if (segments.some((segment) => ignoredSegments.has(segment))) return false;
  const dot = filename.lastIndexOf(".");
  return dot >= 0 && sourceExtensions.has(filename.slice(dot).toLowerCase());
}

function startWatchers() {
  const watchers = [];
  for (const directory of watchedRoots) {
    watchers.push(
      watch(resolve(root, directory), { recursive: true }, (_event, filename) => {
        if (isSourceChange(filename)) scheduleWatchedGates();
      }),
    );
  }
  return watchers;
}

function stop(exitCode = 0) {
  clearTimeout(watchTimer);
  if (devProcess && !devProcess.killed) devProcess.kill();
  process.exit(exitCode);
}

if (!runInitialGates()) process.exit(1);

console.log("\n[dev gate] all startup gates passed");
devProcess = spawn(pnpm, ["exec", "turbo", "run", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
const watchers = startWatchers();
devProcess.on("exit", (code, signal) => {
  for (const watcher of watchers) watcher.close();
  stop(code ?? (signal ? 1 : 0));
});
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
