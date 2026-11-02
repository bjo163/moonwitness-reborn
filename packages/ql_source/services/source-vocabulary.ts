/**
 * `ql_source` — canonical vocabularies for the source registry.
 *
 * Kept as local `as const` arrays (not promoted to `@moonwitness/types`)
 * because MW-ADR-015 requires a proven 3-site duplication threshold; today
 * these unions have exactly two consumers: the `ql_source` field validators
 * and the `@moonwitness/moonclient` DTO re-declarations. Promote only when a
 * second addon or client genuinely needs the same vocabulary.
 *
 * `LIFECYCLE_STAGES` is transcribed verbatim from
 * `https://github.com/bjo163/moonwitness-reborn/wiki/docs-data-DATA_LIFECYCLE_AND_PROVENANCE` — adding or renaming a
 * stage requires updating that spec first, and any transition-guard change
 * in `services/source-service.ts`.
 */

export const LIFECYCLE_STAGES = [
  "discovered",
  "registered",
  "rights_checked",
  "ingest_staged",
  "validated",
  "mapped",
  "reviewed",
  "approved",
  "published",
  "rejected",
  "quarantined",
  "superseded",
  "withdrawn",
  "corrected",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

/**
 * Terminal lifecycle stages — no outgoing transitions are permitted by the
 * source-service guard except the ones enumerated in `lifecycleTransitions`.
 */
export const CLOSED_LIFECYCLE_STAGES: readonly LifecycleStage[] = [
  "rejected",
  "quarantined",
  "superseded",
];

/**
 * `source.rights.rights_status` values. Deny-by-default is structural:
 * a fresh row always lands on `"unknown"`, and `"unknown"` is treated as
 * "block the affected use" everywhere it is read (see
 * `DATA_LIFECYCLE_AND_PROVENANCE.md:27`).
 */
export const RIGHTS_STATUSES = [
  "unknown",
  "under_review",
  "cleared",
  "restricted",
  "not_applicable",
] as const;
export type RightsStatus = (typeof RIGHTS_STATUSES)[number];

/** Rights actions are the granularity at which a rights row grants or blocks use. */
export const RIGHTS_ACTIONS = [
  "import",
  "index",
  "display",
  "transform",
  "export",
  "publish",
] as const;
export type RightsAction = (typeof RIGHTS_ACTIONS)[number];

/** Classification of a `source.artifact`'s underlying body of work. */
export const ARTIFACT_KINDS = [
  "revealed_text",
  "translation_source",
  "commentary_source",
  "lexicon_source",
  "research_corpus",
] as const;
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

/**
 * Entity types that a `source.provenance` row may reference. Kept here so
 * the validator can reject subject-type typos that would otherwise silently
 * orphan an audit trail.
 */
export const ENTITY_REF_TYPES = [
  "source.artifact",
  "source.version",
  "source.rights",
  "corpus.work",
  "corpus.edition",
  "corpus.passage",
  "corpus.annotation",
  "ontology.term",
] as const;
export type EntityRefType = (typeof ENTITY_REF_TYPES)[number];

/** Default values used by the service when creating records. */
export const DEFAULT_LIFECYCLE_STAGE: LifecycleStage = "discovered";
export const DEFAULT_RIGHTS_STATUS: RightsStatus = "unknown";

/**
 * The `source.provenance` ledger tracks both lifecycle transitions (whose
 * stages are `LIFECYCLE_STAGES`) **and** rights decisions (whose states are
 * `RIGHTS_STATUSES`). Because a QlOrm validator sees only one value at a
 * time (`packages/ql-orm/src/index.ts:28` — `(value: unknown) => string | undefined`),
 * the `from_stage`/`to_stage` field has to accept the union of the two
 * vocabularies; the `services/source-service.ts` writer is responsible for
 * pairing a `subject_type` with a stage drawn from the correct set.
 */
export const PROVENANCE_STAGES: readonly string[] = Array.from(
  new Set<string>([...LIFECYCLE_STAGES, ...RIGHTS_STATUSES]),
);
