import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_base",
  version: "1.0.0",
  category: "system",
  description: "Model inti dan data kontak MoonWitness.",
  depends: [],
  models,
  access: [
    {
      model: "res.partner",
      group: "user",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
  ],
  views,
  data: [],
};

export default manifest;
