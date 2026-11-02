import type { QlModelDefinition } from "ql_orm";

/**
 * Valid legal jurisdictions and traditions under MW-1230.
 */
export const LEGAL_JURISDICTIONS = [
  "islamic_classical",
  "islamic_contemporary",
  "civil_law",
  "common_law",
  "international",
  "comparative",
  "customary",
] as const;

export type LegalJurisdiction = (typeof LEGAL_JURISDICTIONS)[number];

/**
 * Valid legal instrument types under MWREQ-00635..MWREQ-00650.
 */
export const INSTRUMENT_TYPES = [
  "statute",
  "fatwa",
  "treaty",
  "judicial_precedent",
  "legal_canon",
  "doctrinal_text",
  "regulatory_rule",
] as const;

export type InstrumentType = (typeof INSTRUMENT_TYPES)[number];

/**
 * `law.instrument` — Legal instrument, canon, fatwa, or statute (MW-1230).
 *
 * Implements MWREQ-00635 through MWREQ-00650:
 * - Legal instrument definition with jurisdiction context.
 * - Distinguishes between binding statutory law, classical jurisprudence, and advisory rulings.
 * - Supports comparative cross-referencing and authority citation.
 */
export const lawInstrument: QlModelDefinition = {
  name: "law.instrument",
  description: "Instrumen hukum, fatwa, undang-undang, dan kanon yurisdiksi (MW-1230).",
  tableName: "law_instrument",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    title: { type: "char", required: true, maxLength: 250 },
    jurisdiction: {
      type: "char",
      required: true,
      maxLength: 32,
      options: LEGAL_JURISDICTIONS,
      validator(value) {
        return LEGAL_JURISDICTIONS.some((j) => j === value)
          ? undefined
          : `jurisdiction must be one of ${LEGAL_JURISDICTIONS.join(", ")}.`;
      },
    },
    instrument_type: {
      type: "char",
      required: true,
      maxLength: 32,
      options: INSTRUMENT_TYPES,
      validator(value) {
        return INSTRUMENT_TYPES.some((t) => t === value)
          ? undefined
          : `instrument_type must be one of ${INSTRUMENT_TYPES.join(", ")}.`;
      },
    },
    issuing_authority: { type: "char", maxLength: 200 },
    promulgation_date: { type: "char", maxLength: 32 },
    operative_scope: { type: "text", maxLength: 2000 },
    summary: { type: "text", maxLength: 4000 },
    source_reference: { type: "char", maxLength: 250 },
    is_binding: { type: "boolean", default: false },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
