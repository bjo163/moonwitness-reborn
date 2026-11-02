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
  /** Draws the hairline separator. Defaults to `true`. */
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
        "ql-metric-row",
        divided && "ql-metric-row--divided",
        className,
      )}
    >
      <dt className="ql-metric-row__label">
        {label}
        {hasHint && <span className="ql-metric-row__hint">{hint}</span>}
      </dt>
      <dd className="ql-metric-row__value">{value}</dd>
    </div>
  );
}
