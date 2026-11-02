import { SURAHS } from "ql_corpus/services/corpus-vocabulary";
import {
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
  type QlUserContext,
} from "ql_orm";

/**
 * Track 03 — read path for the cross-surah thematic graph.
 *
 * `search.thematic_node` and `search.semantic_edge` are curated reference
 * data written by operators through the view-driven `/models` workspace; this
 * service only reads. That asymmetry is the point: nothing here invents a
 * relation, a weight, or a verse citation. A graph rendered from empty tables
 * is an honest empty graph, and the screen says so.
 *
 * Two integrity rules are enforced while reading rather than trusted from
 * storage, because a religious citation that cannot exist is worse than no
 * citation at all:
 *
 *   - every evidence locator must be a real verse (`surah` 1..114 with an
 *     `ayah` inside that surah's verse count), and
 *   - every edge endpoint must resolve to a declared node. An edge that does
 *     not is counted in `unresolvedEndpointCount` and left out of the layout —
 *     it is never silently dropped and never papered over with a synthetic node.
 */

const MAX_NODES_PER_SCAN = 500;
const MAX_EDGES_PER_SCAN = 500;
const MAX_EVIDENCE_PER_EDGE = 200;
const SLUG_MAX_LENGTH = 64;

export const thematicNodeCategories = [
  "concept",
  "surah",
  "prophet_narrative",
  "legal_ruling",
] as const;
export type ThematicNodeCategory = (typeof thematicNodeCategories)[number];

export const semanticRelationTypes = [
  "chronological",
  "thematic_echo",
  "contrast",
  "elaboration",
] as const;
export type SemanticRelationType = (typeof semanticRelationTypes)[number];

export interface ThematicConceptDto {
  id: string;
  slug: string;
  titleId: string;
  titleEn: string;
  category: ThematicNodeCategory;
  passageCount: number;
}

export interface GraphEvidenceLocator {
  surah: number;
  ayah: number;
}

export interface ThematicEdgeDto {
  id: string;
  sourceSlug: string;
  targetSlug: string;
  relationType: SemanticRelationType;
  weight: number;
  evidencePassages: GraphEvidenceLocator[];
}

export interface ConceptGraphDto {
  conceptSlug: string;
  nodes: ThematicConceptDto[];
  edges: ThematicEdgeDto[];
  totalEdges: number;
  unresolvedEndpointCount: number;
}

export function assertConceptSlug(slug: string): string {
  if (
    !slug.trim() ||
    slug !== slug.trim() ||
    slug.length > SLUG_MAX_LENGTH ||
    !/^[a-z0-9][a-z0-9_-]*$/.test(slug)
  ) {
    throw new QlValidationError(
      `A thematic concept slug must be a lowercase identifier of at most ${SLUG_MAX_LENGTH} characters.`,
    );
  }
  return slug;
}

function requiredString(record: QlRecord, key: string, model: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new QlValidationError(`${model}.${key} must be a non-empty string.`);
  }
  return value;
}

function requiredInteger(
  record: QlRecord,
  key: string,
  model: string,
): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new QlValidationError(`${model}.${key} must be a safe integer.`);
  }
  return value;
}

function categoryOf(value: string): ThematicNodeCategory {
  if (!(thematicNodeCategories as readonly string[]).includes(value)) {
    throw new QlValidationError(
      `search.thematic_node.category holds '${value}', which is not a declared category.`,
    );
  }
  return value as ThematicNodeCategory;
}

function relationOf(value: string): SemanticRelationType {
  if (!(semanticRelationTypes as readonly string[]).includes(value)) {
    throw new QlValidationError(
      `search.semantic_edge.relation_type holds '${value}', which is not a declared relation.`,
    );
  }
  return value as SemanticRelationType;
}

function toConcept(record: QlRecord): ThematicConceptDto {
  return {
    id: requiredString(record, "id", "search.thematic_node"),
    slug: requiredString(record, "slug", "search.thematic_node"),
    titleId: requiredString(record, "title_id", "search.thematic_node"),
    titleEn: requiredString(record, "title_en", "search.thematic_node"),
    category: categoryOf(
      requiredString(record, "category", "search.thematic_node"),
    ),
    passageCount: requiredInteger(
      record,
      "passage_count",
      "search.thematic_node",
    ),
  };
}

function assertEvidenceLocator(locator: GraphEvidenceLocator, edgeId: string): void {
  const surah = SURAHS.find((entry) => entry.number === locator.surah);
  if (!surah || locator.ayah < 1 || locator.ayah > surah.ayahCount) {
    throw new QlValidationError(
      `Edge '${edgeId}' cites verse ${locator.surah}:${locator.ayah}, which is not an addressable verse.`,
    );
  }
}

/**
 * `evidence_payload` is a JSON array of `{"surah": N, "ayah": N}` objects —
 * the canonical shape operators author through `/models`. A malformed payload
 * fails the request instead of degrading into an empty evidence list, because
 * an edge that quietly loses its citations looks exactly like an edge that was
 * never cited.
 */
