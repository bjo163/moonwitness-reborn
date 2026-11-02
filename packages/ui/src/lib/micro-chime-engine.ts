export type MicroChimeTone = "contemplation" | "affirmation" | "transition";

export interface MicroChimeConfig {
  frequencyHz: number;
  durationMs: number;
  peakGain: number;
}

const TONE_CONFIGS: Record<MicroChimeTone, MicroChimeConfig> = {
  contemplation: {
    frequencyHz: 432,
    durationMs: 120,
    peakGain: 0.12,
  },
  affirmation: {
    frequencyHz: 528,
    durationMs: 100,
    peakGain: 0.15,
  },
  transition: {
    frequencyHz: 648,
    durationMs: 80,
    peakGain: 0.1,
  },
};

let sharedAudioCtx: AudioContext | null = null;
let isMutedGlobal = true; // Strictly default muted according to design constitution

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }
  return sharedAudioCtx;
}

export const microChimeEngine = {
  isEnabled(): boolean {
    return !isMutedGlobal;
  },

  setEnabled(enabled: boolean): void {
    isMutedGlobal = !enabled;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("moonwitness:audio:chime_enabled", enabled ? "true" : "false");
      } catch {
        // Ignore localStorage errors
      }
    }
  },

  play(tone: MicroChimeTone = "contemplation"): void {
    if (isMutedGlobal) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    try {
      const config = TONE_CONFIGS[tone] ?? TONE_CONFIGS.contemplation;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(config.frequencyHz, ctx.currentTime);

      const now = ctx.currentTime;
      const durationSec = config.durationMs / 1000;

      // Click-free exponential attack (5ms) and exponential decay envelope
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(config.peakGain, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.01);
    } catch {
      // Audio autoplay policy or hardware restriction: fail silently
    }
  },
};
