import type { QlModelDefinition } from "ql_orm";
import { AYAH_MAX_BOUND, SURAH_MAX, SURAH_MIN } from "../services/corpus-vocabulary.js";

export const corpusReciter: QlModelDefinition = {
  name: "corpus.reciter",
  labelKey: "web.models.entities.corpus_reciter",
  description: "Verified Quranic reciter metadata and rights certification.",
  descriptionKey: "web.models.descriptions.corpus_reciter",
  tableName: "corpus_reciter",
  fields: {
    slug: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 64,
    },
    name_translit: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    name_arabic: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    recitation_style: {
      type: "char",
      required: true,
      maxLength: 32,
      default: "murattal",
      options: ["murattal", "mujawwad", "tahfeedh"],
    },
    audio_base_url: {
      type: "char",
      required: true,
      maxLength: 512,
    },
    license_type: {
      type: "char",
      required: true,
      maxLength: 64,
      default: "public_domain",
    },
    is_active: {
      type: "boolean",
      required: true,
      default: true,
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

export const corpusAudioSegment: QlModelDefinition = {
  name: "corpus.audio_segment",
  labelKey: "web.models.entities.corpus_audio_segment",
  description: "Millisecond timestamp boundaries for ayah audio synchronization.",
  descriptionKey: "web.models.descriptions.corpus_audio_segment",
  tableName: "corpus_audio_segment",
  fields: {
    reciter_slug: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    surah_number: {
      type: "integer",
      required: true,
      minValue: SURAH_MIN,
      maxValue: SURAH_MAX,
    },
    ayah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      // Coarse bound only. Which verse numbers actually exist per surah is the
      // `SURAHS` table's job, enforced by `assertAyahWithinSurah`.
      maxValue: AYAH_MAX_BOUND,
    },
    start_ms: {
      type: "integer",
      required: true,
      minValue: 0,
    },
    end_ms: {
      type: "integer",
      required: true,
      minValue: 0,
    },
    audio_file_url: {
      type: "char",
      required: true,
      maxLength: 512,
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
