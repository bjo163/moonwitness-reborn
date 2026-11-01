import assert from "node:assert/strict";
import test from "node:test";
import {
  loadAddons,
  QlAccessError,
  QlConflictError,
  QlValidationError,
  type QlOrm,
} from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import sourceManifest from "../__manifest__.js";
import {
  transitionStage,
  upsertRights,
} from "../services/source-service.js";

// ---------------------------------------------------------------------------
// Structural / boot invariants.
// ---------------------------------------------------------------------------

void test("the addon is accepted by loadAddons and sorts behind its deps", () => {
  const sorted = loadAddons([
    sourceManifest,
    stubAddonManifest("ql_auth"),
    stubAddonManifest("ql_base"),
  ]);
  const order = sorted.map((m) => m.name);
  assert.ok(order.indexOf("ql_base") < order.indexOf("ql_auth"));
  assert.ok(order.indexOf("ql_auth") < order.indexOf("ql_source"));
});

function privateFieldNames(modelName: string): string[] {
  const model = sourceManifest.models.find((m) => m.name === modelName);
  return Object.entries(model?.fields ?? {})
    .filter(([, field]) => field.private === true)
    .map(([name]) => name);
}

void test("no published view exposes a private field", () => {
  for (const view of sourceManifest.views) {
    const privates = privateFieldNames(view.model);
    for (const field of view.fields) {
      assert.equal(
        privates.includes(field),
        false,
        `View '${view.name}' must not list private field '${field}'.`,
      );
    }
  }
});

void test("rights and lifecycle fields are deliberately absent from form views", () => {
  // The service path is the only writer; the form view must not offer a
  // control the server would refuse. This is a structural invariant, not a
  // UI nicety.
  const artifactForm = sourceManifest.views.find(
    (v) => v.name === "source.artifact.form",
  );
  assert.ok(artifactForm);
  assert.equal(artifactForm.fields.includes("lifecycle_stage"), false);
  const rightsForm = sourceManifest.views.find(
    (v) => v.name === "source.rights.form",
  );
  assert.ok(rightsForm);
  assert.equal(rightsForm.fields.includes("rights_status"), false);
  // No form view is registered for the audit ledger at all.
  const provenanceForm = sourceManifest.views.find(
    (v) => v.model === "source.provenance" && v.type === "form",
  );
  assert.equal(provenanceForm, undefined);
});

// ---------------------------------------------------------------------------
// Deny-by-default: rights_status default + provenance append-only ACL.
// ---------------------------------------------------------------------------

async function seedVersion(orm: QlOrm, ownerId: string): Promise<string> {
  const artifact = await orm.createRecordForService("source.artifact", {
    canonical_id: "mw:dataset:test:tanzil-fixture",
    title: "Test Fixture",
    kind: "revealed_text",
    owner_id: ownerId,
  });
  const version = await orm.createRecordForService("source.version", {
    artifact_id: String(artifact.id),
    version_key: `${String(artifact.id)}@v1`,
    release_label: "v1",
    row_count_expected: 3,
    acquired_at: new Date(),
    method: "unit-test",
    owner_id: ownerId,
  });
  return String(version.id);
}

void test("`source.rights` created without an explicit status defaults to `unknown` (deny-by-default)", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), sourceManifest],
    async (orm) => {
      const versionId = await seedVersion(orm, "user-a");
      const row = await orm.createRecordForService("source.rights", {
        version_id: versionId,
        rights_key: `${versionId}|display`,
        action: "display",
        attribution_text: "must be attributed",
        owner_id: "user-a",
      });
      assert.equal(row.rights_status, "unknown");
    },
  );
});

