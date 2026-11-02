import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";
import { Badge } from "../atoms/badge.js";

export interface LocalInferenceModelStatus {
  isAvailable: boolean;
  backend: "webgpu" | "wasm" | "unavailable";
  modelLoaded: boolean;
  downloadProgressPct: number;
  memoryUsedMb: number;
}

export interface LocalInferenceToggleProps {
  isEnabled: boolean;
  modelStatus?: LocalInferenceModelStatus;
  onToggle(this: void, enabled: boolean): void;
  onDownloadModel?(this: void): void;
  className?: string;
}

const DEFAULT_STATUS: LocalInferenceModelStatus = {
  isAvailable: true,
  backend: "webgpu",
  modelLoaded: true,
  downloadProgressPct: 100,
  memoryUsedMb: 34,
};

export function LocalInferenceToggle({
  isEnabled,
  modelStatus = DEFAULT_STATUS,
  onToggle,
  onDownloadModel,
  className,
}: LocalInferenceToggleProps): ReactNode {
  return (
    <div
      className={cn(
        "ql-local-inference-toggle rounded-xl border border-hairline bg-panel p-4 shadow-hud-sm transition-all duration-150",
        isEnabled ? "border-success bg-panel-raised" : "border-hairline",
        className,
      )}
      data-testid="local-inference-toggle"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2.5 rounded-full transition-colors",
                isEnabled ? "bg-success shadow-[0_0_8px_var(--color-success)]" : "bg-muted",
              )}
            />
            <h4 className="font-sans text-sm font-semibold tracking-wide text-ink">
              Mode Inferensi AI Privat Lokal (WebGPU)
            </h4>
            <Badge
              variant={isEnabled ? "live" : "outline"}
              className="font-mono text-[10px]"
            >
              {isEnabled ? "Zero Network Egress" : "Cloud Assisted"}
            </Badge>
          </div>
          <p className="font-sans text-xs text-muted">
            {isEnabled
              ? "Kueri pencarian diproses sepenuhnya di peramban lokal via WebGPU/CPU tanpa mengirim data keluar jaringan."
              : "Aktifkan untuk memproses vektor kata kunci secara lokal di perangkat Anda demi privasi mutlak."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onDownloadModel && !modelStatus.modelLoaded && (
            <button
              type="button"
              onClick={onDownloadModel}
              className="rounded-lg border border-hairline bg-panel-soft px-2.5 py-1 font-sans text-xs font-medium text-ink hover:bg-panel-deep"
            >
              Unduh Model
            </button>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            onClick={() => onToggle(!isEnabled)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid",
              isEnabled ? "bg-success" : "bg-panel-deep border border-hairline",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                isEnabled ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </div>

      {isEnabled && (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3 font-mono text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span>Akselerator: <strong className="text-ink">{modelStatus.backend.toUpperCase()}</strong></span>
            <span>Memori: <strong className="text-ink">{modelStatus.memoryUsedMb} MB</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-success">
            <span>🔒 Jalur Telemetri Tertutup</span>
          </div>
        </div>
      )}
    </div>
  );
}
