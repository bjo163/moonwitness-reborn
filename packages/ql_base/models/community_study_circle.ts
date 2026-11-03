import type { QlModelDefinition } from "ql_orm";

export const communityStudyCircle: QlModelDefinition = {
  name: "community.study_circle",
  description: "Collaborative Harbor study circles for focused text study.",
  tableName: "community_study_circle",
  ownerField: "owner_id",
  fields: {
    title: {
      type: "char",
      required: true,
      maxLength: 255,
    },
    description: {
      type: "text",
      required: true,
    },
    surah_number: {
      type: "integer",
      required: true,
    },
    ayah_range: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    status: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ["active", "concluded", "archived"],
      default: "active",
    },
    max_members: {
      type: "integer",
      required: true,
      default: 12,
    },
    owner_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
  },
};
