import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";
import { Button } from "../atoms/button.js";

export interface SidebarFooterProps {
  userName?: ReactNode;
  /**
   * Secondary line under the name — an email, a role, or any other
   * identity detail. Named for what it does (a subtitle) rather than
   * one screen's data, so the workspace, admin, and connector sidebars
   * can all share it.
   */
  userSubtitle?: ReactNode;
  onLogout?(): void;
  /** Required together with `onLogout`; the button renders only when both are set. */
  logoutLabel?: string;
  /**
   * Optional icon override for the logout button. Defaults to
   * `<LogOut size={16} aria-hidden />` from `lucide-react`; `lucide-react`
   * is a peerDependency so apps that already have it (e.g. `apps/web`)
   * inherit the default without any extra install.
   */
  logoutIcon?: ReactNode;
  className?: string;
}

/**
 * Sidebar footer — user identity chip + logout button. Replaces the
 * three copies of the `<div className="mt-4 flex items-center gap-2
 * border-t border-[#354135] px-2 pt-4">…` block that lived in
 * dashboard, workflow, and corpus screens (MW-ADR-020). Colour comes
 * from the `border-hairline` token.
 */
export function SidebarFooter({
  userName,
  userSubtitle,
  onLogout,
  logoutLabel,
  logoutIcon,
  className,
}: SidebarFooterProps) {
  const hasSubtitle = userSubtitle !== undefined && userSubtitle !== null;
  const hasName = userName !== undefined && userName !== null;
  const showLogout = onLogout !== undefined && logoutLabel !== undefined;
  return (
    <div
      className={cn(
        "mt-4 flex items-center gap-2 border-t border-hairline px-2 pt-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {hasName && (
          <div className="truncate text-xs font-medium text-ink-soft">
            {userName}
          </div>
        )}
        {hasSubtitle && (
          <div className="truncate text-[11px] text-muted">{userSubtitle}</div>
        )}
      </div>
      {showLogout && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={logoutLabel}
          title={logoutLabel}
          onClick={() => void onLogout?.()}
        >
          {logoutIcon ?? <LogOut aria-hidden="true" size={16} />}
        </Button>
      )}
    </div>
  );
}
