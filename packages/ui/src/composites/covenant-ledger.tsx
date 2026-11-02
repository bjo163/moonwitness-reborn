import type { ReactElement } from "react";
import { useState } from "react";
import { Check, ShieldCheck, PenTool } from "lucide-react";
import { Button } from "../atoms/button.js";
import { Checkbox } from "../atoms/checkbox.js";

export interface CovenantTermItem {
  id: string;
  number: number;
  title: string;
  description: string;
}

export interface CovenantSignatureRecord {
  id: string;
  contributorName: string;
  contributorCallsign: string;
  covenantVersion: string;
  signatureHash: string;
  signedAt: string;
}

export interface CovenantSignaturePanelProps {
  version: string;
  terms: CovenantTermItem[];
  hasSigned: boolean;
  userSignature?: CovenantSignatureRecord;
  onSignSuccess: (this: void, signature: CovenantSignatureRecord) => void;
  className?: string;
  title?: string;
  signButtonLabel?: string;
  alreadySignedLabel?: string;
  sealLabel?: string;
}

export interface CovenantLedgerTableProps {
  signatures: CovenantSignatureRecord[];
  totalSignatures: number;
  isLoading?: boolean;
  className?: string;
  emptyLabel?: string;
  contributorHeader?: string;
  versionHeader?: string;
  hashHeader?: string;
  dateHeader?: string;
}

export function CovenantSignaturePanel({
  version,
  terms,
  hasSigned,
  userSignature,
  onSignSuccess,
  className = "",
  title = "Architectural & Ethical Research Covenant",
  signButtonLabel = "Affirm & Sign Covenant",
  alreadySignedLabel = "Covenant Formally Affirmed",
  sealLabel = "Cryptographic Seal Active",
}: CovenantSignaturePanelProps): ReactElement {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = terms.length > 0 && terms.every((t) => checkedIds[t.id]);

  const handleToggle = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSign = () => {
    if (!allChecked || hasSigned || isSubmitting) return;
    setIsSubmitting(true);
    const mockHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    const newRecord: CovenantSignatureRecord = {
      id: `sig-${Date.now()}`,
      contributorName: "Active Scholar",
      contributorCallsign: "Researcher",
      covenantVersion: version,
      signatureHash: mockHash,
      signedAt: new Date().toISOString(),
    };
    onSignSuccess(newRecord);
    setIsSubmitting(false);
  };

  return (
    <div
      className={`ql-covenant-signature-panel border border-hairline bg-panel p-6 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div>
          <h3 className="ql-display text-xl font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-xs text-ink-soft">
            Version: <span className="font-mono text-acid">{version}</span>
          </p>
        </div>
        {hasSigned && (
          <div className="flex items-center gap-2 border border-acid/40 bg-panel-well px-3 py-1.5 text-xs text-acid">
            <ShieldCheck className="size-4" />
            <span className="font-medium">{alreadySignedLabel}</span>
          </div>
        )}
      </div>

      {!hasSigned ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-ink-soft">
            Please read and affirm the foundational scholarly principles before
            contributing to the MoonWitness Sacred Corpus:
          </p>
          <div className="space-y-3">
            {terms.map((term) => (
              <label
                key={term.id}
                className="flex items-start gap-3 border border-hairline-soft bg-panel-well p-3 text-sm text-ink hover:border-hairline"
              >
                <Checkbox
                  checked={Boolean(checkedIds[term.id])}
                  onChange={() => handleToggle(term.id)}
                  aria-label={term.title}
                />
                <div className="flex-1">
                  <span className="font-semibold text-ink">
                    {term.number}. {term.title}
                  </span>
                  <p className="mt-0.5 text-xs text-muted">{term.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6 pt-2">
            <Button
              onClick={handleSign}
              disabled={!allChecked || isSubmitting}
              className="inline-flex items-center gap-2"
            >
              <PenTool className="size-4" />
              <span>{signButtonLabel}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 border border-hairline bg-panel-well p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-acid">
            <Check className="size-4" />
            <span>{sealLabel}</span>
          </div>
          <div className="mt-2 space-y-1 font-mono text-xs text-muted">
            <p>
              Signatory:{" "}
              <span className="text-ink">
                {userSignature?.contributorCallsign || "Authenticated Contributor"}
              </span>
            </p>
            <p className="break-all">
              Hash:{" "}
              <span className="text-acid-muted">
                {userSignature?.signatureHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
              </span>
            </p>
            <p>
              Signed At:{" "}
              <span className="text-ink">
                {userSignature?.signedAt || new Date().toISOString()}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function CovenantLedgerTable({
  signatures,
  totalSignatures,
  isLoading = false,
  className = "",
  emptyLabel = "No covenant signatures recorded in the ledger yet.",
  contributorHeader = "Contributor",
  versionHeader = "Version",
  hashHeader = "Cryptographic Seal (SHA-256)",
  dateHeader = "Date Recorded",
}: CovenantLedgerTableProps): ReactElement {
  return (
    <div
      className={`ql-covenant-ledger-table border border-hairline bg-panel ${className}`}
    >
      <div className="border-b border-hairline p-4">
        <h4 className="ql-display text-base font-semibold text-ink">
          Covenant Signature Ledger ({totalSignatures})
        </h4>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-xs text-muted">Loading signatures...</div>
      ) : signatures.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted">{emptyLabel}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hairline bg-panel-well text-muted">
              <tr>
                <th className="p-3">{contributorHeader}</th>
                <th className="p-3">{versionHeader}</th>
                <th className="p-3">{hashHeader}</th>
                <th className="p-3">{dateHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {signatures.map((sig) => (
                <tr key={sig.id} className="hover:bg-panel-well/50">
                  <td className="p-3 font-medium text-ink">
                    {sig.contributorCallsign || sig.contributorName}
                  </td>
                  <td className="p-3 font-mono text-acid">{sig.covenantVersion}</td>
                  <td className="p-3 font-mono text-xs text-muted">
                    {sig.signatureHash.slice(0, 16)}...{sig.signatureHash.slice(-8)}
                  </td>
                  <td className="p-3 text-muted">
                    {new Date(sig.signedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
