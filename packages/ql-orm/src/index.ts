import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type Client, type InValue } from "@libsql/client";
import { Pool, types as pgTypes } from "pg";
import type {
  AddonCategory,
  FieldType as QlFieldType,
  LandingViewSection,
  Operation as QlOperation,
  RecordValue,
  RecordValues,
  ViewType,
} from "@moonwitness/types";

export type {
  AddonCategory,
  FieldType as QlFieldType,
  LandingViewSection,
  Operation as QlOperation,
} from "@moonwitness/types";

export interface QlFieldDefinition {
  type: QlFieldType;
  labelKey?: string;
  helpKey?: string;
  selectionKeys?: Record<string, string>;
  required?: boolean;
  unique?: boolean;
  maxLength?: number;
  private?: boolean;
  default?: string | number | boolean;
  minValue?: number;
  maxValue?: number;
  compute?: QlComputedFieldDefinition;
  validator?(value: unknown): string | undefined;
}

export interface QlComputedFieldDefinition {
  dependsOn: readonly string[];
  resolve(record: Readonly<QlRecord>): QlServiceValue;
}

export interface QlModelDefinition {
  name: string;
  labelKey?: string;
  description: string;
  descriptionKey?: string;
  tableName: string;
  fields: Record<string, QlFieldDefinition>;
  ownerField?: string;
}

export interface QlComputedModelQuery {
  filters?: Record<string, QlServiceValue>;
  limit?: number;
}

export interface QlComputedModelContext {
  orm: QlOrm;
  user: QlUserContext;
  query: Required<QlComputedModelQuery>;
}

export interface QlComputedModelDefinition {
  name: string;
  labelKey?: string;
  description: string;
  descriptionKey?: string;
  sources: readonly string[];
  queryFields?: Record<string, QlFieldDefinition>;
  fields: Record<string, QlFieldDefinition>;
  compute(context: QlComputedModelContext): Promise<readonly QlRecord[]>;
}

export interface QlAccessRule {
  model: string;
  group: string;
  read: boolean;
  write: boolean;
  create: boolean;
  unlink: boolean;
}

export interface QlLandingViewConfig {
  section: LandingViewSection;
  sequence?: number;
  href: string;
  status?: "available" | "proposed";
  titleKey?: string;
  descriptionKey?: string;
  publicCountFilter?: Record<string, RecordValue>;
}

export interface QlViewDefinition {
  name: string;
  labelKey?: string;
  helpKey?: string;
  model: string;
  type: ViewType;
  fields: string[];
  landing?: QlLandingViewConfig;
}

export interface QlSeedDataRecord {
  id: string;
  model: string;
  key: { field: string; value: QlServiceValue };
  values: Record<string, QlServiceValue>;
  updatePolicy: "insert_only" | "reconcile";
}

export interface QlAddonManifest {
  name: string;
  version: string;
  description: string;
  category?: AddonCategory;
  depends: string[];
  models: QlModelDefinition[];
  computedModels?: QlComputedModelDefinition[];
  access: QlAccessRule[];
  views: QlViewDefinition[];
  data: readonly QlSeedDataRecord[];
}

export interface QlUserContext {
  id: string;
  groups: readonly string[];
}

export type QlRecord = RecordValues;
export type QlServiceValue = RecordValue;
export type QlSqlValue = QlServiceValue;
export interface QlServiceQueryOptions {
  limit?: number;
  orderBy?: { field: string; direction: "asc" | "desc" } | "rowid-asc";
}

export class QlValidationError extends Error {}
export class QlAccessError extends Error {}
export class QlNotFoundError extends Error {}
export class QlConflictError extends Error {}

const operationFlags: Record<QlOperation, keyof Omit<QlAccessRule, "model" | "group">> = {
  read: "read",
  create: "create",
  write: "write",
  unlink: "unlink",
};

function quoteIdentifier(identifier: string): string {
  if (!/^[a-z][a-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid database identifier '${identifier}'.`);
  }
  return `"${identifier}"`;
}

export interface QlQueryResult {
  rows: readonly Record<string, unknown>[];
  rowsAffected: number;
}

export interface QlConnection {
  readonly driver: "libsql" | "postgres";
  execute(sql: string, values: readonly QlSqlValue[]): Promise<QlQueryResult>;
  columnNames(table: string): Promise<Set<string>>;
  close(): void;
}

class LibSqlConnection implements QlConnection {
  readonly driver = "libsql" as const;

  constructor(private readonly client: Client) {}

  async execute(
    sql: string,
    values: readonly QlSqlValue[],
  ): Promise<QlQueryResult> {
    const result = await this.client.execute({
      sql,
      args: values as InValue[],
    });
    return { rows: result.rows, rowsAffected: result.rowsAffected ?? 0 };
  }

  async columnNames(table: string): Promise<Set<string>> {
    const result = await this.client.execute(`PRAGMA table_info(${table})`);
    return new Set(
      result.rows.flatMap((row) =>
        typeof row.name === "string" ? [row.name] : [],
      ),
    );
  }

  close(): void {
    this.client.close();
  }
}

// node-postgres mengembalikan string untuk int8 agar tidak kehilangan presisi;
// QlOrm memakai int8 untuk integer dan datetime epoch, jadi angka dikonversi ke number.
pgTypes.setTypeParser(20, (value: string | null) =>
  value === null ? null : Number(value),
);

class PostgresConnection implements QlConnection {
  readonly driver = "postgres" as const;

  constructor(private readonly pool: Pool) {}

  async execute(
    sql: string,
    values: readonly QlSqlValue[],
  ): Promise<QlQueryResult> {
    const result = await this.pool.query<Record<string, unknown>>(
      sql,
      [...values],
    );
    return {
      rows: result.rows,
      rowsAffected: result.rowCount ?? 0,
    };
  }

  async columnNames(table: string): Promise<Set<string>> {
    const result = await this.pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`,
      [table.replaceAll('"', "")],
    );
    return new Set(
      result.rows.flatMap((row) =>
        typeof row.column_name === "string" ? [row.column_name] : [],
      ),
    );
  }

  close(): void {
    // Penutup dipanggil dari handler sinkron (proses exit / callback server.close),
    // jadi pool.end() hanya diberi kesempatan selesai; reject-nya tidak boleh
    // menjatuhkan proses yang sedang mematikan diri.
    void this.pool.end().catch(() => undefined);
  }
}

class SqlBuilder {
  private readonly values: QlSqlValue[] = [];

  constructor(private readonly driver: "libsql" | "postgres") {}

  param(value: QlSqlValue): string {
    this.values.push(value);
    return this.driver === "postgres" ? `$${this.values.length}` : "?";
  }

