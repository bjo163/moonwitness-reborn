"use client";

import {
  moonClient,
  type AttachmentDto,
  type AttachmentKindDto,
} from "@moonwitness/moonclient";
import { useEffect, useRef, useState } from "react";

export type UploadStatus =
  | "queued"
  | "uploading"
  | "verifying"
  | "paused"
  | "needsFile"
  | "done"
  | "failed";

export interface UploadTask {
  readonly id: string;
  readonly name: string;
  readonly totalBytes: number;
  readonly sentBytes: number;
  readonly status: UploadStatus;
  readonly error?: string;
}

interface LiveTask {
  taskId: string;
  name: string;
  mimeType: string;
  totalBytes: number;
  sentBytes: number;
  status: UploadStatus;
  uploadId?: string;
  attachmentId?: string;
  chunkBytes: number;
  totalChunks: number;
  expiresAt: number;
  error?: string;
  file?: File;
  paused: boolean;
  cancelled: boolean;
}

interface PersistedSession {
  taskId: string;
  uploadId: string;
  attachmentId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt: number;
}

export interface UploadCopy {
  needsFile(): string;
}

export interface UploadHandlers {
  onUploaded(attachment: AttachmentDto): void;
  errorText(error: unknown): string;
  copy: UploadCopy;
}

const STORE_KEY = "moonwitness.attachment.uploads.v1";
/** Above this a browser would have to hold the whole file in memory to hash it. */
const CLIENT_DIGEST_CEILING = 16 * 1024 * 1024;
const CHUNK_CONCURRENCY = 3;
const CHUNK_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 500;

function isPersistedSession(value: unknown): value is PersistedSession {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<PersistedSession>;
  return (
    typeof entry.taskId === "string" &&
    typeof entry.uploadId === "string" &&
    typeof entry.attachmentId === "string" &&
    typeof entry.name === "string" &&
    typeof entry.sizeBytes === "number" &&
    typeof entry.expiresAt === "number"
  );
}

function readStore(): PersistedSession[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPersistedSession);
  } catch {
    // A corrupt store costs the resume, never the screen.
    return [];
  }
}

function writeStore(sessions: readonly PersistedSession[]): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(sessions));
  } catch {
    // Full or private mode: resume is unavailable, upload itself is not.
  }
}

function forgetTask(taskId: string): void {
  writeStore(readStore().filter((entry) => entry.taskId !== taskId));
}

/**
 * The declared digest is a bonus integrity claim, not a requirement: past the
 * ceiling the server-computed digest is the one that gets compared.
 */
