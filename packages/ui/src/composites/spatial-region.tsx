import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface SpatialRegionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Authored spatial section for the 8 narrative movements of A-L-L-A-H.COM Home
 * and Headquarter regions. Replaces repetitive identical card boxes with
 * structured editorial space and intentional quiet margins.
 */
export function SpatialRegion({
  id,
  eyebrow,
  title,
  description,
  children,
  actions,
  className,
}: SpatialRegionProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={cn(
        "relative mx-auto w-full max-w-7xl border-t border-hairline px-5 py-16 md:px-10 md:py-24",
        className,
      )}
    >
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-acid-muted">
              {eyebrow}
            </p>
          )}
          <h2
            id={id ? `${id}-heading` : undefined}
            className="ql-display mt-2 text-3xl font-semibold tracking-wide text-ink md:text-5xl"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-base leading-relaxed text-ink-soft md:text-lg">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className="relative">{children}</div>
    </section>
  );
}
