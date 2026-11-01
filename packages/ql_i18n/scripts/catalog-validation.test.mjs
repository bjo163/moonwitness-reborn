import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";
import { po } from "gettext-parser";
import { validatePoMessage } from "./catalog-validation.mjs";

void test("PO validation rejects empty translations and placeholder drift", () => {
  assert.throws(
    () =>
      validatePoMessage(
        "id",
        "web:common.save",
        { msgid: "Save {name}", msgstr: ["  "] },
        ["other"],
      ),
    /empty translation/u,
  );
  assert.throws(
    () =>
      validatePoMessage(
        "en",
        "web:common.save",
        { msgid: "Save {name}", msgstr: ["Save"] },
        ["one", "other"],
      ),
    /does not preserve placeholders/u,
  );
});

void test("PO validation checks every locale-specific plural form", () => {
  assert.deepEqual(
    validatePoMessage(
      "en",
      "web:common.items",
      {
        msgid: "{count} item",
        msgid_plural: "{count} items",
        msgstr: ["{count} item", "{count} items"],
      },
      ["one", "other"],
    ),
    { plural: { one: "{count} item", other: "{count} items" } },
  );
  assert.throws(
    () =>
      validatePoMessage(
        "en",
        "web:common.items",
        {
          msgid: "{count} item",
          msgid_plural: "{count} items",
          msgstr: ["{count} item", ""],
        },
        ["one", "other"],
      ),
    /missing 'other' translation/u,
  );
});

void test("checked-in PO catalogs have matching source strings and valid translations", async () => {
  const catalogs = new Map();
  for (const locale of ["id", "en"]) {
    const source = await readFile(new URL(`../i18n/${locale}.po`, import.meta.url));
    const parsed = po.parse(source);
    const entries = new Map();
    for (const messages of Object.values(parsed.translations)) {
      for (const message of Object.values(messages)) {
        if (!message.msgid) continue;
        const context = message.msgctxt ?? "";
        assert.ok(context.includes(":"), `Missing namespace in ${locale} PO.`);
        validatePoMessage(
          locale,
          context,
          message,
          locale === "id" ? ["other"] : ["one", "other"],
        );
        entries.set(context, [message.msgid, message.msgid_plural ?? null]);
      }
    }
    catalogs.set(locale, entries);
  }

  assert.deepEqual(
    [...catalogs.get("id").keys()].sort(),
    [...catalogs.get("en").keys()].sort(),
  );
  for (const [context, source] of catalogs.get("id")) {
    assert.deepEqual(
      catalogs.get("en").get(context),
      source,
      `Source text for '${context}' differs between locales.`,
    );
  }
});
