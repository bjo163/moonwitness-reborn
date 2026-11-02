import * as React from "react";

export interface OfflineStatusPillProps {
  isOnline: boolean;
  cachedSurahCount?: number;
  totalSurahCount?: number;
  syncProgress?: number; // 0 - 100
  isSyncing?: boolean;
  onSyncOfflineData?(this: void): void;
  className?: string;
}

export function OfflineStatusPill({
  isOnline,
  cachedSurahCount = 114,
  totalSurahCount = 114,
  syncProgress = 100,
  isSyncing = false,
  onSyncOfflineData,
  className = "",
}: OfflineStatusPillProps): React.JSX.Element {
  const isFullyCached = cachedSurahCount >= totalSurahCount;

  return (
    <div
      className={`ql-offline-status-pill inline-flex items-center gap-2 border border-hairline bg-panel px-3 py-1 text-xs shadow-hud-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`size-2 rounded-full ${
          isOnline ? "bg-success shadow-[0_0_8px_var(--color-success)]" : "bg-warning shadow-[0_0_8px_var(--color-warning)]"
        }`}
        aria-hidden="true"
      />

      <span className="font-medium text-ink">
        {isOnline ? "Online Operable" : "Offline Resilient"}
      </span>

      <span className="text-muted">|</span>

      <span className="font-mono text-muted">
        {cachedSurahCount}/{totalSurahCount} Surahs Cached
      </span>

      {isSyncing ? (
        <span className="border border-hairline bg-panel-well px-1.5 py-0.5 font-mono text-[10px] text-acid">
          Syncing {syncProgress}%
        </span>
      ) : !isFullyCached && onSyncOfflineData ? (
        <button
          type="button"
          onClick={onSyncOfflineData}
          className="ml-1 text-[11px] font-medium text-acid hover:underline"
        >
          Download Offline
        </button>
      ) : (
        <span className="border border-hairline bg-panel-well px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
          Local Ready
        </span>
      )}
    </div>
  );
}
