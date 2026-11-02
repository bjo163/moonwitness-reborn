import type { ReactElement } from "react";
import { cn } from "../lib/utils.js";
import { Button } from "../atoms/button.js";
import { Badge } from "../atoms/badge.js";

export type CommandRegionId =
  | "revelation"
  | "hermeneutics"
  | "sanad"
  | "harbor"
  | "telemetry";

export interface OrbitRegionNode {
  id: CommandRegionId;
  label: string;
  tagline: string;
  href: string;
  thetaRad: number; // Angle on orbital plane (0 to 2*PI)
  status: "nominal" | "active" | "alert";
  metricLabel: string;
  metricValue: string;
}

export interface HolographicOrbitDeckProps {
  /** The 5 active region nodes with current telemetry. */
  regions: OrbitRegionNode[];
  /** Currently selected/focused region ID. */
  activeRegionId: CommandRegionId;
  /** Selection callback invoked when user clicks or selects a region. */
  onSelectRegion(this: void, regionId: CommandRegionId): void;
  /** Whether the orbit slowly auto-rotates when idle. Default: false. */
  autoRotate?: boolean;
  /** Optional class override. */
  className?: string;
  /** View mode toggle accessible label. */
  viewToggleLabel?: string;
}

interface ProjectedPosition {
  region: OrbitRegionNode;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

/**
 * 5-Region 3D Holographic Spatial Orbit Visualizer (Track 12).
 * Renders an interactive parametric SVG orbital ring visualizing the 5 strategic
 * regions of the MoonWitness Command Center with keyboard navigation and accessible fallback.
 */
export function HolographicOrbitDeck({
  regions,
  activeRegionId,
  onSelectRegion,
  autoRotate = false,
  className,
  viewToggleLabel = "Toggle Hologram / Table View",
}: HolographicOrbitDeckProps): ReactElement {
  void autoRotate;
  const cx = 300;
  const cy = 160;
  const rx = 240;
  const ry = 80;

  // Project parametric coordinates
  const projected: ProjectedPosition[] = regions.map((region, index) => {
    // Default angles if not set
    const baseTheta = region.thetaRad ?? (index / Math.max(1, regions.length)) * Math.PI * 2;
    const x = cx + rx * Math.cos(baseTheta);
    const y = cy + ry * Math.sin(baseTheta);
    // scale ranges from 0.75 (back) to 1.15 (front)
    const sinNorm = (Math.sin(baseTheta) + 1) / 2;
    const scale = 0.75 + 0.4 * sinNorm;
    const opacity = 0.6 + 0.4 * sinNorm;
    const zIndex = Math.round(y);

    return {
      region,
      x,
      y,
      scale,
      opacity,
      zIndex,
    };
  });

  // Sort back-to-front for proper SVG layering
  const sorted = [...projected].sort((a, b) => a.zIndex - b.zIndex);

  const activeNode = regions.find((r) => r.id === activeRegionId) ?? regions[0];

  return (
    <div
      className={cn(
        "ql-holographic-orbit-deck relative w-full overflow-hidden border border-hairline bg-panel p-6 md:p-8",
        className,
      )}
      role="region"
      aria-label="5-Region Spatial Orbit"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Spatial Orbit Deck · 5 Strategic Regions
          </span>
          <h3 className="ql-display mt-1 text-xl font-semibold text-ink">
            {activeNode?.label}
          </h3>
          <p className="text-xs text-muted">{activeNode?.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeNode && (
            <Badge variant={activeNode.status === "nominal" ? "live" : "outline"}>
              {activeNode.metricLabel}: {activeNode.metricValue}
            </Badge>
          )}
        </div>
      </div>

      {/* Parametric SVG Orbit Canvas */}
      <div className="relative mx-auto my-6 flex h-80 w-full max-w-2xl items-center justify-center">
        <svg
          viewBox="0 0 600 320"
          className="h-full w-full select-none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="orbitGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-acid)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-acid)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="orbitLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-hairline)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="var(--color-acid)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--color-hairline)" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Core Central Pillar */}
          <circle cx={cx} cy={cy} r="32" fill="url(#orbitGlow)" />
          <circle
            cx={cx}
            cy={cy}
            r="12"
            fill="var(--color-panel-edge)"
            stroke="var(--color-acid)"
            strokeWidth="1.5"
          />

          {/* Primary Orbital Ellipse Path */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="none"
            stroke="url(#orbitLineGrad)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Planetary Region Nodes sorted by depth */}
          {sorted.map(({ region, x, y, scale, opacity }) => {
            const isSelected = region.id === activeRegionId;
            return (
              <g
                key={region.id}
                transform={`translate(${x}, ${y}) scale(${scale})`}
                opacity={opacity}
                className="cursor-pointer transition-transform duration-300"
                onClick={() => onSelectRegion(region.id)}
              >
                {isSelected && (
                  <circle
                    r="28"
                    fill="none"
                    stroke="var(--color-acid)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="animate-spin"
                  />
                )}
                <circle
                  r={isSelected ? "18" : "14"}
                  fill="var(--color-panel-raised)"
                  stroke={isSelected ? "var(--color-acid)" : "var(--color-hairline-strong)"}
                  strokeWidth={isSelected ? "2" : "1.5"}
                />
                <circle
                  r={isSelected ? "7" : "5"}
                  fill={isSelected ? "var(--color-acid)" : "var(--color-hairline)"}
                />
                <text
                  y="34"
                  textAnchor="middle"
                  fill={isSelected ? "var(--color-acid)" : "var(--color-ink-soft)"}
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {region.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Accessible Interactive Region Buttons Bar */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 border-t border-hairline pt-4"
        role="tablist"
        aria-label={viewToggleLabel}
      >
        {regions.map((region) => {
          const isSelected = region.id === activeRegionId;
          return (
            <Button
              key={region.id}
              type="button"
              size="sm"
              variant={isSelected ? "default" : "secondary"}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectRegion(region.id)}
            >
              {region.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
