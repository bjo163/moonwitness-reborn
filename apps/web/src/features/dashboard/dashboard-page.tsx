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
            CINEMATIC ARRIVAL & WORLD CORE (Headquarter Spatial Header)
           ========================================================================= */}
        <section className="relative border-b border-hairline bg-panel-edge px-5 py-8 md:px-10 md:py-12">
          <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
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
            6 SPATIAL REGIONS OF HEADQUARTER
           ========================================================================= */}
        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
          {(error || localeError) && (
            <Alert variant="error" className="mb-8">
              {error ?? localeError}
            </Alert>
          )}

          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-hairline-soft pb-4 text-xs font-semibold uppercase tracking-wider">
            <span className="text-muted mr-2">Region Filter:</span>
            {["all", "01", "02", "03", "04", "05", "06"].map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={activeRegion === r ? "default" : "secondary"}
                onClick={() => setActiveRegion(r)}
              >
                {r === "all" ? "Tampilkan Semua Region" : `Region ${r}`}
              </Button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* REGION 01: COMMAND DECK */}
            {(activeRegion === "all" || activeRegion === "01") && (
              <div className="flex flex-col justify-between border border-hairline bg-panel p-6 transition-all hover:border-acid">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-acid-muted">REGION 01</span>
                    <Badge variant="live">Aktif</Badge>
                  </div>
                  <h2 className="ql-display mt-3 text-xl font-semibold text-ink">
                    {copy.dashboard.hqRegion1Title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {copy.dashboard.hqRegion1Desc}
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-2 border-t border-hairline-soft pt-4 text-xs">
                  <Link
                    href="/command-center/chat"
                    className="flex items-center justify-between text-ink-soft hover:text-acid"
                  >
                    <span>Asisten & Dialog AI</span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                  <Link
                    href="/command-center/search"
                    className="flex items-center justify-between text-ink-soft hover:text-acid"
                  >
                    <span>Pencarian Cepat</span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* REGION 02: IDENTITY & ACCESS */}
            {(activeRegion === "all" || activeRegion === "02") && (
              <div className="flex flex-col justify-between border border-hairline bg-panel p-6 transition-all hover:border-acid">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-acid-muted">REGION 02</span>
                    <Badge variant={isAdmin ? "live" : "outline"}>
                      {isAdmin ? "Otoritas Penuh" : "Terbatas"}
                    </Badge>
                  </div>
                  <h2 className="ql-display mt-3 text-xl font-semibold text-ink">
                    {copy.dashboard.hqRegion2Title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {copy.dashboard.hqRegion2Desc}
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-2 border-t border-hairline-soft pt-4 text-xs">
                  {isAdmin ? (
                    <Link
                      href="/admin/users"
                      className="flex items-center justify-between text-ink-soft hover:text-acid"
                    >
                      <span>Kelola Pengguna & Peran</span>
                      <ArrowRight aria-hidden="true" size={14} />
                    </Link>
                  ) : (
                    <span className="text-muted">Akses Admin Diperlukan</span>
                  )}
                  <Link
                    href="/admin/translations"
                    className="flex items-center justify-between text-ink-soft hover:text-acid"
                  >
                    <span>Audit Katalog Bahasa</span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* REGION 03: MISSION CONTROL */}
            {(activeRegion === "all" || activeRegion === "03") && (
              <div className="flex flex-col justify-between border border-hairline bg-panel p-6 transition-all hover:border-acid">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-acid-muted">REGION 03</span>
                    <Badge variant="outline">
                      {projectTracker ? `${doneCount} Selesai` : "Tersinkron"}
                    </Badge>
                  </div>
                  <h2 className="ql-display mt-3 text-xl font-semibold text-ink">
                    {copy.dashboard.hqRegion3Title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {copy.dashboard.hqRegion3Desc}
                  </p>
                </div>
                <div className="mt-6 border-t border-hairline-soft pt-4">
                  {canViewProjectTracker && projectTracker ? (
                    <div className="flex items-center justify-between text-xs text-ink-soft">
                      <span>{projectTracker.tasks.length} Tugas Terdaftar</span>
                      <span className="text-acid font-semibold">{readyTasks.length} Siap</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Pelacak Tugas Internal</span>
                  )}
                </div>
              </div>
            )}

            {/* REGION 04: KNOWLEDGE & INTELLIGENCE */}
            {(activeRegion === "all" || activeRegion === "04") && (
              <div className="flex flex-col justify-between border border-hairline bg-panel p-6 transition-all hover:border-acid">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-acid-muted">REGION 04</span>
                    <Badge variant="live">Khazanah</Badge>
                  </div>
                  <h2 className="ql-display mt-3 text-xl font-semibold text-ink">
                    {copy.dashboard.hqRegion4Title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {copy.dashboard.hqRegion4Desc}
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-2 border-t border-hairline-soft pt-4 text-xs">
                  <Link
                    href="/models"
                    className="flex items-center justify-between text-ink-soft hover:text-acid"
                  >
                    <span>Eksplorasi Model Domain</span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                  <Link
                    href="/providers"
                    className="flex items-center justify-between text-ink-soft hover:text-acid"
                  >
                    <span>Konfigurasi Provider AI</span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                  <Link
                    href="/research"
                    className="flex items-center justify-between text-ink-soft hover:text-acid"
                  >
                    <span>Laboratorium Riset</span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* REGION 05: UNIVERSE & TRANSMISSIONS */}
            {(activeRegion === "all" || activeRegion === "05") && (
              <div className="flex flex-col justify-between border border-hairline bg-panel p-6 transition-all hover:border-acid">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-acid-muted">REGION 05</span>
                    <Badge variant="live">Kanonik</Badge>
                  </div>
                  <h2 className="ql-display mt-3 text-xl font-semibold text-ink">
                    {copy.dashboard.hqRegion5Title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {copy.dashboard.hqRegion5Desc}
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-2 border-t border-hairline-soft pt-4 text-xs">
                  <Link
                    href="/corpus"
                    className="flex items-center justify-between text-ink-soft hover:text-acid"
                  >
                    <span>Arsip Korpus & Naskah</span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                  <Link
                    href="/workflow"
                    className="flex items-center justify-between text-ink-soft hover:text-acid"
                  >
                    <span>Antrean Tinjauan Publikasi</span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* REGION 06: SYSTEM OBSERVATORY */}
            {(activeRegion === "all" || activeRegion === "06") && (
              <div className="flex flex-col justify-between border border-hairline bg-panel p-6 transition-all hover:border-acid">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-acid-muted">REGION 06</span>
                    <Badge variant={hasConnectors ? "live" : "outline"}>
                      {hasConnectors ? "Terkoneksi" : "Lokal"}
                    </Badge>
                  </div>
                  <h2 className="ql-display mt-3 text-xl font-semibold text-ink">
                    {copy.dashboard.hqRegion6Title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {copy.dashboard.hqRegion6Desc}
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-2 border-t border-hairline-soft pt-4 text-xs">
                  {hasConnectors ? (
                    <Link
                      href="/connectors"
                      className="flex items-center justify-between text-ink-soft hover:text-acid"
                    >
                      <span>Konektor & DNS</span>
                      <ArrowRight aria-hidden="true" size={14} />
                    </Link>
                  ) : (
                    <span className="text-muted">Izin Operator Diperlukan</span>
                  )}
                  <Link
                    href="/command-center/export"
                    className="flex items-center justify-between text-ink-soft hover:text-acid"
                  >
                    <span>Ekspor & Studio Data</span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              MISSION CONTROL DETAILED TASK OBSERVER
             ========================================================================= */}
          {canViewProjectTracker && projectTracker && (
            <section
              className="mt-12 border-t border-hairline pt-10"
              aria-labelledby="project-tracker-title"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h3
                    id="project-tracker-title"
                    className="ql-display text-2xl font-semibold tracking-tight text-ink"
                  >
                    {copy.dashboard.trackerTitle}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {copy.dashboard.trackerDescription}
                  </p>
                </div>
                <Badge variant="outline">{doneCount} / {projectTracker.tasks.length} Selesai</Badge>
              </div>

              <div className="mt-6">
                <MetricList className="grid gap-x-6 border-y border-hairline sm:grid-cols-3">
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
              </div>

              <div className="mt-8">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-acid">
                  {copy.dashboard.trackerReadyTitle}
                </h4>
                {readyTasks.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {copy.dashboard.trackerEmptyReady}
                  </p>
                ) : (
                  <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {readyTasks.slice(0, 6).map((task) => (
                      <li
                        key={task.id}
                        className="border border-hairline bg-panel p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-acid-muted">
                              {task.id}
                            </span>
                            <Badge variant="outline">
                              {copy.dashboard.trackerStateLabels[task.state]}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm font-medium leading-snug text-ink">
                            {task.title}
                          </p>
                        </div>
                        <p className="mt-3 text-xs text-muted font-mono">{task.section}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
