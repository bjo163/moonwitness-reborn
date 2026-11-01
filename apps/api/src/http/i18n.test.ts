import assert from "node:assert/strict";
import test from "node:test";
import { createConversationStore } from "@moonwitness/database";
import { createQlOrm } from "ql_orm";
import aiManifest from "ql_ai/__manifest__";
import authManifest from "ql_auth/__manifest__";
import { ROLE_CATALOG, seedRoles } from "ql_auth/services/rbac";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import cloudflareManifest from "ql_cloudflare/__manifest__";
import corpusManifest from "ql_corpus/__manifest__";
import integrationManifest from "ql_integration/__manifest__";
import { CONNECTOR_KINDS } from "ql_integration/services/connector-registry";
import {
  SYNC_STATUSES,
} from "ql_integration/services/connector-vocabulary";
import i18nManifest from "ql_i18n/__manifest__";
import { uiCatalogs } from "ql_i18n/catalogs";
import researchManifest from "ql_research/__manifest__";
import sourceManifest from "ql_source/__manifest__";
import workflowManifest from "ql_workflow/__manifest__";
import {
  seedCatalogs,
  seedLanguages,
} from "ql_i18n/services/catalog-service";
import { createApiServer } from "./server.js";

void test("authored addon metadata keys exist in both bundled locale catalogs", () => {
  const manifests = [
    aiManifest,
    authManifest,
    baseManifest,
    chatManifest,
    cloudflareManifest,
    corpusManifest,
    integrationManifest,
    i18nManifest,
    researchManifest,
    sourceManifest,
    workflowManifest,
  ];
  const requiredKeys = new Set<string>();

  for (const manifest of manifests) {
    for (const model of [
      ...manifest.models,
      ...(manifest.computedModels ?? []),
    ]) {
      // Generated labels remain usable through the API's source-text fallback;
      // authored translation keys must always resolve in both bundled locales.
      if (model.labelKey) requiredKeys.add(model.labelKey);
      if (model.descriptionKey) requiredKeys.add(model.descriptionKey);
      const modelViews = manifest.views.filter(
        (view) => view.model === model.name,
      );
      for (const view of modelViews) {
        if (view.labelKey) requiredKeys.add(view.labelKey);
        if (view.helpKey) requiredKeys.add(view.helpKey);
      }
      for (const field of Object.values(model.fields)) {
        if (field.private) continue;
        if (field.labelKey) requiredKeys.add(field.labelKey);
        if (field.helpKey) requiredKeys.add(field.helpKey);
        for (const selectionKey of Object.values(field.selectionKeys ?? {})) {
          requiredKeys.add(selectionKey);
        }
      }
    }
    if (manifest.views.some((view) => view.type === "list")) {
      requiredKeys.add("web.models.viewList");
    }
    if (manifest.views.some((view) => view.type === "form")) {
      requiredKeys.add("web.models.viewForm");
    }
  }

  for (const definition of CONNECTOR_KINDS) {
    requiredKeys.add(definition.labelKey);
    requiredKeys.add(definition.credentialHelpKey);
    for (const capability of definition.capabilities) {
      requiredKeys.add(`web.connectors.capabilities.${capability}`);
    }
  }
  for (const status of SYNC_STATUSES) {
    requiredKeys.add(`web.connectors.syncStatuses.${status}`);
  }
  for (const role of ROLE_CATALOG) {
    requiredKeys.add(`web.adminUsers.roles.${role.code}.name`);
    requiredKeys.add(`web.adminUsers.roles.${role.code}.description`);
  }

  const missing = [...requiredKeys].flatMap((key) =>
    (["id", "en"] as const)
      .filter((locale) => !Object.hasOwn(uiCatalogs[locale], key))
      .map((locale) => `${locale}:${key}`),
  );
  assert.deepEqual(missing, []);
});

