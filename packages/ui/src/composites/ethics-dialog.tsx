import { type ReactElement, useState } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";
import { Button } from "../atoms/button.js";
import { Checkbox } from "../atoms/checkbox.js";

export interface EthicsAffirmationPayload {
  changeId: string;
  isNotFatwaAffirmed: boolean;
  citationsVerifiedAffirmed: boolean;
  decorumAffirmed: boolean;
  affirmedAt: string;
  ethicsDigest: string;
}

export interface EthicsChecklistDialogProps {
  open: boolean;
  articleTitle: string;
  changeId: string;
  onConfirm(this: void, payload: EthicsAffirmationPayload): Promise<void>;
  onCancel(this: void): void;
  className?: string;
  title?: string;
}

export function EthicsChecklistDialog({
  open,
  articleTitle,
  changeId,
  onConfirm,
  onCancel,
  className = "",
  title = "Pre-Publication Editorial Reflection & Ethics Verification",
}: EthicsChecklistDialogProps): ReactElement | null {
  const [isNotFatwa, setIsNotFatwa] = useState(false);
  const [citationsVerified, setCitationsVerified] = useState(false);
  const [decorum, setDecorum] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const allAffirmed = isNotFatwa && citationsVerified && decorum;

  const handleConfirm = async () => {
    if (!allAffirmed || submitting) return;
    setSubmitting(true);
    try {
      const mockDigest = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");
      await onConfirm({
        changeId,
        isNotFatwaAffirmed: isNotFatwa,
        citationsVerifiedAffirmed: citationsVerified,
        decorumAffirmed: decorum,
        affirmedAt: new Date().toISOString(),
        ethicsDigest: mockDigest,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`ql-ethics-checklist-dialog fixed inset-0 z-50 flex items-center justify-center bg-panel-deeper/80 backdrop-blur-sm p-4 ${className}`}
    >
      <div
        className="relative w-full max-w-lg border border-hairline bg-panel p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 text-muted hover:text-ink"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-hairline pb-4">
          <div className="flex size-9 items-center justify-center border border-warning/40 bg-panel-well text-warning">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="ql-display text-lg font-semibold text-ink">{title}</h3>
            <p className="text-xs text-muted">Submitting: {articleTitle}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-xs leading-relaxed text-ink-soft">
            To maintain truth provenance and theological integrity, you must solemnly
            affirm the following editorial criteria before publication into the canonical library:
          </p>

          <label className="flex items-start gap-3 border border-hairline-soft bg-panel-well p-3 text-xs text-ink cursor-pointer hover:border-hairline">
            <Checkbox
              checked={isNotFatwa}
              onChange={() => setIsNotFatwa(!isNotFatwa)}
              aria-label="Demarcation of Personal Reflection"
            />
            <div>
              <span className="font-semibold text-ink">
                1. Epistemic Demarcation (Not a Binding Fatwa)
              </span>
              <p className="mt-0.5 text-muted leading-relaxed">
                I solemnly affirm this submission is personal research and hermeneutic
                reflection (tadabbur), not a binding legal fatwa or doctrinal decree.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 border border-hairline-soft bg-panel-well p-3 text-xs text-ink cursor-pointer hover:border-hairline">
            <Checkbox
              checked={citationsVerified}
              onChange={() => setCitationsVerified(!citationsVerified)}
              aria-label="Citations Verbatim Accuracy"
            />
            <div>
              <span className="font-semibold text-ink">
                2. Verifiable Scripture & Source Accuracy
              </span>
              <p className="mt-0.5 text-muted leading-relaxed">
                All Quranic verses and classical scholarly traditions cited exist
                verbatim in canonical texts without interpolation or misattribution.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 border border-hairline-soft bg-panel-well p-3 text-xs text-ink cursor-pointer hover:border-hairline">
            <Checkbox
              checked={decorum}
              onChange={() => setDecorum(!decorum)}
              aria-label="Scholarly Decorum"
            />
            <div>
              <span className="font-semibold text-ink">
                3. Adherence to Scholarly Decorum
              </span>
              <p className="mt-0.5 text-muted leading-relaxed">
                The content preserves sacred dignity, avoiding sectarian polemics, personal
                invective, and commercial exploitation.
              </p>
            </div>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-hairline pt-4">
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleConfirm();
            }}
            disabled={!allAffirmed || submitting}
            className="inline-flex items-center gap-2"
          >
            <ShieldCheck className="size-4" />
            <span>Confirm Publication</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
