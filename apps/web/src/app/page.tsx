"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto,
  type LandingViewItemDto,
  type LandingViewSection,
  type UiLocale,
} from "@moonwitness/moonclient";
import { Badge } from "@moonwitness/ui";
import { Boxes } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiErrorMessage } from "../features/locale/api-error-message";
import { useMessages } from "../features/locale/messages";
import { translateMetadata } from "../features/locale/translate-metadata";
import {
  type UiMessageKey,
  useTranslationCatalog,
} from "../features/locale/translation-catalog";
import { useLocalePreference } from "../features/locale/use-locale-preference";
import { useThemePreference } from "../features/theme/use-theme-preference";
import { HeroArrivalStage } from "../features/landing/components/hero-arrival-stage";
import { UniversePortalDock } from "../features/landing/components/universe-portal-dock";
import { ExploreKnowledgeTreasury } from "../features/landing/components/explore-knowledge-treasury";
import { TransmissionsSanctuary } from "../features/landing/components/transmissions-sanctuary";
import { ReturnFooterClosing } from "../features/landing/components/return-footer-closing";
import { SpotlightDialog } from "../features/landing/components/spotlight-dialog";

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
  const { locale, changeLocale, saving, error: localeError } = useLocalePreference(user);
  const { theme, toggleTheme } = useThemePreference();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const copy = useMessages();
  const { t, tm } = useTranslationCatalog();

  const handleOpenSearch = useCallback(() => setSearchOpen(true), []);
  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);
  const handleQueryChange = useCallback((q: string) => setSearchQuery(q), []);
  const handleToggleTheme = useCallback(() => toggleTheme(), [toggleTheme]);
  const handleChangeLocale = useCallback(
    (next: UiLocale) => {
      void changeLocale(next);
    },
    [changeLocale],
  );

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
  }, []);

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

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const groupedSections = useMemo(() => {
    const isMatching = (item: LandingViewItemDto, sec: LandingViewSection) => item.section === sec;
    return LANDING_SECTIONS.map((meta) => ({
      ...meta,
      items: landingItems.filter((item) => isMatching(item, meta.section)),
    })).filter((group) => group.items.length > 0);
  }, [landingItems]);

  const dashboardHref = user ? "/command-center" : `/auth?locale=${locale}`;
  const loadErrorMessage = loadError === null ? null : apiErrorMessage(loadError, t);

  return (
    <main className="ql-hud-app min-h-dvh">
      <Link
        href="#the-universe"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:border focus:border-acid focus:bg-panel-edge focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-acid"
      >
        {copy.common.skipToContent}
      </Link>

      <HeroArrivalStage
        user={user}
        brandName={BRAND_NAME}
        brandEcosystem={BRAND_ECOSYSTEM}
        brandDeclaration={BRAND_DECLARATION}
        locale={locale}
        theme={theme}
        dashboardHref={dashboardHref}
        loadErrorMessage={loadErrorMessage}
        localeError={localeError}
        savingLocale={saving}
        onOpenSearch={handleOpenSearch}
        onToggleTheme={handleToggleTheme}
        onChangeLocale={handleChangeLocale}
      >
        <UniversePortalDock />
      </HeroArrivalStage>

      <ExploreKnowledgeTreasury />
      <TransmissionsSanctuary />

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
                          <Boxes aria-hidden="true" size={16} className="shrink-0 text-acid" />
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
                            {t("web.landing.recordCount", { count: item.recordCount })}
                          </Badge>
                        )}
                        <Badge variant={item.status === "available" ? "live" : "outline"}>
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

      <ReturnFooterClosing locale={locale} />

      <SpotlightDialog
        isOpen={searchOpen}
        query={searchQuery}
        onQueryChange={handleQueryChange}
        onClose={handleCloseSearch}
      />
    </main>
  );
}
