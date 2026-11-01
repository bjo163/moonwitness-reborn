"use client";

import type { UiLocale } from "@moonwitness/moonclient";
import { Button } from "@moonwitness/ui";
import { Globe2 } from "lucide-react";

interface LocaleSwitcherProps {
  locale: UiLocale;
  label: string;
  onChange(locale: UiLocale): void;
  disabled?: boolean;
}

export function LocaleSwitcher({
  locale,
  label,
  onChange,
  disabled = false,
}: LocaleSwitcherProps) {
  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={label}
    >
      <Globe2 aria-hidden="true" size={15} className="mr-1 text-stone-500" />
      {(["id", "en"] as const).map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={locale === option ? "secondary" : "ghost"}
          aria-pressed={locale === option}
          disabled={disabled}
          onClick={() => onChange(option)}
        >
          {option.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
