import assert from "node:assert/strict";
import test from "node:test";
import {
  MoonClient,
  MoonClientError,
  apiRoutes,
  moonClient,
  type ChatCitationDto,
  type ChatGroundingStatusDto,
  type ChatRequestDto,
  type ChatResponseDto,
  type GroundedChatResponseDto,
} from "./index.js";

function recorder(response: unknown = {}) {
  const requests: Array<{ url: string; method?: string; body: string }> = [];
  const client = new MoonClient({
    baseUrl: "/api",
    fetcher: (input, init = {}) => {
      let url: string;
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else {
        url = input.url;
      }
      requests.push({
        url,
        method: init.method,
        body: typeof init.body === "string" ? init.body : "",
      });
      return Promise.resolve(new Response(JSON.stringify(response), { status: 200 }));
    },
  });
  return { client, requests };
}

void test("MoonClient centralizes URL, request method, and JSON body", async () => {
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const client = new MoonClient({
    baseUrl: "https://api.example.test/",
    fetcher: (input, init = {}) => {
      let url: string;
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else {
        url = input.url;
      }
      requests.push({ url, init });
      return Promise.resolve(new Response(
        JSON.stringify({
          conversation: {
            id: "created",
            title: "Test",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        }),
        { status: 201 },
      ));
    },
  });

  void test("MoonClient updates the authenticated account locale through shared routes", async () => {
    const { client, requests } = recorder();
    await client.updatePreferredLocale("en");

    assert.equal(apiRoutes.auth.preferences, "/auth/me/preferences");
    assert.equal(requests[0].url, "/api/auth/me/preferences");
    assert.equal(requests[0].method, "PATCH");
    assert.deepEqual(JSON.parse(requests[0].body), { preferredLocale: "en" });
  });

  await client.createConversation({ title: "Test" });

  assert.equal(requests[0].url, "https://api.example.test/conversations");
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[0].init.credentials, "same-origin");
  const body = requests[0].init.body;
  assert.equal(typeof body, "string");
  assert.deepEqual(JSON.parse(body as string), { title: "Test" });
});

void test("MoonClient encodes route segments and exposes API error status", async () => {
  const requestedUrls: string[] = [];
  const client = new MoonClient({
    baseUrl: "/api",
    fetcher: (input) => {
      let url: string;
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else {
        url = input.url;
      }
      requestedUrls.push(url);
      return Promise.resolve(new Response(JSON.stringify({
        code: "I18N_ACCESS_DENIED",
        error: "Access denied.",
      }), {
        status: 403,
      }));
    },
  });

  await assert.rejects(client.listMessages("thread/one"), (error: unknown) => {
    assert.ok(error instanceof MoonClientError);
    assert.equal(error.message, "Access denied.");
    assert.equal(error.status, 403);
    assert.equal(error.code, "I18N_ACCESS_DENIED");
    return true;
  });
  assert.equal(requestedUrls[0], "/api/conversations/thread%2Fone/messages");
});

void test("MoonClient centralizes locale catalog and translation administration routes", async () => {
  const { client, requests } = recorder();
  await client.listUiLanguages();
  await client.getTranslationCatalog("id", "web.common");
  await client.listAdminTranslations("en");
  await client.saveTranslationDraft({
    locale: "id",
    namespace: "web.common",
    key: "save",
    sourceText: "Save",
    translatedText: "Simpan",
  });
  await client.approveTranslation("translation/one");
  await client.importTranslationPo("id", "msgid \"Save\"");
  await client.exportTranslationPo("en");
  await client.createAiTranslationDraft({
    locale: "en",
    namespace: "web.common",
    key: "save",
    sourceText: "Simpan",
  });

  assert.equal(requests[0].url, "/api/translations/languages");
  assert.equal(
    requests[1].url,
    "/api/translations/catalog?locale=id&namespace=web.common",
  );
  assert.equal(
    requests[2].url,
    "/api/admin/translations?locale=en",
  );
  assert.equal(requests[3].url, "/api/admin/translations");
  assert.equal(requests[3].method, "POST");
  assert.equal(
    requests[4].url,
    "/api/admin/translations/translation%2Fone/approve",
  );
  assert.deepEqual(JSON.parse(requests[5].body), {
    locale: "id",
    content: 'msgid "Save"',
  });
  assert.equal(
    requests[6].url,
    "/api/admin/translations/export?locale=en",
  );
  assert.equal(requests[7].url, "/api/admin/translations/ai-draft");
  assert.deepEqual(JSON.parse(requests[7].body), {
    locale: "en",
    namespace: "web.common",
    key: "save",
    sourceText: "Simpan",
  });
});

