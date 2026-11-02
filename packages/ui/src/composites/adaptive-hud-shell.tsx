import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { cn } from "../lib/utils.js";

export type SpatialDensityTier =
  | "compact"
  | "tablet"
  | "dual"
  | "trio"
  | "panoramic";

export interface HudPaneDefinition {
  id: string;
  title: string;
  minWidthPx: number;
  priority: 1 | 2 | 3 | 4; // 1 = highest priority (never hidden)
  content: ReactNode;
}

export interface AdaptiveHudShellProps {
  /** Array of available HUD panes ordered by spatial hierarchy. */
  panes: HudPaneDefinition[];
  /** Override density mode. If "auto", determined by viewport measurement. */
  densityMode?: "auto" | SpatialDensityTier;
  /** Active pane IDs for mobile/tablet collapsed views. */
  activePaneId?: string;
  /** Callback fired when the active spatial density tier transitions. */
  onDensityChange?(this: void, nextTier: SpatialDensityTier): void;
  /** Class override. */
  className?: string;
}

function resolveTier(width: number): SpatialDensityTier {
  if (width < 640) return "compact";
  if (width < 1024) return "tablet";
  if (width < 1440) return "dual";
  if (width < 2560) return "trio";
  return "panoramic";
}

/**
 * Adaptive Spatial Density Engine (Track 15).
 * Fluidly scales layout pane topology from mobile (360px) to ultrawide 4K (3840px)
 * without horizontal overflow while clamping reading column measure to <= 65ch.
 */
export function AdaptiveHudShell({
  panes,
  densityMode = "auto",
  activePaneId,
  onDensityChange,
  className,
}: AdaptiveHudShellProps): ReactElement {
  const [detectedTier, setDetectedTier] = useState<SpatialDensityTier>("dual");

  useEffect(() => {
    if (densityMode !== "auto") {
      setDetectedTier(densityMode);
      return;
    }

    const checkWidth = () => {
      const w = window.innerWidth;
      const tier = resolveTier(w);
      setDetectedTier((prev) => {
        if (prev !== tier) {
          onDensityChange?.(tier);
          return tier;
        }
        return prev;
      });
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, [densityMode, onDensityChange]);

  const activeTier = densityMode === "auto" ? detectedTier : densityMode;

  // Decide which panes are visible based on density tier
  let maxPanes = 2;
  if (activeTier === "compact") maxPanes = 1;
  else if (activeTier === "tablet") maxPanes = 1;
  else if (activeTier === "dual") maxPanes = 2;
  else if (activeTier === "trio") maxPanes = 3;
  else if (activeTier === "panoramic") maxPanes = 4;

  const sortedPanes = [...panes].sort((a, b) => a.priority - b.priority);
  const visiblePanes =
    activeTier === "compact" || activeTier === "tablet"
      ? sortedPanes.filter((p) => (activePaneId ? p.id === activePaneId : p.priority === 1))
      : sortedPanes.slice(0, maxPanes);

  return (
    <div
      className={cn(
        "ql-adaptive-hud-shell w-full overflow-x-hidden",
        `ql-density--${activeTier}`,
        className,
      )}
      data-density-tier={activeTier}
    >
      <div
        className={cn(
          "grid w-full gap-6",
          activeTier === "compact" && "grid-cols-1",
          activeTier === "tablet" && "grid-cols-1",
          activeTier === "dual" && "grid-cols-1 lg:grid-cols-2",
          activeTier === "trio" && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
          activeTier === "panoramic" && "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {visiblePanes.map((pane) => (
          <div
            key={pane.id}
            data-pane-id={pane.id}
            className="ql-hud-pane flex flex-col min-w-0 max-w-full overflow-y-auto"
          >
            <div className="mx-auto w-full max-w-3xl">
              {pane.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
