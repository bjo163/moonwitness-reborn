import type { QlModelDefinition } from "ql_orm";

export const searchSemanticEdge: QlModelDefinition = {
  name: "search.semantic_edge",
  labelKey: "web.models.entities.search_semantic_edge",
  description: "Cross-surah semantic edge linking thematic nodes with passage evidence.",
  descriptionKey: "web.models.descriptions.search_semantic_edge",
  tableName: "search_semantic_edge",
  fields: {
    source_node_slug: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    target_node_slug: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    relation_type: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ["chronological", "thematic_echo", "contrast", "elaboration"],
    },
    weight: {
      type: "integer",
      required: true,
      default: 1,
      minValue: 1,
      maxValue: 100,
    },
    evidence_payload: {
      type: "text",
      required: true,
      maxLength: 4000,
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