void test("MoonClient centralizes the first-use setup contract", async () => {
  const { client, requests } = recorder();

  await client.initialSetupStatus();
  await client.completeInitialSetup({
    name: "Initial Owner",
    email: "owner@example.com",
    password: "correct horse battery staple",
    preferredLocale: "en",
  });

  assert.equal(apiRoutes.auth.setup, "/auth/setup");
  assert.equal(requests[0].url, "/api/auth/setup");
  assert.equal(requests[0].method, "GET");
  assert.equal(requests[1].url, "/api/auth/setup");
  assert.equal(requests[1].method, "POST");
  assert.deepEqual(JSON.parse(requests[1].body), {
    name: "Initial Owner",
    email: "owner@example.com",
    password: "correct horse battery staple",
    preferredLocale: "en",
  });
});

void test("MoonClient uses the shared read-only computed-model route", async () => {
  const { client, requests } = recorder({ records: [] });
  await client.computeModel("corpus.lexical_candidate", {
    filters: { edition_key: "edition/ar" },
    limit: 25,
  });

  assert.equal(
    apiRoutes.models.compute("corpus.lexical_candidate"),
    "/models/corpus.lexical_candidate/compute",
  );
  assert.equal(requests[0].url, "/api/models/corpus.lexical_candidate/compute");
  assert.equal(requests[0].method, "POST");
  assert.deepEqual(JSON.parse(requests[0].body), {
    filters: { edition_key: "edition/ar" },
    limit: 25,
  });
});

void test("MoonClient uses the shared lexical research review contract", async () => {
  const { client, requests } = recorder({
    candidates: [],
    review: { id: "review-1" },
  });
  await client.listLexicalResearchCandidates("edition/ar");
  await client.createLexicalResearchReview("candidate/1", {
    edition_key: "edition/ar",
    normalized_form: "الرحمن",
    decision: "retain_for_research",
    rationale: "Keep for separate linguistic review.",
  });

  assert.equal(
    apiRoutes.research.lexicalCandidateQueue("edition/ar"),
    "/research/lexical-candidates?edition_key=edition%2Far",
  );
  assert.equal(
    apiRoutes.research.lexicalCandidateReview("candidate/1"),
    "/research/lexical-candidates/candidate%2F1/reviews",
  );
  assert.equal(
    requests[0].url,
    "/api/research/lexical-candidates?edition_key=edition%2Far",
  );
  assert.equal(requests[0].method, "GET");
  assert.equal(
    requests[1].url,
    "/api/research/lexical-candidates/candidate%2F1/reviews",
  );
  assert.equal(requests[1].method, "POST");
  assert.deepEqual(JSON.parse(requests[1].body), {
    edition_key: "edition/ar",
    normalized_form: "الرحمن",
    decision: "retain_for_research",
    rationale: "Keep for separate linguistic review.",
  });
});

