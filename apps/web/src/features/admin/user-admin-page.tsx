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
  Card,
  CardContent,
  CardHeader,
  CenteredAuth,
  DataTable,
  LoadingScreen,
  PageHeader,
  Select,
  SidebarBrand,
  SidebarFooter,
  SidebarNav,
  WorkspaceTemplate,
  type DataTableColumn,
} from "@moonwitness/ui";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { translateMetadata } from "../locale/translate-metadata";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

interface UserRow {
  [column: string]: string;
  id: string;
  name: string;
  email: string;
  status: string;
  joined: string;
}

function toRow(
  user: AdminUserDto,
  t: ReturnType<typeof useTranslationCatalog>["t"],
  locale: "id" | "en",
): UserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.active ? t("web.adminUsers.active") : t("web.adminUsers.inactive"),
    joined: user.createdAt
      ? new Date(user.createdAt).toLocaleString(locale === "id" ? "id-ID" : "en-US")
      : "—",
  };
}

export default function UserAdminPage() {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  useLocalePreference(user);
  const { t, tm, locale } = useTranslationCatalog();
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
  }, [loadDirectory, t]);

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
      setNotice(t("web.adminUsers.roleUpdated", { name: target.name }));
    } catch (saveError) {
      setError(apiErrorMessage(saveError, t));
      try {
        await loadDirectory();
      } catch (loadError) {
        setError(apiErrorMessage(loadError, t));
      }
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
      setNotice(t("web.adminUsers.deactivated", { name: target.name }));
    } catch (removeError) {
      setError(apiErrorMessage(removeError, t));
    } finally {
      setWorkingId(null);
    }
  }

  if (busy) {
    return <LoadingScreen label={t("web.adminUsers.loading")} className="text-muted" />;
  }

  if (!user) {
    return (
      <CenteredAuth>
        <h1 className="text-xl font-semibold">{t("web.adminUsers.signIn")}</h1>
        <p className="mt-2 text-sm text-muted">
          {t("web.adminUsers.signInDescription")}
        </p>
        <Button
          className="mt-5 w-full"
          onClick={() => (window.location.href = "/auth")}
        >
          {t("web.auth.loginAction")}
        </Button>
      </CenteredAuth>
    );
  }

  const groups = user.groups ?? [];
  const canAssignRoot = groups.includes("root");
  const roleName = (code: string) =>
    (() => {
      const role = roles.find((item) => item.code === code);
      return role
        ? translateMetadata(role.nameKey, role.name, tm)
        : code;
    })();
  const columns: readonly DataTableColumn<UserRow>[] = [
    { key: "name", label: t("web.adminUsers.name") },
    { key: "email", label: t("web.adminUsers.email") },
    { key: "status", label: t("web.adminUsers.status") },
    { key: "joined", label: t("web.adminUsers.joined") },
  ];

  return (
    <WorkspaceTemplate
      sidebarOpen={false}
      onCloseSidebar={() => undefined}
      closeLabel={t("web.common.closeMenu")}
      sidebar={
        <>
          <SidebarBrand
            icon={<ShieldCheck aria-hidden="true" size={16} />}
          />
          <SidebarNav
            label={t("web.adminUsers.title")}
            items={[
              {
                href: "/command-center/chat",
                label: t("web.adminUsers.backToChat"),
                icon: <ArrowLeft aria-hidden="true" size={16} />,
              },
            ]}
          />
          <SidebarFooter
            logoutLabel={t("web.common.logout")}
            userName={user.name}
            userSubtitle={roleName(user.role)}
          />
        </>
      }
      header={
        <>
          <div className="text-sm font-medium text-ink-soft">
            {t("web.adminUsers.title")}
          </div>
          <Badge variant="live">{t("web.adminUsers.accountCount", { count: users.length })}</Badge>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl space-y-7">
          <PageHeader
            description={t("web.adminUsers.description")}
            eyebrow={t("web.adminUsers.eyebrow")}
            title={t("web.adminUsers.heading")}
          />

          {error && <Alert variant="error">{error}</Alert>}
          {notice && <Alert>{notice}</Alert>}

          <section aria-label={t("web.adminUsers.userList")}>
            <DataTable
              columns={columns}
              rows={users.map((item) => toRow(item, t, locale))}
              rowKey="id"
              actionsLabel={t("web.common.actions")}
              yesLabel={t("web.common.yes")}
              noLabel={t("web.common.no")}
              emptyMessage={t("web.adminUsers.empty")}
              renderActions={(row) => {
                const target = users.find((item) => item.id === row.id);
                if (!target) return null;
                const isSelf = target.id === user.id;
                const selected = pendingRole[target.id] ?? target.role;
                return (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {isSelf ? (
                      <Badge variant="default">{t("web.adminUsers.yourAccount")}</Badge>
                    ) : (
                      <>
                        <label className="sr-only" htmlFor={`role-${target.id}`}>
                          {t("web.adminUsers.roleFor", { name: target.name })}
                        </label>
                        <Select
                          id={`role-${target.id}`}
                          className="h-9 min-h-0 px-2 text-sm"
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
                                {translateMetadata(role.nameKey, role.name, tm)}
                              </option>
                            ))}
                        </Select>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={
                            workingId === target.id || selected === target.role
                          }
                          onClick={() => void applyRole(target)}
                        >
                          {t("web.adminUsers.apply")}
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
                              ? t("web.adminUsers.confirmDeactivate")
                              : t("web.adminUsers.deactivate")}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                );
              }}
            />
          </section>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-ink">
                <Users aria-hidden="true" size={17} />
                <h2 className="text-lg font-semibold">{t("web.adminUsers.roleCatalog")}</h2>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roles.map((role) => (
                  <li key={role.code} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">
                        {translateMetadata(role.nameKey, role.name, tm)}
                      </span>
                      <code className="rounded bg-panel-edge px-1.5 py-0.5 text-[11px] text-ink-soft">
                        {role.code}
                      </code>
                      {!role.assignable && (
                        <Badge variant="default">{t("web.adminUsers.rootOnly")}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-muted">
                      {translateMetadata(
                        role.descriptionKey,
                        role.description,
                        tm,
                      )}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-dim">
                      {t("web.adminUsers.groups", {
                        groups: role.groups.join(", "),
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
