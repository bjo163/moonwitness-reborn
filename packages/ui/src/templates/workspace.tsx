import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface WorkspaceTemplateProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar(): void;
  closeLabel: string;
}

export function WorkspaceTemplate({
  sidebar,
  header,
  children,
  footer,
  sidebarOpen,
  onCloseSidebar,
  closeLabel,
}: WorkspaceTemplateProps) {
  return (
    <main className="ql-hud-app ql-workspace">
      {sidebarOpen && (
        <button
          aria-label={closeLabel}
          className="ql-workspace__backdrop"
          onClick={onCloseSidebar}
        />
      )}
      <aside
        className={cn(
          "ql-hud-sidebar ql-workspace__sidebar",
          sidebarOpen && "is-open",
        )}
        id="ql-workspace-sidebar"
      >
        {sidebar}
      </aside>
      <section className="ql-workspace__main">
        <header className="ql-hud-topbar ql-workspace__header">
          {header}
        </header>
        {children}
        {footer && <footer className="ql-workspace__footer">{footer}</footer>}
      </section>
    </main>
  );
}
