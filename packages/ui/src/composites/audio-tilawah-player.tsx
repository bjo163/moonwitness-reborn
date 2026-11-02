import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "../lib/utils.js";
import { Button } from "../atoms/button.js";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export interface AudioTimestampSegment {
  surahNumber: number;
  ayahNumber: number;
  startMs: number;
  endMs: number;
}

export interface ReciterProfile {
  id: string;
  nameTranslit: string;
  nameArabic: string;
  style: "murattal" | "mujawwad" | "tahfeedh";
  bitrateKbps: number;
  licenseAttribution: string;
}

export interface WhisperingWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  heightPx?: number;
  className?: string;
}

export function WhisperingWaveform({
  isPlaying,
  barCount = 12,
  heightPx = 28,
  className,
}: WhisperingWaveformProps) {
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 0.2),
  );

  useEffect(() => {
    if (!isPlaying) {
      setLevels(Array.from({ length: barCount }, () => 0.2));
      return;
    }

    // Same guard `AmbientAtmosphere` uses: a reduced-motion reader gets a
    // still waveform instead of a 10 Hz animation.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setLevels(
        Array.from({ length: barCount }, (_, i) => {
          const base = 0.25;
          const wave = Math.sin(Date.now() / 150 + i * 0.7) * 0.35;
          const rand = Math.random() * 0.3;
          return Math.min(1, Math.max(0.15, base + wave + rand));
        }),
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <div
      className={cn("ql-whispering-waveform flex items-center justify-between gap-1", className)}
      style={{ height: `${heightPx}px` }}
      aria-hidden="true"
    >
      {levels.map((level, idx) => (
        <span
          key={idx}
          className="w-1 rounded-full bg-acid transition-all duration-100"
          style={{
            height: `${Math.round(level * heightPx)}px`,
            opacity: isPlaying ? 0.4 + level * 0.6 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

export interface AudioTilawahPlayerProps {
  surahNumber: number;
  activeAyahNumber: number;
  /**
   * Who is reciting, and how. There is no default: naming a reciter the
   * caller never verified would put a false attribution on the scripture.
   */
  reciterName: string;
  reciterStyle: string;
  audioStreamUrl?: string;
  segments?: readonly AudioTimestampSegment[];
  isPlaying?: boolean;
  onPlayStateChange?(this: void, playing: boolean): void;
  onAyahChange?(this: void, ayahNumber: number): void;
  playerLabel: string;
  playLabel: string;
  pauseLabel: string;
  muteLabel: string;
  unmuteLabel: string;
  className?: string;
}

export function AudioTilawahPlayer({
  surahNumber,
  activeAyahNumber,
  reciterName,
  reciterStyle,
  audioStreamUrl,
  segments = [],
  isPlaying: controlledIsPlaying,
  onPlayStateChange,
  onAyahChange,
  playerLabel,
  playLabel,
  pauseLabel,
  muteLabel,
  unmuteLabel,
  className,
}: AudioTilawahPlayerProps) {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isPlaying = controlledIsPlaying ?? internalPlaying;

  const handleTogglePlay = useCallback(() => {
    const next = !isPlaying;
    setInternalPlaying(next);
    onPlayStateChange?.(next);

    if (audioRef.current) {
      if (next) {
        audioRef.current.play().catch(() => {
          setInternalPlaying(false);
          onPlayStateChange?.(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, onPlayStateChange]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || segments.length === 0) return;
    const currentMs = audioRef.current.currentTime * 1000;
    const currentSegment = segments.find(
      (s) => currentMs >= s.startMs && currentMs <= s.endMs,
    );
    if (currentSegment && currentSegment.ayahNumber !== activeAyahNumber) {
      onAyahChange?.(currentSegment.ayahNumber);
    }
  }, [segments, activeAyahNumber, onAyahChange]);

  return (
    <div
      className={cn("ql-audio-bar flex items-center justify-between gap-4", className)}
      data-testid="audio-tilawah-player"
      role="region"
      aria-label={playerLabel}
    >
      {audioStreamUrl && (
        <audio
          ref={audioRef}
          src={audioStreamUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setInternalPlaying(false);
            onPlayStateChange?.(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* Reciter identity and active verse */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink truncate">
            {reciterName}
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-hairline text-muted">
            {reciterStyle}
          </span>
        </div>
        <span className="text-xs font-mono text-acid">
          Surah {surahNumber} &middot; Ayah {activeAyahNumber}
        </span>
      </div>

      {/* Whispering waveform visualizer */}
      <div className="hidden sm:flex items-center gap-3">
        <WhisperingWaveform isPlaying={isPlaying} />
      </div>

      {/* Playback action controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleTogglePlay}
          className="gap-1.5 font-mono text-xs"
        >
          {isPlaying ? (
            <>
              <Pause size={14} aria-hidden="true" />
              <span>{pauseLabel}</span>
            </>
          ) : (
            <>
              <Play size={14} aria-hidden="true" />
              <span>{playLabel}</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleToggleMute}
          aria-label={muted ? unmuteLabel : muteLabel}
          className="p-1.5 text-muted hover:text-ink"
        >
          {muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
