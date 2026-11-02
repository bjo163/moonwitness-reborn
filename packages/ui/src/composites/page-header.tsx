import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Standard workspace page header — eyebrow, H1, description paragraph,
 * optional right-aligned actions. Replaces the two-plus copies of
 * `<header className="border-b border-[#354135] pb-6"><h1
 * className="text-3xl font-semibold tracking-[-0.04em]">…</h1>…</header>`
 * (MW-ADR-020). Border colour comes from the `border-hairline` token, and the
 * eyebrow is the package's own `.ql-eyebrow` rule — the same one `SidePanel`
 * uses — so there is one eyebrow shape rather than a utility copy.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="ql-eyebrow">{eyebrow}</div>}
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
