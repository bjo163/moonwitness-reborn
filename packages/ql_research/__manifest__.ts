import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_research",
  version: "1.0.0",
  description:
    "Versioned research assessments, witness statements, and story narratives, separate from corpus source text.",
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
    // witness.statement — MW-1224
    {
      model: "witness.statement",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "witness.statement",
      group: "operator",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "witness.statement",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    // story.narrative — MW-1225
    {
      model: "story.narrative",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "story.narrative",
      group: "operator",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "story.narrative",
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
