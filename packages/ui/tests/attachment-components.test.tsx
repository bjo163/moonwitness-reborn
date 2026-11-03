import React from "react";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AttachmentList,
  AttachmentUpload,
  FileInput,
  LoadingScreen,
  Progress,
  type AttachmentUploadLabels,
  type UploadItem,
} from "../src/index.js";
import { assertNoOwnColours, render } from "./render-helpers.js";

const uploadLabels: AttachmentUploadLabels = {
  pickFile: () => "Pilih berkas",
  itemStatus: (status) => `status:${status}`,
  progressText: (sent, total) => `${sent} dari ${total} bita`,
  cancel: () => "Batalkan",
  retry: () => "Coba lagi",
  pause: () => "Jeda",
  resume: () => "Lanjutkan",
  empty: () => "Belum ada unggahan.",
  hint: () => "Maksimum 500 MiB per berkas.",
};

const listLabels = {
  empty: () => "Belum ada lampiran.",
  loading: () => "Memuat lampiran...",
  error: (message: string) => `Gagal memuat: ${message}`,
};

function item(overrides: Partial<UploadItem> = {}): UploadItem {
  return {
    id: "u-1",
    name: "clip.mp4",
    totalBytes: 1000,
    sentBytes: 250,
    status: "uploading",
    ...overrides,
  };
}

function noop(): void {
  return undefined;
}

const uploadActions = {
  onCancelItem: noop,
  onRetryItem: noop,
  onSelectFiles: noop,
  onTogglePause: noop,
};

void test("Progress exposes a real value and clamps it", () => {
  const markup = render(
    <Progress
      labelledBy="heading-1"
      max={1000}
      value={250}
      valueText="250 dari 1000 bita"
    />,
  );
  assert.match(markup, /role="progressbar"/);
  assert.match(markup, /aria-valuemin="0"/);
  assert.match(markup, /aria-valuemax="1000"/);
  assert.match(markup, /aria-valuenow="250"/);
  assert.match(markup, /aria-valuetext="250 dari 1000 bita"/);
  assert.match(markup, /aria-labelledby="heading-1"/);
  assert.match(markup, /--ql-progress-value:25\.00%/);
  assertNoOwnColours(markup, "Progress");

  assert.match(render(<Progress max={10} value={-40} />), /--ql-progress-value:0\.00%/);
  assert.match(render(<Progress max={10} value={90} />), /--ql-progress-value:100\.00%/);
  assert.match(render(<Progress max={0} value={5} />), /--ql-progress-value:0\.00%/);
});

void test("an indeterminate Progress withholds a value it does not know", () => {
  const markup = render(<Progress indeterminate value={0} />);
  assert.equal(markup.includes("aria-valuenow"), false);
  assert.match(markup, /class="ql-progress is-indeterminate"/);
});

void test("Progress keeps its own class when a caller adds one", () => {
  const markup = render(<Progress className="screen-extra" value={50} />);
  assert.match(markup, /class="ql-progress screen-extra"/);
});

void test("FileInput stays a real input with a bindable id", () => {
  const markup = render(
    <FileInput accept="image/png" disabled id="picker-1" multiple name="files" />,
  );
  assert.match(markup, /type="file"/);
  assert.match(markup, /id="picker-1"/);
  assert.match(markup, /class="ql-file-input"/);
  assert.match(markup, /accept="image\/png"/);
  assert.match(markup, /disabled/);
  assert.match(markup, /multiple/);
});

void test("FileInput keeps its class when a caller adds one", () => {
  const markup = render(<FileInput className="screen-extra" id="picker-1" />);
  assert.match(markup, /class="ql-file-input screen-extra"/);
});

void test("AttachmentUpload pairs the visible label with the hidden input", () => {
  const markup = render(
    <AttachmentUpload
      accept="image/png"
      fileInputId="picker-9"
      items={[]}
      labels={uploadLabels}
      {...uploadActions}
    />,
  );
  assert.match(markup, /<input class="ql-file-input" type="file"/);
  assert.match(markup, /id="picker-9"/);
  assert.match(
    markup,
    /<label class="[^"]*ql-attachment-upload__trigger" for="picker-9"/,
  );
  assert.match(markup, /Belum ada unggahan\./);
  assert.match(markup, /Maksimum 500 MiB per berkas\./);
  assertNoOwnColours(markup, "AttachmentUpload");
});

