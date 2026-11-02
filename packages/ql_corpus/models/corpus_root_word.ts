import type { QlModelDefinition } from "ql_orm";

export const corpusRootWord: QlModelDefinition = {
  name: "corpus.root_word",
  description: "Indeks akar kata trilateral dan kuadrilateral bahasa Arab Quranik.",
  tableName: "corpus_root_word",
  fields: {
    root_arabic: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 16,
    },
    root_translit: {
      type: "char",
      required: true,
      maxLength: 32,
    },
    total_occurrences: {
      type: "integer",
      required: true,
      default: 0,
      minValue: 0,
    },
    meaning_id: {
      type: "char",
      required: true,
      maxLength: 255,
    },
    meaning_en: {
      type: "char",
      required: true,
      maxLength: 255,
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

export const corpusWordDerivation: QlModelDefinition = {
  name: "corpus.word_derivation",
  description: "Relasi derivasi morfologis akar kata, lema, dan ayat korpus.",
  tableName: "corpus_word_derivation",
  fields: {
    root_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
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
    word_index_in_ayah: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 150,
    },
    arabic_lemma: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    form_pattern: {
      type: "char",
      required: true,
      maxLength: 32,
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
