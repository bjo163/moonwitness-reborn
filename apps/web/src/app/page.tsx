"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto,
  type LandingViewItemDto,
  type LandingViewSection,
  type ProjectProgressSummaryDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  MetricList,
  MetricRow,
  HeroStage,
  NavLink,
  PortalCard,
  SidebarBrand,
} from "@moonwitness/ui";
import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  ChevronDown,
  ChevronRight,
  Compass,
  KeyRound,
  Landmark,
  Moon,
  Plug,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LocaleSwitcher } from "../features/locale/locale-switcher";
import { apiErrorMessage } from "../features/locale/api-error-message";
import { useMessages } from "../features/locale/messages";
import { translateMetadata } from "../features/locale/translate-metadata";
import {
  type UiMessageKey,
  useTranslationCatalog,
} from "../features/locale/translation-catalog";
import { useLocalePreference } from "../features/locale/use-locale-preference";

const BRAND_NAME = "A-L-L-A-H.COM";
const BRAND_ECOSYSTEM = "Empire of the Light";
const BRAND_DECLARATION = "Only You. Your Deeds. And ALLAH.";

const LANDING_SECTIONS: readonly {
  section: LandingViewSection;
  titleKey: UiMessageKey;
  descriptionKey: UiMessageKey;
}[] = [
  {
    section: "knowledge",
    titleKey: "web.landing.sections.knowledge.title",
    descriptionKey: "web.landing.sections.knowledge.description",
  },
  {
    section: "research",
    titleKey: "web.landing.sections.research.title",
    descriptionKey: "web.landing.sections.research.description",
  },
  {
    section: "foundation",
    titleKey: "web.landing.sections.foundation.title",
    descriptionKey: "web.landing.sections.foundation.description",
  },
];

