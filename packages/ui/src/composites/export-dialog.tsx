import * as React from "react";
import { Button } from "../atoms/button.js";
import { Checkbox } from "../atoms/checkbox.js";

export type ExportFormat = "markdown" | "json" | "mushaf_pdf";

export interface ExportMetadataOption {
  includeSanadChain: boolean;
  includeGroundedCitations: boolean;
  includeMorphologyAnalysis: boolean;
  includeTimestampMetadata: boolean;
}

export interface StudioExportDialogProps {
  isOpen: boolean;
  onClose(this: void): void;
  onExport(this: void, format: ExportFormat, options: ExportMetadataOption): void;
  isExporting?: boolean;
  documentTitle?: string;
  className?: string;
}

export function StudioExportDialog({
  isOpen,
  onClose,
  onExport,
  isExporting = false,
  documentTitle = "Quranic Exegesis Study No. 402",
  className = "",
}: StudioExportDialogProps): React.JSX.Element | null {
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>("markdown");
  const [options, setOptions] = React.useState<ExportMetadataOption>({
    includeSanadChain: true,
    includeGroundedCitations: true,
    includeMorphologyAnalysis: false,
    includeTimestampMetadata: true,
  });

  if (!isOpen) return null;

  const toggleOption = (key: keyof ExportMetadataOption) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-panel-deeper/80 backdrop-blur-sm p-4"
    >
      <div
        className={`ql-studio-export-dialog w-full max-w-lg border border-hairline bg-panel p-6 shadow-2xl ${className}`}
      >
        <div className="border-b border-hairline pb-4">
          <div className="flex items-center justify-between">
            <h2 id="export-dialog-title" className="ql-display text-lg font-semibold text-ink">
              Export Research Artifact
            </h2>
            <span className="font-mono text-xs text-acid">
              MW-STUDIO-EXPORT
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Publish scholarly compilation of <span className="font-medium text-ink">{documentTitle}</span>.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Output Format
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedFormat("markdown")}
                className={`p-3 text-left border transition-colors ${
                  selectedFormat === "markdown"
                    ? "border-acid bg-panel-well text-acid"
                    : "border-hairline hover:border-hairline-strong text-ink"
                }`}
              >
                <div className="text-sm font-semibold">Markdown</div>
                <div className="mt-1 text-[11px] text-muted">Academic bundle (.md)</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat("json")}
                className={`p-3 text-left border transition-colors ${
                  selectedFormat === "json"
                    ? "border-acid bg-panel-well text-acid"
                    : "border-hairline hover:border-hairline-strong text-ink"
                }`}
              >
                <div className="text-sm font-semibold">JSON Data</div>
                <div className="mt-1 text-[11px] text-muted">Structured sanad tree</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat("mushaf_pdf")}
                className={`p-3 text-left border transition-colors ${
                  selectedFormat === "mushaf_pdf"
                    ? "border-acid bg-panel-well text-acid"
                    : "border-hairline hover:border-hairline-strong text-ink"
                }`}
              >
                <div className="text-sm font-semibold">Mushaf PDF</div>
                <div className="mt-1 text-[11px] text-muted">Print-ready PDF layout</div>
              </button>
            </div>
          </div>

          {/* Metadata Inclusion */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Verification & Sanad Layers
            </div>
            <div className="space-y-2 border border-hairline bg-panel-well p-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-soft">
                <Checkbox
                  checked={options.includeSanadChain}
                  onChange={() => toggleOption("includeSanadChain")}
                />
                <span>Include cryptographic Sanad chain hashes & reviewers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-soft">
                <Checkbox
                  checked={options.includeGroundedCitations}
                  onChange={() => toggleOption("includeGroundedCitations")}
                />
                <span>Include authoritative Quranic verse citations</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-soft">
                <Checkbox
                  checked={options.includeMorphologyAnalysis}
                  onChange={() => toggleOption("includeMorphologyAnalysis")}
                />
                <span>Include detailed Arabic morphological breakdown</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-soft">
                <Checkbox
                  checked={options.includeTimestampMetadata}
                  onChange={() => toggleOption("includeTimestampMetadata")}
                />
                <span>Include recitation audio alignment timestamps</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <Button variant="ghost" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => onExport(selectedFormat, options)}
              disabled={isExporting}
            >
              {isExporting ? "Compiling..." : `Export as ${selectedFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
