import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";
import { Badge } from "../atoms/badge.js";

export interface QuranicRootItem {
  id: string;
  rootArabic: string;
  rootTranslit: string;
  totalOccurrences: number;
  meaningId: string;
  meaningEn: string;
}

export interface LexicalRootSearchProps {
  initialRoot?: string;
  roots?: readonly QuranicRootItem[];
  selectedRoot?: string | null;
  onSelectRoot?(this: void, root: string): void;
  className?: string;
}

const DEFAULT_QURANIC_ROOTS: readonly QuranicRootItem[] = [
  {
    id: "r-h-m",
    rootArabic: "ر-ح-م",
    rootTranslit: "r-h-m",
    totalOccurrences: 339,
    meaningId: "Kasih sayang, rahmat, kelembutan",
    meaningEn: "Mercy, compassion, grace",
  },
  {
    id: "a-l-m",
    rootArabic: "ع-ل-م",
    rootTranslit: "'a-l-m",
    totalOccurrences: 854,
    meaningId: "Ilmu, mengetahui, tanda",
    meaningEn: "Knowledge, to know, sign",
  },
  {
    id: "q-w-l",
    rootArabic: "ق-و-ل",
    rootTranslit: "q-w-l",
    totalOccurrences: 1722,
    meaningId: "Berkata, ucapan, firman",
    meaningEn: "To say, speech, word",
  },
  {
    id: "h-d-y",
    rootArabic: "ه-د-ي",
    rootTranslit: "h-d-y",
    totalOccurrences: 316,
    meaningId: "Petunjuk, membimbing",
    meaningEn: "Guidance, to guide",
  },
  {
    id: "n-w-r",
    rootArabic: "ن-و-ر",
    rootTranslit: "n-w-r",
    totalOccurrences: 194,
    meaningId: "Cahaya, penerang",
    meaningEn: "Light, illumination",
  },
];

export function LexicalRootSearch({
  roots = DEFAULT_QURANIC_ROOTS,
  selectedRoot,
  onSelectRoot,
  className,
}: LexicalRootSearchProps): ReactNode {
  return (
    <div
      className={cn(
        "ql-lexical-root-search space-y-4 rounded-xl border border-hairline bg-panel p-5 shadow-hud-sm",
        className,
      )}
      data-testid="lexical-root-search"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
        <div>
          <h3 className="font-sans text-sm font-semibold tracking-wide text-ink">
            Akar Kata Quranik (Juzur / جذور)
          </h3>
          <p className="font-sans text-xs text-muted">
            Pilih atau telusuri akar trilateral untuk menyingkap medan semantik ayat.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {roots.length} Akar Terpilih
        </Badge>
      </div>

      <div
        className="ql-root-chip-grid flex flex-wrap gap-2.5"
        role="radiogroup"
        aria-label="Quranic root words filter"
      >
        {roots.map((item) => {
          const isSelected = selectedRoot === item.rootArabic;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                if (onSelectRoot) {
                  onSelectRoot(item.rootArabic);
                }
              }}
              className={cn(
                "ql-root-chip group flex items-center gap-2.5 rounded-lg border border-hairline px-3 py-2 text-left transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid",
                isSelected
                  ? "border-acid bg-panel-raised shadow-hud-sm"
                  : "bg-panel-edge hover:border-hairline-strong hover:bg-panel-raised",
              )}
            >
              <span
                className="font-arabic text-base font-semibold text-acid"
                dir="rtl"
              >
                {item.rootArabic}
              </span>
              <span className="font-mono text-xs text-ink-soft group-hover:text-ink">
                ({item.rootTranslit})
              </span>
              <span className="rounded bg-panel-deep px-1.5 py-0.5 font-mono text-[11px] text-muted">
                {item.totalOccurrences}x
              </span>
            </button>
          );
        })}
      </div>

      {selectedRoot && (
        <div className="mt-3 rounded-lg border border-hairline bg-panel-deep p-3.5 text-xs text-ink-soft">
          {(() => {
            const active = roots.find((r) => r.rootArabic === selectedRoot);
            if (!active) return null;
            return (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">Makna Leksikal:</span>
                  <span className="text-acid">{active.meaningId}</span>
                  <span className="text-muted">/ {active.meaningEn}</span>
                </div>
                <div className="font-mono text-[11px] text-muted">
                  Frekuensi: {active.totalOccurrences} kemunculan dalam Al-Qur'an
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
