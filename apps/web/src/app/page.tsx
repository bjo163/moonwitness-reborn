"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto,
  type LandingViewItemDto,
  type LandingViewSection,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  HeroStage,
  NavLink,
  PortalCard,
  SidebarBrand,
  SpatialRegion,
  ThemeToggle,
  TransmissionCard,
} from "@moonwitness/ui";
import {
  ArrowRight,
  Boxes,
  ChevronDown,
  ChevronRight,
  Compass,
  FileText,
  Globe,
  Home,
  Lock,
  Moon,
  Radio,
  Scroll,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LocaleSwitcher } from "../features/locale/locale-switcher";
import { apiErrorMessage } from "../features/locale/api-error-message";
import { useMessages } from "../features/locale/messages";
import { translateMetadata } from "../features/locale/translate-metadata";
import {
  type UiMessageKey,
  useTranslationCatalog,
} from "../features/locale/translation-catalog";
import { useLocalePreference } from "../features/locale/use-locale-preference";
import { useThemePreference } from "../features/theme/use-theme-preference";

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
  const { locale, changeLocale, saving, error: localeError } =
    useLocalePreference(user);
  const { theme, toggleTheme } = useThemePreference();
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

  return (
    <main className="ql-hud-app min-h-dvh">
      <Link
        href="#the-universe"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:border focus:border-acid focus:bg-panel-edge focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-acid"
      >
        {copy.common.skipToContent}
      </Link>
      {/* =========================================================================
          MOVEMENT 01: ARRIVAL / THE GATE (HeroStage)
         ========================================================================= */}
      <HeroStage imageSrc="/hero-empire.jpg">
        <header className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 md:px-10">
          <SidebarBrand
            href="/"
            label={BRAND_NAME}
            icon={
              <img
                src="/brand/emblem.svg"
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
                className="size-5 text-acid"
              />
            }
          />
          <nav
            className="ql-topnav order-3 flex flex-wrap items-center gap-1 w-full lg:order-none lg:w-auto"
            aria-label={copy.common.mainNavigation}
          >
            <NavLink href="/" active className="inline-flex items-center gap-1.5">
              <Home aria-hidden="true" size={14} />
              <span>{copy.landing.navHome}</span>
            </NavLink>
            <NavLink href="#the-universe" className="inline-flex items-center gap-1.5">
              <Globe aria-hidden="true" size={14} />
              <span>{copy.landing.navPortals}</span>
            </NavLink>
            <NavLink href="#explore-knowledge" className="inline-flex items-center gap-1.5">
              <Scroll aria-hidden="true" size={14} />
              <span>{copy.landing.navExplore}</span>
            </NavLink>
            <NavLink href="#transmissions" className="inline-flex items-center gap-1.5">
              <Radio aria-hidden="true" size={14} />
              <span>{copy.landing.navTransmissions}</span>
            </NavLink>
            <NavLink href="#discover" className="inline-flex items-center gap-1.5">
              <Compass aria-hidden="true" size={14} />
              <span>{copy.landing.navDiscover}</span>
            </NavLink>
            <NavLink href="#community-dock" className="inline-flex items-center gap-1.5">
              <Users aria-hidden="true" size={14} />
              <span>{copy.landing.navDock}</span>
            </NavLink>
            <NavLink href="#your-journey" className="inline-flex items-center gap-1.5">
              <Boxes aria-hidden="true" size={14} />
              <span>{copy.landing.navJourney}</span>
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href={user ? "/command-center/search" : "/corpus"}
              aria-label={copy.common.searchAction}
              title={copy.common.searchAction}
              className="ql-nav-link inline-flex min-h-11 min-w-11 items-center justify-center"
            >
              <Search aria-hidden="true" size={16} />
            </Link>
            <ThemeToggle
              theme={theme}
              label={
                theme === "light"
                  ? copy.common.themeToDark
                  : copy.common.themeToLight
              }
              onToggle={toggleTheme}
            />
            <LocaleSwitcher
              locale={locale}
              label={copy.common.localeLabel}
              onChange={(nextLocale) => void changeLocale(nextLocale)}
              disabled={user === undefined || saving}
            />
            {user ? (
              <Link
                href="/command-center"
                aria-label={user.name || copy.common.account}
                className="inline-flex size-8 items-center justify-center rounded-full border border-hairline-strong bg-panel-edge text-xs font-semibold uppercase text-acid"
              >
                {(user.name?.[0] || "U").toUpperCase()}
              </Link>
            ) : (
              <Link
                href={`/auth?mode=login&locale=${locale}`}
                className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-ink-soft underline-offset-4 hover:text-acid hover:underline"
              >
                {copy.landing.login}
              </Link>
            )}
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

        {/* =========================================================================
            MOVEMENT 02: THE UNIVERSE (Portal Dock Strip)
           ========================================================================= */}
        <div
          id="the-universe"
          className="relative mx-auto w-full max-w-7xl px-5 pb-5 md:px-10"
        >
          {/* Mockup 4-tile horizontal glass dock: MoonWitness, Dock, Cockpit, Headquarter */}
          <ul
            className="ql-portal-dock"
            aria-label={copy.landing.portalsLabel}
          >
            <li>
              <PortalCard
                href="/corpus"
                title="MoonWitness"
                description={copy.landing.portalMoonWitness}
                icon={<Moon aria-hidden="true" size={22} />}
                arrow={<ChevronRight aria-hidden="true" size={16} />}
              />
            </li>
            <li>
              <PortalCard
                href="#community-dock"
                title="Dock"
                description={copy.landing.portalDock}
                icon={<Users aria-hidden="true" size={22} />}
                arrow={<ChevronRight aria-hidden="true" size={16} />}
                status={copy.common.statusProposed}
              />
            </li>
            <li>
              <PortalCard
                href="/command-center"
                title="Cockpit"
                description={copy.landing.portalCockpit}
                icon={<Compass aria-hidden="true" size={22} />}
                arrow={<ChevronRight aria-hidden="true" size={16} />}
              />
            </li>
            <li>
              <PortalCard
                href="/command-center"
                title="Headquarter"
                description={copy.landing.portalHeadquarter}
                icon={<Lock aria-hidden="true" size={22} />}
                arrow={<ChevronRight aria-hidden="true" size={16} />}
                status={copy.landing.portalHqRestricted}
              />
            </li>
          </ul>

          {/* Bottom Hero Base Bar (Mockup match): EST. 2026, Core Values, Scroll cue */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline pt-4">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-acid shadow-[0_0_8px_var(--ql-glow-gold)]"
              />
              <span className="text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase">
                {copy.landing.heroEst}
              </span>
            </div>
            <p className="text-xs font-medium tracking-[0.22em] text-ink-soft">
              {copy.landing.footerValues}
            </p>
            <Link
              href="#explore-knowledge"
              className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-semibold tracking-[0.18em] text-acid uppercase underline-offset-4 hover:underline"
            >
              <span>{copy.landing.scrollCue}</span>
              <ChevronDown aria-hidden="true" size={14} />
            </Link>
          </div>
        </div>
      </HeroStage>

      {/* =========================================================================
          MOVEMENT 03: EXPLORE (Knowledge Treasury & Paths)
         ========================================================================= */}
      <SpatialRegion
        id="explore-knowledge"
        eyebrow={copy.landing.m3Eyebrow}
        title={copy.landing.m3Title}
        description={copy.landing.m3Description}
      >
        {/* Editorial directory index: numbered horizontal rows, not equal card grid.
            Purpose: distinct visual language from other movements, content-driven composition. */}
        <ol className="divide-y divide-hairline border-y border-hairline" aria-label={copy.landing.m3DirectoryAria}>
          <li>
            <Link
              href="/corpus"
              className="group flex items-center gap-6 py-6 px-2 transition-colors hover:bg-panel-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
            >
              <span className="ql-display shrink-0 w-10 text-3xl font-bold text-hairline-strong group-hover:text-acid-muted transition-colors select-none" aria-hidden="true">01</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="ql-display text-xl text-ink group-hover:text-acid">{copy.landing.m3CorpusTitle}</h3>
                <p className="text-sm text-muted">{copy.landing.m3CorpusDesc}</p>
              </div>
              <span className="shrink-0 text-acid opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
                <ArrowRight size={20} />
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/research"
              className="group flex items-center gap-6 py-6 px-2 transition-colors hover:bg-panel-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
            >
              <span className="ql-display shrink-0 w-10 text-3xl font-bold text-hairline-strong group-hover:text-acid-muted transition-colors select-none" aria-hidden="true">02</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="ql-display text-xl text-ink group-hover:text-acid">{copy.landing.m3ResearchTitle}</h3>
                <p className="text-sm text-muted">{copy.landing.m3ResearchDesc}</p>
              </div>
              <span className="shrink-0 text-acid opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
                <ArrowRight size={20} />
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/models"
              className="group flex items-center gap-6 py-6 px-2 transition-colors hover:bg-panel-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
            >
              <span className="ql-display shrink-0 w-10 text-3xl font-bold text-hairline-strong group-hover:text-acid-muted transition-colors select-none" aria-hidden="true">03</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="ql-display text-xl text-ink group-hover:text-acid">{copy.landing.m3ModelsTitle}</h3>
                <p className="text-sm text-muted">{copy.landing.m3ModelsDesc}</p>
              </div>
              <span className="shrink-0 text-acid opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
                <ArrowRight size={20} />
              </span>
            </Link>
          </li>
        </ol>
      </SpatialRegion>

      {/* =========================================================================
          MOVEMENT 04: TRANSMISSIONS (Voice of MoonWitness)
         ========================================================================= */}
      <SpatialRegion
        id="transmissions"
        eyebrow={copy.landing.m4Eyebrow}
        title={copy.landing.m4Title}
        description={copy.landing.m4Description}
      >
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <TransmissionCard
            badge="Al-Qur'an · 1:1-7"
            title={copy.landing.m4FeaturedTitle}
            source={copy.landing.m4FeaturedSource}
            excerpt={copy.landing.m4FeaturedExcerpt}
            provenanceLabel={copy.landing.m4ProvenanceLabel}
            readActionLabel={copy.landing.m4ReadAction}
            href="/corpus"
            className="border-hairline-strong shadow-lg"
          />

          <div className="flex flex-col justify-between border border-hairline bg-panel-edge/80 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-acid">
                {copy.landing.m4PrincipleTitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {copy.landing.m4PrincipleBody}
              </p>
            </div>
            <div className="mt-6 border-t border-hairline-soft pt-4">
              <Link
                href="/corpus"
                className="inline-flex items-center gap-2 text-xs font-medium text-acid underline-offset-4 hover:underline"
              >
                <span>{copy.landing.m4MethodologyAction}</span>
                <ChevronRight aria-hidden="true" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </SpatialRegion>

      {/* =========================================================================
          MOVEMENT 05: DISCOVER (Context & Topical Pillars)
         ========================================================================= */}
      <SpatialRegion
        id="discover"
        eyebrow={copy.landing.m5Eyebrow}
        title={copy.landing.m5Title}
        description={copy.landing.m5Description}
      >
        {/* Inline compass strip: flowing flex tags, not uniform square tiles.
            Purpose: visually distinct from M02/M03/M06, encourages browsing not comparison. */}
        <nav aria-label={copy.landing.m5TopicsAria}>
          <ul className="flex flex-wrap gap-3">
            <li>
              <Link
                href="/corpus"
                className="inline-flex items-center gap-2 border border-hairline bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-acid hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid"
              >
                <Globe aria-hidden="true" size={16} className="shrink-0 text-acid" />
                {copy.landing.m5TopicFaith}
              </Link>
            </li>
            <li>
              <Link
                href="/research"
                className="inline-flex items-center gap-2 border border-hairline bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-acid hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid"
              >
                <Scroll aria-hidden="true" size={16} className="shrink-0 text-acid" />
                {copy.landing.m5TopicHistory}
              </Link>
            </li>
            <li>
              <Link
                href="/corpus"
                className="inline-flex items-center gap-2 border border-hairline bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-acid hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid"
              >
                <FileText aria-hidden="true" size={16} className="shrink-0 text-acid" />
                {copy.landing.m5TopicWisdom}
              </Link>
            </li>
            <li>
              <Link
                href="/models"
                className="inline-flex items-center gap-2 border border-hairline bg-panel px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-acid hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid"
              >
                <Sparkles aria-hidden="true" size={16} className="shrink-0 text-acid" />
                {copy.landing.m5TopicCosmos}
              </Link>
            </li>
          </ul>
        </nav>
      </SpatialRegion>

      {/* =========================================================================
          MOVEMENT 06: COMMUNITY (Dock Guidelines & Ethos)
         ========================================================================= */}
      <SpatialRegion
        id="community-dock"
        eyebrow={copy.landing.m6Eyebrow}
        title={copy.landing.m6Title}
        description={copy.landing.m6Description}
        actions={
          <Badge variant="outline">{copy.common.statusProposed}</Badge>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border border-hairline bg-panel p-6 md:p-8">
            <h3 className="ql-display text-2xl text-ink">
              {copy.landing.m6Pillar1}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {copy.landing.m6Pillar1Desc}
            </p>
          </div>

          <div className="border border-hairline bg-panel p-6 md:p-8">
            <h3 className="ql-display text-2xl text-ink">
              {copy.landing.m6Pillar2}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {copy.landing.m6Pillar2Desc}
            </p>
            <p className="mt-3 text-xs font-medium text-muted">
              [{copy.common.statusProposed}]
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end border-t border-hairline-soft pt-4">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-acid underline-offset-4 hover:underline"
          >
            <span>{copy.landing.m6DockAction}</span>
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </SpatialRegion>

      {/* =========================================================================
          MOVEMENT 07: YOUR JOURNEY (Open vs. Member Access)
         ========================================================================= */}
      <SpatialRegion
        id="your-journey"
        eyebrow={copy.landing.m7Eyebrow}
        title={copy.landing.m7Title}
        description={copy.landing.m7Description}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between border border-hairline bg-panel p-6 md:p-8">
            <div>
              <span className="inline-flex size-8 items-center justify-center border border-hairline-strong text-acid">
                <Globe aria-hidden="true" size={16} />
              </span>
              <h3 className="ql-display mt-4 text-2xl text-ink">
                {copy.landing.m7AnonTitle}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {copy.landing.m7AnonDesc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline-soft">
              <Link
                href="/corpus"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-acid underline-offset-4 hover:underline"
              >
                <span>{copy.landing.m7AnonAction}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between border border-acid/40 bg-panel-raised p-6 md:p-8">
            <div>
              <span className="inline-flex size-8 items-center justify-center border border-acid text-acid">
                <Lock aria-hidden="true" size={16} />
              </span>
              <h3 className="ql-display mt-4 text-2xl text-ink">
                {copy.landing.m7MemberTitle}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {copy.landing.m7MemberDesc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-hairline-soft">
              <Link
                href={`/auth?mode=login&locale=${locale}`}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-acid underline-offset-4 hover:underline"
              >
                <span>{copy.landing.login}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </SpatialRegion>

      {/* =========================================================================
          CATALOG SECTIONS (Existing Model & Ecosystem Views)
         ========================================================================= */}
      {groupedSections.length > 0 &&
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
        ))}

      {/* =========================================================================
          MOVEMENT 08: THE RETURN / CLOSING
         ========================================================================= */}
      <footer
        id="the-return"
        className="mx-auto w-full max-w-7xl border-t border-hairline px-5 py-16 md:px-10 md:py-24"
      >
        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-acid">
            {copy.landing.m8Eyebrow}
          </p>
          <h2 className="ql-display mt-4 text-3xl font-semibold text-ink md:text-5xl">
            {copy.landing.m8Title}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft italic">
            {copy.landing.m8ClosingQuote}
          </p>
          <p className="mt-2 text-xs text-muted">
            {copy.landing.m8FooterReflectionSource}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-medium tracking-wider text-muted">
            <Link href="/community" className="underline-offset-4 hover:text-acid hover:underline transition-colors">{copy.landing.m8EcosystemConstitution}</Link>
            <span>&bull;</span>
            <span>{copy.landing.m8Privacy}</span>
            <span>&bull;</span>
            <span>{copy.landing.m8Terms}</span>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-hairline-soft pt-8 text-xs text-muted">
          <p>{copy.landing.footer}</p>
        </div>
      </footer>
    </main>
  );
}
