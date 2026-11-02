"use client";

import {
  type ReciterListItemDto,
  type SurahAudioManifestResponseDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  AudioTilawahPlayer,
  EmptyState,
  FormField,
  Select,
} from "@moonwitness/ui";
import type { useTranslationCatalog } from "../locale/translation-catalog";

type Translator = ReturnType<typeof useTranslationCatalog>["t"];

export interface TilawahRegionProps {
  reciters: ReciterListItemDto[] | null;
  reciterSlug: string;
  manifest: SurahAudioManifestResponseDto | null;
  error: string | null;
  surahNumber: number;
  activeAyahNumber: number;
  onSelectReciter(this: void, slug: string): void;
  onAyahChange(this: void, ayahNumber: number): void;
  t: Translator;
}

/**
 * Track 05. Each branch answers from stored rows: the reciter registry comes
 * from `corpus.reciter`, the clip boundaries for this surah from
 * `corpus.audio_segment`. Where a row is missing the reader names what is
 * missing rather than reciting a timeline nobody aligned or crediting a voice
 * nobody registered.
 */
export function TilawahRegion({
  reciters,
  reciterSlug,
  manifest,
  error,
  surahNumber,
  activeAyahNumber,
  onSelectReciter,
  onAyahChange,
  t,
}: TilawahRegionProps) {
  if (error !== null) {
    return <Alert variant="error">{error}</Alert>;
  }

  const pending = (
    <p className="text-xs font-mono text-muted" role="status">
      {t("web.corpus.audioLoading")}
    </p>
  );

  if (reciters === null) {
    return pending;
  }

  if (reciters.length === 0) {
    return (
      <EmptyState
        title={t("web.corpus.audioUnavailableTitle")}
        description={t("web.corpus.audioUnavailableBody")}
      />
    );
  }

  if (reciterSlug === "" || manifest === null) {
    return pending;
  }

  if (manifest.segments.length === 0) {
    return (
      <EmptyState
        title={t("web.corpus.audioUnavailableTitle")}
        description={t("web.corpus.audioUnalignedBody", {
          reciter: manifest.reciterName,
          surah: surahNumber,
        })}
      />
    );
  }

  if (manifest.streamUrl === null) {
    return (
      <EmptyState
        title={t("web.corpus.audioUnavailableTitle")}
        description={t("web.corpus.audioClipsetBody", {
          reciter: manifest.reciterName,
        })}
      />
    );
  }

  return (
    <div className="space-y-3">
      {reciters.length > 1 && (
        <FormField
          label={t("web.corpus.reciterPickerLabel")}
          htmlFor="tilawah-reciter"
        >
          <Select
            id="tilawah-reciter"
            value={reciterSlug}
            onChange={(event) => onSelectReciter(event.target.value)}
          >
            {reciters.map((reciter) => (
              <option key={reciter.slug} value={reciter.slug}>
                {`${reciter.nameTranslit} · ${reciter.style}`}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      <AudioTilawahPlayer
        surahNumber={surahNumber}
        activeAyahNumber={activeAyahNumber}
        reciterName={manifest.reciterName}
        reciterStyle={manifest.reciterStyle}
        audioStreamUrl={manifest.streamUrl}
        segments={manifest.segments.map((segment) => ({
          surahNumber: manifest.surahNumber,
          ayahNumber: segment.ayahNumber,
          startMs: segment.startMs,
          endMs: segment.endMs,
        }))}
        onAyahChange={onAyahChange}
        playerLabel={t("web.corpus.tilawahPlayerLabel")}
        playLabel={t("web.corpus.playTilawah")}
        pauseLabel={t("web.corpus.pauseTilawah")}
        muteLabel={t("web.corpus.muteTilawah")}
        unmuteLabel={t("web.corpus.unmuteTilawah")}
      />

      <p className="text-xs text-muted">
        {t("web.corpus.tilawahRights", { license: manifest.licenseType })}
      </p>
    </div>
  );
}
