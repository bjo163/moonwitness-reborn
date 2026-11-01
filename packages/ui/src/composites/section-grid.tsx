import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface SectionGridProps {
  children: ReactNode;
  /** Number of columns at the `md` breakpoint. Defaults to 2. */
  columns?: 1 | 2 | 3;
  /** Vertical gap; defaults to 1.5rem (Tailwind `gap-6`). */
  gap?: 4 | 6 | 8;
  className?: string;
}

const columnClass: Record<1 | 2 | 3, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
};

const gapClass: Record<4 | 6 | 8, string> = {
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
};

/**
 * Responsive card grid used by every "list of cards" surface (corpus
 * shelf, connector list, review queue detail panel). Replaces the
 * `<div className="grid gap-4 md:grid-cols-2">` blocks that were
 * copy-pasted across screens (MW-ADR-020). The single-column mobile
 * layout is the default; `columns` selects the `md:` breakpoint value.
 */
export function SectionGrid({
  children,
  columns = 2,
  gap = 4,
  className,
}: SectionGridProps) {
  return (
    <div className={cn("grid grid-cols-1", gapClass[gap], columnClass[columns], className)}>
      {children}
    </div>
  );
}
