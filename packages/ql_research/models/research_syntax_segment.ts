import type { QlModelDefinition } from "ql_orm";

export const researchSyntaxSegment: QlModelDefinition = {
  name: "research.syntax_segment",
  description: "Segment linguistik Quranik, pohon sintaksis dependensi, dan infleksi I'rab.",
  tableName: "research_syntax_segment",
  fields: {
    passage_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    surah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 114,
    },
    ayah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 286,
    },
    word_index: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 150,
    },
    segment_index: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 10,
    },
    arabic_text: {
      type: "char",
      required: true,
      maxLength: 32,
    },
    pos_tag: {
      type: "char",
      required: true,
      maxLength: 16,
    },
    grammatical_case: {
      type: "char",
      required: true,
      maxLength: 16,
      options: ["marfu", "mansub", "majrur", "majzum", "mabni"],
    },
    irab_explanation_id: {
      type: "char",
      required: true,
      maxLength: 500,
    },
    irab_explanation_en: {
      type: "char",
      required: true,
      maxLength: 500,
    },
    dependency_relation: {
      type: "char",
      required: false,
      maxLength: 32,
    },
  },
};
