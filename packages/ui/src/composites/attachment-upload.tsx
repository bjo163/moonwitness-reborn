import { FileInput } from "../atoms/file-input.js";
import { Progress } from "../atoms/progress.js";
import { Button } from "../atoms/button.js";
import { cn } from "../lib/utils.js";

export type UploadItemStatus =
  | "queued"
  | "uploading"
  | "verifying"
  | "paused"
  | "needsFile"
  | "done"
  | "failed";

export interface UploadItem {
  readonly id: string;
  readonly name: string;
  readonly totalBytes: number;
  /** Bytes the server has acknowledged. Never a client-side guess. */
  readonly sentBytes: number;
  readonly status: UploadItemStatus;
  readonly error?: string;
}

export interface AttachmentUploadLabels {
  pickFile(): string;
  itemStatus(status: UploadItemStatus): string;
  progressText(sentBytes: number, totalBytes: number): string;
  cancel(): string;
  retry(): string;
  pause(): string;
  resume(): string;
  empty(): string;
  hint(): string;
}

export interface AttachmentUploadProps {
  items: readonly UploadItem[];
  labels: AttachmentUploadLabels;
  fileInputId: string;
  /** `accept` limits the picker; the server still sniffs the real container. */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onSelectFiles(files: readonly File[]): void;
  onCancelItem(id: string): void;
  onRetryItem(id: string): void;
  onTogglePause(id: string): void;
  className?: string;
}

const PAUSABLE: readonly UploadItemStatus[] = ["queued", "uploading", "verifying"];
const DISMISSABLE: readonly UploadItemStatus[] = [
  "queued",
  "uploading",
  "verifying",
  "paused",
  "needsFile",
];
// Without the original bytes the client cannot state how far along the server
// is, so these two show a moving bar instead of a number it would be inventing.
const UNQUANTIFIED: readonly UploadItemStatus[] = ["verifying", "needsFile"];

/**
 * Upload surface for resumable attachments. Copy arrives through `labels` so the
 * composite stays language-neutral, and progress uses acknowledged bytes only:
 * an unconfirmed percentage would be a number the user has no reason to trust.
 */
export function AttachmentUpload({
  items,
  labels,
  fileInputId,
  accept,
  multiple = true,
  disabled = false,
  onSelectFiles,
  onCancelItem,
  onRetryItem,
  onTogglePause,
  className,
}: AttachmentUploadProps) {
  return (
    <div className={cn("ql-attachment-upload", className)}>
      <div className="ql-attachment-upload__picker">
        <FileInput
          accept={accept}
          disabled={disabled}
          id={fileInputId}
          multiple={multiple}
          onChange={(event) => {
            const picked = event.currentTarget.files;
            onSelectFiles(picked === null ? [] : Array.from(picked));
            // Reset so choosing the same file again still fires a change.
            event.currentTarget.value = "";
          }}
        />
        {/* A label, not a button: only `for` opens the picker, and the hidden
            input stays the single focusable control behind it. */}
        <label
          className={cn(
            "ql-button ql-button--default ql-button--default-size",
            "ql-attachment-upload__trigger",
            disabled ? "is-disabled" : undefined,
          )}
          htmlFor={fileInputId}
        >
          {labels.pickFile()}
        </label>
        <p className="ql-attachment-upload__hint">{labels.hint()}</p>
      </div>

      {items.length === 0 ? (
        <p className="ql-attachment-upload__empty">{labels.empty()}</p>
      ) : (
        <ul className="ql-attachment-upload__list">
          {items.map((item) => (
            <li className="ql-attachment-upload__item" key={item.id}>
              <div className="ql-attachment-upload__meta">
                <span className="ql-attachment-upload__name" id={`ql-upload-${item.id}`}>
                  {item.name}
                </span>
                <span className="ql-attachment-upload__status">
                  {labels.itemStatus(item.status)}
                </span>
              </div>
              <Progress
                indeterminate={UNQUANTIFIED.includes(item.status)}
                labelledBy={`ql-upload-${item.id}`}
                max={item.totalBytes}
                value={item.sentBytes}
                valueText={labels.progressText(item.sentBytes, item.totalBytes)}
              />
              {/* The same figure the progressbar announces, shown to everyone:
                  a bar alone does not say how much is left. */}
              <p className="ql-attachment-upload__progress">
                {labels.progressText(item.sentBytes, item.totalBytes)}
              </p>
              {item.error === undefined ? null : (
                <p className="ql-attachment-upload__error">{item.error}</p>
              )}
              <div className="ql-attachment-upload__actions">
                {item.status === "failed" ? (
                  <Button onClick={() => onRetryItem(item.id)} variant="secondary">
                    {labels.retry()}
                  </Button>
                ) : null}
                {item.status === "paused" ? (
                  <Button onClick={() => onTogglePause(item.id)} variant="secondary">
                    {labels.resume()}
                  </Button>
                ) : null}
                {PAUSABLE.includes(item.status) ? (
                  <Button
                    onClick={() => onTogglePause(item.id)}
                    variant="secondary"
                  >
                    {labels.pause()}
                  </Button>
                ) : null}
                {DISMISSABLE.includes(item.status) ? (
                  <Button onClick={() => onCancelItem(item.id)} variant="ghost">
                    {labels.cancel()}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
