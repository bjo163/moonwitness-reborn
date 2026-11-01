import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface MetricListProps {
  children: ReactNode;
  className?: string;
}

/**
 * Definition-list wrapper for the "label … value" rows that every
 * workspace screen re-implemented as
 * `<div className="flex items-baseline justify-between gap-3 border-b border-[#354135] py-4 sm:border-b-0">`
 * (11 copies across dashboard, landing, and connectors). Pair with
 * `MetricRow`; the `<dl>` element keeps the pairing machine-readable for
 * assistive technology (MW-ADR-020).
 */
export function MetricList({ children, className }: MetricListProps) {
  return <dl className={cn(className)}>{children}</dl>;
}

export interface MetricRowProps {
  label: ReactNode;
  value: ReactNode;
  /** Secondary line under the label, e.g. a unit or a timestamp. */
  hint?: ReactNode;
  /** Draws the hairline separator on wide viewports. Defaults to `true`. */
  divided?: boolean;
  className?: string;
}

export function MetricRow({
  label,
  value,
  hint,
  divided = true,
  className,
}: MetricRowProps) {
  const hasHint = hint !== undefined && hint !== null;
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 py-4",
        divided && "border-b border-hairline sm:border-b-0",
        className,
      )}
    >
      <dt className="min-w-0 text-sm text-ink-soft">
        {label}
        {hasHint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      </dt>
      <dd className="text-lg font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
