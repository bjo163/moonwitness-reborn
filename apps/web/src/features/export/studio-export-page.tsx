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
  FormField,
  LoadingScreen,
  PageHeader,
  Select,
  SidebarTrigger,
  Textarea,
  WorkspaceSidebar,
  WorkspaceTemplate,
  type SidebarNavItem,
} from "@moonwitness/ui";
import {
  Boxes,
  Database,
  Download,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { useMessages } from "../locale/messages";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

export default function StudioExportPage() {
  const router = useRouter();
  const copy = useMessages();
  const { t } = useTranslationCatalog();
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [artifacts, setArtifacts] = useState<ModelRecordDto[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState("");
  const [compiledMarkdown, setCompiledMarkdown] = useState("");

  const { locale, changeLocale, saving: localeSaving } =
    useLocalePreference(user ?? null);

  useEffect(() => {
    let active = true;
    async function loadArtifacts() {
      try {
        const currentUserData = await moonClient.currentUser();
        if (!active) return;
        if (!currentUserData.user) {
          router.replace("/auth");
          return;
        }
        setUser(currentUserData.user);

        const res = await moonClient
          .listModelRecords("studio.artifact")
          .catch(() => ({ records: [] }));

        if (!active) return;
        setArtifacts(res.records);
        if (res.records.length > 0) {
          setSelectedArtifactId(String(res.records[0].id));
          compileArtifact(res.records[0]);
        }
        setLoading(false);
      } catch (loadError) {
        if (!active) return;
        setError(apiErrorMessage(loadError, t));
        setLoading(false);
      }
    }

    void loadArtifacts();
    return () => {
      active = false;
    };
  }, [router, t]);

  function compileArtifact(artifact: ModelRecordDto) {
    const title = String(artifact.values.title ?? "Untitled Artifact");
    const kind = String(artifact.values.artifact_kind ?? "document");
    const content = String(artifact.values.content ?? "");
    const stage = String(artifact.values.stage ?? "draft");

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

  function handleDownload() {
    const blob = new Blob([compiledMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `moonwitness-artifact-${selectedArtifactId || "export"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

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
    },
    {
      href: "/command-center/export",
      label: locale === "id" ? "Ekspor Studio" : "Studio Exporter",
      icon: <FileText className="size-4" />,
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
      label: copy.corpus.navTitle,
      icon: <BookOpen className="size-4" />,
    },
    ...(isReviewer
      ? [
          {
            href: "/research",
            label: copy.research.navTitle,
            icon: <Microscope className="size-4" />,
          },
        ]
      : []),
    ...(isWorkflowAuditor
      ? [
          {
            href: "/workflow",
            label: copy.workflow.navTitle,
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
            label: copy.i18n.navTitle,
            icon: <Languages className="size-4" />,
          },
        ]
      : []),
  ];

  return (
    <WorkspaceTemplate
      sidebar={
        <WorkspaceSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          brandTitle="MoonWitness"
          brandSubtitle="Studio Exporter"
          brandBadge="v0.3.0"
          items={sidebarNavItems}
          accountSection={{
            userName: user?.name ?? "User",
            userRole: user?.role ?? "Member",
            accountLabel: copy.common.account,
            logoutLabel: copy.common.logout,
            onLogout: () => void logout(),
          }}
          footerSection={
            <div className="space-y-2 border-t border-hairline p-3">
              <LocaleSwitcher
                locale={locale}
                label={copy.common.localeLabel}
                saving={localeSaving}
                onChange={changeLocale}
              />
            </div>
          }
        />
      }
    >
      <div className="space-y-6 p-6">
        <PageHeader
          title={locale === "id" ? "Ekspor & Kompilasi Studio" : "Studio Artifact Exporter"}
          description={
            locale === "id"
              ? "Kompilasi artefak draf kreatif studio menjadi dokumen Markdown dengan metadata dan sitasi."
              : "Compile creative studio artifacts into structured Markdown documents with citations."
          }
          actions={
            <div className="flex items-center gap-2">
              <SidebarTrigger onClick={() => setSidebarOpen(true)} />
            </div>
          }
        />

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <Card>
              <CardHeader>
                <span>{locale === "id" ? "Pilih Artefak Studio" : "Select Studio Artifact"}</span>
              </CardHeader>
              <CardContent className="space-y-4">
                {artifacts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted">
                    {locale === "id"
                      ? "Belum ada artefak studio terdaftar di model studio.artifact."
                      : "No studio artifacts found in studio.artifact model."}
                  </div>
                ) : (
                  <FormField
                    label={locale === "id" ? "Daftar Artefak" : "Artifact List"}
                    htmlFor="select-artifact"
                  >
                    <Select
                      id="select-artifact"
                      value={selectedArtifactId}
                      onChange={(e) => handleSelect(e.target.value)}
                    >
                      {artifacts.map((a) => (
                        <option key={String(a.id)} value={String(a.id)}>
                          {String(a.values.title ?? a.id)} ({String(a.values.stage ?? "draft")})
                        </option>
                      ))}
                    </Select>
                  </FormField>
                )}
                <Button
                  onClick={handleDownload}
                  disabled={!compiledMarkdown || artifacts.length === 0}
                  className="w-full"
                >
                  <Download className="mr-2 size-4" />
                  {locale === "id" ? "Unduh Markdown" : "Download Markdown"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span>{locale === "id" ? "Pratinjau Kompilasi" : "Compiled Preview"}</span>
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
      </div>
    </WorkspaceTemplate>
  );
}
