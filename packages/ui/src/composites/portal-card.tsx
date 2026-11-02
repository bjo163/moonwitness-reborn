import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface PortalCardProps {
  href: string;
  title: string;
  description: string;
  icon?: ReactNode;
  /** Trailing glyph, usually a chevron. Left to the caller to keep the package icon-free. */
  arrow?: ReactNode;
  /** Short status text read after the description, e.g. "Proposed". */
  status?: string;
  className?: string;
}

/**
 * Entry card for one ecosystem gateway. The whole card is a single link whose
 * accessible name is the title, followed by the description and optional status.
 */
export function PortalCard({
  href,
  title,
  description,
  icon,
  arrow,
  status,
  className,
}: PortalCardProps) {
  return (
    <Link href={href} className={cn("ql-portal-card", className)}>
      {icon && <span aria-hidden="true" className="ql-portal-card__icon">{icon}</span>}
      <span className="ql-portal-card__body">
        <span className="ql-portal-card__title">{title}</span>
        <span className="ql-portal-card__description">
          {description}
          {status ? ` (${status})` : ""}
        </span>
      </span>
      {arrow && <span aria-hidden="true" className="ql-portal-card__arrow">{arrow}</span>}
    </Link>
  );
}
