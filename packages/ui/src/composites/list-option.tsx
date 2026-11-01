import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

const listOptionVariants = cva("", {
  variants: {
    /**
     * `card` is a boxed row (translation catalogue). `nav` reuses the sidebar
     * row so a selectable list inside a sidebar (model picker, DNS zone list,
     * chat history) reads like the navigation rows beside it instead of
     * introducing a second row shape.
     */
    variant: {
      card: "ql-list-option",
      nav: "ql-nav-link w-full justify-start",
    },
  },
  defaultVariants: { variant: "card" },
});

export interface ListOptionProps
  extends VariantProps<typeof listOptionVariants> {
  selected: boolean;
  onSelect(): void;
  children: ReactNode;
  /**
   * Accessible name for rows whose meaningful label is composed of several
   * inner elements (namespace + key + status). Omit it when the visible text
   * already names the row.
   */
  ariaLabel?: string;
  className?: string;
}

/**
 * Selectable row of a master-detail list. The translation catalogue had a raw
 * `<button>` with its own hover/selected Tailwind classes, which is exactly
 * the per-screen styling MW-ADR-020 forbids; selection now lives in one
 * design-system rule (`is-selected`, or `is-active` for the nav variant).
 * `aria-current="true"` is kept because assistive tech uses it to announce the
 * active row of a list.
 */
export function ListOption({
  selected,
  onSelect,
  children,
  ariaLabel,
  className,
  variant,
}: ListOptionProps) {
  return (
    <button
      aria-current={selected ? "true" : undefined}
      aria-label={ariaLabel}
      className={cn(
        listOptionVariants({ variant }),
        selected && (variant === "nav" ? "is-active" : "is-selected"),
        className,
      )}
      onClick={() => onSelect()}
      type="button"
    >
      {children}
    </button>
  );
}