  get args(): readonly QlSqlValue[] {
    return this.values;
  }
}

function sqlType(driver: "libsql" | "postgres", type: QlFieldType): string {
  switch (type) {
    case "integer":
    case "datetime":
      return driver === "postgres" ? "BIGINT" : "INTEGER";
    case "boolean":
      return driver === "postgres" ? "SMALLINT" : "INTEGER";
    case "char":
    case "text":
      return "TEXT";
  }
}

// Postgres tidak punya rowid, jadi tabel mendapat kolom urutan sisipan terpisah.
function orderExpression(driver: "libsql" | "postgres"): string {
  return driver === "postgres" ? quoteIdentifier("ql_seq") : "rowid";
}

function sqlDefault(field: QlFieldDefinition): string {
  if (field.default === undefined) return "";
  if (typeof field.default === "string") {
    return `DEFAULT '${field.default.replace(/'/g, "''")}'`;
  }
  if (field.type === "boolean") {
    return `DEFAULT ${field.default ? 1 : 0}`;
  }
  return `DEFAULT ${field.default}`;
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if ((error as { code?: unknown }).code === "23505") return true;
  return /(?:SQLITE_CONSTRAINT_(?:UNIQUE|PRIMARYKEY)|UNIQUE constraint failed|duplicate key value violates unique constraint)/i.test(
    error.message,
  );
}

function toDatabaseValue(value: unknown, field: QlFieldDefinition): QlSqlValue {
  if (value === null && !field.required) {
    return null;
  }
  if (field.type === "boolean" && typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (field.type === "datetime" && value instanceof Date) {
    return value.getTime();
  }
  if (field.type === "datetime" && typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.getTime();
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    value === null
  ) {
    return value;
  }
  throw new Error("Unsupported field value.");
}

function validateValue(
  model: QlModelDefinition,
  name: string,
  value: unknown,
): QlFieldDefinition {
  const field = model.fields[name];
  if (!field) {
    throw new QlValidationError(`Unknown field '${name}' on model '${model.name}'.`);
  }
  if (field.compute) {
    throw new QlValidationError(`Computed field '${name}' is read-only.`);
  }
  return validateFieldValue(name, field, value);
}

function validateComputedValue(
  name: string,
  field: QlFieldDefinition,
  value: unknown,
): QlFieldDefinition {
  if (!field.compute) {
    throw new Error(`Field '${name}' is not computed.`);
  }
  return validateFieldValue(name, field, value);
}

function validateFieldValue(
  name: string,
  field: QlFieldDefinition,
  value: unknown,
): QlFieldDefinition {
  if (value === null && !field.required) {
    return field;
  }
  let valid = false;
  switch (field.type) {
    case "char":
    case "text":
      valid = typeof value === "string";
      if (
        valid &&
        field.required &&
        !(value as string).trim()
      ) {
        throw new QlValidationError(`Field '${name}' must not be empty.`);
      }
      if (
        valid &&
        field.maxLength !== undefined &&
        (value as string).length > field.maxLength
      ) {
        throw new QlValidationError(
          `Field '${name}' must be at most ${field.maxLength} characters.`,
        );
      }
      break;
    case "integer":
      valid = Number.isSafeInteger(value);
      break;
    case "boolean":
      valid = typeof value === "boolean";
      break;
    case "datetime":
      valid =
        (value instanceof Date && !Number.isNaN(value.getTime())) ||
        (typeof value === "string" && !Number.isNaN(new Date(value).getTime()));
      break;
  }
  if (!valid) {
    throw new QlValidationError(`Invalid value for field '${name}'.`);
  }
  if (
    field.type === "integer" &&
    typeof value === "number" &&
    ((field.minValue !== undefined && value < field.minValue) ||
      (field.maxValue !== undefined && value > field.maxValue))
  ) {
    throw new QlValidationError(
      `Field '${name}' must be between ${field.minValue ?? "-infinity"} and ${field.maxValue ?? "infinity"}.`,
    );
  }
  if (field.validator) {
    const message = field.validator(value);
    if (message) throw new QlValidationError(message);
  }
  return field;
}

function isRecordValue(value: unknown): value is RecordValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isQlRecord(value: unknown): value is QlRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(isRecordValue)
  );
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isSeedDataRecord(value: unknown): value is QlSeedDataRecord {
  if (!isUnknownRecord(value)) return false;
  const key = value.key;
  return (
    typeof value.id === "string" &&
    typeof value.model === "string" &&
    isUnknownRecord(key) &&
    typeof key.field === "string" &&
    isRecordValue(key.value) &&
    isQlRecord(value.values) &&
    Object.hasOwn(value.values, key.field) &&
    value.values[key.field] === key.value &&
    (value.updatePolicy === "insert_only" ||
      value.updatePolicy === "reconcile")
  );
}

function validateAddonData(
  addonName: string,
  data: unknown,
): asserts data is readonly QlSeedDataRecord[] {
  if (!isUnknownArray(data)) {
    throw new Error(`Addon '${addonName}' must declare a data array.`);
  }
  const seedIds = new Set<string>();
  const seedKeys = new Set<string>();
  for (const rawSeed of data) {
    if (!isSeedDataRecord(rawSeed)) {
      throw new Error(`Addon '${addonName}' contains an invalid seed.`);
    }
    if (
      !/^[a-z][a-z0-9_.:-]{0,255}$/.test(rawSeed.id) ||
      addonName.length + rawSeed.id.length + 1 > 255
    ) {
      throw new Error(
        `Addon '${addonName}' has invalid seed identifier '${rawSeed.id}'.`,
      );
    }
    if (seedIds.has(rawSeed.id)) {
      throw new Error(
        `Addon '${addonName}' declares duplicate seed '${rawSeed.id}'.`,
      );
    }
    seedIds.add(rawSeed.id);
    if (!/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(rawSeed.model)) {
      throw new Error(
        `Addon '${addonName}' has an invalid seed model '${rawSeed.model}'.`,
      );
    }
    if (!/^[a-z][a-z0-9_]*$/.test(rawSeed.key.field)) {
      throw new Error(
        `Addon '${addonName}' has an invalid key field for seed '${rawSeed.id}'.`,
      );
    }
    const seedKey = `${rawSeed.model}:${rawSeed.key.field}:${JSON.stringify(rawSeed.key.value)}`;
    if (seedKeys.has(seedKey)) {
      throw new Error(
        `Addon '${addonName}' declares multiple seeds for '${rawSeed.model}.${rawSeed.key.field}'.`,
      );
    }
    seedKeys.add(seedKey);
  }
}

