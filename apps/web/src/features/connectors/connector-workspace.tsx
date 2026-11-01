"use client";

import {
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
  Select,
  WorkspaceTemplate,
} from "@moonwitness/ui";
import {
  ArrowLeft,
  Boxes,
  ExternalLink,
  Globe,
  KeyRound,
  LogOut,
  Menu,
  Plug,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";

interface ConnectorDraft {
  id?: string;
  kind: string;
  label: string;
  enabled: boolean;
}

const tokenSourceLabels: Record<ConnectorTokenSource, string> = {
  unresolved: "Belum terhubung",
  env: "Environment variable",
  keychain: "Keychain OS",
  config_file: "File konfigurasi CLI",
};

const verifyStatusLabels: Record<ConnectorVerifyStatus, string> = {
  unverified: "Belum diverifikasi",
  ok: "Token aktif",
  invalid: "Token ditolak",
  network: "Jaringan bermasalah",
  missing: "Token tidak ditemukan",
};

function formatTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("id-ID");
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function ConnectorWorkspace() {
  const [user, setUser] = useState<AuthUser | null>(null);
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
          (!(loadError instanceof Error) ||
            loadError.message !== "Authentication required.")
        ) {
          setError(messageOf(loadError, "Gagal memuat daftar connector."));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [loadConnectors]);

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
        setNotice("Connector diperbarui.");
      } else {
        await moonClient.createConnector({
          kind: draft.kind,
          label: draft.label,
        });
        setNotice(
          "Connector ditambahkan. Jalankan verifikasi untuk memastikan token terbaca.",
        );
      }
      resetDraft();
      await loadConnectors();
    } catch (saveError) {
      setError(messageOf(saveError, "Gagal menyimpan connector."));
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
        setNotice((await moonClient.verifyConnector(connector.id)).message);
      } else {
        setNotice((await moonClient.syncConnector(connector.id)).message);
      }
    } catch (actionError) {
      setError(messageOf(actionError, "Aksi connector gagal."));
    } finally {
      setPendingRow(null);
      await loadConnectors().catch(() => undefined);
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
          ? `Connector ${connector.label} dinonaktifkan.`
          : `Connector ${connector.label} diaktifkan.`,
      );
    } catch (toggleError) {
      setError(messageOf(toggleError, "Gagal mengubah status connector."));
    } finally {
      setPendingRow(null);
      await loadConnectors().catch(() => undefined);
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
        `Connector ${deleteTarget.label} dihapus. Riwayat audit tetap tersimpan.`,
      );
      if (draft.id === deleteTarget.id) resetDraft();
      setDeleteTarget(null);
      setConfirmLabel("");
    } catch (deleteError) {
      setError(messageOf(deleteError, "Gagal menghapus connector."));
    } finally {
      setSaving(false);
      await loadConnectors().catch(() => undefined);
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
        Memuat connector...
      </main>
    );
  }

  if (!user) {
    return (
      <CenteredAuth>
        <div className="mb-5 flex items-center gap-3">
          <Plug size={20} className="text-[#d7ff63]" />
          <h1 className="text-lg font-semibold">Masuk untuk mengatur connector</h1>
        </div>
        <p className="text-sm leading-6 text-stone-400">
          Connector layanan eksternal dikelola per akun.
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
              href="/command-center"
              className="ql-hud-brand flex items-center gap-2.5 font-semibold"
            >
              <Plug size={18} className="text-[#d7ff63]" />
              MoonWitness
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
          <a href="/command-center" className="ql-nav-link mt-4">
            <ArrowLeft size={16} />
            Kembali ke chat
          </a>
          <a href="/models" className="ql-nav-link mt-2">
            <Boxes size={16} />
            Data models
          </a>
          <a href="/providers" className="ql-nav-link mt-2">
            <KeyRound size={16} />
            Model providers
          </a>
          <a href="/connectors" className="ql-nav-link is-active mt-2">
            <Plug size={16} />
            Integrasi
          </a>
          {user.groups.includes("admin") && (
            <a href="/admin/users" className="ql-nav-link mt-2">
              <ShieldCheck size={16} />
              Manajemen pengguna
            </a>
          )}
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
              <div className="text-sm font-semibold">Integrasi eksternal</div>
              <div className="text-xs text-stone-500">
                Cloudflare, DNS, dan layanan lain
              </div>
            </div>
          </div>
          <Badge variant="outline">{`${connectors.length} connector tersimpan`}</Badge>
        </>
      }
    >
      <div className="ql-model-workspace">
        <div className="ql-model-heading">
          <div>
            <div className="ql-eyebrow">CONNECTOR MANAGEMENT</div>
            <h1>Connector</h1>
            <p>
              MoonWitness tidak pernah menyimpan token. Kredensial dibaca dari OS
              credential store milik CLI layanan setiap kali permintaan diproses,
              jadi mencabut akses cukup dilakukan di sisi penyedia.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mt-5">
            {error}
          </Alert>
        )}
        {notice && <Alert className="mt-5">{notice}</Alert>}

        <section className="mt-6 space-y-3" aria-label="Connector tersimpan">
          {connectors.length === 0 && (
            <Card>
              <CardContent>
                Belum ada connector. Tambahkan satu untuk mulai mengelola DNS
                dari MoonWitness.
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
                  <div className="flex size-10 shrink-0 items-center justify-center border border-stone-700 bg-stone-900 text-[#d7ff63]">
                    <Plug size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold">{connector.label}</h2>
                      <Badge variant={connector.enabled ? "live" : "default"}>
                        {connector.enabled ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <Badge
                        variant={
                          connector.verifyStatus === "ok" ? "default" : "outline"
                        }
                      >
                        {verifyStatusLabels[connector.verifyStatus]}
                      </Badge>
                      {kind?.readonly && <Badge variant="outline">Read-only</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {kind?.label ?? connector.kind} · Sumber token:{" "}
                      {tokenSourceLabels[connector.tokenSource]}
                    </p>
                    <p className="mt-1 break-all text-[11px] text-stone-600">
                      {connector.tokenRef || "Token belum pernah terbaca."}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-500">
                      Verifikasi terakhir {formatTime(connector.lastVerifyAt)} ·
                      Sinkron terakhir {formatTime(connector.lastSyncAt)}
                    </p>
                    {connector.lastSyncStatus && (
                      <p className="mt-1 text-[11px] text-stone-500">
                        Status sinkron terakhir: {connector.lastSyncStatus}
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
                        DNS
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
                          Verifikasi
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => void toggleEnabled(connector)}
                        >
                          {connector.enabled ? "Nonaktifkan" : "Aktifkan"}
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
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="icon"
                          aria-label={`Hapus ${connector.label}`}
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
                        Sinkronkan
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
                    <div className="ql-eyebrow">{draft.id ? "EDIT" : "BARU"}</div>
                    <h2 className="mt-1 text-lg font-semibold">
                      {draft.id ? "Ubah connector" : "Tambah connector"}
                    </h2>
                  </div>
                  {draft.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetDraft}
                    >
                      Batal edit
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Jenis layanan" htmlFor="connector-kind">
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
                          {kind.label}
                          {kind.readonly ? " (read-only)" : ""}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Nama connector" htmlFor="connector-label">
                    <Input
                      id="connector-label"
                      required
                      maxLength={80}
                      value={draft.label}
                      onChange={(event) =>
                        setDraft({ ...draft, label: event.target.value })
                      }
                      placeholder="Produksi pribadi"
                    />
                  </FormField>
                </div>

                {selectedKind && (
                  <div className="mt-4 border border-stone-700 bg-stone-900/60 p-4">
                    <p className="text-xs leading-6 text-stone-400">
                      {selectedKind.credentialHelp}
                    </p>
                    <p className="mt-2 text-[11px] text-stone-500">
                      Kapabilitas: {selectedKind.capabilities.join(", ") || "—"}.{" "}
                      {selectedKind.readonly
                        ? "Hanya cermin dan baca; mutasi ditolak server."
                        : "Boleh membaca dan memutasi."}
                    </p>
                    <a
                      href={selectedKind.helpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#d7ff63]"
                    >
                      Atur token di konsol penyedia
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}

                <label className="ql-model-checkbox mt-4" htmlFor="connector-enabled">
                  <Checkbox
                    id="connector-enabled"
                    checked={draft.enabled}
                    onChange={(event) =>
                      setDraft({ ...draft, enabled: event.target.checked })
                    }
                  />
                  Aktifkan connector ini
                </label>

                <div className="mt-5 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving || (!draft.id && limitReached)}
                  >
                    <Save size={15} />
                    {saving
                      ? "Menyimpan..."
                      : draft.id
                        ? "Simpan perubahan"
                        : "Tambah connector"}
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
                Hapus {deleteTarget.label}?
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Cermin zona dan record ikut terhapus dari MoonWitness; riwayat
                audit tetap tersimpan. Ketik{" "}
                <span className="text-[#d7ff63]">{deleteTarget.label}</span>{" "}
                persis untuk mengonfirmasi.
              </p>
              <div className="mt-4 max-w-md">
                <FormField label="Konfirmasi nama" htmlFor="delete-confirm">
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
                  Batal
                </Button>
                <Button
                  variant="danger"
                  disabled={
                    saving || confirmLabel.trim() !== deleteTarget.label.trim()
                  }
                  onClick={() => void confirmDelete()}
                >
                  <Trash2 size={15} />
                  Hapus connector
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </WorkspaceTemplate>
  );
}
