import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface SanctuaryHeaderProps {
  /** Section kicker / eyebrow (e.g., Movement number or Category) */
  eyebrow?: ReactNode;
  /** Primary title of the sanctuary or archive view */
  title: ReactNode;
  /** Explanatory description */
  description?: ReactNode;
  /** Optional action slot (e.g., buttons, filters) */
  actions?: ReactNode;
  /** Optional class override */
  className?: string;
}

/**
 * Atmospheric header for sanctum views (Corpus Shelf, Reader, Community Harbor).
 * Displays gold accent borders, cosmic depth, and structured metadata.
 */
export function SanctuaryHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: SanctuaryHeaderProps) {
  return (
    <div
      className={cn(
        "relative border-b border-hairline bg-panel-edge/60 px-5 py-8 md:px-10 md:py-12",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <div className="ql-eyebrow text-xs tracking-[0.2em] text-acid uppercase mb-2">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft md:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
