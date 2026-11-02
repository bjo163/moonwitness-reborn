import { Menu } from "lucide-react";
import { Button } from "../atoms/button.js";
import { cn } from "../lib/utils.js";

export interface SidebarTriggerProps {
  /** Current drawer state; drives `aria-expanded`. */
  sidebarOpen: boolean;
  onOpenSidebar(): void;
  /** Accessible name — every screen passes its own locale string. */
  label: string;
  /**
   * DOM id of the drawer this trigger controls, mirroring
   * `WorkspaceTemplate`'s `sidebarId`. Defaults to `"ql-workspace-sidebar"`
   * so a single workspace per page needs no prop.
   */
  sidebarId?: string;
  className?: string;
}

/**
 * The mobile hamburger that opens the workspace sidebar drawer (MW-0584).
 *
 * Eleven `apps/web` workspaces each re-rendered `<Button size="icon" variant=
 * "ghost" className="md:hidden" aria-label={…} onClick={() => setSidebarOpen(
 * true)}><Menu size={19}/></Button>` by hand, and none of them announced the
 * drawer's state to assistive tech. Consolidating here gives every screen the
 * same `aria-expanded` toggle and the `aria-controls` link to the
 * `#ql-workspace-sidebar` element `WorkspaceTemplate` renders, so a screen
 * reader can move focus from the trigger into an open drawer.
 *
 * The responsive hide rule lives in `.ql-sidebar-trigger` (unlayered in
 * `packages/ui/styles/components.css`) rather than on Tailwind's `md:hidden`
 * utility, because `.ql-button`'s unlayered `display: inline-flex` beats any
 * layered utility; without this the trigger stayed visible at 1280px. The
 * icon stays the same `Menu` glyph at the same size to preserve the visual
 * weight the design system established.
 */
export function SidebarTrigger({
  sidebarOpen,
  onOpenSidebar,
  label,
  sidebarId = "ql-workspace-sidebar",
  className,
}: SidebarTriggerProps) {
  return (
    <Button
      aria-controls={sidebarId}
      aria-expanded={sidebarOpen}
      aria-label={label}
      className={cn("ql-sidebar-trigger", className)}
      onClick={() => onOpenSidebar()}
      size="icon"
      variant="ghost"
    >
      <Menu aria-hidden="true" size={19} />
    </Button>
  );
}