export default function LandingPage() {
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [landingItems, setLandingItems] = useState<LandingViewItemDto[]>([]);
  const [progressSummary, setProgressSummary] =
    useState<ProjectProgressSummaryDto | null>(null);
  const [progressError, setProgressError] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);
  const { locale, changeLocale, saving, error: localeError } =
    useLocalePreference(user);
  const copy = useMessages();
  const { t, tm } = useTranslationCatalog();

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
      .landingCatalog()
      .then((catalog) => {
        if (!cancelled) setLandingItems(catalog.items);
      })
      .catch(() => {
        if (!cancelled) setLandingItems([]);
      });
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

  const groupedSections = useMemo(
    () =>
      LANDING_SECTIONS.map((meta) => ({
        ...meta,
        items: landingItems.filter((item) => item.section === meta.section),
      })).filter((group) => group.items.length > 0),
    [landingItems],
  );

  const dashboardHref = user
    ? "/command-center"
    : `/auth?locale=${locale}`;
  const loadErrorMessage =
    loadError === null ? null : apiErrorMessage(loadError, t);

  const portals: readonly {
    title: string;
    description: string;
    href: string;
    icon: ReactNode;
    proposed?: boolean;
  }[] = [
    {
      title: "MoonWitness",
      description: copy.landing.portalMoonWitness,
      href: "/corpus",
      icon: <Moon aria-hidden="true" size={22} />,
    },
    {
      title: "Dock",
      description: copy.landing.portalDock,
      href: "#product-direction",
      icon: <Users aria-hidden="true" size={22} />,
      proposed: true,
    },
    {
      title: "Cockpit",
      description: copy.landing.portalCockpit,
      href: "/command-center",
      icon: <Compass aria-hidden="true" size={22} />,
    },
    {
      title: "Headquarter",
      description: copy.landing.portalHeadquarter,
      href: "/admin/users",
      icon: <Landmark aria-hidden="true" size={22} />,
    },
  ];
  return (
    <main className="ql-hud-app min-h-dvh">
      <HeroStage imageSrc="/hero-empire.jpg">
        <header className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-4 md:px-10">
          <SidebarBrand
            href="/"
            label={BRAND_NAME}
            icon={<Sparkles aria-hidden="true" size={18} />}
          />
          <nav
            className="ql-topnav order-3 w-full lg:order-none lg:w-auto"
            aria-label={copy.common.mainNavigation}
          >
            <NavLink href="/" active>
              {copy.landing.navHome}
            </NavLink>
            <NavLink href="#portals">{copy.landing.navPortals}</NavLink>
            <NavLink href="#ecosystem-context">
              {copy.landing.navEcosystem}
            </NavLink>
            <NavLink href="#product-direction">
              {copy.landing.navJourney}
            </NavLink>
            <NavLink href="#project-progress">
              {copy.landing.navProgress}
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher
              locale={locale}
              label={copy.common.localeLabel}
              onChange={(nextLocale) => void changeLocale(nextLocale)}
              disabled={user === undefined || saving}
            />
            <Link
              href={`/auth?mode=login&locale=${locale}`}
              className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-ink-soft underline-offset-4 hover:text-acid hover:underline"
            >
              {copy.landing.login}
            </Link>
          </div>
        </header>

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-10 px-5 py-10 md:px-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-xl">
            <p className="ql-hero__eyebrow">{copy.landing.heroEyebrow}</p>
            <h1 className="ql-hero__title">{BRAND_NAME}</h1>
            <p className="ql-hero__subtitle">{BRAND_ECOSYSTEM}</p>
            <p className="ql-hero__tagline">{copy.landing.heroTagline}</p>
            <p className="mt-5 max-w-md text-sm leading-7 text-ink-soft md:text-base">
              {copy.landing.heroNarrative}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => window.location.assign(dashboardHref)}
                disabled={user === undefined}
              >
                {user ? copy.landing.signedInAction : copy.landing.enterUniverse}
                <ArrowRight aria-hidden="true" size={16} />
              </Button>
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
          <blockquote className="ql-hero__declaration max-w-[16rem] lg:text-right">
            <p>&ldquo;{BRAND_DECLARATION}&rdquo;</p>
          </blockquote>
        </div>

        <div
          id="portals"
          className="relative mx-auto w-full max-w-7xl px-5 pb-5 md:px-10"
        >
          <ul className="ql-portal-grid" aria-label={copy.landing.portalsLabel}>
            {portals.map((portal) => (
              <li key={portal.title}>
                <PortalCard
                  href={portal.href}
                  title={portal.title}
                  description={portal.description}
                  icon={portal.icon}
                  arrow={<ChevronRight aria-hidden="true" size={16} />}
                  status={portal.proposed ? copy.common.statusProposed : undefined}
                />
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline pt-4">
            <p className="text-xs font-medium tracking-[0.22em] text-ink-soft">
              {copy.landing.footerValues}
            </p>
            <Link
              href="#ecosystem-context"
              className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-semibold tracking-[0.18em] text-acid uppercase underline-offset-4 hover:underline"
            >
              {copy.landing.ecosystemLinkLabel}
              <ChevronDown aria-hidden="true" size={14} />
            </Link>
          </div>
        </div>
      </HeroStage>

      <section
        id="ecosystem-context"
        className="mx-auto w-full max-w-7xl px-5 py-14 md:px-10 md:py-20"
        aria-labelledby="ecosystem-context-title"
      >
        <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:gap-8">
          <h2
            id="ecosystem-context-title"
            className="ql-display max-w-md text-3xl leading-tight text-ink md:text-4xl"
          >
            {copy.landing.ecosystemContextTitle}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-ink-soft md:text-base">
            {copy.landing.ecosystemContext}
          </p>
        </div>
      </section>

      <section
        id="product-direction"
        className="mx-auto w-full max-w-7xl border-t border-hairline px-5 py-12 md:px-10 md:py-16"
        aria-labelledby="product-direction-title"
      >
        <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="flex items-center gap-3">
              <h2
                id="product-direction-title"
                className="ql-display text-3xl leading-tight text-ink md:text-4xl"
              >
                {copy.landing.productDirection}
              </h2>
              <Badge variant="outline">{copy.common.statusProposed}</Badge>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">
              {copy.landing.journeyNote}
            </p>
          </div>
          <ol className="grid content-start gap-x-8 sm:grid-cols-2">
            {copy.landing.journey.map((step, index) => (
              <li
                key={step}
                className="flex min-h-11 items-center gap-4 border-t border-hairline-soft py-2.5"
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
        </div>
      </section>

      {groupedSections.length > 0 ? (
        groupedSections.map((group) => (
          <section
            key={group.section}
            className="mx-auto w-full max-w-7xl border-t border-hairline px-5 py-12 md:px-10 md:py-16"
            aria-labelledby={`landing-section-${group.section}`}
          >
            <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr]">
              <div>
                <h2
                  id={`landing-section-${group.section}`}
                  className="ql-display max-w-md text-3xl leading-tight text-ink md:text-4xl"
                >
                  {t(group.titleKey)}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted">
                  {t(group.descriptionKey)}
                </p>
              </div>
              <ul className="divide-y divide-hairline border-y border-hairline">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="group flex items-start justify-between gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <Boxes
                            aria-hidden="true"
                            size={16}
                            className="shrink-0 text-acid"
                          />
                          <span className="text-sm font-medium text-ink group-hover:text-acid">
                            {translateMetadata(item.titleKey, item.model, tm)}
                          </span>
                          <Badge variant="outline">{item.addon}</Badge>
                        </span>
                        <span className="mt-1.5 block text-sm leading-6 text-muted">
                          {translateMetadata(item.descriptionKey, "", tm)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {item.recordCount !== null && item.recordCount > 0 && (
                          <Badge variant="outline">
                            {t("web.landing.recordCount", {
                              count: item.recordCount,
                            })}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            item.status === "available" ? "live" : "outline"
                          }
                        >
                          {item.status === "available"
                            ? copy.common.statusAvailable
                            : copy.common.statusProposed}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))
      ) : (
        <section
          className="mx-auto w-full max-w-7xl border-t border-hairline px-5 py-12 md:px-10 md:py-16"
          aria-labelledby="current-foundation-title"
        >
          <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h2
                id="current-foundation-title"
                className="ql-display max-w-md text-3xl leading-tight text-ink md:text-4xl"
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
      )}

      <section
        id="project-progress"
        className="mx-auto w-full max-w-7xl border-t border-hairline px-5 py-10 md:px-10 md:py-12"
        aria-labelledby="project-progress-title"
      >
        <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:gap-8">
          <div>
            <h2
              id="project-progress-title"
              className="ql-display max-w-md text-3xl leading-tight text-ink md:text-4xl"
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
