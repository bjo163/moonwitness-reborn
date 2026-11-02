import assert from "node:assert/strict";
import test from "node:test";
import { loadAddons, QlAccessError, QlValidationError } from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import attachmentManifest from "../__manifest__.js";
import { ATTACHMENT_MODEL, UPLOAD_MODEL } from "../services/attachment-vocabulary.js";

const owner = { id: "owner-1", groups: ["user"] };

const manifests = [
  stubAddonManifest("ql_base"),
  stubAddonManifest("ql_auth"),
  attachmentManifest,
];

function attachmentValues(overrides: Record<string, unknown> = {}) {
  return {
    name: "notes.pdf",
    kind: "document",
    mime_type: "application/pdf",
    size_bytes: 1024,
    state: "uploading",
    driver: "local-disk",
    storage_key: "ir/attachment/00000000-0000-4000-8000-000000000001",
    created_at: new Date(1),
    updated_at: new Date(1),
    ...overrides,
  };
}

void test("the attachment addon loads after its dependencies", () => {
  const order = loadAddons([...manifests].reverse()).map((addon) => addon.name);
  assert.ok(order.indexOf("ql_base") < order.indexOf("ql_attachment"));
  assert.ok(order.indexOf("ql_auth") < order.indexOf("ql_attachment"));
  assert.equal(attachmentManifest.category, "system");
});

void test("both models are registered with owner scoping and no seed data", () => {
  const names = attachmentManifest.models.map((model) => model.name);
  assert.deepEqual(names, [ATTACHMENT_MODEL, UPLOAD_MODEL]);
  for (const model of attachmentManifest.models) {
    assert.equal(model.ownerField, "owner_id");
    assert.equal(model.fields.owner_id?.private, true);
  }
  assert.deepEqual(attachmentManifest.data, []);
});

void test("user ACL is read and unlink only, and upload sessions have none", () => {
  const rule = attachmentManifest.access.find(
    (entry) => entry.model === ATTACHMENT_MODEL && entry.group === "user",
  );
  assert.equal(rule?.read, true);
  assert.equal(rule?.write, false);
  assert.equal(rule?.create, false);
  assert.equal(rule?.unlink, true);
  assert.equal(
    attachmentManifest.access.some((entry) => entry.model === UPLOAD_MODEL),
    false,
  );
});

void test("views never expose the private storage key", () => {
  for (const view of attachmentManifest.views) {
    assert.equal(view.model, ATTACHMENT_MODEL);
    assert.equal(view.fields.includes("storage_key"), false);
    assert.equal(view.fields.includes("owner_id"), false);
    for (const field of view.fields) {
      assert.ok(attachmentManifest.models[0].fields[field], `unknown field ${field}`);
    }
  }
});

void test("a user cannot insert an attachment row through generic CRUD", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await assert.rejects(
      () => orm.create(ATTACHMENT_MODEL, owner, attachmentValues()),
      QlAccessError,
    );
  });
});

void test("service inserts keep storage_key out of every user-visible read", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    const created = await orm.createForService(ATTACHMENT_MODEL, owner.id, attachmentValues());
    assert.equal(typeof created.id, "string");
    assert.equal("storage_key" in created, false);
    assert.equal("owner_id" in created, false);
    const rows = await orm.findMany(ATTACHMENT_MODEL, owner);
    assert.equal(rows.length, 1);
    assert.equal("storage_key" in rows[0], false);
    // The service path can still see it, because serving needs the location.
    const [internal] = await orm.findManyByService(ATTACHMENT_MODEL, {
      owner_id: owner.id,
    });
    assert.match(String(internal["storage_key"]), /^ir\/attachment\//);
  });
});

void test("column limits and validators reject bad attachment metadata", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    const cases: [string, Record<string, unknown>][] = [
      ["kind", { kind: "executable" }],
      ["state", { state: "half-written" }],
      ["sha256", { sha256: "not-a-digest" }],
      ["size_bytes", { size_bytes: 500 * 1024 * 1024 + 1 }],
      ["size_bytes", { size_bytes: -1 }],
      ["name", { name: "x".repeat(241) }],
    ];
    for (const [field, override] of cases) {
      await assert.rejects(
        () => orm.createForService(ATTACHMENT_MODEL, owner.id, { ...attachmentValues(), ...override }),
        QlValidationError,
        `expected ${field} to be rejected`,
      );
    }
  });
});

void test("upload sessions validate their own declared digest shape", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await assert.rejects(
      () =>
        orm.createForService(UPLOAD_MODEL, owner.id, {
          attachment_id: "attachment-1",
          state: "open",
          chunk_size: 4 * 1024 * 1024,
          total_chunks: 2,
          expected_bytes: 8 * 1024 * 1024,
          declared_sha256: "ZZZ",
          expires_at: new Date(2),
          created_at: new Date(1),
          updated_at: new Date(1),
        }),
      QlValidationError,
    );
    const session = await orm.createForService(UPLOAD_MODEL, owner.id, {
      attachment_id: "attachment-1",
      state: "open",
      chunk_size: 4 * 1024 * 1024,
      total_chunks: 2,
      expected_bytes: 8 * 1024 * 1024,
      expires_at: new Date(2),
      created_at: new Date(1),
      updated_at: new Date(1),
    });
    assert.equal(session["state"], "open");
    assert.equal("owner_id" in session, false);
  });
});
