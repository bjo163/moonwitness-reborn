import type { QlFieldDefinition, QlModelDefinition } from "./index.js";
import { QlConfigurationError } from "./storage.js";

/**
 * Automatic audit fields owned by QlOrm, not by individual addon models.
 *
 * Odoo exposes `create_date`/`write_date`/`create_uid`/`write_uid` as magic
 * fields that no model declares. MoonWitness keeps its established public
 * timestamp names (`created_at`/`updated_at`) and adds the uid pair as the
 * create/write actor. The mapping is:
 *
 *   Odoo create_date -> created_at
 *   Odoo write_date  -> updated_at
 *   Odoo create_uid  -> created_by
 *   Odoo write_uid   -> updated_by
 *
 * Models must not declare these fields. `QlModelRegistry` normalizes every
 * table model through {@link normalizeModelDefinition}, so views, schema sync,
 * and API metadata all see them. A model that needs a different visibility
 * (for example a private `created_at` on a token table) may still declare the
 * field; the declared definition wins, but the type must stay compatible.
 */
export const AUDIT_FIELD_NAMES = [
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
] as const;

export type QlAuditFieldName = (typeof AUDIT_FIELD_NAMES)[number];

const AUDIT_FIELD_TYPES: Readonly<Record<QlAuditFieldName, "datetime" | "char">> =
  {
    created_at: "datetime",
    updated_at: "datetime",
    created_by: "char",
    updated_by: "char",
  };

export const AUDIT_FIELDS: Readonly<Record<QlAuditFieldName, QlFieldDefinition>> =
  Object.freeze({
    created_at: Object.freeze({ type: "datetime", required: true }),
    updated_at: Object.freeze({ type: "datetime", required: true }),
    created_by: Object.freeze({ type: "char", maxLength: 64, private: true }),
    updated_by: Object.freeze({ type: "char", maxLength: 64, private: true }),
  });

export function isAuditFieldName(name: string): name is QlAuditFieldName {
  return (AUDIT_FIELD_NAMES as readonly string[]).includes(name);
}

/** Audit timestamps that schema sync backfills for rows created before the column existed. */
export function isBackfillableAuditTimestamp(
  name: string,
): name is "created_at" | "updated_at" {
  return name === "created_at" || name === "updated_at";
}

/**
 * Returns a model that carries every audit field. The input manifest is never
 * mutated and repeated calls are idempotent, so a registry can normalize
 * models that are also inspected by addon-adjacent tests.
 */
export function normalizeModelDefinition(
  model: QlModelDefinition,
): QlModelDefinition {
  const missing: QlAuditFieldName[] = [];
  for (const name of AUDIT_FIELD_NAMES) {
    const declared = model.fields[name];
    if (!declared) {
      missing.push(name);
      continue;
    }
    if (declared.type !== AUDIT_FIELD_TYPES[name]) {
      throw new QlConfigurationError(
        `Model '${model.name}' audit field '${name}' must be type '${AUDIT_FIELD_TYPES[name]}'.`,
      );
    }
  }
  if (missing.length === 0) return model;
  const additions: Record<string, QlFieldDefinition> = {};
  for (const name of missing) {
    additions[name] = AUDIT_FIELDS[name];
  }
  return {
    ...model,
    fields: {
      ...model.fields,
      ...additions,
    },
  };
}

/**
 * Validate a model's audit field declarations against QlOrm standards.
 *
 * Returns a compliance report indicating which audit fields are:
 * - declared and correctly typed
 * - declared but with incorrect type
 * - missing (not declared at all)
 * - private (created_by/updated_by have private: true)
 *
 * The model is never mutated; this is a read-only validation.
 */
export function validateModelAuditFields(
  model: QlModelDefinition,
): ModelAuditComplianceReport {
  const report: ModelAuditComplianceReport = {
    modelName: model.name,
    fullyCompliant: true,
    fields: {} as Record<QlAuditFieldName, FieldCompliance>,
  };

  for (const name of AUDIT_FIELD_NAMES) {
    const fieldDef = model.fields[name];
    const fieldCompliance: FieldCompliance = {
      declared: !!fieldDef,
      correctType: false,
      expectedType: AUDIT_FIELD_TYPES[name],
      hasPrivateModifier: false,
    };

    if (fieldDef) {
      fieldCompliance.correctType = fieldDef.type === AUDIT_FIELD_TYPES[name];

      // Check private modifier for created_by/updated_by
      if (name === "created_by" || name === "updated_by") {
        const privateDeclared = "private" in fieldDef && fieldDef.private === true;
        fieldCompliance.hasPrivateModifier = privateDeclared;
      }
    }

    // If any field is not compliant, the model is not fully compliant
    if (!fieldCompliance.correctType || !fieldCompliance.hasPrivateModifier) {
      report.fullyCompliant = false;
    }

    report.fields[name] = fieldCompliance;
  }

  return report;
}

interface FieldCompliance {
  declared: boolean;
  correctType: boolean;
  expectedType: "datetime" | "char";
  hasPrivateModifier: boolean;
}

interface ModelAuditComplianceReport {
  modelName: string;
  fullyCompliant: boolean;
  fields: Record<QlAuditFieldName, FieldCompliance>;
}
