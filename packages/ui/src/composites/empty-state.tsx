import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Standard "no data yet / nothing matches" surface. Consolidates the
 * per-screen empty-state blocks (`workflow.empty`, `corpus-shelf
 * "No published editions yet"`, etc.) that previously each picked their
 * own spacing and colour. Colour comes from the design-system tokens
 * (`text-muted`, `border-hairline`), so the message reads consistently
 * across every workspace (MW-ADR-020).
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-hairline bg-panel p-8 text-center",
        className,
      )}
    >
      {icon && (
        <span className="text-acid-dark" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="max-w-md text-sm leading-6 text-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </section>
  );
}
