"use client";

import { SearchDialog } from "@moonwitness/ui";
import Link from "next/link";
import { useMessages } from "../../locale/messages";

export interface SpotlightDialogProps {
  isOpen: boolean;
  query: string;
  onQueryChange(this: void, q: string): void;
  onClose(this: void): void;
}

export function SpotlightDialog({
  isOpen,
  query,
  onQueryChange,
  onClose,
}: SpotlightDialogProps) {
  const copy = useMessages();

  const handleSubmit = () => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    if (q === "1" || q.includes("fatihah")) {
      window.location.assign("/corpus/quran-ar/1");
    } else if (q === "2" || q.includes("baqarah")) {
      window.location.assign("/corpus/quran-ar/2");
    } else if (q.includes("dock") || q.includes("community")) {
      window.location.assign("/community");
    } else if (q.includes("command") || q.includes("cockpit")) {
      window.location.assign("/command-center");
    } else {
      window.location.assign(`/command-center/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <SearchDialog
      isOpen={isOpen}
      title={copy.common.searchAction}
      placeholder={copy.common.searchPlaceholder}
      closeLabel={copy.common.closeMenu}
      query={query}
      onQueryChange={onQueryChange}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-xs text-muted">{copy.common.searchPrompt}</p>

        <div>
          <p className="text-xs font-semibold tracking-wider text-acid uppercase mb-2">
            Surah Quick Jump
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/corpus/quran-ar/1"
              onClick={onClose}
              className="flex items-center justify-between p-2 rounded border border-hairline bg-panel-edge hover:border-acid hover:text-acid transition-colors"
            >
              <span className="font-semibold text-ink">1. Al-Fatihah</span>
              <span className="text-[10px] text-muted">7 Ayah</span>
            </Link>
            <Link
              href="/corpus/quran-ar/2"
              onClick={onClose}
              className="flex items-center justify-between p-2 rounded border border-hairline bg-panel-edge hover:border-acid hover:text-acid transition-colors"
            >
              <span className="font-semibold text-ink">2. Al-Baqarah</span>
              <span className="text-[10px] text-muted">286 Ayah</span>
            </Link>
            <Link
              href="/corpus/quran-ar/36"
              onClick={onClose}
              className="flex items-center justify-between p-2 rounded border border-hairline bg-panel-edge hover:border-acid hover:text-acid transition-colors"
            >
              <span className="font-semibold text-ink">36. Ya-Sin</span>
              <span className="text-[10px] text-muted">83 Ayah</span>
            </Link>
            <Link
              href="/corpus/quran-ar/67"
              onClick={onClose}
              className="flex items-center justify-between p-2 rounded border border-hairline bg-panel-edge hover:border-acid hover:text-acid transition-colors"
            >
              <span className="font-semibold text-ink">67. Al-Mulk</span>
              <span className="text-[10px] text-muted">30 Ayah</span>
            </Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wider text-acid uppercase mb-2">
            {copy.common.quickLinks}
          </p>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href="/corpus"
                onClick={onClose}
                className="block p-2 rounded hover:bg-panel-edge text-ink-soft hover:text-acid transition-colors"
              >
                <span className="font-semibold text-ink">MoonWitness Corpus</span> &middot;{" "}
                {copy.landing.portalMoonWitness}
              </Link>
            </li>
            <li>
              <Link
                href="/community"
                onClick={onClose}
                className="block p-2 rounded hover:bg-panel-edge text-ink-soft hover:text-acid transition-colors"
              >
                <span className="font-semibold text-ink">The Harbor Dock</span> &middot;{" "}
                {copy.landing.portalDock}
              </Link>
            </li>
            <li>
              <Link
                href="/command-center"
                onClick={onClose}
                className="block p-2 rounded hover:bg-panel-edge text-ink-soft hover:text-acid transition-colors"
              >
                <span className="font-semibold text-ink">Command Center</span> &middot;{" "}
                {copy.landing.portalCockpit}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </SearchDialog>
  );
}
