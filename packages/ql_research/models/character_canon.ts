import type { QlModelDefinition } from "ql_orm";

/**
 * Valid canonical character tiers / statuses (MWREQ-00684..MWREQ-00712).
 */
export const CHARACTER_CANON_STATUSES = [
  "canon_core",
  "canon_supporting",
  "historical_reference",
  "legendary_traditional",
  "fictional_archetype",
  "draft_candidate",
] as const;

export type CharacterCanonStatus = (typeof CHARACTER_CANON_STATUSES)[number];

/**
 * `character.canon` — Controlled canon character bible entry (MW-1233).
 *
 * Implements MWREQ-00684 through MWREQ-00712:
 * - Controlled character identity, backstory, and narrative purpose.
 * - Strict demarcation between historical persons, mythological figures, and creative characters.
 * - Versioned character profiles ensuring lore consistency and world-building integrity.
 */
export const characterCanon: QlModelDefinition = {
  name: "character.canon",
  description: "Entri karakter kanonis character bible dan integritas dunia cerita (MW-1233).",
  tableName: "character_canon",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    name: { type: "char", required: true, maxLength: 200 },
    alias: { type: "char", maxLength: 200 },
    canon_status: {
      type: "char",
      required: true,
      maxLength: 32,
      options: CHARACTER_CANON_STATUSES,
      validator(value) {
        return CHARACTER_CANON_STATUSES.some((s) => s === value)
          ? undefined
          : `canon_status must be one of ${CHARACTER_CANON_STATUSES.join(", ")}.`;
      },
    },
    backstory_summary: { type: "text", maxLength: 4000 },
    motivation: { type: "text", maxLength: 2000 },
    historical_anchor_id: { type: "char", maxLength: 80 },
    lore_constraints: { type: "text", maxLength: 2000 },
    creative_owner_id: { type: "char", maxLength: 64 },
  },
};
