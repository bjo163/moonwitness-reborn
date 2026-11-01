import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";

const manifest: QlAddonManifest = {
  name: "ql_auth",
  version: "1.0.0",
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
  ],
  views: [
    {
      name: "res.users.list",
      model: "res.users",
      type: "list",
      fields: ["name", "email", "active"],
    },
  ],
};

export default manifest;
