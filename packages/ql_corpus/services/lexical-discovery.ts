import { createHash } from "node:crypto";
import {
  QlAccessError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
} from "ql_orm";
import { readRights } from "ql_source/services/source-service";

export const ARABIC_NORMALIZATION_VERSION =
  "arabic-nfc-remove-tashkeel-tatweel-v1";
export const LEXICAL_EXTRACTION_VERSION = "arabic-token-frequency-v1";

const SURAH_COUNT = 114;
const MAX_EDITIONS_PER_QUERY = 3;
const MAX_ROWS_PER_SURAH = 500;
const MAX_TOTAL_PASSAGES = 100_000;
const MAX_UNIQUE_TERMS = 50_000;
const STORED_REFERENCES_PER_TERM = 80;

interface SourceReference {
  surah: number;
  ayah: number;
  passageId: string;
  checksum: string;
}

interface CandidateAggregate {
  id: string;
  candidateText: string;
  normalizedForm: string;
  editionKey: string;
  sourceVersionId: string;
  occurrenceCount: number;
  referenceCount: number;
  seenReferences: Set<string>;
  references: SourceReference[];
}

function normalizeArabicToken(token: string): string {
  return token
    .normalize("NFC")
    .replace(/\u0640/gu, "")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{Script=Arabic}]/gu, "")
    .replace(/[^\p{L}]/gu, "")
    .normalize("NFC");
}

function visibleSurfaceForm(token: string): string {
  return token
    .normalize("NFC")
    .replace(/\u0640/gu, "")
    .replace(/[^\p{Script=Arabic}\p{M}]/gu, "")
    .normalize("NFC");
}

function requiredString(record: QlRecord, field: string, model: string): string {
  const value = record[field];
  if (typeof value !== "string" || !value) {
    throw new Error(`${model}.${field} must be a non-empty string.`);
  }
  return value;
}

function requiredNumber(record: QlRecord, field: string, model: string): number {
  const value = record[field];
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`${model}.${field} must be a safe integer.`);
  }
  return value;
}

function createCandidate(
  input: {
    normalizedForm: string;
    editionId: string;
    editionKey: string;
    sourceVersionId: string;
    surfaceForm: string;
  },
): CandidateAggregate {
  const key = [
    input.editionId,
    input.sourceVersionId,
    LEXICAL_EXTRACTION_VERSION,
    ARABIC_NORMALIZATION_VERSION,
    input.normalizedForm,
  ].join("|");
  return {
    id: createHash("sha256").update(key, "utf8").digest("hex"),
    candidateText: input.surfaceForm || input.normalizedForm,
    normalizedForm: input.normalizedForm,
    editionKey: input.editionKey,
    sourceVersionId: input.sourceVersionId,
    occurrenceCount: 0,
    referenceCount: 0,
    seenReferences: new Set<string>(),
    references: [],
  };
}

function addPassageTokens(
  passage: QlRecord,
  edition: { id: string; key: string; versionId: string },
  aggregates: Map<string, CandidateAggregate>,
): void {
  const text = requiredString(passage, "text", "corpus.passage");
  const surah = requiredNumber(passage, "surah", "corpus.passage");
  const ayah = requiredNumber(passage, "ayah", "corpus.passage");
  const passageId = requiredString(passage, "id", "corpus.passage");
  const checksum = requiredString(passage, "text_checksum", "corpus.passage");
  const verse = `${surah}:${ayah}`;

  for (const token of text.split(/\s+/u)) {
    const normalizedForm = normalizeArabicToken(token);
    if (!normalizedForm) continue;
    const key = `${edition.id}|${normalizedForm}`;
    let aggregate = aggregates.get(key);
    if (!aggregate) {
      if (aggregates.size >= MAX_UNIQUE_TERMS) {
        throw new QlValidationError(
          "Lexical discovery exceeded the maximum unique-term count.",
        );
      }
      aggregate = createCandidate(
        {
          normalizedForm,
          editionId: edition.id,
          editionKey: edition.key,
          sourceVersionId: edition.versionId,
          surfaceForm: visibleSurfaceForm(token),
        },
      );
      aggregates.set(key, aggregate);
    }

    aggregate.occurrenceCount += 1;
    const surfaceForm = visibleSurfaceForm(token) || normalizedForm;
    if (surfaceForm < aggregate.candidateText) {
      aggregate.candidateText = surfaceForm;
    }
    if (!aggregate.seenReferences.has(verse)) {
      aggregate.seenReferences.add(verse);
      aggregate.referenceCount += 1;
      if (aggregate.references.length < STORED_REFERENCES_PER_TERM) {
        aggregate.references.push({ surah, ayah, passageId, checksum });
      }
    }
  }
}

