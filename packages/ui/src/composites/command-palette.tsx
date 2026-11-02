import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "../atoms/button.js";
import { Input } from "../atoms/input.js";
import { cn } from "../lib/utils.js";

export type CommandCategory = "corpus" | "navigation" | "preferences" | "system";

export interface CommandAction {
  id: string;
  category: CommandCategory;
  titleKey: string;
  titleFallback: string;
  subtitle?: string;
  iconName?: string;
  shortcut?: readonly string[];
  keywords?: readonly string[];
  perform(this: void): void | Promise<void>;
}

export interface CommandPaletteProps {
  /** Controls open/close state of the dialog. */
  open: boolean;
  /** Callback fired when the open state changes. */
  onOpenChange(this: void, open: boolean): void;
  /** Static and dynamic registry of executable actions. */
  actions: readonly CommandAction[];
  /** Callback invoked when an action executes. */
  onExecute?(this: void, action: CommandAction): void;
  /** Active user locale for localized action labels. */
  locale?: "id" | "en";
  title?: string;
  placeholder?: string;
  closeLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function CommandPalette({
  open,
  onOpenChange,
  actions,
  onExecute,
  locale = "id",
  title = "Command Palette",
  placeholder = "Type a command or search...",
  closeLabel = "Close palette",
  className,
  children,
}: CommandPaletteProps) {
  void locale;
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredActions = actions.filter((act) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const title = act.titleFallback.toLowerCase();
    const kw = (act.keywords ?? []).join(" ").toLowerCase();
    return title.includes(q) || kw.includes(q);
  });

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredActions.length ? (prev + 1) % filteredActions.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredActions.length ? (prev - 1 + filteredActions.length) % filteredActions.length : 0
        );
      } else if (e.key === "Enter") {
        const chosen = filteredActions[selectedIndex];
        if (chosen !== undefined) {
          e.preventDefault();
          onExecute?.(chosen);
          void chosen.perform();
          onOpenChange(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange, filteredActions, selectedIndex, onExecute]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const chosen = filteredActions[selectedIndex];
    if (chosen !== undefined) {
      onExecute?.(chosen);
      void chosen.perform();
      onOpenChange(false);
    }
  };

  const activeItem = filteredActions[selectedIndex];

  return (
    <div
      role="combobox"
      aria-expanded="true"
      aria-haspopup="listbox"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:p-6 sm:pt-24 backdrop-blur-md bg-panel-edge/80"
    >
      <div
        className={cn(
          "w-full max-w-2xl border border-hairline-strong bg-panel shadow-2xl transition-all",
          className
        )}
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-b border-hairline px-4 py-3"
        >
          <Search aria-hidden="true" size={20} className="shrink-0 text-acid" />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-controls="command-listbox"
            aria-activedescendant={
              activeItem === undefined ? undefined : `command-item-${activeItem.id}`
            }
            className="w-full border-none bg-transparent text-sm focus:ring-0 focus:outline-none"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {filteredActions.length > 0 && (
            <ul
              id="command-listbox"
              role="listbox"
              aria-label="Commands"
              className="space-y-1"
            >
              {filteredActions.map((action, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li
                    key={action.id}
                    id={`command-item-${action.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onExecute?.(action);
                      void action.perform();
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded cursor-pointer transition-colors border-l-2",
                      isSelected
                        ? "bg-panel-raised text-acid border-l-acid"
                        : "hover:bg-panel-edge text-ink-soft border-l-transparent"
                    )}
                  >
                    <div>
                      <div className="font-semibold text-sm">{action.titleFallback}</div>
                      {action.subtitle !== undefined && action.subtitle.length > 0 ? (
                        <div className="text-xs text-muted">{action.subtitle}</div>
                      ) : null}
                    </div>
                    {action.shortcut !== undefined && (
                      <span className="font-mono text-xs px-1.5 py-0.5 border border-hairline rounded bg-panel">
                        {action.shortcut.join(" ")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
