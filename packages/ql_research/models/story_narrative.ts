import type { QlModelDefinition } from "ql_orm";

/**
 * Story narrative modes (MWREQ-00562).
 * Fictional story, oral tradition, religious interpretation, and historical report
 * must remain strictly distinguishable.
 */
export const STORY_MODES = [
  "historical_report",
  "oral_tradition",
  "religious_interpretation",
  "fictional_narrative",
  "parable",
] as const;

export type StoryMode = (typeof STORY_MODES)[number];

/**
 * `story.narrative` — Narrative work, myth, folklore, and story versions.
 *
 * Implements MWREQ-00544 through MWREQ-00562 (MW-1225):
 * - Supports narrative variants, motifs, scenes, and attribution.
 * - Explicitly tracks fictional vs. historical mode to prevent truth confusion.
 */
export const storyNarrative: QlModelDefinition = {
  name: "story.narrative",
  description: "Karya naratif, tradisi lisan, folklor, dan motif cerita (MW-1225).",
  tableName: "story_narrative",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    title: { type: "char", required: true, maxLength: 200 },
    story_mode: {
      type: "char",
      required: true,
      maxLength: 32,
      validator(value) {
        return STORY_MODES.some((mode) => mode === value)
          ? undefined
          : `story_mode must be one of ${STORY_MODES.join(", ")}.`;
      },
    },
    tradition: { type: "char", maxLength: 100 },
    summary: { type: "text", required: true, maxLength: 4000 },
    motifs: { type: "text", maxLength: 2000 },
    source_artifact_id: { type: "char", maxLength: 64 },
    passage_id: { type: "char", maxLength: 64 },
    is_fictional: { type: "boolean", required: true },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
