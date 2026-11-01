import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";
import { Button } from "../atoms/button.js";

export interface SidePanelProps {
  /** Visible heading of the panel. */
  title: ReactNode;
  /** Accessible name of the panel itself, e.g. the form it contains. */
  label: string;
  /** Small kicker above the title. Defaults to `label`. */
  eyebrow?: ReactNode;
  /** Accessible + visible label for the close control. */
  closeLabel: string;
  onClose(): void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Right-hand editor drawer used to create or edit a record without
 * leaving the list. Promotes the `.ql-model-editor` rule — which was
 * named after its first screen but reused verbatim by the DNS record
 * form — into a component every workspace can call (MW-0580). The close
 * control is a design-system `Button`, never a raw `<button>`.
 */
export function SidePanel({
  title,
  label,
  eyebrow,
  closeLabel,
  onClose,
  children,
  footer,
  className,
}: SidePanelProps) {
  return (
    <section className={cn("ql-side-panel", className)} aria-label={label}>
      <header className="ql-side-panel__header">
        <div>
          <div className="ql-eyebrow">{eyebrow ?? label}</div>
          <h2>{title}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={() => void onClose()}
        >
          <X aria-hidden="true" size={18} />
        </Button>
      </header>
      {children}
      {footer}
    </section>
  );
}
