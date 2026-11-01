import assert from "node:assert/strict";
import test from "node:test";
import { QlAccessError, QlConflictError, QlValidationError } from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import manifest from "../__manifest__.js";
import {
  approveTranslation,
  getPublishedCatalog,
  importPoDrafts,
  listEnabledLanguages,
  listAdminTranslations,
  saveTranslationDraft,
} from "./catalog-service.js";
import { compilePoCatalog, parsePoCatalog } from "./po.js";

const source = "Save {name}";
const translated = "Simpan {name}";
const serviceManifest = { ...manifest, data: [] };

void test("i18n manifest seeds languages and catalogs using insert-only defaults", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      manifest,
    ],
    async (orm) => {
      assert.deepEqual(
        (await listEnabledLanguages(orm)).map(({ code }) => code),
        ["en", "id"],
      );
      const translations = await getPublishedCatalog(orm, "id");
      assert.ok(translations.length > 0);
      const first = translations[0];
      const catalogKey = `id:${first.namespace}:${first.key}`;
      await orm.updateRecordsForService(
        "i18n.language",
        { code: "id" },
        { label: "Local language label" },
      );
      await orm.updateRecordsForService(
        "i18n.translation",
        { catalog_key: catalogKey },
        { translated_text: "Local translation" },
      );

      await orm.seedAddonData("ql_i18n");
      assert.equal(
        (
          await orm.findOneByService("i18n.language", { code: "id" })
        )?.label,
        "Local language label",
      );
      assert.equal(
        (
          await orm.findOneByService("i18n.translation", {
            catalog_key: catalogKey,
          })
        )?.translated_text,
        "Local translation",
      );
    },
  );
});

void test("PO catalog parsing preserves namespaced message keys and placeholders", () => {
  const po = compilePoCatalog("id", [
    {
      namespace: "web.common",
      key: "save",
      sourceText: source,
      translatedText: translated,
      context: "Primary form action",
    },
  ]);
  assert.deepEqual(parsePoCatalog(po), [
    {
      namespace: "web.common",
      key: "save",
      sourceText: source,
      translatedText: translated,
    },
  ]);
});

void test("PO parsing and compilation preserve locale-specific plural forms", () => {
  const englishPo = compilePoCatalog("en", [
    {
      namespace: "web.common",
      key: "items",
      sourceText: "{count} item",
      sourcePluralText: "{count} items",
      translatedText: "{count} item",
      translatedPluralTexts: {
        one: "{count} item",
        other: "{count} items",
      },
    },
  ]);
  assert.deepEqual(parsePoCatalog(englishPo, "en"), [
    {
      namespace: "web.common",
      key: "items",
      sourceText: "{count} item",
      sourcePluralText: "{count} items",
      translatedText: "{count} item",
      translatedPluralTexts: {
        one: "{count} item",
        other: "{count} items",
      },
    },
  ]);

  const indonesianPo = compilePoCatalog("id", [
    {
      namespace: "web.common",
      key: "items",
      sourceText: "{count} item",
      sourcePluralText: "{count} items",
      translatedText: "{count} benda",
      translatedPluralTexts: { other: "{count} benda" },
    },
  ]);
  assert.deepEqual(parsePoCatalog(indonesianPo, "id"), [
    {
      namespace: "web.common",
      key: "items",
      sourceText: "{count} item",
      sourcePluralText: "{count} items",
      translatedText: "{count} benda",
      translatedPluralTexts: { other: "{count} benda" },
    },
  ]);
});

void test("PO catalog rejects unbalanced placeholders and malformed keys", () => {
  assert.throws(
    () =>
      compilePoCatalog("id", [
        {
          namespace: "web.common",
          key: "save",
          sourceText: source,
          translatedText: "Simpan",
        },
      ]),
    QlValidationError,
  );
  assert.throws(
    () =>
      compilePoCatalog("id", [
        {
          namespace: "web",
          key: "Not valid",
          sourceText: "Save",
          translatedText: "Simpan",
        },
      ]),
    QlValidationError,
  );
  assert.throws(
    () =>
      compilePoCatalog("en", [
        {
          namespace: "web.common",
          key: "items",
          sourceText: "{count} item",
          sourcePluralText: "{count} items",
          translatedText: "{count} benda",
          translatedPluralTexts: { one: "{count} benda" },
        },
      ]),
    QlValidationError,
  );
});

void test("PO import parsing rejects empty singular and plural translations", () => {
  const singular = [
    'msgid ""',
    'msgstr ""',
    "",
    'msgctxt "web.common:save"',
    'msgid "Save"',
    'msgstr "  "',
  ].join("\n");
  assert.throws(() => parsePoCatalog(singular, "id"), QlValidationError);

  const plural = [
    'msgid ""',
    'msgstr ""',
    "",
    'msgctxt "web.common:items"',
    'msgid "{count} item"',
    'msgid_plural "{count} items"',
    'msgstr[0] ""',
    'msgstr[1] "{count} items"',
  ].join("\n");
  assert.throws(() => parsePoCatalog(plural, "en"), QlValidationError);
});

void test("catalog service keeps drafts private and publishes only reviewed entries", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      serviceManifest,
    ],
    async (orm) => {
      const draft = await saveTranslationDraft(
        orm,
        {
          locale: "id",
          namespace: "web.common",
          key: "save",
          sourceText: source,
          translatedText: translated,
        },
        "admin-1",
      );
      assert.equal(draft.status, "draft");
      assert.deepEqual(await getPublishedCatalog(orm, "id"), []);
      assert.equal((await listAdminTranslations(orm, "id")).length, 1);

      const published = await approveTranslation(orm, draft.id, "admin-2");
      assert.equal(published.status, "published");
      assert.deepEqual(await getPublishedCatalog(orm, "id"), [
        { namespace: "web.common", key: "save", value: translated },
      ]);
      await assert.rejects(
        () => approveTranslation(orm, draft.id, "admin-2"),
        QlConflictError,
      );
      await assert.rejects(
        () =>
          orm.findMany("i18n.translation", {
            id: "member-1",
            groups: ["user"],
          }),
        QlAccessError,
      );
    },
  );
});

void test("imported PO entries remain drafts until approved", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      serviceManifest,
    ],
    async (orm) => {
      const po = compilePoCatalog("id", [
        {
          namespace: "web.common",
          key: "save",
          sourceText: source,
          translatedText: translated,
        },
      ]);
      const imported = await importPoDrafts(orm, "id", po, "admin-1");
      assert.equal(imported.length, 1);
      assert.equal(imported[0].draftSource, "import");
      assert.equal(imported[0].status, "draft");
      assert.deepEqual(await getPublishedCatalog(orm, "id"), []);
    },
  );
});

void test("unsupported locales are rejected before catalog access", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      serviceManifest,
    ],
    async (orm) => {
      await assert.rejects(
        () =>
          saveTranslationDraft(
            orm,
            {
              locale: "fr" as "id",
              namespace: "web.common",
              key: "save",
              sourceText: source,
              translatedText: translated,
            },
            "admin-1",
          ),
        QlValidationError,
      );
    },
  );
});
