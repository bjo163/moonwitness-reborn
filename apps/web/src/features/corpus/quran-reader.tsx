"use client";

import {
  MoonClientError,
  type AuthUserDto,
  moonClient,
  type CorpusPassageDto,
  type CorpusSurahDto,
  type ReciterListItemDto,
  type SurahAudioManifestResponseDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  SanctuaryHeader,
  AmbientAtmosphere,
  ChimeToggle,
  SanctuaryZenStage,
  microChimeEngine,
  AyahProofCard,
} from "@moonwitness/ui";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";
import { authorityLabel } from "./corpus-labels";
import { TilawahRegion } from "./tilawah-region";

/**
 * The reader. Arabic verbatim renders right-to-left under a heading that
 * names it as `Qur'anic text` and shows the edition attribution; a
 * translation renders left-to-right under a heading that names it as
 * `Translation` (never `Qur'an`) and shows the translator/publisher
 * attribution. Every passage row carries `authority` and
 * `edition_attribution_text` from the API (see
 * `packages/ql_corpus/services/reader-service.ts`), so a translation can
 * never be silently displayed as if it were the source text.
 *
 * This component does **not** import from `ql_corpus`; the authority label
 * is derived from the DTO's `authority` string and localized through the
 * shared UI catalog. The workspace's browser-boundary rule
 * (`packages/eslint-config/index.js`) enforces that.
 */
function isArabicVerbatim(passage: CorpusPassageDto | undefined): boolean {
  return (
    passage?.authority === "revelation_verbatim" &&
    /^ar(-|$)/i.test(passage.edition_locale)
  );
}

function headingFor(
  reading: CorpusSurahDto,
  t: ReturnType<typeof useTranslationCatalog>["t"],
): string {
  if (reading.editionAuthority === "revelation_verbatim") {
    return t("web.corpus.quranHeading");
  }
  if (reading.editionAuthority === "translation") {
    return t("web.corpus.translationHeading");
  }
  return t("web.corpus.attributedHeading", {
    authority: reading.editionAuthority,
  });
}

/**
 * Whose voice the reader asks for: keep the reciter the reader was already
 * playing, otherwise the first row of the registry. The registry is ordered by
 * slug server-side, so the fallback is stable across reloads.
 */
function preferredReciterSlug(
  registry: readonly ReciterListItemDto[],
  current: string,
): string {
  return registry.some((reciter) => reciter.slug === current)
    ? current
    : (registry[0]?.slug ?? "");
}

