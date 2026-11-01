"use client";

import {
  moonClient,
  type AdminUserDto,
  type AuthUserDto,
  type RoleDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  CenteredAuth,
  DataTable,
  WorkspaceTemplate,
  type DataTableColumn,
} from "@moonwitness/ui";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface UserRow {
  [column: string]: string;
  id: string;
  name: string;
  email: string;
  status: string;
  joined: string;
}

const columns: readonly DataTableColumn<UserRow>[] = [
  { key: "name", label: "Nama" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "joined", label: "Terdaftar" },
];

function toRow(user: AdminUserDto): UserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.active ? "Aktif" : "Nonaktif",
    joined: user.createdAt ? new Date(user.createdAt).toLocaleString("id-ID") : "—",
  };
}

export default function UserAdminPage() {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [pendingRole, setPendingRole] = useState<Record<string, string>>({});
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDirectory = useCallback(async () => {
    const [userResult, roleResult] = await Promise.all([
      moonClient.listAdminUsers(),
      moonClient.listRoles(),
    ]);
    setUsers(userResult.users);
    setRoles(roleResult.roles);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const session = await moonClient.currentUser();
        if (cancelled) return;
        setUser(session.user);
        await loadDirectory();
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat daftar pengguna.",
          );
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [loadDirectory]);

  async function applyRole(target: AdminUserDto) {
    const role = pendingRole[target.id];
    if (!role) return;
    setWorkingId(target.id);
    setError(null);
    setNotice(null);
    try {
      await moonClient.updateUserRole(target.id, role);
      setPendingRole((current) => {
        const next = { ...current };
        delete next[target.id];
        return next;
      });
      await loadDirectory();
      setNotice(`Peran ${target.name} diperbarui. Sesi akun tersebut langsung dihapus.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Gagal mengubah peran.",
      );
      await loadDirectory();
    } finally {
      setWorkingId(null);
    }
  }

  async function deactivate(target: AdminUserDto) {
    if (confirmDeactivate !== target.id) {
      setConfirmDeactivate(target.id);
      return;
    }
    setConfirmDeactivate(null);
    setWorkingId(target.id);
    setError(null);
    setNotice(null);
    try {
      await moonClient.deactivateUser(target.id);
      await loadDirectory();
      setNotice(`${target.name} dinonaktifkan dan semua sesinya dihapus.`);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Gagal menonaktifkan pengguna.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  if (busy) {
    return (
      <main className="ql-hud-app flex min-h-dvh items-center justify-center text-sm text-stone-500">
        Memuat pengguna...
      </main>
    );
  }

  if (!user) {
    return (
      <CenteredAuth>
        <h1 className="text-xl font-semibold">Masuk untuk mengelola pengguna</h1>
        <p className="mt-2 text-sm text-stone-500">
          Manajemen peran hanya tersedia untuk akun dengan grup admin.
        </p>
        <Button
          className="mt-5 w-full"
          onClick={() => (window.location.href = "/auth")}
        >
          Ke halaman masuk
        </Button>
      </CenteredAuth>
    );
  }

  const groups = user.groups ?? [];
  const canAssignRoot = groups.includes("root");
  const roleName = (code: string) =>
    roles.find((role) => role.code === code)?.name ?? code;

  return (
    <WorkspaceTemplate
      sidebarOpen={false}
      onCloseSidebar={() => undefined}
      sidebar={
        <div className="space-y-5">
          <a
            href="/command-center"
            className="flex h-12 items-center gap-2.5 px-2 font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-stone-900 text-white">
              <ShieldCheck size={16} />
            </span>
            MoonWitness
          </a>
          <a href="/command-center" className="ql-nav-link">
            <ArrowLeft size={16} />
            Kembali ke chat
          </a>
          <div className="border-t border-stone-200 px-2 pt-4">
            <p className="truncate text-xs font-medium text-stone-700">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-stone-500">
              {roleName(user.role)}
            </p>
          </div>
        </div>
      }
      header={
        <>
          <div className="text-sm font-medium text-stone-700">
            Manajemen pengguna
          </div>
          <Badge variant="live">{users.length} akun</Badge>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl space-y-7">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              MoonWitness · Access
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
              Peran &amp; akun
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Ubah peran untuk mengendalikan siapa yang boleh mengelola konektor
              dan DNS. Setiap perubahan peran menghapus sesi akun target,
              sehingga hak akses baru berlaku seketika.
            </p>
          </header>

          {error && <Alert variant="error">{error}</Alert>}
          {notice && <Alert>{notice}</Alert>}

          <section aria-label="Daftar pengguna">
            <DataTable
              columns={columns}
              rows={users.map(toRow)}
              rowKey="id"
              emptyMessage="Belum ada akun terdaftar."
              renderActions={(row) => {
                const target = users.find((item) => item.id === row.id);
                if (!target) return null;
                const isSelf = target.id === user.id;
                const selected = pendingRole[target.id] ?? target.role;
                return (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {isSelf ? (
                      <Badge variant="default">Akun Anda</Badge>
                    ) : (
                      <>
                        <label className="sr-only" htmlFor={`role-${target.id}`}>
                          Peran untuk {target.name}
                        </label>
                        <select
                          id={`role-${target.id}`}
                          className="h-9 rounded-lg border border-stone-200 bg-white px-2 text-sm text-stone-700"
                          value={selected}
                          disabled={workingId === target.id}
                          onChange={(event) =>
                            setPendingRole((current) => ({
                              ...current,
                              [target.id]: event.target.value,
                            }))
                          }
                        >
                          {roles
                            .filter(
                              (role) =>
                                canAssignRoot ||
                                (role.assignable &&
                                  !role.groups.includes("root")),
                            )
                            .map((role) => (
                              <option key={role.code} value={role.code}>
                                {role.name}
                              </option>
                            ))}
                        </select>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={
                            workingId === target.id || selected === target.role
                          }
                          onClick={() => void applyRole(target)}
                        >
                          Terapkan
                        </Button>
                        {target.active && (
                          <Button
                            size="sm"
                            variant={
                              confirmDeactivate === target.id
                                ? "danger"
                                : "ghost"
                            }
                            disabled={workingId === target.id}
                            onClick={() => void deactivate(target)}
                          >
                            {confirmDeactivate === target.id
                              ? "Konfirmasi nonaktifkan"
                              : "Nonaktifkan"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                );
              }}
            />
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-stone-900">
              <Users size={17} />
              <h2 className="text-lg font-semibold">Katalog peran</h2>
            </div>
            <ul className="space-y-3">
              {roles.map((role) => (
                <li key={role.code} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-stone-900">{role.name}</span>
                    <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-600">
                      {role.code}
                    </code>
                    {!role.assignable && (
                      <Badge variant="default">Hanya root</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-stone-500">{role.description}</p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Grup: {role.groups.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
