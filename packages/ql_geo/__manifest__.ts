import type { QlAddonManifest } from "ql_orm";
import { countryData } from "./data/index.js";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_geo",
  version: "1.0.0",
  description: "Referensi geografis bersama, dimulai dari katalog negara.",
  depends: ["ql_base"],
  models,
  access: [
    {
      model: "res.country",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
  ],
  views,
  data: countryData,
};

export default manifest;
