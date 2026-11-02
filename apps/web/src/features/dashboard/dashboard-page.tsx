"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto,
  type ProjectTaskListResponseDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  LoadingScreen,
  MetricList,
  MetricRow,
  SidebarTrigger,
  WorkspaceSidebar,
  WorkspaceTemplate,
  type SidebarNavItem,
} from "@moonwitness/ui";
import {
  ArrowRight,
  Boxes,
  ExternalLink,
  KeyRound,
  Languages,
  MessageSquare,
  Microscope,
  Plug,
  ShieldCheck,
  Sparkles,
  Workflow as WorkflowIcon,
  BookOpen,
  Activity,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { useMessages } from "../locale/messages";
import { useLocalePreference } from "../locale/use-locale-preference";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { apiErrorMessage } from "../locale/api-error-message";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWorkflow, setHasWorkflow] = useState(false);
  const [hasCorpus, setHasCorpus] = useState(false);
  const [hasResearch, setHasResearch] = useState(false);
  const [projectTracker, setProjectTracker] =
    useState<ProjectTaskListResponseDto | null>(null);
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const { locale, changeLocale, saving, error: localeError } =
    useLocalePreference(user);
  const { t } = useTranslationCatalog();
  const copy = useMessages();

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .currentUser()
      .then(async ({ user: currentUser }) => {
        if (cancelled) return;
        setUser(currentUser);
        if (
          currentUser.groups.some(
            (group) => group === "admin" || group === "operator",
          )
        ) {
          void moonClient
            .listProjectTasks()
            .then((tracker) => {
              if (!cancelled) setProjectTracker(tracker);
            })
            .catch(() => {
              if (!cancelled) setProjectTracker(null);
            });
        }
        try {
          const metadata = await moonClient.listModels();
          if (!cancelled) {
            setHasWorkflow(
              metadata.models.some((model) => model.name.startsWith("workflow.")),
            );
            setHasCorpus(
              metadata.models.some((model) => model.name.startsWith("corpus.")),
            );
            setHasResearch(
              metadata.models.some((model) =>
                model.name.startsWith("research."),
              ),
            );
          }
        } catch {
          if (!cancelled) {
            setHasWorkflow(false);
            setHasCorpus(false);
            setHasResearch(false);
          }
        }
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        if (
          requestError instanceof MoonClientError &&
          requestError.status === 401
        ) {
          router.replace("/auth");
          return;
        }
        setError(apiErrorMessage(requestError, t));
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, t]);

  async function logout() {
    setError(null);
    try {
      await moonClient.logout();
      router.replace("/auth");
    } catch (logoutError) {
      setError(apiErrorMessage(logoutError, t));
    }
  }

  if (loading || !user) {
    return <LoadingScreen error={error} label={copy.common.loading} />;
  }

  const hasConnectors = user.groups.some(
    (group) => group === "connector" || group === "operator",
  );
  const isAdmin = user.groups.includes("admin");
  const canViewProjectTracker = user.groups.some(
    (group) => group === "admin" || group === "operator",
  );
  const readyTasks =
    projectTracker?.tasks.filter((task) =>
      projectTracker.readyTaskIds.includes(task.id),
    ) ?? [];
  const doneCount =
    projectTracker?.tasks.filter((task) => task.state === "done").length ?? 0;
  const blockedCount =
    projectTracker?.tasks.filter((task) => task.state === "blocked").length ?? 0;

  const closeSidebar = () => setSidebarOpen(false);
  const navItems: readonly SidebarNavItem[] = [
    {
      href: "/command-center",
      label: copy.dashboard.hqTitle,
      icon: <Sparkles aria-hidden="true" size={16} />,
      active: true,
      onSelect: closeSidebar,
    },
    {
      href: "/command-center/chat",
      label: copy.common.chat,
      icon: <MessageSquare aria-hidden="true" size={16} />,
      onSelect: closeSidebar,
    },
    {
      href: "/models",
      label: copy.common.models,
      icon: <Boxes aria-hidden="true" size={16} />,
      onSelect: closeSidebar,
    },
    {
      href: "/providers",
      label: copy.common.providers,
      icon: <KeyRound aria-hidden="true" size={16} />,
      onSelect: closeSidebar,
    },
    ...(hasConnectors
      ? [
          {
            href: "/connectors",
            label: copy.common.integrations,
            icon: <Plug aria-hidden="true" size={16} />,
            onSelect: closeSidebar,
          },
        ]
      : []),
    ...(hasWorkflow
      ? [
          {
            href: "/workflow",
            label: copy.workflow.navLabel,
            icon: <WorkflowIcon aria-hidden="true" size={16} />,
            onSelect: closeSidebar,
          },
        ]
      : []),
    ...(hasCorpus
      ? [
          {
            href: "/corpus",
            label: t("web.dashboard.corpusTitle"),
            icon: <BookOpen aria-hidden="true" size={16} />,
            onSelect: closeSidebar,
          },
        ]
      : []),
    ...(hasResearch
      ? [
          {
            href: "/research",
            label: copy.research.navLabel,
            icon: <Microscope aria-hidden="true" size={16} />,
            onSelect: closeSidebar,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/admin/users",
            label: copy.common.users,
            icon: <ShieldCheck aria-hidden="true" size={16} />,
            onSelect: closeSidebar,
          },
          {
            href: "/admin/translations",
            label: t("web.translationAdmin.title"),
            icon: <Languages aria-hidden="true" size={16} />,
            onSelect: closeSidebar,
          },
        ]
      : []),
  ];

  const regionsMeta = [
    { id: "01", title: copy.dashboard.hqRegion1Title, desc: copy.dashboard.hqRegion1Desc, icon: <MessageSquare size={16} /> },
    { id: "02", title: copy.dashboard.hqRegion2Title, desc: copy.dashboard.hqRegion2Desc, icon: <ShieldCheck size={16} /> },
    { id: "03", title: copy.dashboard.hqRegion3Title, desc: copy.dashboard.hqRegion3Desc, icon: <Activity size={16} /> },
    { id: "04", title: copy.dashboard.hqRegion4Title, desc: copy.dashboard.hqRegion4Desc, icon: <Microscope size={16} /> },
    { id: "05", title: copy.dashboard.hqRegion5Title, desc: copy.dashboard.hqRegion5Desc, icon: <BookOpen size={16} /> },
    { id: "06", title: copy.dashboard.hqRegion6Title, desc: copy.dashboard.hqRegion6Desc, icon: <Plug size={16} /> },
  ];

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={copy.common.closeMenu}
      sidebar={
        <WorkspaceSidebar
          brandIcon={<Sparkles aria-hidden="true" size={16} />}
          closeLabel={copy.common.closeMenu}
          identity={{ name: user.name, subtitle: user.email }}
          items={navItems}
          logout={{ label: copy.common.logout, onLogout: () => void logout() }}
          navLabel={copy.dashboard.hqTitle}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      }
      header={
        <>
          <div className="flex items-center gap-2">
            <SidebarTrigger
              label={copy.common.openMenu}
              onOpenSidebar={() => setSidebarOpen(true)}
              sidebarOpen={sidebarOpen}
            />
            <span className="ql-display text-base font-semibold tracking-wide text-acid">
              {copy.dashboard.hqTitle}
            </span>
            <span className="text-xs text-muted">/ {copy.dashboard.hqSubtitle}</span>
          </div>
          <LocaleSwitcher
            locale={locale}
            label={copy.common.localeLabel}
            onChange={(nextLocale) => void changeLocale(nextLocale)}
            disabled={saving}
          />
        </>
      }
    >
      <div className="flex-1 overflow-y-auto">
        {/* =========================================================================
            1. IDENTITY FRAME & SPATIAL ARRIVAL (Threshold)
           ========================================================================= */}
        <section className="relative border-b border-hairline bg-panel-edge px-5 py-8 md:px-10 md:py-12">
          <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex size-2 rounded-full bg-acid shadow-[0_0_8px_var(--color-acid)]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-acid">
                  {copy.dashboard.hqArrivalGreeting}
                </span>
                <Badge variant="outline">
                  {user.groups.join(" · ")}
                </Badge>
              </div>
              <h1 className="ql-display mt-3 text-3xl font-semibold tracking-wide text-ink md:text-5xl">
                {copy.dashboard.greeting} {user.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base">
                {copy.dashboard.hqArrivalDesc}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => router.push("/command-center/chat")}>
                <MessageSquare aria-hidden="true" size={16} />
                {copy.dashboard.continueChat}
              </Button>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-1.5 border border-hairline px-4 text-xs font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:border-acid hover:text-acid"
              >
                <span>Portal A-L-L-A-H.COM</span>
                <ExternalLink aria-hidden="true" size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. WORLD CORE & SPATIAL AXIS SELECTOR (Landmark Navigation)
           ========================================================================= */}
        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
          {(error || localeError) && (
            <Alert variant="error" className="mb-8">
              {error ?? localeError}
            </Alert>
          )}

          <div className="mb-8 border-b border-hairline pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-acid">
                  {copy.dashboard.hqWorldCoreTitle}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <span className="size-2 rounded-full bg-live animate-pulse" />
                    <span>Corpus: {hasCorpus ? "Online" : "Standby"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <span className="size-2 rounded-full bg-acid animate-pulse" />
                    <span>Research Hub: {hasResearch ? "Online" : "Standby"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <span className="size-2 rounded-full bg-live animate-pulse" />
                    <span>Workflow Engine: {hasWorkflow ? "Operational" : "Standby"}</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <Button
                  type="button"
                  size="sm"
                  variant={activeRegion === "all" ? "default" : "secondary"}
                  onClick={() => setActiveRegion("all")}
                >
                  {copy.dashboard.hqRegionAll}
                </Button>
                {regionsMeta.map((r) => (
                  <Button
                    key={r.id}
                    type="button"
                    size="sm"
                    variant={activeRegion === r.id ? "default" : "secondary"}
                    onClick={() => setActiveRegion(r.id)}
                  >
                    {copy.dashboard.hqRegionLabel} {r.id}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. FOCUSED CHAMBER & PERIPHERAL REGIONS (Non-card-grid architecture)
             ========================================================================= */}
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
            {/* PRIMARY CHAMBER VIEW */}
            <div className="space-y-6">
              {/* Active Region 01: Command Deck */}
              {(activeRegion === "all" || activeRegion === "01") && (
                <div className="border border-hairline bg-panel p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-acid">REGION 01 · COMMAND DECK</span>
                    <Badge variant="live">Aktif</Badge>
                  </div>
                  <h2 className="ql-display mt-3 text-2xl font-semibold text-ink">
                    {copy.dashboard.hqRegion1Title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {copy.dashboard.hqRegion1Desc}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4 border-t border-hairline-soft pt-4 text-xs">
                    <Link
                      href="/command-center/chat"
                      className="inline-flex items-center gap-1.5 font-semibold text-acid hover:underline"
                    >
                      <MessageSquare size={14} />
                      <span>Asisten & Dialog AI</span>
                      <ArrowRight size={14} />
                    </Link>
                    <Link
                      href="/command-center/search"
                      className="inline-flex items-center gap-1.5 font-semibold text-ink-soft hover:text-acid"
                    >
                      <Compass size={14} />
                      <span>Pencarian Cepat</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Active Region 03: Mission Control */}
              {(activeRegion === "all" || activeRegion === "03") && (
                <div className="border border-hairline bg-panel p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-acid">REGION 03 · MISSION CONTROL</span>
                    <Badge variant="outline">
                      {projectTracker ? `${doneCount} Selesai` : "Tersinkron"}
                    </Badge>
                  </div>
                  <h2 className="ql-display mt-3 text-2xl font-semibold text-ink">
                    {copy.dashboard.hqRegion3Title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {copy.dashboard.hqRegion3Desc}
                  </p>

                  {canViewProjectTracker && projectTracker && (
                    <div className="mt-6 border-t border-hairline-soft pt-4">
                      <MetricList className="grid gap-x-4 border-y border-hairline-soft sm:grid-cols-3">
                        <MetricRow
                          label={copy.dashboard.trackerStateLabels.done}
                          value={`${doneCount} / ${projectTracker.tasks.length}`}
                        />
                        <MetricRow
                          label={copy.dashboard.trackerReadyTitle}
                          value={readyTasks.length}
                        />
                        <MetricRow
                          label={copy.dashboard.trackerStateLabels.blocked}
                          value={blockedCount}
                          divided={false}
                        />
                      </MetricList>

                      <ol className="mt-4 divide-y divide-hairline-soft">
                        {readyTasks.slice(0, 3).map((task) => (
                          <li key={task.id} className="flex items-center justify-between py-2 text-xs">
                            <span className="font-mono text-acid-muted">{task.id}</span>
                            <span className="min-w-0 flex-1 px-3 text-ink truncate">{task.title}</span>
                            <Badge variant="outline">{task.section}</Badge>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Active Region 04: Knowledge & Intelligence */}
              {(activeRegion === "all" || activeRegion === "04") && (
                <div className="border border-hairline bg-panel p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-acid">REGION 04 · KNOWLEDGE & INTELLIGENCE</span>
                    <Badge variant="live">Khazanah</Badge>
                  </div>
                  <h2 className="ql-display mt-3 text-2xl font-semibold text-ink">
                    {copy.dashboard.hqRegion4Title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {copy.dashboard.hqRegion4Desc}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4 border-t border-hairline-soft pt-4 text-xs font-semibold">
                    <Link href="/models" className="text-acid hover:underline">
                      Eksplorasi Model Domain &rarr;
                    </Link>
                    <Link href="/providers" className="text-ink-soft hover:text-acid">
                      Konfigurasi Provider AI &rarr;
                    </Link>
                    <Link href="/research" className="text-ink-soft hover:text-acid">
                      Laboratorium Riset &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* Region 02 & 05 & 06 (when singled out) */}
              {activeRegion === "02" && (
                <div className="border border-hairline bg-panel p-6 md:p-8">
                  <span className="font-mono text-xs text-acid">REGION 02 · IDENTITY & ACCESS</span>
                  <h2 className="ql-display mt-3 text-2xl font-semibold text-ink">{copy.dashboard.hqRegion2Title}</h2>
                  <p className="mt-2 text-sm text-muted">{copy.dashboard.hqRegion2Desc}</p>
                  <div className="mt-6 flex gap-4 text-xs font-semibold">
                    {isAdmin && <Link href="/admin/users" className="text-acid hover:underline">Kelola Pengguna &rarr;</Link>}
                    <Link href="/admin/translations" className="text-ink-soft hover:text-acid">Audit Terjemahan &rarr;</Link>
                  </div>
                </div>
              )}
              {activeRegion === "05" && (
                <div className="border border-hairline bg-panel p-6 md:p-8">
                  <span className="font-mono text-xs text-acid">REGION 05 · UNIVERSE & TRANSMISSIONS</span>
                  <h2 className="ql-display mt-3 text-2xl font-semibold text-ink">{copy.dashboard.hqRegion5Title}</h2>
                  <p className="mt-2 text-sm text-muted">{copy.dashboard.hqRegion5Desc}</p>
                  <div className="mt-6 flex gap-4 text-xs font-semibold">
                    <Link href="/corpus" className="text-acid hover:underline">Arsip Korpus &rarr;</Link>
                    <Link href="/workflow" className="text-ink-soft hover:text-acid">Antrean Publikasi &rarr;</Link>
                  </div>
                </div>
              )}
              {activeRegion === "06" && (
                <div className="border border-hairline bg-panel p-6 md:p-8">
                  <span className="font-mono text-xs text-acid">REGION 06 · SYSTEM OBSERVATORY</span>
                  <h2 className="ql-display mt-3 text-2xl font-semibold text-ink">{copy.dashboard.hqRegion6Title}</h2>
                  <p className="mt-2 text-sm text-muted">{copy.dashboard.hqRegion6Desc}</p>
                  <div className="mt-6 flex gap-4 text-xs font-semibold">
                    {hasConnectors && <Link href="/connectors" className="text-acid hover:underline">Konektor DNS &rarr;</Link>}
                    <Link href="/command-center/export" className="text-ink-soft hover:text-acid">Studio Data &rarr;</Link>
                  </div>
                </div>
              )}
            </div>

            {/* 4. PERIPHERAL LEDGER & INTELLIGENCE FEED */}
            <div className="space-y-6">
              {/* Intelligence Feed */}
              <div className="border border-hairline bg-panel-edge p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-acid">
                  {copy.dashboard.hqIntelFeedTitle}
                </p>
                <ul className="mt-4 space-y-3 text-xs">
                  <li className="flex items-center justify-between">
                    <span className="text-ink-soft">Al-Qur'an Corpus Archive</span>
                    <Badge variant={hasCorpus ? "live" : "outline"}>
                      {hasCorpus ? "Tersedia" : "Siap Impor"}
                    </Badge>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-ink-soft">CAB Workflow Review Queue</span>
                    <Badge variant={hasWorkflow ? "live" : "outline"}>
                      {hasWorkflow ? "Aktif" : "Menunggu"}
                    </Badge>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-ink-soft">Lexical Research Lab</span>
                    <Badge variant={hasResearch ? "live" : "outline"}>
                      {hasResearch ? "Aktif" : "Offline"}
                    </Badge>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-ink-soft">Integration Edge Connector</span>
                    <Badge variant={hasConnectors ? "live" : "outline"}>
                      {hasConnectors ? "Terkoneksi" : "Lokal"}
                    </Badge>
                  </li>
                </ul>
              </div>

              {/* Ecosystem Ledger (Region Directory) */}
              <div className="border border-hairline bg-panel-edge p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Direktori Region Ekosistem
                </p>
                <ol className="mt-4 divide-y divide-hairline-soft text-xs">
                  {regionsMeta.map((r) => (
                    <li key={r.id} className="py-2.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveRegion(r.id)}
                        className="group flex w-full items-center justify-between text-left text-ink-soft hover:text-acid"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-acid-muted">{r.id}</span>
                          <span className="font-medium group-hover:text-acid">{r.title}</span>
                        </span>
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
