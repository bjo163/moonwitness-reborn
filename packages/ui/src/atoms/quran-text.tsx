import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

export type MushafScriptStyle = "uthmani_hafs" | "indopak" | "madinah_classic";
export type MushafScaleLevel = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface WaqafPositionToken {
  characterIndex: number;
  symbol: string;
  name: "lazim" | "mutlaq" | "jaiz" | "mujawwaz" | "murakhkhas" | "qif" | "saktah";
  prohibited: boolean;
}

export interface AyahEndMarkerProps extends HTMLAttributes<HTMLSpanElement> {
  ayahNumber: number;
  className?: string;
}

export function AyahEndMarker({ ayahNumber, className, ...props }: AyahEndMarkerProps) {
  return (
    <span
      className={cn("ql-ayah-marker", className)}
      aria-label={`Ayah ${ayahNumber}`}
      {...props}
    >
      {ayahNumber}
    </span>
  );
}

export interface WaqafSignProps extends HTMLAttributes<HTMLSpanElement> {
  token: WaqafPositionToken;
  className?: string;
}

export function WaqafSign({ token, className, ...props }: WaqafSignProps) {
  return (
    <span
      className={cn("ql-waqaf-sign", className)}
      title={token.name}
      aria-hidden="true"
      {...props}
    >
      {token.symbol}
    </span>
  );
}

export interface QuranTextProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Revelation verbatim Arabic text string */
  text: string;
  /** Surah number (1 - 114) */
  surah?: number;
  /** Ayah number within the surah */
  ayah?: number;
  /** Script style variant */
  script?: MushafScriptStyle;
  /** Scale sizing token */
  scale?: MushafScaleLevel;
  /** Whether to format waqaf signs as distinct colored glyph spans */
  highlightWaqaf?: boolean;
  /** Show decorative ayah end marker medallion containing verse number */
  showEndMarker?: boolean;
  /** Callback when user selects or highlights a word token */
  onWordClick?(this: void, wordIndex: number, text: string): void;
  /** Optional class override adhering to @moonwitness/ui conventions */
  className?: string;
  /** Accessibility label for screen readers */
  ariaLabel?: string;
}

export function QuranText({
  text,
  surah,
  ayah,
  script = "uthmani_hafs",
  scale = "md",
  highlightWaqaf = true,
  showEndMarker = true,
  onWordClick,
  className,
  ariaLabel,
  ...props
}: QuranTextProps) {
  const scaleClass = `ql-quran-text--${scale}`;
  void highlightWaqaf;
  void onWordClick;

  return (
    <p
      className={cn("ql-quran-text", scaleClass, className)}
      dir="rtl"
      lang="ar"
      aria-label={ariaLabel}
      data-script={script}
      data-surah={surah}
      data-ayah={ayah}
      {...props}
    >
      <bdi>{text}</bdi>
      {showEndMarker && ayah !== undefined && (
        <AyahEndMarker ayahNumber={ayah} />
      )}
    </p>
  );
}