void test("connector routes stay under one prefix and encode every id", async () => {
  const { client, requests } = recorder();

  await client.listConnectors();
  await client.createConnector({ kind: "cloudflare", label: "Produksi" });
  await client.updateConnector("c/1", { enabled: false });
  await client.deleteConnector("c/1", { confirmLabel: "Produksi" });
  await client.verifyConnector("c/1");
  await client.syncConnector("c/1");
  await client.listConnectorZones("c/1");
  await client.listConnectorRecords("c/1", "z/2", { name: "api.example.com", type: "A" });
  await client.createConnectorRecord("c/1", "z/2", {
    name: "api",
    type: "A",
    content: "203.0.113.7",
    ttl: 120,
    proxied: false,
  });
  await client.updateConnectorRecord("c/1", "z/2", "r/3", {
    name: "api",
    type: "A",
    content: "203.0.113.8",
    ttl: 120,
    proxied: false,
  });
  await client.deleteConnectorRecord("c/1", "z/2", "r/3", {
    confirmName: "api.example.com",
  });
  await client.listConnectorAudit("c/1");

  assert.deepEqual(
    requests.map(({ url, method }) => `${method ?? "GET"} ${url}`),
    [
      "GET /api/settings/connectors",
      "POST /api/settings/connectors",
      "PUT /api/settings/connectors/c%2F1",
      "DELETE /api/settings/connectors/c%2F1",
      "POST /api/settings/connectors/c%2F1/verify",
      "POST /api/settings/connectors/c%2F1/sync",
      "GET /api/settings/connectors/c%2F1/zones",
      "GET /api/settings/connectors/c%2F1/zones/z%2F2/records?name=api.example.com&type=A",
      "POST /api/settings/connectors/c%2F1/zones/z%2F2/records",
      "PATCH /api/settings/connectors/c%2F1/zones/z%2F2/records/r%2F3",
      "DELETE /api/settings/connectors/c%2F1/zones/z%2F2/records/r%2F3",
      "GET /api/settings/connectors/c%2F1/audit",
    ],
  );

  for (const path of [
    apiRoutes.connectors.collection,
    apiRoutes.connectors.prefix,
    apiRoutes.connectors.item("x"),
    apiRoutes.connectors.verify("x"),
    apiRoutes.connectors.sync("x"),
    apiRoutes.connectors.zones("x"),
    apiRoutes.connectors.records("x", "y"),
    apiRoutes.connectors.record("x", "y", "z"),
    apiRoutes.connectors.audit("x"),
  ]) {
    assert.ok(
      path.startsWith("/settings/connectors"),
      `Route '${path}' escaped the connector prefix.`,
    );
  }
});

void test("workflow routes stay under the /workflow prefix and encode every id", async () => {
  const { client, requests } = recorder();

  await client.listWorkflowQueue();
  await client.requestWorkflowTransition("c/1", { action: "submit", reason: "ready" });
  await client.listWorkflowTransitions("c/1");

  assert.deepEqual(
    requests.map(({ url, method }) => `${method ?? "GET"} ${url}`),
    [
      "GET /api/workflow/queue",
      "POST /api/workflow/changes/c%2F1/transition",
      "GET /api/workflow/changes/c%2F1/transitions",
    ],
  );

  for (const path of [
    apiRoutes.workflow.queue,
    apiRoutes.workflow.collection,
    apiRoutes.workflow.prefix,
    apiRoutes.workflow.item("x"),
    apiRoutes.workflow.transition("x"),
    apiRoutes.workflow.transitions("x"),
  ]) {
    assert.ok(
      path.startsWith("/workflow"),
      `Route '${path}' escaped the workflow prefix.`,
    );
  }
});

void test("project progress uses shared public-summary and gated-task routes", async () => {
  const { client, requests } = recorder();
  await client.projectProgressSummary();
  await client.listProjectTasks();

  assert.equal(apiRoutes.projectProgress.summary, "/project/progress/summary");
  assert.equal(apiRoutes.projectProgress.tasks, "/project/progress/tasks");
  assert.deepEqual(
    requests.map(({ url, method }) => `${method ?? "GET"} ${url}`),
    [
      "GET /api/project/progress/summary",
      "GET /api/project/progress/tasks",
    ],
  );
});

void test("corpus and source routes stay under their own prefixes and encode every id", () => {
  for (const path of [
    apiRoutes.corpus.editions,
    apiRoutes.corpus.prefix,
    apiRoutes.corpus.edition("mw:edition:x"),
    apiRoutes.corpus.surah("mw:edition:x", 2),
    apiRoutes.corpus.verse("mw:edition:x", 2, 255),
  ]) {
    assert.ok(
      path.startsWith("/corpus"),
      `Route '${path}' escaped the corpus prefix.`,
    );
  }
  for (const path of [
    apiRoutes.source.artifacts,
    apiRoutes.source.prefix,
    apiRoutes.source.item("a/1"),
    apiRoutes.source.rights("a/1"),
    apiRoutes.source.provenance("a/1"),
  ]) {
    assert.ok(
      path.startsWith("/source"),
      `Route '${path}' escaped the source prefix.`,
    );
  }
  // IDs must be URL-encoded so `/` and other reserved characters cannot
  // break out of the path segment.
  assert.equal(apiRoutes.source.item("a/1"), "/source/artifacts/a%2F1");
  assert.equal(
    apiRoutes.corpus.verse("mw:edition:x|ar", 1, 1),
    "/corpus/editions/mw%3Aedition%3Ax%7Car/surahs/1/verses/1",
  );
});