void test("AttachmentUpload shows progress and per-item affordances", () => {
  const markup = render(
    <AttachmentUpload
      fileInputId="picker-9"
      items={[
        item(),
        item({ id: "u-2", sentBytes: 900, status: "paused" }),
        item({ error: "Berkas melebihi batas.", id: "u-3", status: "failed" }),
        item({ id: "u-4", sentBytes: 1000, status: "done" }),
        item({ id: "u-5", status: "verifying" }),
        item({ id: "u-6", status: "needsFile" }),
      ]}
      labels={uploadLabels}
      {...uploadActions}
    />,
  );
  assert.equal(markup.includes("ql-attachment-upload__empty"), false);
  assert.match(markup, /status:uploading/);
  assert.match(markup, /Berkas melebihi batas\./);

  // The byte figure is visible, not only announced to assistive technology.
  assert.match(
    markup,
    /<p class="ql-attachment-upload__progress">250 dari 1000 bita<\/p>/,
  );

  const rows = markup.split('<li class="ql-attachment-upload__item"');
  assert.equal(rows.length - 1, 6);

  // A settled row offers no cancel, retry, pause, or resume.
  assert.equal((rows[4] ?? "").includes("Batalkan"), false);
  assert.equal((rows[4] ?? "").includes("Coba lagi"), false);
  assert.equal((rows[4] ?? "").includes("Jeda"), false);
  // A paused row needs a way forward and a way out, and not the pause control.
  assert.equal((rows[2] ?? "").includes("Lanjutkan"), true);
  assert.equal((rows[2] ?? "").includes("Batalkan"), true);
  assert.equal((rows[2] ?? "").includes(">Jeda<"), false);
  // A failed row can be retried and dropped; a live row can be paused and dropped.
  assert.equal((rows[3] ?? "").includes("Coba lagi"), true);
  assert.equal((rows[1] ?? "").includes(">Jeda<"), true);
  // Verifying and needsFile have no trustworthy local figure, so both sweep.
  assert.equal((rows[5] ?? "").includes("is-indeterminate"), true);
  assert.equal((rows[6] ?? "").includes("is-indeterminate"), true);
  // needsFile has no file to send, so resume must not be offered.
  assert.equal((rows[6] ?? "").includes("Lanjutkan"), false);
});

void test("AttachmentUpload keeps its class when a caller adds one", () => {
  const markup = render(
    <AttachmentUpload
      className="screen-extra"
      fileInputId="picker-9"
      items={[]}
      labels={uploadLabels}
      {...uploadActions}
    />,
  );
  assert.match(markup, /class="ql-attachment-upload screen-extra"/);
});

void test("AttachmentList covers loading, error, and empty states", () => {
  const loading = render(
    <AttachmentList labels={listLabels} rows={[]} status="loading" />,
  );
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /Memuat lampiran\.\.\./);

  const failed = render(
    <AttachmentList
      errorMessage="Sesi berakhir."
      labels={listLabels}
      rows={[]}
      status="error"
    />,
  );
  assert.match(failed, /role="alert"/);
  assert.match(failed, /class="ql-attachment-list__state is-error"/);
  assert.match(failed, /Gagal memuat: Sesi berakhir\./);

  const empty = render(
    <AttachmentList labels={listLabels} rows={[]} status="ready" />,
  );
  assert.match(empty, /Belum ada lampiran\./);
  assertNoOwnColours(empty, "AttachmentList empty");
});

void test("AttachmentList renders rows with their preview and action slots", () => {
  const markup = render(
    <AttachmentList
      labels={listLabels}
      rows={[
        {
          actions: <button type="button">Hapus</button>,
          id: "a-1",
          metaLine: "video/mp4 . 40 MiB",
          name: "khutbah.mp4",
          preview: <img alt="Pratinjau" height={90} src="/api/x" width={160} />,
          stateLabel: "Siap",
        },
        {
          id: "a-2",
          metaLine: "application/pdf . 2 MiB",
          name: "catatan.pdf",
          stateLabel: "Mengunggah",
        },
      ]}
      status="ready"
    />,
  );
  assert.match(markup, /<ul class="ql-attachment-list"/);
  assert.match(markup, /khutbah\.mp4/);
  assert.match(markup, /<div class="ql-attachment-list__preview">/);
  assert.match(markup, /alt="Pratinjau"/);
  assert.match(markup, /width="160"/);
  assert.match(markup, /height="90"/);
  const rows = markup.split('<li class="ql-attachment-list__row"');
  assert.equal(rows.length - 1, 2);
  // A row without a preview must not emit an empty frame.
  assert.equal((rows[2] ?? "").includes("ql-attachment-list__preview"), false);
  assertNoOwnColours(markup, "AttachmentList rows");
});

void test("AttachmentList keeps its class in every state", () => {
  for (const status of ["ready", "loading"] as const) {
    const markup = render(
      <AttachmentList
        className="screen-extra"
        labels={listLabels}
        rows={[]}
        status={status}
      />,
    );
    assert.match(markup, /screen-extra/);
  }
});

void test("LoadingScreen offers a way out of a failed load", () => {
  const plain = render(<LoadingScreen error="Gagal dimuat." />);
  assert.match(plain, /role="alert"/);
  assert.match(plain, /Gagal dimuat\./);
  assert.equal(plain.includes("<button"), false);

  const retryable = render(
    <LoadingScreen
      error="Gagal dimuat."
      onRetry={() => undefined}
      retryLabel="Coba lagi"
    />,
  );
  assert.match(retryable, /<button[^>]*>Coba lagi<\/button>/);
  assert.match(retryable, /ql-button--secondary/);
  assertNoOwnColours(retryable, "LoadingScreen retry");
});
