import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_chat",
  version: "1.0.0",
  description: "Percakapan dan pesan pengguna.",
  depends: ["ql_auth"],
  models,
  access: [
    {
      model: "chat.conversation",
      group: "user",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    {
      model: "chat.message",
      group: "user",
      read: false,
      write: false,
      create: false,
      unlink: false,
    },
  ],
  views,
};

export default manifest;
