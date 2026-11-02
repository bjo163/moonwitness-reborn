import { useCallback, useMemo, useState } from "react";
import { cn } from "../lib/utils.js";
import { DataTable, type DataTableColumn } from "../components/data-table.js";

export interface ThematicGraphNode {
  id: string;
  label: string;
  /**
   * Display category as stored on the source record. The corpus thematic model
   * narrows it to `concept | surah | prophet_narrative | legal_ruling`; other
   * graphs pass their own entity kind.
   */
  category: string;
  surahNumber?: number;
  /**
   * Relative importance for sizing. Only a real record field belongs here (for
   * example `search.thematic_node.passage_count`); omit it when the source has
   * no such field and the graph falls back to a uniform radius.
   */
  weight?: number;
}

export interface ThematicGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  /** Relation label as stored on the source record, e.g. `research.correlation.correlation_type`. */
  relationType: string;
  weight?: number;
  evidencePassages?: readonly { surah: number; ayah: number }[];
}

export interface SemanticCrossSurahGraphProps {
  nodes: readonly ThematicGraphNode[];
  edges: readonly ThematicGraphEdge[];
  initialConceptId?: string;
  activeSurahFilter?: number;
  onNodeClick?(this: void, node: ThematicGraphNode): void;
  viewMode?: "graph" | "table";
  onViewModeChange?(this: void, mode: "graph" | "table"): void;
  /** Counts line; the caller formats it, e.g. `t("web.graph.summary", { nodes, edges })`. */
  summaryLabel: string;
  graphDescriptionLabel: string;
  viewModeGroupLabel: string;
  graphLabel: string;
  tableLabel: string;
  emptyLabel: string;
  nodeColumnLabel: string;
  categoryColumnLabel: string;
  surahColumnLabel: string;
  weightColumnLabel: string;
  relationColumnLabel: string;
  fromColumnLabel: string;
  toColumnLabel: string;
  evidenceColumnLabel: string;
  actionsLabel: string;
  yesLabel: string;
  noLabel: string;
  className?: string;
}

interface TableRowRecord extends Record<string, string | number | boolean | null> {
  id: string;
  label: string;
  category: string;
  surahNumber: number | null;
  weight: number | null;
}

interface EdgeRowRecord extends Record<string, string | number | boolean | null> {
  id: string;
  relationType: string;
  sourceLabel: string;
  targetLabel: string;
  evidence: string | null;
}

const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 500;
const MIN_NODE_RADIUS = 12;
const MAX_NODE_RADIUS = 24;
const UNIFORM_NODE_RADIUS = 16;

/**
 * Positions are presentation, not knowledge: they come from the node order in
 * the current selection so that no coordinate is mistaken for a stored fact.
 */
function useLayoutPositions(
  nodes: readonly ThematicGraphNode[],
): ReadonlyMap<string, { x: number; y: number }> {
  return useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const centerX = VIEWBOX_WIDTH / 2;
    const centerY = VIEWBOX_HEIGHT / 2;
    nodes.forEach((node, index) => {
      if (nodes.length === 1) {
        positions.set(node.id, { x: centerX, y: centerY });
        return;
      }
      const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + 300 * Math.cos(angle),
        y: centerY + 170 * Math.sin(angle),
      });
    });
    return positions;
  }, [nodes]);
}

function scaleByWeight(value: number, max: number, min: number, span: number): number {
  return max === 0 ? min : min + (value / max) * span;
}

