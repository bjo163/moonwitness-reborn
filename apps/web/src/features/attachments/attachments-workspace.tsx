"use client";

import {
  MoonClientError,
  moonClient,
  type AttachmentDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  AttachmentList,
  AttachmentUpload,
  Button,
  LoadingScreen,
  PageHeader,
  SidebarTrigger,
  WorkspaceSidebar,
  WorkspaceTemplate,
  type AttachmentRow,
  type SidebarNavItem,
  type UploadItem,
} from "@moonwitness/ui";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { useMessages, type AppMessages } from "../locale/messages";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useAttachmentUploads, type UploadStatus } from "./use-attachment-uploads";

const DELETE_ARM_MS = 6000;

/**
 * The catalog hands back plain strings, so placeholder text is substituted
 * here rather than pretending a message is a function.
 */
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? "");
}

/**
 * Browser file types the server accepts for a `media` attachment. Mirrored only
 * to keep the picker from offering files that would be refused; the server stays
 * the real gate.
 */
const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,audio/mpeg,application/pdf,application/zip,application/json,text/csv,text/plain";

function isImage(mimeType: string): boolean {
  return mimeType === "image/png" || mimeType === "image/jpeg" || mimeType === "image/gif" || mimeType === "image/webp";
}

function isPlayable(mimeType: string): boolean {
  return mimeType === "video/mp4" || mimeType === "video/webm" || mimeType === "audio/mpeg";
}

