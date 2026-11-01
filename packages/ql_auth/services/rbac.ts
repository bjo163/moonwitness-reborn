import type { QlOrm } from "ql_orm";

export interface QlRoleDefinition {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly groups: readonly string[];
  readonly assignable: boolean;
}

export const ROLE_MODEL = "res.role";
export const USER_MODEL = "res.users";

export const ROLE_CATALOG: readonly QlRoleDefinition[] = [
  {
    code: "super_admin",
    name: "Super Administrator",
    description: "Pemilik sistem; dapat menetapkan peran dan menghapus connector.",
    groups: ["user", "admin", "root", "connector", "operator", "viewer"],
    assignable: false,
  },
  {
    code: "admin",
    name: "Administrator",
    description: "Mengelola akun pengguna dan membaca jejak audit.",
    groups: ["user", "admin"],
    assignable: true,
  },
  {
    code: "integrations_manager",
    name: "Integrations Manager",
    description: "Membuat dan menghapus connector serta mengatur aksesnya.",
    groups: ["user", "connector"],
    assignable: true,
  },
  {
    code: "operator",
    name: "Operator",
    description: "Menjalankan sinkronisasi dan mengubah record DNS.",
    groups: ["user", "operator", "connector"],
    assignable: true,
  },
  {
    code: "member",
    name: "Member",
    description: "Pengguna biasa dengan data miliknya sendiri.",
    groups: ["user"],
    assignable: true,
  },
  {
    code: "viewer",
    name: "Viewer",
    description: "Hanya membaca.",
    groups: ["user", "viewer"],
    assignable: true,
  },
];

export const DEFAULT_ROLE = "member";
const LEAST_PRIVILEGE_GROUPS: readonly string[] = ["user"];

const roleGroups = new Map<string, readonly string[]>();
for (const role of ROLE_CATALOG) {
  roleGroups.set(role.code, role.groups);
}

export function roleCodes(): string[] {
  return ROLE_CATALOG.map((role) => role.code);
}

export function findRoleDefinition(code: string): QlRoleDefinition | undefined {
  return ROLE_CATALOG.find((role) => role.code === code);
}

export function isKnownRole(code: string): boolean {
  return ROLE_CATALOG.some((role) => role.code === code);
}

export function isAssignableRole(code: string): boolean {
  return findRoleDefinition(code)?.assignable === true;
}

export function groupsForRole(code: string | undefined): string[] {
  if (!code) return [...LEAST_PRIVILEGE_GROUPS];
  return [...(roleGroups.get(code) ?? LEAST_PRIVILEGE_GROUPS)];
}

/**
 * The compiled catalog is the source of truth: `groups` is the security
 * boundary, so changing one stays a code edit covered by tests, and boot
 * repairs rows that an older catalog left behind.
 */
export async function seedRoles(orm: QlOrm): Promise<void> {
  for (const role of ROLE_CATALOG) {
    const values = {
      name: role.name,
      description: role.description,
      groups: role.groups.join(","),
      assignable: role.assignable,
    };
    const existing = await orm.findOneByService(ROLE_MODEL, { code: role.code });
    if (existing) {
      await orm.updateRecordsForService(ROLE_MODEL, { code: role.code }, values);
      continue;
    }
    await orm.createRecordForService(ROLE_MODEL, { code: role.code, ...values });
  }
}

export async function countUsersWithRole(
  orm: QlOrm,
  code: string,
): Promise<number> {
  const rows = await orm.findManyByService(
    USER_MODEL,
    { role: code, active: true },
    { limit: 500 },
  );
  return rows.length;
}
