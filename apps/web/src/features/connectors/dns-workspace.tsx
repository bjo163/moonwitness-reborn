"use client";

import {
  MoonClientError,
  moonClient,
  type AuthUserDto as AuthUser,
  type CloudflareRecordDto as DnsRecord,
  type CloudflareRecordInputDto as DnsRecordInput,
  type CloudflareZoneDto as Zone,
  type ConnectorDto as Connector,
  type ConnectorKindDto as ConnectorKind,
  type IntegrationAuditDto as AuditEntry,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CenteredAuth,
  Checkbox,
  DataTable,
  FormField,
  Input,
  ListOption,
  LoadingScreen,
  NavSectionLabel,
  OptionNav,
  PageHeader,
  Select,
  SidePanel,
  WorkspaceSidebar,
  WorkspaceTemplate,
  type DataTableColumn,
} from "@moonwitness/ui";
import {
  ArrowLeft,
  Globe,
  History,
  Menu,
  Plug,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

interface RecordRow {
  [column: string]: string;
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: string;
  proxied: string;
  flags: string;
}

interface RecordDraft {
  id?: string;
  name: string;
  type: string;
  content: string;
  ttl: string;
  proxied: boolean;
  comment: string;
}

interface AuditRow {
  [column: string]: string;
  id: string;
  createdAt: string;
  action: string;
  outcome: string;
  target: string;
  detail: string;
}

function emptyDraft(zoneName: string, types: readonly string[]): RecordDraft {
  return {
    name: zoneName,
    type: types[0] ?? "A",
    content: "",
    ttl: "1",
    proxied: false,
    comment: "",
  };
}

function toRow(
  record: DnsRecord,
  t: ReturnType<typeof useTranslationCatalog>["t"],
): RecordRow {
  const flags = [
    record.stale ? t("web.dns.mirrorStale") : "",
    record.managed ? t("web.dns.managed") : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    content: record.content,
    ttl: record.ttl === 1 ? t("web.dns.auto") : t("web.dns.ttlSeconds", { count: record.ttl }),
    proxied: record.proxied ? t("web.dns.yes") : t("web.dns.no"),
    flags: flags || "—",
  };
}

function toAuditRow(
  entry: AuditEntry,
  locale: "id" | "en",
): AuditRow {
  return {
    id: entry.id,
    createdAt: formatTime(entry.createdAt, locale),
    action: entry.action,
    outcome: entry.outcome,
    target: entry.target || "—",
    detail:
      entry.errorCode && entry.errorMessage
        ? `${entry.errorCode} · ${entry.errorMessage}`
        : entry.errorMessage || "—",
  };
}

function formatTime(value: string | null, locale: "id" | "en"): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(locale === "id" ? "id-ID" : "en-US");
}

