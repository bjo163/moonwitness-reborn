import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";

const manifest: QlAddonManifest = {
  name: "ql_search",
  version: "1.0.0",
  category: "intelligence",
  description: "Search indexing and query capabilities across authorized corpus and research models.",
  depends: ["ql_base", "ql_auth", "ql_corpus", "ql_research"],
  models,
  access: [
    {
      model: "search.index_entry",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "search.index_entry",
      group: "operator",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    {
      model: "search.index_entry",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
  ],
  views: [],
  data: [],
};

export default manifest;
