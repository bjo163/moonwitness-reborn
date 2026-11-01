import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_research",
  version: "1.0.0",
  description:
    "Versioned research assessments and human review, separate from corpus source text and computed candidates.",
  depends: ["ql_base", "ql_auth", "ql_source", "ql_corpus"],
  models,
  access: [
    {
      model: "research.lexical_review",
      group: "admin",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "research.lexical_review",
      group: "operator",
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
