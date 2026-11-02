"use client";

import {
  moonClient,
  type AuthUserDto,
  type ModelRecordDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  LoadingScreen,
  PageHeader,
  SidebarTrigger,
  WorkspaceSidebar,
  WorkspaceTemplate,
  type SidebarNavItem,
} from "@moonwitness/ui";
import {
  Boxes,
  Database,
  GitFork,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { useMessages } from "../locale/messages";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

interface GraphNode {
  id: string;
  label: string;
  kind: "person" | "event" | "story" | "concept" | "artifact";
}

interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

export default function CorrelationGraphPage() {
  const router = useRouter();
  const copy = useMessages();
  const { t } = useTranslationCatalog();
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { locale, changeLocale, saving: localeSaving } =
    useLocalePreference(user ?? null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const currentUserData = await moonClient.currentUser();
        if (!active) return;
        if (!currentUserData.user) {
          router.replace("/auth");
          return;
        }
        setUser(currentUserData.user);

        // Fetch correlations, characters, stories, events
        const [corrRes, personRes, storyRes, eventRes] = await Promise.all([
          moonClient.listRecords("research.correlation").catch(() => ({ records: [] })),
          moonClient.listRecords("person.profile").catch(() => ({ records: [] })),
          moonClient.listRecords("story.narrative").catch(() => ({ records: [] })),
          moonClient.listRecords("event.record").catch(() => ({ records: [] })),
        ]);

        if (!active) return;

        const loadedNodes: GraphNode[] = [];
        const loadedEdges: GraphEdge[] = [];

        personRes.records.forEach((r: ModelRecordDto) => {
          loadedNodes.push({
            id: String(r.id),
            label: String(r.name ?? r.id),
            kind: "person",
          });
        });

        storyRes.records.forEach((r: ModelRecordDto) => {
          loadedNodes.push({
            id: String(r.id),
            label: String(r.title ?? r.name ?? r.id),
            kind: "story",
          });
        });

        eventRes.records.forEach((r: ModelRecordDto) => {
          loadedNodes.push({
            id: String(r.id),
            label: String(r.name ?? r.id),
            kind: "event",
          });
        });

        corrRes.records.forEach((r: ModelRecordDto) => {
          if (r.source_id && r.target_id) {
            loadedEdges.push({
              from: String(r.source_id),
              to: String(r.target_id),
              relation: String(r.correlation_type ?? "relates_to"),
            });
          }
        });

        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setLoading(false);
      } catch (loadError) {
        if (!active) return;
        setError(apiErrorMessage(loadError, t));
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [router, t]);

  async function logout() {
    setError(null);
    try {
      await moonClient.logout();
      router.replace("/auth");
    } catch (logoutError) {
      setError(apiErrorMessage(logoutError, t));
    }
  }

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
      label: copy.common.dashboard,
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      href: "/command-center/search",
      label: locale === "id" ? "Pencarian Cerdas" : "Smart Search",
      icon: <SearchIcon className="size-4" />,
    },
    {
      href: "/command-center/graph",
      label: locale === "id" ? "Visualisasi Relasi" : "Correlation Graph",
      icon: <Network className="size-4" />,
      active: true,
    },
    {
      href: "/command-center/chat",
      label: copy.common.chat,
      icon: <MessageSquare className="size-4" />,
    },
    {
      href: "/models",
      label: copy.common.models,
      icon: <Boxes className="size-4" />,
    },
    {
      href: "/providers",
      label: copy.common.providers,
      icon: <Sparkles className="size-4" />,
    },
    {
      href: "/connectors",
      label: copy.common.integrations,
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
            label: copy.common.users,
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
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={copy.common.closeMenu}
      sidebar={
        <WorkspaceSidebar
          brandIcon={<Sparkles aria-hidden="true" size={16} />}
          closeLabel={copy.common.closeMenu}
          identity={{ name: user?.name ?? "User", subtitle: user?.email ?? "Member" }}
          items={sidebarNavItems}
          logout={{ label: copy.common.logout, onLogout: () => void logout() }}
          navLabel="Knowledge Graph"
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      }
      header={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger
              label={copy.common.openMenu}
              onOpenSidebar={() => setSidebarOpen(true)}
              sidebarOpen={sidebarOpen}
            />
            <span className="text-sm font-medium text-ink-soft">
              Knowledge Graph
            </span>
          </div>
          <LocaleSwitcher
            locale={locale}
            label={copy.common.localeLabel}
            saving={localeSaving}
            onChange={changeLocale}
          />
        </div>
      }
    >
      <div className="space-y-6 p-6">
        <PageHeader
          title={locale === "id" ? "Graf Korelasi & Ontologi" : "Ontology & Correlation Graph"}
          description={
            locale === "id"
              ? "Eksplorasi hubungan semantik antara Tokoh, Peristiwa, Narasi, dan Korpus Al-Qur'an secara visual."
              : "Visually explore semantic relations between Persons, Events, Narratives, and Quranic Corpus."
          }
          actions={
            <div className="flex items-center gap-2">
              <SidebarTrigger onClick={() => setSidebarOpen(true)} />
            </div>
          }
        />

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="size-4 text-ink-muted" />
                    <span>{locale === "id" ? "Simpul & Relasi Ontologi" : "Ontology Nodes & Relations"}</span>
                  </div>
                  <Badge variant="outline">
                    {nodes.length} {locale === "id" ? "Simpul" : "Nodes"} | {edges.length} {locale === "id" ? "Relasi" : "Edges"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {nodes.length === 0 ? (
                  <div className="py-12 text-center text-muted">
                    {locale === "id"
                      ? "Belum ada entitas terdaftar untuk divisualisasikan. Masukkan entitas melalui menu Model Data."
                      : "No entities registered yet to visualize. Populate models via the Models workspace."}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {nodes.map((node) => (
                      <button
                        type="button"
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          selectedNode?.id === node.id
                            ? "border-primary bg-surface-subtle"
                            : "border-hairline hover:bg-surface-subtle"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-ink">{node.label}</span>
                          <Badge variant="outline">{node.kind}</Badge>
                        </div>
                        <div className="mt-1 font-mono text-xs text-muted">
                          {node.id}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <span>{locale === "id" ? "Detail Simpul Terpilih" : "Selected Node Details"}</span>
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
                        {locale === "id" ? "Koneksi Langsung" : "Direct Connections"}
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
                    {locale === "id"
                      ? "Pilih salah satu simpul untuk melihat detail dan relasi semantiknya."
                      : "Select a node to inspect its details and semantic relations."}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
