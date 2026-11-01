import assert from "node:assert/strict";
import test from "node:test";
import { QlAccessError, QlValidationError, loadAddons } from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import manifest from "../__manifest__.js";
import { countries } from "../data/countries.js";

void test("country catalog has unique ISO alpha-2 codes and English names", () => {
  assert.equal(countries.length, 249);
  assert.equal(new Set(countries.map((country) => country.code)).size, 249);
  assert.ok(countries.every(({ code, name }) => /^[A-Z]{2}$/.test(code) && name));
  assert.equal(countries.find(({ code }) => code === "ID")?.name, "Indonesia");
  assert.equal(countries.find(({ code }) => code === "US")?.name, "United States");
});

void test("geo addon declares safe read-only country reference data", () => {
  const addons = loadAddons([manifest, stubAddonManifest("ql_base")]);
  assert.deepEqual(addons.map((addon) => addon.name), ["ql_base", "ql_geo"]);
  assert.equal(manifest.models.find((model) => model.name === "res.country")?.ownerField, undefined);
  assert.deepEqual(
    manifest.views.map((view) => view.fields),
    [["code", "name"], ["code", "name"]],
  );
  assert.equal(manifest.access[0].read, true);
  assert.equal(manifest.access[0].write, false);
  assert.equal(manifest.access[0].create, false);
  assert.equal(manifest.access[0].unlink, false);
});

void test("boot seeds every country idempotently and validates code values", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), manifest],
    async (orm) => {
      const first = await orm.findManyByService(
        "res.country",
        {},
        { limit: 300, orderBy: { field: "code", direction: "asc" } },
      );
      assert.equal(first.length, 249);
      assert.equal(first.find((country) => country.code === "ID")?.name, "Indonesia");
      await orm.seedAddonData("ql_geo");
      assert.equal(
        (await orm.findManyByService("res.country", {}, { limit: 300 })).length,
        249,
      );

      await assert.rejects(
        () =>
          orm.createRecordForService("res.country", {
            code: "id",
            name: "Invalid",
          }),
        QlValidationError,
      );
      await assert.rejects(
        () =>
          orm.create("res.country", { id: "member", groups: ["user"] }, {
            code: "ZZ",
            name: "Not allowed",
          }),
        QlAccessError,
      );
    },
  );
});
