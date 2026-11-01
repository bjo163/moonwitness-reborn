import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type Client, type InValue } from "@libsql/client";
import { Pool, types as pgTypes } from "pg";
import type {
  FieldType as QlFieldType,
  Operation as QlOperation,
  RecordValue,
  RecordValues,
  ViewType,
} from "@moonwitness/types";

export type {
  FieldType as QlFieldType,
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
  validator?(value: unknown): string | undefined;
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

export interface QlAccessRule {
  model: string;
  group: string;
  read: boolean;
  write: boolean;
  create: boolean;
  unlink: boolean;
}

export interface QlViewDefinition {
  name: string;
  labelKey?: string;
  helpKey?: string;
  model: string;
  type: ViewType;
  fields: string[];
}

export interface QlAddonManifest {
  name: string;
  version: string;
  description: string;
  depends: string[];
  models: QlModelDefinition[];
  access: QlAccessRule[];
  views: QlViewDefinition[];
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

export class QlModelRegistry {
  private readonly models = new Map<string, QlModelDefinition>();
  private readonly access = new Map<string, QlAccessRule[]>();
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
      }
      for (const rule of addon.access) {
        if (!this.models.has(rule.model)) {
          throw new Error(
            `Addon '${addon.name}' grants access to missing model '${rule.model}'.`,
          );
        }
        const rules = this.access.get(rule.model) ?? [];
        rules.push(rule);
        this.access.set(rule.model, rules);
      }
      for (const view of addon.views) {
        const model = this.models.get(view.model);
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
      }
    }
  }

  getModel(name: string): QlModelDefinition {
    const model = this.models.get(name);
    if (!model) throw new QlNotFoundError(`Unknown model '${name}'.`);
    return model;
  }

  getModels(): readonly QlModelDefinition[] {
    return [...this.models.values()];
  }

  getViews(modelName: string): readonly QlViewDefinition[] {
    this.getModel(modelName);
    return this.addons.flatMap((addon) =>
      addon.views.filter((view) => view.model === modelName),
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
        ...Object.entries(model.fields).map(([name, field]) => {
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
    const sql = new SqlBuilder(this.connection.driver);
    const conditions: string[] = [];
    if (model.ownerField) {
      conditions.push(
        `${quoteIdentifier(model.ownerField)} = ${sql.param(user.id)}`,
      );
    }
    const result = await this.connection.execute(
      `SELECT ${selected.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(model.tableName)}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY ${orderExpression(this.connection.driver)} DESC LIMIT ${sql.param(Math.max(1, Math.min(500, Math.floor(limit))))}`,
      sql.args,
    );
    return this.mapRows(model, selected, result.rows);
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
    const sql = new SqlBuilder(this.connection.driver);
    const conditions: string[] = [];
    for (const [name, value] of Object.entries(filters)) {
      if (name !== "id" && !model.fields[name]) {
        throw new QlValidationError(`Unknown field '${name}' on model '${modelName}'.`);
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
      orderClause = `ORDER BY ${quoteIdentifier(options.orderBy.field)} ${options.orderBy.direction.toUpperCase()}`;
    }
    orderClause += ` LIMIT ${sql.param(Math.max(1, Math.min(500, Math.floor(options.limit ?? 100))))}`;
    const result = await this.connection.execute(
      `SELECT ${selected.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(model.tableName)}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ${orderClause}`,
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
    const sql = new SqlBuilder(this.connection.driver);
    const conditions = [`${quoteIdentifier("id")} = ${sql.param(id)}`];
    if (model.ownerField) {
      conditions.push(
        `${quoteIdentifier(model.ownerField)} = ${sql.param(user.id)}`,
      );
    }
    const result = await this.connection.execute(
      `SELECT ${selected.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(model.tableName)} WHERE ${conditions.join(" AND ")} LIMIT 1`,
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
    return { orm, close: () => connection.close() };
  } catch (error) {
    connection.close();
    throw error;
  }
}
