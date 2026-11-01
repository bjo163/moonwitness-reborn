"use client";

import {
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
  cn,
  DataTable,
  FormField,
  Input,
  Select,
  WorkspaceTemplate,
  type DataTableColumn,
} from "@moonwitness/ui";
import {
  ArrowLeft,
  Globe,
  History,
  LogOut,
  Menu,
  Plug,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";

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

const recordColumns: readonly DataTableColumn<RecordRow>[] = [
  { key: "name", label: "Nama" },
  { key: "type", label: "Tipe" },
  { key: "content", label: "Content" },
  { key: "ttl", label: "TTL" },
  { key: "proxied", label: "Proxied" },
  { key: "flags", label: "Catatan" },
];

const auditColumns: readonly DataTableColumn<AuditRow>[] = [
  { key: "createdAt", label: "Waktu" },
  { key: "action", label: "Aksi" },
  { key: "outcome", label: "Hasil" },
  { key: "target", label: "Target" },
  { key: "detail", label: "Detail" },
];

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

function toRow(record: DnsRecord): RecordRow {
  const flags = [
    record.stale ? "Cermin usang" : "",
    record.managed ? "Dikelola Cloudflare" : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    content: record.content,
    ttl: record.ttl === 1 ? "Auto" : `${record.ttl} d`,
    proxied: record.proxied ? "Ya" : "Tidak",
    flags: flags || "—",
  };
}

function toAuditRow(entry: AuditEntry): AuditRow {
  return {
    id: entry.id,
    createdAt: formatTime(entry.createdAt),
    action: entry.action,
    outcome: entry.outcome,
    target: entry.target || "—",
    detail:
      entry.errorCode && entry.errorMessage
        ? `${entry.errorCode} · ${entry.errorMessage}`
        : entry.errorMessage || "—",
  };
}

function formatTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("id-ID");
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function DnsWorkspace({ connectorId }: { connectorId: string }) {
  const [user, setUser] = useState<AuthUser | null>(null);
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
        if (!found) setError("Connector ini tidak ada di akun kamu.");
      } catch (loadError) {
        if (
          !cancelled &&
          (!(loadError instanceof Error) ||
            loadError.message !== "Authentication required.")
        ) {
          setError(messageOf(loadError, "Gagal memuat data DNS."));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [connectorId, loadZones]);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        await loadRecords();
      } catch (loadError) {
        if (!cancelled) setError(messageOf(loadError, "Gagal memuat record."));
      }
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [loadRecords]);

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
      const result = await moonClient.syncConnector(connectorId);
      setNotice(result.message);
      const latest = await loadZones();
      if (!zoneId && latest[0]) setZoneId(latest[0].externalId);
      await loadRecords();
    } catch (syncError) {
      setError(messageOf(syncError, "Sinkronisasi gagal."));
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
      setError("TTL harus bilangan bulat; isi 1 untuk Auto.");
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
        setNotice(`Record ${input.name} diperbarui di Cloudflare.`);
      } else {
        await moonClient.createConnectorRecord(connectorId, zone.externalId, input);
        setNotice(`Record ${input.name} dibuat di Cloudflare.`);
      }
      setDraft(null);
      await loadRecords();
    } catch (saveError) {
      setError(messageOf(saveError, "Gagal menyimpan record."));
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
      setNotice(`Record ${result.name} dihapus dari Cloudflare.`);
      if (draft?.id === deleteTarget.id) setDraft(null);
      setDeleteTarget(null);
      setConfirmName("");
      await loadRecords();
    } catch (deleteError) {
      setError(messageOf(deleteError, "Gagal menghapus record."));
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
      setError(messageOf(auditError, "Gagal memuat riwayat aksi."));
    }
  }

  async function logout() {
    try {
      await moonClient.logout();
      window.location.href = "/command-center";
    } catch (logoutError) {
      setError(messageOf(logoutError, "Gagal keluar."));
    }
  }

  if (busy) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center text-sm text-stone-400">
        Memuat DNS...
      </main>
    );
  }

  if (!user) {
    return (
      <CenteredAuth>
        <div className="mb-5 flex items-center gap-3">
          <Globe size={20} className="text-[#d7ff63]" />
          <h1 className="text-lg font-semibold">Masuk untuk mengelola DNS</h1>
        </div>
        <p className="text-sm leading-6 text-stone-400">
          Zone dan record hanya tampil untuk pemilik connector.
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
          Ke halaman masuk
        </Button>
      </CenteredAuth>
    );
  }

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      sidebar={
        <>
          <div className="flex h-12 items-center justify-between px-2">
            <a
              href="/connectors"
              className="ql-hud-brand flex items-center gap-2.5 font-semibold"
            >
              <Globe size={18} className="text-[#d7ff63]" />
              DNS
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Tutup menu"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>
          <a href="/connectors" className="ql-nav-link mt-4">
            <ArrowLeft size={16} />
            Semua connector
          </a>
          <a href="/command-center" className="ql-nav-link mt-2">
            <Plug size={16} />
            Kembali ke chat
          </a>
          <div className="ql-nav-section">Zone tersalin</div>
          <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Daftar zone">
            {zones.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "ql-nav-link w-full justify-start text-left",
                  zoneId === item.externalId && "is-active",
                )}
                onClick={() => selectZone(item)}
              >
                {item.name}
                {item.stale && <Badge variant="outline">Usang</Badge>}
              </Button>
            ))}
            {zones.length === 0 && (
              <p className="px-2 text-xs leading-5 text-stone-500">
                Belum ada zone tersalin. Jalankan sinkronisasi lebih dulu.
              </p>
            )}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-stone-700 px-2 pt-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{user.name}</div>
              <div className="truncate text-[11px] text-stone-500">
                {user.email}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Keluar"
              onClick={() => void logout()}
            >
              <LogOut size={16} />
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
              className="md:hidden"
              aria-label="Buka menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <div>
              <div className="text-sm font-semibold">
                {connector?.label ?? "Connector"}
              </div>
              <div className="text-xs text-stone-500">
                {zone ? zone.name : "Pilih zone"} · Sinkron terakhir{" "}
                {formatTime(connector?.lastSyncAt ?? null)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {kind?.readonly && <Badge variant="outline">Read-only</Badge>}
            {connector && !connector.enabled && (
              <Badge variant="default">Connector nonaktif</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void toggleAudit()}
            >
              <History size={15} />
              {audit ? "Tutup riwayat" : "Riwayat aksi"}
            </Button>
            {canOperate && (
              <Button
                variant="secondary"
                size="sm"
                disabled={syncing || !connector?.enabled}
                onClick={() => void syncNow()}
              >
                <RefreshCw size={15} />
                {syncing ? "Menyinkronkan..." : "Sinkronkan"}
              </Button>
            )}
          </div>
        </>
      }
    >
      <div className="ql-model-workspace">
        <div className="ql-model-heading">
          <div>
            <div className="ql-eyebrow">CLOUDFLARE MIRROR</div>
            <h1>{zone ? zone.name : "Zone DNS"}</h1>
            <p>
              Daftar ini adalah cermin Cloudflare. Setiap mutasi langsung
              mengubah zona aslinya, jadi periksa nama dan content sebelum
              menyimpan.
            </p>
          </div>
          {canOperate && zone && (
            <Button
              disabled={!writable}
              onClick={() => openEditor()}
              title={
                writable
                  ? undefined
                  : "Connector read-only atau nonaktif; mutasi ditolak server."
              }
            >
              <Plus size={16} />
              Record baru
            </Button>
          )}
        </div>

        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={(event) => void applyFilter(event)}
        >
          <div className="min-w-56 flex-1">
            <FormField label="Cari nama atau content" htmlFor="dns-search">
              <Input
                id="dns-search"
                value={nameQuery}
                onChange={(event) => setNameQuery(event.target.value)}
                placeholder="mis. api atau v=spf1"
              />
            </FormField>
          </div>
          <div className="w-40">
            <FormField label="Tipe" htmlFor="dns-type">
              <Select
                id="dns-type"
                value={typeQuery}
                onChange={(event) => setTypeQuery(event.target.value)}
              >
                <option value="">Semua</option>
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
            Terapkan
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
              Bersihkan
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
          <p className="mt-4 text-[11px] text-stone-500">
            Status zone: {zone.status}
            {zone.paused ? " (paused)" : ""}
            {truncated && " · Daftar record dipotong, perbaiki pencarian"}
          </p>
        )}

        <Card className="mt-5">
          <CardContent className="ql-model-table-content">
            <DataTable
              columns={recordColumns}
              rows={records.map(toRow)}
              rowKey="id"
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
                  ? "Tidak ada record yang cocok dengan pencarian ini."
                  : "Pilih zone di panel kiri untuk melihat record."
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
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="icon"
                            aria-label={`Hapus ${record.name}`}
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
              <div className="ql-eyebrow">RIWAYAT AKSI</div>
              <h2 className="mt-1 text-sm font-semibold">
                Aksi terbaru untuk {connector?.label ?? "connector ini"}
              </h2>
            </CardHeader>
            <CardContent className="ql-model-table-content">
              <DataTable
                columns={auditColumns}
                rows={audit.map(toAuditRow)}
                rowKey="id"
                emptyMessage="Belum ada aksi tercatat."
              />
            </CardContent>
          </Card>
        )}

        {draft && (
          <section className="ql-model-editor" aria-label="Form record DNS">
            <div className="ql-model-editor__header">
              <div>
                <div className="ql-eyebrow">
                  {draft.id ? "EDIT RECORD" : "RECORD BARU"}
                </div>
                <h2>{zone?.name}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Tutup form"
                onClick={() => setDraft(null)}
              >
                <X size={18} />
              </Button>
            </div>
            <form
              className="ql-model-editor__form"
              onSubmit={(event) => void saveRecord(event)}
            >
              <FormField label="Nama record" htmlFor="record-name">
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
              <FormField label="Tipe" htmlFor="record-type">
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
              <FormField label="Content" htmlFor="record-content">
                <Input
                  id="record-content"
                  required
                  maxLength={2048}
                  value={draft.content}
                  onChange={(event) =>
                    setDraft({ ...draft, content: event.target.value })
                  }
                  placeholder="mis. 203.0.113.10"
                />
              </FormField>
              <FormField label="TTL (detik, 1 = Auto)" htmlFor="record-ttl">
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
              <label className="ql-model-checkbox" htmlFor="record-proxied">
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
                Proxied (hanya {proxiableTypes.join(", ") || "tidak ada"})
              </label>
              <FormField label="Catatan (opsional)" htmlFor="record-comment">
                <Input
                  id="record-comment"
                  maxLength={500}
                  value={draft.comment}
                  onChange={(event) =>
                    setDraft({ ...draft, comment: event.target.value })
                  }
                  placeholder="Menjelaskan record ini untuk siapa pun yang membuka"
                />
              </FormField>
              {!writable && (
                <Alert variant="error">
                  {connector?.enabled
                    ? "Connector ini read-only; MoonWitness menolak mutasi."
                    : "Connector nonaktif. Aktifkan dulu di halaman connector."}
                </Alert>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDraft(null)}
                >
                  Tutup
                </Button>
                <Button type="submit" disabled={saving || !writable}>
                  <Save size={15} />
                  {saving
                    ? "Menyimpan..."
                    : draft.id
                      ? "Simpan perubahan"
                      : "Buat record"}
                </Button>
              </div>
            </form>
          </section>
        )}

        {deleteTarget && zone && (
          <Card className="mt-6">
            <CardContent>
              <h2 className="text-lg font-semibold">
                Hapus {deleteTarget.name}?
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Record ini hilang dari Cloudflare, bukan hanya dari cermin. Ketik{" "}
                <span className="text-[#d7ff63]">{deleteTarget.name}</span> persis
                untuk mengonfirmasi.
              </p>
              <div className="mt-4 max-w-md">
                <FormField label="Konfirmasi nama" htmlFor="record-delete-confirm">
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
                  Batal
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
                  Hapus record
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </WorkspaceTemplate>
  );
}
