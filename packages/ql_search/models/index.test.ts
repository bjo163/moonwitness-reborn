import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../__manifest__.js";
import { searchIndexEntryModel } from "./search_index_entry.js";
import { searchThematicNode } from "./search_thematic_node.js";
import { searchSemanticEdge } from "./search_semantic_edge.js";
import { tokenizeText, generateIndexEntries } from "../services/search-indexing-service.js";

void test("ql_search manifest and model specifications", () => {
  assert.equal(manifest.name, "ql_search");
  assert.equal(manifest.models.length, 3);
  assert.equal(searchIndexEntryModel.name, "search.index_entry");
  assert.equal(searchIndexEntryModel.fields.token.type, "char");
  assert.equal(searchIndexEntryModel.fields.target_model.type, "char");
  assert.equal(searchIndexEntryModel.fields.weight.type, "integer");

  assert.equal(searchThematicNode.name, "search.thematic_node");
  assert.equal(searchThematicNode.fields.slug.type, "char");
  assert.equal(searchThematicNode.fields.category.type, "char");

  assert.equal(searchSemanticEdge.name, "search.semantic_edge");
  assert.equal(searchSemanticEdge.fields.relation_type.type, "char");
  assert.equal(searchSemanticEdge.fields.weight.type, "integer");
});

void test("tokenizeText extracts unique tokens without stopwords", () => {
  const tokens = tokenizeText("Kisah Nabi Musa dan Fir'aun di Laut Merah");
  assert.ok(tokens.includes("kisah"));
  assert.ok(tokens.includes("nabi"));
  assert.ok(tokens.includes("musa"));
  assert.ok(tokens.includes("merah"));
  // Stopword "dan" and "di" should be filtered
  assert.ok(!tokens.includes("dan"));
  assert.ok(!tokens.includes("di"));
});

void test("generateIndexEntries excludes private fields", () => {
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

void test("generateIndexEntries generates unique collision-free IDs for long model names and UUIDs", () => {
  const doc = {
    targetModel: "research.lexical_candidate",
    targetId: "123e4567-e89b-12d3-a456-426614174000",
    fields: {
      candidate_term: "terminologi linguistik komparatif",
    },
  };
  const entries = generateIndexEntries(doc);
  assert.equal(entries.length, 3);
  const ids = new Set(entries.map((e) => e.id));
  assert.equal(ids.size, 3, "All token entry IDs must be distinct despite long targetModel and UUID");
  for (const entry of entries) {
    assert.ok(entry.id.length <= 64, `ID '${entry.id}' must not exceed 64 chars`);
    assert.ok(entry.id.startsWith("idx_"));
  }
});
