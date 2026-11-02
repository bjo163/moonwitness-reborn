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
 * `is-active` state stay consistent everywhere. The list shape itself is
 * defined once in `.ql-sidebar-nav` in the package stylesheet; the top margin
 * stays a utility so a caller can place the list under a section label without
 * fighting the rule.
 */
export function SidebarNav({ label, items, className }: SidebarNavProps) {
  return (
    <nav
      className={cn("ql-sidebar-nav mt-6", className)}
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

export interface OptionNavProps {
  /** Accessible name of the list; every sidebar nav is labelled. */
  label: string;
  /** Rows supplied by the screen — normally `ListOption variant="nav"`. */
  children: ReactNode;
  className?: string;
}

/**
 * The same scrollable nav shell as `SidebarNav`, for the sidebar lists whose
 * rows are selectable options rather than links (model picker, DNS zone list,
 * chat history). Those screens had to hand-apply `className="ql-sidebar-nav"`
 * to get the shared shape, which is the markup-level drift MW-0576 closes:
 * the list geometry now has one owner in the package stylesheet, and callers
 * only bring rows. No top margin here, because these lists follow a
 * `NavSectionLabel`, which already carries the section spacing.
 */
export function OptionNav({ label, children, className }: OptionNavProps) {
  return (
    <nav className={cn("ql-sidebar-nav", className)} aria-label={label}>
      {children}
    </nav>
  );
}

/**
 * Uppercase group heading between nav lists. The `.ql-nav-section` rule
 * existed in the design system without a component to own it, so screens
 * wrote the markup by hand.
 */
export function NavSectionLabel({ children, className }: NavSectionLabelProps) {
  return <div className={cn("ql-nav-section", className)}>{children}</div>;
}