export default function QuranReader() {
  const { t } = useTranslationCatalog();
  const params = useParams<{ editionKey: string; surah: string }>();
  const editionKey = params ? decodeURIComponent(params.editionKey) : "";
  const surah = params ? Number.parseInt(params.surah, 10) : 1;
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  useLocalePreference(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<CorpusSurahDto | null>(null);
  const [zenActive, setZenActive] = useState(false);
  const [chimeEnabled, setChimeEnabled] = useState(false);
  const [activeAyah, setActiveAyah] = useState<number>(1);
  const [proofAyah, setProofAyah] = useState<CorpusPassageDto | null>(null);
  /**
   * Track 05. `null` means the registry has not answered yet. There is no
   * placeholder reciter and no placeholder timeline: the reader waits for the
   * rows, and says so when the rows do not exist.
   */
  const [reciters, setReciters] = useState<ReciterListItemDto[] | null>(null);
  const [reciterSlug, setReciterSlug] = useState("");
  const [audioManifest, setAudioManifest] =
    useState<SurahAudioManifestResponseDto | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  /**
   * The verification deep link is copied as an absolute URL, so it is built
   * only once the browser origin is known. The server render omits it instead
   * of guessing a host — a proof link pointing at the wrong domain is worse
   * than no link.
   */
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setChimeEnabled(microChimeEngine.isEnabled());
  }, []);

  const handleToggleChime = useCallback((next: boolean) => {
    microChimeEngine.setEnabled(next);
    setChimeEnabled(next);
    if (next) {
      microChimeEngine.play("affirmation");
    }
  }, []);

  const handleEnterZen = useCallback(() => {
    setZenActive(true);
    microChimeEngine.play("contemplation");
  }, []);

  const handleExitZen = useCallback(() => {
    setZenActive(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .currentUser()
      .then(({ user: currentUser }) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        if (requestError instanceof MoonClientError && requestError.status === 401) {
          setUser(null);
          return;
        }
        setError(apiErrorMessage(requestError, t));
        setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!editionKey) return;
    setLoading(true);
    setError(null);
    void moonClient
      .readCorpusSurah(editionKey, surah)
      .then((response) => setReading(response.reading))
      .catch((requestError: unknown) => {
        setError(apiErrorMessage(requestError, t));
        setReading(null);
      })
      .finally(() => setLoading(false));
  }, [editionKey, surah, t]);

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .getReciters()
      .then(({ reciters: registry }) => {
        if (cancelled) return;
        setReciters(registry);
        setReciterSlug((current) =>
          registry.some((reciter) => reciter.slug === current)
            ? current
            : (registry[0]?.slug ?? ""),
        );
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        setReciters([]);
        setAudioError(apiErrorMessage(requestError, t));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!reciterSlug) return;
    let cancelled = false;
    setAudioError(null);
    setAudioManifest(null);
    void moonClient
      .getSurahAudioManifest(reciterSlug, surah)
      .then((manifest) => {
        if (!cancelled) setAudioManifest(manifest);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        setAudioError(apiErrorMessage(requestError, t));
      });
    return () => {
      cancelled = true;
    };
  }, [reciterSlug, surah, t]);

  const rtl = isArabicVerbatim(reading?.passages[0]);
  const primaryPassage = reading?.passages[0];
  const proofTarget =
    reading && proofAyah
      ? {
          editionKey: reading.editionKey,
          surah: proofAyah.surah || surah,
          ayah: proofAyah.ayah,
          hash: proofAyah.text_checksum,
        }
      : null;
  const verificationQuery = proofTarget
    ? `/corpus/verify?${new URLSearchParams({
        edition: proofTarget.editionKey,
        surah: String(proofTarget.surah),
        ayah: String(proofTarget.ayah),
        hash: proofTarget.hash,
      }).toString()}`
    : "";
  const verificationUri =
    origin && verificationQuery ? `${origin}${verificationQuery}` : undefined;

  return (
    <main className="ql-hud-app relative min-h-dvh bg-panel-deep text-ink-soft">
      {/* Universal Ambient Atmosphere Canvas (Track 11) */}
      <AmbientAtmosphere density="subtle" />

      {/* Sanctuary Zen Mode Overlay (Track 14) */}
      {zenActive && primaryPassage && (
        <SanctuaryZenStage
          arabicText={primaryPassage.text}
          citation={primaryPassage.locator || `Surah ${surah}:${primaryPassage.ayah}`}
          surahNumber={surah}
          ayahNumber={primaryPassage.ayah}
          onExit={handleExitZen}
          exitLabel={t("web.corpus.exitZenMode")}
        />
      )}

      <SanctuaryHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span>MoonWitness · Corpus</span>
            <span>&middot;</span>
            <span>{reading ? headingFor(reading, t) : t("web.corpus.shelfTitle")}</span>
          </span>
        }
        title={t("web.corpus.surahTitle", { surah })}
        actions={
          <div className="flex items-center gap-2">
            <ChimeToggle
              enabled={chimeEnabled}
              onToggle={handleToggleChime}
              label={chimeEnabled ? t("web.common.chimeToggleActive") : t("web.common.chimeToggleMuted")}
            />
            {reading && reading.passages.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleEnterZen}
                className="gap-1.5"
              >
                <Sparkles size={14} aria-hidden="true" />
                <span>{t("web.corpus.zenModeToggle")}</span>
              </Button>
            )}
            <Link
              href="/corpus"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-hairline bg-panel hover:border-acid hover:text-acid transition-colors"
            >
              <ArrowLeft aria-hidden="true" size={14} />
              <span>{t("web.corpus.backToShelf")}</span>
            </Link>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10 md:py-12 space-y-8">
        {loading && (
          <p role="status" className="text-sm text-muted">
            {t("web.corpus.loadingSurah")}
          </p>
        )}
        {error && <Alert variant="error">{error}</Alert>}
        {!loading && reading && reading.passages.length === 0 && (
          <Alert variant="info">
            {t("web.corpus.emptySurah")}
          </Alert>
        )}
        {reading && reading.passages.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant={rtl ? "live" : "outline"}>
                  {authorityLabel(
                    reading.editionAuthority,
                    reading.editionLocale,
                    t,
                  )}
                </Badge>
                <span className="text-muted uppercase tracking-wider">{reading.editionLocale}</span>
                <span className="text-muted">·</span>
                <span className="text-ink-soft font-medium">
                  {reading.passages[0]?.edition_attribution_text}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <TilawahRegion
                reciters={reciters}
                reciterSlug={reciterSlug}
                manifest={audioManifest}
                error={audioError}
                surahNumber={surah}
                activeAyahNumber={activeAyah}
                onSelectReciter={setReciterSlug}
                onAyahChange={setActiveAyah}
                t={t}
              />

              {proofAyah && (
                <div className="relative">
                  <div className="flex justify-between items-center mb-2 gap-3">
                    <span className="text-xs text-acid font-mono font-medium">
                      {t("web.corpus.proofPanelTitle")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {verificationQuery ? (
                        <Link
                          href={verificationQuery}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-hairline bg-panel hover:border-acid hover:text-acid transition-colors"
                        >
                          <ShieldCheck size={12} aria-hidden="true" />
                          <span>{t("web.corpus.verifyAction")}</span>
                        </Link>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setProofAyah(null)}
                        className="text-xs text-muted hover:text-ink"
                        aria-label={t("web.corpus.closeProofPanel")}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  <AyahProofCard
                    surahNumber={proofTarget?.surah ?? surah}
                    ayahNumber={proofAyah.ayah}
                    text={proofAyah.text}
                    editionCode={reading.editionKey}
                    editionName={reading.passages[0]?.edition_attribution_text || reading.editionKey}
                    proofHash={proofAyah.text_checksum}
                    verificationUri={verificationUri}
                    proofBadgeLabel={t("web.corpus.sha256ProofBadge")}
                    digestLabel={t("web.corpus.proofDigest")}
                    copyLabel={t("web.corpus.copyProofButton")}
                    copiedLabel={t("web.corpus.proofCopiedNotice")}
                    copyFailedLabel={t("web.corpus.copyProofFailed")}
                  />
                </div>
              )}
            </div>

            <ol
              className="space-y-6"
              dir={rtl ? "rtl" : "ltr"}
              lang={rtl ? "ar" : reading.editionLocale}
            >
              {reading.passages.map((passage) => (
                <li
                  key={passage.id}
                  className={`group relative rounded-xl border p-6 md:p-8 backdrop-blur transition-all ${
                    passage.ayah === activeAyah
                      ? "border-acid bg-panel shadow-[0_0_24px_var(--ql-glow-gold)]"
                      : "border-hairline-strong bg-panel/70 hover:border-acid/60 hover:shadow-[0_0_20px_var(--ql-glow-gold)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
                    <span className="text-xs font-mono font-semibold tracking-wider text-acid">
                      {passage.locator}
                    </span>
                    <Badge variant="outline">
                      {passage.row_kind === "ayah"
                        ? t("web.corpus.rowKindAyah")
                        : passage.row_kind === "translation"
                          ? t("web.corpus.rowKindTranslation")
                          : t("web.corpus.rowKindOther", {
                              kind: passage.row_kind,
                            })}
                    </Badge>
                  </div>
                  <p
                    className={
                      rtl
                        ? "mt-5 text-2xl md:text-3xl font-serif leading-[2.6] text-ink text-right"
                        : "mt-4 text-base md:text-lg leading-relaxed text-ink-soft text-left"
                    }
                  >
                    {passage.text}
                  </p>
                  <div className="mt-5 pt-3 border-t border-hairline-soft flex items-center justify-between text-[11px] text-muted">
                    <span>
                      {authorityLabel(
                        passage.authority,
                        passage.edition_locale,
                        t,
                      )}{" "}
                      · {passage.edition_publisher}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActiveAyah(passage.ayah);
                          setProofAyah(passage);
                        }}
                        className="text-[10px] h-6 px-1.5 font-mono text-muted hover:text-acid gap-1"
                        aria-label={t("web.corpus.sha256ProofBadge")}
                      >
                        <ShieldCheck size={12} aria-hidden="true" />
                        <span>{t("web.corpus.checksum")} {passage.text_checksum.slice(0, 8)}…</span>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted text-center pt-6">
              {t("web.corpus.readerDisclaimer")}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