export default function DnsWorkspace({ connectorId }: { connectorId: string }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  useLocalePreference(user);
  const { t, locale } = useTranslationCatalog();
  const [connector, setConnector] = useState<Connector | null>(null);
  const [kind, setKind] = useState<ConnectorKind | undefined>(undefined);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [typeQuery, setTypeQuery] = useState("");
  const [applied, setApplied] = useState({ name: "", type: "" });
  const [draft, setDraft] = useState<RecordDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DnsRecord | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canOperate = (user?.groups ?? []).includes("operator");
  const writable = Boolean(connector?.enabled) && kind?.readonly !== true;
  const zone = zones.find((item) => item.externalId === zoneId);
  const recordTypes = kind?.recordTypes ?? [];
  const proxiableTypes = kind?.proxiableTypes ?? [];

  const loadZones = useCallback(async (): Promise<Zone[]> => {
    const result = await moonClient.listConnectorZones(connectorId);
    setZones(result.zones);
    return result.zones;
  }, [connectorId]);

  const loadRecords = useCallback(async () => {
    if (!zoneId) {
      setRecords([]);
      return;
    }
    const result = await moonClient.listConnectorRecords(connectorId, zoneId, {
      name: applied.name || undefined,
      type: applied.type || undefined,
    });
    setRecords(result.records);
    setTruncated(result.truncated);
  }, [applied, connectorId, zoneId]);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const session = await moonClient.currentUser();
        if (cancelled) return;
        setUser(session.user);
        const [catalog, resultZones] = await Promise.all([
          moonClient.listConnectors(),
          loadZones(),
        ]);
        if (cancelled) return;
        const found = catalog.connectors.find((item) => item.id === connectorId);
        const definition = catalog.kinds.find(
          (item) => item.kind === found?.kind,
        );
        setConnector(found ?? null);
        setKind(definition);
        setZoneId(resultZones[0]?.externalId ?? "");
        if (!found) setError(t("web.dns.connectorNotFound"));
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
  }, [connectorId, loadZones, t]);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        await loadRecords();
      } catch (loadError) {
        if (!cancelled) setError(apiErrorMessage(loadError, t));
      }
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [loadRecords, t]);

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setApplied({ name: nameQuery.trim(), type: typeQuery });
  }

  /** Every panel is scoped to one zone, so switching zones must drop pending edits. */
  function selectZone(nextZone: Zone) {
    setZoneId(nextZone.externalId);
    setDraft(null);
    setDeleteTarget(null);
    setConfirmName("");
    setSidebarOpen(false);
    setError(null);
  }

  async function syncNow() {
    setSyncing(true);
    setError(null);
    setNotice(null);
    try {
      await moonClient.syncConnector(connectorId);
      setNotice(t("web.dns.syncCompleted"));
      const latest = await loadZones();
      if (!zoneId && latest[0]) setZoneId(latest[0].externalId);
      await loadRecords();
    } catch (syncError) {
      setError(apiErrorMessage(syncError, t));
    } finally {
      setSyncing(false);
    }
  }

  function openEditor(record?: DnsRecord) {
    setError(null);
    setDraft(
      record
        ? {
            id: record.id,
            name: record.name,
            type: record.type,
            content: record.content,
            ttl: String(record.ttl),
            proxied: record.proxied,
            comment: record.comment,
          }
        : emptyDraft(zone?.name ?? "", recordTypes),
    );
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !zone) return;
    const ttl = draft.proxied ? 1 : Number.parseInt(draft.ttl, 10);
    if (!Number.isInteger(ttl)) {
      setError(t("web.dns.invalidTtl"));
      return;
    }
    const input: DnsRecordInput = {
      name: draft.name.trim(),
      type: draft.type,
      content: draft.content.trim(),
      ttl,
      proxied: draft.proxied,
      ...(draft.comment.trim() ? { comment: draft.comment.trim() } : {}),
    };
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (draft.id) {
        await moonClient.updateConnectorRecord(
          connectorId,
          zone.externalId,
          draft.id,
          input,
        );
        setNotice(t("web.dns.recordUpdated", { name: input.name }));
      } else {
        await moonClient.createConnectorRecord(connectorId, zone.externalId, input);
        setNotice(t("web.dns.recordCreated"));
      }
      setDraft(null);
      await loadRecords();
    } catch (saveError) {
      setError(apiErrorMessage(saveError, t));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteRecord() {
    if (!deleteTarget || !zone) return;
    setSaving(true);
    setError(null);
    try {
      const result = await moonClient.deleteConnectorRecord(
        connectorId,
        zone.externalId,
        deleteTarget.id,
        { confirmName: confirmName.trim() },
      );
      setNotice(t("web.dns.recordDeleted", { name: result.name }));
      if (draft?.id === deleteTarget.id) setDraft(null);
      setDeleteTarget(null);
      setConfirmName("");
      await loadRecords();
    } catch (deleteError) {
      setError(apiErrorMessage(deleteError, t));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAudit() {
    setError(null);
    if (audit) {
      setAudit(null);
      return;
    }
    try {
      const result = await moonClient.listConnectorAudit(connectorId);
      setAudit(result.entries);
    } catch (auditError) {
      setError(apiErrorMessage(auditError, t));
    }
  }

  async function logout() {
    try {
      await moonClient.logout();
      window.location.href = "/command-center";
    } catch (logoutError) {
      setError(apiErrorMessage(logoutError, t));
    }
  }

  if (busy) {
    return <LoadingScreen label={t("web.dns.loading")} />;
  }

  if (!user) {
    return (
      <CenteredAuth>
        <div className="mb-5 flex items-center gap-3">
          <Globe size={20} className="text-acid" />
          <h1 className="text-lg font-semibold">{t("web.dns.signIn")}</h1>
        </div>
        <p className="text-sm leading-6 text-muted">
          {t("web.dns.signInDescription")}
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

  let dnsButtonLabel: string;
  if (saving) {
    dnsButtonLabel = t("web.models.saving");
  } else if (draft?.id) {
    dnsButtonLabel = t("web.dns.saveChanges");
  } else {
    dnsButtonLabel = t("web.dns.createRecord");
  }
  const recordColumns: readonly DataTableColumn<RecordRow>[] = [
    { key: "name", label: t("web.dns.name") },
    { key: "type", label: t("web.dns.type") },
    { key: "content", label: t("web.dns.content") },
    { key: "ttl", label: t("web.dns.ttlColumn") },
    { key: "proxied", label: t("web.dns.proxiedColumn") },
    { key: "flags", label: t("web.dns.notes") },
  ];
  const auditColumns: readonly DataTableColumn<AuditRow>[] = [
    { key: "createdAt", label: t("web.dns.dateTime") },
    { key: "action", label: t("web.dns.action") },
    { key: "outcome", label: t("web.dns.result") },
    { key: "target", label: t("web.dns.target") },
    { key: "detail", label: t("web.dns.detail") },
  ];

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={t("web.common.closeMenu")}
      sidebar={
        <WorkspaceSidebar
          brandHref="/connectors"
          brandIcon={<Globe aria-hidden="true" size={16} />}
          brandLabel="DNS"
          closeLabel={t("web.common.closeMenu")}
          identity={{ name: user.name, subtitle: user.email }}
          items={[
            {
              href: "/connectors",
              label: t("web.dns.allConnectors"),
              icon: <ArrowLeft aria-hidden="true" size={16} />,
              onSelect: () => setSidebarOpen(false),
            },
            {
              href: "/command-center/chat",
              label: t("web.dns.chat"),
              icon: <Plug aria-hidden="true" size={16} />,
              onSelect: () => setSidebarOpen(false),
            },
          ]}
          logout={{ label: t("web.common.logout"), onLogout: () => void logout() }}
          navLabel={t("web.common.mainNavigation")}
          onCloseSidebar={() => setSidebarOpen(false)}
        >
          <NavSectionLabel>{t("web.dns.zones")}</NavSectionLabel>
          <OptionNav label={t("web.dns.zoneList")}>
            {zones.map((item) => (
              <ListOption
                key={item.id}
                onSelect={() => selectZone(item)}
                selected={zoneId === item.externalId}
                variant="nav"
              >
                {item.name}
                {item.stale && <Badge variant="outline">{t("web.dns.stale")}</Badge>}
              </ListOption>
            ))}
            {zones.length === 0 && (
              <p className="px-2 text-xs leading-5 text-muted">
                {t("web.dns.zonesEmpty")}
              </p>
            )}
          </OptionNav>
        </WorkspaceSidebar>
      }
      header={
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={t("web.common.openMenu")}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <div>
              <div className="text-sm font-semibold">
                {connector?.label ?? t("web.dns.connector")}
              </div>
              <div className="text-xs text-muted">
                {zone ? zone.name : t("web.dns.noZone")} ·{" "}
                {t("web.connectors.lastSynced", {
                  date: formatTime(connector?.lastSyncAt ?? null, locale),
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {kind?.readonly && <Badge variant="outline">{t("web.dns.readOnly")}</Badge>}
            {connector && !connector.enabled && (
              <Badge variant="default">{t("web.dns.connectorDisabled")}</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void toggleAudit()}
            >
              <History size={15} />
              {audit ? t("web.dns.closeAudit") : t("web.dns.audit")}
            </Button>
            {canOperate && (
              <Button
                variant="secondary"
                size="sm"
                disabled={syncing || !connector?.enabled}
                onClick={() => void syncNow()}
              >
                <RefreshCw size={15} />
                {syncing ? t("web.dns.syncing") : t("web.connectors.sync")}
              </Button>
            )}
          </div>
        </>
      }
    >
      <div className="ql-page-body">
        <PageHeader
          actions={
            canOperate && zone ? (
              <Button
                disabled={!writable}
                onClick={() => openEditor()}
                title={
                  writable
                    ? undefined
                    : t("web.dns.readOnlyWarning")
                }
              >
                <Plus aria-hidden="true" size={16} />
                {t("web.dns.newRecord")}
              </Button>
            ) : undefined
          }
          description={t("web.dns.mirrorDescription")}
          eyebrow={t("web.dns.mirror")}
          title={zone ? zone.name : t("web.dns.zoneFallback")}
        />

        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={(event) => void applyFilter(event)}
        >
          <div className="min-w-56 flex-1">
            <FormField label={t("web.dns.search")} htmlFor="dns-search">
              <Input
                id="dns-search"
                value={nameQuery}
                onChange={(event) => setNameQuery(event.target.value)}
                placeholder={t("web.dns.searchPlaceholder")}
              />
            </FormField>
          </div>
          <div className="w-40">
            <FormField label={t("web.dns.type")} htmlFor="dns-type">
              <Select
                id="dns-type"
                value={typeQuery}
                onChange={(event) => setTypeQuery(event.target.value)}
              >
                <option value="">{t("web.dns.all")}</option>
                {recordTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <Button type="submit" variant="secondary">
            <Search size={15} />
            {t("web.dns.searchAction")}
          </Button>
          {(applied.name || applied.type) && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setNameQuery("");
                setTypeQuery("");
                setApplied({ name: "", type: "" });
              }}
            >
              {t("web.dns.clearAction")}
            </Button>
          )}
        </form>

        {error && (
          <Alert variant="error" className="mt-5">
            {error}
          </Alert>
        )}
        {notice && <Alert className="mt-5">{notice}</Alert>}
        {zone?.status && (
          <p className="mt-4 text-[11px] text-muted">
            {t("web.dns.zoneStatus", {
              status: `${zone.status}${zone.paused ? ` (${t("web.dns.paused")})` : ""}`,
            })}
            {truncated && ` · ${t("web.dns.truncated")}`}
          </p>
        )}

        <Card className="mt-5">
          <CardContent className="ql-card--flush">
            <DataTable
              columns={recordColumns}
              rows={records.map((record) => toRow(record, t))}
              rowKey="id"
              actionsLabel={t("web.common.actions")}
              yesLabel={t("web.common.yes")}
              noLabel={t("web.common.no")}
              onRowClick={
                canOperate && writable
                  ? (row) => {
                      const record = records.find((item) => item.id === row.id);
                      if (record) openEditor(record);
                    }
                  : undefined
              }
              emptyMessage={
                zone
                  ? t("web.dns.emptyRecords")
                  : t("web.dns.selectZone")
              }
              renderActions={
                canOperate && zone
                  ? (row) => {
                      const record = records.find((item) => item.id === row.id);
                      if (!record) return null;
                      return (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!writable || record.managed}
                            onClick={() => openEditor(record)}
                          >
                            {t("web.dns.edit")}
                          </Button>
                          <Button
                            variant="danger"
                            size="icon"
                            aria-label={t("web.dns.deleteRecord", { name: record.name })}
                            disabled={!writable || record.managed}
                            onClick={() => {
                              setDeleteTarget(record);
                              setConfirmName("");
                              setError(null);
                            }}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      );
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>

        {audit && (
          <Card className="mt-5">
            <CardHeader>
              <div className="ql-eyebrow">{t("web.dns.auditEyebrow")}</div>
              <h2 className="mt-1 text-sm font-semibold">
                {t("web.dns.auditTitle", {
                  connector: connector?.label ?? t("web.dns.connector"),
                })}
              </h2>
            </CardHeader>
            <CardContent className="ql-card--flush">
              <DataTable
                columns={auditColumns}
                rows={audit.map((entry) => toAuditRow(entry, locale))}
                rowKey="id"
                actionsLabel={t("web.common.actions")}
                yesLabel={t("web.common.yes")}
                noLabel={t("web.common.no")}
                emptyMessage={t("web.dns.auditEmpty")}
              />
            </CardContent>
          </Card>
        )}

        {draft && (
          <SidePanel
            closeLabel={t("web.dns.closeForm")}
            eyebrow={
              draft.id ? t("web.dns.editRecord") : t("web.dns.newRecordLabel")
            }
            label={t("web.dns.recordForm")}
            onClose={() => setDraft(null)}
            title={zone?.name}
          >
            <form
              className="ql-side-panel__form"
              onSubmit={(event) => void saveRecord(event)}
            >
              <FormField label={t("web.dns.name")} htmlFor="record-name">
                <Input
                  id="record-name"
                  required
                  maxLength={253}
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  placeholder={zone?.name ?? "api.example.com"}
                />
              </FormField>
              <FormField label={t("web.dns.type")} htmlFor="record-type">
                <Select
                  id="record-type"
                  required
                  value={draft.type}
                  onChange={(event) => {
                    const type = event.target.value;
                    const proxyable = proxiableTypes.includes(type);
                    setDraft({
                      ...draft,
                      type,
                      proxied: proxyable && draft.proxied,
                      ttl: proxyable && draft.proxied ? "1" : draft.ttl,
                    });
                  }}
                >
                  {recordTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={t("web.dns.content")} htmlFor="record-content">
                <Input
                  id="record-content"
                  required
                  maxLength={2048}
                  value={draft.content}
                  onChange={(event) =>
                    setDraft({ ...draft, content: event.target.value })
                  }
                  placeholder={t("web.dns.contentPlaceholder")}
                />
              </FormField>
              <FormField label={t("web.dns.ttl")} htmlFor="record-ttl">
                <Input
                  id="record-ttl"
                  type="number"
                  min={1}
                  max={1209600}
                  step={1}
                  required
                  disabled={draft.proxied}
                  value={draft.proxied ? "1" : draft.ttl}
                  onChange={(event) =>
                    setDraft({ ...draft, ttl: event.target.value })
                  }
                />
              </FormField>
              <label className="ql-inline-label" htmlFor="record-proxied">
                <Checkbox
                  id="record-proxied"
                  checked={draft.proxied}
                  disabled={!proxiableTypes.includes(draft.type)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      proxied: event.target.checked,
                      ttl: event.target.checked ? "1" : draft.ttl,
                    })
                  }
                />
                {t("web.dns.proxied", {
                  types: proxiableTypes.join(", ") || t("web.dns.none"),
                })}
              </label>
              <FormField label={t("web.dns.comment")} htmlFor="record-comment">
                <Input
                  id="record-comment"
                  maxLength={500}
                  value={draft.comment}
                  onChange={(event) =>
                    setDraft({ ...draft, comment: event.target.value })
                  }
                  placeholder={t("web.dns.commentPlaceholder")}
                />
              </FormField>
              {!writable && (
                <Alert variant="error">
                  {connector?.enabled
                    ? t("web.dns.notWritable")
                    : t("web.dns.activateConnector")}
                </Alert>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDraft(null)}
                >
                  {t("web.dns.close")}
                </Button>
                <Button type="submit" disabled={saving || !writable}>
                  <Save size={15} />
                  {dnsButtonLabel}
                </Button>
              </div>
            </form>
          </SidePanel>
        )}

        {deleteTarget && zone && (
          <Card className="mt-6">
            <CardContent>
              <h2 className="text-lg font-semibold">
                {t("web.dns.deleteRecord", { name: deleteTarget.name })}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t("web.dns.deleteDescription")}{" "}
                <span className="text-acid">{deleteTarget.name}</span> persis
                untuk mengonfirmasi.
              </p>
              <div className="mt-4 max-w-md">
                <FormField label={t("web.dns.confirmName")} htmlFor="record-delete-confirm">
                  <Input
                    id="record-delete-confirm"
                    value={confirmName}
                    onChange={(event) => setConfirmName(event.target.value)}
                    placeholder={deleteTarget.name}
                  />
                </FormField>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeleteTarget(null);
                    setConfirmName("");
                  }}
                >
                  {t("web.connectors.cancel")}
                </Button>
                <Button
                  variant="danger"
                  disabled={
                    saving ||
                    !writable ||
                    confirmName.trim() !== deleteTarget.name.trim()
                  }
                  onClick={() => void confirmDeleteRecord()}
                >
                  <Trash2 size={15} />
                  {t("web.dns.deleteAction")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </WorkspaceTemplate>
  );
}
