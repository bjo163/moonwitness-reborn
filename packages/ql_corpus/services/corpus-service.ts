import {
  QlAccessError,
  QlConflictError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
  type QlUserContext,
} from "ql_orm";
import {
  ANNOTATION_AUTHORITIES,
  CORPUS_STAGES,
  TEXT_AUTHORITIES,
  type CorpusStage,
} from "./corpus-vocabulary.js";
import { readRights } from "ql_source/services/source-service";

/**
 * `ql_corpus` write-side service layer.
 *
 * Every mutation goes through `orm.updateRecordsForService` or
 * `orm.createRecordForService` — those service writes bypass the model ACL
 * (which would refuse a user PATCH on `stage`) but **do not** bypass the
 * domain guards declared below. Errors surface as existing QlOrm error
 * classes so the API boundary's `handleRequestError`
 * (`apps/api/src/http/server.ts:218-272`) already maps them correctly.
 *
 * Like `ql_workflow` (MW-ADR-017) and `ql_source`, a full update +
 * append-provenance pair is not wrapped in an explicit transaction because
 * QlOrm does not expose one; the audit ledger on `source.provenance`
 * remains the single source of truth on what actually happened.
 */

const PUBLISH_GROUPS: readonly string[] = ["admin", "root", "operator"];

function isCorpusStage(value: unknown): value is CorpusStage {
  return typeof value === "string" && (CORPUS_STAGES as readonly string[]).includes(value);
}

function assertPublisher(actor: QlUserContext): void {
  if (!actor.groups.some((group) => PUBLISH_GROUPS.includes(group))) {
    throw new QlAccessError(
      "Corpus publication requires the admin, root, or operator group.",
    );
  }
}

/**
 * Cross-field invariant that a single-value QlOrm validator cannot express
 * (see `packages/ql-orm/src/index.ts:28`). Called by both the importer and
 * the read handler; a violation is a **data-model bug**, not user input to
 * be sanitised, so the caller must never catch and continue.
 */
export function assertEditionKindLocaleInvariant(edition: {
  authority: unknown;
  locale: unknown;
} | QlRecord): void {
  const authority = String(
    (edition as { authority?: string | undefined }).authority ?? "",
  );
  const locale = String((edition as { locale?: string | undefined }).locale ?? "");
  if (authority === "revelation_verbatim" && !locale.toLowerCase().startsWith("ar")) {
    throw new QlConflictError(
      "Edition authority 'revelation_verbatim' requires an Arabic locale (canonical rule: Qur'anic text is only Arabic verbatim; every other language is attributed as translation/tafsir).",
    );
  }
  if (authority === "translation" && locale.toLowerCase().startsWith("ar")) {
    // Not forbidden by canon, but a "translation" of the Quran into Arabic
    // is very likely a data-entry slip for `revelation_verbatim` — refuse it
    // loudly so the operator resolves it deliberately.
    throw new QlConflictError(
      "Edition authority 'translation' with an Arabic locale is ambiguous; either mark it 'revelation_verbatim' or use a non-Arabic locale.",
    );
  }
}

/**
 * Assert that a proposed passage `authority` is a legal text authority and,
 * for annotations, that it is a legal annotation authority. This is
 * belt-and-braces on top of the field-level `authorityValidator` — the
 * service still checks before hitting the DB so an importer typo surfaces
 * with an actionable error, not a raw validator message.
 */
export function assertPassageAuthority(kind: string): void {
  if (!(TEXT_AUTHORITIES as readonly string[]).includes(String(kind))) {
    throw new QlValidationError(
      `corpus.passage.authority must be one of [${TEXT_AUTHORITIES.join(", ")}]; got '${String(kind)}'.`,
    );
  }
}

export function assertAnnotationAuthority(kind: string): void {
  if (!(ANNOTATION_AUTHORITIES as readonly string[]).includes(String(kind))) {
    throw new QlValidationError(
      `corpus.annotation.authority must be one of [${ANNOTATION_AUTHORITIES.join(", ")}]; got '${String(kind)}'. Revelation text may never live in the annotation table (MW-ADR-019).`,
    );
  }
}

async function appendSourceProvenance(
  orm: QlOrm,
  row: {
    subjectType: string;
    subjectId: string;
    fromStage: string;
    toStage: string;
    action: string;
    reason?: string;
    actorId: string;
    correlationId: string;
  },
): Promise<void> {
  await orm.createRecordForService("source.provenance", {
    subject_type: row.subjectType,
    subject_id: row.subjectId,
    ...(row.fromStage ? { from_stage: row.fromStage } : {}),
    to_stage: row.toStage,
    action: row.action,
    reason: row.reason ?? "",
    correlation_id: row.correlationId,
    actor_id: row.actorId,
    occurred_at: new Date(),
  });
}

