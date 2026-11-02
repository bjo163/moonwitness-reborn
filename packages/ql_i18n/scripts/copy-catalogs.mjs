import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { po as gettextPo } from "gettext-parser";
import { validatePoMessage } from "./catalog-validation.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(packageRoot, "i18n");
const dist = join(packageRoot, "dist");
const target = join(dist, "i18n");
const entries = await readdir(source, { withFileTypes: true });

await mkdir(target, { recursive: true });
const catalogues = {};
const sourceTexts = {};
const allKeys = new Set();
const pluralCategories = {
  id: ["other"],
  en: ["one", "other"],
};
for (const entry of entries) {
  if (entry.isFile() && entry.name.endsWith(".po")) {
    await cp(join(source, entry.name), join(target, entry.name));
    const locale = entry.name.slice(0, -3);
    const parsed = gettextPo.parse(await readFile(join(source, entry.name)));
    const catalog = {};
    for (const messages of Object.values(parsed.translations)) {
      for (const message of Object.values(messages)) {
        if (!message.msgid) continue;
        const context = message.msgctxt ?? "";
        const separator = context.indexOf(":");
        if (separator <= 0 || separator === context.length - 1) {
          throw new Error(`PO entry '${context}' needs msgctxt 'namespace:key'.`);
        }
        const key = `${context.slice(0, separator)}.${context.slice(separator + 1)}`;
        if (Object.hasOwn(catalog, key)) {
          throw new Error(`Duplicate PO translation key '${key}' in '${locale}'.`);
        }
        if (message.msgid_plural) {
          const categories = pluralCategories[locale];
          if (!categories) {
            throw new Error(`Plural PO rules are missing for '${locale}'.`);
          }
          catalog[key] = validatePoMessage(
            locale,
            context,
            message,
            categories,
          );
        } else {
          catalog[key] = validatePoMessage(locale, context, message, []);
        }
        sourceTexts[locale] ??= {};
        sourceTexts[locale][key] = [
          message.msgid,
          message.msgid_plural ?? null,
        ];
        allKeys.add(key);
      }
    }
    catalogues[locale] = catalog;
  }
}

const locales = Object.keys(catalogues).sort();
if (locales.join(",") !== "en,id") {
  throw new Error("PO catalogs must define exactly the enabled locales: en and id.");
}
const referenceKeys = Object.keys(catalogues.id).sort();
const englishKeys = Object.keys(catalogues.en).sort();
if (JSON.stringify(referenceKeys) !== JSON.stringify(englishKeys)) {
  throw new Error("The Indonesian and English PO catalogs must have identical keys.");
}
for (const key of referenceKeys) {
  if (
    JSON.stringify(sourceTexts.id[key]) !==
    JSON.stringify(sourceTexts.en[key])
  ) {
    throw new Error(`PO source text for '${key}' must match between locales.`);
  }
}

await writeFile(
  join(dist, "catalogs.js"),
  `export const uiCatalogs = Object.freeze(${JSON.stringify(catalogues)});\n`,
  "utf8",
);
for (const locale of locales) {
  await writeFile(
    join(dist, `catalogs-${locale}.js`),
    `export const uiCatalog = Object.freeze(${JSON.stringify(catalogues[locale])});\n`,
    "utf8",
  );
  await writeFile(
    join(dist, `catalogs-${locale}.d.ts`),
    'import type { UiCatalogMessage, UiMessageKey } from "./catalogs.js";\n' +
      "export declare const uiCatalog: Readonly<Record<UiMessageKey, UiCatalogMessage>>;\n",
    "utf8",
  );
}
const keyUnion = [...allKeys].sort().map((key) => JSON.stringify(key)).join(" | ");
await writeFile(
  join(dist, "catalogs.d.ts"),
  `import type { UiLocale } from "@moonwitness/types";\nexport type UiMessageKey = ${keyUnion || "never"};\nexport type UiPluralCategory = "one" | "other";\nexport type UiCatalogMessage = string | { plural: Readonly<Partial<Record<UiPluralCategory, string>>> };\nexport declare const uiCatalogs: Readonly<Record<UiLocale, Readonly<Record<UiMessageKey, UiCatalogMessage>>>>;\n`,
  "utf8",
);
