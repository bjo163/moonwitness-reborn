import assert from "node:assert/strict";
import test from "node:test";
import { MoonClient, MoonClientError, apiRoutes, moonClient } from "./index.js";

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
