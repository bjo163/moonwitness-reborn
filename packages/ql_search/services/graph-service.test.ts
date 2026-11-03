import assert from "node:assert/strict";
import test from "node:test";
import corpusManifest from "ql_corpus/__manifest__";
import {
  QlAccessError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlUserContext,
} from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import sourceManifest from "ql_source/__manifest__";
import searchManifest from "../__manifest__.js";
import {
  assertConceptSlug,
  listThematicConcepts,
  parseEvidencePayload,
  readConceptGraph,
} from "./graph-service.js";

const manifests = [
  stubAddonManifest("ql_base"),
  stubAddonManifest("ql_auth"),
  sourceManifest,
  corpusManifest,
  stubAddonManifest("ql_research"),
  searchManifest,
];

const viewer: QlUserContext = { id: "graph-viewer", groups: ["viewer"] };

async function seedNode(
  orm: QlOrm,
  input: {
    slug: string;
    titleId: string;
    titleEn: string;
    category?: "concept" | "surah" | "prophet_narrative" | "legal_ruling";
    passageCount?: number;
  },
): Promise<void> {
  await orm.createRecordForService("search.thematic_node", {
    slug: input.slug,
    title_id: input.titleId,
    title_en: input.titleEn,
    category: input.category ?? "concept",
    passage_count: input.passageCount ?? 0,
  });
}

async function seedEdge(
  orm: QlOrm,
  input: {
    source: string;
    target: string;
    relation?: "chronological" | "thematic_echo" | "contrast" | "elaboration";
    weight?: number;
    evidence?: Array<{ surah: number; ayah: number }>;
  },
): Promise<void> {
  await orm.createRecordForService("search.semantic_edge", {
    source_node_slug: input.source,
    target_node_slug: input.target,
    relation_type: input.relation ?? "thematic_echo",
    weight: input.weight ?? 1,
    evidence_payload: JSON.stringify(input.evidence ?? []),
  });
}

void test("no curated rows produce an empty concept list, not a fabricated graph", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    const concepts = await listThematicConcepts(orm, viewer);
    assert.deepEqual(concepts, []);
    await assert.rejects(
      readConceptGraph(orm, viewer, "nur"),
      QlNotFoundError,
      "an unknown concept must fail rather than return an empty graph",
    );
  });
});

void test("the graph reads nodes, weights, relations and citations from the records", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await seedNode(orm, {
      slug: "nur",
      titleId: "Cahaya",
      titleEn: "Light",
      passageCount: 12,
    });
    await seedNode(orm, {
      slug: "iman",
      titleId: "Keimanan",
      titleEn: "Faith",
      passageCount: 40,
    });
    await seedNode(orm, {
      slug: "unrelated",
      titleId: "Tak terkait",
      titleEn: "Unrelated",
      passageCount: 3,
    });
    await seedEdge(orm, {
      source: "nur",
      target: "iman",
      relation: "elaboration",
      weight: 7,
      evidence: [
        { surah: 24, ayah: 35 },
        { surah: 2, ayah: 255 },
      ],
    });

    const graph = await readConceptGraph(orm, viewer, "nur");
    assert.equal(graph.conceptSlug, "nur");
    assert.deepEqual(
      graph.nodes.map((node) => node.slug),
      ["iman", "nur"],
      "the neighbourhood holds the concept and its declared neighbours only",
    );
    assert.equal(graph.totalEdges, 1);
    assert.equal(graph.unresolvedEndpointCount, 0);
    assert.equal(graph.nodes[1]?.passageCount, 12);
    assert.equal(graph.edges.length, 1);
    const edge = graph.edges[0];
    assert.equal(edge.relationType, "elaboration");
    assert.equal(edge.weight, 7);
    assert.deepEqual(
      edge.evidencePassages,
      [
        { surah: 2, ayah: 255 },
        { surah: 24, ayah: 35 },
      ],
      "citations are sorted by locator so two reads of the same row render alike",
    );

    const concepts = await listThematicConcepts(orm, viewer);
    assert.deepEqual(
      concepts.map((concept) => concept.slug),
      ["iman", "nur", "unrelated"],
    );
    assert.equal(concepts[1]?.titleId, "Cahaya");
    assert.equal(concepts[1]?.titleEn, "Light");
  });
});

