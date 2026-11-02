import type { QlModelDefinition } from "ql_orm";
import {
  AYAH_MAX_BOUND,
  QURAN_LOCALES,
  SURAH_MAX,
  SURAH_MIN,
} from "ql_corpus/services/corpus-vocabulary";

function searchLocaleValidator(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return QURAN_LOCALES.some((locale) => locale === value)
    ? undefined
    : `Field 'locale' must be one of: ${QURAN_LOCALES.join(", ")}.`;
}

/**
 * Search Index Entry Model — MW-0604 / MWREQ-01168..01184
 *
 * Stores search tokens mapped to target models and records.
 * Private fields and unauthorized domain content are strictly excluded during indexing.
 */
export const searchIndexEntryModel: QlModelDefinition = {
  name: "search.index_entry",
  description: "Inverted index entries for full-text search across authorized corpus and research models",
  tableName: "search_index_entry",
  ownerField: "owner_id",
  fields: {
    target_model: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    target_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    token: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    weight: {
      type: "integer",
      required: true,
      default: 1,
    },
    snippet: {
      type: "text",
      required: false,
    },
    owner_id: {
      type: "char",
      required: true,
      maxLength: 64,
      private: true,
    },
    edition_key: {
      type: "char",
      maxLength: 160,
      private: true,
    },
    locale: {
      type: "char",
      maxLength: 12,
      options: QURAN_LOCALES,
      validator: searchLocaleValidator,
      private: true,
    },
    surah: {
      type: "integer",
      minValue: SURAH_MIN,
      maxValue: SURAH_MAX,
      private: true,
    },
    ayah: {
      type: "integer",
      minValue: 1,
      maxValue: AYAH_MAX_BOUND,
      private: true,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
