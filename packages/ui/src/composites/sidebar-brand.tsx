import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";
import { IconTile } from "./icon-tile.js";

export interface SidebarBrandProps {
  href?: string;
  label?: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * Sidebar brand mark + wordmark. Replaces the seven copies of
 * `<Link><span className="flex size-8 …border-[#354135] bg-[#121a13]
 * text-[#d7ff63]"><Sparkles/></span>MoonWitness</Link>` that lived in
 * every workspace screen (MW-ADR-020). Colour values come from
 * design-system tokens (`border-hairline`, `bg-panel-edge`, `text-acid`),
 * not from inline hex classes.
 *
 * The `icon` prop is intentionally left without a default so this
 * package stays free of a hard `lucide-react` peerDependency; callers
 * pass whatever brand glyph matches their context (e.g. `<Sparkles/>`).
 */
export function SidebarBrand({
  href = "/command-center",
  label = "MoonWitness",
  icon,
  className,
}: SidebarBrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        "ql-hud-brand flex items-center gap-2.5 font-semibold tracking-tight",
        className,
      )}
    >
      {icon && <IconTile size="sm">{icon}</IconTile>}
      {label}
    </Link>
  );
}
