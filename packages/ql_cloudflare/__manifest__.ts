import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

const manifest: QlAddonManifest = {
  name: "ql_cloudflare",
  version: "1.0.0",
  category: "integration",
  description: "Transport Cloudflare Zones dan DNS records beserta mirror-nya.",
  depends: ["ql_base", "ql_auth", "ql_integration"],
  models,
  access: [
    {
      model: "cloudflare.zone",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "cloudflare.record",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    // Track 21: Realtime Telemetry Orbit Monitor
    {
      model: "telemetry.metric_snapshot",
      group: "admin",
      read: true,
      write: false,
      create: true,
      unlink: false,
    },
    {
      model: "telemetry.metric_snapshot",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "telemetry.metric_snapshot",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "telemetry.metric_snapshot",
      group: "viewer",
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
