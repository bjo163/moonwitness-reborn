import {
  QlConflictError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
  type QlUserContext,
} from "ql_orm";
import {
  LIFECYCLE_STAGES,
  RIGHTS_ACTIONS,
  RIGHTS_STATUSES,
  type LifecycleStage,
  type RightsAction,
  type RightsStatus,
} from "./source-vocabulary.js";

/**
 * `ql_source` service layer.
 *
 * Every mutation goes through `orm.updateRecordsForService` or
 * `orm.createRecordForService` — those service writes bypass the model ACL
 * (which would refuse a user PATCH on `lifecycle_stage` / `rights_status`)
 * but **do not** bypass the domain guards declared below. Errors surface as
 * the existing QlOrm error classes so the API boundary's `handleRequestError`
 * already maps them correctly: `QlValidationError → 400`,
 * `QlAccessError → 403`, `QlConflictError → 409`, `QlNotFoundError → 404`.
 *
 * Like `ql_workflow` (MW-ADR-017), a full update + append-provenance pair is
 * **not** wrapped in an explicit transaction — QlOrm does not expose one
 * (`packages/ql-orm/src/index.ts` grep for `transaction|BEGIN` returns 0).
 * A partial failure therefore surfaces as an error to the caller; the
 * provenance table remains the single source of truth on what actually
 * happened because every successful write appends before returning.
 */

// Reviewer groups permitted to flip a rights status. Kept in lock-step with
// `ql_corpus/services/corpus-service.ts` so a rights decision is only made
// by the same people who can publish (or refuse to publish) content.
const RIGHTS_REVIEWER_GROUPS: readonly string[] = ["admin", "root"];
const LIFECYCLE_REVIEWER_GROUPS: readonly string[] = ["admin", "root", "operator"];

function isLifecycleStage(value: unknown): value is LifecycleStage {
  return (
    typeof value === "string" &&
    (LIFECYCLE_STAGES as readonly string[]).includes(value)
  );
}

function isRightsAction(value: unknown): value is RightsAction {
  return (
    typeof value === "string" && (RIGHTS_ACTIONS as readonly string[]).includes(value)
  );
}

function isRightsStatus(value: unknown): value is RightsStatus {
  return (
    typeof value === "string" && (RIGHTS_STATUSES as readonly string[]).includes(value)
  );
}

function actorBelongsTo(user: QlUserContext, allowed: readonly string[]): boolean {
  return user.groups.some((group) => allowed.includes(group));
}