void test("MoonClient reaches the ayah proof contract on the shared path", async () => {
  const { client, requests } = recorder({ status: "verified", isValid: true });
  await client.getAyahProof("mw:edition:quran|ar", 2, 255);
  await client.verifyAyahProof({
    surahNumber: 2,
    ayahNumber: 255,
    editionCode: "mw:edition:quran|ar",
    claimedHash: "a".repeat(64),
  });

  assert.equal(
    apiRoutes.corpusProofs.getProof("mw:edition:quran|ar", 2, 255),
    "/corpus/proofs/mw%3Aedition%3Aquran%7Car/2/255",
  );
  assert.equal(requests[0].url, "/api/corpus/proofs/mw%3Aedition%3Aquran%7Car/2/255");
  assert.equal(requests[0].method, "GET");
  assert.equal(requests[1].url, "/api/corpus/proofs/verify");
  assert.equal(requests[1].method, "POST");

  // The server dispatches the locator form with three segments under the same
  // prefix, so `verify` must never be parseable as `edition/surah/ayah`.
  assert.ok(apiRoutes.corpusProofs.verify.startsWith(apiRoutes.corpusProofs.prefix));
  assert.equal(
    new RegExp(
      `^${apiRoutes.corpusProofs.prefix}([^/]+)/([0-9]+)/([0-9]+)$`,
    ).test(apiRoutes.corpusProofs.verify),
    false,
  );
});

void test("no connector contract surface accepts a credential", () => {
  const clientMembers = [
    ...Object.getOwnPropertyNames(MoonClient.prototype),
    ...Object.keys(moonClient),
  ];
  for (const name of clientMembers) {
    assert.equal(
      /(set|upload|rotate|update)(Token|Secret|Credential)/i.test(name),
      false,
      `MoonClient.${name} would put a credential back into the app.`,
    );
  }

  for (const [group, routes] of Object.entries(apiRoutes)) {
    const paths = typeof routes === "string"
      ? [routes]
      : Object.values(routes).filter((value): value is string => typeof value === "string");
    for (const path of paths) {
      assert.equal(
        /secret|credential/i.test(path),
        false,
        `Route '${group}${path}' implies stored credentials.`,
      );
    }
  }
});


void test("MoonClient search sends query parameters to apiRoutes.search.query", async () => {
  const { client, requests } = recorder({
    query: "musa",
    total: 1,
    results: [
      {
        id: "entry-1",
        targetModel: "story.narrative",
        targetId: "story-musa",
        token: "musa",
        weight: 3,
        snippet: "Kisah Nabi Musa",
      },
    ],
  });

  const res = await client.search({ q: "musa", targetModel: "story.narrative", limit: 10 });
  assert.equal(requests.length, 1);
  assert.ok(requests[0].url.includes("/search"));
  assert.ok(requests[0].url.includes("q=musa"));
  assert.ok(requests[0].url.includes("targetModel=story.narrative"));
  assert.ok(requests[0].url.includes("limit=10"));
  assert.equal(res.total, 1);
  assert.equal(res.results[0].targetId, "story-musa");
});

void test("MoonClient reindexes a corpus edition through the shared admin route", async () => {
  const { client, requests } = recorder({
    editionKey: "edition-en",
    passageCount: 2,
    indexEntryCount: 4,
  });

  const result = await client.reindexCorpusSearchIndex({
    editionKey: "edition-en",
  });
  assert.equal(apiRoutes.search.reindexCorpus, "/search/corpus-index");
  assert.equal(requests[0].url, "/api/search/corpus-index");
  assert.equal(requests[0].method, "POST");
  assert.deepEqual(JSON.parse(requests[0].body), {
    editionKey: "edition-en",
  });
  assert.deepEqual(result, {
    editionKey: "edition-en",
    passageCount: 2,
    indexEntryCount: 4,
  });
});

