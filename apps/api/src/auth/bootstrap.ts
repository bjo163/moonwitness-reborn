import type { QlOrm } from "ql_orm";
import { countUsersWithRole } from "ql_auth/services/rbac";
import { normalizeEmail } from "./auth.js";

export interface BootstrapAdminSettings {
  email?: string;
  token?: string;
}

export function readBootstrapAdmin(
  env: Record<string, string | undefined>,
): BootstrapAdminSettings {
  const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const token = env.BOOTSTRAP_ADMIN_TOKEN?.trim();
  return {
    ...(email ? { email } : {}),
    ...(token ? { token } : {}),
  };
}

/**
 * The token is only a presence guard: BOOTSTRAP_ADMIN_EMAIL alone must never
 * hand out root when someone adds it to an environment by habit.
 */
export function bootstrapAdminConfigured(
  settings: BootstrapAdminSettings,
): boolean {
  return Boolean(settings.email && settings.token);
}

export async function shouldGrantSuperAdmin(
  orm: QlOrm,
  email: string,
  settings: BootstrapAdminSettings,
): Promise<boolean> {
  if (!bootstrapAdminConfigured(settings)) return false;
  if (normalizeEmail(settings.email ?? "") !== email) return false;
  return (await countUsersWithRole(orm, "super_admin")) === 0;
}
