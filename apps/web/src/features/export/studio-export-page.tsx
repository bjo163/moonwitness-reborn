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
  FormField,
  LoadingScreen,
  PageHeader,
  Select,
  StudioExportDialog,
  Textarea,
  WorkspaceShell,
  type SidebarNavItem,
  type ExportFormat,
  type ExportMetadataOption,
} from "@moonwitness/ui";
import {
  Boxes,
  FileText,
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

export default function StudioExportPage() {
  const router = useRouter();
  const copy = useMessages();
  const { t, tm } = useTranslationCatalog();
  const { user, loading, error } = useWorkspaceSession();
  const [artifacts, setArtifacts] = useState<ModelRecordDto[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState("");
  const [compiledMarkdown, setCompiledMarkdown] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadArtifacts() {
      try {
        if (!user) {
          router.replace("/auth");
          return;
        }

        const res = await moonClient
          .listRecords("studio.artifact")
          .catch(() => ({ records: [] }));

        if (!active) return;
        setArtifacts(res.records);
        if (res.records.length > 0) {
          setSelectedArtifactId(String(res.records[0].id));
          compileArtifact(res.records[0]);
        }
      } catch (loadError) {
        if (!active) return;
        setLoadError(apiErrorMessage(loadError, t));
      }
    }

    void loadArtifacts();
    return () => {
      active = false;
    };
  }, [router, t, user]);

  function compileArtifact(artifact: ModelRecordDto) {
    const title = String(artifact.title ?? artifact.name ?? "Untitled Artifact");
    const kind = String(artifact.artifact_kind ?? "document");
    const content = String(artifact.content ?? "");
    const stage = String(artifact.stage ?? "draft");

    const doc = [
      `# ${title}`,
      `> Artifact Kind: \`${kind}\` | Stage: \`${stage}\``,
      "",
      "---",
      "",
      "### Ringkasan & Konten Kanonis",
      content || "*(Belum ada konten tertulis)*",
      "",
      "---",
      "",
      "### Metadata Provenance & Integritas",
      `- Record ID: \`${artifact.id}\``,
      `- Compiled by: MoonWitness Knowledge Studio v0.3.0`,
      `- Date: ${new Date().toISOString()}`,
    ].join("\n");

    setCompiledMarkdown(doc);
  }

  function handleSelect(id: string) {
    setSelectedArtifactId(id);
    const found = artifacts.find((a) => String(a.id) === id);
    if (found) {
      compileArtifact(found);
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
        label: tm("web.graph.title", "Knowledge Graph"),
        icon: <Network className="size-4" />,
      },
    {
      href: "/command-center/export",
      label: t("web.translationAdmin.exportPo"),
      icon: <FileText className="size-4" />,
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
          title={tm("web.export.title", "Studio Exporter")}
          description={tm("web.export.description", "Compile creative studio artifacts into structured Markdown documents with citations.")}
        />

        {(error ?? loadError) && (
          <Alert variant="error">{error ?? loadError}</Alert>
        )}

        <div className="space-y-6 p-6">
          <PageHeader
            title={tm("web.export.compiledTitle", "Studio Artifact Exporter")}
            description={tm("web.export.compiledDesc", "Compile creative studio artifacts into structured Markdown documents with citations.")}
          />

          {(error ?? loadError) && (
            <Alert variant="error">{error ?? loadError}</Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <Card>
                <CardHeader>
                  <span>{tm("web.export.selectArtifact", "Select Studio Artifact")}</span>
                </CardHeader>
                <CardContent className="space-y-4">
                  {artifacts.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted">
                      {tm("web.export.noArtifacts", "No studio artifacts found in studio.artifact model.")}
                    </div>
                  ) : (
                    <FormField
                      label={tm("web.export.artifactList", "Artifact List")}
                      htmlFor="select-artifact"
                    >
                      <Select
                        id="select-artifact"
                        value={selectedArtifactId}
                        onChange={(e) => handleSelect(e.target.value)}
                      >
                        {artifacts.map((a) => (
                          <option key={String(a.id)} value={String(a.id)}>
                            {String(a.title ?? a.name ?? a.id)} ({String(a.stage ?? "draft")})
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span>{tm("web.export.preview", "Compiled Preview")}</span>
                    <Badge variant="outline">Markdown</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={compiledMarkdown}
                    readOnly
                    rows={16}
                    className="font-mono text-xs"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <StudioExportDialog
            isOpen={exportDialogOpen}
            onClose={() => setExportDialogOpen(false)}
            documentTitle={
              artifacts.find((a) => String(a.id) === selectedArtifactId)?.title as string ?? "Studio Artifact"
            }
            isExporting={isExporting}
            onExport={(format: ExportFormat, options: ExportMetadataOption) => {
              void (async () => {
                setIsExporting(true);
                try {
                  const apiFormat = format === "mushaf_pdf" ? "pdf" : format;
                  const blob = await moonClient.exportResearchArtifact({
                    artifactId: selectedArtifactId,
                    format: apiFormat,
                    options: {
                      includeAttributionStamps: options.includeSanadChain,
                      includeArabicScript: options.includeMorphologyAnalysis,
                      paperSize: "a4",
                    },
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `artifact-${selectedArtifactId}.${apiFormat === "pdf" ? "pdf" : apiFormat === "json" ? "json" : "md"}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setExportDialogOpen(false);
                } catch (exportErr) {
                  setLoadError(apiErrorMessage(exportErr, t));
                } finally {
                  setIsExporting(false);
                }
              })();
            }}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}