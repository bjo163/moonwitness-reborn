import type { QlModelDefinition } from "ql_orm";
import { irModelData } from "./ir_model_data.js";
import { resPartner } from "./res_partner.js";

export const models: QlModelDefinition[] = [irModelData, resPartner];
