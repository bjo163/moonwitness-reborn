import type { MouseEvent, ReactNode } from "react";
import { cn } from "../lib/utils.js";
import { NavLink } from "./nav-link.js";

export interface SidebarNavItem {
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  /**
   * Called on click — used by the workspace screens to close the mobile
   * drawer. Optional, so a read-only nav list needs no handler.
   */
  onSelect?(event: MouseEvent<HTMLAnchorElement>): void;
}

export interface SidebarNavProps {
  /** Accessible name of the list; every sidebar nav is labelled. */
  label: string;
  items: readonly SidebarNavItem[];
  className?: string;
}

/**
 * The scrollable nav list inside a workspace sidebar. Replaces the
 * 39 hand-applied `ql-nav-link` anchors plus their per-screen spacing
 * variants (`mt-2`, `mt-4`, `space-y-1`, `flex-1 overflow-y-auto`) that
 * each `apps/web` screen had re-implemented (MW-ADR-020). Items are
 * rendered through `NavLink`, so `aria-current="page"` and the
 * `is-active` state stay consistent everywhere. Layout comes from
 * Tailwind tokens; only the rows themselves carry a `ql-*` class.
 */
export function SidebarNav({ label, items, className }: SidebarNavProps) {
  return (
    <nav
      className={cn("mt-6 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto", className)}
      aria-label={label}
    >
      {items.map(({ href, label: itemLabel, icon, active, onSelect }) => (
        <NavLink
          key={href}
          href={href}
          icon={icon}
          active={active}
          onClick={onSelect ? (event) => onSelect(event) : undefined}
        >
          {itemLabel}
        </NavLink>
      ))}
    </nav>
  );
}

export interface NavSectionLabelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Uppercase group heading between nav lists. The `.ql-nav-section` rule
 * existed in the design system without a component to own it, so screens
 * wrote the markup by hand.
 */
export function NavSectionLabel({ children, className }: NavSectionLabelProps) {
  return <div className={cn("ql-nav-section", className)}>{children}</div>;
}