async function digestOf(file: File): Promise<string | undefined> {
  if (file.size > CLIENT_DIGEST_CEILING) return undefined;
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function kindFor(mimeType: string): AttachmentKindDto {
  if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) return "media";
  if (mimeType.startsWith("audio/")) return "media";
  if (mimeType === "application/pdf" || mimeType === "application/rtf") return "document";
  if (mimeType.startsWith("text/")) return "document";
  return "dataset";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toView(task: LiveTask): UploadTask {
  return {
    id: task.taskId,
    name: task.name,
    totalBytes: task.totalBytes,
    sentBytes: task.sentBytes,
    status: task.status,
    ...(task.error === undefined ? {} : { error: task.error }),
  };
}

/**
 * Resumable chunked uploader.
 *
 * One file advances at a time with a few chunks in flight, because several
 * whole-file uploads would fight the browser's per-host connection limit and
 * make progress jerky rather than faster. Pausing takes effect once the current
 * chunk is acknowledged: a partial chunk cannot be half-written on the server.
 */
export function useAttachmentUploads(handlers: UploadHandlers) {
  const [views, setViews] = useState<UploadTask[]>([]);
  const tasks = useRef(new Map<string, LiveTask>());
  const queue = useRef<string[]>([]);
  const pumping = useRef(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  function publish(): void {
    setViews(Array.from(tasks.current.values(), toView));
  }

  function persist(task: LiveTask): void {
    if (task.uploadId === undefined || task.attachmentId === undefined) return;
    const entry: PersistedSession = {
      taskId: task.taskId,
      uploadId: task.uploadId,
      attachmentId: task.attachmentId,
      name: task.name,
      mimeType: task.mimeType,
      sizeBytes: task.totalBytes,
      expiresAt: task.expiresAt,
    };
    writeStore([
      ...readStore().filter((stored) => stored.taskId !== entry.taskId),
      entry,
    ]);
  }

  async function sendChunks(task: LiveTask): Promise<void> {
    const file = task.file;
    const uploadId = task.uploadId;
    if (file === undefined || uploadId === undefined) return;

    // An adopted session knows nothing locally, so the server decides which
    // indices still have to travel.
    if (task.totalChunks === 0) {
      const progress = await moonClient.attachmentUploadProgress(uploadId);
      task.chunkBytes = progress.chunkBytes;
      task.totalChunks = progress.totalChunks;
      task.sentBytes = progress.receivedBytes;
      await ship(task, uploadId, file, progress.missingChunks);
      return;
    }
    await ship(task, uploadId, file, allIndices(task.totalChunks));
  }

  function allIndices(total: number): number[] {
    return Array.from({ length: total }, (_unused, index) => index);
  }

  async function ship(
    task: LiveTask,
    uploadId: string,
    file: File,
    indices: readonly number[],
  ): Promise<void> {
    let cursor = 0;

    async function worker(): Promise<void> {
      for (;;) {
        if (task.cancelled || task.paused) return;
        const index = indices[cursor];
        cursor += 1;
        if (index === undefined) return;
        const start = index * task.chunkBytes;
        const slice = file.slice(start, Math.min(start + task.chunkBytes, file.size));
        for (let attempt = 1; ; attempt += 1) {
          try {
            const body = new Uint8Array(await slice.arrayBuffer());
            const progress = await moonClient.uploadAttachmentChunk(uploadId, index, body);
            task.sentBytes = Math.min(progress.receivedBytes, task.totalBytes);
            publish();
            break;
          } catch (error) {
            if (task.cancelled || task.paused) return;
            if (attempt >= CHUNK_ATTEMPTS) throw error;
            await wait(RETRY_BACKOFF_MS * attempt);
          }
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CHUNK_CONCURRENCY, indices.length) }, worker),
    );
  }

  async function runTask(task: LiveTask): Promise<void> {
    if (task.file === undefined) {
      task.status = "needsFile";
      task.error = handlersRef.current.copy.needsFile();
      publish();
      return;
    }
    try {
      if (task.uploadId === undefined) {
        const file = task.file;
        const mimeType = file.type || "application/octet-stream";
        const sha256 = await digestOf(file);
        const session = await moonClient.createAttachmentUpload({
          name: file.name,
          mimeType,
          kind: kindFor(mimeType),
          sizeBytes: file.size,
          ...(sha256 === undefined ? {} : { sha256 }),
        });
        task.uploadId = session.uploadId;
        task.attachmentId = session.attachmentId;
        task.chunkBytes = session.chunkBytes;
        task.totalChunks = session.totalChunks;
        task.mimeType = mimeType;
        task.expiresAt = Date.parse(session.expiresAt);
        task.status = "uploading";
        publish();
        persist(task);
      }

      task.status = "uploading";
      publish();
      await sendChunks(task);
      if (task.cancelled) return;
      if (task.paused) {
        task.status = "paused";
        publish();
        return;
      }

      task.status = "verifying";
      publish();
      const { attachment } = await moonClient.completeAttachmentUpload(task.uploadId);
      task.status = "done";
      task.sentBytes = task.totalBytes;
      task.file = undefined;
      forgetTask(task.taskId);
      handlersRef.current.onUploaded(attachment);
      publish();
    } catch (error) {
      if (task.cancelled) return;
      task.status = "failed";
      task.error = handlersRef.current.errorText(error);
      // The session may already be gone server-side after a rejected upload, so
      // a retry starts clean rather than assuming the old parts are still there.
      task.uploadId = undefined;
      task.attachmentId = undefined;
      task.totalChunks = 0;
      task.sentBytes = 0;
      task.file = undefined;
      forgetTask(task.taskId);
      publish();
    }
  }

  async function pump(): Promise<void> {
    if (pumping.current) return;
    pumping.current = true;
    try {
      for (;;) {
        const taskId = queue.current.shift();
        if (taskId === undefined) break;
        const task = tasks.current.get(taskId);
        if (task === undefined || task.cancelled) continue;
        await runTask(task);
      }
    } finally {
      pumping.current = false;
    }
  }

  function start(taskId: string): void {
    if (!queue.current.includes(taskId)) queue.current.push(taskId);
    void pump();
  }

  function addFiles(files: readonly File[]): void {
    const stored = readStore();
    for (const file of files) {
      // A re-picked file adopts the session left behind before the reload and
      // sends only what the server is still missing.
      const adopted = stored.find(
        (entry) =>
          entry.name === file.name &&
          entry.sizeBytes === file.size &&
          entry.mimeType === (file.type || "application/octet-stream") &&
          entry.expiresAt > Date.now() &&
          !tasks.current.has(entry.taskId),
      );
      const taskId = adopted?.taskId ?? crypto.randomUUID();
      tasks.current.set(taskId, {
        taskId,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        totalBytes: file.size,
        sentBytes: 0,
        status: "queued",
        chunkBytes: 0,
        totalChunks: 0,
        expiresAt: adopted?.expiresAt ?? 0,
        ...(adopted
          ? { uploadId: adopted.uploadId, attachmentId: adopted.attachmentId }
          : {}),
        file,
        paused: false,
        cancelled: false,
      });
      if (adopted) forgetTask(taskId);
      start(taskId);
    }
    publish();
  }

  function togglePause(taskId: string): void {
    const task = tasks.current.get(taskId);
    if (task === undefined) return;
    if (task.status === "uploading") {
      task.paused = true;
      task.status = "paused";
      publish();
      return;
    }
    if (task.status === "paused") {
      if (task.file === undefined) {
        task.error = handlersRef.current.copy.needsFile();
        task.status = "needsFile";
        publish();
        return;
      }
      task.paused = false;
      task.status = "queued";
      start(taskId);
      publish();
    }
  }

  function cancel(taskId: string): void {
    const task = tasks.current.get(taskId);
    if (task === undefined) return;
    task.cancelled = true;
    task.paused = true;
    const attachmentId = task.attachmentId;
    if (attachmentId !== undefined) {
      // Deleting the record makes the server drop its parts too, so an abandoned
      // upload does not occupy space until the reaper happens to run.
      void moonClient.deleteAttachment(attachmentId).catch(() => undefined);
    }
    forgetTask(taskId);
    tasks.current.delete(taskId);
    queue.current = queue.current.filter((entry) => entry !== taskId);
    publish();
  }

  function retry(taskId: string): void {
    const task = tasks.current.get(taskId);
    if (task === undefined) return;
    task.status = "queued";
    task.error = undefined;
    task.paused = false;
    task.cancelled = false;
    if (task.file === undefined) {
      task.error = handlersRef.current.copy.needsFile();
      task.status = "needsFile";
      publish();
      return;
    }
    start(taskId);
    publish();
  }

  // Sessions that outlived a reload come back as `needsFile`: the bytes already
  // on the server are real, but no browser keeps a File handle across reloads.
  useEffect(() => {
    const alive = readStore().filter((entry) => entry.expiresAt > Date.now());
    writeStore(alive);
    if (alive.length === 0) return;
    for (const entry of alive) {
      if (tasks.current.has(entry.taskId)) continue;
      tasks.current.set(entry.taskId, {
        taskId: entry.taskId,
        name: entry.name,
        mimeType: entry.mimeType,
        totalBytes: entry.sizeBytes,
        sentBytes: 0,
        status: "needsFile",
        uploadId: entry.uploadId,
        attachmentId: entry.attachmentId,
        chunkBytes: 0,
        totalChunks: 0,
        expiresAt: entry.expiresAt,
        error: handlersRef.current.copy.needsFile(),
        paused: true,
        cancelled: false,
      });
    }
    setViews(Array.from(tasks.current.values(), toView));
  }, []);

  const hasActive = views.some(
    (task) =>
      task.status === "queued" ||
      task.status === "uploading" ||
      task.status === "verifying",
  );

  return { tasks: views, addFiles, cancel, retry, togglePause, hasActive };
}
