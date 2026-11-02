"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto,
  type ProjectProgressSummaryDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  MetricList,
  MetricRow,
  SidebarBrand,
} from "@moonwitness/ui";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpenCheck,
  Boxes,
  KeyRound,
  Plug,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "../features/locale/locale-switcher";
import { apiErrorMessage } from "../features/locale/api-error-message";
import { useMessages } from "../features/locale/messages";
import { useTranslationCatalog } from "../features/locale/translation-catalog";
import { useLocalePreference } from "../features/locale/use-locale-preference";

export default function LandingPage() {
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [progressSummary, setProgressSummary] =
    useState<ProjectProgressSummaryDto | null>(null);
  const [progressError, setProgressError] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);
  const { locale, changeLocale, saving, error: localeError } =
    useLocalePreference(user);
  const copy = useMessages();
  const { t } = useTranslationCatalog();

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
        setUser(null);
        setLoadError(requestError);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .projectProgressSummary()
      .then((summary) => {
        if (!cancelled) setProgressSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setProgressError(true);
      })
      .finally(() => {
        if (!cancelled) setProgressLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardHref = user
    ? "/command-center"
    : `/auth?locale=${locale}`;
  const loadErrorMessage =
    loadError === null ? null : apiErrorMessage(loadError, t);

  return (
    <main className="ql-hud-app min-h-dvh">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-10">
        <SidebarBrand href="/" icon={<Sparkles aria-hidden="true" size={18} />} />
        <nav
          className="ml-auto flex items-center gap-2"
          aria-label={copy.common.mainNavigation}
        >
          <LocaleSwitcher
            locale={locale}
            label={copy.common.localeLabel}
            onChange={(nextLocale) => void changeLocale(nextLocale)}
            disabled={user === undefined || saving}
          />
          <Link
            href={`/auth?mode=login&locale=${locale}`}
            className="hidden text-sm font-medium text-ink-soft underline-offset-4 hover:text-acid hover:underline sm:inline"
          >
            {copy.landing.login}
          </Link>
          <Button
            onClick={() => window.location.assign(dashboardHref)}
            disabled={user === undefined}
          >
            {user
              ? copy.landing.signedInAction
              : copy.landing.primaryAction}{" "}
            <ArrowRight aria-hidden="true" size={16} />
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[68dvh] w-full max-w-7xl items-center gap-12 px-5 py-14 md:grid-cols-[1.08fr_0.92fr] md:px-10 md:py-20">
        <div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-ink md:text-7xl">
            {copy.landing.title}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-ink-soft md:text-lg md:leading-8">
            {copy.landing.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => window.location.assign(dashboardHref)}>
              {user
                ? copy.landing.signedInAction
                : copy.landing.primaryAction}
              <ArrowRight aria-hidden="true" size={16} />
            </Button>
            <Link
              href="#ecosystem-context"
              className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-ink-soft underline-offset-4 hover:text-acid hover:underline"
            >
              {copy.landing.ecosystemLinkLabel}
              <ArrowDownRight aria-hidden="true" size={15} />
            </Link>
          </div>
          {loadErrorMessage !== null && (
            <Alert className="mt-6 max-w-xl" variant="error">
              {loadErrorMessage}
            </Alert>
          )}
          {localeError !== null && (
            <Alert className="mt-3 max-w-xl" variant="error">
              {copy.landing.localeSaveError}
            </Alert>
          )}
        </div>

        <aside
          id="product-direction"
          className="ql-card bg-panel-edge/90 p-6 md:p-8"
          aria-labelledby="product-direction-title"
        >
          <div className="flex items-center justify-between gap-4">
            <h2
              id="product-direction-title"
              className="text-sm font-semibold tracking-wide text-ink-soft"
            >
              {copy.landing.productDirection}
            </h2>
            <Badge variant="outline">{copy.common.statusProposed}</Badge>
          </div>
          <ol className="mt-7 space-y-0">
            {copy.landing.journey.map((step, index) => (
              <li
                key={step}
                className="flex min-h-10 items-center gap-4 border-t border-hairline-soft py-2.5"
              >
                <span className="w-6 shrink-0 text-xs tabular-nums text-acid-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-ink-soft">{step}</span>
                {index === 0 && (
                  <BookOpenCheck
                    aria-hidden="true"
                    size={15}
                    className="ml-auto text-acid"
                  />
                )}
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm leading-6 text-muted">
            {copy.landing.journeyNote}
          </p>
        </aside>
      </section>

      <section
        id="ecosystem-context"
        className="mx-auto w-full max-w-7xl border-t border-hairline px-5 py-10 md:px-10 md:py-12"
        aria-labelledby="ecosystem-context-title"
      >
        <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:gap-8">
          <h2
            id="ecosystem-context-title"
            className="max-w-md text-2xl font-semibold leading-tight tracking-tight text-ink"
          >
            {copy.landing.ecosystemContextTitle}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-ink-soft md:text-base">
            {copy.landing.ecosystemContext}
          </p>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-7xl border-t border-hairline px-5 py-12 md:px-10 md:py-16"
        aria-labelledby="current-foundation-title"
      >
        <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2
              id="current-foundation-title"
              className="max-w-md text-2xl font-semibold leading-tight tracking-tight text-ink md:text-3xl"
            >
              {copy.landing.currentFoundation}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">
              {copy.landing.currentFoundationDescription}
            </p>
          </div>
          <ul className="grid content-start gap-x-8 sm:grid-cols-2">
            <li className="flex items-center gap-3 border-t border-hairline py-4 text-sm text-ink-soft">
              <Sparkles aria-hidden="true" size={17} className="text-acid" />
              {copy.landing.foundationChat}
            </li>
            <li className="flex items-center gap-3 border-t border-hairline py-4 text-sm text-ink-soft">
              <Boxes aria-hidden="true" size={17} className="text-acid" />
              {copy.landing.foundationModels}
            </li>
            <li className="flex items-center gap-3 border-t border-hairline py-4 text-sm text-ink-soft">
              <KeyRound aria-hidden="true" size={17} className="text-acid" />
              {copy.landing.foundationProviders}
            </li>
            <li className="flex items-center gap-3 border-t border-hairline py-4 text-sm text-ink-soft">
              <Plug aria-hidden="true" size={17} className="text-acid" />
              {copy.landing.foundationConnectors}
            </li>
          </ul>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-7xl border-t border-hairline px-5 py-10 md:px-10 md:py-12"
        aria-labelledby="project-progress-title"
      >
        <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:gap-8">
          <div>
            <h2
              id="project-progress-title"
              className="max-w-md text-2xl font-semibold leading-tight tracking-tight text-ink"
            >
              {copy.landing.progressTitle}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              {copy.landing.progressDescription}
            </p>
          </div>
          <div>
            {progressLoading && (
              <p role="status" className="text-sm text-ink-soft">
                {copy.landing.progressLoading}
              </p>
            )}
            {progressError && (
              <Alert variant="error">{copy.landing.progressError}</Alert>
            )}
            {progressSummary && (
              <>
                <MetricList className="grid gap-x-6 border-y border-hairline sm:grid-cols-3">
                  <MetricRow
                    label={copy.landing.progressDone}
                    value={`${progressSummary.states.done} / ${progressSummary.total}`}
                  />
                  <MetricRow
                    label={copy.landing.progressReady}
                    value={progressSummary.readyCount}
                  />
                  <MetricRow
                    label={copy.landing.progressBlocked}
                    value={progressSummary.states.blocked}
                    divided={false}
                  />
                </MetricList>
                <p className="mt-3 text-xs leading-5 text-muted">
                  {copy.landing.progressNote}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl border-t border-hairline px-5 py-6 text-xs leading-5 text-muted md:px-10">
        {copy.landing.footer}
      </footer>
    </main>
  );
}