// Browser melempar "Failed to execute 'fetch' on 'Window': Illegal invocation"
// kalau fetch menerima this selain global, dan klien menyimpannya sebagai field.
void test("default fetcher calls fetch with the global as receiver", async () => {
  const originalFetch = globalThis.fetch;
  const receivers: unknown[] = [];
  globalThis.fetch = function (this: unknown) {
    receivers.push(this);
    return Promise.resolve(new Response(JSON.stringify({ user: null }), { status: 200 }));
  };
  try {
    await new MoonClient({ baseUrl: "/api" }).currentUser();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(receivers.length, 1);
  assert.equal(receivers[0], globalThis);
});

void test("MoonClient preserves legacy and supports grounded chat contracts", async () => {
  const legacyResponse: ChatResponseDto = { reply: "Legacy answer." };
  const legacy = recorder(legacyResponse);
  const legacyRequest: ChatRequestDto = {
    conversationId: "conversation-1",
    input: "Question?",
  };

  assert.deepEqual(await legacy.client.sendChat(legacyRequest), legacyResponse);
  assert.deepEqual(JSON.parse(legacy.requests[0].body), legacyRequest);

  const citation: ChatCitationDto = {
    evidenceId: "passage-1",
    editionId: "edition-1",
    editionKey: "translation-en",
    authority: "translation",
    editionAuthority: "translation",
    locale: "en",
    publisher: "Publisher",
    attribution: "Attribution",
    locator: "2:255",
    surah: 2,
    ayah: 255,
  };
  const groundedStatus: ChatGroundingStatusDto = "grounded";
  const groundedResponse: GroundedChatResponseDto = {
    reply: "Grounded answer.",
    groundingStatus: groundedStatus,
    citations: [citation],
  };
  const grounded = recorder(groundedResponse);
  const groundedRequest: ChatRequestDto = {
    ...legacyRequest,
    grounding: "grounded",
  };

  assert.deepEqual(
    await grounded.client.sendChat(groundedRequest),
    groundedResponse,
  );
  assert.deepEqual(JSON.parse(grounded.requests[0].body), groundedRequest);

  const insufficientResponse: ChatResponseDto = {
    reply: "The available evidence is insufficient.",
    groundingStatus: "insufficient_evidence",
    citations: [],
  };
  const insufficient = recorder(insufficientResponse);
  assert.deepEqual(
    await insufficient.client.sendChat(groundedRequest),
    insufficientResponse,
  );

  const explicitLegacyResponse: ChatResponseDto = {
    reply: "Legacy answer.",
    groundingStatus: "legacy",
  };
  const explicitLegacy = recorder(explicitLegacyResponse);
  assert.deepEqual(
    await explicitLegacy.client.sendChat(legacyRequest),
    explicitLegacyResponse,
  );
});

void test("MoonClient supports Batch 3 contracts: searchGraph, corpusProofs, and corpusAudio", async () => {
  const { client, requests } = recorder({
    conceptSlug: "nur",
    nodes: [],
    edges: [],
    totalEdges: 0,
  });

  await client.getSemanticGraph("nur");
  assert.equal(requests[0].url, "/api/search/graph/concepts/nur");
  assert.equal(requests[0].method, "GET");

  const proofRecorder = recorder({
    status: "verified",
    isValid: true,
    surahNumber: 1,
    ayahNumber: 1,
    canonicalText: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    authoritativeHash: "abcdef",
    editionTitle: "Mushaf",
  });
  await proofRecorder.client.verifyAyahProof({
    surahNumber: 1,
    ayahNumber: 1,
    editionCode: "uthmani",
    claimedHash: "abcdef",
  });
  assert.equal(proofRecorder.requests[0].url, "/api/corpus/proofs/verify");
  assert.equal(proofRecorder.requests[0].method, "POST");

  const audioRecorder = recorder([]);
  await audioRecorder.client.getReciters();
  assert.equal(audioRecorder.requests[0].url, "/api/corpus/audio/reciters");
  assert.equal(audioRecorder.requests[0].method, "GET");

  const manifestRecorder = recorder({
    surahNumber: 1,
    reciterSlug: "al-husary",
    audioStreamUrl: "https://audio.moonwitness.com/husary/001.mp3",
    durationMs: 45000,
    segments: [],
  });
  await manifestRecorder.client.getSurahAudioManifest("al-husary", 1);
  assert.equal(
    manifestRecorder.requests[0].url,
    "/api/corpus/audio/manifest/al-husary/surah/1",
  );
  assert.equal(manifestRecorder.requests[0].method, "GET");
});

void test("MoonClient supports Batch 5 contracts: covenant, sanad, study circles, deeds, telemetry, export, offline", async () => {
  // Track 16: Covenant
  const covenantRec = recorder({ signatures: [], totalCount: 0 });
  await covenantRec.client.getCovenantLedger("1.0.0");
  assert.equal(covenantRec.requests[0].url, "/api/community/covenants?version=1.0.0");

  const signRec = recorder({
    signatureId: "sig-1",
    signatureHash: "sha256hash",
    signedAt: "2026-11-02T00:00:00Z",
    covenantVersion: "1.0.0",
  });
  await signRec.client.signCovenant({
    covenantVersion: "1.0.0",
    termsDigest: "digest",
    statementAccepted: true,
    contributorCallsign: "Scholar1",
  });
  assert.equal(signRec.requests[0].url, "/api/community/covenants/sign");
  assert.equal(signRec.requests[0].method, "POST");

  // Track 17: Sanad
  const sanadRec = recorder({
    changeId: "ch-1",
    currentState: "in_review",
    requiredReviews: 2,
    approvedCount: 1,
    canPublish: false,
    reviews: [],
  });
  await sanadRec.client.getSanadPipelineStatus("ch-1");
  assert.equal(sanadRec.requests[0].url, "/api/workflow/changes/ch-1/sanad");

  await sanadRec.client.submitPeerReview("ch-1", {
    decision: "approved",
    notes: "Verified classical chain",
    sanadChainRef: "Ibn Kathir",
  });
  assert.equal(sanadRec.requests[1].url, "/api/workflow/changes/ch-1/sanad");
  assert.equal(sanadRec.requests[1].method, "POST");

  // Track 18: Study Circles
  const circlesRec = recorder({ circles: [] });
  await circlesRec.client.listStudyCircles();
  assert.equal(circlesRec.requests[0].url, "/api/community/study-circles");

  const reflRec = recorder({ reflections: [] });
  await reflRec.client.getCircleReflections("circle-1");
  assert.equal(reflRec.requests[0].url, "/api/community/study-circles/circle-1/reflections");

  await reflRec.client.submitCircleReflection("circle-1", {
    passageLocator: "18:10",
    content: "Deep reflection on the cave seekers.",
  });
  assert.equal(reflRec.requests[1].url, "/api/community/study-circles/circle-1/reflections");
  assert.equal(reflRec.requests[1].method, "POST");

  // Track 19: Deeds
  const deedsRec = recorder({ deeds: [], totalCount: 0 });
  await deedsRec.client.getDeedsLedger("typo_correction");
  assert.equal(deedsRec.requests[0].url, "/api/community/deeds-ledger?kind=typo_correction");

  // Track 20: Ethics publish
  const ethicsRec = recorder({
    changeId: "ch-1",
    newState: "under_review",
    ethicsAffirmedAt: "2026-11-02T00:00:00Z",
  });
  await ethicsRec.client.publishWorkflowChange("ch-1", {
    ethicsAffirmation: {
      isNotFatwaAffirmed: true,
      citationsVerifiedAffirmed: true,
      decorumAffirmed: true,
      affirmedAt: "2026-11-02T00:00:00Z",
      ethicsDigest: "hash",
    },
  });
  assert.equal(ethicsRec.requests[0].url, "/api/workflow/changes/ch-1/publish");
  assert.equal(ethicsRec.requests[0].method, "POST");

  // Track 21: Telemetry
  const telemetryRec = recorder({
    uptimeSeconds: 12000,
    apiLatencyP95Ms: 42,
    dbPingMs: 2,
    dnsConnectorsOnline: 1,
    overallStatus: "healthy",
    metrics: [],
  });
  await telemetryRec.client.getSystemTelemetry();
  assert.equal(telemetryRec.requests[0].url, "/api/telemetry/orbit-metrics");

  // Track 25: Offline manifest
  const offlineRec = recorder({ manifests: [] });
  await offlineRec.client.getOfflineCorpusManifest();
  assert.equal(offlineRec.requests[0].url, "/api/corpus/offline-manifest");
});

interface Captured {
  url: string;
  method?: string;
  headers: Record<string, string>;
  body: unknown;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
}

function capture(
  respond: () => { status: number; body: unknown } = () => ({
    status: 200,
    body: {},
  }),
): { client: MoonClient; sent: Captured[] } {
  const sent: Captured[] = [];
  const client = new MoonClient({
    baseUrl: "/api",
    fetcher: (input, init = {}) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      sent.push({
        url,
        method: init.method,
        headers: (init.headers ?? {}) as Record<string, string>,
        body: init.body,
        credentials: init.credentials,
        signal: init.signal ?? undefined,
      });
      const outcome = respond();
      return Promise.resolve(
        new Response(JSON.stringify(outcome.body), { status: outcome.status }),
      );
    },
  });
  return { client, sent };
}

