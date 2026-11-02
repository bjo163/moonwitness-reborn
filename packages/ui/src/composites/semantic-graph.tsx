import { useState, useCallback } from "react";
import { cn } from "../lib/utils.js";
import { DataTable, type DataTableColumn } from "../components/data-table.js";

export interface ThematicGraphNode {
  id: string;
  label: string;
  category: "concept" | "surah" | "prophet_narrative" | "legal_ruling";
  surahNumber?: number;
  weight: number;
  x: number;
  y: number;
}

export interface ThematicGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: "chronological" | "thematic_echo" | "contrast" | "elaboration";
  weight: number;
  evidencePassages: Array<{ surah: number; ayah: number }>;
}

export interface SemanticCrossSurahGraphProps {
  nodes: readonly ThematicGraphNode[];
  edges: readonly ThematicGraphEdge[];
  initialConceptId?: string;
  activeSurahFilter?: number;
  onNodeClick?(this: void, node: ThematicGraphNode): void;
  onEdgeClick?(this: void, edge: ThematicGraphEdge): void;
  viewMode?: "graph" | "table";
  onViewModeChange?(this: void, mode: "graph" | "table"): void;
  graphLabel?: string;
  tableLabel?: string;
  emptyLabel?: string;
  className?: string;
}

interface TableRowRecord extends Record<string, string | number | boolean | null> {
  id: string;
  label: string;
  category: string;
  surahNumber: number;
  weight: number;
}

export function SemanticCrossSurahGraph({
  nodes,
  edges,
  initialConceptId,
  activeSurahFilter,
  onNodeClick,
  onEdgeClick,
  viewMode: controlledViewMode,
  onViewModeChange,
  graphLabel = "Graph View",
  tableLabel = "Accessible Table",
  emptyLabel = "No semantic relations available.",
  className,
}: SemanticCrossSurahGraphProps) {
  const [internalViewMode, setInternalViewMode] = useState<"graph" | "table">("graph");
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(initialConceptId);

  const activeMode = controlledViewMode ?? internalViewMode;

  const handleModeChange = useCallback(
    (mode: "graph" | "table") => {
      setInternalViewMode(mode);
      onViewModeChange?.(mode);
    },
    [onViewModeChange],
  );

  const handleNodeSelect = useCallback(
    (node: ThematicGraphNode) => {
      setSelectedNodeId(node.id);
      onNodeClick?.(node);
    },
    [onNodeClick],
  );

  const filteredNodes = activeSurahFilter
    ? nodes.filter((n) => n.surahNumber === activeSurahFilter || !n.surahNumber)
    : nodes;

  const nodeMap = new Map<string, ThematicGraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const tableColumns: DataTableColumn<TableRowRecord>[] = [
    { key: "label", label: "Entity Node" },
    { key: "category", label: "Category" },
    { key: "surahNumber", label: "Surah Anchor" },
    { key: "weight", label: "Weight" },
  ];

  const tableRows: TableRowRecord[] = filteredNodes.map((node) => ({
    id: node.id,
    label: node.label,
    category: node.category,
    surahNumber: node.surahNumber ?? 0,
    weight: node.weight,
  }));

  return (
    <div className={cn("ql-semantic-graph flex flex-col", className)} data-testid="semantic-cross-surah-graph">
      {/* Controls toolbar */}
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2 bg-panel-raised/50">
        <span className="text-xs font-medium text-ink-soft">
          Cross-Surah Semantic Network ({filteredNodes.length} nodes, {edges.length} edges)
        </span>
        <div className="flex items-center gap-1.5" role="group" aria-label="View Mode">
          <button
            type="button"
            className={cn(
              "px-2.5 py-1 text-xs rounded border transition-colors",
              activeMode === "graph"
                ? "border-acid text-acid bg-panel"
                : "border-hairline text-muted hover:text-ink-soft",
            )}
            onClick={() => handleModeChange("graph")}
            aria-pressed={activeMode === "graph"}
          >
            {graphLabel}
          </button>
          <button
            type="button"
            className={cn(
              "px-2.5 py-1 text-xs rounded border transition-colors",
              activeMode === "table"
                ? "border-acid text-acid bg-panel"
                : "border-hairline text-muted hover:text-ink-soft",
            )}
            onClick={() => handleModeChange("table")}
            aria-pressed={activeMode === "table"}
          >
            {tableLabel}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeMode === "graph" ? (
        <div className="relative flex-1 w-full min-h-[440px] flex items-center justify-center">
          <svg
            className="w-full h-full min-h-[440px]"
            viewBox="0 0 800 500"
            role="img"
            aria-label="Interactive Cross-Surah Semantic Knowledge Network Graph"
          >
            {/* Edge quadratic beziers */}
            <g className="edges" aria-hidden="true">
              {edges.map((edge) => {
                const source = nodeMap.get(edge.sourceId);
                const target = nodeMap.get(edge.targetId);
                if (!source || !target) return null;

                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2 - 20;
                const d = `M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`;

                return (
                  <path
                    key={edge.id}
                    d={d}
                    className="ql-graph-edge"
                    strokeWidth={Math.min(4, Math.max(1, edge.weight))}
                    onClick={() => onEdgeClick?.(edge)}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {filteredNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const radius = Math.min(24, Math.max(12, node.weight * 2 + 10));

                return (
                  <g
                    key={node.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${node.label} (${node.category})`}
                    className="cursor-pointer focus:outline-none"
                    onClick={() => handleNodeSelect(node)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNodeSelect(node);
                      }
                    }}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      className={cn("ql-graph-node", isSelected && "is-active")}
                    />
                    <text
                      x={node.x}
                      y={node.y + radius + 14}
                      textAnchor="middle"
                      className="fill-ink text-[11px] font-sans pointer-events-none select-none"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      ) : (
        /* Accessible structured data table */
        <div className="p-4 overflow-x-auto">
          <DataTable<TableRowRecord>
            columns={tableColumns}
            rows={tableRows}
            rowKey="id"
            emptyMessage={emptyLabel}
            actionsLabel="Actions"
            yesLabel="Yes"
            noLabel="No"
            onRowClick={(row) => {
              const matched = filteredNodes.find((n) => n.id === row.id);
              if (matched) handleNodeSelect(matched);
            }}
          />
        </div>
      )}
    </div>
  );
}
