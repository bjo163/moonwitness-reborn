import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_i18n",
  version: "1.0.0",
  description: "Katalog bahasa, terjemahan UI, dan alur review.",
  depends: ["ql_base", "ql_auth"],
  models,
  access: [
    {
      model: "i18n.language",
      group: "admin",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "i18n.translation",
      group: "admin",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
  ],
  views,
};

export default manifest;
