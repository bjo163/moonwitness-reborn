"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto,
} from "@moonwitness/moonclient";
import {
  Badge,
  Button,
  SidebarBrand,
} from "@moonwitness/ui";
import {
  ArrowRight,
  FileCheck2,
  HeartHandshake,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "../../features/locale/locale-switcher";
import { useMessages } from "../../features/locale/messages";
import { useLocalePreference } from "../../features/locale/use-locale-preference";

export default function CommunityPage() {
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const copy = useMessages();
  const { locale, changeLocale, saving } = useLocalePreference(user);

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .currentUser()
      .then(({ user: currentUser }) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof MoonClientError && err.status === 401) {
          setUser(null);
          return;
        }
        setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="ql-hud-app min-h-dvh flex flex-col justify-between">
      {/* HEADER */}
      <header className="border-b border-hairline bg-panel-edge/80 px-5 py-4 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <SidebarBrand
            href="/"
            label="A-L-L-A-H.COM"
            icon={<Sparkles aria-hidden="true" size={18} />}
          />
          <div className="flex items-center gap-3">
            <LocaleSwitcher
              locale={locale}
              label={copy.common.localeLabel}
              onChange={(nextLocale) => void changeLocale(nextLocale)}
              disabled={user === undefined || saving}
            />
            {user ? (
              <Button onClick={() => window.location.assign("/command-center")}>
                {copy.common.dashboard}
              </Button>
            ) : (
              <Link
                href={`/auth?mode=login&locale=${locale}`}
                className="text-xs font-semibold uppercase tracking-wider text-acid underline-offset-4 hover:underline"
              >
                {copy.landing.login}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center border border-acid bg-panel text-acid">
              <Users aria-hidden="true" size={15} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-acid">
              {copy.community.commTitle}
            </span>
            <Badge variant="live">Dock Active</Badge>
          </div>
          <h1 className="ql-display mt-5 text-4xl font-semibold tracking-wide text-ink md:text-6xl">
            {copy.community.commHero}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-soft md:text-lg">
            {copy.community.commDesc}
          </p>
        </div>

        {/* GUIDELINES & ETHOS */}
        <div className="mt-16 border-t border-hairline pt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-acid-muted">
            {copy.community.commGuidelinesTitle}
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="border border-hairline bg-panel p-6">
              <div className="flex size-10 items-center justify-center border border-hairline-strong bg-panel-edge text-acid">
                <FileCheck2 aria-hidden="true" size={20} />
              </div>
              <h3 className="ql-display mt-4 text-xl font-semibold text-ink">
                {copy.community.commGuideline1}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {copy.community.commGuideline1Desc}
              </p>
            </div>

            <div className="border border-hairline bg-panel p-6">
              <div className="flex size-10 items-center justify-center border border-hairline-strong bg-panel-edge text-acid">
                <HeartHandshake aria-hidden="true" size={20} />
              </div>
              <h3 className="ql-display mt-4 text-xl font-semibold text-ink">
                {copy.community.commGuideline2}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {copy.community.commGuideline2Desc}
              </p>
            </div>

            <div className="border border-hairline bg-panel p-6">
              <div className="flex size-10 items-center justify-center border border-hairline-strong bg-panel-edge text-acid">
                <Shield aria-hidden="true" size={20} />
              </div>
              <h3 className="ql-display mt-4 text-xl font-semibold text-ink">
                {copy.community.commGuideline3}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {copy.community.commGuideline3Desc}
              </p>
            </div>
          </div>
        </div>

        {/* CIRCLES & ACTION */}
        <div className="mt-16 border-t border-hairline pt-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-acid-muted">
                {copy.community.commCirclesTitle}
              </p>
              <h2 className="ql-display mt-2 text-2xl font-semibold text-ink md:text-4xl">
                Bergabung dalam Lingkaran Telaah
              </h2>
            </div>
            <Link
              href={`/auth?mode=register&locale=${locale}`}
              className="inline-flex min-h-11 items-center gap-2 border border-acid bg-acid px-5 text-xs font-semibold uppercase tracking-wider text-panel-deeper transition-all hover:bg-acid-dark"
            >
              <span>{copy.community.commActionRegister}</span>
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="border border-hairline-soft bg-panel-edge p-5">
              <span className="text-xs font-mono text-acid-muted">LINGKARAN 01</span>
              <p className="mt-2 text-sm font-semibold text-ink">
                {copy.community.commCircle1}
              </p>
            </div>
            <div className="border border-hairline-soft bg-panel-edge p-5">
              <span className="text-xs font-mono text-acid-muted">LINGKARAN 02</span>
              <p className="mt-2 text-sm font-semibold text-ink">
                {copy.community.commCircle2}
              </p>
            </div>
            <div className="border border-hairline-soft bg-panel-edge p-5">
              <span className="text-xs font-mono text-acid-muted">LINGKARAN 03</span>
              <p className="mt-2 text-sm font-semibold text-ink">
                {copy.community.commCircle3}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-hairline bg-panel-deep px-5 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <p>A-L-L-A-H.COM · Dock Community Harbor</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-acid">Beranda</Link>
            <Link href="/corpus" className="hover:text-acid">Korpus</Link>
            <Link href="/command-center" className="hover:text-acid">Headquarter</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
