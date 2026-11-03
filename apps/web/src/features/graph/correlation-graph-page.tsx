"use client";

import {
  moonClient,
  type ModelRecordDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardHeader,
  LoadingScreen,
  PageHeader,
  SemanticCrossSurahGraph,
  WorkspaceShell,
  type SidebarNavItem,
} from "@moonwitness/ui";
import {
  Boxes,
  KeyRound,
  LayoutDashboard,
  Languages,
  MessageSquare,
  Microscope,
  Network,
  Plug,
  Search as SearchIcon,
  Sparkles,
  Workflow as WorkflowIcon,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { useMessages } from "../locale/messages";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useWorkspaceSession } from "../locale/use-workspace-session";

interface GraphNode {
  id: string;
  label: string;
  kind: "person" | "event" | "story" | "concept" | "artifact";
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relation: string;
}

export default function CorrelationGraphPage() {
  const router = useRouter();
  const copy = useMessages();
  const { t } = useTranslationCatalog();
  const { user, loading, error } = useWorkspaceSession();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        if (!active) return;

        const [corrRes, personRes, storyRes, eventRes] = await Promise.all([
          moonClient.listRecords("research.correlation").catch(() => ({ records: [] })),
          moonClient.listRecords("person.profile").catch(() => ({ records: [] })),
          moonClient.listRecords("story.narrative").catch(() => ({ records: [] })),
          moonClient.listRecords("event.record").catch(() => ({ records: [] })),
        ]);

        if (!active) return;

        const loadedNodes: GraphNode[] = [];
        const loadedEdges: GraphEdge[] = [];

        const entityKey = (r: ModelRecordDto) => String(r.canonical_id ?? r.id);

        personRes.records.forEach((r: ModelRecordDto) => {
          loadedNodes.push({
            id: entityKey(r),
            label: String(r.primary_name ?? r.id),
            kind: "person",
          });
        });

        storyRes.records.forEach((r: ModelRecordDto) => {
          loadedNodes.push({
            id: entityKey(r),
            label: String(r.title ?? r.id),
            kind: "story",
          });
        });

        eventRes.records.forEach((r: ModelRecordDto) => {
          loadedNodes.push({
            id: entityKey(r),
            label: String(r.title ?? r.id),
            kind: "event",
          });
        });

        corrRes.records.forEach((r: ModelRecordDto) => {
          if (r.source_entity_id && r.target_entity_id) {
            loadedEdges.push({
              id: String(r.id),
              from: String(r.source_entity_id),
              to: String(r.target_entity_id),
              relation: String(r.correlation_type ?? "relates_to"),
            });
          }
        });

        setNodes(loadedNodes);
        setEdges(loadedEdges);
      } catch (loadError) {
        if (!active) return;
        setPageError(apiErrorMessage(loadError, t));
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [router, t, user]);

  if (loading || user === undefined) {
    return <LoadingScreen label={copy.common.loading} />;
  }

  const isReviewer =
    user?.groups.some((g) => g === "admin" || g === "operator") ?? false;
  const isWorkflowAuditor =
    user?.groups.some((g) => g === "admin" || g === "operator") ?? false;
  const isAdmin = user?.groups.some((g) => g === "admin") ?? false;

  const sidebarNavItems: SidebarNavItem[] = [
    {
      href: "/command-center",
      label: t("web.common.dashboard"),
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      href: "/command-center/search",
      label: t("web.common.searchAction"),
      icon: <SearchIcon className="size-4" />,
    },
    {
      href: "/command-center/graph",
      label: t("web.graph.correlationGraph"),
      icon: <Network className="size-4" />,
      active: true,
    },
    {
      href: "/command-center/chat",
      label: t("web.common.chat"),
      icon: <MessageSquare className="size-4" />,
    },
    {
      href: "/models",
      label: t("web.common.models"),
      icon: <Boxes className="size-4" />,
    },
    {
      href: "/providers",
      label: t("web.common.providers"),
      icon: <Sparkles className="size-4" />,
    },
    {
      href: "/connectors",
      label: t("web.common.integrations"),
      icon: <Plug className="size-4" />,
    },
    {
      href: "/corpus",
      label: t("web.dashboard.corpusTitle"),
      icon: <BookOpen className="size-4" />,
    },
    ...(isReviewer
      ? [
          {
            href: "/research",
            label: copy.research.navLabel,
            icon: <Microscope className="size-4" />,
          },
        ]
      : []),
    ...(isWorkflowAuditor
      ? [
          {
            href: "/workflow",
            label: copy.workflow.navLabel,
            icon: <WorkflowIcon className="size-4" />,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/admin/users",
            label: t("web.common.users"),
            icon: <KeyRound className="size-4" />,
          },
          {
            href: "/admin/translations",
            label: t("web.translationAdmin.title"),
            icon: <Languages className="size-4" />,
          },
        ]
      : []),
  ];

  return (
    <WorkspaceShell
      items={sidebarNavItems}
      identity={{ name: user?.name ?? "User", subtitle: user?.email ?? "Member" }}
      closeLabel={t("web.common.closeMenu")}
      navLabel={t("web.common.mainNavigation")}
    >
      <div className="space-y-6 p-6">
        <PageHeader
          title={t("web.graph.title")}
          description={t("web.graph.description")}
        />

        {(error ?? pageError) && (
          <Alert variant="error">{error ?? pageError}</Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Network className="size-4 text-ink-muted" />
                  <span>{t("web.graph.ontoNodesRelations")}</span>
                </div>
                <Badge variant="outline">
                  {nodes.length} {t("web.graph.nodes")} | {edges.length} {t("web.graph.edges")}
                </Badge>
              </CardHeader>
              <CardContent>
                {nodes.length === 0 ? (
                  <div className="py-12 text-center text-muted">
                    {t("web.graph.empty")}
                  </div>
                ) : (
                  <SemanticCrossSurahGraph
                    nodes={nodes.map((n) => ({
                      id: n.id,
                      label: n.label,
                      category: n.kind,
                    }))}
                    edges={edges.map((e) => ({
                      id: e.id,
                      sourceId: e.from,
                      targetId: e.to,
                      relationType: e.relation,
                    }))}
                    summaryLabel={t("web.graph.summary", {
                      nodes: nodes.length,
                      edges: edges.length,
                    })}
                    graphDescriptionLabel={t("web.graph.description")}
                    viewModeGroupLabel={t("web.graph.viewModeGroup")}
                    graphLabel={t("web.corpus.graphViewTab")}
                    tableLabel={t("web.corpus.tableViewTab")}
                    emptyLabel={t("web.graph.empty")}
                    nodeColumnLabel={t("web.graph.nodeColumn")}
                    categoryColumnLabel={t("web.graph.categoryColumn")}
                    surahColumnLabel={t("web.graph.surahColumn")}
                    weightColumnLabel={t("web.graph.weightColumn")}
                    relationColumnLabel={t("web.graph.relationColumn")}
                    fromColumnLabel={t("web.graph.fromColumn")}
                    toColumnLabel={t("web.graph.toColumn")}
                    evidenceColumnLabel={t("web.graph.evidenceColumn")}
                    actionsLabel={t("web.common.actions")}
                    yesLabel={t("web.common.yes")}
                    noLabel={t("web.common.no")}
                    onNodeClick={(node) => {
                      const matched = nodes.find((n) => n.id === node.id);
                      if (matched) setSelectedNode(matched);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <span>{t("web.graph.selectedNodeDetails")}</span>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedNode ? (
                  <div>
                    <div className="space-y-2">
                      <div className="text-xs uppercase text-muted">Label</div>
                      <div className="text-base font-semibold text-ink">{selectedNode.label}</div>
                      <div className="text-xs uppercase text-muted">Entity Kind</div>
                      <Badge variant="outline">{selectedNode.kind}</Badge>
                      <div className="text-xs uppercase text-muted">ID</div>
                      <div className="font-mono text-xs text-ink">{selectedNode.id}</div>
                    </div>

                    <div className="mt-4 border-t border-hairline pt-4">
                      <div className="text-xs font-semibold uppercase text-muted">
                        {t("web.graph.directConnections")}
                      </div>
                      <ul className="mt-2 space-y-1 text-xs">
                        {edges
                          .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                          .map((edge, idx) => (
                            <li key={idx} className="rounded bg-surface-subtle p-2 text-ink">
                              <span className="font-mono text-muted">{edge.from}</span>
                              <span className="mx-1 text-primary">--[{edge.relation}]--&gt;</span>
                              <span className="font-mono text-muted">{edge.to}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted">
                    {t("web.graph.selectNode")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}