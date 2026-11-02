import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createConversationStore, type ConversationStore } from "@moonwitness/database";
import {
  apiRoutes,
  type SemanticGraphConceptsResponseDto,
  type SemanticGraphResponseDto,
} from "@moonwitness/moonclient";
import { createQlOrm, type QlOrm } from "ql_orm";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import corpusManifest from "ql_corpus/__manifest__";
import researchManifest from "ql_research/__manifest__";
import searchManifest from "ql_search/__manifest__";
import sourceManifest from "ql_source/__manifest__";
import { createApiServer } from "./server.js";

const testPassword = "correct horse battery staple";
const ownerEmail = "graph-owner@example.com";
const memberEmail = "graph-member@example.com";

let server: ReturnType<typeof createApiServer>;
let address: string;
let orm: QlOrm;
let closeOrm: () => void;
let store: ConversationStore;
let ownerCookie: string;
let memberCookie: string;

interface Reply<T> {
  status: number;
  text: string;
  body: T;
}

async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; cookie?: string } = {},
): Promise<Reply<T>> {
  const response = await fetch(`${address}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      cookie: init.cookie ?? ownerCookie,
    },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return { status: response.status, text, body: body as T };
}

async function register(email: string): Promise<string> {
  const response = await fetch(`${address}${apiRoutes.auth.register}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Tester", email, password: testPassword }),
  });
  assert.equal(response.status, 201);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}

async function seedNode(input: {
  slug: string;
  titleId: string;
  titleEn: string;
  category?: "concept" | "surah" | "prophet_narrative" | "legal_ruling";
  passageCount?: number;
}): Promise<void> {
  await orm.createRecordForService("search.thematic_node", {
    slug: input.slug,
    title_id: input.titleId,
    title_en: input.titleEn,
    category: input.category ?? "concept",
    passage_count: input.passageCount ?? 0,
  });
}

async function seedEdge(input: {
  source: string;
  target: string;
  relation?: "chronological" | "thematic_echo" | "contrast" | "elaboration";
  weight?: number;
  evidence?: Array<{ surah: number; ayah: number }>;
}): Promise<void> {
  await orm.createRecordForService("search.semantic_edge", {
    source_node_slug: input.source,
    target_node_slug: input.target,
    relation_type: input.relation ?? "thematic_echo",
    weight: input.weight ?? 1,
    evidence_payload: JSON.stringify(input.evidence ?? []),
  });
}

