import type { QlModelDefinition } from "ql_orm";
import { resUsers } from "./res_users.js";
import { resSessions } from "./res_sessions.js";

import { resRole } from "./res_role.js";
import { resVerification } from "./res_verification.js";

export const models: QlModelDefinition[] = [
  resUsers,
  resSessions,
  resRole,
  resVerification,
];
