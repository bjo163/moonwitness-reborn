import type { QlModelDefinition } from "ql_orm";
import { irModelData } from "./ir_model_data.js";
import { resPartner } from "./res_partner.js";
import { communityBeneficialDeed } from "./community_beneficial_deed.js";
import { communityStudyCircle } from "./community_study_circle.js";
import { communityCircleReflection } from "./community_circle_reflection.js";

export {
  irModelData,
  resPartner,
  communityBeneficialDeed,
  communityStudyCircle,
  communityCircleReflection,
};

export const models: QlModelDefinition[] = [
  irModelData,
  resPartner,
  communityBeneficialDeed,
  communityStudyCircle,
  communityCircleReflection,
];