void test("published catalogs are public while draft management is admin-only", async () => {
  const runtime = await createQlOrm("file::memory:", [
    authManifest,
    baseManifest,
    chatManifest,
    i18nManifest,
  ]);
  const store = createConversationStore(runtime.orm);
  const server = createApiServer(
    {
      generate() {
        return Promise.resolve("Menyimpan {name}...");
      },
    },
    store,
    runtime.orm,
  );
  try {
    await seedRoles(runtime.orm);
    await seedLanguages(runtime.orm);
    await seedCatalogs(runtime.orm);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address !== null && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const publicResponse = await fetch(
      `${baseUrl}/translations/catalog?locale=id&namespace=web`,
    );
    assert.equal(publicResponse.status, 200);
    const publicCatalog = await publicResponse.json() as {
      locale: string;
      entries: Array<{ namespace: string; key: string; value: string }>;
    };
    assert.equal(publicCatalog.locale, "id");
    assert.ok(
      publicCatalog.entries.some(
        (entry) => entry.namespace === "web" && entry.key === "common.chat",
      ),
    );

    const unsupportedLocale = await fetch(
      `${baseUrl}/translations/catalog?locale=fr`,
    );
    assert.equal(unsupportedLocale.status, 400);
    assert.equal(
      (await unsupportedLocale.json() as { code: string }).code,
      "I18N_REQUEST_INVALID",
    );

    const memberResponse = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Translator",
        email: "translator@example.com",
        password: "correct horse battery staple",
      }),
    });
    assert.equal(memberResponse.status, 201);
    const memberCookie = memberResponse.headers.get("set-cookie");
    assert.ok(memberCookie !== null);
    const cookie = memberCookie.split(";", 1)[0];

    const denied = await fetch(`${baseUrl}/admin/translations`, {
      headers: { cookie },
    });
    assert.equal(denied.status, 403);

    const member = await runtime.orm.findOneByService("res.users", {
      email: "translator@example.com",
    });
    assert.ok(member);
    await runtime.orm.updateRecordsForService(
      "res.users",
      { id: member.id },
      { role: "super_admin" },
    );

    const draftResponse = await fetch(`${baseUrl}/admin/translations`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        locale: "en",
        namespace: "web.common",
        key: "saving",
        sourceText: "Saving {name}...",
        translatedText: "Saving {name}...",
      }),
    });
    assert.equal(draftResponse.status, 200);
    const { translation } = await draftResponse.json() as {
      translation: { id: string; status: string };
    };
    assert.equal(translation.status, "draft");

    const aiDraftResponse = await fetch(
      `${baseUrl}/admin/translations/ai-draft`,
      {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({
          locale: "id",
          namespace: "web.common",
          key: "aiSaving",
          sourceText: "Saving {name}...",
          context: "Progress indicator",
        }),
      },
    );
    assert.equal(aiDraftResponse.status, 200);
    const { translation: aiDraft } = await aiDraftResponse.json() as {
      translation: { id: string; status: string; draftSource: string };
    };
    assert.equal(aiDraft.status, "draft");
    assert.equal(aiDraft.draftSource, "ai");
    const aiDraftCatalog = await fetch(
      `${baseUrl}/translations/catalog?locale=id&namespace=web.common`,
    );
    const aiDraftCatalogData = await aiDraftCatalog.json() as {
      entries: Array<{ key: string }>;
    };
    assert.equal(
      aiDraftCatalogData.entries.some((entry) => entry.key === "aiSaving"),
      false,
    );

    const draftCatalog = await fetch(
      `${baseUrl}/translations/catalog?locale=en&namespace=web.common`,
    );
    const draftCatalogData = await draftCatalog.json() as {
      entries: Array<{ key: string }>;
    };
    assert.equal(
      draftCatalogData.entries.some((entry) => entry.key === "saving"),
      false,
    );

    const approve = await fetch(
      `${baseUrl}/admin/translations/${encodeURIComponent(translation.id)}/approve`,
      { method: "POST", headers: { cookie } },
    );
    assert.equal(approve.status, 200);
    const publishedCatalog = await fetch(
      `${baseUrl}/translations/catalog?locale=en&namespace=web.common`,
    );
    const publishedData = await publishedCatalog.json() as {
      entries: Array<{ key: string; value: string }>;
    };
    assert.ok(
      publishedData.entries.some(
        (entry) => entry.key === "saving" && entry.value === "Saving {name}...",
      ),
    );

    const exported = await fetch(
      `${baseUrl}/admin/translations/export?locale=en`,
      { headers: { cookie } },
    );
    assert.equal(exported.status, 200);
    assert.match(
      (await exported.json() as { content: string }).content,
      /Saving \{name\}\.\.\./,
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      if (!server.listening) {
        resolve();
        return;
      }
      server.close((error) => (error ? reject(error) : resolve()));
    });
    store.close();
    runtime.close();
  }
});
