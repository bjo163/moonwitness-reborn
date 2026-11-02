import * as React from "react";

export interface MetricSparklineProps {
  dataPoints: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function MetricSparkline({
  dataPoints,
  color = "currentColor",
  width = 120,
  height = 32,
  className = "",
}: MetricSparklineProps): React.JSX.Element {
  if (!dataPoints || dataPoints.length === 0) {
    return <span className={`ql-metric-sparkline font-mono text-xs text-muted ${className}`}>-</span>;
  }

  const min = Math.min(...dataPoints);
  const max = Math.max(...dataPoints);
  const range = max - min || 1;
  const padding = 4;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const points = dataPoints
    .map((val, idx) => {
      const x = padding + (idx / Math.max(1, dataPoints.length - 1)) * drawWidth;
      const y = height - padding - ((val - min) / range) * drawHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      className={`ql-metric-sparkline overflow-visible text-acid ${className}`}
      aria-label="Metric sparkline trend"
      role="img"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export interface TelemetryMetricItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  status?: "nominal" | "degraded" | "warning";
  history?: number[];
}

export interface TelemetryOrbitWidgetProps {
  title?: string;
  subtitle?: string;
  coloNodeRegion?: string;
  edgeLatencyMs?: number;
  cacheHitRatio?: number;
  doWorkerState?: "active" | "standby" | "draining";
  metrics?: TelemetryMetricItem[];
  className?: string;
}

export function TelemetryOrbitWidget({
  title = "Telemetry Orbit Monitor",
  subtitle = "Cloudflare Edge & Durable Object Topology",
  coloNodeRegion = "SIN (Singapore Edge)",
  edgeLatencyMs = 24,
  cacheHitRatio = 0.94,
  doWorkerState = "active",
  metrics = [],
  className = "",
}: TelemetryOrbitWidgetProps): React.JSX.Element {
  return (
    <div
      className={`ql-telemetry-orbit-widget border border-hairline bg-panel p-6 shadow-hud-sm ${className}`}
    >
      <div className="flex flex-col gap-2 border-b border-hairline pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="ql-display text-lg font-semibold text-ink">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">{coloNodeRegion}</span>
          <span className="border border-hairline bg-panel-well px-2 py-0.5 font-mono text-[10px] uppercase text-acid">
            {doWorkerState}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="border border-hairline bg-panel-well p-3">
          <div className="text-xs text-muted">Edge Latency (p95)</div>
          <div className="mt-1 font-mono text-xl font-bold text-ink">
            {edgeLatencyMs} <span className="text-xs font-normal text-muted">ms</span>
          </div>
        </div>
        <div className="border border-hairline bg-panel-well p-3">
          <div className="text-xs text-muted">KV Cache Hit Ratio</div>
          <div className="mt-1 font-mono text-xl font-bold text-ink">
            {(cacheHitRatio * 100).toFixed(1)}{" "}
            <span className="text-xs font-normal text-muted">%</span>
          </div>
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="mt-4 space-y-2 pt-2 border-t border-hairline">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Realtime Vitals
          </div>
          <div className="space-y-1.5">
            {metrics.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between border border-hairline/60 bg-panel-deep px-3 py-1.5 text-xs"
              >
                <span className="font-medium text-ink-soft">{m.label}</span>
                <div className="flex items-center gap-3">
                  {m.history && m.history.length > 0 && (
                    <MetricSparkline dataPoints={m.history} width={80} height={20} />
                  )}
                  <span className="font-mono font-semibold text-ink">
                    {m.value} {m.unit || ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