export function loadAddons(
  manifests: readonly QlAddonManifest[],
): QlAddonManifest[] {
  const byName = new Map<string, QlAddonManifest>();
  for (const manifest of manifests) {
    if (!/^ql_[a-z][a-z0-9_]*$/.test(manifest.name)) {
      throw new Error(`Addon '${manifest.name}' must use the ql_ prefix.`);
    }
    if (byName.has(manifest.name)) {
      throw new Error(`Duplicate addon '${manifest.name}'.`);
    }
    validateAddonData(manifest.name, manifest.data);
    byName.set(manifest.name, manifest);
  }

  const sorted: QlAddonManifest[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(name: string) {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Addon dependency cycle detected at '${name}'.`);
    }
    const addon = byName.get(name);
    if (!addon) {
      throw new Error(`Missing addon dependency '${name}'.`);
    }
    visiting.add(name);
    for (const dependency of addon.depends) visit(dependency);
    visiting.delete(name);
    visited.add(name);
    sorted.push(addon);
  }
  for (const name of byName.keys()) visit(name);
  return sorted;
}

function inferAddonCategory(addonName: string, modelName: string): AddonCategory {
  if (
    addonName === "ql_corpus" ||
    addonName === "ql_source" ||
    modelName.startsWith("corpus.") ||
    modelName.startsWith("source.")
  ) {
    return "knowledge";
  }
  if (
    addonName === "ql_research" ||
    modelName.startsWith("research.") ||
    modelName.startsWith("witness.") ||
    modelName.startsWith("story.") ||
    modelName.startsWith("event.") ||
    modelName.startsWith("person.") ||
    modelName.startsWith("law.") ||
    modelName.startsWith("mizan.") ||
    modelName.startsWith("character.") ||
    modelName.startsWith("studio.")
  ) {
    return "research";
  }
  if (
    addonName === "ql_ai" ||
    addonName === "ql_chat" ||
    modelName.startsWith("ai.") ||
    modelName.startsWith("chat.")
  ) {
    return "intelligence";
  }
  if (addonName === "ql_workflow" || modelName.startsWith("workflow.")) {
    return "workflow";
  }
  if (
    addonName === "ql_integration" ||
    addonName === "ql_cloudflare" ||
    modelName.startsWith("integration.") ||
    modelName.startsWith("cloudflare.")
  ) {
    return "integration";
  }
  return "system";
}

export class QlModelRegistry {
  private readonly models = new Map<string, QlModelDefinition>();
  private readonly modelAddons = new Map<string, string>();
  private readonly computedModels = new Map<string, QlComputedModelDefinition>();
  private readonly access = new Map<string, QlAccessRule[]>();
  private readonly computedFieldOrder = new Map<string, readonly string[]>();
  readonly addons: readonly QlAddonManifest[];

  constructor(manifests: readonly QlAddonManifest[]) {
    this.addons = loadAddons(manifests);
    for (const addon of this.addons) {
      for (const model of addon.models) {
        if (this.models.has(model.name)) {
          throw new Error(`Duplicate model '${model.name}'.`);
        }
        quoteIdentifier(model.tableName);
        for (const [fieldName, field] of Object.entries(model.fields)) {
          quoteIdentifier(fieldName);
          if (field.compute && (field.unique || field.default !== undefined)) {
            throw new Error(
              `Computed field '${model.name}.${fieldName}' cannot be unique or have a default.`,
            );
          }
          if (field.maxLength !== undefined && field.maxLength < 1) {
            throw new Error(`Invalid maxLength for '${model.name}.${fieldName}'.`);
          }
          if (
            (field.minValue !== undefined || field.maxValue !== undefined) &&
            field.type !== "integer"
          ) {
            throw new Error(
              `Numeric bounds can only be used on integer field '${model.name}.${fieldName}'.`,
            );
          }
          if (
            field.minValue !== undefined &&
            field.maxValue !== undefined &&
            field.minValue > field.maxValue
          ) {
            throw new Error(
              `Invalid numeric bounds for '${model.name}.${fieldName}'.`,
            );
          }
        }
        const computedOrder: string[] = [];
        const visitingFields = new Set<string>();
        const visitedFields = new Set<string>();
        const visitField = (fieldName: string) => {
          if (visitedFields.has(fieldName)) return;
          if (visitingFields.has(fieldName)) {
            throw new Error(
              `Computed field dependency cycle detected at '${model.name}.${fieldName}'.`,
            );
          }
          const field = model.fields[fieldName];
          if (!field?.compute) return;
          if (field.compute.dependsOn.length === 0) {
            throw new Error(
              `Computed field '${model.name}.${fieldName}' must declare dependencies.`,
            );
          }
          visitingFields.add(fieldName);
          const uniqueDependencies = new Set<string>();
          for (const dependencyName of field.compute.dependsOn) {
            if (uniqueDependencies.has(dependencyName)) {
              throw new Error(
                `Computed field '${model.name}.${fieldName}' repeats dependency '${dependencyName}'.`,
              );
            }
            uniqueDependencies.add(dependencyName);
            const dependency = model.fields[dependencyName];
            if (!dependency) {
              throw new Error(
                `Computed field '${model.name}.${fieldName}' depends on unknown field '${dependencyName}'.`,
              );
            }
            if (!field.private && dependency.private) {
              throw new Error(
                `Public computed field '${model.name}.${fieldName}' cannot depend on private field '${dependencyName}'.`,
              );
            }
            visitField(dependencyName);
          }
          visitingFields.delete(fieldName);
          visitedFields.add(fieldName);
          computedOrder.push(fieldName);
        };
        for (const [fieldName, field] of Object.entries(model.fields)) {
          if (field.compute) visitField(fieldName);
        }
        this.computedFieldOrder.set(model.name, computedOrder);
        if (
          model.ownerField &&
          (!model.fields[model.ownerField] ||
            model.fields[model.ownerField].type !== "char" ||
            !model.fields[model.ownerField].required)
        ) {
          throw new Error(
            `Model '${model.name}' must define its owner field as a required char field.`,
          );
        }
        this.models.set(model.name, model);
        this.modelAddons.set(model.name, addon.name);
      }
      for (const model of addon.computedModels ?? []) {
        if (this.models.has(model.name) || this.computedModels.has(model.name)) {
          throw new Error(`Duplicate model '${model.name}'.`);
        }
        if (model.sources.length === 0) {
          throw new Error(
            `Computed model '${model.name}' must declare at least one source model.`,
          );
        }
        const sourceNames = new Set<string>();
        for (const source of model.sources) {
          if (sourceNames.has(source)) {
            throw new Error(
              `Computed model '${model.name}' repeats source '${source}'.`,
            );
          }
          if (!this.models.has(source)) {
            throw new Error(
              `Computed model '${model.name}' references unknown source model '${source}'.`,
            );
          }
          sourceNames.add(source);
        }
        for (const [fieldName, field] of Object.entries(model.fields)) {
          quoteIdentifier(fieldName);
          if (field.compute || field.unique || field.default !== undefined) {
            throw new Error(
              `Computed model field '${model.name}.${fieldName}' cannot compute recursively, be unique, or have a default.`,
            );
          }
          if (field.maxLength !== undefined && field.maxLength < 1) {
            throw new Error(`Invalid maxLength for '${model.name}.${fieldName}'.`);
          }
        }
        for (const [filterName, field] of Object.entries(model.queryFields ?? {})) {
          quoteIdentifier(filterName);
          if (field.private || field.compute || field.default !== undefined) {
            throw new Error(
              `Computed model query field '${model.name}.${filterName}' must be public, stored-independent, and have no default.`,
            );
          }
        }
        this.computedModels.set(model.name, model);
        this.modelAddons.set(model.name, addon.name);
      }
      for (const rule of addon.access) {
        if (!this.models.has(rule.model) && !this.computedModels.has(rule.model)) {
          throw new Error(
            `Addon '${addon.name}' grants access to missing model '${rule.model}'.`,
          );
        }
        const rules = this.access.get(rule.model) ?? [];
        rules.push(rule);
        this.access.set(rule.model, rules);
      }
      for (const view of addon.views) {
        const model =
          this.models.get(view.model) ?? this.computedModels.get(view.model);
        if (!model) {
          throw new Error(
            `Addon '${addon.name}' declares a view for missing model '${view.model}'.`,
          );
        }
        for (const field of view.fields) {
          if (!model.fields[field]) {
            throw new Error(
              `View '${view.name}' references unknown field '${field}'.`,
            );
          }
        }
        if (view.type === "landing") {
          if (!view.landing || !view.landing.href.startsWith("/")) {
            throw new Error(
              `Landing view '${view.name}' must define a landing config with an internal href starting with '/'.`,
            );
          }
          for (const field of view.fields) {
            if (model.fields[field]?.private) {
              throw new Error(
                `Landing view '${view.name}' cannot reference private field '${field}'.`,
              );
            }
          }
          if (view.landing.publicCountFilter) {
            if ("ownerField" in model && model.ownerField) {
              throw new Error(
                `Landing view '${view.name}' cannot declare publicCountFilter on owner-scoped model '${view.model}'.`,
              );
            }
            for (const filterField of Object.keys(view.landing.publicCountFilter)) {
              if (!model.fields[filterField] || model.fields[filterField].private) {
                throw new Error(
                  `Landing view '${view.name}' references invalid or private publicCountFilter field '${filterField}'.`,
                );
              }
            }
          }
        }
      }
    }
    for (const addon of this.addons) {
      for (const seed of addon.data) {
        const model = this.getModel(seed.model);
        if (this.modelAddons.get(seed.model) !== addon.name) {
          throw new Error(
            `Addon '${addon.name}' can only seed models it owns; '${seed.model}' belongs to another addon.`,
          );
        }
        if (model.ownerField) {
          throw new Error(
            `Addon '${addon.name}' cannot seed owner-scoped model '${seed.model}'.`,
          );
        }
        if (seed.model === "ir.model.data") {
          throw new Error(
            "Addon data cannot declare records in the external-ID registry.",
          );
        }
        const keyField = model.fields[seed.key.field];
        if (
          !keyField?.unique ||
          keyField.private ||
          keyField.compute ||
          seed.values[seed.key.field] !== seed.key.value
        ) {
          throw new Error(
            `Seed '${addon.name}.${seed.id}' must use a public unique key field on '${seed.model}'.`,
          );
        }
        for (const fieldName of Object.keys(seed.values)) {
          if (
            !model.fields[fieldName] ||
            model.fields[fieldName].compute ||
            model.fields[fieldName].private
          ) {
            throw new Error(
              `Seed '${addon.name}.${seed.id}' references invalid or private field '${fieldName}' on '${seed.model}'.`,
            );
          }
        }
      }
    }
  }

  getAddon(name: string): QlAddonManifest {
    const addon = this.addons.find((item) => item.name === name);
    if (!addon) throw new QlNotFoundError(`Unknown addon '${name}'.`);
    return addon;
  }

  getModel(name: string): QlModelDefinition {
    const model = this.models.get(name);
    if (!model) throw new QlNotFoundError(`Unknown model '${name}'.`);
    return model;
  }

  getModels(): readonly QlModelDefinition[] {
    return [...this.models.values()];
  }

  getComputedModels(): readonly QlComputedModelDefinition[] {
    return [...this.computedModels.values()];
  }

  getComputedModel(name: string): QlComputedModelDefinition {
    const model = this.computedModels.get(name);
    if (!model) throw new QlNotFoundError(`Unknown computed model '${name}'.`);
    return model;
  }

  getComputedFieldOrder(modelName: string): readonly string[] {
    this.getModel(modelName);
    return this.computedFieldOrder.get(modelName) ?? [];
  }

  getViews(modelName: string): readonly QlViewDefinition[] {
    if (!this.models.has(modelName) && !this.computedModels.has(modelName)) {
      throw new QlNotFoundError(`Unknown model '${modelName}'.`);
    }
    return this.addons.flatMap((addon) =>
      addon.views.filter((view) => view.model === modelName),
    );
  }

  getModelAddon(modelName: string): string {
    if (!this.models.has(modelName) && !this.computedModels.has(modelName)) {
      throw new QlNotFoundError(`Unknown model '${modelName}'.`);
    }
    return this.modelAddons.get(modelName) ?? "ql_base";
  }

  getModelCategory(modelName: string): AddonCategory {
    const addonName = this.getModelAddon(modelName);
    const addon = this.addons.find((item) => item.name === addonName);
    return addon?.category ?? inferAddonCategory(addonName, modelName);
  }

  getLandingViews(): readonly QlViewDefinition[] {
    return this.addons
      .flatMap((addon) => addon.views.filter((view) => view.type === "landing"))
      .sort(
        (left, right) =>
          (left.landing?.sequence ?? 100) - (right.landing?.sequence ?? 100) ||
          left.name.localeCompare(right.name),
      );
  }

  can(
    model: string,
    groups: readonly string[],
    operation: QlOperation,
  ): boolean {
    const flag = operationFlags[operation];
    return (this.access.get(model) ?? []).some(
      (rule) => groups.includes(rule.group) && rule[flag],
    );
  }
}

export class QlOrm {
  constructor(
    private readonly connection: QlConnection,
    readonly registry: QlModelRegistry,
  ) {}

  async syncSchema(): Promise<void> {
    const driver = this.connection.driver;
    for (const model of this.registry.getModels()) {
      const table = quoteIdentifier(model.tableName);
      const columns = [
        `${quoteIdentifier("id")} TEXT PRIMARY KEY NOT NULL`,
        ...Object.entries(model.fields)
          .filter(([, field]) => !field.compute)
          .map(([name, field]) => {
            const parts = [
              quoteIdentifier(name),
              sqlType(driver, field.type),
              field.required ? "NOT NULL" : "",
              field.unique ? "UNIQUE" : "",
              sqlDefault(field),
            ];
            return parts.filter(Boolean).join(" ");
          }),
      ];
      if (driver === "postgres") {
        columns.push(`${quoteIdentifier("ql_seq")} BIGSERIAL`);
      }
      await this.connection.execute(
        `CREATE TABLE IF NOT EXISTS ${table} (${columns.join(", ")})`,
        [],
      );
      const existing = await this.connection.columnNames(model.tableName);
      if (driver === "postgres" && !existing.has("ql_seq")) {
        await this.connection.execute(
          `ALTER TABLE ${table} ADD COLUMN ${quoteIdentifier("ql_seq")} BIGSERIAL`,
          [],
        );
      }
      for (const [name, field] of Object.entries(model.fields)) {
        if (field.compute) continue;
        if (existing.has(name)) continue;
        const definition = [
          quoteIdentifier(name),
          sqlType(driver, field.type),
          sqlDefault(field),
        ]
          .filter(Boolean)
          .join(" ");
        await this.connection.execute(
          `ALTER TABLE ${table} ADD COLUMN ${definition}`,
          [],
        );
        if (field.unique) {
          await this.connection.execute(
            `CREATE UNIQUE INDEX IF NOT EXISTS ${quoteIdentifier(`${model.tableName}_${name}_unique`)} ON ${table} (${quoteIdentifier(name)})`,
            [],
          );
        }
      }
    }
  }

  async loadDefaultData(): Promise<void> {
    for (const addon of this.registry.addons) {
      await this.seedAddonData(addon.name);
    }
  }

  async seedAddonData(addonName: string): Promise<void> {
    const addon = this.registry.getAddon(addonName);
    if (addon.data.length === 0) return;
    if (!this.registry.getModels().some((model) => model.name === "ir.model.data")) {
      throw new Error(
        `Addon data requires the 'ir.model.data' model from ql_base.`,
      );
    }
    for (const seed of addon.data) {
      await this.applyDefaultData(addon.name, seed);
    }
  }

  private async applyDefaultData(
    addonName: string,
    seed: QlSeedDataRecord,
  ): Promise<void> {
    const externalId = `${addonName}.${seed.id}`;
    let metadata = await this.findOneByService("ir.model.data", {
      external_id: externalId,
    });
    if (
      metadata &&
      (metadata.model_name !== seed.model ||
        typeof metadata.record_id !== "string" ||
        typeof metadata.id !== "string")
    ) {
      throw new Error(
        `External ID '${externalId}' points to an invalid target record.`,
      );
    }

    let targetId: string | undefined;
    if (metadata) {
      const target = await this.findOneByService(seed.model, {
        id: metadata.record_id,
      });
      if (target && typeof target.id === "string") {
        targetId = target.id;
      }
    }
    if (!targetId) {
      const existing = await this.findOneByService(seed.model, {
        [seed.key.field]: seed.key.value,
      });
      if (existing && typeof existing.id === "string") {
        targetId = existing.id;
      }
    }

    if (targetId) {
      if (seed.updatePolicy === "reconcile") {
        const updated = await this.updateRecordsForService(
          seed.model,
          { id: targetId },
          seed.values,
        );
        if (updated !== 1) {
          throw new Error(
            `Default data '${externalId}' could not be reconciled.`,
          );
        }
      }
    } else {
      const created = await this.createRecordForService(seed.model, seed.values);
      if (typeof created.id !== "string") {
        throw new Error(`Default data '${externalId}' has no record ID.`);
      }
      targetId = created.id;
    }

    const metadataValues = {
      model_name: seed.model,
      record_id: targetId,
    };
    if (metadata) {
      if (metadata.record_id !== targetId) {
        const updated = await this.updateRecordsForService(
          "ir.model.data",
          { id: metadata.id },
          metadataValues,
        );
        if (updated !== 1) {
          throw new Error(
            `External ID '${externalId}' could not be updated.`,
          );
        }
      }
      return;
    }

    metadata = await this.findOneByService("ir.model.data", {
      model_name: seed.model,
      record_id: targetId,
    });
    if (metadata) {
      throw new Error(
        `Default record '${seed.model}:${targetId}' is already assigned to another external ID.`,
      );
    }
    await this.createRecordForService("ir.model.data", {
      external_id: externalId,
      ...metadataValues,
    });
  }

  async findMany(
    modelName: string,
    user: QlUserContext,
    limit = 100,
  ): Promise<QlRecord[]> {
    this.requireAccess(modelName, user, "read");
    const model = this.registry.getModel(modelName);
    const selected = Object.keys(model.fields)
      .filter((name) => !model.fields[name].private)
      .concat("id");
    const selectedColumns = selected.filter((name) => !model.fields[name]?.compute);
    const sql = new SqlBuilder(this.connection.driver);
    const conditions: string[] = [];
    if (model.ownerField) {
      conditions.push(
        `${quoteIdentifier(model.ownerField)} = ${sql.param(user.id)}`,
      );
    }
    const result = await this.connection.execute(
      `SELECT ${selectedColumns.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(model.tableName)}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY ${orderExpression(this.connection.driver)} DESC LIMIT ${sql.param(Math.max(1, Math.min(500, Math.floor(limit))))}`,
      sql.args,
    );
    return this.mapRows(model, selected, result.rows);
  }

  async queryComputedModel(
    modelName: string,
    user: QlUserContext,
    input: QlComputedModelQuery = {},
  ): Promise<QlRecord[]> {
    this.requireAccess(modelName, user, "read");
    const model = this.registry.getComputedModel(modelName);
    for (const source of model.sources) {
      this.requireAccess(source, user, "read");
    }

    const limit = input.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new QlValidationError(
        "Computed model limit must be an integer between 1 and 100.",
      );
    }
    const filters = input.filters ?? {};
    if (
      typeof filters !== "object" ||
      filters === null ||
      Array.isArray(filters) ||
      Object.keys(filters).length > 20
    ) {
      throw new QlValidationError(
        "Computed model filters must be an object with at most 20 fields.",
      );
    }
    const queryFields = model.queryFields ?? {};
    for (const [name, value] of Object.entries(filters)) {
      const field = queryFields[name];
      if (!field) {
        throw new QlValidationError(
          `Unknown query field '${name}' on computed model '${modelName}'.`,
        );
      }
      validateFieldValue(name, field, value);
    }
    for (const [name, field] of Object.entries(queryFields)) {
      if (field.required && filters[name] === undefined) {
        throw new QlValidationError(
          `Query field '${name}' is required for computed model '${modelName}'.`,
        );
      }
    }

    const computedResult: unknown = await model.compute({
      orm: this,
      user,
      query: { filters: { ...filters }, limit },
    });
    if (!isUnknownArray(computedResult)) {
      throw new Error(`Computed model '${modelName}' returned an invalid result.`);
    }
    const records = computedResult;
    if (records.length > limit) {
      throw new QlValidationError(
        `Computed model '${modelName}' returned more than the requested ${limit} records.`,
      );
    }
    const identifiers = new Set<string>();
    return records.map((value) => {
      if (!isQlRecord(value)) {
        throw new Error(`Computed model '${modelName}' returned an invalid record.`);
      }
      const record = value;
      if (
        typeof record.id !== "string" ||
        !record.id.trim() ||
        record.id.length > 200 ||
        identifiers.has(record.id)
      ) {
        throw new Error(
          `Computed model '${modelName}' returned an invalid or duplicate record id.`,
        );
      }
      identifiers.add(record.id);
      for (const name of Object.keys(record)) {
        if (name !== "id" && !model.fields[name]) {
          throw new Error(
            `Computed model '${modelName}' returned unknown field '${name}'.`,
          );
        }
      }
      const result: QlRecord = { id: record.id };
      for (const [name, field] of Object.entries(model.fields)) {
        const value = record[name];
        if (value === undefined) {
          if (field.required) {
            throw new Error(
              `Computed model '${modelName}' omitted required field '${name}'.`,
            );
          }
          continue;
        }
        validateFieldValue(name, field, value);
        if (!field.private) result[name] = value;
      }
      return result;
    });
  }

  async create(
    modelName: string,
    user: QlUserContext,
    input: Record<string, unknown>,
  ): Promise<QlRecord> {
    this.requireAccess(modelName, user, "create");
    const model = this.registry.getModel(modelName);
    const values: Record<string, QlSqlValue> = { id: randomUUID() };
    for (const [name, value] of Object.entries(input)) {
      const field = validateValue(model, name, value);
      if (field.private) {
        throw new QlValidationError(`Field '${name}' cannot be written through this API.`);
      }
      values[name] = toDatabaseValue(value, field);
    }
    for (const [name, field] of Object.entries(model.fields)) {
      if (field.compute) continue;
      if (model.ownerField === name) {
        values[name] = user.id;
      } else if (field.required && values[name] === undefined) {
        if (field.default !== undefined) {
          values[name] = toDatabaseValue(field.default, field);
        } else if (field.type === "datetime") {
          values[name] = Date.now();
        } else {
          throw new QlValidationError(`Field '${name}' is required.`);
        }
      }
    }

    const columns = Object.keys(values);
    const sql = new SqlBuilder(this.connection.driver);
    const placeholders = columns.map((column) => sql.param(values[column]));
    try {
      await this.connection.execute(
        `INSERT INTO ${quoteIdentifier(model.tableName)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${placeholders.join(", ")})`,
        sql.args,
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new QlConflictError("A record with the same unique value already exists.");
      }
      throw error;
    }
    if (typeof values.id !== "string") {
      throw new Error("Created record identifier is invalid.");
    }
    const [record] = await this.findManyById(model, user, values.id);
    if (!record) throw new Error("Created record could not be loaded.");
    return record;
  }

  async update(
    modelName: string,
    user: QlUserContext,
    id: string,
    input: Record<string, unknown>,
  ): Promise<QlRecord | undefined> {
    this.requireAccess(modelName, user, "write");
    const model = this.registry.getModel(modelName);
    const assignments: string[] = [];
    const sql = new SqlBuilder(this.connection.driver);
    for (const [name, value] of Object.entries(input)) {
      if (name === model.ownerField) {
        throw new QlValidationError("Record ownership cannot be changed.");
      }
      const field = validateValue(model, name, value);
      if (field.private) {
        throw new QlValidationError(`Field '${name}' cannot be written through this API.`);
      }
      assignments.push(`${quoteIdentifier(name)} = ${sql.param(toDatabaseValue(value, field))}`);
    }
    if (assignments.length === 0) {
      throw new QlValidationError("At least one field is required.");
    }
    const conditions = [`${quoteIdentifier("id")} = ${sql.param(id)}`];
    if (model.ownerField) {
      conditions.push(
        `${quoteIdentifier(model.ownerField)} = ${sql.param(user.id)}`,
      );
    }
    const result = await this.connection.execute(
      `UPDATE ${quoteIdentifier(model.tableName)} SET ${assignments.join(", ")} WHERE ${conditions.join(" AND ")}`,
      sql.args,
    );
    if (result.rowsAffected === 0) return undefined;
    const [record] = await this.findManyById(model, user, id);
    return record;
  }

  async delete(
    modelName: string,
    user: QlUserContext,
    id: string,
  ): Promise<boolean> {
    this.requireAccess(modelName, user, "unlink");
    const model = this.registry.getModel(modelName);
    const sql = new SqlBuilder(this.connection.driver);
    const conditions = [`${quoteIdentifier("id")} = ${sql.param(id)}`];
    if (model.ownerField) {
      conditions.push(
        `${quoteIdentifier(model.ownerField)} = ${sql.param(user.id)}`,
      );
    }
    const result = await this.connection.execute(
      `DELETE FROM ${quoteIdentifier(model.tableName)} WHERE ${conditions.join(" AND ")}`,
      sql.args,
    );
    return result.rowsAffected > 0;
  }

  async findManyForService(
    modelName: string,
    ownerId: string,
    limit = 100,
  ): Promise<QlRecord[]> {
    const model = this.registry.getModel(modelName);
    if (!model.ownerField) {
      throw new Error(`Service-owned model '${modelName}' must define ownerField.`);
    }
    return this.findManyByService(modelName, { [model.ownerField]: ownerId }, {
      limit,
    });
  }

  async findManyByService(
    modelName: string,
    filters: Record<string, QlServiceValue>,
    options: QlServiceQueryOptions = {},
  ): Promise<QlRecord[]> {
    const model = this.registry.getModel(modelName);
    const selected = [...Object.keys(model.fields), "id"];
    const selectedColumns = selected.filter((name) => !model.fields[name]?.compute);
    const sql = new SqlBuilder(this.connection.driver);
    const conditions: string[] = [];
    for (const [name, value] of Object.entries(filters)) {
      if (name !== "id" && !model.fields[name]) {
        throw new QlValidationError(`Unknown field '${name}' on model '${modelName}'.`);
      }
      if (model.fields[name]?.compute) {
        throw new QlValidationError(
          `Computed field '${name}' cannot be used as a database filter.`,
        );
      }
      conditions.push(
        `${quoteIdentifier(name)} = ${sql.param(
          name === "id" ? value : toDatabaseValue(value, model.fields[name]),
        )}`,
      );
    }
    let orderClause = `ORDER BY ${orderExpression(this.connection.driver)} DESC`;
    if (options.orderBy === "rowid-asc") {
      orderClause = `ORDER BY ${orderExpression(this.connection.driver)} ASC`;
    } else if (options.orderBy) {
      if (options.orderBy.field !== "id" && !model.fields[options.orderBy.field]) {
        throw new QlValidationError(
          `Unknown order field '${options.orderBy.field}' on model '${modelName}'.`,
        );
      }
      if (model.fields[options.orderBy.field]?.compute) {
        throw new QlValidationError(
          `Computed field '${options.orderBy.field}' cannot be used for database ordering.`,
        );
      }
      orderClause = `ORDER BY ${quoteIdentifier(options.orderBy.field)} ${options.orderBy.direction.toUpperCase()}`;
    }
    orderClause += ` LIMIT ${sql.param(Math.max(1, Math.min(500, Math.floor(options.limit ?? 100))))}`;
    const result = await this.connection.execute(
      `SELECT ${selectedColumns.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(model.tableName)}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ${orderClause}`,
      sql.args,
    );
    return this.mapRows(model, selected, result.rows);
  }

  async findOneByService(
    modelName: string,
    filters: Record<string, QlServiceValue>,
  ): Promise<QlRecord | undefined> {
    const [record] = await this.findManyByService(modelName, filters, {
      limit: 1,
    });
    return record;
  }

  async createRecordForService(
    modelName: string,
    input: Record<string, unknown>,
  ): Promise<QlRecord> {
    const model = this.registry.getModel(modelName);
    const values: Record<string, QlSqlValue> = { id: randomUUID() };
    for (const [name, value] of Object.entries(input)) {
      const field = validateValue(model, name, value);
      values[name] = toDatabaseValue(value, field);
    }
    for (const [name, field] of Object.entries(model.fields)) {
      if (field.compute) continue;
      if (field.required && values[name] === undefined) {
        if (field.default !== undefined) {
          values[name] = toDatabaseValue(field.default, field);
        } else if (field.type === "datetime") {
          values[name] = Date.now();
        } else {
          throw new QlValidationError(`Field '${name}' is required.`);
        }
      }
    }
    const columns = Object.keys(values);
    const sql = new SqlBuilder(this.connection.driver);
    const placeholders = columns.map((column) => sql.param(values[column]));
    try {
      await this.connection.execute(
        `INSERT INTO ${quoteIdentifier(model.tableName)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${placeholders.join(", ")})`,
        sql.args,
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new QlConflictError("A record with the same unique value already exists.");
      }
      throw error;
    }
    if (typeof values.id !== "string") {
      throw new Error("Created service record identifier is invalid.");
    }
    const [record] = await this.findManyByService(
      modelName,
      { id: values.id },
      { limit: 1 },
    );
    if (!record) throw new Error("Created service record could not be loaded.");
    return record;
  }

  async updateRecordsForService(
    modelName: string,
    filters: Record<string, QlServiceValue>,
    input: Record<string, unknown>,
  ): Promise<number> {
    const model = this.registry.getModel(modelName);
    const assignments: string[] = [];
    const sql = new SqlBuilder(this.connection.driver);
    for (const [name, value] of Object.entries(input)) {
      const field = validateValue(model, name, value);
      assignments.push(
        `${quoteIdentifier(name)} = ${sql.param(toDatabaseValue(value, field))}`,
      );
    }
    if (assignments.length === 0) {
      throw new QlValidationError("At least one field is required.");
    }
    const conditions: string[] = [];
    for (const [name, value] of Object.entries(filters)) {
      if (name !== "id" && !model.fields[name]) {
        throw new QlValidationError(`Unknown field '${name}' on model '${modelName}'.`);
      }
      if (model.fields[name]?.compute) {
        throw new QlValidationError(
          `Computed field '${name}' cannot be used as a database filter.`,
        );
      }
      conditions.push(
        `${quoteIdentifier(name)} = ${sql.param(
          name === "id" ? value : toDatabaseValue(value, model.fields[name]),
        )}`,
      );
    }
    if (!conditions.length) {
      throw new Error("Service updates require at least one filter.");
    }
    const result = await this.connection.execute(
      `UPDATE ${quoteIdentifier(model.tableName)} SET ${assignments.join(", ")} WHERE ${conditions.join(" AND ")}`,
      sql.args,
    );
    return result.rowsAffected;
  }

  async deleteRecordsForService(
    modelName: string,
    filters: Record<string, QlServiceValue>,
  ): Promise<number> {
    const model = this.registry.getModel(modelName);
    const conditions: string[] = [];
    const sql = new SqlBuilder(this.connection.driver);
    for (const [name, value] of Object.entries(filters)) {
      if (name !== "id" && !model.fields[name]) {
        throw new QlValidationError(`Unknown field '${name}' on model '${modelName}'.`);
      }
      if (model.fields[name]?.compute) {
        throw new QlValidationError(
          `Computed field '${name}' cannot be used as a database filter.`,
        );
      }
      conditions.push(
        `${quoteIdentifier(name)} = ${sql.param(
          name === "id" ? value : toDatabaseValue(value, model.fields[name]),
        )}`,
      );
    }
    if (!conditions.length) {
      throw new Error("Service deletes require at least one filter.");
    }
    const result = await this.connection.execute(
      `DELETE FROM ${quoteIdentifier(model.tableName)} WHERE ${conditions.join(" AND ")}`,
      sql.args,
    );
    return result.rowsAffected;
  }

  async createForService(
    modelName: string,
    ownerId: string,
    input: Record<string, unknown>,
  ): Promise<QlRecord> {
    const model = this.registry.getModel(modelName);
    if (!model.ownerField) {
      throw new Error(`Service-owned model '${modelName}' must define ownerField.`);
    }
    const values: Record<string, QlSqlValue> = {
      id: randomUUID(),
      [model.ownerField]: ownerId,
    };
    for (const [name, value] of Object.entries(input)) {
      if (name === model.ownerField) {
        throw new QlValidationError("Record ownership cannot be changed.");
      }
      const field = validateValue(model, name, value);
      values[name] = toDatabaseValue(value, field);
    }
    for (const [name, field] of Object.entries(model.fields)) {
      if (field.compute) continue;
      if (name === model.ownerField) continue;
      if (field.required && values[name] === undefined) {
        if (field.default !== undefined) {
          values[name] = toDatabaseValue(field.default, field);
        } else if (field.type === "datetime") {
          values[name] = Date.now();
        } else {
          throw new QlValidationError(`Field '${name}' is required.`);
        }
      }
    }
    const columns = Object.keys(values);
    const sql = new SqlBuilder(this.connection.driver);
    const placeholders = columns.map((column) => sql.param(values[column]));
    try {
      await this.connection.execute(
        `INSERT INTO ${quoteIdentifier(model.tableName)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${placeholders.join(", ")})`,
        sql.args,
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new QlConflictError("A record with the same unique value already exists.");
      }
      throw error;
    }
    if (typeof values.id !== "string") {
      throw new Error("Created service record identifier is invalid.");
    }
    const [record] = await this.findManyById(
      model,
      { id: ownerId, groups: [] },
      values.id,
    );
    if (!record) throw new Error("Created service record could not be loaded.");
    return record;
  }

  async updateForService(
    modelName: string,
    ownerId: string,
    id: string,
    input: Record<string, unknown>,
  ): Promise<QlRecord | undefined> {
    const model = this.registry.getModel(modelName);
    if (!model.ownerField) {
      throw new Error(`Service-owned model '${modelName}' must define ownerField.`);
    }
    const assignments: string[] = [];
    const sql = new SqlBuilder(this.connection.driver);
    for (const [name, value] of Object.entries(input)) {
      if (name === model.ownerField) {
        throw new QlValidationError("Record ownership cannot be changed.");
      }
      const field = validateValue(model, name, value);
      assignments.push(
        `${quoteIdentifier(name)} = ${sql.param(toDatabaseValue(value, field))}`,
      );
    }
    if (assignments.length === 0) {
      throw new QlValidationError("At least one field is required.");
    }
    const conditions = [
      `${quoteIdentifier("id")} = ${sql.param(id)}`,
      `${quoteIdentifier(model.ownerField)} = ${sql.param(ownerId)}`,
    ];
    const result = await this.connection.execute(
      `UPDATE ${quoteIdentifier(model.tableName)} SET ${assignments.join(", ")} WHERE ${conditions.join(" AND ")}`,
      sql.args,
    );
    if (result.rowsAffected === 0) return undefined;
    const [record] = await this.findManyById(
      model,
      { id: ownerId, groups: [] },
      id,
    );
    return record;
  }

  async deleteForService(
    modelName: string,
    ownerId: string,
    id: string,
  ): Promise<boolean> {
    const model = this.registry.getModel(modelName);
    if (!model.ownerField) {
      throw new Error(`Service-owned model '${modelName}' must define ownerField.`);
    }
    const sql = new SqlBuilder(this.connection.driver);
    const result = await this.connection.execute(
      `DELETE FROM ${quoteIdentifier(model.tableName)} WHERE ${quoteIdentifier("id")} = ${sql.param(id)} AND ${quoteIdentifier(model.ownerField)} = ${sql.param(ownerId)}`,
      sql.args,
    );
    return result.rowsAffected > 0;
  }

  private async findManyById(
    model: QlModelDefinition,
    user: QlUserContext,
    id: string,
  ): Promise<QlRecord[]> {
    const selected = Object.keys(model.fields)
      .filter((name) => !model.fields[name].private)
      .concat("id");
    const selectedColumns = selected.filter((name) => !model.fields[name]?.compute);
    const sql = new SqlBuilder(this.connection.driver);
    const conditions = [`${quoteIdentifier("id")} = ${sql.param(id)}`];
    if (model.ownerField) {
      conditions.push(
        `${quoteIdentifier(model.ownerField)} = ${sql.param(user.id)}`,
      );
    }
    const result = await this.connection.execute(
      `SELECT ${selectedColumns.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(model.tableName)} WHERE ${conditions.join(" AND ")} LIMIT 1`,
      sql.args,
    );
    return this.mapRows(model, selected, result.rows);
  }

  private mapRows(
    model: QlModelDefinition,
    selected: readonly string[],
    rows: readonly Record<string, unknown>[],
  ): QlRecord[] {
    return rows.map((row) => {
      const record: QlRecord = {};
      for (const name of selected) {
        if (model.fields[name]?.compute) continue;
        const value = row[name];
        const field = model.fields[name];
        if (field?.type === "boolean" && typeof value === "number") {
          record[name] = value !== 0;
        } else if (
          typeof value === "string" ||
          typeof value === "number" ||
          value === null
        ) {
          record[name] = value;
        } else {
          record[name] = null;
        }
      }
      for (const name of this.registry.getComputedFieldOrder(model.name)) {
        if (!selected.includes(name)) continue;
        const field = model.fields[name];
        const compute = field.compute;
        if (!compute) {
          throw new Error(`Computed field '${model.name}.${name}' is missing its resolver.`);
        }
        const value = compute.resolve(Object.freeze({ ...record }));
        validateComputedValue(name, field, value);
        record[name] = value;
      }
      return record;
    });
  }

  private requireAccess(
    model: string,
    user: QlUserContext,
    operation: QlOperation,
  ) {
    if (!this.registry.can(model, user.groups, operation)) {
      throw new QlAccessError(`Access denied: ${operation} on '${model}'.`);
    }
  }
}

export function isPostgresUrl(databaseUrl: string): boolean {
  return /^postgres(ql)?:\/\//i.test(databaseUrl);
}

export async function createQlOrm(
  databaseUrl: string,
  manifests: readonly QlAddonManifest[],
): Promise<{ orm: QlOrm; close(): void }> {
  let connection: QlConnection;
  if (isPostgresUrl(databaseUrl)) {
    connection = new PostgresConnection(
      new Pool({ connectionString: databaseUrl, max: 10 }),
    );
  } else {
    if (databaseUrl.startsWith("file:")) {
      const filePath = decodeURIComponent(databaseUrl.slice("file:".length));
      if (filePath !== ":memory:") {
        mkdirSync(dirname(resolve(filePath)), { recursive: true });
      }
    }
    connection = new LibSqlConnection(createClient({ url: databaseUrl }));
  }
  try {
    const orm = new QlOrm(connection, new QlModelRegistry(manifests));
    await orm.syncSchema();
    await orm.loadDefaultData();
    return { orm, close: () => connection.close() };
  } catch (error) {
    connection.close();
    throw error;
  }
}