before(async () => {
  const runtime = await createQlOrm("file::memory:", [
    baseManifest,
    authManifest,
    sourceManifest,
    corpusManifest,
    researchManifest,
    searchManifest,
  ]);
  orm = runtime.orm;
  closeOrm = runtime.close;
  store = createConversationStore(orm);
  server = createApiServer(undefined, store, orm);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const where = server.address();
  assert.ok(where && typeof where !== "string");
  address = `http://127.0.0.1:${where.port}`;
  const setup = await fetch(`${address}${apiRoutes.auth.setup}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Owner",
      email: ownerEmail,
      password: testPassword,
    }),
  });
  assert.equal(setup.status, 201);
  ownerCookie = (setup.headers.get("set-cookie") ?? "").split(";", 1)[0];
  memberCookie = await register(memberEmail);
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  closeOrm();
});

void test("the graph routes answer instead of falling through to 404", async () => {
  // Before Batch 3 these two paths had no handler at all: the exact-match
  // search dispatch could never reach `/search/graph/...`, so a caller got a
  // 404. Unauthenticated now has to mean 401, which is the observable proof
  // that a handler owns the prefix.
  for (const path of [
    apiRoutes.searchGraph.allConcepts,
    apiRoutes.searchGraph.byConcept("nur"),
  ]) {
    const response = await fetch(`${address}${path}`);
    assert.equal(response.status, 401, path);
  }
});

void test("empty curated tables give an honest empty graph", async () => {
  const concepts = await api<SemanticGraphConceptsResponseDto>(
    apiRoutes.searchGraph.allConcepts,
    { cookie: memberCookie },
  );
  assert.equal(concepts.status, 200, concepts.text);
  assert.deepEqual(concepts.body.concepts, []);

  const missing = await api<SemanticGraphResponseDto>(
    apiRoutes.searchGraph.byConcept("nur"),
    { cookie: memberCookie },
  );
  assert.equal(missing.status, 404, missing.text);
  assert.match(missing.text, /thematic concept/i);
});

void test("the concept list is the thematic_node table, sorted and bilingual", async () => {
  // Seeded out of alphabetical order so the sort has to come from the read
  // path rather than from insertion luck.
  await seedNode({ slug: "sabr", titleId: "Kesabaran", titleEn: "Patience", passageCount: 90 });
  await seedNode({ slug: "nur", titleId: "Cahaya", titleEn: "Light", passageCount: 12 });
  await seedNode({
    slug: "iman",
    titleId: "Keimanan",
    titleEn: "Faith",
    category: "concept",
    passageCount: 40,
  });

  const reply = await api<SemanticGraphConceptsResponseDto>(
    apiRoutes.searchGraph.allConcepts,
    { cookie: memberCookie },
  );
  assert.equal(reply.status, 200, reply.text);
  assert.deepEqual(
    reply.body.concepts.map((concept) => concept.slug),
    ["iman", "nur", "sabr"],
  );
  const nur = reply.body.concepts.find((concept) => concept.slug === "nur");
  assert.ok(nur);
  assert.equal(nur.titleId, "Cahaya");
  assert.equal(nur.titleEn, "Light");
  assert.equal(nur.passageCount, 12);
  assert.equal(nur.category, "concept");
  assert.ok(nur.id.length > 0, "the row id has to survive the DTO");
});

void test("weights, relations and citations come from the edge rows", async () => {
  await seedEdge({
    source: "nur",
    target: "iman",
    relation: "elaboration",
    weight: 7,
    evidence: [
      { surah: 24, ayah: 35 },
      { surah: 2, ayah: 255 },
    ],
  });
  await seedEdge({ source: "iman", target: "sabr", relation: "chronological", weight: 3 });
  await seedEdge({ source: "nur", target: "ghost", relation: "contrast", weight: 2 });

  const reply = await api<SemanticGraphResponseDto>(
    apiRoutes.searchGraph.byConcept("nur"),
    { cookie: memberCookie },
  );
  assert.equal(reply.status, 200, reply.text);
  const graph = reply.body;
  assert.equal(graph.conceptSlug, "nur");
  assert.deepEqual(
    graph.nodes.map((node) => node.slug),
    ["iman", "nur"],
    "sabr is two hops away and 'ghost' is undeclared, so neither is drawn",
  );
  assert.equal(graph.totalEdges, 2);
  assert.equal(graph.unresolvedEndpointCount, 1);
  assert.equal(graph.edges.length, 1);
  const edge = graph.edges[0];
  assert.equal(edge.sourceSlug, "nur");
  assert.equal(edge.targetSlug, "iman");
  assert.equal(edge.relationType, "elaboration");
  assert.equal(edge.weight, 7, "weight is the curated column, never an index derivation");
  assert.deepEqual(edge.evidencePassages, [
    { surah: 2, ayah: 255 },
    { surah: 24, ayah: 35 },
  ]);

  const other = await api<SemanticGraphResponseDto>(
    apiRoutes.searchGraph.byConcept("sabr"),
    { cookie: memberCookie },
  );
  assert.equal(other.status, 200, other.text);
  assert.deepEqual(
    other.body.nodes.map((node) => node.slug),
    ["iman", "sabr"],
  );
});

void test("a bad slug or an unknown graph route is refused explicitly", async () => {
  for (const raw of ["Nur", "a%2Fb", "%20nur", "n".repeat(65)]) {
    const reply = await api<SemanticGraphResponseDto>(
      `/search/graph/concepts/${raw}`,
    );
    assert.equal(reply.status, 400, `${raw} -> ${reply.status} ${reply.text}`);
  }

  const offRoute = await api<{ error: string }>("/search/graph/orphans");
  assert.equal(offRoute.status, 404, offRoute.text);

  const wrongMethod = await api<{ error: string }>(
    apiRoutes.searchGraph.allConcepts,
    { method: "POST" },
  );
  assert.equal(wrongMethod.status, 405, wrongMethod.text);
});

void test("an impossible citation fails the request instead of emptying the evidence", async () => {
  // Runs last: one unparseable `evidence_payload` fails every graph read on
  // this table, which is the intended loud behaviour, and it must not make the
  // tests above depend on a curated row being broken.
  await seedEdge({
    source: "sabr",
    target: "iman",
    relation: "thematic_echo",
    evidence: [{ surah: 114, ayah: 7 }],
  });

  const reply = await api<SemanticGraphResponseDto>(
    apiRoutes.searchGraph.byConcept("nur"),
  );
  assert.equal(reply.status, 400, reply.text);
  assert.match(reply.text, /addressable verse/i);
});
