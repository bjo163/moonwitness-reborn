import type { QlModelDefinition } from "ql_orm";

/**
 * Valid archetypes under MWREQ-00713..MWREQ-00723.
 */
export const CHARACTER_ARCHETYPES = [
  "protagonist_seeker",
  "mentor_scholar",
  "loyal_companion",
  "skeptical_investigator",
  "historical_ruler",
  "antagonist_adversary",
  "guardian_custodian",
  "herald_messenger",
] as const;

export type CharacterArchetype = (typeof CHARACTER_ARCHETYPES)[number];

/**
 * Valid alignment spectra in creative story world.
 */
export const CHARACTER_ALIGNMENTS = [
  "righteous_principled",
  "dutiful_conformist",
  "pragmatic_neutral",
  "ambitious_compromised",
  "corrupt_destructive",
  "unaligned_enigmatic",
] as const;

export type CharacterAlignment = (typeof CHARACTER_ALIGNMENTS)[number];

/**
 * `character.classification` — Archetype, alignment, traits, and classification for characters (MW-1234).
 *
 * Implements MWREQ-00713 through MWREQ-00723:
 * - Structured traits and archetype mappings for controlled canon characters.
 * - Narrative role tracking and moral alignment spectrum.
 * - Prevents reductionist stereotypes by maintaining multi-trait descriptions.
 */
export const characterClassification: QlModelDefinition = {
  name: "character.classification",
  description: "Klasifikasi arketipe, alignment, dan trait karakter (MW-1234).",
  tableName: "character_classification",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    character_id: { type: "char", required: true, maxLength: 80 },
    archetype: {
      type: "char",
      required: true,
      maxLength: 32,
      validator(value) {
        return CHARACTER_ARCHETYPES.some((a) => a === value)
          ? undefined
          : `archetype must be one of ${CHARACTER_ARCHETYPES.join(", ")}.`;
      },
    },
    alignment: {
      type: "char",
      required: true,
      maxLength: 32,
      validator(value) {
        return CHARACTER_ALIGNMENTS.some((al) => al === value)
          ? undefined
          : `alignment must be one of ${CHARACTER_ALIGNMENTS.join(", ")}.`;
      },
    },
    core_traits: { type: "text", maxLength: 2000 },
    narrative_function: { type: "text", maxLength: 2000 },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