export function parseEvidencePayload(
  raw: string,
  edgeId: string,
): GraphEvidenceLocator[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new QlValidationError(
      `Edge '${edgeId}' has an 'evidence_payload' that is not valid JSON.`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new QlValidationError(
      `Edge '${edgeId}' has an 'evidence_payload' that is not a JSON array.`,
    );
  }
  if (parsed.length > MAX_EVIDENCE_PER_EDGE) {
    throw new QlValidationError(
      `Edge '${edgeId}' exceeds the ${MAX_EVIDENCE_PER_EDGE}-citation evidence bound.`,
    );
  }
  const locators = parsed.map((entry): GraphEvidenceLocator => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !Number.isInteger((entry as { surah?: unknown }).surah) ||
      !Number.isInteger((entry as { ayah?: unknown }).ayah)
    ) {
      throw new QlValidationError(
        `Edge '${edgeId}' has an evidence entry without integer 'surah' and 'ayah'.`,
      );
    }
    const locator = {
      surah: (entry as { surah: number }).surah,
      ayah: (entry as { ayah: number }).ayah,
    };
    assertEvidenceLocator(locator, edgeId);
    return locator;
  });
  return locators.sort(
    (left, right) => left.surah - right.surah || left.ayah - right.ayah,
  );
}

function toEdge(record: QlRecord): ThematicEdgeDto {
  const id = requiredString(record, "id", "search.semantic_edge");
  return {
    id,
    sourceSlug: requiredString(
      record,
      "source_node_slug",
      "search.semantic_edge",
    ),
    targetSlug: requiredString(
      record,
      "target_node_slug",
      "search.semantic_edge",
    ),
    relationType: relationOf(
      requiredString(record, "relation_type", "search.semantic_edge"),
    ),
    weight: requiredInteger(record, "weight", "search.semantic_edge"),
    evidencePassages: parseEvidencePayload(
      typeof record.evidence_payload === "string" ? record.evidence_payload : "",
      id,
    ),
  };
}

function bySlug(left: ThematicConceptDto, right: ThematicConceptDto): number {
  if (left.slug === right.slug) return 0;
  return left.slug < right.slug ? -1 : 1;
}

async function scanNodes(
  orm: QlOrm,
  actor: QlUserContext,
): Promise<ThematicConceptDto[]> {
  const rows = await orm.findMany("search.thematic_node", actor, {
    limit: MAX_NODES_PER_SCAN,
  });
  if (rows.length === MAX_NODES_PER_SCAN) {
    throw new QlValidationError(
      `The thematic node scan reached its ${MAX_NODES_PER_SCAN}-row bound; raise it deliberately.`,
    );
  }
  return rows.map(toConcept).sort(bySlug);
}

async function scanEdges(
  orm: QlOrm,
  actor: QlUserContext,
): Promise<ThematicEdgeDto[]> {
  const rows = await orm.findMany("search.semantic_edge", actor, {
    limit: MAX_EDGES_PER_SCAN,
  });
  if (rows.length === MAX_EDGES_PER_SCAN) {
    throw new QlValidationError(
      `The semantic edge scan reached its ${MAX_EDGES_PER_SCAN}-row bound; raise it deliberately.`,
    );
  }
  return rows
    .map(toEdge)
    .sort(
      (left, right) =>
        left.sourceSlug.localeCompare(right.sourceSlug) ||
        left.targetSlug.localeCompare(right.targetSlug) ||
        left.id.localeCompare(right.id),
    );
}

/** Every declared concept, for the picker that opens the graph. */
export async function listThematicConcepts(
  orm: QlOrm,
  actor: QlUserContext,
): Promise<ThematicConceptDto[]> {
  return scanNodes(orm, actor);
}

/**
 * The one-hop neighbourhood of a concept: the concept itself, the edges that
 * touch it, and only the declared nodes those edges reach.
 */
export async function readConceptGraph(
  orm: QlOrm,
  actor: QlUserContext,
  conceptSlug: string,
): Promise<ConceptGraphDto> {
  const slug = assertConceptSlug(conceptSlug);
  const [nodes, edges] = await Promise.all([
    scanNodes(orm, actor),
    scanEdges(orm, actor),
  ]);
  const nodeBySlug = new Map(nodes.map((node) => [node.slug, node]));
  const concept = nodeBySlug.get(slug);
  if (!concept) {
    throw new QlNotFoundError(
      `No thematic concept '${slug}' is registered in search.thematic_node.`,
    );
  }

  const touching = edges.filter(
    (edge) => edge.sourceSlug === slug || edge.targetSlug === slug,
  );
  const included = new Map<string, ThematicConceptDto>([[slug, concept]]);
  let unresolvedEndpointCount = 0;
  const kept: ThematicEdgeDto[] = [];
  for (const edge of touching) {
    const source = nodeBySlug.get(edge.sourceSlug);
    const target = nodeBySlug.get(edge.targetSlug);
    if (!source || !target) {
      unresolvedEndpointCount += 1;
      continue;
    }
    included.set(source.slug, source);
    included.set(target.slug, target);
    kept.push(edge);
  }

  return {
    conceptSlug: slug,
    nodes: [...included.values()].sort(bySlug),
    edges: kept,
    totalEdges: touching.length,
    unresolvedEndpointCount,
  };
}