export default function AttachmentsWorkspace() {
  const router = useRouter();
  const copy = useMessages();
  const at = copy.attachments;
  const { t } = useTranslationCatalog();
  const [user, setUser] = useState<ReturnType<typeof toSessionUser> | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AttachmentDto[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [listError, setListError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const errorText = useCallback((error: unknown): string => apiErrorMessage(error, t), [t]);

  const refresh = useCallback(async (): Promise<void> => {
    setListState("loading");
    setListError(undefined);
    try {
      const { attachments } = await moonClient.listAttachments();
      setItems(attachments);
      setListState("ready");
    } catch (error) {
      setListError(errorText(error));
      setListState("error");
    }
  }, [errorText]);

  const uploads = useAttachmentUploads({
    onUploaded: (attachment) => {
      setItems((current) => [attachment, ...current]);
      setNotice(fill(at.uploaded, { name: attachment.name }));
    },
    errorText,
    copy: { needsFile: () => at.needsFile },
  });

  const loadUser = useCallback(async (): Promise<void> => {
    setLoading(true);
    setAuthFailed(false);
    try {
      const session = await moonClient.currentUser();
      setUser(session.user ? toSessionUser(session.user) : null);
    } catch (error) {
      // Only a real 401 ends the session. A server hiccup must not sign a valid
      // user out or throw away the page they came to.
      if (error instanceof MoonClientError && error.status === 401) {
        setUser(null);
      } else {
        setAuthFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user === null) router.replace("/auth");
  }, [router, user]);

  useEffect(() => {
    if (user) void refresh();
  }, [refresh, user]);

  useEffect(() => {
    if (notice === null) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => () => {
    if (armTimer.current) clearTimeout(armTimer.current);
  }, []);

  const formatBytes = useCallback(
    (bytes: number): string => {
      const locale = user?.preferredLocale === "en" ? "en-US" : "id-ID";
      const units = ["B", "KiB", "MiB", "GiB", "TiB"] as const;
      // Intl has no auto-scaling byte unit, so the step is chosen here and only
      // the number is localised.
      const step = Math.min(
        units.length - 1,
        Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)),
      );
      const value = bytes / 1024 ** step;
      return `${new Intl.NumberFormat(locale, {
        maximumFractionDigits: step === 0 ? 0 : 1,
      }).format(step === 0 ? bytes : value)} ${units[step]}`;
    },
    [user?.preferredLocale],
  );

  async function remove(attachment: AttachmentDto): Promise<void> {
    if (armedDelete !== attachment.id) {
      setArmedDelete(attachment.id);
      if (armTimer.current) clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setArmedDelete(null), DELETE_ARM_MS);
      return;
    }
    setArmedDelete(null);
    setBusyId(attachment.id);
    try {
      await moonClient.deleteAttachment(attachment.id);
      setItems((current) => current.filter((entry) => entry.id !== attachment.id));
      setNotice(fill(at.deleted, { name: attachment.name }));
    } catch (error) {
      setNotice(fill(at.deleteFailed, { reason: errorText(error) }));
    } finally {
      setBusyId(null);
    }
  }

  async function logout(): Promise<void> {
    try {
      await moonClient.logout();
      router.replace("/auth");
    } catch (error) {
      setNotice(at.signOutFailed);
      setListError(errorText(error));
    }
  }

  if (loading || user === undefined) {
    return <LoadingScreen label={at.loading} />;
  }
  if (authFailed) {
    return (
      <LoadingScreen
        error={at.loadFailed}
        onRetry={() => void loadUser()}
        retryLabel={at.retryLoad}
      />
    );
  }
  if (user === null) {
    return <LoadingScreen error={at.signedOut} />;
  }

  const sidebarItems: SidebarNavItem[] = [
    {
      href: "/command-center",
      label: copy.common.dashboard,
      onSelect: () => setSidebarOpen(false),
    },
    {
      href: "/attachments",
      label: at.navLabel,
      active: true,
      onSelect: () => setSidebarOpen(false),
    },
  ];

  const rows: AttachmentRow[] = items
    .filter((attachment) => attachment.state !== "deleted")
    .map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      metaLine: `${attachment.mimeType} . ${formatBytes(attachment.sizeBytes)}`,
      stateLabel: at.stateLabels[attachment.state] ?? attachment.state,
      preview: previewFor(attachment, at, moonClient.attachmentContentUrl(attachment.id)),
      actions: (
        <>
          <a
            className="ql-button ql-button--secondary ql-button--default-size"
            href={moonClient.attachmentContentUrl(attachment.id)}
            download={attachment.name}
          >
            {at.download}
          </a>
          <Button
            disabled={busyId === attachment.id}
            onClick={() => void remove(attachment)}
            variant={armedDelete === attachment.id ? "danger" : "ghost"}
          >
            {armedDelete === attachment.id ? at.confirmDelete : at.delete}
          </Button>
        </>
      ),
    }));

  const pending: UploadItem[] = uploads.tasks.map((task) => ({
    id: task.id,
    name: task.name,
    totalBytes: task.totalBytes,
    sentBytes: task.sentBytes,
    status: task.status,
    ...(task.error === undefined ? {} : { error: task.error }),
  }));

  return (
    <WorkspaceTemplate
      closeLabel={copy.common.closeMenu}
      onCloseSidebar={() => setSidebarOpen(false)}
      sidebar={
        <WorkspaceSidebar
          closeLabel={copy.common.closeMenu}
          identity={{ name: user.name, subtitle: user.email }}
          items={sidebarItems}
          logout={{ label: copy.common.logout, onLogout: () => void logout() }}
          navLabel={copy.common.mainNavigation}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      }
      sidebarOpen={sidebarOpen}
      header={
        <SidebarTrigger
          label={copy.common.openMenu}
          onOpenSidebar={() => setSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        />
      }
    >
      <div className="mx-auto w-full max-w-4xl px-1 py-1">
        <PageHeader description={at.description} title={at.title} />

        {notice !== null ? (
          <Alert variant="info">
            <p>{notice}</p>
          </Alert>
        ) : null}

        <section className="mt-6">
          <h2 className="text-lg font-semibold">{at.uploadTitle}</h2>
          <p className="mt-1 text-sm opacity-80">{at.uploadIntro}</p>
          <div className="mt-4">
            <AttachmentUpload
              accept={ACCEPTED_TYPES}
              fileInputId="attachment-picker"
              items={pending}
              labels={{
                pickFile: () => at.pickFile,
                itemStatus: (status) => statusLabel(status, at),
                progressText: (sent, total) =>
                  fill(at.progressText, {
                    sent: formatBytes(sent),
                    total: formatBytes(total),
                  }),
                cancel: () => at.cancel,
                retry: () => at.retry,
                pause: () => at.pause,
                resume: () => at.resume,
                empty: () => at.uploadEmpty,
                hint: () => at.hint,
              }}
              onCancelItem={uploads.cancel}
              onRetryItem={uploads.retry}
              onSelectFiles={uploads.addFiles}
              onTogglePause={uploads.togglePause}
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">{at.libraryTitle}</h2>
            <Button onClick={() => void refresh()} variant="ghost">
              {at.refresh}
            </Button>
          </div>
          <div className="mt-4">
            <AttachmentList
              errorMessage={listError}
              labels={{
                empty: () => at.empty,
                loading: () => at.loading,
                error: () => at.listFailed,
              }}
              rows={rows}
              status={listState}
            />
          </div>
        </section>
      </div>
    </WorkspaceTemplate>
  );
}

function toSessionUser(user: {
  id: string;
  name: string;
  email: string;
  preferredLocale: "id" | "en";
}): { id: string; name: string; email: string; preferredLocale: "id" | "en" } {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    preferredLocale: user.preferredLocale,
  };
}

function statusLabel(status: UploadStatus, at: AttachmentsCopy): string {
  switch (status) {
    case "queued":
      return at.statusQueued;
    case "uploading":
      return at.statusUploading;
    case "verifying":
      return at.statusVerifying;
    case "paused":
      return at.statusPaused;
    case "needsFile":
      return at.statusNeedsFile;
    case "done":
      return at.statusDone;
    case "failed":
      return at.statusFailed;
  }
}

type AttachmentsCopy = AppMessages["attachments"];

function previewFor(
  attachment: AttachmentDto,
  at: AttachmentsCopy,
  url: string,
): ReactNode {
  if (isImage(attachment.mimeType)) {
    return (
      <img
        alt={at.previewAlt}
        height={180}
        loading="lazy"
        src={url}
        width={320}
      />
    );
  }
  if (isPlayable(attachment.mimeType)) {
    return <video controls height={180} preload="none" src={url} width={320} />;
  }
  return undefined;
}
