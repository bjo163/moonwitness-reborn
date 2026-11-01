import type { QlOrm } from "ql_orm";
import { countUsersWithRole } from "ql_auth/services/rbac";

export async function firstUseSetupRequired(orm: QlOrm): Promise<boolean> {
  return (await countUsersWithRole(orm, "super_admin")) === 0;
}
