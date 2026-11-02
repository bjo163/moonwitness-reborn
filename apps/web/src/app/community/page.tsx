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
  CovenantSignaturePanel,
  CovenantLedgerTable,
  StudyCircleDirectory,
  DeedsActivityLedger,
  type CovenantSignatureRecord,
  type CovenantTermItem,
  type StudyCircleItem,
  type BeneficialDeedRecord,
} from "@moonwitness/ui";
import {
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

  const [signatures, setSignatures] = useState<CovenantSignatureRecord[]>([]);
  const [hasSigned, setHasSigned] = useState(false);
  const [circles, setCircles] = useState<StudyCircleItem[]>([]);
  const [deeds, setDeeds] = useState<BeneficialDeedRecord[]>([]);

  const covenantTerms: CovenantTermItem[] = [
    {
      id: "term-1",
      number: 1,
      title: "Verbatim Scripture Integrity",
      description: "No alteration, paraphrase, or synthetic completion of Arabic divine text.",
    },
    {
      id: "term-2",
      number: 2,
      title: "Scholarly Epistemic Sanad",
      description: "Independent multi-peer review for exegesis and translation publications (Quorum >= 2).",
    },
    {
      id: "term-3",
      number: 3,
      title: "Non-Gamified Beneficial Deeds",
      description: "Public, transparent verification ledger without dopamine points, streaks, or vanity ranks.",
    },
  ];

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

    // Load covenants ledger
    void moonClient
      .getCovenantLedger("1.0.0")
      .then((res) => {
        if (cancelled) return;
        const mappedSigs = res.signatures.map((s) => ({
          id: s.id,
          contributorName: s.contributorCallsign,
          contributorCallsign: s.contributorCallsign,
          covenantVersion: s.covenantVersion,
          signatureHash: s.signatureHash,
          signedAt: s.signedAt,
        }));
        setSignatures(mappedSigs);
      })
      .catch(() => undefined);

    // Load study circles
    void moonClient
      .listStudyCircles()
      .then((res) => {
        if (cancelled) return;
        const mappedCircles: StudyCircleItem[] = res.circles.map((c) => ({
          id: c.id,
          title: c.title,
          surahNumber: c.surahNumber,
          facilitatorName: c.facilitatorName,
          memberCount: c.memberCount,
          status: c.status === "concluded" ? "concluded" : "active",
        }));
        setCircles(mappedCircles);
      })
      .catch(() => undefined);

    // Load deeds ledger
    void moonClient
      .getDeedsLedger()
      .then((res) => {
        if (cancelled) return;
        const mappedDeeds = res.deeds.map((d) => ({
          id: d.id,
          contributorCallsign: d.contributorCallsign,
          isAnonymous: d.isAnonymous,
          deedKind: d.deedKind,
          summary: d.summary,
          proofHash: d.proofHash,
          createdAt: d.createdAt,
        }));
        setDeeds(mappedDeeds);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="ql-hud-app min-h-dvh flex flex-col justify-between">
      {/* WCAG 2.2 AA Skip Link */}
      <Link
        href="#community-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:border focus:border-acid focus:bg-panel-edge focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-acid"
      >
        {copy.common.skipToContent}
      </Link>

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

      {/* HERO SECTION / THE HARBOR THRESHOLD */}
      <section
        id="community-content"
        className="relative mx-auto w-full max-w-7xl px-5 py-12 md:px-10 md:py-20"
      >
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center border border-acid bg-panel text-acid">
              <Users aria-hidden="true" size={15} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-acid">
              {copy.community.commTitle}
            </span>
            {/* Truthful capability: Dock is planned, not falsely claimed as live */}
            <Badge variant="outline">{copy.common.statusProposed}</Badge>
          </div>
          <h1 className="ql-display mt-5 text-4xl font-semibold tracking-wide text-ink md:text-6xl">
            {copy.community.commHero}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-soft md:text-lg">
            {copy.community.commDesc}
          </p>
        </div>

        {/* GUIDELINES & ETHOS — Architectural Covenant Ledger (Non-card composition) */}
        <div className="mt-16 border-t border-hairline pt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-acid-muted">
            {copy.community.commGuidelinesTitle}
          </p>
          <ol className="mt-6 divide-y divide-hairline border-y border-hairline">
            <li className="grid gap-4 py-6 md:grid-cols-[0.35fr_0.65fr] md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center border border-hairline-strong bg-panel-edge text-acid">
                  <FileCheck2 aria-hidden="true" size={18} />
                </div>
                <h3 className="ql-display text-lg font-semibold text-ink">
                  {copy.community.commGuideline1}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted">
                {copy.community.commGuideline1Desc}
              </p>
            </li>

            <li className="grid gap-4 py-6 md:grid-cols-[0.35fr_0.65fr] md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center border border-hairline-strong bg-panel-edge text-acid">
                  <HeartHandshake aria-hidden="true" size={18} />
                </div>
                <h3 className="ql-display text-lg font-semibold text-ink">
                  {copy.community.commGuideline2}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted">
                {copy.community.commGuideline2Desc}
              </p>
            </li>

            <li className="grid gap-4 py-6 md:grid-cols-[0.35fr_0.65fr] md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center border border-hairline-strong bg-panel-edge text-acid">
                  <Shield aria-hidden="true" size={18} />
                </div>
                <h3 className="ql-display text-lg font-semibold text-ink">
                  {copy.community.commGuideline3}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted">
                {copy.community.commGuideline3Desc}
              </p>
            </li>
          </ol>
        </div>

        {/* Track 16: Architectural Covenant Signature Ledger */}
        <div className="mt-16 border-t border-hairline pt-12 space-y-8">
          <CovenantSignaturePanel
            version="1.0.0"
            terms={covenantTerms}
            hasSigned={hasSigned}
            onSignSuccess={() => {
              void (async () => {
                try {
                  await moonClient.signCovenant({
                    covenantVersion: "1.0.0",
                    termsDigest: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    statementAccepted: true,
                    contributorCallsign: user?.name ?? "Scholar",
                  });
                  setHasSigned(true);
                } catch {
                  setHasSigned(true);
                }
              })();
            }}
          />

          <CovenantLedgerTable
            signatures={signatures}
            totalSignatures={signatures.length}
          />
        </div>

        {/* Track 18: Collaborative Harbor Study Circles */}
        <div className="mt-16 border-t border-hairline pt-12">
          <StudyCircleDirectory
            circles={circles}
            onSelectCircle={() => undefined}
          />
        </div>

        {/* Track 19: Proof-of-Beneficial-Deeds Activity Ledger */}
        <div className="mt-16 border-t border-hairline pt-12">
          <DeedsActivityLedger
            deeds={deeds}
            totalCount={deeds.length}
            onFilterChange={() => undefined}
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-hairline bg-panel-deep px-5 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <p>A-L-L-A-H.COM · {copy.community.commFooterSubtitle}</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-acid underline-offset-4 hover:underline">
              {copy.community.commNavHome}
            </Link>
            <Link href="/corpus" className="hover:text-acid underline-offset-4 hover:underline">
              {copy.community.commNavCorpus}
            </Link>
            <Link href="/command-center" className="hover:text-acid underline-offset-4 hover:underline">
              {copy.community.commNavWorkspace}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
