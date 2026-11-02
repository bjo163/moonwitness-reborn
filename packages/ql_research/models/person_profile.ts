import type { QlModelDefinition } from "ql_orm";

/**
 * Historical person roles (MWREQ-00580..MWREQ-00588).
 */
export const HISTORICAL_PERSON_ROLES = [
  "author",
  "witness",
  "transmitter",
  "researcher",
  "translator",
  "editor",
  "scholar",
  "ruler",
  "historical_figure",
] as const;

export type HistoricalPersonRole = (typeof HISTORICAL_PERSON_ROLES)[number];

/**
 * `person.profile` — Historical or public person profile (MW-1227).
 *
 * Implements MWREQ-00579 through MWREQ-00596:
 * - Real/historical identity backed by sources.
 * - Distinct from user account or fictional character.
 * - Preserves role attribution and uncertainty notes.
 * - SUPERHERO is a domain label, not a universal moral verdict (MWREQ-00595).
 */
export const personProfile: QlModelDefinition = {
  name: "person.profile",
  description: "Profil tokoh historis, perawi, dan atribusi peran (MW-1227).",
  tableName: "person_profile",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    primary_name: { type: "char", required: true, maxLength: 200 },
    aliases: { type: "text", maxLength: 2000 },
    primary_role: {
      type: "char",
      required: true,
      maxLength: 32,
      options: HISTORICAL_PERSON_ROLES,
      validator(value) {
        return HISTORICAL_PERSON_ROLES.some((role) => role === value)
          ? undefined
          : `primary_role must be one of ${HISTORICAL_PERSON_ROLES.join(", ")}.`;
      },
    },
    era_context: { type: "char", maxLength: 200 },
    biographical_summary: { type: "text", maxLength: 4000 },
    attribution_notes: { type: "text", maxLength: 2000 },
    source_artifact_id: { type: "char", maxLength: 64 },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