function correlationId(): string {
  return `corp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Flip a staged edition (and all of its passage rows) to `published`.
 *
 * Enforces, in order:
 *   1. publisher actor group (admin / root / operator)
 *   2. edition exists and is currently `staged` (idempotency: re-publish is
 *      refused so the audit trail records one publish event per transition)
 *   3. `source.rights.rights_status` for the edition's `display` action is
 *      `"cleared"` — deny-by-default (`DATA_LIFECYCLE_AND_PROVENANCE.md:27`)
 *      and the operator gate from MW-ADR-019 §(e)
 *   4. the kind/locale invariant still holds (`assertEditionKindLocaleInvariant`)
 */
export async function publishEdition(
  orm: QlOrm,
  actor: QlUserContext,
  editionKey: string,
  reason?: string,
): Promise<QlRecord> {
  assertPublisher(actor);
  const edition = await orm.findOneByService("corpus.edition", {
    edition_key: editionKey,
  });
  if (!edition) throw new QlNotFoundError(`Edition '${editionKey}' not found.`);
  if (edition.stage !== "staged") {
    throw new QlConflictError(
      `Edition '${editionKey}' is in stage '${String(edition.stage)}'; only 'staged' editions can be published.`,
    );
  }
  assertEditionKindLocaleInvariant(edition);
  const rights = await readRights(orm, String(edition.source_version_id), "display");
  if (!rights || rights.rights_status !== "cleared") {
    throw new QlConflictError(
      "Rights for display are not cleared for this edition; refusing to publish (deny-by-default per DATA_LIFECYCLE_AND_PROVENANCE.md:27).",
    );
  }
  const cid = correlationId();
  const stageUpdates = await orm.updateRecordsForService(
    "corpus.edition",
    { edition_key: editionKey },
    { stage: "published" },
  );
  if (stageUpdates === 0) {
    throw new QlConflictError(`Edition '${editionKey}' could not be published.`);
  }
  await orm.updateRecordsForService(
    "corpus.passage",
    { edition_id: String(edition.id), stage: "staged" },
    { stage: "published" },
  );
  await appendSourceProvenance(orm, {
    subjectType: "corpus.edition",
    subjectId: String(edition.id),
    fromStage: "staged",
    toStage: "published",
    action: "corpus_publish",
    reason,
    actorId: actor.id,
    correlationId: cid,
  });
  const after = await orm.findOneByService("corpus.edition", { edition_key: editionKey });
  if (!after) throw new QlNotFoundError(`Edition '${editionKey}' vanished after publish.`);
  return after;
}

/**
 * Roll a published edition back to `staged`. Retains every row and every
 * provenance entry (audit is not deleted); the public surface empties with
 * a single field flip, which is the rollback drill required by
 * `DATA_LIFECYCLE_AND_PROVENANCE.md:33-42` control 8.
 */
export async function withdrawEdition(
  orm: QlOrm,
  actor: QlUserContext,
  editionKey: string,
  reason?: string,
): Promise<QlRecord> {
  assertPublisher(actor);
  const edition = await orm.findOneByService("corpus.edition", {
    edition_key: editionKey,
  });
  if (!edition) throw new QlNotFoundError(`Edition '${editionKey}' not found.`);
  if (edition.stage !== "published") {
    throw new QlConflictError(
      `Edition '${editionKey}' is in stage '${String(edition.stage)}'; only published editions can be withdrawn.`,
    );
  }
  if (!isCorpusStage("withdrawn")) {
    throw new QlValidationError("Internal: 'withdrawn' is not a known corpus stage.");
  }
  const cid = correlationId();
  const updated = await orm.updateRecordsForService(
    "corpus.edition",
    { edition_key: editionKey },
    { stage: "withdrawn" },
  );
  if (updated === 0) {
    throw new QlConflictError(`Edition '${editionKey}' could not be withdrawn.`);
  }
  await orm.updateRecordsForService(
    "corpus.passage",
    { edition_id: String(edition.id), stage: "published" },
    { stage: "withdrawn" },
  );
  await appendSourceProvenance(orm, {
    subjectType: "corpus.edition",
    subjectId: String(edition.id),
    fromStage: "published",
    toStage: "withdrawn",
    action: "corpus_withdraw",
    reason,
    actorId: actor.id,
    correlationId: cid,
  });
  const after = await orm.findOneByService("corpus.edition", { edition_key: editionKey });
  if (!after) throw new QlNotFoundError(`Edition '${editionKey}' vanished after withdraw.`);
  return after;
}
