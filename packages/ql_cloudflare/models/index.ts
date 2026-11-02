import type { QlModelDefinition } from "ql_orm";
import { cloudflareRecord } from "./cloudflare_record.js";
import { cloudflareZone } from "./cloudflare_zone.js";
import { telemetryMetricSnapshotModel } from "./telemetry_metric_snapshot.js";

export { cloudflareRecord, cloudflareZone, telemetryMetricSnapshotModel };

export const models: QlModelDefinition[] = [
  cloudflareZone,
  cloudflareRecord,
  telemetryMetricSnapshotModel,
];
