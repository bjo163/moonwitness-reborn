import assert from "node:assert/strict";
import test from "node:test";
import { uiCatalogs } from "../dist/catalogs.js";
import { uiCatalog as englishCatalog } from "../dist/catalogs-en.js";
import { uiCatalog as indonesianCatalog } from "../dist/catalogs-id.js";

void test("locale-specific catalog modules match the combined catalog", () => {
  assert.deepEqual(indonesianCatalog, uiCatalogs.id);
  assert.deepEqual(englishCatalog, uiCatalogs.en);
  assert.deepEqual(
    Object.keys(indonesianCatalog).sort(),
    Object.keys(englishCatalog).sort(),
  );
});