async function scanEdition(
  orm: QlOrm,
  edition: QlRecord,
  aggregates: Map<string, CandidateAggregate>,
  maximumPassages: number,
): Promise<number> {
  const source = {
    id: requiredString(edition, "id", "corpus.edition"),
    key: requiredString(edition, "edition_key", "corpus.edition"),
    versionId: requiredString(edition, "source_version_id", "corpus.edition"),
  };
  let scannedPassages = 0;
  for (let surah = 1; surah <= SURAH_COUNT; surah += 1) {
    const passages = await orm.findManyByService(
      "corpus.passage",
      {
        edition_id: source.id,
        authority: "revelation_verbatim",
        row_kind: "ayah",
        stage: "published",
        surah,
      },
      {
        limit: MAX_ROWS_PER_SURAH,
        orderBy: { field: "ordinal", direction: "asc" },
      },
    );
    if (passages.length === MAX_ROWS_PER_SURAH) {
      throw new QlValidationError(
        `Surah ${surah} exceeded the bounded passage scan.`,
      );
    }
    if (scannedPassages + passages.length > maximumPassages) {
      throw new QlValidationError(
        "Lexical discovery exceeded the maximum passage scan.",
      );
    }
    scannedPassages += passages.length;
    for (const passage of passages) {
      addPassageTokens(passage, source, aggregates);
    }
  }
  return scannedPassages;
}

async function getEligibleEditions(
  orm: QlOrm,
  editionKey: string | undefined,
): Promise<QlRecord[]> {
  const editions = await orm.findManyByService(
    "corpus.edition",
    {
      authority: "revelation_verbatim",
      locale: "ar",
      stage: "published",
      ...(editionKey === undefined ? {} : { edition_key: editionKey }),
    },
    { limit: MAX_EDITIONS_PER_QUERY + 1 },
  );
  if (editionKey !== undefined && editions.length === 0) {
    throw new QlNotFoundError(
      `Published Arabic Quran edition '${editionKey}' was not found.`,
    );
  }
  if (editionKey === undefined && editions.length > MAX_EDITIONS_PER_QUERY) {
    throw new QlValidationError(
      "Select an edition when more than three published Arabic editions are available.",
    );
  }

  const eligibleEditions: QlRecord[] = [];
  for (const edition of editions) {
    const versionId = requiredString(
      edition,
      "source_version_id",
      "corpus.edition",
    );
    const rights = await readRights(orm, versionId, "transform");
    if (rights !== null && rights.rights_status === "cleared") {
      eligibleEditions.push(edition);
    } else if (editionKey !== undefined) {
      throw new QlAccessError(
        "Transform rights are not cleared for this corpus edition.",
      );
    }
  }
  if (eligibleEditions.length === 0) {
    throw new QlAccessError(
      "No published Arabic corpus edition has cleared transform rights.",
    );
  }
  return eligibleEditions;
}

function compareCandidates(
  left: CandidateAggregate,
  right: CandidateAggregate,
): number {
  if (left.occurrenceCount !== right.occurrenceCount) {
    return right.occurrenceCount - left.occurrenceCount;
  }
  if (left.normalizedForm !== right.normalizedForm) {
    return left.normalizedForm < right.normalizedForm ? -1 : 1;
  }
  if (left.editionKey === right.editionKey) return 0;
  return left.editionKey < right.editionKey ? -1 : 1;
}

function toComputedRecord(candidate: CandidateAggregate): QlRecord {
  return {
    id: candidate.id,
    candidate_text: candidate.candidateText,
    normalized_form: candidate.normalizedForm,
    occurrence_count: candidate.occurrenceCount,
    verse_reference_count: candidate.referenceCount,
    source_edition: candidate.editionKey,
    source_version_id: candidate.sourceVersionId,
    source_references: JSON.stringify(candidate.references),
    normalization_version: ARABIC_NORMALIZATION_VERSION,
    algorithm_version: LEXICAL_EXTRACTION_VERSION,
  };
}

export async function discoverArabicLexicalCandidates(
  orm: QlOrm,
  editionKey: string | undefined,
  limit: number,
  normalizedForm?: string,
): Promise<QlRecord[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new QlValidationError(
      "Lexical discovery limit must be an integer between 1 and 100.",
    );
  }
  if (editionKey !== undefined && editionKey.trim().length === 0) {
    throw new QlValidationError("edition_key must not be empty.");
  }
  if (normalizedForm !== undefined && normalizedForm.trim().length === 0) {
    throw new QlValidationError("normalized_form must not be empty.");
  }

  const eligibleEditions = await getEligibleEditions(orm, editionKey);
  const aggregates = new Map<string, CandidateAggregate>();
  let scannedPassages = 0;
  for (const edition of eligibleEditions) {
    scannedPassages += await scanEdition(
      orm,
      edition,
      aggregates,
      MAX_TOTAL_PASSAGES - scannedPassages,
    );
  }
  return [...aggregates.values()]
    .filter(
      (candidate) =>
        normalizedForm === undefined ||
        candidate.normalizedForm === normalizedForm,
    )
    .sort(compareCandidates)
    .slice(0, limit)
    .map(toComputedRecord);
}
