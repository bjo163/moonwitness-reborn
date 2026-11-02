import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_attachment",
  version: "1.0.0",
  category: "system",
  description:
    "Lampiran milik pengguna dengan upload bertahap: metadata di basis data, byte di storage driver.",
  depends: ["ql_base", "ql_auth"],
  models,
  access: [
    {
      model: "ir.attachment",
      group: "user",
      read: true,
      // Users never assemble rows through generic CRUD; byte writes go through
      // the upload service, which scopes every statement by owner.
      write: false,
      create: false,
      unlink: true,
    },
  ],
  views,
  data: [],
};

export default manifest;
