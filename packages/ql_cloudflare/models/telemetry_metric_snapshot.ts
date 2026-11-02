import type { QlModelDefinition } from "ql_orm";

export const METRIC_STATUSES = ["healthy", "degraded", "critical"] as const;

export const telemetryMetricSnapshotModel: QlModelDefinition = {
  name: "telemetry.metric_snapshot",
  tableName: "telemetry_metric_snapshot",
  description: "Periodic operational metric snapshot recorded by system services.",
  fields: {
    metric_key: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    metric_value: {
      type: "integer",
      required: true,
      minValue: 0,
      maxValue: 2147483647,
    },
    unit: {
      type: "char",
      required: true,
      maxLength: 16,
      default: "ms",
    },
    status: {
      type: "char",
      required: true,
      maxLength: 16,
      options: METRIC_STATUSES,
      default: "healthy",
    },
    datacenter_region: {
      type: "char",
      required: true,
      maxLength: 32,
      default: "sin01",
    },
    metadata_json: {
      type: "text",
      required: false,
      maxLength: 4000,
    },
    recorded_at: {
      type: "datetime",
      required: true,
    },
  },
};
