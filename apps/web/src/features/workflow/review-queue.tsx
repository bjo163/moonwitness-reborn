"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto as AuthUser,
  type TransitionActionDto,
  type WorkflowChangeDto,
  type WorkflowTransitionDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  Textarea,
  WorkspaceTemplate,
} from "@moonwitness/ui";
import { Boxes, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { useMessages } from "../locale/messages";
import { useLocalePreference } from "../locale/use-locale-preference";

/**
 * Actions the reviewer groups (admin/operator) may invoke on a change.
 * Kept in lock-step with `ql_workflow/services/workflow-service.ts`
 * `REVIEWER_ONLY_ACTIONS`; anything else is a submitter action and the
 * server is the real gate here (the UI only mirrors it).
 */
const REVIEWER_ACTIONS: readonly TransitionActionDto[] = [
  "start_review",
  "approve",
  "request_changes",
  "reject",
  "publish",
  "withdraw",
  "supersede",
];

/** Actions the change owner (submitter) may invoke. */
const SUBMITTER_ACTIONS: readonly TransitionActionDto[] = ["submit"];

/**
 * Legal `(state, action)` edges — mirrors the state machine table so the
 * UI can hide buttons that would fail. The server still enforces this;
 * the client mirror is a UX nicety, never a security control.
 */
const LEGAL_EDGES: Record<string, readonly TransitionActionDto[]> = {
  draft: ["submit"],
  submitted: ["start_review"],
  in_review: ["approve", "request_changes", "reject"],
  changes_requested: ["submit"],
  approved: ["publish", "withdraw"],
  published: ["supersede", "withdraw"],
  rejected: [],
  withdrawn: [],
  superseded: [],
};

type BadgeTone = "default" | "live" | "outline";

function reviewStateTone(state: string): BadgeTone {
  switch (state) {
    case "approved":
    case "published":
      return "live";
    case "submitted":
    case "in_review":
    case "changes_requested":
    case "rejected":
    case "withdrawn":
    case "superseded":
      return "outline";
    default:
      return "default";
  }
}

function formatDate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

// `interface` is used here per the clean-code ruleset; `DataTable<Row>`
// binds its Row to `Record<string, string | number | boolean | null>`.
interface TableRow {
  [key: string]: string | number | boolean | null;
  id: string;
  title: string;
  state: string;
  urgency: string;
  revision: number;
  updated_at: string;
}

const actionVariants: Partial<
  Record<TransitionActionDto, "default" | "danger">
> = {
  approve: "default",
  publish: "default",
  reject: "danger",
  withdraw: "danger",
  supersede: "danger",
};

export default function ReviewQueue() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [changes, setChanges] = useState<WorkflowChangeDto[]>([]);
  const [selected, setSelected] = useState<WorkflowChangeDto | null>(null);
  const [transitions, setTransitions] = useState<WorkflowTransitionDto[]>([]);
  const [reason, setReason] = useState("");
  const { locale, changeLocale, saving: localeSaving } =
    useLocalePreference(user ?? null);
  const copy = useMessages();
  const wf = copy.workflow;

  const isReviewer = useMemo(() => {
    if (!user) return false;
    return user.groups.some((group) => group === "admin" || group === "operator");
  }, [user]);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    setError(null);
    try {
      if (isReviewer) {
        const reply = await moonClient.listWorkflowQueue();
        setChanges(reply.changes);
      } else {
        // Members see only their own drafts through the generic list.
        const reply = await moonClient.listRecords("workflow.change");
        setChanges(
          reply.records.map((record) => ({
            id: String(record.id ?? ""),
            title: String(record.title ?? ""),
            body: String(record.body ?? ""),
            subject_type: String(record.subject_type ?? ""),
            subject_id: String(record.subject_id ?? ""),
            state: String(record.state ?? "draft") as WorkflowChangeDto["state"],
            urgency: String(record.urgency ?? "medium"),
            revision: Number(record.revision ?? 1),
            created_at: Number(record.created_at ?? 0),
            updated_at: Number(record.updated_at ?? 0),
          })),
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : wf.errorQueue,
      );
    } finally {
      setQueueLoading(false);
    }
  }, [isReviewer, wf.errorQueue]);

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .currentUser()
      .then(({ user: currentUser }) => {
        if (!cancelled) setUser(currentUser);
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
            : wf.errorQueue,
        );
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, wf.errorQueue]);

  useEffect(() => {
    if (!user) return;
    void loadQueue();
  }, [user, loadQueue]);

  async function openChange(change: WorkflowChangeDto) {
    setSelected(change);
    setNotice(null);
    setError(null);
    setReason("");
    try {
      const reply = await moonClient.listWorkflowTransitions(change.id);
      setTransitions(reply.transitions);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : wf.errorQueue,
      );
      setTransitions([]);
    }
  }

  async function fire(action: TransitionActionDto) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const reply = await moonClient.requestWorkflowTransition(selected.id, {
        action,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      setSelected(reply.change);
      setNotice(wf.transitionSaved);
      const audit = await moonClient.listWorkflowTransitions(selected.id);
      setTransitions(audit.transitions);
      // Refresh the queue row so state chips stay accurate.
      setChanges((current) =>
        current.map((row) => (row.id === reply.change.id ? reply.change : row)),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : wf.errorTransition,
      );
    } finally {
      setSaving(false);
    }
  }

  const allowedActions: TransitionActionDto[] = selected
    ? (LEGAL_EDGES[selected.state] ?? []).filter((action) =>
        isReviewer
          ? REVIEWER_ACTIONS.includes(action)
          : SUBMITTER_ACTIONS.includes(action),
      )
    : [];

  if (loading || user === undefined) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center px-6 text-sm text-stone-300">
        <p role="status">{wf.loading}</p>
      </main>
    );
  }

  if (!user) {
    // The 401 branch above already redirects; reaching this state means an
    // unexpected auth failure. Render the error and let the dashboard
    // sidebar recover.
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center px-6 text-sm text-stone-300">
        <Alert variant="error">{error ?? wf.errorQueue}</Alert>
      </main>
    );
  }

  const tableRows: TableRow[] = changes.map((change) => ({
    id: change.id,
    title: change.title,
    state: wf.stateLabels[change.state] ?? change.state,
    urgency: change.urgency,
    revision: change.revision,
    updated_at: formatDate(change.updated_at),
  }));

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
                <ShieldCheck aria-hidden="true" size={16} />
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
          <nav className="mt-6 flex-1 space-y-1" aria-label={copy.common.mainNavigation}>
            <Link
              href="/command-center"
              className="ql-nav-link"
              onClick={() => setSidebarOpen(false)}
            >
              <ShieldCheck aria-hidden="true" size={16} />
              {copy.common.dashboard}
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
              href="/workflow"
              className="ql-nav-link is-active"
              aria-current="page"
              onClick={() => setSidebarOpen(false)}
            >
              <ShieldCheck aria-hidden="true" size={16} />
              {wf.navLabel}
            </Link>
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
              onClick={() => {
                void moonClient.logout().then(() => router.replace("/auth"));
              }}
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
              {wf.queueTitle}
            </span>
          </div>
          <LocaleSwitcher
            locale={locale}
            label={copy.common.localeLabel}
            onChange={(nextLocale) => void changeLocale(nextLocale)}
            disabled={localeSaving}
          />
        </>
      }
    >
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
          <header className="border-b border-[#354135] pb-6">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-stone-100 md:text-4xl">
              {wf.queueTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
              {wf.queueSubtitle}
            </p>
          </header>

          {error && (
            <Alert variant="error" className="mt-6">
              {error}
            </Alert>
          )}
          {notice && (
            <Alert variant="info" className="mt-6">
              {notice}
            </Alert>
          )}

          <section className="mt-8">
            <DataTable<TableRow>
              columns={[
                { key: "title", label: wf.columnTitle },
                { key: "state", label: wf.columnState },
                { key: "urgency", label: wf.columnUrgency },
                { key: "revision", label: wf.columnRevision },
                { key: "updated_at", label: wf.columnUpdated },
              ]}
              rows={tableRows}
              rowKey="id"
              actionsLabel={copy.common.actions}
              yesLabel={copy.common.yes}
              noLabel={copy.common.no}
              onRowClick={(row) => {
                const change = changes.find((item) => item.id === row.id);
                if (change) void openChange(change);
              }}
              emptyMessage={
                queueLoading ? wf.loading : wf.empty
              }
            />
          </section>

          {selected && (
            <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>{wf.detailTitle}</CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-100">
                      {selected.title}
                    </h3>
                    <p className="mt-1 text-sm text-stone-300">
                      {selected.body || "—"}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs text-stone-400">
                    <div>
                      <dt>{wf.columnState}</dt>
                      <dd className="mt-1">
                        <Badge variant={reviewStateTone(selected.state)}>
                          {wf.stateLabels[selected.state] ?? selected.state}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt>{wf.detailSubject}</dt>
                      <dd className="mt-1 truncate text-stone-200">
                        {selected.subject_type}
                        {selected.subject_id ? ` · ${selected.subject_id}` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>{wf.columnUrgency}</dt>
                      <dd className="mt-1 text-stone-200">{selected.urgency}</dd>
                    </div>
                    <div>
                      <dt>{wf.columnRevision}</dt>
                      <dd className="mt-1 text-stone-200">{selected.revision}</dd>
                    </div>
                  </dl>
                  <div>
                    <label className="text-xs text-stone-400" htmlFor="workflow-reason">
                      {wf.reasonLabel}
                    </label>
                    <Textarea
                      id="workflow-reason"
                      className="mt-1"
                      value={reason}
                      placeholder={wf.reasonPlaceholder}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allowedActions.map((action) => (
                      <Button
                        key={action}
                        variant={actionVariants[action] ?? "secondary"}
                        disabled={saving}
                        onClick={() => void fire(action)}
                      >
                        {wf.actionLabels[action] ?? action}
                      </Button>
                    ))}
                    {allowedActions.length === 0 && (
                      <p className="text-xs text-stone-400">
                        {isReviewer
                          ? "Tidak ada aksi reviewer yang tersedia untuk state ini."
                          : "Tidak ada aksi submitter yang tersedia untuk state ini."}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>{wf.auditTitle}</CardHeader>
                <CardContent>
                  {transitions.length === 0 ? (
                    <p className="text-sm text-stone-400">{wf.auditEmpty}</p>
                  ) : (
                    <ul className="divide-y divide-[#354135] text-xs text-stone-300">
                      {transitions.map((entry) => (
                        <li key={entry.id} className="py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {wf.actionLabels[entry.action] ?? entry.action}
                            </Badge>
                            <span className="text-stone-400">
                              {wf.auditFrom}{" "}
                              {wf.stateLabels[entry.from_state] ?? entry.from_state}{" "}
                              → {wf.auditTo}{" "}
                              {wf.stateLabels[entry.to_state] ?? entry.to_state}
                            </span>
                            <span className="ml-auto text-stone-500">
                              {formatDate(entry.created_at)}
                            </span>
                          </div>
                          {entry.reason && (
                            <p className="mt-1 text-stone-400">
                              {wf.auditReason}: {entry.reason}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
