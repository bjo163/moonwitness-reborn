import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../atoms/button.js";
import { SidebarBrand } from "./sidebar-brand.js";
import { SidebarFooter } from "./sidebar-footer.js";
import { SidebarNav, type SidebarNavItem } from "./sidebar-nav.js";

export interface SidebarIdentity {
  name: ReactNode;
  /** Role, email, or any secondary detail shown under the name. */
  subtitle?: ReactNode;
}

export interface SidebarLogout {
  label: string;
  onLogout(): void;
  icon?: ReactNode;
}

export interface WorkspaceSidebarProps {
  /** Accessible name of the main navigation list. */
  navLabel: string;
  items: readonly SidebarNavItem[];
  closeLabel: string;
  onCloseSidebar(): void;
  brandIcon?: ReactNode;
  brandLabel?: string;
  brandHref?: string;
  identity?: SidebarIdentity;
  logout?: SidebarLogout;
  /**
   * Extra blocks under the main nav — a second `SidebarNav` for a zone or
   * history list, or `NavSectionLabel` groups. Rendered above the footer.
   */
  children?: ReactNode;
  className?: string;
}

/**
 * The whole workspace sidebar: brand row with the mobile close control, the
 * main navigation list, any extra sections, and the identity/logout footer.
 *
 * Every one of the eight `apps/web` workspaces re-assembled these four parts
 * by hand — the `<div className="flex h-12 …">` brand row 8×, `ql-nav-link`
 * anchors 36×, and the identity footer 4× — so the sidebar shape drifted
 * between screens. Composing it here keeps one definition (MW-ADR-020,
 * MW-0580). The open/close state stays owned by the screen because
 * `WorkspaceTemplate` takes it as props, so this component remains a Server
 * Component.
 */
export function WorkspaceSidebar({
  navLabel,
  items,
  closeLabel,
  onCloseSidebar,
  brandIcon,
  brandLabel,
  brandHref,
  identity,
  logout,
  children,
  className,
}: WorkspaceSidebarProps) {
  return (
    <>
      <div className="flex h-12 items-center justify-between px-2">
        <SidebarBrand href={brandHref} icon={brandIcon} label={brandLabel} />
        <Button
          aria-label={closeLabel}
          className="md:hidden"
          onClick={() => onCloseSidebar()}
          size="icon"
          title={closeLabel}
          variant="ghost"
        >
          <X aria-hidden="true" size={18} />
        </Button>
      </div>
      <SidebarNav className={className} items={items} label={navLabel} />
      {children}
      {(identity !== undefined || logout !== undefined) && (
        <SidebarFooter
          logoutIcon={logout?.icon}
          logoutLabel={logout?.label}
          onLogout={logout?.onLogout}
          userName={identity?.name}
          userSubtitle={identity?.subtitle}
        />
      )}
    </>
  );
}
