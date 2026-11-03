import type { QlModelDefinition } from "ql_orm";

export const searchThematicNode: QlModelDefinition = {
  name: "search.thematic_node",
  labelKey: "web.models.entities.search_thematic_node",
  description: "Knowledge graph entity node representing themes, figures, and concepts.",
  descriptionKey: "web.models.descriptions.search_thematic_node",
  tableName: "search_thematic_node",
  fields: {
    slug: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 64,
    },
    title_id: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    title_en: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    category: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ["concept", "surah", "prophet_narrative", "legal_ruling"],
    },
    passage_count: {
      type: "integer",
      required: true,
      default: 0,
      minValue: 0,
      maxValue: 10000,
    },
  },
};
