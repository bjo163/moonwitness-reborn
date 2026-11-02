import type { QlModelDefinition } from "ql_orm";

/**
 * Valid prominence levels for character appearances (MWREQ-00736..MWREQ-00747).
 */
export const APPEARANCE_PROMINENCES = [
  "focal_lead",
  "supporting_active",
  "cameo_brief",
  "referenced_offscreen",
  "background_crowd",
] as const;

export type AppearanceProminence = (typeof APPEARANCE_PROMINENCES)[number];

/**
 * `character.appearance` — Character usage and appearance tracking in creative works (MW-1235).
 *
 * Implements MWREQ-00736 through MWREQ-00747:
 * - Tracks occurrences of characters across stories, narratives, episodes, and passages.
 * - Records character development arc stage and prominence level.
 * - Prevents narrative contradictions by verifying appearance chronology and canon compliance.
 */
export const characterAppearance: QlModelDefinition = {
  name: "character.appearance",
  description: "Pencatatan kemunculan dan pemakaian karakter dalam karya naratif (MW-1235).",
  tableName: "character_appearance",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    character_id: { type: "char", required: true, maxLength: 80 },
    target_work_id: { type: "char", required: true, maxLength: 80 },
    narrative_segment: { type: "char", maxLength: 200 },
    prominence: {
      type: "char",
      required: true,
      maxLength: 32,
      validator(value) {
        return APPEARANCE_PROMINENCES.some((p) => p === value)
          ? undefined
          : `prominence must be one of ${APPEARANCE_PROMINENCES.join(", ")}.`;
      },
    },
    arc_milestone: { type: "char", maxLength: 200 },
    scene_notes: { type: "text", maxLength: 4000 },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
