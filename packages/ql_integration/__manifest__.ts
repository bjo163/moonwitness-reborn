import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_integration",
  version: "1.0.0",
  category: "integration",
  description: "Registry konektor eksternal dan jejak audit aksi lintas layanan.",
  depends: ["ql_base", "ql_auth"],
  models,
  access: [
    {
      model: "integration.connector",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "integration.audit",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
  ],
  views,
  data: [],
};

export default manifest;