function correlationId(): string {
  return `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function appendProvenance(
  orm: QlOrm,
  row: {
    subjectType: string;
    subjectId: string;
    fromStage?: string;
    toStage: string;
    action: string;
    decision?: string;
    reason?: string;
    actorId: string;
    correlationId: string;
    inputVersionId?: string;
  },
): Promise<QlRecord> {
  return orm.createRecordForService("source.provenance", {
    subject_type: row.subjectType,
    subject_id: row.subjectId,
    // Only set `from_stage` when we actually have a prior stage — the field's
    // enumValidator rejects an empty string, and QlOrm's `createRecordForService`
    // skips the validator entirely for keys the input omits.
    ...(row.fromStage ? { from_stage: row.fromStage } : {}),
    to_stage: row.toStage,
    action: row.action,
    ...(row.decision ? { decision: row.decision } : {}),
    reason: row.reason ?? "",
    correlation_id: row.correlationId,
    ...(row.inputVersionId ? { input_version_id: row.inputVersionId } : {}),
    actor_id: row.actorId,
    occurred_at: new Date(),
  });
}

/**
 * Advance an artifact's or version's lifecycle stage. Enforces:
 *   - reviewer group membership (admin/root for artifact; admin/root/operator for version)
 *   - the target stage is a real lifecycle value
 *   - the transition is not to the same stage (no silent no-op writes)
 * Then updates the row and appends a `source.provenance` audit entry.
 */
export async function transitionStage(
  orm: QlOrm,
  actor: QlUserContext,
  kind: "artifact" | "version",
  id: string,
  toStage: unknown,
  reason?: string,
): Promise<{ record: QlRecord; provenance: QlRecord }> {
  if (!isLifecycleStage(toStage)) {
    throw new QlValidationError(`Unknown lifecycle stage '${String(toStage)}'.`);
  }
  if (!actorBelongsTo(actor, LIFECYCLE_REVIEWER_GROUPS)) {
    throw new QlConflictError(
      "Lifecycle transitions require an operator, admin, or root group.",
    );
  }
  const model = kind === "artifact" ? "source.artifact" : "source.version";
  const existing = await orm.findOneByService(model, { id });
  if (!existing) throw new QlNotFoundError(`${model} '${id}' not found.`);
  const fromStage = String(existing.lifecycle_stage ?? "");
  if (fromStage === toStage) {
    throw new QlConflictError(
      `${model} is already in stage '${toStage}'; transition is a no-op.`,
    );
  }
  const stamped = new Date();
  const updatedCount = await orm.updateRecordsForService(
    model,
    { id },
    { lifecycle_stage: toStage, updated_at: stamped },
  );
  if (updatedCount === 0) {
    throw new QlNotFoundError(`${model} '${id}' could not be updated.`);
  }
  const record = await orm.findOneByService(model, { id });
  if (!record) throw new QlNotFoundError(`${model} '${id}' vanished after update.`);
  const cid = correlationId();
  const provenance = await appendProvenance(orm, {
    subjectType: model,
    subjectId: id,
    fromStage,
    toStage,
    action: "lifecycle_transition",
    reason,
    actorId: actor.id,
    correlationId: cid,
  });
  return { record, provenance };
}

/**
 * Record or update the rights decision for a specific action against a
 * specific `source.version`. Requires an admin/root actor and an existing
 * version row. Creates the composite `rights_key` internally so callers
 * cannot accidentally desynchronise it from the (version_id, action) pair.
 */
export async function upsertRights(
  orm: QlOrm,
  actor: QlUserContext,
  input: {
    versionId: string;
    action: unknown;
    status: unknown;
    licenseId?: string;
    licenseText?: string;
    attributionText: string;
    attributionRequired?: boolean;
    territory?: string;
    licenseEvidenceRef?: string;
    basisNotes?: string;
    reason?: string;
  },
): Promise<{ record: QlRecord; provenance: QlRecord }> {
  if (!isRightsAction(input.action)) {
    throw new QlValidationError(`Unknown rights action '${String(input.action)}'.`);
  }
  if (!isRightsStatus(input.status)) {
    throw new QlValidationError(`Unknown rights status '${String(input.status)}'.`);
  }
  if (!actorBelongsTo(actor, RIGHTS_REVIEWER_GROUPS)) {
    throw new QlConflictError(
      "Rights decisions require the admin or root group.",
    );
  }
  const version = await orm.findOneByService("source.version", {
    id: input.versionId,
  });
  if (!version) {
    throw new QlNotFoundError(`source.version '${input.versionId}' not found.`);
  }
  const action = input.action;
  const status = input.status;
  const key = `${input.versionId}|${action}`;
  const stamped = new Date();
  const existing = await orm.findOneByService("source.rights", { rights_key: key });
  let record: QlRecord;
  if (existing) {
    const changed = await orm.updateRecordsForService(
      "source.rights",
      { rights_key: key },
      {
        rights_status: status,
        license_id: input.licenseId ?? "",
        license_text: input.licenseText ?? "",
        attribution_required: input.attributionRequired ?? true,
        attribution_text: input.attributionText,
        territory: input.territory ?? "",
        verified_by_id: actor.id,
        verified_at: stamped,
        license_evidence_ref: input.licenseEvidenceRef ?? "",
        basis_notes: input.basisNotes ?? "",
        updated_at: stamped,
      },
    );
    if (changed === 0) {
      throw new QlConflictError(`Rights row '${key}' could not be updated.`);
    }
    const after = await orm.findOneByService("source.rights", { rights_key: key });
    if (!after) throw new QlNotFoundError(`Rights row '${key}' vanished.`);
    record = after;
  } else {
    const ownerId = typeof version.owner_id === "string" ? version.owner_id : actor.id;
    record = await orm.createRecordForService("source.rights", {
      version_id: input.versionId,
      rights_key: key,
      action,
      rights_status: status,
      license_id: input.licenseId ?? "",
      license_text: input.licenseText ?? "",
      attribution_required: input.attributionRequired ?? true,
      attribution_text: input.attributionText,
      territory: input.territory ?? "",
      verified_by_id: actor.id,
      verified_at: stamped,
      license_evidence_ref: input.licenseEvidenceRef ?? "",
      basis_notes: input.basisNotes ?? "",
      owner_id: ownerId,
      created_at: stamped,
      updated_at: stamped,
    });
  }
  const cid = correlationId();
  const provenance = await appendProvenance(orm, {
    subjectType: "source.rights",
    subjectId: String(record.id),
    fromStage: existing ? String(existing.rights_status) : "",
    toStage: status,
    action: `rights_${existing ? "updated" : "created"}:${action}`,
    decision: status,
    reason: input.reason ?? "",
    actorId: actor.id,
    correlationId: cid,
    inputVersionId: input.versionId,
  });
  return { record, provenance };
}

/**
 * Read the rights decision for a specific action against a specific version.
 * Returns `null` when no row exists — callers must treat `null` as
 * "block this action" per the deny-by-default rule in
 * `https://github.com/bjo163/moonwitness-reborn/wiki/docs-data-DATA_LIFECYCLE_AND_PROVENANCE`.
 */
export async function readRights(
  orm: QlOrm,
  versionId: string,
  action: RightsAction,
): Promise<QlRecord | null> {
  return (
    (await orm.findOneByService("source.rights", {
      rights_key: `${versionId}|${action}`,
    })) ?? null
  );
}
