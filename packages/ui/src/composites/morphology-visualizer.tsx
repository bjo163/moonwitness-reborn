import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";
import { Badge } from "../atoms/badge.js";

export type ArabicGrammaticalCase =
  | "marfu"
  | "mansub"
  | "majrur"
  | "majzum"
  | "mabni";
export type ArabicPartOfSpeech =
  | "noun"
  | "verb"
  | "particle"
  | "pronoun"
  | "adjective";

export interface MorphologicalSegmentToken {
  id: string;
  wordIndex: number;
  segmentIndex: number;
  arabicText: string;
  transliteration: string;
  pos: ArabicPartOfSpeech;
  posTag: string;
  grammaticalCase: ArabicGrammaticalCase;
  caseExplanation: string;
  dependencyRelation?: string;
  parentSegmentId?: string;
}

export interface QuranicMorphologyVisualizerProps {
  surahNumber: number;
  ayahNumber: number;
  segments?: readonly MorphologicalSegmentToken[];
  activeSegmentId?: string | null;
  onSelectSegment?(this: void, segment: MorphologicalSegmentToken): void;
  className?: string;
}

const DEFAULT_SAMPLES: readonly MorphologicalSegmentToken[] = [
  {
    id: "seg-1-1-1",
    wordIndex: 1,
    segmentIndex: 1,
    arabicText: "بِ",
    transliteration: "bi",
    pos: "particle",
    posTag: "P",
    grammaticalCase: "mabni",
    caseExplanation: "Harf jar mabni 'ala al-kasr (Preposition particle)",
    dependencyRelation: "prep",
  },
  {
    id: "seg-1-1-2",
    wordIndex: 1,
    segmentIndex: 2,
    arabicText: "اسْمِ",
    transliteration: "ismi",
    pos: "noun",
    posTag: "N",
    grammaticalCase: "majrur",
    caseExplanation: "Ism majrur bi-harf al-jar wa 'alamatu jarrihi al-kasrah (Genitive noun)",
    dependencyRelation: "genitive_postposition",
  },
  {
    id: "seg-1-1-3",
    wordIndex: 2,
    segmentIndex: 1,
    arabicText: "اللَّهِ",
    transliteration: "Allahi",
    pos: "noun",
    posTag: "PN",
    grammaticalCase: "majrur",
    caseExplanation: "Lafz al-Jalalah mudhaf ilayh majrur (Possessive proper noun)",
    dependencyRelation: "possessive",
  },
  {
    id: "seg-1-1-4",
    wordIndex: 3,
    segmentIndex: 1,
    arabicText: "الرَّحْمَٰنِ",
    transliteration: "ar-Rahmani",
    pos: "adjective",
    posTag: "ADJ",
    grammaticalCase: "majrur",
    caseExplanation: "Na'at (adjective/epithet) majrur bil-kasrah",
    dependencyRelation: "epithet",
  },
  {
    id: "seg-1-1-5",
    wordIndex: 4,
    segmentIndex: 1,
    arabicText: "الرَّحِيمِ",
    transliteration: "ar-Rahimi",
    pos: "adjective",
    posTag: "ADJ",
    grammaticalCase: "majrur",
    caseExplanation: "Na'at thānī (second epithet) majrur bil-kasrah",
    dependencyRelation: "epithet",
  },
];

export function QuranicMorphologyVisualizer({
  surahNumber,
  ayahNumber,
  segments = DEFAULT_SAMPLES,
  activeSegmentId,
  onSelectSegment,
  className,
}: QuranicMorphologyVisualizerProps): ReactNode {
  const activeSegment = segments.find((s) => s.id === activeSegmentId) ?? segments[0];

  return (
    <div
      className={cn(
        "ql-morphology-visualizer space-y-5 rounded-xl border border-hairline bg-panel p-5 shadow-hud-sm",
        className,
      )}
      data-testid="morphology-visualizer"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
        <div>
          <h3 className="font-sans text-sm font-semibold tracking-wide text-ink">
            Dekomposisi Sintaksis & Morfologi (I&apos;rab)
          </h3>
          <p className="font-sans text-xs text-muted">
            Analisis pohon gramatikal kata-demi-kata untuk Surah {surahNumber}:{ayahNumber}
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {segments.length} Token Gramatikal
        </Badge>
      </div>

      {/* Horizontal RTL word-by-word syntax flow */}
      <div
        className="ql-syntax-tree-flow flex flex-wrap items-start justify-end gap-3.5 overflow-x-auto py-2"
        dir="rtl"
        role="tree"
        aria-label="Morphological syntax tree"
      >
        {segments.map((segment) => {
          const isSelected = activeSegment?.id === segment.id;
          return (
            <button
              key={segment.id}
              type="button"
              role="treeitem"
              aria-selected={isSelected}
              onClick={() => {
                if (onSelectSegment) {
                  onSelectSegment(segment);
                }
              }}
              className={cn(
                "ql-syntax-node flex min-w-[5.5rem] flex-col items-center rounded-xl border p-3 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid",
                isSelected
                  ? "border-acid bg-panel-raised shadow-hud-sm"
                  : "border-hairline bg-panel-edge hover:border-hairline-strong hover:bg-panel-raised",
              )}
            >
              <span className="font-arabic text-xl font-bold text-ink">
                {segment.arabicText}
              </span>
              <span className="font-sans text-[11px] text-muted" dir="ltr">
                {segment.transliteration}
              </span>
              <div className="mt-2 flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "ql-pos-pill rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                    segment.pos === "noun"
                      ? "bg-panel-deep text-acid border border-hairline"
                      : segment.pos === "verb"
                        ? "bg-panel-deep text-ink border border-hairline"
                        : "bg-panel-deep text-muted border border-hairline",
                  )}
                  dir="ltr"
                >
                  {segment.posTag}
                </span>
                <span
                  className={cn(
                    "ql-case-badge font-mono text-[10px] uppercase",
                    segment.grammaticalCase === "marfu"
                      ? "text-acid font-semibold"
                      : segment.grammaticalCase === "mansub"
                        ? "text-ink font-semibold"
                        : "text-muted",
                  )}
                  dir="ltr"
                >
                  {segment.grammaticalCase}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected token I'rab drawer / detailed card */}
      {activeSegment && (
        <div
          className="ql-irab-drawer rounded-xl border border-hairline bg-panel-deep p-4 space-y-2.5"
          data-testid="irab-detail"
        >
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-ink">
              Rincian I&apos;rab &amp; Peran Gramatikal
            </span>
            <Badge variant="outline" className="font-mono text-[11px] text-acid">
              Kasus: {activeSegment.grammaticalCase.toUpperCase()}
            </Badge>
          </div>
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <span className="text-muted">Lema / Teks Arab: </span>
              <span className="font-arabic text-sm font-semibold text-ink">
                {activeSegment.arabicText}
              </span>{" "}
              <span className="font-mono text-muted">
                ({activeSegment.transliteration})
              </span>
            </div>
            <div>
              <span className="text-muted">Relasi Dependensi: </span>
              <span className="font-mono text-ink-soft">
                {activeSegment.dependencyRelation ?? "root"}
              </span>
            </div>
          </div>
          <p className="border-t border-hairline pt-2 font-sans text-xs leading-relaxed text-ink-soft">
            {activeSegment.caseExplanation}
          </p>
        </div>
      )}
    </div>
  );
}
