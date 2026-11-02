"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto,
  type SearchResultItemDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormField,
  Input,
  LoadingScreen,
  PageHeader,
  Select,
  SidebarTrigger,
  WorkspaceSidebar,
  WorkspaceTemplate,
  type SidebarNavItem,
} from "@moonwitness/ui";
import {
  Boxes,
  Database,
  KeyRound,
  LayoutDashboard,
  Languages,
  MessageSquare,
  Microscope,
  Plug,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  Workflow as WorkflowIcon,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { useMessages } from "../locale/messages";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

export default function SearchWorkspacePage() {
  const router = useRouter();
  const copy = useMessages();
  const { t } = useTranslationCatalog();
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [targetModel, setTargetModel] = useState("");
  const [results, setResults] = useState<SearchResultItemDto[]>([]);
  const [totalFound, setTotalFound] = useState<number | null>(null);

  const { locale, changeLocale, saving: localeSaving } =
    useLocalePreference(user ?? null);

  useEffect(() => {
    let active = true;
    void moonClient
      .currentUser()
      .then((data) => {
        if (!active) return;
        if (!data.user) {
          router.replace("/auth");
          return;
        }
        setUser(data.user);
        setLoading(false);
      })
      .catch((userError) => {
        if (!active) return;
        setError(apiErrorMessage(userError, t));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router, t]);

  async function handleSearch(event?: FormEvent) {
    if (event) event.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    try {
      const res = await moonClient.search({
        q: query.trim(),
        targetModel: targetModel || undefined,
        limit: 50,
      });
      setResults(res.results);
      setTotalFound(res.total);
    } catch (searchError) {
      setError(apiErrorMessage(searchError, t));
    } finally {
      setSearching(false);
    }
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
          navLabel="Search Intelligence"
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
              Search Intelligence
            </span>
          </div>
          <LocaleSwitcher
            locale={locale}
            label={copy.common.localeLabel}
            disabled={localeSaving}
            onChange={(nextLocale) => void changeLocale(nextLocale)}
          />
        </div>
      }
    >
      <div className="space-y-6 p-6">
        <PageHeader
          title={locale === "id" ? "Pusat Pencarian Cerdas" : "Smart Search Center"}
          description={
            locale === "id"
              ? "Telusuri narasi, pernyataan saksi, profil tokoh, instrumen hukum, dan konsep korpus ber-ACL aman."
              : "Search narratives, witness statements, profiles, legal instruments, and corpus concepts securely."
          }
          actions={
            <div className="flex items-center gap-2">
              <SidebarTrigger onClick={() => setSidebarOpen(true)} />
            </div>
          }
        />

        {error && <Alert variant="error">{error}</Alert>}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SearchIcon className="size-4 text-ink-muted" />
              <span>{locale === "id" ? "Parameter Pencarian" : "Search Parameters"}</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSearch(e)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <FormField
                    label={locale === "id" ? "Kata Kunci / Token" : "Keywords / Tokens"}
                    htmlFor="search-query"
                  >
                    <Input
                      id="search-query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={
                        locale === "id"
                          ? "Contoh: musa, firaun, narasi, keadilan..."
                          : "E.g. musa, pharaoh, narrative, justice..."
                      }
                      required
                    />
                  </FormField>
                </div>
                <div>
                  <FormField
                    label={locale === "id" ? "Target Model" : "Target Model"}
                    htmlFor="search-target-model"
                  >
                    <Select
                      id="search-target-model"
                      value={targetModel}
                      onChange={(e) => setTargetModel(e.target.value)}
                    >
                      <option value="">{locale === "id" ? "Semua Model" : "All Models"}</option>
                      <option value="story.narrative">story.narrative</option>
                      <option value="witness.statement">witness.statement</option>
                      <option value="event.record">event.record</option>
                      <option value="person.profile">person.profile</option>
                      <option value="law.instrument">law.instrument</option>
                      <option value="mizan.assessment">mizan.assessment</option>
                      <option value="corpus.concept">corpus.concept</option>
                    </Select>
                  </FormField>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={searching || !query.trim()}>
                  {searching
                    ? locale === "id" ? "Mencari..." : "Searching..."
                    : locale === "id" ? "Cari Entitas" : "Search Entities"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {totalFound !== null && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">
                {locale === "id" ? "Hasil Pencarian" : "Search Results"}
              </h2>
              <Badge variant="outline">
                {totalFound} {locale === "id" ? "ditemukan" : "found"}
              </Badge>
            </div>

            {results.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted">
                  {locale === "id"
                    ? "Tidak ada hasil yang cocok dengan kata kunci tersebut."
                    : "No matching results found for this query."}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {results.map((result) => (
                  <Card key={result.id}>
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{result.targetModel}</Badge>
                        <span className="text-xs text-muted">
                          Weight: {result.weight} | Token: {result.token}
                        </span>
                      </div>
                      <div className="font-medium text-ink">
                        Record ID: <span className="font-mono text-xs">{result.targetId}</span>
                      </div>
                      {result.snippet && (
                        <p className="text-sm text-muted">
                          {result.snippet}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </WorkspaceTemplate>
  );
}
