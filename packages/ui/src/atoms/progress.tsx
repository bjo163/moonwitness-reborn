import type { CSSProperties } from "react";
import { cn } from "../lib/utils.js";

export interface ProgressProps {
  /** Amount of the real work already acknowledged, on the caller's own scale. */
  value: number;
  max?: number;
  indeterminate?: boolean;
  /**
   * Screen-reader rendering of the number. Supplied by the caller because the
   * unit wording belongs to the screen, not to the primitive.
   */
  valueText?: string;
  labelledBy?: string;
  className?: string;
}

/**
 * The fill width is carried in a CSS custom property so a screen never needs an
 * inline style to drive it, which MW-ADR-020 forbids in apps/web.
 */
export function Progress({
  value,
  max = 100,
  indeterminate = false,
  valueText,
  labelledBy,
  className,
}: ProgressProps) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const style = {
    "--ql-progress-value": `${(ratio * 100).toFixed(2)}%`,
  } as CSSProperties;
  return (
    <div
      aria-labelledby={labelledBy}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={indeterminate ? undefined : Math.round(ratio * max)}
      aria-valuetext={valueText}
      className={cn(
        "ql-progress",
        indeterminate ? "is-indeterminate" : undefined,
        className,
      )}
      role="progressbar"
      style={style}
    >
      <span className="ql-progress__fill" />
    </div>
  );
}
