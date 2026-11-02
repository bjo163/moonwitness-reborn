import { useState, useCallback } from "react";
import { cn } from "../lib/utils.js";
import { Badge } from "../atoms/badge.js";
import { Button } from "../atoms/button.js";

export interface AyahProofMetadata {
  surahNumber: number;
  ayahNumber: number;
  editionCode: string;
  editionName: string;
  sha256Hash: string;
  verificationUri: string;
  copiedAtIso: string;
}

export interface AyahProofCardProps {
  surahNumber: number;
  ayahNumber: number;
  text: string;
  editionCode: string;
  editionName?: string;
  proofHash: string;
  isVerified?: boolean;
  onCopyProof?(this: void, metadata: AyahProofMetadata): void;
  copyLabel?: string;
  copiedLabel?: string;
  proofBadgeLabel?: string;
  className?: string;
}

export function AyahProofCard({
  surahNumber,
  ayahNumber,
  text,
  editionCode,
  editionName = "Canonical Edition",
  proofHash,
  isVerified = true,
  onCopyProof,
  copyLabel = "Copy Ayah with Cryptographic Proof",
  copiedLabel = "Copied with Proof!",
  proofBadgeLabel = "SHA-256 Provenance Stamp",
  className,
}: AyahProofCardProps) {
  const [copied, setCopied] = useState(false);

  const verificationUri = `https://moonwitness.com/verify/ayah/${surahNumber}/${ayahNumber}?hash=${proofHash}`;

  const handleCopy = useCallback(async () => {
    const formattedProof = `"${text}"\n[QS. ${surahNumber}:${ayahNumber} | ${editionName}]\nMoonWitness Proof: ${verificationUri}`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(formattedProof);
      }
    } catch {
      // clipboard fallback
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    onCopyProof?.({
      surahNumber,
      ayahNumber,
      editionCode,
      editionName,
      sha256Hash: proofHash,
      verificationUri,
      copiedAtIso: new Date().toISOString(),
    });
  }, [text, surahNumber, ayahNumber, editionName, verificationUri, editionCode, proofHash, onCopyProof]);

  const onCopyClick = useCallback(() => {
    void handleCopy();
  }, [handleCopy]);

  return (
    <div
      className={cn("ql-ayah-proof-card flex flex-col gap-3", className)}
      data-testid="ayah-proof-card"
    >
      <div className="flex items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <span className="text-xs font-mono font-medium text-ink-soft">
          Surah {surahNumber}:{ayahNumber} &middot; {editionName}
        </span>
        <span
          className={cn(
            "ql-proof-badge",
            isVerified ? "is-valid" : "is-tampered",
          )}
          role="status"
          aria-label={proofBadgeLabel}
        >
          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
          <span>{proofBadgeLabel}</span>
        </span>
      </div>

      <div className="py-2">
        <p className="text-sm leading-relaxed text-ink font-serif" dir="auto">
          {text}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-hairline pt-2.5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted font-mono">
            Cryptographic Digest
          </span>
          <span className="text-xs font-mono text-acid truncate max-w-[280px]" title={proofHash}>
            {proofHash.slice(0, 16)}…{proofHash.slice(-8)}
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onCopyClick}
          aria-label={copied ? copiedLabel : copyLabel}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
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
  className,
}: ProofVerificationResultProps) {
  const isMatch = status === "verified";

  return (
    <div
      className={cn("ql-proof-verification-result flex flex-col gap-4", className)}
      data-testid="proof-verification-result"
      role={isMatch ? "region" : "alert"}
      aria-label="Ayah Verification Report"
    >
      <div className="flex items-center justify-between gap-2 border-b border-hairline pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-ink">
            Surah {surahNumber}:{ayahNumber}
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
          {isMatch ? "TAMPER-PROOF VERIFIED" : "INTEGRITY MISMATCH"}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-mono">
            Canonical Text from Scripture
          </span>
          <p className="mt-1 text-sm text-ink font-serif leading-relaxed" dir="auto">
            {canonicalText}
          </p>
        </div>

        {submittedText && submittedText !== canonicalText && (
          <div className="rounded border border-danger/40 bg-panel-deeper p-3">
            <span className="text-xs uppercase tracking-wider text-danger font-mono font-medium">
              Submitted Altered Text
            </span>
            <p className="mt-1 text-sm text-danger font-serif leading-relaxed" dir="auto">
              {submittedText}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-hairline pt-3 font-mono text-xs">
        <div>
          <span className="text-[10px] uppercase text-muted block">Expected Hash</span>
          <span className="text-success truncate block" title={expectedHash}>{expectedHash}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-muted block">Provided Hash</span>
          <span className={cn("truncate block", isMatch ? "text-success" : "text-danger")} title={providedHash}>
            {providedHash}
          </span>
        </div>
      </div>
    </div>
  );
}
