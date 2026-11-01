import assert from "node:assert/strict";
import test from "node:test";
import {
  loadAddons,
  QlAccessError,
  QlValidationError,
} from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import integrationManifest from "../__manifest__.js";
import { integrationConnector } from "../models/integration_connector.js";
import {
  CONNECTOR_KINDS,
  connectorKindAllowsWrites,
  connectorKindSupports,
  isKnownConnectorKind,
} from "../services/connector-registry.js";

const user = { id: "owner-1", groups: ["user"] };
const other = { id: "owner-2", groups: ["user"] };

// Stub owners of the declared dependencies so this addon is tested in isolation.
const stub = stubAddonManifest;

function privateFieldNames(modelName: string): string[] {
  const addon = loadAddons([
    stub("ql_base"),
    stub("ql_auth"),
    integrationManifest,
  ]).find((manifest) => manifest.name === "ql_integration");
  const model = addon?.models.find((entry) => entry.name === modelName);
  return Object.entries(model?.fields ?? {})
    .filter(([, field]) => field.private)
    .map(([name]) => name);
}

function connectorValues(overrides: Record<string, unknown> = {}) {
  return {
    kind: "cloudflare",
    label: "Produksi",
    ...overrides,
  };
}

function withOrm(run: Parameters<typeof withMemoryOrm>[1]): Promise<void> {
  return withMemoryOrm([stub("ql_base"), stub("ql_auth"), integrationManifest], run);
}

void test("the addon topologically sorts behind its dependencies", () => {
  const sorted = loadAddons([
    integrationManifest,
    stub("ql_auth"),
    stub("ql_base"),
  ]);
  assert.deepEqual(
    sorted.map((manifest) => manifest.name),
    ["ql_base", "ql_auth", "ql_integration"],
  );
});

void test("connector and audit rows are read-only for the user group", () => {
  const registryCan = (model: string, group: string, operation: "read" | "write" | "create" | "unlink") => {
    const rules = (integrationManifest.access ?? []).filter(
      (rule) => rule.model === model && rule.group === group,
    );
    return rules.some((rule) => rule[operation] === true);
  };
  for (const model of ["integration.connector", "integration.audit"]) {
    assert.equal(registryCan(model, "user", "read"), true);
    assert.equal(registryCan(model, "user", "write"), false);
    assert.equal(registryCan(model, "user", "create"), false);
    assert.equal(registryCan(model, "user", "unlink"), false);
    assert.equal(registryCan(model, "admin", "read"), false);
  }
});

void test("no published view exposes a private field", () => {
  for (const view of integrationManifest.views) {
    const privateNames = privateFieldNames(view.model);
    for (const field of view.fields) {
      assert.equal(
        privateNames.includes(field),
        false,
        `View '${view.name}' must not list private field '${field}'.`,
      );
    }
  }
});

void test("the connector table has no column that could hold a token", async () => {
  for (const [name, field] of Object.entries(integrationConnector.fields)) {
    if (field.private === true) continue;
    assert.equal(
      /secret|cipher|api_key/.test(name),
      false,
      `Column '${name}' looks like credential storage.`,
    );
    assert.notEqual(
      field.type,
      "text",
      `Column '${name}' is a text blob; tokens do not belong in this table.`,
    );
  }
  assert.ok(
    (integrationConnector.fields.token_ref?.maxLength ?? 0) <= 200,
    "token_ref must stay a location label, not a payload",
  );

  await withOrm(async (orm) => {
    await assert.rejects(
      () => orm.create("integration.connector", user, connectorValues()),
      QlAccessError,
    );
    await orm.createRecordForService("integration.connector", {
      ...connectorValues(),
      owner_id: user.id,
    });
    const [visible] = await orm.findMany("integration.connector", user);
    assert.equal(visible?.label, "Produksi");
    assert.equal(visible?.token_source, "unresolved");
    assert.equal("owner_id" in visible, false);
    assert.deepEqual(await orm.findMany("integration.connector", other), []);
  });
});

void test("connector enums and kind slugs are validated by the model", async () => {
  await withOrm(async (orm) => {
    await assert.rejects(
      () =>
        orm.createRecordForService("integration.connector", {
          ...connectorValues({ kind: "CloudFlare" }),
          owner_id: user.id,
        }),
      QlValidationError,
    );
    await assert.rejects(
      () =>
        orm.createRecordForService("integration.connector", {
          ...connectorValues({ verify_status: "maybe" }),
          owner_id: user.id,
        }),
      /verify_status/,
    );
    const stored = await orm.createRecordForService("integration.connector", {
      ...connectorValues(),
      owner_id: user.id,
    });
    assert.equal(stored.verify_status, "unverified");
    assert.equal(stored.enabled, true);
  });
});

void test("audit actions are appended and constrained", async () => {
  await withOrm(async (orm) => {
    const row = await orm.createRecordForService("integration.audit", {
      connector_id: "connector-1",
      action: "delete",
      target: "api.example.com",
      owner_id: user.id,
    });
    assert.equal(row.outcome, "ok");
    assert.equal(row.zone_id, null);
    await assert.rejects(
      () =>
        orm.createRecordForService("integration.audit", {
          connector_id: "connector-1",
          action: "truncate",
          target: "api.example.com",
          owner_id: user.id,
        }),
      /action/,
    );
  });
});

void test("the kind registry only advertises implemented transports", () => {
  assert.equal(isKnownConnectorKind("cloudflare"), true);
  assert.equal(isKnownConnectorKind("cloudflare_read"), true);
  assert.equal(isKnownConnectorKind("coolify"), false);
  assert.equal(connectorKindSupports("cloudflare", "dns"), true);
  assert.equal(connectorKindSupports("cloudflare_read", "dns"), true);
  assert.equal(connectorKindSupports("coolify", "dns"), false);
  assert.equal(connectorKindAllowsWrites("cloudflare"), true);
  assert.equal(connectorKindAllowsWrites("cloudflare_read"), false);
  assert.equal(connectorKindAllowsWrites("deleted_kind"), false);
});

void test("no connector kind asks the app to store a credential", () => {
  for (const definition of CONNECTOR_KINDS) {
    assert.equal(
      "secretLabel" in definition || "secretPlaceholder" in definition,
      false,
      `Kind '${definition.kind}' still advertises a secret input.`,
    );
    assert.ok(definition.credentialHelp.length > 20);
    assert.ok(definition.helpUrl.startsWith("https://"));
  }
});
