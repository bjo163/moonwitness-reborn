import type { ReactElement } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "../atoms/button.js";
import { cn } from "../lib/utils.js";

export interface ChimeToggleProps {
  /** Whether the chime audio is currently enabled. */
  enabled: boolean;
  /** Callback fired when user toggles chime status. */
  onToggle(this: void, nextState: boolean): void;
  /** Optional class override. */
  className?: string;
  /** Visible label or tooltip text from i18n catalog. */
  label: string;
}

/**
 * Micro-Chime Audio Consent Toggle Component (Track 13).
 * Respects strict user consent: audio feedback is muted by default.
 */
export function ChimeToggle({
  enabled,
  onToggle,
  className,
  label,
}: ChimeToggleProps): ReactElement {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => onToggle(!enabled)}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      className={cn(
        "ql-chime-toggle gap-1.5 font-mono text-xs transition-colors",
        enabled ? "text-acid" : "text-muted hover:text-ink-soft",
        className,
      )}
    >
      {enabled ? (
        <Volume2 size={15} aria-hidden="true" />
      ) : (
        <VolumeX size={15} aria-hidden="true" />
      )}
      <span>{label}</span>
    </Button>
  );
}
