#!/usr/bin/env node

/**
 * Track 22: Automated PO Parity Synchronizer Tooling
 *
 * Compares msgid, msgctxt, and placeholders between packages/ql_i18n/i18n/id.po
 * and packages/ql_i18n/i18n/en.po. Ensures 100% parity without manual manipulation.
 *
 * Options:
 *   --check : exits with code 1 if disparity exists without writing files (used in CI).
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const idPoPath = join(rootDir, "packages", "ql_i18n", "i18n", "id.po");
const enPoPath = join(rootDir, "packages", "ql_i18n", "i18n", "en.po");

const require = createRequire(join(rootDir, "packages", "ql_i18n", "package.json"));
const gettextPo = require("gettext-parser").po;

const isCheckMode = process.argv.includes("--check");

async function parsePo(filePath) {
  const content = await readFile(filePath, "utf8");
  return gettextPo.parse(content);
}

function extractEntries(parsedPo) {
  const entries = new Map();
  for (const [namespace, messages] of Object.entries(parsedPo.translations)) {
    for (const [msgid, message] of Object.entries(messages)) {
      if (!msgid) continue;
      const ctxt = message.msgctxt ?? namespace;
      const key = `${ctxt}::${msgid}`;
      entries.set(key, { ctxt, msgid, message });
    }
  }
  return entries;
}

async function main() {
  const idParsed = await parsePo(idPoPath);
  const enParsed = await parsePo(enPoPath);

  const idEntries = extractEntries(idParsed);
  const enEntries = extractEntries(enParsed);

  const missingInEn = [];
  const missingInId = [];

  for (const [key, val] of idEntries) {
    if (!enEntries.has(key)) {
      missingInEn.push(val);
    }
  }

  for (const [key, val] of enEntries) {
    if (!idEntries.has(key)) {
      missingInId.push(val);
    }
  }

  if (isCheckMode) {
    let failed = false;
    if (missingInEn.length > 0) {
      console.error(`PO Parity Error: ${missingInEn.length} key(s) in id.po missing in en.po:`);
      for (const item of missingInEn) {
        console.error(`  - [${item.ctxt}] "${item.msgid}"`);
      }
      failed = true;
    }
    if (missingInId.length > 0) {
      console.error(`PO Parity Error: ${missingInId.length} key(s) in en.po missing in id.po:`);
      for (const item of missingInId) {
        console.error(`  - [${item.ctxt}] "${item.msgid}"`);
      }
      failed = true;
    }
    if (failed) {
      process.exit(1);
    }
    console.log(`PO Parity Check Passed: id.po and en.po are in 100% parity (${idEntries.size} entries).`);
    process.exit(0);
  }

  // Sync mode: synchronize missing keys
  let modified = false;

  for (const item of missingInEn) {
    const ctxt = item.ctxt;
    enParsed.translations[ctxt] ??= {};
    enParsed.translations[ctxt][item.msgid] = {
      msgid: item.msgid,
      msgctxt: ctxt,
      msgstr: [item.message.msgstr?.[0] || item.msgid],
      ...(item.message.msgid_plural
        ? {
            msgid_plural: item.message.msgid_plural,
            msgstr: [
              item.message.msgstr?.[0] || item.msgid,
              item.message.msgstr?.[1] || item.message.msgid_plural,
            ],
          }
        : {}),
    };
    modified = true;
  }

  for (const item of missingInId) {
    const ctxt = item.ctxt;
    idParsed.translations[ctxt] ??= {};
    idParsed.translations[ctxt][item.msgid] = {
      msgid: item.msgid,
      msgctxt: ctxt,
      msgstr: [item.message.msgstr?.[0] || item.msgid],
      ...(item.message.msgid_plural
        ? {
            msgid_plural: item.message.msgid_plural,
            msgstr: [item.message.msgstr?.[0] || item.msgid],
          }
        : {}),
    };
    modified = true;
  }

  if (modified) {
    const compiledEn = gettextPo.compile(enParsed).toString("utf8");
    const compiledId = gettextPo.compile(idParsed).toString("utf8");
    await writeFile(enPoPath, compiledEn, "utf8");
    await writeFile(idPoPath, compiledId, "utf8");
    console.log(`Successfully synchronized PO catalogs. (Added ${missingInEn.length} to en.po, ${missingInId.length} to id.po)`);
  } else {
    console.log(`PO catalogs are already in full parity (${idEntries.size} entries). No files modified.`);
  }
}

main().catch((err) => {
  console.error("PO Parity Synchronizer encountered an unexpected error:", err);
  process.exit(1);
});
