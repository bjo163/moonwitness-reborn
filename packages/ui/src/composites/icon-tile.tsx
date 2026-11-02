import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

/**
 * Squared brand/section glyph used in sidebars, list rows, and empty
 * surfaces. Consolidates the 13 copies of
 * `<span className="flex size-8 … border-[#354135] bg-[#121a13] text-[#d7ff63]">`
 * and the 4 light-theme copies of `bg-stone-900 text-white` that lived
 * across `apps/web` screens (MW-ADR-020). The shape and its colours are
 * defined once in `.ql-icon-tile` (`packages/ui/styles/components.css`), so no
 * screen or component can restate a size or a colour independently.
 */
const iconTileVariants = cva("ql-icon-tile", {
  variants: {
    size: {
      sm: "ql-icon-tile--sm",
      md: undefined,
      lg: "ql-icon-tile--lg",
    },
    tone: {
      accent: undefined,
      plain: "ql-icon-tile--plain",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "accent",
  },
});

export interface IconTileProps
  extends VariantProps<typeof iconTileVariants> {
  children: ReactNode;
  className?: string;
}

export function IconTile({ children, size, tone, className }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(iconTileVariants({ size, tone }), className)}
    >
      {children}
    </span>
  );
}