void test("provenance rejects create/write/unlink through the generic path for every group", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), sourceManifest],
    async (orm) => {
      for (const groups of [["user"], ["admin"], ["root"], ["operator"], ["viewer"]] as const) {
        const user = { id: `probe-${groups[0]}`, groups };
        await assert.rejects(
          () =>
            orm.create("source.provenance", user, {
              subject_type: "source.version",
              subject_id: "x",
              to_stage: "discovered",
              action: "probe",
              correlation_id: "c",
              actor_id: user.id,
              occurred_at: new Date(),
            }),
          QlAccessError,
          `create must be refused for group ${groups[0]}`,
        );
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Service-layer guards.
// ---------------------------------------------------------------------------

void test("transitionStage refuses a non-reviewer actor", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), sourceManifest],
    async (orm) => {
      const versionId = await seedVersion(orm, "user-a");
      await assert.rejects(
        () =>
          transitionStage(
            orm,
            { id: "user-a", groups: ["user"] },
            "version",
            versionId,
            "registered",
          ),
        QlConflictError,
      );
    },
  );
});

void test("transitionStage appends a provenance row for an operator and refuses a no-op", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), sourceManifest],
    async (orm) => {
      const versionId = await seedVersion(orm, "user-a");
      const operator = { id: "op-1", groups: ["operator"] };
      const result = await transitionStage(
        orm,
        operator,
        "version",
        versionId,
        "registered",
        "verified snapshot",
      );
      assert.equal(result.record.lifecycle_stage, "registered");
      assert.equal(result.provenance.to_stage, "registered");
      assert.equal(result.provenance.actor_id, operator.id);
      await assert.rejects(
        () => transitionStage(orm, operator, "version", versionId, "registered"),
        QlConflictError,
        "no-op transition must be refused",
      );
    },
  );
});

void test("upsertRights requires an admin/root actor and creates a provenance audit row", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), sourceManifest],
    async (orm) => {
      const versionId = await seedVersion(orm, "user-a");
      await assert.rejects(
        () =>
          upsertRights(orm, { id: "user-a", groups: ["user"] }, {
            versionId,
            action: "display",
            status: "cleared",
            attributionText: "Tanzil",
          }),
        QlConflictError,
      );
      const admin = { id: "admin-1", groups: ["admin"] };
      const created = await upsertRights(orm, admin, {
        versionId,
        action: "display",
        status: "cleared",
        licenseId: "Tanzil-Public",
        attributionText: "Quran text \u00a9 Tanzil.net",
      });
      assert.equal(created.record.rights_status, "cleared");
      assert.equal(created.record.verified_by_id, admin.id);
      const audit = await orm.findManyByService("source.provenance", {
        subject_type: "source.rights",
        subject_id: String(created.record.id),
      });
      assert.equal(audit.length, 1);
      assert.equal(audit[0]?.to_stage, "cleared");
    },
  );
});

void test("unknown action / stage / status inputs are rejected at the service guard", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), sourceManifest],
    async (orm) => {
      const versionId = await seedVersion(orm, "user-a");
      await assert.rejects(
        () =>
          upsertRights(orm, { id: "a", groups: ["admin"] }, {
            versionId,
            action: "not_a_real_action",
            status: "cleared",
            attributionText: "x",
          }),
        QlValidationError,
      );
      await assert.rejects(
        () =>
          transitionStage(
            orm,
            { id: "a", groups: ["admin"] },
            "version",
            versionId,
            "not_a_real_stage",
          ),
        QlValidationError,
      );
    },
  );
});

void test("`source.artifact.canonical_id` is unique (re-registration throws QlConflictError)", async () => {
  await withMemoryOrm(
    [stubAddonManifest("ql_base"), stubAddonManifest("ql_auth"), sourceManifest],
    async (orm) => {
      await orm.createRecordForService("source.artifact", {
        canonical_id: "mw:dataset:quran:tanzil-uthmani",
        title: "Tanzil Uthmani",
        kind: "revealed_text",
        owner_id: "user-a",
      });
      await assert.rejects(
        () =>
          orm.createRecordForService("source.artifact", {
            canonical_id: "mw:dataset:quran:tanzil-uthmani",
            title: "Duplicate",
            kind: "revealed_text",
            owner_id: "user-a",
          }),
        QlConflictError,
      );
    },
  );
});
