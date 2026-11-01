import assert from "node:assert/strict";
import test from "node:test";
import { createConversationStore } from "@moonwitness/database";
import { createQlOrm } from "ql_orm";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import i18nManifest from "ql_i18n/__manifest__";
import {
  seedCatalogs,
  seedLanguages,
} from "ql_i18n/services/catalog-service";
import { seedRoles } from "ql_auth/services/rbac";
import { createApiServer } from "./server.js";

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
