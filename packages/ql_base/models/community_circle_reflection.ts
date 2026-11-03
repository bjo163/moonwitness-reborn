import type { QlModelDefinition } from "ql_orm";

export const communityCircleReflection: QlModelDefinition = {
  name: "community.circle_reflection",
  description: "Peer reflections and notes within study circles.",
  tableName: "community_circle_reflection",
  ownerField: "author_id",
  fields: {
    circle_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    passage_locator: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    content: {
      type: "text",
      required: true,
    },
    evidence_reference: {
      type: "char",
      required: false,
      maxLength: 255,
    },
    moderation_status: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ["pending", "approved", "rejected"],
      default: "approved",
    },
    author_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
  },
};
