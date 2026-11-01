import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type Client, type InValue } from "@libsql/client";

export type QlFieldType = "char" | "text" | "integer" | "boolean" | "datetime";
export type QlOperation = "read" | "create" | "write" | "unlink";

export interface QlFieldDefinition {
  type: QlFieldType;
  required?: boolean;
  unique?: boolean;
  maxLength?: number;
  private?: boolean;
  default?: string | number | boolean;
  minValue?: number;
  maxValue?: number;
  validator?: (value: unknown) => string | undefined;
}

export interface QlModelDefinition {
  name: string;
  description: string;
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
  model: string;
  type: "list" | "form";
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

export type QlRecord = Record<string, string | number | boolean | null>;
export type QlServiceValue = string | number | boolean | null;
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

function sqlType(type: QlFieldType): string {
  switch (type) {
    case "integer":
    case "boolean":
    case "datetime":
      return "INTEGER";
    case "char":
    case "text":
      return "TEXT";
  }
}

function toDatabaseValue(value: unknown, field: QlFieldDefinition): InValue {
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
    private readonly client: Client,
    readonly registry: QlModelRegistry,
  ) {}

  async syncSchema(): Promise<void> {
    for (const model of this.registry.getModels()) {
      const columns = [
        `${quoteIdentifier("id")} TEXT PRIMARY KEY NOT NULL`,
        ...Object.entries(model.fields).map(([name, field]) => {
          const parts = [
            quoteIdentifier(name),
            sqlType(field.type),
            field.required ? "NOT NULL" : "",
            field.unique ? "UNIQUE" : "",
            field.default !== undefined
              ? `DEFAULT ${typeof field.default === "string" ? `'${field.default.replace(/'/g, "''")}'` : field.default === true ? 1 : field.default === false ? 0 : field.default}`
              : "",
          ];
          return parts.filter(Boolean).join(" ");
        }),
      ];
      await this.client.execute(
        `CREATE TABLE IF NOT EXISTS ${quoteIdentifier(model.tableName)} (${columns.join(", ")})`,
      );
      const currentColumns = await this.client.execute(
        `PRAGMA table_info(${quoteIdentifier(model.tableName)})`,
      );
      const existing = new Set(
        currentColumns.rows.flatMap((row) =>
          typeof row.name === "string" ? [row.name] : [],
        ),
      );
      for (const [name, field] of Object.entries(model.fields)) {
        if (existing.has(name)) continue;
        const definition = [
          quoteIdentifier(name),
          sqlType(field.type),
          field.default !== undefined
            ? `DEFAULT ${typeof field.default === "string" ? `'${field.default.replace(/'/g, "''")}'` : field.default === true ? 1 : field.default === false ? 0 : field.default}`
            : "",
        ]
          .filter(Boolean)
          .join(" ");
        await this.client.execute(
          `ALTER TABLE ${quoteIdentifier(model.tableName)} ADD COLUMN ${definition}`,
        );
        if (field.unique) {
          await this.client.execute(
            `CREATE UNIQUE INDEX IF NOT EXISTS ${quoteIdentifier(`${model.tableName}_${name}_unique`)} ON ${quoteIdentifier(model.tableName)} (${quoteIdentifier(name)})`,
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
    const conditions: string[] = [];
    const args: InValue[] = [];
    if (model.ownerField) {
      conditions.push(`${quoteIdentifier(model.ownerField)} = ?`);
      args.push(user.id);
    }
    args.push(Math.max(1, Math.min(500, Math.floor(limit))));
    const result = await this.client.execute({
      sql: `SELECT ${selected.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(model.tableName)}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY rowid DESC LIMIT ?`,
      args,
    });
    return result.rows.map((row) => {
      const record: QlRecord = {};
      for (const name of selected) {
        const value = row[name];
        const field = model.fields[name];
        record[name] =
          field?.type === "boolean" && typeof value === "number"
            ? value !== 0
            : typeof value === "string" ||
                typeof value === "number" ||
                value === null
              ? value
              : null;
      }
      return record;
    });
  }

  async create(
    modelName: string,
    user: QlUserContext,
    input: Record<string, unknown>,
  ): Promise<QlRecord> {
    this.requireAccess(modelName, user, "create");
    const model = this.registry.getModel(modelName);
    const values: Record<string, InValue> = { id: randomUUID() };
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
    try {
      await this.client.execute({
        sql: `INSERT INTO ${quoteIdentifier(model.tableName)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
        args: columns.map((column) => values[column]),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        /(?:SQLITE_CONSTRAINT_(?:UNIQUE|PRIMARYKEY)|UNIQUE constraint failed)/i.test(
          error.message,
        )
      ) {
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
    const columns: string[] = [];
    const args: InValue[] = [];
    for (const [name, value] of Object.entries(input)) {
      if (name === model.ownerField) {
        throw new QlValidationError("Record ownership cannot be changed.");
      }
      const field = validateValue(model, name, value);
      if (field.private) {
        throw new QlValidationError(`Field '${name}' cannot be written through this API.`);
      }
      columns.push(`${quoteIdentifier(name)} = ?`);
      args.push(toDatabaseValue(value, field));
    }
    if (columns.length === 0) {
      throw new QlValidationError("At least one field is required.");
    }
    args.push(id);
    let where = `${quoteIdentifier("id")} = ?`;
    if (model.ownerField) {
      where += ` AND ${quoteIdentifier(model.ownerField)} = ?`;
      args.push(user.id);
    }
    const result = await this.client.execute({
      sql: `UPDATE ${quoteIdentifier(model.tableName)} SET ${columns.join(", ")} WHERE ${where}`,
      args,
    });
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
    let where = `${quoteIdentifier("id")} = ?`;
    const args: InValue[] = [id];
    if (model.ownerField) {
      where += ` AND ${quoteIdentifier(model.ownerField)} = ?`;
      args.push(user.id);
    }
    const result = await this.client.execute({
      sql: `DELETE FROM ${quoteIdentifier(model.tableName)} WHERE ${where}`,
      args,
    });
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
    const conditions: string[] = [];
    const args: InValue[] = [];
    for (const [name, value] of Object.entries(filters)) {
      if (name !== "id" && !model.fields[name]) {
        throw new QlValidationError(`Unknown field '${name}' on model '${modelName}'.`);
      }
      conditions.push(`${quoteIdentifier(name)} = ?`);
      args.push(
        name === "id"
          ? value
          : toDatabaseValue(value, model.fields[name]),
      );
    }
    let orderClause = "ORDER BY rowid DESC";
    if (options.orderBy === "rowid-asc") {
      orderClause = "ORDER BY rowid ASC";
    } else if (options.orderBy) {
      if (options.orderBy.field !== "id" && !model.fields[options.orderBy.field]) {
        throw new QlValidationError(
          `Unknown order field '${options.orderBy.field}' on model '${modelName}'.`,
        );
      }
      orderClause = `ORDER BY ${quoteIdentifier(options.orderBy.field)} ${options.orderBy.direction.toUpperCase()}`;
    }
    args.push(Math.max(1, Math.min(500, Math.floor(options.limit ?? 100))));
    const result = await this.client.execute({
      sql: `SELECT ${selected.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(model.tableName)}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ${orderClause} LIMIT ?`,
      args,
    });
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
    const values: Record<string, InValue> = { id: randomUUID() };
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
    try {
      await this.client.execute({
        sql: `INSERT INTO ${quoteIdentifier(model.tableName)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
        args: columns.map((column) => values[column]),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        /(?:SQLITE_CONSTRAINT_(?:UNIQUE|PRIMARYKEY)|UNIQUE constraint failed)/i.test(
          error.message,
        )
      ) {
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
    const columns: string[] = [];
    const values: InValue[] = [];
    for (const [name, value] of Object.entries(input)) {
      const field = validateValue(model, name, value);
      columns.push(`${quoteIdentifier(name)} = ?`);
      values.push(toDatabaseValue(value, field));
    }
    if (columns.length === 0) {
      throw new QlValidationError("At least one field is required.");
    }
    const conditions: string[] = [];
    for (const [name, value] of Object.entries(filters)) {
      if (name !== "id" && !model.fields[name]) {
        throw new QlValidationError(`Unknown field '${name}' on model '${modelName}'.`);
      }
      conditions.push(`${quoteIdentifier(name)} = ?`);
      values.push(
        name === "id"
          ? value
          : toDatabaseValue(value, model.fields[name]),
      );
    }
    if (!conditions.length) {
      throw new Error("Service updates require at least one filter.");
    }
    const result = await this.client.execute({
      sql: `UPDATE ${quoteIdentifier(model.tableName)} SET ${columns.join(", ")} WHERE ${conditions.join(" AND ")}`,
      args: values,
    });
    return result.rowsAffected;
  }

  async deleteRecordsForService(
    modelName: string,
    filters: Record<string, QlServiceValue>,
  ): Promise<number> {
    const model = this.registry.getModel(modelName);
    const conditions: string[] = [];
    const args: InValue[] = [];
    for (const [name, value] of Object.entries(filters)) {
      if (name !== "id" && !model.fields[name]) {
        throw new QlValidationError(`Unknown field '${name}' on model '${modelName}'.`);
      }
      conditions.push(`${quoteIdentifier(name)} = ?`);
      args.push(
        name === "id"
          ? value
          : toDatabaseValue(value, model.fields[name]),
      );
    }
    if (!conditions.length) {
      throw new Error("Service deletes require at least one filter.");
    }
    const result = await this.client.execute({
      sql: `DELETE FROM ${quoteIdentifier(model.tableName)} WHERE ${conditions.join(" AND ")}`,
      args,
    });
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
    const values: Record<string, InValue> = {
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
    await this.client.execute({
      sql: `INSERT INTO ${quoteIdentifier(model.tableName)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
      args: columns.map((column) => values[column]),
    });
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
    const columns: string[] = [];
    const args: InValue[] = [];
    for (const [name, value] of Object.entries(input)) {
      if (name === model.ownerField) {
        throw new QlValidationError("Record ownership cannot be changed.");
      }
      const field = validateValue(model, name, value);
      columns.push(`${quoteIdentifier(name)} = ?`);
      args.push(toDatabaseValue(value, field));
    }
    if (columns.length === 0) {
      throw new QlValidationError("At least one field is required.");
    }
    args.push(id, ownerId);
    const result = await this.client.execute({
      sql: `UPDATE ${quoteIdentifier(model.tableName)} SET ${columns.join(", ")} WHERE ${quoteIdentifier("id")} = ? AND ${quoteIdentifier(model.ownerField)} = ?`,
      args,
    });
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
    const result = await this.client.execute({
      sql: `DELETE FROM ${quoteIdentifier(model.tableName)} WHERE ${quoteIdentifier("id")} = ? AND ${quoteIdentifier(model.ownerField)} = ?`,
      args: [id, ownerId],
    });
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
    let where = `${quoteIdentifier("id")} = ?`;
    const args: InValue[] = [id];
    if (model.ownerField) {
      where += ` AND ${quoteIdentifier(model.ownerField)} = ?`;
      args.push(user.id);
    }
    const result = await this.client.execute({ 
      sql: `SELECT ${selected.map(quoteIdentifier).join(", ")} FROM ${quoteIdentifier(model.tableName)} WHERE ${where} LIMIT 1`,
      args,
    });
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
        record[name] =
          field?.type === "boolean" && typeof value === "number"
            ? value !== 0
            : typeof value === "string" ||
                typeof value === "number" ||
                value === null
              ? value
              : null;
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

export async function createQlOrm(
  databaseUrl: string,
  manifests: readonly QlAddonManifest[],
): Promise<{ orm: QlOrm; close: () => void }> {
  if (databaseUrl.startsWith("file:")) {
    const filePath = decodeURIComponent(databaseUrl.slice("file:".length));
    if (filePath !== ":memory:") {
      mkdirSync(dirname(resolve(filePath)), { recursive: true });
    }
  }
  const client = createClient({ url: databaseUrl });
  try {
    const orm = new QlOrm(client, new QlModelRegistry(manifests));
    await orm.syncSchema();
    return { orm, close: () => client.close() };
  } catch (error) {
    client.close();
    throw error;
  }
}
