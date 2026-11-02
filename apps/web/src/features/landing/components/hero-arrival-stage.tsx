"use client";

import {
  Alert,
  Button,
  HeroStage,
  NavLink,
  SidebarBrand,
  ThemeToggle,
} from "@moonwitness/ui";
import {
  ArrowRight,
  Boxes,
  Compass,
  Globe,
  Home,
  Radio,
  Scroll,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import { LocaleSwitcher } from "../../locale/locale-switcher";
import { useMessages } from "../../locale/messages";
import type { HeroArrivalStageProps } from "../types";

export function HeroArrivalStage({
  user,
  brandName,
  brandEcosystem,
  brandDeclaration,
  locale,
  theme,
  dashboardHref,
  loadErrorMessage,
  localeError,
  savingLocale,
  onOpenSearch,
  onToggleTheme,
  onChangeLocale,
  children,
}: HeroArrivalStageProps & { children?: React.ReactNode }) {
  const copy = useMessages();

  return (
    <HeroStage imageSrc="/hero-empire.jpg">
      <header className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 md:px-10">
        <SidebarBrand
          href="/"
          label={brandName}
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
          <Button
            variant="ghost"
            size="icon"
            aria-label={copy.common.searchAction}
            title={`${copy.common.searchAction} (Ctrl+K)`}
            onClick={onOpenSearch}
            className="ql-nav-link inline-flex min-h-11 min-w-11 items-center justify-center cursor-pointer"
          >
            <Search aria-hidden="true" size={16} />
          </Button>
          <ThemeToggle
            theme={theme}
            label={theme === "light" ? copy.common.themeToDark : copy.common.themeToLight}
            onToggle={onToggleTheme}
          />
          <LocaleSwitcher
            locale={locale}
            label={copy.common.localeLabel}
            onChange={onChangeLocale}
            disabled={user === undefined || savingLocale}
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
          <h1 className="ql-hero__title">{brandName}</h1>
          <p className="ql-hero__subtitle">{brandEcosystem}</p>
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
          <p>&ldquo;{brandDeclaration}&rdquo;</p>
        </blockquote>
      </div>

      {children}
    </HeroStage>
  );
}
