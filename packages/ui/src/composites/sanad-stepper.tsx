import type { ReactElement } from "react";
import { useState } from "react";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Button } from "../atoms/button.js";
import { Textarea } from "../atoms/textarea.js";

export type PeerReviewDecision = "approved" | "changes_requested";

export interface SanadReviewerItem {
  reviewerId: string;
  reviewerName: string;
  sanadChainRef: string;
  decision: PeerReviewDecision;
  notes: string;
  signedAt: string;
}

export interface SanadVerificationStepperProps {
  changeId: string;
  currentState: string;
  authorId: string;
  currentUserId: string;
  reviews: SanadReviewerItem[];
  requiredReviews?: number;
  onSubmitReview: (
    this: void,
    decision: PeerReviewDecision,
    notes: string,
    sanadRef: string,
  ) => Promise<void>;
  className?: string;
  title?: string;
  authorNotice?: string;
  quorumNotice?: string;
}

export function SanadVerificationStepper({
  currentState,
  authorId,
  currentUserId,
  reviews,
  requiredReviews = 2,
  onSubmitReview,
  className = "",
  title = "Sanad Multi-Peer Review Pipeline",
  authorNotice = "You are the author of this work. Independent scholarly peer review is required (Anti-Self-Approval rule).",
  quorumNotice = "Independent Scholarly Quorum Reached (>= 2 Peer Approvals). Ready for release.",
}: SanadVerificationStepperProps): ReactElement {
  const [decision, setDecision] = useState<PeerReviewDecision>("approved");
  const [notes, setNotes] = useState("");
  const [sanadRef, setSanadRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAuthor = currentUserId === authorId;
  const approvedReviews = reviews.filter((r) => r.decision === "approved");
  const quorumReached = approvedReviews.length >= requiredReviews;

  const handleSubmit = async () => {
    if (!notes.trim() || !sanadRef.trim() || isAuthor || submitting) return;
    setSubmitting(true);
    try {
      await onSubmitReview(decision, notes, sanadRef);
      setNotes("");
      setSanadRef("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`ql-sanad-stepper border border-hairline bg-panel p-6 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div>
          <h3 className="ql-display text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-xs text-ink-soft">
            State: <span className="font-mono text-acid">{currentState}</span> |
            Approvals:{" "}
            <span className="font-semibold text-ink">
              {approvedReviews.length} / {requiredReviews}
            </span>
          </p>
        </div>
        {quorumReached && (
          <div className="flex items-center gap-2 border border-success/40 bg-panel-well px-3 py-1.5 text-xs text-success">
            <CheckCircle2 className="size-4" />
            <span>Approved</span>
          </div>
        )}
      </div>

      {quorumReached && (
        <div className="mt-4 border border-success/30 bg-panel-well p-3 text-xs text-success">
          {quorumNotice}
        </div>
      )}

      {/* Review List */}
      <div className="mt-6 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Sanad Chain Review Records ({reviews.length})
        </h4>
        {reviews.length === 0 ? (
          <p className="text-xs text-muted">
            No peer endorsements submitted yet.
          </p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="border border-hairline-soft bg-panel-well p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{r.reviewerName}</span>
                  <span
                    className={`font-semibold uppercase tracking-wider ${
                      r.decision === "approved" ? "text-success" : "text-warning"
                    }`}
                  >
                    {r.decision}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-acid-muted">
                  Chain Ref: {r.sanadChainRef}
                </p>
                <p className="mt-1 text-ink-soft">{r.notes}</p>
                <p className="mt-1 text-[10px] text-muted">{r.signedAt}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Form or Author Notice */}
      <div className="mt-6 border-t border-hairline pt-4">
        {isAuthor ? (
          <div className="flex items-center gap-2 border border-warning/30 bg-panel-well p-3 text-xs text-warning">
            <AlertCircle className="size-4 shrink-0" />
            <span>{authorNotice}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">
              Submit Scholarly Endorsement
            </h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="radio"
                  name="review-decision"
                  value="approved"
                  checked={decision === "approved"}
                  onChange={() => setDecision("approved")}
                  className="accent-acid"
                />
                <span>Approve & Verify</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="radio"
                  name="review-decision"
                  value="changes_requested"
                  checked={decision === "changes_requested"}
                  onChange={() => setDecision("changes_requested")}
                  className="accent-acid"
                />
                <span>Request Changes</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                Sanad Chain / Scholarly Reference:
              </label>
              <input
                type="text"
                value={sanadRef}
                onChange={(e) => setSanadRef(e.target.value)}
                placeholder="e.g. Al-Azhar Classical Exegesis Chain, Riwayah Hafs"
                className="w-full border border-hairline bg-panel-well px-3 py-2 text-xs text-ink focus:border-acid focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">
                Review Notes & Hermeneutic Verification:
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detail verification results against classical sources..."
                rows={3}
                className="w-full text-xs"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!notes.trim() || !sanadRef.trim() || submitting}
              className="inline-flex items-center gap-2"
            >
              <Send className="size-4" />
              <span>Submit Sanad Review</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
