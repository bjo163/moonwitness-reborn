import type { QlModelDefinition } from "ql_orm";

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
