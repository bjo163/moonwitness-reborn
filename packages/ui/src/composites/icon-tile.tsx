import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

/**
 * Squared brand/section glyph used in sidebars, list rows, and empty
 * surfaces. Consolidates the 13 copies of
 * `<span className="flex size-8 … border-[#354135] bg-[#121a13] text-[#d7ff63]">`
 * and the 4 light-theme copies of `bg-stone-900 text-white` that lived
 * across `apps/web` screens (MW-ADR-020). Every colour resolves to a
 * design token, so retinting the HUD never touches a screen.
 */
const iconTileVariants = cva(
  "flex shrink-0 items-center justify-center rounded-xl border",
  {
    variants: {
      size: {
        sm: "size-8",
        md: "size-10",
        lg: "size-14 border-hairline-strong shadow-hud-sm",
      },
      tone: {
        accent: "border-hairline bg-panel-edge text-acid",
        plain: "border-hairline bg-panel text-ink-soft",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "accent",
    },
  },
);

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
