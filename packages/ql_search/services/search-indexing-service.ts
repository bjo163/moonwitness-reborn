import { createHash } from "node:crypto";
import type { UiLocale } from "@moonwitness/types";
import { readVerse, type PassageReadDto } from "ql_corpus/services/reader-service";
import {
  QlAccessError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
  type QlUserContext,
} from "ql_orm";
import { readRights } from "ql_source/services/source-service";

/**
 * Search Tokenizer and Indexing Service — MW-0604
 *
 * Normalizes text, extracts non-stopword tokens, and filters out private fields.
 */

const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "dan", "di", "ke", "dari", "ini", "itu", "yang", "pada", "adalah", "untuk", "dengan", "atau", "oleh"
]);
const CORPUS_INDEX_OWNER_ID = "system";
const MAX_TOKEN_LENGTH = 128;
const MAX_PASSAGES_PER_SURAH = 500;
const MAX_CORPUS_PASSAGES = 100_000;
const MAX_CORPUS_INDEX_ENTRIES = 250_000;
const MAX_QUERY_LENGTH = 4_000;
const MAX_QUERY_TOKENS = 20;
const MAX_INDEX_ROWS_PER_TOKEN = 500;
const MAX_SEARCH_CANDIDATES = 500;
const MAX_SEARCH_RESULTS = 100;

export interface GenerateIndexEntryOptions {
  includeSnippet?: boolean;
}

export interface CorpusIndexResult {
  editionKey: string;
  passageCount: number;
  indexEntryCount: number;
}

export interface CorpusSearchResult {
  passage: PassageReadDto;
  score: number;
}

export function tokenizeText(input: string): string[] {
  if (!input || typeof input !== "string") return [];
  const normalized = input
    .toLowerCase()
    .normalize("NFC")
    .replace(/\u0640/gu, "")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();

  const words = normalized.split(/\s+/).filter(Boolean);
  const tokens = new Set<string>();

  for (const word of words) {
    if (
      word.length >= 2 &&
      word.length <= MAX_TOKEN_LENGTH &&
      !STOPWORDS.has(word)
    ) {
      tokens.add(word);
    }
  }

  return Array.from(tokens);
}

export interface IndexableDocument {
  targetModel: string;
  targetId: string;
  fields: Record<string, unknown>;
  privateFieldNames?: string[];
  ownerId?: string;
}

