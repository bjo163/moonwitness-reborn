import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils.js";
import { QuranText } from "../atoms/quran-text.js";
import { Badge } from "../atoms/badge.js";

export interface DualStreamVersePair {
  surahNumber: number;
  ayahNumber: number;
  verbatimText: string;
  translationText: string;
  footnoteRefs?: Array<{ id: string; marker: string; text: string }>;
  authorityLevel: "revelation_verbatim" | "translation";
}

export interface DualStreamReaderProps extends HTMLAttributes<HTMLDivElement> {
  surahNumber: number;
  arabicEditionKey: string;
  translationEditionKey: string;
  verses: DualStreamVersePair[];
  activeAyah?: number;
  isScrollLocked?: boolean;
  onAyahSelect?(this: void, ayahNumber: number): void;
  onScrollLockChange?(this: void, locked: boolean): void;
  className?: string;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
}

export function DualStreamReader({
  surahNumber,
  arabicEditionKey,
  translationEditionKey,
  verses,
  activeAyah,
  isScrollLocked = true,
  onAyahSelect,
  onScrollLockChange,
  className,
  headerSlot,
  footerSlot,
  ...props
}: DualStreamReaderProps) {
  void arabicEditionKey;
  void translationEditionKey;
  void isScrollLocked;
  void onScrollLockChange;
  return (
    <div className={cn("ql-hermeneutic-reader-container w-full", className)} {...props}>
      {headerSlot}
      <div className="ql-hermeneutic-reader">
        {/* Translation Pane (LTR) */}
        <section
          className="ql-reader-pane ql-reader-pane--translation space-y-6"
          dir="ltr"
          aria-label="Translation Stream"
        >
          {verses.map((v) => {
            const isActive = activeAyah === v.ayahNumber;
            return (
              <div
                key={`trans-${v.ayahNumber}`}
                data-ayah-index={v.ayahNumber}
                onClick={() => onAyahSelect?.(v.ayahNumber)}
                className={cn(
                  "p-5 rounded-lg border border-hairline bg-panel transition-colors cursor-pointer",
                  isActive && "border-acid bg-panel-raised"
                )}
              >
                <div className="flex items-center justify-between border-b border-hairline pb-2 mb-3 text-xs">
                  <span className="font-mono text-acid">{surahNumber}:{v.ayahNumber}</span>
                  <Badge variant="outline">Translation</Badge>
                </div>
                <p className="text-base text-ink-soft leading-relaxed">{v.translationText}</p>
              </div>
            );
          })}
        </section>

        {/* Verbatim Arabic Scripture Pane (RTL) */}
        <section
          className="ql-reader-pane ql-reader-pane--verbatim space-y-6"
          dir="rtl"
          aria-label="Revelation Verbatim Stream"
        >
          {verses.map((v) => {
            const isActive = activeAyah === v.ayahNumber;
            return (
              <div
                key={`verb-${v.ayahNumber}`}
                data-ayah-index={v.ayahNumber}
                onClick={() => onAyahSelect?.(v.ayahNumber)}
                className={cn(
                  "p-5 rounded-lg border border-hairline-strong bg-panel/70 transition-colors cursor-pointer",
                  isActive && "border-acid bg-panel-raised"
                )}
              >
                <div className="flex items-center justify-between border-b border-hairline pb-2 mb-3 text-xs">
                  <span className="font-mono text-acid">{surahNumber}:{v.ayahNumber}</span>
                  <Badge variant="live">Verbatim</Badge>
                </div>
                <QuranText
                  text={v.verbatimText}
                  surah={surahNumber}
                  ayah={v.ayahNumber}
                  scale="md"
                />
              </div>
            );
          })}
        </section>
      </div>
      {footerSlot}
    </div>
  );
}
