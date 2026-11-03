import type { QlModelDefinition } from "ql_orm";

/**
 * Valid studio artifact kinds (MWREQ-00748..MWREQ-00762).
 */
export const STUDIO_ARTIFACT_KINDS = [
  "manuscript_draft",
  "screenplay_script",
  "world_bible_entry",
  "illustration_brief",
  "adaptation_outline",
  "storyboard_panel",
] as const;

export type StudioArtifactKind = (typeof STUDIO_ARTIFACT_KINDS)[number];

/**
 * Valid lifecycle stages of creative artifacts in studio.
 */
export const STUDIO_LIFECYCLE_STAGES = [
  "concept",
  "drafting",
  "peer_review",
  "lore_ratification",
  "published_canon",
  "archived",
] as const;

export type StudioLifecycleStage = (typeof STUDIO_LIFECYCLE_STAGES)[number];

/**
 * `studio.artifact` — Creative studio workspace artifact and derivative work (MW-1236).
 *
 * Implements MWREQ-00748 through MWREQ-00762:
 * - Versioned creative studio draft workspace.
 * - Tracks derivative adaptations, lore compliance reviews, and creative iterations.
 * - Clear attribution to authors/collaborators without contaminating canonical corpus sources.
 */
export const studioArtifact: QlModelDefinition = {
  name: "studio.artifact",
  description: "Artefak studio kreatif, draf naskah, dan karya turunan (MW-1236).",
  tableName: "studio_artifact",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    title: { type: "char", required: true, maxLength: 250 },
    kind: {
      type: "char",
      required: true,
      maxLength: 32,
      options: STUDIO_ARTIFACT_KINDS,
      validator(value) {
        return STUDIO_ARTIFACT_KINDS.some((k) => k === value)
          ? undefined
          : `kind must be one of ${STUDIO_ARTIFACT_KINDS.join(", ")}.`;
      },
    },
    lifecycle_stage: {
      type: "char",
      required: true,
      maxLength: 32,
      options: STUDIO_LIFECYCLE_STAGES,
      validator(value) {
        return STUDIO_LIFECYCLE_STAGES.some((s) => s === value)
          ? undefined
          : `lifecycle_stage must be one of ${STUDIO_LIFECYCLE_STAGES.join(", ")}.`;
      },
    },
    version_tag: { type: "char", maxLength: 32 },
    synopsis: { type: "text", maxLength: 2000 },
    content_body: { type: "text", maxLength: 10000 },
    lore_review_notes: { type: "text", maxLength: 4000 },
    owner_id: { type: "char", required: true, maxLength: 64 },
  },
};