export interface GeneratedIndexEntry {
  id: string;
  target_model: string;
  target_id: string;
  token: string;
  weight: number;
  snippet?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export function generateIndexEntries(
  doc: IndexableDocument,
  options: GenerateIndexEntryOptions = {},
): GeneratedIndexEntry[] {
  const privateSet = new Set(doc.privateFieldNames ?? []);
  const entries: GeneratedIndexEntry[] = [];
  const now = new Date().toISOString();
  const includeSnippet = options.includeSnippet !== false;

  let contextSnippet = "";
  for (const [key, value] of Object.entries(doc.fields)) {
    if (privateSet.has(key)) continue; // Privacy filter enforcement
    if (typeof value === "string") {
      if (includeSnippet && !contextSnippet && value.length > 10) {
        contextSnippet = value.slice(0, 150);
      }
      const tokens = tokenizeText(value);
      for (const token of tokens) {
        const hash = createHash("sha256")
          .update(`${doc.targetModel}:${doc.targetId}:${token}`)
          .digest("hex")
          .slice(0, 32);
        entries.push({
          id: `idx_${hash}`,
          target_model: doc.targetModel,
          target_id: doc.targetId,
          token,
          weight: key === "title" || key === "name" ? 3 : 1,
          ...(includeSnippet ? { snippet: contextSnippet } : {}),
          owner_id: doc.ownerId,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  return entries;
}

export function corpusLocaleForQuery(
  query: string,
  userLocale: UiLocale,
): "ar" | UiLocale {
  if (userLocale !== "id" && userLocale !== "en") {
    throw new QlValidationError("User interface locale must be 'id' or 'en'.");
  }
  if (/\p{Script=Arabic}/u.test(query)) return "ar";
  return userLocale;
}

export async function indexCorpusEdition(
  orm: QlOrm,
  actor: QlUserContext,
  editionKey: string,
): Promise<CorpusIndexResult> {
  if (!actor.groups.includes("admin")) {
    throw new QlAccessError("Only admins can reindex corpus search entries.");
  }
  if (
    !editionKey.trim() ||
    editionKey !== editionKey.trim() ||
    editionKey.length > 160
  ) {
    throw new QlValidationError(
      "Corpus search index requires a valid edition key.",
    );
  }
  const edition = await orm.findOneByService("corpus.edition", {
    edition_key: editionKey,
  });
  if (!edition) {
    throw new QlNotFoundError(`Corpus edition '${editionKey}' was not found.`);
  }
  if (edition.stage !== "published") {
    throw new QlAccessError("Only published corpus editions can be indexed.");
  }

  const locale = requiredString(edition, "locale", "corpus.edition");
  const authority = requiredString(edition, "authority", "corpus.edition");
  const expectedAuthority = locale === "ar" ? "revelation_verbatim" : "translation";
  if (
    (locale !== "ar" && locale !== "id" && locale !== "en") ||
    authority !== expectedAuthority
  ) {
    throw new QlValidationError(
      "Corpus search indexing supports Arabic revelation text and id/en translations only.",
    );
  }

  const sourceVersionId = requiredString(
    edition,
    "source_version_id",
    "corpus.edition",
  );
  const [displayRights, indexRights, transformRights] = await Promise.all([
    readRights(orm, sourceVersionId, "display"),
    readRights(orm, sourceVersionId, "index"),
    readRights(orm, sourceVersionId, "transform"),
  ]);
  if (!displayRights || displayRights.rights_status !== "cleared") {
    throw new QlAccessError(
      "Display rights are not cleared for this corpus edition.",
    );
  }
  if (!indexRights || indexRights.rights_status !== "cleared") {
    throw new QlAccessError(
      "Index rights are not cleared for this corpus edition.",
    );
  }
  if (!transformRights || transformRights.rights_status !== "cleared") {
    throw new QlAccessError(
      "Transform rights are not cleared for this corpus edition.",
    );
  }

  const editionId = requiredString(edition, "id", "corpus.edition");
  const pendingEntries: Array<{
    targetId: string;
    token: string;
    weight: number;
    editionKey: string;
    locale: string;
    surah: number;
    ayah: number;
  }> = [];
  let passageCount = 0;

  for (let surah = 1; surah <= 114; surah += 1) {
    const passages = await orm.findManyByService(
      "corpus.passage",
      {
        edition_id: editionId,
        authority,
        row_kind: "ayah",
        stage: "published",
        surah,
      },
      {
        limit: MAX_PASSAGES_PER_SURAH,
        orderBy: { field: "ordinal", direction: "asc" },
      },
    );
    if (passages.length === MAX_PASSAGES_PER_SURAH) {
      throw new QlValidationError(
        `Surah ${surah} exceeded the bounded passage scan.`,
      );
    }
    if (passageCount + passages.length > MAX_CORPUS_PASSAGES) {
      throw new QlValidationError(
        "Corpus search indexing exceeded the maximum passage scan.",
      );
    }
    passageCount += passages.length;

    for (const passage of passages) {
      const targetId = requiredString(passage, "id", "corpus.passage");
      const passageSurah = requiredNumber(passage, "surah", "corpus.passage");
      const ayah = requiredNumber(passage, "ayah", "corpus.passage");
      const generatedEntries = generateIndexEntries(
        {
          targetModel: "corpus.passage",
          targetId,
          fields: {
            text: requiredString(passage, "text", "corpus.passage"),
          },
        },
        { includeSnippet: false },
      );
      if (
        pendingEntries.length + generatedEntries.length >
        MAX_CORPUS_INDEX_ENTRIES
      ) {
        throw new QlValidationError(
          "Corpus search indexing exceeded the maximum index-entry count.",
        );
      }
      for (const entry of generatedEntries) {
        pendingEntries.push({
          targetId,
          token: entry.token,
          weight: entry.weight,
          editionKey,
          locale,
          surah: passageSurah,
          ayah,
        });
      }
    }
  }

  await orm.deleteRecordsForService("search.index_entry", {
    owner_id: CORPUS_INDEX_OWNER_ID,
    target_model: "corpus.passage",
    edition_key: editionKey,
  });
  for (const entry of pendingEntries) {
    await orm.createRecordForService("search.index_entry", {
      target_model: "corpus.passage",
      target_id: entry.targetId,
      token: entry.token,
      weight: entry.weight,
      owner_id: CORPUS_INDEX_OWNER_ID,
      edition_key: entry.editionKey,
      locale: entry.locale,
      surah: entry.surah,
      ayah: entry.ayah,
    });
  }

  return {
    editionKey,
    passageCount,
    indexEntryCount: pendingEntries.length,
  };
}

interface IndexedPassageCandidate {
  targetId: string;
  editionKey: string;
  locale: string;
  surah: number;
  ayah: number;
  score: number;
  matchedTokens: Set<string>;
}

export async function searchCorpusPassages(
  orm: QlOrm,
  query: string,
  userLocale: UiLocale,
  limit = 10,
): Promise<CorpusSearchResult[]> {
  if (query.length > MAX_QUERY_LENGTH) {
    throw new QlValidationError("Corpus search query is too long.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SEARCH_RESULTS) {
    throw new QlValidationError(
      `Corpus search limit must be an integer between 1 and ${MAX_SEARCH_RESULTS}.`,
    );
  }
  if (!query.trim()) return [];

  const locale = corpusLocaleForQuery(query, userLocale);
  const tokens = tokenizeText(query).slice(0, MAX_QUERY_TOKENS);
  if (tokens.length === 0) return [];

  const candidates = new Map<string, IndexedPassageCandidate>();
  for (const token of tokens) {
    const entries = await orm.findManyByService(
      "search.index_entry",
      {
        owner_id: CORPUS_INDEX_OWNER_ID,
        target_model: "corpus.passage",
        locale,
        token,
      },
      {
        limit: MAX_INDEX_ROWS_PER_TOKEN,
        orderBy: { field: "target_id", direction: "asc" },
      },
    );
    for (const entry of entries) {
      const targetId = requiredString(entry, "target_id", "search.index_entry");
      const editionKey = requiredString(
        entry,
        "edition_key",
        "search.index_entry",
      );
      const entryLocale = requiredString(entry, "locale", "search.index_entry");
      const surah = requiredNumber(entry, "surah", "search.index_entry");
      const ayah = requiredNumber(entry, "ayah", "search.index_entry");
      const weight = requiredNumber(entry, "weight", "search.index_entry");
      if (weight < 1) {
        throw new Error(
          `Search index entry '${targetId}' has a non-positive weight.`,
        );
      }
      const key = `${editionKey}|${targetId}`;
      const candidate = candidates.get(key);
      if (!candidate) {
        candidates.set(key, {
          targetId,
          editionKey,
          locale: entryLocale,
          surah,
          ayah,
          score: weight,
          matchedTokens: new Set([token]),
        });
        continue;
      }
      if (
        candidate.locale !== entryLocale ||
        candidate.surah !== surah ||
        candidate.ayah !== ayah
      ) {
        throw new Error(
          `Search index entry '${targetId}' has inconsistent passage metadata.`,
        );
      }
      if (!candidate.matchedTokens.has(token)) {
        candidate.score += weight;
        candidate.matchedTokens.add(token);
      }
    }
  }

  const rankedCandidates = [...candidates.values()].sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    if (left.matchedTokens.size !== right.matchedTokens.size) {
      return right.matchedTokens.size - left.matchedTokens.size;
    }
    if (left.editionKey !== right.editionKey) {
      return left.editionKey < right.editionKey ? -1 : 1;
    }
    if (left.surah !== right.surah) return left.surah - right.surah;
    if (left.ayah !== right.ayah) return left.ayah - right.ayah;
    if (left.targetId === right.targetId) return 0;
    return left.targetId < right.targetId ? -1 : 1;
  }).slice(0, MAX_SEARCH_CANDIDATES);

  const expectedAuthority =
    locale === "ar" ? "revelation_verbatim" : "translation";
  const results: CorpusSearchResult[] = [];
  const editionAccess = new Map<
    string,
    { editionId: string; hasIndexRights: boolean; hasTransformRights: boolean } | null
  >();
  for (const candidate of rankedCandidates) {
    let access = editionAccess.get(candidate.editionKey);
    if (access === undefined) {
      const edition = await orm.findOneByService("corpus.edition", {
        edition_key: candidate.editionKey,
      });
      if (!edition) {
        editionAccess.set(candidate.editionKey, null);
        continue;
      }
      const sourceVersionId = requiredString(
        edition,
        "source_version_id",
        "corpus.edition",
      );
      const [indexRights, transformRights] = await Promise.all([
        readRights(orm, sourceVersionId, "index"),
        readRights(orm, sourceVersionId, "transform"),
      ]);
      access = {
        editionId: requiredString(edition, "id", "corpus.edition"),
        hasIndexRights: indexRights?.rights_status === "cleared",
        hasTransformRights: transformRights?.rights_status === "cleared",
      };
      editionAccess.set(candidate.editionKey, access);
    }
    if (!access || !access.hasIndexRights || !access.hasTransformRights) {
      continue;
    }

    let passage: PassageReadDto;
    try {
      passage = await readVerse(
        orm,
        candidate.editionKey,
        candidate.surah,
        candidate.ayah,
      );
    } catch (error) {
      if (error instanceof QlAccessError || error instanceof QlNotFoundError) {
        continue;
      }
      throw error;
    }
    if (
      passage.id !== candidate.targetId ||
      passage.edition_id !== access.editionId ||
      passage.surah !== candidate.surah ||
      passage.ayah !== candidate.ayah ||
      passage.authority !== expectedAuthority ||
      passage.row_kind !== "ayah" ||
      passage.edition_locale !== locale ||
      passage.edition_authority !== expectedAuthority
    ) {
      continue;
    }
    results.push({ passage, score: candidate.score });
    if (results.length === limit) break;
  }
  return results;
}

function requiredString(record: QlRecord, key: string, model: string): string {
  const value = record[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`${model}.${key} must be a non-empty string.`);
  }
  return value;
}

function requiredNumber(record: QlRecord, key: string, model: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`${model}.${key} must be a safe integer.`);
  }
  return value;
}
