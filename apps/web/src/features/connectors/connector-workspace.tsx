"use client";

import {
  MoonClientError,
  moonClient,
  type AuthUserDto as AuthUser,
  type ConnectorDto as Connector,
  type ConnectorKindDto as ConnectorKind,
  type ConnectorTokenSource,
  type ConnectorVerifyStatus,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CenteredAuth,
  Checkbox,
  cn,
  FormField,
  Input,
  LoadingScreen,
  PageHeader,
  SectionGrid,
  Select,
  SidebarTrigger,
  WorkspaceSidebar,
  WorkspaceTemplate,
} from "@moonwitness/ui";
import {
  ArrowLeft,
  Boxes,
  ExternalLink,
  Globe,
  KeyRound,
  Plug,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiErrorMessage } from "../locale/api-error-message";
import { translateMetadata } from "../locale/translate-metadata";
import {
  type UiMessageKey,
  useTranslationCatalog,
} from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

interface ConnectorDraft {
  id?: string;
  kind: string;
  label: string;
  enabled: boolean;
}

const tokenSourceKeys: Record<ConnectorTokenSource, UiMessageKey> = {
  unresolved: "web.connectors.unresolved",
  env: "web.connectors.environment",
  keychain: "web.connectors.keychain",
  config_file: "web.connectors.configFile",
};

const verifyStatusKeys: Record<ConnectorVerifyStatus, UiMessageKey> = {
  unverified: "web.connectors.unverified",
  ok: "web.connectors.tokenOk",
  invalid: "web.connectors.tokenInvalid",
  network: "web.connectors.networkIssue",
  missing: "web.connectors.tokenMissing",
};

function formatTime(value: string | null, locale: "id" | "en"): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(locale === "id" ? "id-ID" : "en-US");
}

