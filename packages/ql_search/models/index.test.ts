import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../__manifest__.js";
import { searchIndexEntryModel } from "./search_index_entry.js";
import { tokenizeText, generateIndexEntries } from "../services/search-indexing-service.js";

test("ql_search manifest and model specifications", () => {
  assert.equal(manifest.name, "ql_search");
  assert.equal(manifest.models.length, 1);
  assert.equal(searchIndexEntryModel.name, "search.index_entry");
  assert.equal(searchIndexEntryModel.fields.token.type, "char");
  assert.equal(searchIndexEntryModel.fields.target_model.type, "char");
  assert.equal(searchIndexEntryModel.fields.weight.type, "integer");
});

test("tokenizeText extracts unique tokens without stopwords", () => {
  const tokens = tokenizeText("Kisah Nabi Musa dan Fir'aun di Laut Merah");
  assert.ok(tokens.includes("kisah"));
  assert.ok(tokens.includes("nabi"));
  assert.ok(tokens.includes("musa"));
  assert.ok(tokens.includes("merah"));
  // Stopword "dan" and "di" should be filtered
  assert.ok(!tokens.includes("dan"));
  assert.ok(!tokens.includes("di"));
});

test("generateIndexEntries excludes private fields", () => {
  const doc = {
    targetModel: "witness.statement",
    targetId: "stmt-01",
    fields: {
      title: "Pernyataan Saksi Kunci",
      narrative: "Melihat fenomena di lembah",
      secret_memo: "Rahasia intelijen privat",
    },
    privateFieldNames: ["secret_memo"],
    ownerId: "user-1",
  };

  const entries = generateIndexEntries(doc);
  assert.ok(entries.length > 0);
  assert.ok(entries.some((e) => e.token === "pernyataan"));
  assert.ok(entries.some((e) => e.token === "fenomena"));
  // Private field token must not exist
  assert.ok(!entries.some((e) => e.token === "rahasia"));
  assert.ok(!entries.some((e) => e.token === "intelijen"));
});
