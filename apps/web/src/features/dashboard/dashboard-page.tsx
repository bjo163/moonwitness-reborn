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
  WorkspaceTemplate,
} from "@moonwitness/ui";
import {
  Boxes,
  Database,
  KeyRound,
  LayoutDashboard,
  Languages,
  LogOut,
  Menu,
  MessageSquare,
  Plug,
  ShieldCheck,
  Sparkles,
  Workflow as WorkflowIcon,
  BookOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { useMessages } from "../locale/messages";
import { useLocalePreference } from "../locale/use-locale-preference";
import { useTranslationCatalog } from "../locale/translation-catalog";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWorkflow, setHasWorkflow] = useState(false);
  const [hasCorpus, setHasCorpus] = useState(false);
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
          }
        } catch {
          if (!cancelled) {
            setHasWorkflow(false);
            setHasCorpus(false);
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
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Gagal memuat akun.",
        );
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function logout() {
    setError(null);
    try {
      await moonClient.logout();
      router.replace("/auth");
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : copy.dashboard.logoutError,
      );
    }
  }

  if (loading || !user) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center px-6 text-sm text-stone-300">
        {error ? (
          <Alert variant="error">{error}</Alert>
        ) : (
          <p role="status">{copy.common.loading}</p>
        )}
      </main>
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

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={copy.common.closeMenu}
      sidebar={
        <>
          <div className="flex h-12 items-center justify-between px-2">
            <Link
              href="/command-center"
              className="ql-hud-brand flex items-center gap-2.5 font-semibold tracking-tight"
            >
              <span className="flex size-8 items-center justify-center rounded-xl border border-[#354135] bg-[#121a13] text-[#d7ff63]">
                <Sparkles aria-hidden="true" size={16} />
              </span>
              MoonWitness
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={copy.common.closeMenu}
              onClick={() => setSidebarOpen(false)}
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </div>
          <nav
            className="mt-6 flex-1 space-y-1"
            aria-label={copy.common.dashboard}
          >
            <Link
              href="/command-center"
              className="ql-nav-link is-active"
              aria-current="page"
              onClick={() => setSidebarOpen(false)}
            >
              <LayoutDashboard aria-hidden="true" size={16} />
              {copy.common.dashboard}
            </Link>
            <Link
              href="/command-center/chat"
              className="ql-nav-link"
              onClick={() => setSidebarOpen(false)}
            >
              <MessageSquare aria-hidden="true" size={16} />
              {copy.common.chat}
            </Link>
            <Link
              href="/models"
              className="ql-nav-link"
              onClick={() => setSidebarOpen(false)}
            >
              <Boxes aria-hidden="true" size={16} />
              {copy.common.models}
            </Link>
            <Link
              href="/providers"
              className="ql-nav-link"
              onClick={() => setSidebarOpen(false)}
            >
              <KeyRound aria-hidden="true" size={16} />
              {copy.common.providers}
            </Link>
            {hasConnectors && (
              <Link
                href="/connectors"
                className="ql-nav-link"
                onClick={() => setSidebarOpen(false)}
              >
                <Plug aria-hidden="true" size={16} />
                {copy.common.integrations}
              </Link>
            )}
            {hasWorkflow && (
              <Link
                href="/workflow"
                className="ql-nav-link"
                onClick={() => setSidebarOpen(false)}
              >
                <WorkflowIcon aria-hidden="true" size={16} />
                {copy.workflow.navLabel}
              </Link>
            )}
            {hasCorpus && (
              <Link
                href="/corpus"
                className="ql-nav-link"
                onClick={() => setSidebarOpen(false)}
              >
                <BookOpen aria-hidden="true" size={16} />
                {locale === "id" ? "Kitab & Sumber" : "Books & sources"}
              </Link>
            )}
            {isAdmin && (
              <>
                <Link
                  href="/admin/users"
                  className="ql-nav-link"
                  onClick={() => setSidebarOpen(false)}
                >
                  <ShieldCheck aria-hidden="true" size={16} />
                  {copy.common.users}
                </Link>
                <Link
                  href="/admin/translations"
                  className="ql-nav-link"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Languages aria-hidden="true" size={16} />
                  {t("web.translationAdmin.title")}
                </Link>
              </>
            )}
          </nav>
          <div className="mt-4 flex items-center gap-2 border-t border-[#354135] px-2 pt-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-stone-200">
                {user.name}
              </div>
              <div className="truncate text-[11px] text-stone-400">
                {user.email}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={copy.common.logout}
              title={copy.common.logout}
              onClick={() => void logout()}
            >
              <LogOut aria-hidden="true" size={16} />
            </Button>
          </div>
        </>
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
            <span className="text-sm font-medium text-stone-200">
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
          <header className="grid gap-8 border-b border-[#354135] pb-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-100 md:text-5xl">
                {copy.dashboard.greeting} {user.name}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-300 md:text-base">
                {copy.dashboard.description}
              </p>
            </div>
            <Button onClick={() => router.push("/command-center/chat")}>
              <MessageSquare aria-hidden="true" size={16} />
              {copy.dashboard.continueChat}
            </Button>
          </header>

          {(error || localeError) && (
            <Alert variant="error" className="mt-6">
              {error ?? localeError}
            </Alert>
          )}

          <section className="grid gap-7 py-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-stone-100">
                {copy.dashboard.availableTitle}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-stone-400">
                {copy.dashboard.availableDescription}
              </p>
            </div>
            <ul className="divide-y divide-[#354135] border-y border-[#354135]">
              <li>
                <Link
                  href="/command-center/chat"
                  className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff63]"
                >
                  <MessageSquare
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-[#d7ff63]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-100 group-hover:text-[#d7ff63]">
                      {copy.common.chat}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-stone-400">
                      {copy.dashboard.chatDescription}
                    </span>
                  </span>
                  <Badge variant="live">{copy.common.statusAvailable}</Badge>
                </Link>
              </li>
              <li>
                <Link
                  href="/models"
                  className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff63]"
                >
                  <Database
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-[#d7ff63]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-100 group-hover:text-[#d7ff63]">
                      {copy.common.models}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-stone-400">
                      {copy.dashboard.modelsDescription}
                    </span>
                  </span>
                  <Badge variant="outline">{copy.common.statusAvailable}</Badge>
                </Link>
              </li>
              <li>
                <Link
                  href="/providers"
                  className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff63]"
                >
                  <KeyRound
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-[#d7ff63]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-100 group-hover:text-[#d7ff63]">
                      {copy.common.providers}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-stone-400">
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
                    className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff63]"
                  >
                    <Plug
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-[#d7ff63]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-stone-100 group-hover:text-[#d7ff63]">
                        {copy.common.integrations}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-stone-400">
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
                    className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff63]"
                  >
                    <WorkflowIcon
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-[#d7ff63]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-stone-100 group-hover:text-[#d7ff63]">
                        {copy.workflow.navLabel}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-stone-400">
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
                    className="group flex items-center gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff63]"
                  >
                    <BookOpen
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-[#d7ff63]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-stone-100 group-hover:text-[#d7ff63]">
                        {locale === "id" ? "Kitab & Sumber" : "Books & sources"}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-stone-400">
                        {locale === "id"
                          ? "Baca Qur'an (Tanzil Uthmani) atau terjemahan yang diatribusi (RWWAD English, Kemenag Indonesia)."
                          : "Read the Qur'an (Tanzil Uthmani) or an attributed translation (RWWAD English, Kemenag Indonesian)."}
                      </span>
                    </span>
                    <Badge variant="outline">{copy.common.statusAvailable}</Badge>
                  </Link>
                </li>
              )}
            </ul>
          </section>

          <section className="border-t border-[#354135] py-10">
            <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-stone-100">
                  {copy.dashboard.directionTitle}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-stone-300">
                  {copy.dashboard.directionDescription}
                </p>
                <p className="mt-3 max-w-sm text-xs leading-5 text-stone-400">
                  {copy.dashboard.directionNote}
                </p>
              </div>
              <div>
                <Badge variant="outline">{copy.common.statusProposed}</Badge>
                <ol className="mt-5 flex flex-wrap gap-2">
                  {copy.landing.journey.map((step, index) => (
                    <li
                      key={step}
                      className="inline-flex items-center gap-2 rounded-full border border-[#354135] px-3 py-2 text-xs text-stone-200"
                    >
                      <span className="tabular-nums text-[#b8cc91]">
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
              className="border-t border-[#354135] py-10"
              aria-labelledby="project-tracker-title"
            >
              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2
                    id="project-tracker-title"
                    className="text-2xl font-semibold tracking-tight text-stone-100"
                  >
                    {copy.dashboard.trackerTitle}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-stone-300">
                    {copy.dashboard.trackerDescription}
                  </p>
                </div>
                <div>
                  {projectTrackerLoading && (
                    <p role="status" className="text-sm text-stone-300">
                      {copy.dashboard.trackerLoading}
                    </p>
                  )}
                  {projectTrackerError && (
                    <Alert variant="error">{copy.dashboard.trackerError}</Alert>
                  )}
                  {projectTracker && (
                    <>
                      <dl className="grid gap-x-6 border-y border-[#354135] sm:grid-cols-3">
                        <div className="flex items-baseline justify-between gap-3 border-b border-[#354135] py-4 sm:border-b-0">
                          <dt className="text-sm text-stone-300">
                            {copy.dashboard.trackerStateLabels.done}
                          </dt>
                          <dd className="text-lg font-semibold tabular-nums text-stone-100">
                            {doneCount} / {projectTracker.tasks.length}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 border-b border-[#354135] py-4 sm:border-b-0">
                          <dt className="text-sm text-stone-300">
                            {copy.dashboard.trackerReadyTitle}
                          </dt>
                          <dd className="text-lg font-semibold tabular-nums text-stone-100">
                            {readyTasks.length}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 py-4">
                          <dt className="text-sm text-stone-300">
                            {copy.dashboard.trackerStateLabels.blocked}
                          </dt>
                          <dd className="text-lg font-semibold tabular-nums text-stone-100">
                            {blockedCount}
                          </dd>
                        </div>
                      </dl>

                      <h3 className="mt-7 text-lg font-semibold text-stone-100">
                        {copy.dashboard.trackerReadyTitle}
                      </h3>
                      {readyTasks.length === 0 ? (
                        <p className="mt-3 text-sm leading-6 text-stone-400">
                          {copy.dashboard.trackerEmptyReady}
                        </p>
                      ) : (
                        <ol className="mt-3 divide-y divide-[#354135]">
                          {readyTasks.slice(0, 6).map((task) => (
                            <li key={task.id} className="py-4">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="font-mono text-xs text-[#b8cc91]">
                                  {task.id}
                                </span>
                                <Badge variant="outline">
                                  {copy.dashboard.trackerStateLabels[task.state]}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm font-medium leading-6 text-stone-100">
                                {task.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-stone-400">
                                {task.section}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}

                      <details className="mt-7 border-t border-[#354135] pt-5">
                        <summary className="cursor-pointer text-sm font-medium text-stone-200 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff63]">
                          {copy.dashboard.trackerAllTitle} (
                          {projectTracker.tasks.length})
                        </summary>
                        <ul className="mt-4 divide-y divide-[#354135]">
                          {projectTracker.tasks.map((task) => (
                            <li key={task.id} className="py-4">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="font-mono text-xs text-[#b8cc91]">
                                  {task.id}
                                </span>
                                <Badge variant="outline">
                                  {copy.dashboard.trackerStateLabels[task.state]}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm font-medium leading-6 text-stone-100">
                                {task.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-stone-400">
                                {task.section}
                              </p>
                              <p className="mt-3 text-xs font-medium text-stone-300">
                                {copy.dashboard.trackerAcceptance}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-stone-400">
                                {task.acceptanceCriteria}
                              </p>
                              {task.dependsOn.length > 0 && (
                                <p className="mt-2 text-xs leading-5 text-stone-400">
                                  {copy.dashboard.trackerDependencies}:{" "}
                                  {task.dependsOn.join(", ")}
                                </p>
                              )}
                              <p className="mt-2 text-xs leading-5 text-stone-400">
                                {copy.dashboard.trackerOwner}: {task.owner}
                              </p>
                              {task.completedAt && (
                                <p className="mt-2 text-xs leading-5 text-stone-400">
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
                      <p className="mt-4 text-xs leading-5 text-stone-400">
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
