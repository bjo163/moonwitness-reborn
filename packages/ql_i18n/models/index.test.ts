import assert from "node:assert/strict";
import test from "node:test";
import { loadAddons } from "ql_orm";
import { stubAddonManifest } from "ql_orm/testing";
import manifest from "../__manifest__.js";

void test("ql_i18n declares dependencies and stays deny-by-default for members", () => {
  const loaded = loadAddons([
    manifest,
    stubAddonManifest("ql_auth"),
    stubAddonManifest("ql_base"),
  ]);
  assert.deepEqual(
    loaded.map((addon) => addon.name),
    ["ql_base", "ql_auth", "ql_i18n"],
  );
  assert.equal(
    manifest.access.some(
      (rule) => rule.group === "user" && rule.model === "i18n.translation",
    ),
    false,
  );
  assert.ok(
    manifest.views.every((view) =>
      view.fields.every((field) => {
        const model = manifest.models.find((entry) => entry.name === view.model);
        return model && model.fields[field] && !model.fields[field].private;
      }),
    ),
  );
});
