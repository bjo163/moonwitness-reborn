import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface ThemeToggleProps {
  /** The current active theme */
  theme: "dark" | "light";
  /** Accessible label announcing the toggle action */
  label: string;
  /** Callback fired when toggle button is clicked */
  onToggle(this: void): void;
  /** Optional custom icon element */
  icon?: ReactNode;
  /** Optional class overrides */
  className?: string;
}

/**
 * Accessible button to switch between dark and light appearance modes.
 * Uses role semantics and aria-pressed reflecting whether light mode is active.
 */
export function ThemeToggle({
  theme,
  label,
  onToggle,
  icon,
  className,
}: ThemeToggleProps) {
  const isLight = theme === "light";
  return (
    <button
      type="button"
      aria-pressed={isLight}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={cn("ql-nav-link inline-flex items-center justify-center cursor-pointer", className)}
    >
      {icon ?? (
        <span aria-hidden="true" className="text-sm font-semibold select-none">
          {isLight ? "☀" : "☾"}
        </span>
      )}
    </button>
  );
}
