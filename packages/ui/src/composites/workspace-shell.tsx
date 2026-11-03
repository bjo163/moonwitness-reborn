import { useCallback, useState, type ReactNode } from "react";
import { cn } from "../lib/utils.js";
import { SidebarTrigger } from "./sidebar-trigger.js";
import { WorkspaceSidebar } from "./workspace-sidebar.js";
import type { SidebarNavItem } from "./sidebar-nav.js";
import { WorkspaceTemplate } from "../templates/workspace.js";

export interface WorkspaceShellProps {
  /** Items for the sidebar navigation. */
  items: readonly SidebarNavItem[];
  /** Identity info shown in the sidebar footer. */
  identity?: {
    name: ReactNode;
    subtitle?: ReactNode;
  };
  /** Callback when sidebar is closed. */
  onCloseSidebar?(): void;
  /** Optional controlled drawer state. */
  sidebarOpen?: boolean;
  /** Callback when the drawer should open. */
  onOpenSidebar?(): void;
  /** Optional override for the sidebar's aria-controls target. */
  sidebarId?: string;
  /** Primary title displayed in the workspace header. */
  title?: string;
  /** Accessible name for the workspace navigation. */
  navLabel?: string;
  /** Label for the close/open menu button. */
  closeLabel: string;
  /** Optional className applied to the workspace root. */
  className?: string;
  /** Optional flag to hide the locale switcher in the header. */
  hideLocaleSwitcher?: boolean;
  /** Optional application-owned locale switcher rendered in the header. */
  localeSwitcher?: ReactNode;
  /** Children rendered inside the workspace content area. */
  children: ReactNode;
}

export function WorkspaceShell({
  items,
  identity,
  onCloseSidebar,
  sidebarOpen: controlledSidebarOpen,
  onOpenSidebar,
  sidebarId = "ql-workspace-sidebar",
  title,
  navLabel,
  closeLabel,
  className,
  hideLocaleSwitcher = false,
  localeSwitcher,
  children,
}: WorkspaceShellProps) {
  const [uncontrolledSidebarOpen, setUncontrolledSidebarOpen] = useState(true);
  const sidebarOpen = controlledSidebarOpen ?? uncontrolledSidebarOpen;
  const handleCloseSidebar = useCallback(() => {
    setUncontrolledSidebarOpen(false);
    onCloseSidebar?.();
  }, [onCloseSidebar]);
  const handleOpenSidebar = useCallback(() => {
    setUncontrolledSidebarOpen(true);
    onOpenSidebar?.();
  }, [onOpenSidebar]);

  return (
    <div className={cn("ql-workspace", className)}>
      <WorkspaceTemplate
        sidebarId={sidebarId}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={handleCloseSidebar}
        closeLabel={closeLabel}
        sidebar={
          <WorkspaceSidebar
            items={items}
            identity={identity}
            onCloseSidebar={handleCloseSidebar}
            closeLabel={closeLabel}
            navLabel={navLabel ?? title ?? closeLabel}
          />
        }
        header={
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                label={closeLabel}
                onOpenSidebar={handleOpenSidebar}
                sidebarOpen={sidebarOpen}
              />
              {title && (
                <span className="ql-display text-base font-semibold tracking-wide text-acid">
                  {title}
                </span>
              )}
            </div>
            {!hideLocaleSwitcher && localeSwitcher}
          </div>
        }
      >
        {children}
      </WorkspaceTemplate>
    </div>
  );
}