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
 * own spacing and colour. It is a `Card` surface by class (`ql-card`: hairline
 * border, `--color-panel`, hard offset shadow, square corners) so an empty
 * state cannot look like a different design language from the panel it sits in.
 * Colour comes from the design-system tokens (MW-ADR-020).
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
        "ql-card flex flex-col items-center gap-3 p-8 text-center",
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
