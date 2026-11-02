import type { QlModelDefinition } from "ql_orm";

/**
 * Epistemic status of an event record (MWREQ-00577, MWREQ-00578).
 * A disputed event must never be presented as established fact.
 */
export const EVENT_EPISTEMIC_STATUSES = [
  "established_fact",
  "strongly_attested",
  "disputed",
  "legendary_traditional",
  "conjectural",
] as const;

export type EventEpistemicStatus = (typeof EVENT_EPISTEMIC_STATUSES)[number];

/**
 * `event.record` — Historical or contemporary event record (MW-1226).
 *
 * Implements MWREQ-00563 through MWREQ-00578:
 * - Timeline, location context, participants, witness links.
 * - Material evidence & alternative accounts tracking.
 * - Explicit epistemic status and uncertainty rating.
 */
export const eventRecord: QlModelDefinition = {
  name: "event.record",
  description: "Rekaman peristiwa historis, kronologi, dan status epistemik (MW-1226).",
  tableName: "event_record",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    title: { type: "char", required: true, maxLength: 200 },
    summary: { type: "text", required: true, maxLength: 4000 },
    temporal_context: { type: "char", required: true, maxLength: 200 },
    location: { type: "char", maxLength: 200 },
    country_code: { type: "char", maxLength: 2 },
    participants: { type: "text", maxLength: 2000 },
    epistemic_status: {
      type: "char",
      required: true,
      maxLength: 32,
      options: EVENT_EPISTEMIC_STATUSES,
      validator(value) {
        return EVENT_EPISTEMIC_STATUSES.some((status) => status === value)
          ? undefined
          : `epistemic_status must be one of ${EVENT_EPISTEMIC_STATUSES.join(", ")}.`;
      },
    },
    competing_accounts: { type: "text", maxLength: 4000 },
    uncertainty_notes: { type: "text", maxLength: 2000 },
    source_artifact_id: { type: "char", maxLength: 64 },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
