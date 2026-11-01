import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface NavLinkProps {
  href: string;
  icon?: ReactNode;
  active?: boolean;
  children: ReactNode;
  className?: string;
  onClick?(event: MouseEvent<HTMLAnchorElement>): void;
}

/**
 * Sidebar / topbar navigation row. Consolidates the seven hand-rolled
 * `<Link className="ql-nav-link …"><Icon/>{label}</Link>` blocks that
 * used to live in every screen of `apps/web` (MW-ADR-020). The base
 * `ql-nav-link` class is always emitted; `active` adds `is-active` and
 * sets `aria-current="page"` so keyboard/screen-reader state stays
 * aligned with the visual state.
 *
 * Rendered as a plain component so it works from both Server and Client
 * boundaries. Consumers that pass `onClick` (e.g. to close the mobile
 * sidebar) invoke it from a Client Component; that is the caller's
 * concern, not this file's.
 */
export function NavLink({
  href,
  icon,
  active,
  children,
  className,
  onClick,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn("ql-nav-link", active && "is-active", className)}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      {icon}
      {children}
    </Link>
  );
}
