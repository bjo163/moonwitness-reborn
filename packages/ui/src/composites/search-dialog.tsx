import { Search, X } from "lucide-react";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { Button } from "../atoms/button.js";
import { Input } from "../atoms/input.js";
import { cn } from "../lib/utils.js";

export interface SearchDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Accessible dialog title */
  title: string;
  /** Search input placeholder */
  placeholder: string;
  /** Accessible close button label */
  closeLabel: string;
  /** Current search query value */
  query: string;
  /** Query change callback */
  onQueryChange(this: void, nextQuery: string): void;
  /** Form submission callback */
  onSubmit(this: void): void;
  /** Close dialog callback */
  onClose(this: void): void;
  /** Search results or suggestion items */
  children?: ReactNode;
  /** Optional class override */
  className?: string;
}

/**
 * Accessible Spotlight Search / Command Palette modal dialog.
 * Traps focus, handles ESC key, and prevents body scroll while open.
 */
export function SearchDialog({
  isOpen,
  title,
  placeholder,
  closeLabel,
  query,
  onQueryChange,
  onSubmit,
  onClose,
  children,
  className,
}: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto focus the search input upon opening
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:p-6 sm:pt-24 backdrop-blur-md bg-panel-edge/80"
    >
      <div
        className={cn(
          "w-full max-w-2xl border border-hairline-strong bg-panel shadow-2xl transition-all",
          className,
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
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="w-full border-none bg-transparent text-sm focus:ring-0 focus:outline-none"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={() => onClose()}
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </form>

        {children && (
          <div className="max-h-[60vh] overflow-y-auto p-4">{children}</div>
        )}
      </div>
    </div>
  );
}
