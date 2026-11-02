"use client";

import {
  MoonClientError,
  type AuthUserDto,
  moonClient,
  type CorpusPassageDto,
  type CorpusSurahDto,
} from "@moonwitness/moonclient";
import { Alert, Badge, PageHeader } from "@moonwitness/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

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

function authorityLabel(
  authority: string,
  locale: string,
  t: ReturnType<typeof useTranslationCatalog>["t"],
): string {
  if (authority === "revelation_verbatim") {
    return t("web.corpus.authorityVerbatim", { locale });
  }
  if (authority === "translation") {
    return t("web.corpus.authorityTranslation", { locale });
  }
  return t("web.corpus.authorityAttributed", { authority });
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

  const rtl = isArabicVerbatim(reading?.passages[0]);
  return (
    <main className="ql-hud-app min-h-dvh bg-panel-deep px-5 py-8 text-ink-soft md:px-10 md:py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageHeader
          title={t("web.corpus.surahTitle", { surah })}
          description={reading ? headingFor(reading, t) : undefined}
          actions={
            <Link href="/corpus" className="text-xs text-acid-muted hover:underline">
              <ArrowLeft aria-hidden="true" className="mr-1 inline" size={13} />
              {t("web.corpus.backToShelf")}
            </Link>
          }
        />
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
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={rtl ? "live" : "outline"}>
                {authorityLabel(
                  reading.editionAuthority,
                  reading.editionLocale,
                  t,
                )}
              </Badge>
              <span className="text-muted">{reading.editionLocale}</span>
              <span className="text-muted">·</span>
              <span className="text-ink-soft">
                {reading.passages[0]?.edition_attribution_text}
              </span>
            </div>
            <ol
              className="space-y-4"
              dir={rtl ? "rtl" : "ltr"}
              lang={rtl ? "ar" : reading.editionLocale}
            >
              {reading.passages.map((passage) => (
                <li
                  key={passage.id}
                  className="rounded-lg border border-hairline bg-panel-deep p-4"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[11px] font-mono text-acid-muted">
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
                        ? "mt-3 text-2xl leading-[2.4] text-ink"
                        : "mt-3 text-base leading-7 text-ink-soft"
                    }
                  >
                    {passage.text}
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-wide text-muted">
                    {authorityLabel(
                      passage.authority,
                      passage.edition_locale,
                      t,
                    )}{" "}
                    · {passage.edition_publisher} · {t("web.corpus.checksum")}{" "}
                    {passage.text_checksum.slice(0, 8)}…
                  </p>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted">
              {t("web.corpus.readerDisclaimer")}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
