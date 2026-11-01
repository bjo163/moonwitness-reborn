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
  PageHeader,
  WorkspaceSidebar,
  WorkspaceTemplate,
  type SidebarNavItem,
} from "@moonwitness/ui";
import {
  Boxes,
  Database,
  KeyRound,
  LayoutDashboard,
  Languages,
  Menu,
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
  const [projectTrackerLoading, setProjectTrackerLoading] = useState(false);
  const [projectTrackerError, setProjectTrackerError] = useState(false);
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
          setProjectTrackerLoading(true);
          void moonClient
            .listProjectTasks()
            .then((tracker) => {
              if (!cancelled) setProjectTracker(tracker);
            })
            .catch(() => {
              if (!cancelled) setProjectTrackerError(true);
            })
            .finally(() => {
              if (!cancelled) setProjectTrackerLoading(false);
            });
        }
        // A single listModels probe is the de-facto feature flag: bootstrap
        // registration of `ql_workflow` / `ql_corpus` in
        // `apps/api/src/index.ts` is the switch that toggles the entire queue
        // and shelf surfaces (route + nav + card) without introducing a
        // separate flag subsystem.
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
    return (
      <LoadingScreen
        error={error}
        label={copy.common.loading}
      />
    );
  }

  const hasConnectors = user.groups.some(
    (group) => group === "connector" || group === "operator",
  );
  const isAdmin = user.groups.includes("admin");
  const canViewProjectTracker = user.groups.some(
    (group) => group === "admin" || group === "operator",
  );
  const readyTasks = projectTracker?.tasks.filter((task) =>
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
      label: copy.common.dashboard,
      icon: <LayoutDashboard aria-hidden="true" size={16} />,
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
          navLabel={copy.common.dashboard}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      }
      header={
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={copy.common.openMenu}
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu aria-hidden="true" size={19} />
            </Button>
            <span className="text-sm font-medium text-ink-soft">
              {copy.common.dashboard}
            </span>
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
        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
          <PageHeader
            actions={
              <Button onClick={() => router.push("/command-center/chat")}>
                <MessageSquare aria-hidden="true" size={16} />
                {copy.dashboard.continueChat}
              </Button>
            }
            className="border-b-0 pb-0"
            description={copy.dashboard.description}
            title={`${copy.dashboard.greeting} ${user.name}`}
          />

          {(error || localeError) && (
            <Alert variant="error" className="mt-6">
              {error ?? localeError}
            </Alert>
          )}

          <section className="grid gap-7 py-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {copy.dashboard.availableTitle}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                {copy.dashboard.availableDescription}
              </p>
            </div>
            <ul className="divide-y divide-hairline border-y border-hairline">
              <li>
                <Link
                  href="/command-center/chat"
                  className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
                >
                  <MessageSquare
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-acid"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink group-hover:text-acid">
                      {copy.common.chat}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted">
                      {copy.dashboard.chatDescription}
                    </span>
                  </span>
                  <Badge variant="live">{copy.common.statusAvailable}</Badge>
                </Link>
              </li>
              <li>
                <Link
                  href="/models"
                  className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
                >
                  <Database
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-acid"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink group-hover:text-acid">
                      {copy.common.models}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted">
                      {copy.dashboard.modelsDescription}
                    </span>
                  </span>
                  <Badge variant="outline">{copy.common.statusAvailable}</Badge>
                </Link>
              </li>
              <li>
                <Link
                  href="/providers"
                  className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
                >
                  <KeyRound
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-acid"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink group-hover:text-acid">
                      {copy.common.providers}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted">
                      {copy.dashboard.providersDescription}
                    </span>
                  </span>
                  <Badge variant="outline">{copy.common.statusAvailable}</Badge>
                </Link>
              </li>
              {hasConnectors && (
                <li>
                  <Link
                    href="/connectors"
                    className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
                  >
                    <Plug
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-acid"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink group-hover:text-acid">
                        {copy.common.integrations}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted">
                        {copy.dashboard.integrationsDescription}
                      </span>
                    </span>
                    <Badge variant="outline">{copy.common.statusAvailable}</Badge>
                  </Link>
                </li>
              )}
              {hasWorkflow && (
                <li>
                  <Link
                    href="/workflow"
                    className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
                  >
                    <WorkflowIcon
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-acid"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink group-hover:text-acid">
                        {copy.workflow.navLabel}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted">
                        {copy.workflow.queueSubtitle}
                      </span>
                    </span>
                    <Badge variant="outline">{copy.common.statusAvailable}</Badge>
                  </Link>
                </li>
              )}
              {hasCorpus && (
                <li>
                  <Link
                    href="/corpus"
                    className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
                  >
                    <BookOpen
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-acid"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink group-hover:text-acid">
                        {t("web.dashboard.corpusTitle")}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted">
                        {t("web.dashboard.corpusDescription")}
                      </span>
                    </span>
                    <Badge variant="outline">{copy.common.statusAvailable}</Badge>
                  </Link>
                </li>
              )}
              {hasResearch && (
                <li>
                  <Link
                    href="/research"
                    className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
                  >
                    <Microscope
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-acid"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink group-hover:text-acid">
                        {copy.research.navLabel}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted">
                        {copy.research.description}
                      </span>
                    </span>
                    <Badge variant="outline">{copy.common.statusAvailable}</Badge>
                  </Link>
                </li>
              )}
            </ul>
          </section>

          <section className="border-t border-hairline py-10">
            <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                  {copy.dashboard.directionTitle}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-ink-soft">
                  {copy.dashboard.directionDescription}
                </p>
                <p className="mt-3 max-w-sm text-xs leading-5 text-muted">
                  {copy.dashboard.directionNote}
                </p>
              </div>
              <div>
                <Badge variant="outline">{copy.common.statusProposed}</Badge>
                <ol className="mt-5 flex flex-wrap gap-2">
                  {copy.landing.journey.map((step, index) => (
                    <li
                      key={step}
                      className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-2 text-xs text-ink-soft"
                    >
                      <span className="tabular-nums text-acid-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {canViewProjectTracker && (
            <section
              className="border-t border-hairline py-10"
              aria-labelledby="project-tracker-title"
            >
              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2
                    id="project-tracker-title"
                    className="text-2xl font-semibold tracking-tight text-ink"
                  >
                    {copy.dashboard.trackerTitle}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-ink-soft">
                    {copy.dashboard.trackerDescription}
                  </p>
                </div>
                <div>
                  {projectTrackerLoading && (
                    <p role="status" className="text-sm text-ink-soft">
                      {copy.dashboard.trackerLoading}
                    </p>
                  )}
                  {projectTrackerError && (
                    <Alert variant="error">{copy.dashboard.trackerError}</Alert>
                  )}
                  {projectTracker && (
                    <>
                      <dl className="grid gap-x-6 border-y border-hairline sm:grid-cols-3">
                        <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-4 sm:border-b-0">
                          <dt className="text-sm text-ink-soft">
                            {copy.dashboard.trackerStateLabels.done}
                          </dt>
                          <dd className="text-lg font-semibold tabular-nums text-ink">
                            {doneCount} / {projectTracker.tasks.length}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-4 sm:border-b-0">
                          <dt className="text-sm text-ink-soft">
                            {copy.dashboard.trackerReadyTitle}
                          </dt>
                          <dd className="text-lg font-semibold tabular-nums text-ink">
                            {readyTasks.length}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 py-4">
                          <dt className="text-sm text-ink-soft">
                            {copy.dashboard.trackerStateLabels.blocked}
                          </dt>
                          <dd className="text-lg font-semibold tabular-nums text-ink">
                            {blockedCount}
                          </dd>
                        </div>
                      </dl>

                      <h3 className="mt-7 text-lg font-semibold text-ink">
                        {copy.dashboard.trackerReadyTitle}
                      </h3>
                      {readyTasks.length === 0 ? (
                        <p className="mt-3 text-sm leading-6 text-muted">
                          {copy.dashboard.trackerEmptyReady}
                        </p>
                      ) : (
                        <ol className="mt-3 divide-y divide-hairline">
                          {readyTasks.slice(0, 6).map((task) => (
                            <li key={task.id} className="py-4">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="font-mono text-xs text-acid-muted">
                                  {task.id}
                                </span>
                                <Badge variant="outline">
                                  {copy.dashboard.trackerStateLabels[task.state]}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm font-medium leading-6 text-ink">
                                {task.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-muted">
                                {task.section}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}

                      <details className="mt-7 border-t border-hairline pt-5">
                        <summary className="cursor-pointer text-sm font-medium text-ink-soft underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid">
                          {copy.dashboard.trackerAllTitle} (
                          {projectTracker.tasks.length})
                        </summary>
                        <ul className="mt-4 divide-y divide-hairline">
                          {projectTracker.tasks.map((task) => (
                            <li key={task.id} className="py-4">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="font-mono text-xs text-acid-muted">
                                  {task.id}
                                </span>
                                <Badge variant="outline">
                                  {copy.dashboard.trackerStateLabels[task.state]}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm font-medium leading-6 text-ink">
                                {task.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-muted">
                                {task.section}
                              </p>
                              <p className="mt-3 text-xs font-medium text-ink-soft">
                                {copy.dashboard.trackerAcceptance}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-muted">
                                {task.acceptanceCriteria}
                              </p>
                              {task.dependsOn.length > 0 && (
                                <p className="mt-2 text-xs leading-5 text-muted">
                                  {copy.dashboard.trackerDependencies}:{" "}
                                  {task.dependsOn.join(", ")}
                                </p>
                              )}
                              <p className="mt-2 text-xs leading-5 text-muted">
                                {copy.dashboard.trackerOwner}: {task.owner}
                              </p>
                              {task.completedAt && (
                                <p className="mt-2 text-xs leading-5 text-muted">
                                  {copy.dashboard.trackerCompletedAt}:{" "}
                                  <time dateTime={task.completedAt}>
                                    {new Intl.DateTimeFormat(locale).format(
                                      new Date(task.completedAt),
                                    )}
                                  </time>
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </details>
                      <p className="mt-4 text-xs leading-5 text-muted">
                        {copy.dashboard.trackerHistoryNote}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
