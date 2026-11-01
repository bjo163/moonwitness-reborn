import type { QlModelDefinition } from "ql_orm";
import { resUsers } from "./res_users.js";
import { resSessions } from "./res_sessions.js";

export const models: QlModelDefinition[] = [resUsers, resSessions];
