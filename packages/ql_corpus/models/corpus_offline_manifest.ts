import type { QlModelDefinition } from "ql_orm";

export const corpusOfflineManifestModel: QlModelDefinition = {
  name: "corpus.offline_manifest",
  tableName: "corpus_offline_manifest",
  description: "Predefined offline download packages for full Surah corpus packs.",
  fields: {
    edition_key: {
      type: "char",
      required: true,
      maxLength: 64,
      unique: true,
    },
    version_tag: {
      type: "char",
      required: true,
      maxLength: 32,
    },
    total_surahs: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 114,
      default: 114,
    },
    total_bytes: {
      type: "integer",
      required: true,
      minValue: 0,
      maxValue: 52428800, // 50 MB max
    },
    download_url: {
      type: "char",
      required: true,
      maxLength: 256,
    },
    sha256_checksum: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    is_active: {
      type: "boolean",
      required: true,
      default: true,
    },
  },
};