export function SemanticCrossSurahGraph({
  nodes,
  edges,
  initialConceptId,
  activeSurahFilter,
  onNodeClick,
  viewMode: controlledViewMode,
  onViewModeChange,
  summaryLabel,
  graphDescriptionLabel,
  viewModeGroupLabel,
  graphLabel,
  tableLabel,
  emptyLabel,
  nodeColumnLabel,
  categoryColumnLabel,
  surahColumnLabel,
  weightColumnLabel,
  relationColumnLabel,
  fromColumnLabel,
  toColumnLabel,
  evidenceColumnLabel,
  actionsLabel,
  yesLabel,
  noLabel,
  className,
}: SemanticCrossSurahGraphProps) {
  const [internalViewMode, setInternalViewMode] = useState<"graph" | "table">("graph");
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(initialConceptId);

  const activeMode = controlledViewMode ?? internalViewMode;

  const handleModeChange = useCallback(
    (mode: "graph" | "table") => {
      if (controlledViewMode === undefined) setInternalViewMode(mode);
      onViewModeChange?.(mode);
    },
    [controlledViewMode, onViewModeChange],
  );

  const handleNodeSelect = useCallback(
    (node: ThematicGraphNode) => {
      setSelectedNodeId(node.id);
      onNodeClick?.(node);
    },
    [onNodeClick],
  );

  const positions = useLayoutPositions(nodes);

  const filteredNodes = activeSurahFilter
    ? nodes.filter((n) => n.surahNumber === activeSurahFilter || !n.surahNumber)
    : nodes;

  const nodeMap = useMemo(() => {
    const map = new Map<string, ThematicGraphNode>();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  const maxNodeWeight = useMemo(
    () => nodes.reduce((max, n) => Math.max(max, n.weight ?? 0), 0),
    [nodes],
  );
  const maxEdgeWeight = useMemo(
    () => edges.reduce((max, e) => Math.max(max, e.weight ?? 0), 0),
    [edges],
  );

  const hasNodeWeights = nodes.some((n) => n.weight !== undefined);
  const hasEdgeEvidence = edges.some((e) => (e.evidencePassages?.length ?? 0) > 0);

  const tableColumns: DataTableColumn<TableRowRecord>[] = [
    { key: "label", label: nodeColumnLabel },
    { key: "category", label: categoryColumnLabel },
    { key: "surahNumber", label: surahColumnLabel },
    ...(hasNodeWeights ? [{ key: "weight" as const, label: weightColumnLabel }] : []),
  ];

  const tableRows: TableRowRecord[] = filteredNodes.map((node) => ({
    id: node.id,
    label: node.label,
    category: node.category,
    surahNumber: node.surahNumber ?? null,
    weight: node.weight ?? null,
  }));

  const edgeColumns: DataTableColumn<EdgeRowRecord>[] = [
    { key: "relationType", label: relationColumnLabel },
    { key: "sourceLabel", label: fromColumnLabel },
    { key: "targetLabel", label: toColumnLabel },
    ...(hasEdgeEvidence ? [{ key: "evidence" as const, label: evidenceColumnLabel }] : []),
  ];

  const edgeRows: EdgeRowRecord[] = edges.map((edge) => ({
    id: edge.id,
    relationType: edge.relationType,
    sourceLabel: nodeMap.get(edge.sourceId)?.label ?? edge.sourceId,
    targetLabel: nodeMap.get(edge.targetId)?.label ?? edge.targetId,
    evidence:
      edge.evidencePassages && edge.evidencePassages.length > 0
        ? edge.evidencePassages.map((passage) => `${passage.surah}:${passage.ayah}`).join(", ")
        : null,
  }));

  return (
    <div className={cn("ql-semantic-graph flex flex-col", className)} data-testid="semantic-cross-surah-graph">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-2">
        <span className="text-xs font-medium text-ink-soft">{summaryLabel}</span>
        <div className="flex items-center gap-1.5" role="group" aria-label={viewModeGroupLabel}>
          <button
            type="button"
            className={cn("ql-graph-view-toggle", activeMode === "graph" && "is-active")}
            onClick={() => handleModeChange("graph")}
            aria-pressed={activeMode === "graph"}
          >
            {graphLabel}
          </button>
          <button
            type="button"
            className={cn("ql-graph-view-toggle", activeMode === "table" && "is-active")}
            onClick={() => handleModeChange("table")}
            aria-pressed={activeMode === "table"}
          >
            {tableLabel}
          </button>
        </div>
      </div>

      {activeMode === "graph" ? (
        filteredNodes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">{emptyLabel}</p>
        ) : (
          <div className="ql-semantic-graph-canvas">
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              role="img"
              aria-label={graphDescriptionLabel}
            >
              {/* Curves repeat what the nodes and the relation table already
                  state, so they stay out of the a11y tree. */}
              <g className="edges" aria-hidden="true">
                {edges.map((edge) => {
                  const source = positions.get(edge.sourceId);
                  const target = positions.get(edge.targetId);
                  if (!source || !target) return null;

                  const midX = (source.x + target.x) / 2;
                  const midY = (source.y + target.y) / 2 - 20;
                  const d = `M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`;

                  return (
                    <path
                      key={edge.id}
                      d={d}
                      className="ql-graph-edge"
                      strokeWidth={scaleByWeight(edge.weight ?? 0, maxEdgeWeight, 1.5, 2.5)}
                    />
                  );
                })}
              </g>

              <g className="nodes">
                {filteredNodes.map((node) => {
                  const position = positions.get(node.id);
                  if (!position) return null;
                  const isSelected = selectedNodeId === node.id;
                  const radius =
                    node.weight === undefined
                      ? UNIFORM_NODE_RADIUS
                      : scaleByWeight(
                          node.weight,
                          maxNodeWeight,
                          MIN_NODE_RADIUS,
                          MAX_NODE_RADIUS - MIN_NODE_RADIUS,
                        );

                  return (
                    <g
                      key={node.id}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isSelected}
                      aria-label={node.label}
                      className="ql-graph-node-focus cursor-pointer"
                      onClick={() => handleNodeSelect(node)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleNodeSelect(node);
                        }
                      }}
                    >
                      <circle
                        cx={position.x}
                        cy={position.y}
                        r={radius}
                        className={cn("ql-graph-node", isSelected && "is-active")}
                      />
                      <text
                        x={position.x}
                        y={position.y + radius + 14}
                        textAnchor="middle"
                        className="ql-graph-node-label"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        )
      ) : (
        <div className="space-y-5 overflow-x-auto p-4">
          <DataTable<TableRowRecord>
            columns={tableColumns}
            rows={tableRows}
            rowKey="id"
            emptyMessage={emptyLabel}
            actionsLabel={actionsLabel}
            yesLabel={yesLabel}
            noLabel={noLabel}
            onRowClick={(row) => {
              const matched = filteredNodes.find((n) => n.id === row.id);
              if (matched) handleNodeSelect(matched);
            }}
          />
          <DataTable<EdgeRowRecord>
            columns={edgeColumns}
            rows={edgeRows}
            rowKey="id"
            emptyMessage={emptyLabel}
            actionsLabel={actionsLabel}
            yesLabel={yesLabel}
            noLabel={noLabel}
          />
        </div>
      )}
    </div>
  );
}
