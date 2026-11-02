import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "cloudflare.zone.list",
    model: "cloudflare.zone",
    type: "list",
    fields: ["name", "status", "paused", "last_sync_at"],
  },
  {
    name: "cloudflare.zone.form",
    model: "cloudflare.zone",
    type: "form",
    fields: ["name", "status", "paused"],
  },
  {
    name: "cloudflare.record.list",
    model: "cloudflare.record",
    type: "list",
    fields: ["name", "type", "content", "ttl", "proxied", "comment"],
  },
  {
    name: "cloudflare.record.form",
    model: "cloudflare.record",
    type: "form",
    fields: ["name", "type", "content", "ttl", "proxied", "comment"],
  },
  {
    name: "telemetry.metric_snapshot.list",
    model: "telemetry.metric_snapshot",
    type: "list",
    fields: ["metric_key", "metric_value", "unit", "status", "recorded_at"],
  },
];