function sentAt(sent: readonly Captured[], index: number): Captured {
  const entry = sent[index];
  if (!entry) throw new Error(`request ${index} was never made`);
  return entry;
}

void test("attachment routes are reached through the shared route table", async () => {
  const { client, sent } = capture();
  await client.listAttachments();
  await client.getAttachment("a-1");
  await client.createAttachmentUpload({
    name: "clip.png",
    mimeType: "image/png",
    kind: "media",
    sizeBytes: 10,
  });
  await client.completeAttachmentUpload("u-1");
  await client.deleteAttachment("a-1");

  assert.deepEqual(
    sent.map((entry) => [entry.method ?? "GET", entry.url]),
    [
      ["GET", "/api/attachments"],
      ["GET", "/api/attachments/a-1"],
      ["POST", "/api/attachments/uploads"],
      ["POST", "/api/attachments/uploads/u-1/complete"],
      ["DELETE", "/api/attachments/a-1"],
    ],
  );
  const createPayload = JSON.parse(sentAt(sent, 2).body as string) as {
    sizeBytes: number;
  };
  assert.equal(createPayload.sizeBytes, 10);
});

void test("a chunk is sent as an octet-stream body, never as JSON", async () => {
  const { client, sent } = capture(() => ({
    status: 200,
    body: { receivedChunks: 1, receivedBytes: 4, totalChunks: 2, expectedBytes: 8 },
  }));
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const controller = new AbortController();
  const progress = await client.uploadAttachmentChunk(
    "u-1",
    1,
    bytes,
    controller.signal,
  );

  assert.equal(progress.receivedBytes, 4);
  const request = sentAt(sent, 0);
  assert.equal(request.method, "PUT");
  assert.equal(request.url, "/api/attachments/uploads/u-1/chunks/1");
  assert.equal(request.headers["content-type"], "application/octet-stream");
  assert.equal(request.body, bytes);
  assert.equal(request.credentials, "same-origin");
  assert.equal(request.signal, controller.signal);
});