void test("an edge to an undeclared node is counted and left out of the drawing", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await seedNode(orm, { slug: "nur", titleId: "Cahaya", titleEn: "Light" });
    await seedEdge(orm, { source: "nur", target: "ghost" });

    const graph = await readConceptGraph(orm, viewer, "nur");
    assert.deepEqual(graph.edges, []);
    assert.deepEqual(
      graph.nodes.map((node) => node.slug),
      ["nur"],
      "no synthetic node is invented for 'ghost'",
    );
    assert.equal(graph.totalEdges, 1);
    assert.equal(graph.unresolvedEndpointCount, 1);
  });
});

void test("a broken or impossible citation fails the read instead of vanishing", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    assert.throws(() => parseEvidencePayload("{not json", "edge-1"), QlValidationError);
    assert.throws(
      () => parseEvidencePayload('{"surah": 2}', "edge-1"),
      QlValidationError,
      "an object is not a citation list",
    );
    assert.throws(
      () => parseEvidencePayload('[{"surah": 2}]', "edge-1"),
      QlValidationError,
      "a citation without an ayah number is not a locator",
    );
    assert.deepEqual(
      parseEvidencePayload('[{"surah": 114, "ayah": 6}]', "edge-1"),
      [{ surah: 114, ayah: 6 }],
    );
    assert.throws(
      () => parseEvidencePayload('[{"surah": 114, "ayah": 7}]', "edge-1"),
      QlValidationError,
      "surah 114 has six verses, so 114:7 cannot be cited",
    );

    await seedNode(orm, { slug: "nur", titleId: "Cahaya", titleEn: "Light" });
    await seedNode(orm, { slug: "iman", titleId: "Keimanan", titleEn: "Faith" });
    await orm.createRecordForService("search.semantic_edge", {
      source_node_slug: "nur",
      target_node_slug: "iman",
      relation_type: "contrast",
      weight: 2,
      evidence_payload: '[{"surah": 7, "ayah": 2031}]',
    });
    await assert.rejects(
      readConceptGraph(orm, viewer, "nur"),
      QlValidationError,
      "a row that cites a verse that does not exist has to be heard about",
    );
  });
});

void test("concept slugs are validated before any scan", () => {
  assert.equal(assertConceptSlug("nur"), "nur");
  assert.equal(assertConceptSlug("laylat-al-qadr"), "laylat-al-qadr");
  for (const bad of ["", "  ", " Nur", "Nur", "nur ", "a/b", "nur%20imam"]) {
    assert.throws(
      () => assertConceptSlug(bad),
      QlValidationError,
      `'${bad}' must be refused`,
    );
  }
  assert.throws(() => assertConceptSlug("n".repeat(65)), QlValidationError);
});

void test("an actor without read access is denied before the tables are scanned", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await seedNode(orm, { slug: "nur", titleId: "Cahaya", titleEn: "Light" });
    const anonymous: QlUserContext = { id: "no-groups", groups: [] };
    await assert.rejects(listThematicConcepts(orm, anonymous), QlAccessError);
    await assert.rejects(readConceptGraph(orm, anonymous, "nur"), QlAccessError);
  });
});

void test("operators get forms for the graph tables and nothing for the index", () => {
  const byModel = new Map<string, string[]>();
  for (const view of searchManifest.views ?? []) {
    const names = byModel.get(view.model) ?? [];
    names.push(view.type);
    byModel.set(view.model, names);
  }
  assert.deepEqual(byModel.get("search.thematic_node"), ["list", "form"]);
  assert.deepEqual(byModel.get("search.semantic_edge"), ["list", "form"]);
  assert.equal(
    byModel.has("search.index_entry"),
    false,
    "derived index tokens must stay out of the view-driven editor",
  );
});

void test("reader groups cannot mint thematic nodes or semantic edges", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    for (const group of ["viewer", "user"]) {
      const reader: QlUserContext = { id: `graph-reader-${group}`, groups: [group] };
      await assert.rejects(
        () =>
          orm.create("search.thematic_node", reader, {
            slug: "denied-node",
            title_id: "Ditolak",
            title_en: "Denied",
            category: "concept",
            passage_count: 0,
          }),
        QlAccessError,
        `a graph node is a scholarly claim, not something group ${group} can post`,
      );
      await assert.rejects(
        () =>
          orm.create("search.semantic_edge", reader, {
            source_node_slug: "denied-node",
            target_node_slug: "another",
            relation_type: "thematic_echo",
            weight: 9,
            evidence_payload: "[]",
          }),
        QlAccessError,
        `a relation between concepts is curated, not written by group ${group}`,
      );
    }
  });
});
