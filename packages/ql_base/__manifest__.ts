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
    // Track 19: Public Activity Ledger of Verified Beneficial Deeds (read-only for all)
    {
      model: "community.beneficial_deed",
      group: "viewer",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "community.beneficial_deed",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "community.beneficial_deed",
      group: "admin",
      read: true,
      write: false,
      create: true,
      unlink: false,
    },
    // Track 18: Collaborative Harbor Study Circles & Reflections
    {
      model: "community.study_circle",
      group: "viewer",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "community.study_circle",
      group: "user",
      read: true,
      write: false,
      create: true,
      unlink: false,
    },
    {
      model: "community.study_circle",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    {
      model: "community.circle_reflection",
      group: "viewer",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "community.circle_reflection",
      group: "user",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "community.circle_reflection",
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
