"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto as AuthUser,
  type CorpusEditionDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  EmptyState,
  LoadingScreen,
  SanctuaryHeader,
  SectionGrid,
  SidebarTrigger,
  WorkspaceSidebar,
  WorkspaceTemplate,
} from "@moonwitness/ui";
import { Boxes, BookOpen, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { useMessages } from "../locale/messages";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

/**
 * Corpus shelf — one card per published edition. Every card surfaces its
 * `authority` (revelation_verbatim / translation) and `attribution_text`
 * because MW-ADR-019 forbids rendering text without its kind and attribution;
 * the response DTO carries both non-optionally, so this screen has no way to
 * accidentally hide them either.
 *
 * Editions whose display rights are not cleared never appear in the API
 * response at all (see `packages/ql_corpus/services/reader-service.ts`), so
 * nothing here is CSS-hidden — the deny is server-side.
 */
interface EditionRow extends Record<string, string> {
  id: string;
  edition_key: string;
  canonical_id: string;
  authority: CorpusEditionDto["authority"];
  authority_label: string;
  locale: string;
  publisher: string;
  attribution_text: string;
  stage_label: string;
}

function authorityLabel(
  authority: CorpusEditionDto["authority"],
  locale: string,
  t: ReturnType<typeof useTranslationCatalog>["t"],
): string {
  if (authority === "revelation_verbatim") {
    return t("web.corpus.authorityVerbatim", { locale });
  }
  if (authority === "translation") {
    return t("web.corpus.authorityTranslation", { locale });
  }
  return t("web.corpus.authorityAttributed", { authority });
}

function stageLabel(
  stage: string,
  t: ReturnType<typeof useTranslationCatalog>["t"],
): string {
  if (stage === "draft") return t("web.corpus.stageDraft");
  if (stage === "accepted") return t("web.corpus.stageAccepted");
  if (stage === "published") return t("web.corpus.stagePublished");
  return t("web.corpus.stageOther", { stage });
}

export default function CorpusShelf() {
  const router = useRouter();

  async function logout() {
    setError(null);
    try {
      await moonClient.logout();
      router.replace("/auth");
    } catch (logoutError) {
      setError(apiErrorMessage(logoutError, t));
    }
  }
  const copy = useMessages();
  const { t } = useTranslationCatalog();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  useLocalePreference(user ?? null);
  const shelfLabel = t("web.corpus.shelfTitle");
  const [loading, setLoading] = useState(true);
  const [shelfLoading, setShelfLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editions, setEditions] = useState<CorpusEditionDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    void moonClient
      .currentUser()
      .then(({ user: currentUser }) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        if (
          requestError instanceof MoonClientError &&
          requestError.status === 401
        ) {
          router.replace("/auth");
          return;
        }
        setError(apiErrorMessage(requestError, t));
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, t]);

  useEffect(() => {
    if (!user) return;
    setShelfLoading(true);
    setError(null);
    void moonClient
      .listCorpusEditions()
      .then((response) => setEditions(response.editions))
      .catch((requestError: unknown) => {
        setError(apiErrorMessage(requestError, t));
      })
      .finally(() => setShelfLoading(false));
  }, [t, user]);

  if (loading || user === undefined) {
    return <LoadingScreen label={copy.common.loading} />;
  }

  if (!user) {
    return <LoadingScreen error={error ?? t("web.errors.authentication")} />;
  }

  const rows: EditionRow[] = editions.map((edition) => ({
    id: edition.id,
    edition_key: edition.edition_key,
    canonical_id: edition.canonical_id,
    authority: edition.authority,
    authority_label: authorityLabel(edition.authority, edition.locale, t),
    locale: edition.locale,
    publisher: edition.publisher,
    attribution_text: edition.attribution_text,
    stage_label: stageLabel(edition.stage, t),
  }));

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={copy.common.closeMenu}
      sidebar={
        <WorkspaceSidebar
          brandIcon={<BookOpen aria-hidden="true" size={16} />}
          closeLabel={copy.common.closeMenu}
          identity={{ name: user.name, subtitle: user.email }}
          items={[
            {
              href: "/command-center",
              label: copy.common.dashboard,
              icon: <ShieldCheck aria-hidden="true" size={16} />,
              onSelect: () => setSidebarOpen(false),
            },
            {
              href: "/models",
              label: copy.common.models,
              icon: <Boxes aria-hidden="true" size={16} />,
              onSelect: () => setSidebarOpen(false),
            },
            {
              href: "/corpus",
              label: shelfLabel,
              icon: <BookOpen aria-hidden="true" size={16} />,
              active: true,
              onSelect: () => setSidebarOpen(false),
            },
          ]}
          logout={{
            label: copy.common.logout,
            onLogout: () => void logout(),
          }}
          navLabel={copy.common.mainNavigation}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      }
      header={
        <>
          <div className="flex items-center gap-2">
            <SidebarTrigger
              label={copy.common.openMenu}
              onOpenSidebar={() => setSidebarOpen(true)}
              sidebarOpen={sidebarOpen}
            />
            <span className="text-sm font-medium text-ink-soft">{shelfLabel}</span>
          </div>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto">
        <SanctuaryHeader
          eyebrow="MoonWitness · Corpus"
          title={shelfLabel}
          description={t("web.corpus.shelfDescription")}
        />
        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
          {error && (
            <Alert variant="error" className="mt-6">
              {error}
            </Alert>
          )}

          {shelfLoading ? (
            <p role="status" className="mt-6 text-sm text-muted">
              {t("web.corpus.loadingEditions")}
            </p>
          ) : rows.length === 0 ? (
            <EmptyState
              className="mt-6"
              title={t("web.corpus.noEditions")}
            />
          ) : (
            <section className="mt-6 space-y-6">
              <DataTable<EditionRow>
                columns={[
                  { key: "authority_label", label: t("web.corpus.authority") },
                  { key: "publisher", label: t("web.corpus.publisher") },
                  { key: "attribution_text", label: t("web.corpus.attribution") },
                  { key: "stage_label", label: t("web.corpus.stage") },
                ]}
                rows={rows}
                rowKey="id"
                emptyMessage={t("web.corpus.emptyShelf")}
                actionsLabel={copy.common.actions}
                yesLabel={copy.common.yes}
                noLabel={copy.common.no}
                onRowClick={(row) => {
                  router.push(`/corpus/${encodeURIComponent(row.edition_key)}/1`);
                }}
              />
              <SectionGrid gap={4}>
                {rows.map((row) => (
                  <Card key={row.id}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            row.authority === "revelation_verbatim"
                              ? "live"
                              : "outline"
                          }
                        >
                          {row.authority_label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-ink-soft">{row.attribution_text}</p>
                      <p className="mt-2 text-xs text-muted">
                        {t("web.corpus.publisher")}: {row.publisher}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </SectionGrid>
            </section>
          )}
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
