import assert from "node:assert/strict";
import test from "node:test";
import { QlAccessError, QlConflictError, QlValidationError } from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import manifest from "../__manifest__.js";
import {
  approveTranslation,
  getPublishedCatalog,
  importPoDrafts,
  listAdminTranslations,
  saveTranslationDraft,
  seedLanguages,
} from "./catalog-service.js";
import { compilePoCatalog, parsePoCatalog } from "./po.js";

const source = "Save {name}";
const translated = "Simpan {name}";

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

void test("catalog service keeps drafts private and publishes only reviewed entries", async () => {
  await withMemoryOrm(
    [
      stubAddonManifest("ql_base"),
      stubAddonManifest("ql_auth"),
      manifest,
    ],
    async (orm) => {
      await seedLanguages(orm);
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
      manifest,
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
      manifest,
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
