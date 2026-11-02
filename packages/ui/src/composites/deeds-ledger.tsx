import type { ReactElement } from "react";
import { Check, Shield } from "lucide-react";

export type BeneficialDeedKind =
  | "typo_correction"
  | "translation_review"
  | "reference_verification"
  | "annotation_audit";

export interface BeneficialDeedRecord {
  id: string;
  contributorCallsign: string;
  isAnonymous: boolean;
  deedKind: BeneficialDeedKind;
  summary: string;
  proofHash: string;
  createdAt: string;
}

export interface DeedsActivityLedgerProps {
  deeds: BeneficialDeedRecord[];
  totalCount: number;
  activeKindFilter?: BeneficialDeedKind;
  onFilterChange: (this: void, kind?: BeneficialDeedKind) => void;
  className?: string;
  title?: string;
  emptyLabel?: string;
}

export function DeedsActivityLedger({
  deeds,
  totalCount,
  activeKindFilter,
  onFilterChange,
  className = "",
  title = "Proof-of-Beneficial-Deeds Activity Ledger",
  emptyLabel = "No beneficial deeds recorded yet in the public ledger.",
}: DeedsActivityLedgerProps): ReactElement {
  const kinds: BeneficialDeedKind[] = [
    "typo_correction",
    "translation_review",
    "reference_verification",
    "annotation_audit",
  ];

  return (
    <div
      className={`ql-deeds-activity-ledger border border-hairline bg-panel p-6 ${className}`}
    >
      <div className="flex flex-col gap-4 border-b border-hairline pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-acid">
            <Shield className="size-4" />
            <span>Honorable & Non-Gamified Historical Record</span>
          </div>
          <h3 className="ql-display mt-1 text-xl font-semibold text-ink">
            {title} ({totalCount})
          </h3>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => onFilterChange(undefined)}
            className={`border px-2.5 py-1 transition-all ${
              !activeKindFilter
                ? "border-acid bg-panel-well text-acid"
                : "border-hairline text-muted hover:border-hairline-strong"
            }`}
          >
            All Deeds
          </button>
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onFilterChange(k)}
              className={`border px-2.5 py-1 uppercase tracking-wider transition-all ${
                activeKindFilter === k
                  ? "border-acid bg-panel-well text-acid"
                  : "border-hairline text-muted hover:border-hairline-strong"
              }`}
            >
              {k.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {deeds.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted">{emptyLabel}</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hairline bg-panel-well text-muted">
              <tr>
                <th className="p-3">Contributor</th>
                <th className="p-3">Deed Type</th>
                <th className="p-3">Summary / Beneficial Contribution</th>
                <th className="p-3">Proof Hash</th>
                <th className="p-3">Recorded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {deeds.map((deed) => (
                <tr key={deed.id} className="hover:bg-panel-well/50">
                  <td className="p-3 font-medium text-ink">
                    {deed.isAnonymous ? (
                      <span className="font-mono text-muted">Anonymous Contributor</span>
                    ) : (
                      <span>{deed.contributorCallsign}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="border border-hairline bg-panel-well px-2 py-0.5 font-mono text-[10px] text-acid">
                      {deed.deedKind}
                    </span>
                  </td>
                  <td className="p-3 text-ink-soft">{deed.summary}</td>
                  <td className="p-3 font-mono text-[11px] text-muted">
                    {deed.proofHash ? deed.proofHash.slice(0, 16) + "..." : "verified"}
                  </td>
                  <td className="p-3 text-muted">
                    {new Date(deed.createdAt).toLocaleDateString()}
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
