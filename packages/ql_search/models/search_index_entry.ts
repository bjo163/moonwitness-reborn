import type { QlModelDefinition } from "ql_orm";

/**
 * Search Index Entry Model — MW-0604 / MWREQ-01168..01184
 *
 * Stores search tokens mapped to target models and records.
 * Private fields and unauthorized domain content are strictly excluded during indexing.
 */
export const searchIndexEntryModel: QlModelDefinition = {
  name: "search.index_entry",
  label: "Search Index Entry",
  description: "Inverted index entries for full-text search across authorized corpus and research models",
  ownerField: "owner_id",
  fields: {
    id: {
      type: "char",
      label: "Entry ID",
      required: true,
      maxLength: 64,
    },
    target_model: {
      type: "char",
      label: "Target Model",
      required: true,
      maxLength: 64,
    },
    target_id: {
      type: "char",
      label: "Target Record ID",
      required: true,
      maxLength: 64,
    },
    token: {
      type: "char",
      label: "Search Token",
      required: true,
      maxLength: 128,
    },
    weight: {
      type: "integer",
      label: "Relevance Weight",
      required: true,
      defaultValue: 1,
    },
    snippet: {
      type: "text",
      label: "Context Snippet",
      required: false,
    },
    owner_id: {
      type: "char",
      label: "Owner ID",
      required: false,
      maxLength: 64,
    },
    created_at: {
      type: "datetime",
      label: "Created At",
      required: true,
    },
    updated_at: {
      type: "datetime",
      label: "Updated At",
      required: true,
    },
  },
};
