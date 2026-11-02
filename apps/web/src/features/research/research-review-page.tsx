"use client";

import {
  moonClient,
  MoonClientError,
  type AuthUserDto,
  type LexicalResearchDecisionDto,
  type LexicalResearchReviewQueueItemDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  FormField,
  LoadingScreen,
  PageHeader,
  Select,
  Textarea,
  SidebarTrigger,
  WorkspaceSidebar,
  WorkspaceTemplate,
  QuranicMorphologyVisualizer,
} from "@moonwitness/ui";
import {
  Boxes,
  BookOpen,
  Microscope,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { LocaleSwitcher } from "../locale/locale-switcher";
import { useMessages } from "../locale/messages";
import { useTranslationCatalog } from "../locale/translation-catalog";
import { useLocalePreference } from "../locale/use-locale-preference";

interface QueueTableRow extends Record<string, string | number | boolean | null> {
  id: string;
  candidate: string;
  normalized: string;
  occurrences: number;
  verses: number;
  review: string;
}

const REVIEW_DECISIONS: readonly LexicalResearchDecisionDto[] = [
  "retain_for_research",
  "exclude_from_research",
  "needs_expert_review",
];

function isReviewDecision(value: string): value is LexicalResearchDecisionDto {
  return REVIEW_DECISIONS.some((decision) => decision === value);
}

export default function ResearchReviewPage() {
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
  const research = copy.research;
  const { t } = useTranslationCatalog();
  const [user, setUser] = useState<AuthUserDto | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [editionsLoading, setEditionsLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editions, setEditions] = useState<
    Awaited<ReturnType<typeof moonClient.listCorpusEditions>>["editions"]
  >([]);
  const [editionKey, setEditionKey] = useState("");
  const [queue, setQueue] = useState<LexicalResearchReviewQueueItemDto[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [decision, setDecision] =
    useState<LexicalResearchDecisionDto>("needs_expert_review");
  const [rationale, setRationale] = useState("");
  const { locale, changeLocale, saving: localeSaving } =
    useLocalePreference(user ?? null);

  const isReviewer = useMemo(
    () =>
      user?.groups.some(
        (group) => group === "admin" || group === "operator",
      ) ?? false,
    [user],
  );
  const selected = queue.find(({ candidate }) => candidate.id === selectedId);
  const tableRows: QueueTableRow[] = queue.map(({ candidate, review }) => ({
    id: candidate.id,
    candidate: candidate.candidate_text,
    normalized: candidate.normalized_form,
    occurrences: candidate.occurrence_count,
    verses: candidate.verse_reference_count,
    review: review
      ? research.decisions[review.decision]
      : research.unreviewed,
  }));

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
    if (!user || !isReviewer) return;
    let cancelled = false;
    setEditionsLoading(true);
    void moonClient
      .listCorpusEditions()
      .then(({ editions: available }) => {
        if (cancelled) return;
        const arabicTextEditions = available.filter(
          (edition) =>
            edition.authority === "revelation_verbatim" &&
            edition.locale.toLowerCase().startsWith("ar"),
        );
        setEditions(arabicTextEditions);
        setEditionKey(
          (current) => current || arabicTextEditions[0]?.edition_key || "",
        );
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(apiErrorMessage(requestError, t));
      })
      .finally(() => {
        if (!cancelled) setEditionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isReviewer, t, user]);

  useEffect(() => {
    if (!user || !isReviewer || !editionKey) return;
    let cancelled = false;
    setQueueLoading(true);
    setError(null);
    void moonClient
      .listLexicalResearchCandidates(editionKey)
      .then(({ candidates }) => {
        if (cancelled) return;
        setQueue(candidates);
        setSelectedId((current) =>
          candidates.some(({ candidate }) => candidate.id === current)
            ? current
            : "",
        );
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setQueue([]);
          setError(apiErrorMessage(requestError, t));
        }
      })
      .finally(() => {
        if (!cancelled) setQueueLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editionKey, isReviewer, t, user]);

  function selectCandidate(item: LexicalResearchReviewQueueItemDto) {
    setSelectedId(item.candidate.id);
    setDecision(item.review?.decision ?? "needs_expert_review");
    setRationale("");
    setNotice(null);
    setError(null);
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await moonClient.createLexicalResearchReview(selected.candidate.id, {
        edition_key: editionKey,
        normalized_form: selected.candidate.normalized_form,
        decision,
        rationale,
      });
      setNotice(research.saved);
      setRationale("");
      try {
        const refreshed =
          await moonClient.listLexicalResearchCandidates(editionKey);
        setQueue(refreshed.candidates);
      } catch (refreshError) {
        setError(apiErrorMessage(refreshError, t));
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError, t));
    } finally {
      setSaving(false);
    }
  }

  if (loading || user === undefined) {
    return <LoadingScreen label={copy.common.loading} />;
  }

  if (!user) {
    return <LoadingScreen error={error ?? t("web.errors.authentication")} />;
  }

  return (
    <WorkspaceTemplate
      sidebarOpen={sidebarOpen}
      onCloseSidebar={() => setSidebarOpen(false)}
      closeLabel={copy.common.closeMenu}
      sidebar={
        <WorkspaceSidebar
          brandIcon={<Microscope aria-hidden="true" size={16} />}
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
              label: t("web.dashboard.corpusTitle"),
              icon: <BookOpen aria-hidden="true" size={16} />,
              onSelect: () => setSidebarOpen(false),
            },
            {
              href: "/research",
              label: research.navLabel,
              icon: <Microscope aria-hidden="true" size={16} />,
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
            <span className="text-sm font-medium text-ink-soft">
              {research.title}
            </span>
          </div>
          <LocaleSwitcher
            locale={locale}
            label={copy.common.localeLabel}
            onChange={(nextLocale) => void changeLocale(nextLocale)}
            disabled={localeSaving}
          />
        </>
      }
    >
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
          <PageHeader
            description={research.description}
            title={research.title}
          />

          <Alert variant="info" className="mt-6">
            {research.researchDisclaimer}
          </Alert>

          {!isReviewer && (
            <Alert variant="error" className="mt-6">
              {research.reviewerRequired}
            </Alert>
          )}
          {error && (
            <Alert variant="error" className="mt-6">
              {error}
            </Alert>
          )}
          {notice && (
            <Alert variant="info" className="mt-6">
              {notice}
            </Alert>
          )}

          {isReviewer && (
            <>
              <section className="mt-8 max-w-2xl">
                <FormField label={research.edition} htmlFor="research-edition">
                  <Select
                    id="research-edition"
                    value={editionKey}
                    disabled={editions.length === 0 || queueLoading || saving}
                    onChange={(event) => {
                      setEditionKey(event.target.value);
                      setSelectedId("");
                    }}
                  >
                    {editions.map((edition) => (
                      <option
                        key={edition.id}
                        value={edition.edition_key}
                      >
                        {edition.edition_key}
                      </option>
                    ))}
                  </Select>
                </FormField>
                {editions.length === 0 && (
                  <p className="mt-2 text-sm text-muted">
                    {editionsLoading
                      ? research.loadingEditions
                      : research.noEditions}
                  </p>
                )}
              </section>

              <section className="mt-6">
                <DataTable<QueueTableRow>
                  columns={[
                    { key: "candidate", label: research.candidate },
                    { key: "normalized", label: research.normalizedForm },
                    { key: "occurrences", label: research.occurrenceCount },
                    { key: "verses", label: research.verseCount },
                    { key: "review", label: research.reviewStatus },
                  ]}
                  rows={tableRows}
                  rowKey="id"
                  actionsLabel={copy.common.actions}
                  yesLabel={copy.common.yes}
                  noLabel={copy.common.no}
                  onRowClick={(row) => {
                    const item = queue.find(
                      ({ candidate }) => candidate.id === row.id,
                    );
                    if (item) selectCandidate(item);
                  }}
                  emptyMessage={
                    queueLoading
                      ? research.loadingCandidates
                      : research.emptyCandidates
                  }
                />
              </section>

              {selected && (
                <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <Card>
                    <CardHeader>{research.evidenceReferences}</CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <div className="text-sm text-muted">
                          {research.candidate}
                        </div>
                        <p
                          className="mt-2 text-2xl text-ink"
                          dir="rtl"
                          lang="ar"
                        >
                          {selected.candidate.candidate_text}
                        </p>
                      </div>
                      <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-muted">
                            {research.normalizedForm}
                          </dt>
                          <dd className="mt-1 break-all text-ink">
                            {selected.candidate.normalized_form}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">
                            {research.occurrenceCount}
                          </dt>
                          <dd className="mt-1 text-ink">
                            {selected.candidate.occurrence_count}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">
                            {research.sourceVersion}
                          </dt>
                          <dd className="mt-1 break-all text-ink">
                            {selected.candidate.source_version_id}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">
                            {research.algorithmVersion}
                          </dt>
                          <dd className="mt-1 break-all text-ink">
                            {selected.candidate.algorithm_version}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">
                            {research.normalizationVersion}
                          </dt>
                          <dd className="mt-1 break-all text-ink">
                            {selected.candidate.normalization_version}
                          </dd>
                        </div>
                      </dl>
                      <div>
                        <h3 className="text-sm font-semibold text-ink">
                          {research.evidenceReferences}
                        </h3>
                        {selected.candidate.source_references.length === 0 ? (
                          <p className="mt-2 text-sm text-muted">
                            {research.emptyCandidates}
                          </p>
                        ) : (
                          <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto">
                            {selected.candidate.source_references.map(
                              (reference) => (
                                <li
                                  key={reference.passageId}
                                  className="rounded-lg border border-hairline p-3 text-xs"
                                >
                                  <div className="font-medium text-ink">
                                    {research.verseCount}: {reference.surah}:
                                    {reference.ayah}
                                  </div>
                                  <div className="mt-1 break-all text-muted">
                                    {research.referenceId}: {reference.passageId}
                                  </div>
                                  <div className="mt-1 break-all text-muted">
                                    {research.checksum}: {reference.checksum}
                                  </div>
                                </li>
                              ),
                            )}
                          </ul>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>{research.reviewStatus}</CardHeader>
                    <CardContent className="space-y-4">
                      {selected.review ? (
                        <Badge variant="outline">
                          {research.decisions[selected.review.decision]}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{research.unreviewed}</Badge>
                      )}
                      <form className="space-y-4" onSubmit={(event) => void submitReview(event)}>
                        <FormField label={research.decision} htmlFor="research-decision">
                          <Select
                            id="research-decision"
                            value={decision}
                            onChange={(event) => {
                              if (isReviewDecision(event.target.value)) {
                                setDecision(event.target.value);
                              }
                            }}
                          >
                            {REVIEW_DECISIONS.map((item) => (
                              <option key={item} value={item}>
                                {research.decisions[item]}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                        <FormField
                          label={research.rationale}
                          htmlFor="research-rationale"
                        >
                          <Textarea
                            id="research-rationale"
                            required
                            maxLength={4000}
                            rows={5}
                            value={rationale}
                            placeholder={research.rationalePlaceholder}
                            onChange={(event) =>
                              setRationale(event.target.value)
                            }
                          />
                        </FormField>
                        <Button type="submit" disabled={saving || !rationale.trim()}>
                          {saving ? research.saving : research.submitReview}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2">
                    <QuranicMorphologyVisualizer
                      surahNumber={selected.candidate.source_references[0]?.surah ?? 1}
                      ayahNumber={selected.candidate.source_references[0]?.ayah ?? 1}
                      segments={[
                        {
                          id: selected.candidate.id,
                          wordIndex: 1,
                          segmentIndex: 1,
                          arabicText: selected.candidate.candidate_text,
                          transliteration: selected.candidate.normalized_form,
                          pos: "noun",
                          posTag: "N",
                          grammaticalCase: "marfu",
                          caseExplanation: "Nominated subject / default form in lexical candidate view.",
                        },
                      ]}
                    />
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </WorkspaceTemplate>
  );
}
