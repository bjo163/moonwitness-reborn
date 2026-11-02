import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface AttachmentRow {
  readonly id: string;
  readonly name: string;
  /** Type and size line. Built by the screen so units and wording stay copy. */
  readonly metaLine: string;
  readonly stateLabel: string;
  /** Screen-supplied: only a ready attachment has bytes worth pointing at. */
  readonly preview?: ReactNode;
  readonly actions?: ReactNode;
}

export interface AttachmentListLabels {
  empty(): string;
  loading(): string;
  error(message: string): string;
}

export interface AttachmentListProps {
  rows: readonly AttachmentRow[];
  labels: AttachmentListLabels;
  status: "loading" | "ready" | "error";
  errorMessage?: string;
  className?: string;
}

/**
 * Stored attachments as a ledger of rows rather than a card grid: the useful
 * comparison is name against size against state, and a row keeps all three
 * scannable on a phone without reflowing into a mosaic.
 */
export function AttachmentList({
  rows,
  labels,
  status,
  errorMessage,
  className,
}: AttachmentListProps) {
  if (status === "loading") {
    return (
      <p aria-busy="true" className={cn("ql-attachment-list__state", className)}>
        {labels.loading()}
      </p>
    );
  }
  if (status === "error") {
    return (
      <p
        className={cn("ql-attachment-list__state", "is-error", className)}
        role="alert"
      >
        {labels.error(errorMessage ?? "")}
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <p className={cn("ql-attachment-list__state", className)}>
        {labels.empty()}
      </p>
    );
  }

  return (
    <ul className={cn("ql-attachment-list", className)}>
      {rows.map((row) => (
        <li className="ql-attachment-list__row" key={row.id}>
          {row.preview === undefined ? null : (
            <div className="ql-attachment-list__preview">{row.preview}</div>
          )}
          <div className="ql-attachment-list__body">
            <span className="ql-attachment-list__name">{row.name}</span>
            <span className="ql-attachment-list__meta">{row.metaLine}</span>
            <span className="ql-attachment-list__status">{row.stateLabel}</span>
          </div>
          <div className="ql-attachment-list__actions">{row.actions}</div>
        </li>
      ))}
    </ul>
  );
}