void test("a binary failure maps the same code and status as a JSON one", async () => {
  const failing = () => ({
    status: 413,
    body: { error: "Chunk is too large.", code: "ATTACHMENT_TOO_LARGE" },
  });
  const { client } = capture(failing);
  const json = capture(failing).client;

  const binaryError = await client
    .uploadAttachmentChunk("u-1", 0, new Uint8Array([1]))
    .then(() => undefined)
    .catch((error: unknown) => error);
  const jsonError = await json
    .deleteAttachment("a-1")
    .then(() => undefined)
    .catch((error: unknown) => error);

  assert.ok(binaryError instanceof MoonClientError);
  assert.ok(jsonError instanceof MoonClientError);
  assert.equal(binaryError.status, jsonError.status);
  assert.equal(binaryError.code, jsonError.code);
  assert.equal(binaryError.message, "Chunk is too large.");
});

void test("the content URL stays same-origin and cannot gain a path segment", () => {
  assert.equal(
    moonClient.attachmentContentUrl("a-1"),
    `/api${apiRoutes.attachments.content("a-1")}`,
  );
  const tricky = "../else";
  const url = moonClient.attachmentContentUrl(tricky);
  // A literal slash would let an id reshape the route it is served from; the
  // dots survive encoding but stay inside one segment.
  assert.equal(url, "/api/attachments/..%2Felse/content");
  assert.equal(url.split("/").length, 5);
});

