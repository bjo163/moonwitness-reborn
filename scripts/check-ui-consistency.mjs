#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const webSource = join(root, "apps", "web", "src");
const uiSource = join(root, "packages", "ui", "src");
const catalogs = [
  join(root, "packages", "ql_i18n", "i18n", "en.po"),
  join(root, "packages", "ql_i18n", "i18n", "id.po"),
];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const violations = [];
const advisories = [];

function poString(line) {
  const match = line.match(/"(.*)"$/);
  return match ? match[1].replace(/\\"/g, '"') : "";
}

function parseCatalog(source) {
  const entries = new Map();
  let context = "";
  let msgid = "";
  let msgstr = "";
  let field = "";

  function commit() {
    if (context && msgid) entries.set(context, { msgid, msgstr });
    context = "";
    msgid = "";
    msgstr = "";
    field = "";
  }

  for (const rawLine of source.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (line === "") {
      commit();
      continue;
    }
    if (line.startsWith("msgctxt ")) {
      commit();
      context = poString(line).replace(/^web:/, "web.");
      field = "context";
    } else if (line.startsWith("msgid ")) {
      msgid = poString(line);
      field = "msgid";
    } else if (line.startsWith("msgstr ")) {
      msgstr = poString(line);
      field = "msgstr";
    } else if (line.startsWith('"')) {
      const value = poString(line);
      if (field === "context") context += value;
      if (field === "msgid") msgid += value;
      if (field === "msgstr") msgstr += value;
    }
  }
  commit();
  return entries;
}

function placeholders(value) {
  return [...value.matchAll(/\{([a-zA-Z0-9_.-]+)\}/g)]
    .map((match) => match[1])
    .sort()
    .join("|");
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (extensions.has(entry.name.slice(entry.name.lastIndexOf(".")))) {
      files.push(path);
    }
  }
  return files;
}

function checkSource(path, source) {
  const displayPath = relative(root, path);
  const checks = [
    [/\bfetch\s*\(/, "Use moonClient instead of fetch in apps/web."],
    [/\bXMLHttpRequest\b/, "Use moonClient instead of XMLHttpRequest in apps/web."],
    [/<style\b/i, "Use the shared UI styles; do not add a <style> element."],
    [/\bstyle\s*=/, "Use shared UI tokens/classes instead of inline style props."],
    [
      /<(?:button|input|select|textarea)\b/,
      "Use the accessible shared UI control instead of raw form elements.",
    ],
  ];
  for (const [pattern, message] of checks) {
    const match = pattern.exec(source);
    if (!match) continue;
    const line = source.slice(0, match.index).split("\n").length;
    violations.push(`${displayPath}:${line} - ${message}`);
  }
  const internalImport = /from\s+["'][^"']*(?:\/src\/|\/dist\/|packages[\\/])/;
  const internalMatch = internalImport.exec(source);
  if (internalMatch) {
    const line = source.slice(0, internalMatch.index).split("\n").length;
    advisories.push(
      `${displayPath}:${line} - Import package contracts from their public entrypoint, not internal source paths.`,
    );
  }

  const uiImports = source.match(/from\s+["']@moonwitness\/ui["']/g) ?? [];
  if (uiImports.length > 1) {
    violations.push(
      `${displayPath}: duplicate @moonwitness/ui imports; consolidate shared UI imports.`,
    );
  }
}

const globalStyles = await readFile(join(webSource, "app", "globals.css"), "utf8");
if (globalStyles.trim() !== '@import "@moonwitness/ui/preset.css";') {
  violations.push(
    "apps/web/src/app/globals.css - Import only @moonwitness/ui/preset.css.",
  );
}

const catalogSources = await Promise.all(
  catalogs.map((path) => readFile(path, "utf8")),
);
const catalogEntries = catalogSources.map((source) => parseCatalog(source));
const catalogKeys = new Set(catalogEntries[0].keys());

for (const key of catalogKeys) {
  if (!catalogEntries[1].has(key)) {
    advisories.push(`Missing i18n key '${key}' in id.po.`);
    continue;
  }
  const en = catalogEntries[0].get(key);
  const id = catalogEntries[1].get(key);
  if (en.msgstr && id.msgstr && placeholders(en.msgstr) !== placeholders(id.msgstr)) {
    advisories.push(
      `i18n key '${key}' has mismatched placeholders between en.po and id.po.`,
    );
  }
}
for (const key of catalogEntries[1].keys()) {
  if (!catalogEntries[0].has(key)) {
    advisories.push(`Missing i18n key '${key}' in en.po.`);
  }
}

for (const path of await collectFiles(webSource)) {
  const source = await readFile(path, "utf8");
  checkSource(path, source);
  for (const match of source.matchAll(/\bt\(\s*["'](web\.[^"']+)["']/g)) {
    if (!catalogKeys.has(match[1])) {
      const line = source.slice(0, match.index).split("\n").length;
      advisories.push(
        `${relative(root, path)}:${line} - Missing i18n key '${match[1]}' in en.po and id.po.`,
      );
    }
  }
}

for (const path of await collectFiles(uiSource)) {
  const source = await readFile(path, "utf8");
  const displayPath = relative(root, path);
  if (/\bapps[\\/]+web\b|from\s+["'][^"']*apps[\\/]+web/.test(source)) {
    violations.push(
      `${displayPath} - packages/ui must not import apps/web code; pass application behavior through typed props.`,
    );
  }
}

if (violations.length > 0) {
  console.error("UI consistency violations:");
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exitCode = 1;
}
if (advisories.length > 0) {
  console.warn("UI consistency advisories (report-only):");
  for (const advisory of advisories) console.warn(`  - ${advisory}`);
}
if (violations.length === 0 && advisories.length === 0) {
  console.log("UI consistency OK.");
}
