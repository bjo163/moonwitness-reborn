"use client";

import { useEffect, useRef } from "react";
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
  /**
   * DOM id of the sidebar drawer, referenced by `SidebarTrigger` through
   * `aria-controls`. Defaults to `"ql-workspace-sidebar"` so a single
   * workspace per page needs no prop; override when a screen nests a second
   * workspace (e.g. inside a `SidePanel` dialog) so ids do not collide.
   */
  sidebarId?: string;
}

export function WorkspaceTemplate({
  sidebar,
  header,
  children,
  footer,
  sidebarOpen,
  onCloseSidebar,
  closeLabel,
  sidebarId = "ql-workspace-sidebar",
}: WorkspaceTemplateProps) {
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseSidebar();
    };
    document.addEventListener("keydown", handler);
    // Focus trap without a bespoke Tab handler: `inert` removes the main
    // content from tab order and screen-reader traversal while the drawer is
    // open, so Tab/Shift+Tab stay inside the drawer + backdrop.
    const main = mainRef.current;
    if (main) main.setAttribute("inert", "");
    return () => {
      document.removeEventListener("keydown", handler);
      if (main) main.removeAttribute("inert");
    };
  }, [sidebarOpen, onCloseSidebar]);

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
        id={sidebarId}
      >
        {sidebar}
      </aside>
      <section className="ql-workspace__main" ref={mainRef}>
        <header className="ql-hud-topbar ql-workspace__header">
          {header}
        </header>
        {children}
        {footer && <footer className="ql-workspace__footer">{footer}</footer>}
      </section>
    </main>
  );
}