export default function ConnectorWorkspace() {
  const [user, setUser] = useState<AuthUser | null>(null);
  useLocalePreference(user);
  const { t, tm, locale } = useTranslationCatalog();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [kinds, setKinds] = useState<ConnectorKind[]>([]);
  const [maxPerOwner, setMaxPerOwner] = useState(0);
  const [draft, setDraft] = useState<ConnectorDraft>({
    kind: "",
    label: "",
    enabled: true,
  });
  const [deleteTarget, setDeleteTarget] = useState<Connector | null>(null);
  const [confirmLabel, setConfirmLabel] = useState("");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingRow, setPendingRow] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canManage = (user?.groups ?? []).includes("connector");
  const canOperate = (user?.groups ?? []).includes("operator");

  const loadConnectors = useCallback(async () => {
    const result = await moonClient.listConnectors();
    setConnectors(result.connectors);
    setKinds(result.kinds);
    setMaxPerOwner(result.maxPerOwner);
    setDraft((current) =>
      current.id || current.kind
        ? current
        : { ...current, kind: result.kinds[0]?.kind ?? "" },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const session = await moonClient.currentUser();
        if (cancelled) return;
        setUser(session.user);
        await loadConnectors();
      } catch (loadError) {
        if (
          !cancelled &&
          !(loadError instanceof MoonClientError && loadError.status === 401)
        ) {
          setError(apiErrorMessage(loadError, t));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [loadConnectors, t]);

  const selectedKind = kinds.find((kind) => kind.kind === draft.kind);
  const limitReached = maxPerOwner > 0 && connectors.length >= maxPerOwner;

  function resetDraft() {
    setDraft({ kind: kinds[0]?.kind ?? "", label: "", enabled: true });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (draft.id) {
        await moonClient.updateConnector(draft.id, {
          label: draft.label,
          enabled: draft.enabled,
        });
        setNotice(t("web.connectors.saved"));
      } else {
        await moonClient.createConnector({
          kind: draft.kind,
          label: draft.label,
        });
        setNotice(
          t("web.connectors.addedNotice"),
        );
      }
      resetDraft();
      await loadConnectors();
    } catch (saveError) {
      setError(apiErrorMessage(saveError, t));
    } finally {
      setSaving(false);
    }
  }

  async function runAction(connector: Connector, action: "verify" | "sync") {
    setPendingRow(`${connector.id}:${action}`);
    setError(null);
    setNotice(null);
    try {
      if (action === "verify") {
        await moonClient.verifyConnector(connector.id);
        setNotice(t("web.connectors.verifyCompleted"));
      } else {
        await moonClient.syncConnector(connector.id);
        setNotice(t("web.connectors.syncCompleted"));
      }
    } catch (actionError) {
      setError(apiErrorMessage(actionError, t));
    } finally {
      setPendingRow(null);
      try {
        await loadConnectors();
      } catch (refreshError) {
        setError(apiErrorMessage(refreshError, t));
      }
    }
  }

  async function toggleEnabled(connector: Connector) {
    setPendingRow(`${connector.id}:toggle`);
    setError(null);
    setNotice(null);
    try {
      await moonClient.updateConnector(connector.id, {
        enabled: !connector.enabled,
      });
      setNotice(
        connector.enabled
          ? t("web.connectors.disabledNotice", { name: connector.label })
          : t("web.connectors.enabledNotice", { name: connector.label }),
      );
    } catch (toggleError) {
      setError(apiErrorMessage(toggleError, t));
    } finally {
      setPendingRow(null);
      try {
        await loadConnectors();
      } catch (refreshError) {
        setError(apiErrorMessage(refreshError, t));
      }
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      await moonClient.deleteConnector(deleteTarget.id, {
        confirmLabel: confirmLabel.trim(),
      });
      setNotice(
        t("web.connectors.deletedNotice", { name: deleteTarget.label }),
      );
      if (draft.id === deleteTarget.id) resetDraft();
      setDeleteTarget(null);
      setConfirmLabel("");
    } catch (deleteError) {
      setError(apiErrorMessage(deleteError, t));
    } finally {
      setSaving(false);
      try {
        await loadConnectors();
      } catch (refreshError) {
        setError(apiErrorMessage(refreshError, t));
      }
    }
  }

  async function logout() {
    try {
      await moonClient.logout();
      router.replace("/auth");
    } catch (logoutError) {
      setError(apiErrorMessage(logoutError, t));
    }
  }

  if (busy) {
    return <LoadingScreen label={t("web.connectors.loading")} />;
  }

  if (!user) {
    return (
      <CenteredAuth>
        <div className="mb-5 flex items-center gap-3">
          <Plug size={20} className="text-acid" />
          <h1 className="text-lg font-semibold">{t("web.connectors.signIn")}</h1>
        </div>
        <p className="text-sm leading-6 text-muted">
          {t("web.connectors.description")}
        </p>
        {error && (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        )}
        <Button
          className="mt-5 w-full"
          onClick={() => (window.location.href = "/auth")}
        >
          <ArrowLeft size={16} />
          {t("web.auth.loginAction")}
        </Button>
      </CenteredAuth>
    );
  }

  let buttonLabel: string;
  if (saving) {
    buttonLabel = t("web.connectors.saving");
  } else if (draft.id) {
    buttonLabel = t("web.connectors.save");
  } else {
    buttonLabel = t("web.connectors.add");
  }

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={t("web.common.closeMenu")}
      sidebar={
        <WorkspaceSidebar
          brandIcon={<Plug aria-hidden="true" size={16} />}
          closeLabel={t("web.common.closeMenu")}
          identity={{ name: user.name, subtitle: user.email }}
          items={[
            {
              href: "/command-center/chat",
              label: t("web.connectors.back"),
              icon: <ArrowLeft aria-hidden="true" size={16} />,
              onSelect: () => setSidebarOpen(false),
            },
            {
              href: "/models",
              label: t("web.connectors.models"),
              icon: <Boxes aria-hidden="true" size={16} />,
            onSelect: () => setSidebarOpen(false),
            },
            {
              href: "/providers",
              label: t("web.connectors.providers"),
              icon: <KeyRound aria-hidden="true" size={16} />,
            onSelect: () => setSidebarOpen(false),
            },
            {
              href: "/connectors",
              label: t("web.common.integrations"),
              icon: <Plug aria-hidden="true" size={16} />,
              active: true,
            onSelect: () => setSidebarOpen(false),
            },
            ...(user.groups.includes("admin")
              ? [
                  {
                    href: "/admin/users",
                    label: t("web.connectors.users"),
                    icon: <ShieldCheck aria-hidden="true" size={16} />,
                  onSelect: () => setSidebarOpen(false),
                  },
                ]
              : []),
          ]}
          logout={{ label: t("web.common.logout"), onLogout: () => void logout() }}
          navLabel={t("web.connectors.integrations")}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      }
      header={
        <>
          <div className="flex items-center gap-2">
            <SidebarTrigger
              label={t("web.common.openMenu")}
              onOpenSidebar={() => setSidebarOpen(true)}
              sidebarOpen={sidebarOpen}
            />
            <div>
              <div className="text-sm font-semibold">{t("web.connectors.integrations")}</div>
              <div className="text-xs text-muted">
                {t("web.connectors.integrationsDescription")}
              </div>
            </div>
          </div>
          <Badge variant="outline">{t("web.connectors.zoneCount", { count: connectors.length })}</Badge>
        </>
      }
    >
      <div className="ql-page-body">
        <PageHeader
          description={t("web.connectors.securityDescription")}
          eyebrow={t("web.connectors.eyebrow")}
          title={t("web.connectors.title")}
        />

        {error && (
          <Alert variant="error" className="mt-5">
            {error}
          </Alert>
        )}
        {notice && <Alert className="mt-5">{notice}</Alert>}

        <section
          className="mt-6 space-y-3"
          aria-label={t("web.connectors.savedConnectors")}
        >
          {connectors.length === 0 && (
            <Card>
              <CardContent>
                    {t("web.connectors.empty")}
              </CardContent>
            </Card>
          )}
          {connectors.map((connector) => {
            const kind = kinds.find((item) => item.kind === connector.kind);
            const isPending = pendingRow?.startsWith(`${connector.id}:`) ?? false;
  return (
              <Card
                key={connector.id}
                className={cn(connector.enabled || "opacity-70")}
              >
                <CardContent className="flex flex-wrap items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center border border-hairline bg-panel-edge text-acid">
                    <Plug size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold">{connector.label}</h2>
                      <Badge variant={connector.enabled ? "live" : "default"}>
                        {connector.enabled ? t("web.connectors.enabled") : t("web.connectors.disabled")}
                      </Badge>
                      <Badge
                        variant={
                          connector.verifyStatus === "ok" ? "default" : "outline"
                        }
                      >
                        {t(verifyStatusKeys[connector.verifyStatus])}
                      </Badge>
                      {kind?.readonly && <Badge variant="outline">{t("web.connectors.readOnly")}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {kind
                        ? translateMetadata(kind.labelKey, kind.label, tm)
                        : connector.kind} ·{" "}
                      {t("web.connectors.tokenSource", {
                        source: t(tokenSourceKeys[connector.tokenSource]),
                      })}
                    </p>
                    <p className="mt-1 break-all text-[11px] text-muted-dim">
                      {connector.tokenRef || t("web.connectors.neverRead")}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {t("web.connectors.lastVerified", {
                        date: formatTime(connector.lastVerifyAt, locale),
                      })} ·{" "}
                      {t("web.connectors.lastSynced", {
                        date: formatTime(connector.lastSyncAt, locale),
                      })}
                    </p>
                    {connector.lastSyncStatus && (
                      <p className="mt-1 text-[11px] text-muted">
                        {t("web.connectors.lastSyncStatus", {
                          status: translateMetadata(
                            `web.connectors.syncStatuses.${connector.lastSyncStatus}`,
                            connector.lastSyncStatus,
                            tm,
                          ),
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {kind?.capabilities.includes("dns") && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          (window.location.href = `/connectors/${encodeURIComponent(connector.id)}/dns`)
                        }
                      >
                        <Globe size={15} />
                        {t("web.connectors.dns")}
                      </Button>
                    )}
                    {canManage && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => void runAction(connector, "verify")}
                        >
                          <ShieldCheck size={15} />
                          {t("web.connectors.verify")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => void toggleEnabled(connector)}
                        >
                          {connector.enabled
                            ? t("web.connectors.deactivate")
                            : t("web.connectors.activate")}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setDraft({
                              id: connector.id,
                              kind: connector.kind,
                              label: connector.label,
                              enabled: connector.enabled,
                            })
                          }
                        >
                          {t("web.connectors.edit")}
                        </Button>
                        <Button
                          variant="danger"
                          size="icon"
                          aria-label={t("web.connectors.delete", {
                            name: connector.label,
                          })}
                          onClick={() => {
                            setDeleteTarget(connector);
                            setConfirmLabel("");
                            setError(null);
                          }}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </>
                    )}
                    {canOperate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending || !connector.enabled}
                        onClick={() => void runAction(connector, "sync")}
                      >
                        <RefreshCw size={15} />
                        {t("web.connectors.sync")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {canManage && (
          <Card className="mt-6">
            <CardContent>
              <form onSubmit={(event) => void save(event)}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="ql-eyebrow">{draft.id ? t("web.connectors.editEyebrow") : t("web.connectors.newEyebrow")}</div>
                    <h2 className="mt-1 text-lg font-semibold">
                      {draft.id ? t("web.connectors.editLabel") : t("web.connectors.newLabel")}
                    </h2>
                  </div>
                  {draft.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetDraft}
                    >
                      {t("web.connectors.cancelEdit")}
                    </Button>
                  )}
                </div>
                <SectionGrid>
                  <FormField label={t("web.connectors.kind")} htmlFor="connector-kind">
                    <Select
                      id="connector-kind"
                      required
                      disabled={draft.id !== undefined}
                      value={draft.kind}
                      onChange={(event) =>
                        setDraft({ ...draft, kind: event.target.value })
                      }
                    >
                      {kinds.map((kind) => (
                        <option key={kind.kind} value={kind.kind}>
                          {translateMetadata(kind.labelKey, kind.label, tm)}
                          {kind.readonly ? ` (${t("web.connectors.readOnly")})` : ""}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label={t("web.connectors.label")} htmlFor="connector-label">
                    <Input
                      id="connector-label"
                      required
                      maxLength={80}
                      value={draft.label}
                      onChange={(event) =>
                        setDraft({ ...draft, label: event.target.value })
                      }
                      placeholder={t("web.connectors.labelPlaceholder")}
                    />
                  </FormField>
                </SectionGrid>

                {selectedKind && (
                  <div className="mt-4 border border-hairline bg-panel-edge/60 p-4">
                    <p className="text-xs leading-6 text-muted">
                      {translateMetadata(
                        selectedKind.credentialHelpKey,
                        selectedKind.credentialHelp,
                        tm,
                      )}
                    </p>
                    <p className="mt-2 text-[11px] text-muted">
                      {t("web.connectors.capabilities", {
                        capabilities:
                          selectedKind.capabilities
                            .map((capability) =>
                              translateMetadata(
                                `web.connectors.capabilities.${capability}`,
                                capability.toUpperCase(),
                                tm,
                              ),
                            )
                            .join(", ") || "—",
                      })}{" "}
                      {selectedKind.readonly
                        ? t("web.connectors.readOnlyCapability")
                        : t("web.connectors.writableCapability")}
                    </p>
                    <a
                      href={selectedKind.helpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-acid"
                    >
                      {t("web.connectors.configureToken")}
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}

                <label className="ql-inline-label mt-4" htmlFor="connector-enabled">
                  <Checkbox
                    id="connector-enabled"
                    checked={draft.enabled}
                    onChange={(event) =>
                      setDraft({ ...draft, enabled: event.target.checked })
                    }
                  />
                  {t("web.connectors.enableConnector")}
                </label>

                <div className="mt-5 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving || (!draft.id && limitReached)}
                  >
                    <Save size={15} />
                    {buttonLabel}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {deleteTarget && (
          <Card className="mt-6">
            <CardContent>
              <h2 className="text-lg font-semibold">
                {t("web.connectors.deleteHeading", {
                  name: deleteTarget.label,
                })}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t("web.connectors.deleteDescription")}{" "}
                <span className="text-acid">{deleteTarget.label}</span>{" "}
                persis untuk mengonfirmasi.
              </p>
              <div className="mt-4 max-w-md">
                <FormField label={t("web.connectors.confirmName")} htmlFor="delete-confirm">
                  <Input
                    id="delete-confirm"
                    value={confirmLabel}
                    onChange={(event) => setConfirmLabel(event.target.value)}
                    placeholder={deleteTarget.label}
                  />
                </FormField>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeleteTarget(null);
                    setConfirmLabel("");
                  }}
                >
                  {t("web.connectors.cancel")}
                </Button>
                <Button
                  variant="danger"
                  disabled={
                    saving || confirmLabel.trim() !== deleteTarget.label.trim()
                  }
                  onClick={() => void confirmDelete()}
                >
                  <Trash2 size={15} />
                  {t("web.connectors.deleteAction")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </WorkspaceTemplate>
  );
}
