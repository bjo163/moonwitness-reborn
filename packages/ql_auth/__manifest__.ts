import type { QlAddonManifest } from "ql_orm";
import { ROLE_CATALOG } from "./services/rbac.js";
import { models } from "./models/index.js";

const manifest: QlAddonManifest = {
  name: "ql_auth",
  version: "1.0.0",
  category: "system",
  description: "Akun pengguna dan autentikasi sesi.",
  depends: ["ql_base"],
  models,
  access: [
    {
      model: "res.users",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    {
      model: "res.sessions",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    {
      model: "res.role",
      group: "admin",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "res.role",
      group: "root",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
  ],
  views: [
    {
      name: "res.users.list",
      model: "res.users",
      type: "list",
      fields: ["name", "email", "preferred_locale", "active"],
    },
    {
      name: "res.role.list",
      model: "res.role",
      type: "list",
      fields: ["code", "name", "description", "assignable"],
    },
    {
      name: "res.role.form",
      model: "res.role",
      type: "form",
      fields: ["code", "name", "description", "groups", "assignable"],
    },
  ],
  data: ROLE_CATALOG.map((role) => ({
    id: `role_${role.code}`,
    model: "res.role",
    key: { field: "code", value: role.code },
    values: {
      code: role.code,
      name: role.name,
      description: role.description,
      groups: role.groups.join(","),
      assignable: role.assignable,
    },
    updatePolicy: "reconcile",
  })),
};

export default manifest;
