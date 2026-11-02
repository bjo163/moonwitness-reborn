import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils.js";
import { Button } from "../atoms/button.js";
import { QuranText } from "../atoms/quran-text.js";

export interface SanctuaryZenStageProps {
  /** Revelation Arabic text (Madinah typography). */
  arabicText: string;
  /** Standard Quranic citation locator (e.g., "Surah Al-Kahf 18:10"). */
  citation: string;
  /** Optional translation text displayed in soft ink beneath the verse. */
  translationText?: string;
  /** Surah number for chapter context. */
  surahNumber: number;
  /** Ayah number for verse index. */
  ayahNumber: number;
  /** Callback invoked when the user exits Zen Mode. */
  onExit(this: void): void;
  /** Exit button accessible label. */
  exitLabel?: string;
  /** Optional custom action slot (e.g. audio tilawah whisper player). */
  floatingActions?: ReactNode;
  /** Class override. */
  className?: string;
}

/**
 * Sanctuary Minimalist Zen Mode Stage (Track 14).
 * Completely clears peripheral HUD chrome, centering sacred scripture over
 * an unblemished pitch-black obsidian void canvas with graceful Escape / touch exit affordances.
 */
export function SanctuaryZenStage({
  arabicText,
  citation,
  translationText,
  surahNumber,
  ayahNumber,
  onExit,
  exitLabel = "Exit Zen Mode (Esc)",
  floatingActions,
  className,
}: SanctuaryZenStageProps): ReactElement {
  const [controlsVisible, setControlsVisible] = useState(true);

  // Keyboard shortcut listener: Escape exits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  // Mouse inactivity timeout to hide the exit button on desktop
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const showControls = () => {
      setControlsVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setControlsVisible(false);
      }, 4000);
    };

    window.addEventListener("mousemove", showControls, { passive: true });
    window.addEventListener("touchstart", showControls, { passive: true });

    timer = setTimeout(() => {
      setControlsVisible(false);
    }, 4000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", showControls);
      window.removeEventListener("touchstart", showControls);
    };
  }, []);

  return (
    <div
      className={cn(
        "ql-sanctuary-zen-stage fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-panel-deeper p-6 select-none",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Sanctuary Zen Mode Scripture View"
    >
      {/* Floating Exit Affordance Pill */}
      <div
        className={cn(
          "fixed top-6 right-6 z-50 flex items-center gap-3 transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {floatingActions}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onExit()}
          className="border-hairline bg-panel-raised text-acid shadow-hud"
        >
          <X size={15} aria-hidden="true" />
          <span>{exitLabel}</span>
        </Button>
      </div>

      {/* Centered Sacred Scripture Measure (Strictly <= 65ch) */}
      <div className="mx-auto w-full max-w-3xl space-y-8 text-center my-auto">
        <div className="ql-eyebrow font-mono text-xs uppercase tracking-[0.3em] text-acid">
          {citation}
        </div>

        <div className="py-4">
          <QuranText
            text={arabicText}
            surah={surahNumber}
            ayah={ayahNumber}
            scale="xl"
            className="text-center justify-center leading-[3.0]"
          />
        </div>

        {translationText && (
          <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-ink-soft">
            {translationText}
          </p>
        )}
      </div>

      {/* Subdued Bottom Guide */}
      <div
        className={cn(
          "fixed bottom-6 text-center font-mono text-[11px] text-muted transition-opacity duration-300",
          controlsVisible ? "opacity-70" : "opacity-0",
        )}
      >
        <span>{citation} · {exitLabel}</span>
      </div>
    </div>
  );
}
