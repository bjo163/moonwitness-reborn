import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils.js";
import { Badge } from "../atoms/badge.js";
import { Button } from "../atoms/button.js";

export interface AyahProofMetadata {
  surahNumber: number;
  ayahNumber: number;
  editionCode: string;
  editionName: string;
  sha256Hash: string;
  verificationUri?: string;
  copiedAtIso: string;
}

export interface AyahProofCardProps {
  surahNumber: number;
  ayahNumber: number;
  text: string;
  editionCode: string;
  editionName: string;
  proofHash: string;
  /**
   * Absolute deep link that recomputes the digest server-side. The card does
   * not invent one: a copy action is not a verification, so a link only
   * appears when the caller actually owns a verification surface.
   */
  verificationUri?: string;
  proofBadgeLabel: string;
  digestLabel: string;
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
  onCopyProof?(this: void, metadata: AyahProofMetadata): void;
  className?: string;
}

type CopyState = "idle" | "copied" | "failed";

export function AyahProofCard({
  surahNumber,
  ayahNumber,
  text,
  editionCode,
  editionName,
  proofHash,
  verificationUri,
  proofBadgeLabel,
  digestLabel,
  copyLabel,
  copiedLabel,
  copyFailedLabel,
  onCopyProof,
  className,
}: AyahProofCardProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  const citation = `QS. ${surahNumber}:${ayahNumber}`;
  const lines = [`"${text}"`, `[${citation} | ${editionName}]`];
  if (verificationUri) lines.push(verificationUri);
  lines.push(`SHA-256: ${proofHash}`);
  const formattedProof = lines.join("\n");

  const handleCopy = useCallback(() => {
    void (async () => {
      let next: CopyState;
      try {
        if (!navigator.clipboard) throw new Error("clipboard unavailable");
        await navigator.clipboard.writeText(formattedProof);
        next = "copied";
      } catch {
        next = "failed";
      }
      setCopyState(next);
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setCopyState("idle"), 2500);
      if (next === "copied") {
        onCopyProof?.({
          surahNumber,
          ayahNumber,
          editionCode,
          editionName,
          sha256Hash: proofHash,
          verificationUri,
          copiedAtIso: new Date().toISOString(),
        });
      }
    })();
  }, [
    formattedProof,
    surahNumber,
    ayahNumber,
    editionCode,
    editionName,
    proofHash,
    verificationUri,
    onCopyProof,
  ]);

  return (
    <div
      className={cn("ql-ayah-proof-card flex flex-col gap-3", className)}
      data-testid="ayah-proof-card"
    >
      <div className="flex items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <span className="text-xs font-mono font-medium text-ink-soft">
          {citation} &middot; {editionName}
        </span>
        <span className="ql-proof-badge">
          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
          <span>{proofBadgeLabel}</span>
        </span>
      </div>

      <div className="py-2">
        <p className="text-sm leading-relaxed text-ink font-display" dir="auto">
          {text}
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-hairline pt-2.5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted font-mono">
            {digestLabel}
          </span>
          <span
            className="max-w-xs truncate text-xs font-mono text-acid"
            title={proofHash}
          >
            {proofHash.slice(0, 16)}…{proofHash.slice(-8)}
          </span>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCopy}
          >
            {copyLabel}
          </Button>
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "text-[10px] font-mono",
              copyState === "failed" ? "text-danger" : "text-ink-soft",
            )}
          >
            {copyState === "copied"
              ? copiedLabel
              : copyState === "failed"
                ? copyFailedLabel
                : "\u00A0"}
          </p>
        </div>
      </div>
    </div>
  );
}

export interface ProofVerificationResultProps {
  status: "verified" | "tampered" | "edition_mismatch" | "not_found";
  expectedHash: string;
  providedHash: string;
  canonicalText: string;
  submittedText?: string;
  surahNumber: number;
  ayahNumber: number;
  verifiedStampLabel: string;
  mismatchStampLabel: string;
  canonicalTextLabel: string;
  submittedTextLabel: string;
  expectedHashLabel: string;
  providedHashLabel: string;
  reportLabel: string;
  className?: string;
}

export function ProofVerificationResult({
  status,
  expectedHash,
  providedHash,
  canonicalText,
  submittedText,
  surahNumber,
  ayahNumber,
  verifiedStampLabel,
  mismatchStampLabel,
  canonicalTextLabel,
  submittedTextLabel,
  expectedHashLabel,
  providedHashLabel,
  reportLabel,
  className,
}: ProofVerificationResultProps) {
  const isMatch = status === "verified";

  return (
    <div
      className={cn("ql-proof-verification-result flex flex-col gap-4", className)}
      data-testid="proof-verification-result"
      role={isMatch ? "region" : "alert"}
      aria-label={reportLabel}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-ink">
            {`QS. ${surahNumber}:${ayahNumber}`}
          </span>
          <Badge variant={isMatch ? "live" : "outline"}>
            {status.toUpperCase()}
          </Badge>
        </div>
        <span
          className={cn(
            "ql-proof-badge font-mono text-xs",
            isMatch ? "is-valid" : "is-tampered",
          )}
        >
          {isMatch ? verifiedStampLabel : mismatchStampLabel}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-mono">
            {canonicalTextLabel}
          </span>
          <p className="mt-1 text-sm text-ink font-display leading-relaxed" dir="auto">
            {canonicalText}
          </p>
        </div>

        {submittedText && submittedText !== canonicalText && (
          <div className="rounded border border-danger/40 bg-panel-deeper p-3">
            <span className="text-xs uppercase tracking-wider text-danger font-mono font-medium">
              {submittedTextLabel}
            </span>
            <p className="mt-1 text-sm text-danger font-display leading-relaxed" dir="auto">
              {submittedText}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-hairline pt-3 font-mono text-xs md:grid-cols-2">
        <div>
          <span className="block text-[10px] uppercase text-muted">
            {expectedHashLabel}
          </span>
          <span className="block truncate text-success" title={expectedHash}>
            {expectedHash}
          </span>
        </div>
        <div>
          <span className="block text-[10px] uppercase text-muted">
            {providedHashLabel}
          </span>
          <span
            className={cn(
              "block truncate",
              isMatch ? "text-success" : "text-danger",
            )}
            title={providedHash}
          >
            {providedHash}
          </span>
        </div>
      </div>
    </div>
  );
}
