import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_ai",
  version: "1.0.0",
  category: "intelligence",
  description: "Provider model, gateway routing, dan pengaturan AI MoonWitness.",
  depends: ["ql_base"],
  models,
  access: [
    {
      model: "ai.provider",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "ai.provider",
      group: "admin",
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
