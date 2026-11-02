"use client";

import {
  moonClient,
  type SemanticGraphConceptsResponseDto,
  type SemanticGraphNodeDto,
  type SemanticGraphResponseDto,
} from "@moonwitness/moonclient";
import {
  Alert,
  Button,
  EmptyState,
  FormField,
  SanctuaryHeader,
  SemanticCrossSurahGraph,
  Select,
} from "@moonwitness/ui";
import { ArrowLeft, Network } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiErrorMessage } from "../locale/api-error-message";
import { useTranslationCatalog } from "../locale/translation-catalog";

/**
 * Track 03 — the cross-surah thematic graph, drawn from its own models.
 *
 * Every node and edge on this screen is a row of `search.thematic_node` /
 * `search.semantic_edge` served by `GET /search/graph/*`. Nothing here is
 * derived from array positions: node radius scales with the record's
 * `passage_count`, edge thickness with its `weight`, and the citations in the
 * table come from the edge's `evidence_payload`. An unpopulated graph renders
 * as an empty graph and says so, because an invented relation between verses
 * would be a factual claim about revelation, not a design detail.
 */
export default function SemanticGraphPage() {
  const { t, locale } = useTranslationCatalog();
  const router = useRouter();

  const [concepts, setConcepts] = useState<SemanticGraphNodeDto[]>([]);
  const [conceptsLoading, setConceptsLoading] = useState(true);
  const [conceptsError, setConceptsError] = useState<string | null>(null);

  const [conceptSlug, setConceptSlug] = useState("");
  const [graph, setGraph] = useState<SemanticGraphResponseDto | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setConceptsLoading(true);
    void moonClient
      .listSemanticGraphConcepts()
      .then((response: SemanticGraphConceptsResponseDto) => {
        if (cancelled) return;
        setConcepts(response.concepts);
        setConceptsError(null);
        setConceptSlug((current) =>
          current || (response.concepts[0]?.slug ?? ""),
        );
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        setConcepts([]);
        setConceptsError(apiErrorMessage(requestError, t));
      })
      .finally(() => {
        if (!cancelled) setConceptsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!conceptSlug) return;
    let cancelled = false;
    setGraphLoading(true);
    setGraphError(null);
    void moonClient
      .getSemanticGraph(conceptSlug)
      .then((response) => {
        if (!cancelled) setGraph(response);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        setGraph(null);
        setGraphError(apiErrorMessage(requestError, t));
      })
      .finally(() => {
        if (!cancelled) setGraphLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conceptSlug, t]);

  const nodeTitle = (node: SemanticGraphNodeDto) =>
    locale === "id" ? node.titleId : node.titleEn;

  return (
    <main className="ql-hud-app relative min-h-dvh bg-panel-deep text-ink-soft">
      <SanctuaryHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span>MoonWitness · Corpus</span>
            <span>&middot;</span>
            <span>{t("web.corpus.graphViewTab")}</span>
          </span>
        }
        title={t("web.corpus.semanticGraphTitle")}
        description={t("web.corpus.semanticGraphDescription")}
      />

      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-12 space-y-6">
        <Link
          href="/corpus"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-acid"
        >
          <ArrowLeft aria-hidden="true" size={14} />
          <span>{t("web.corpus.backToShelf")}</span>
        </Link>

        {conceptsError !== null && <Alert variant="error">{conceptsError}</Alert>}
        {graphError !== null && <Alert variant="error">{graphError}</Alert>}

        <FormField
          label={t("web.corpus.conceptSelectLabel")}
          htmlFor="graph-concept"
        >
          <Select
            id="graph-concept"
            value={conceptSlug}
            onChange={(event) => {
              setConceptSlug(event.target.value);
              setGraph(null);
            }}
            disabled={conceptsLoading || concepts.length === 0}
          >
            <option value="">
              {conceptsLoading
                ? t("web.corpus.loadingConcepts")
                : t("web.corpus.noConceptsTitle")}
            </option>
            {concepts.map((concept) => (
              <option key={concept.id} value={concept.slug}>
                {nodeTitle(concept)}
              </option>
            ))}
          </Select>
        </FormField>

        {conceptsLoading && (
          <p role="status" className="text-sm text-muted">
            {t("web.corpus.loadingConcepts")}
          </p>
        )}

        {!conceptsLoading && concepts.length === 0 && conceptsError === null && (
          <EmptyState
            icon={<Network size={28} aria-hidden="true" />}
            title={t("web.corpus.noConceptsTitle")}
            description={t("web.corpus.noConceptsBody")}
            action={
              <Button
                variant="secondary"
                onClick={() => router.push("/models")}
              >
                {t("web.common.models")}
              </Button>
            }
          />
        )}

        {graphLoading && (
          <p role="status" className="text-sm text-muted">
            {t("web.corpus.loadingGraph")}
          </p>
        )}

        {graph !== null && !graphLoading && (
          <div className="space-y-4">
            {graph.unresolvedEndpointCount > 0 && (
              <Alert variant="info">
                {t("web.corpus.unresolvedEdgesWarning", {
                  count: graph.unresolvedEndpointCount,
                })}
              </Alert>
            )}

            <SemanticCrossSurahGraph
              nodes={graph.nodes.map((node) => ({
                id: node.slug,
                label: nodeTitle(node),
                category: node.category,
                weight: node.passageCount,
              }))}
              edges={graph.edges.map((edge) => ({
                id: edge.id,
                sourceId: edge.sourceSlug,
                targetId: edge.targetSlug,
                relationType: edge.relationType,
                weight: edge.weight,
                evidencePassages: edge.evidencePassages,
              }))}
              initialConceptId={graph.conceptSlug}
              summaryLabel={t("web.graph.summary", {
                nodes: graph.nodes.length,
                edges: graph.edges.length,
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
            />
          </div>
        )}
      </div>
    </main>
  );
}
