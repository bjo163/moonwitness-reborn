import { createHash } from "node:crypto";
import {
  QlAccessError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
  type QlUserContext,
} from "ql_orm";
import {
  LEXICAL_REVIEW_DECISIONS,
} from "../models/research_lexical_review.js";

const REVIEWER_GROUPS = ["admin", "operator"] as const;
const MAX_REVIEW_QUEUE = 100;
const MAX_REVIEW_HISTORY = 500;

export interface LexicalReviewSubmission {
  editionKey: string;
  normalizedForm: string;
  decision: unknown;
  rationale: unknown;
}

export interface LexicalReviewQueueItem {
  candidate: QlRecord;
  review: QlRecord | null;
}

function assertReviewer(user: QlUserContext): void {
  if (!user.groups.some((group) => REVIEWER_GROUPS.includes(group as "admin" | "operator"))) {
    throw new QlAccessError(
      "Lexical research review requires the admin or operator group.",
    );
  }
}

function requiredCandidateString(candidate: QlRecord, key: string): string {
  const value = candidate[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Computed lexical candidate is missing '${key}'.`);
  }
  return value;
}

function reviewSnapshotKey(record: QlRecord): string {
  return [
    record.candidate_id,
    record.source_version_id,
    record.algorithm_version,
    record.normalization_version,
  ].join("|");
}

function candidateSnapshotKey(candidate: QlRecord): string {
  return [
    candidate.id,
    candidate.source_version_id,
    candidate.algorithm_version,
    candidate.normalization_version,
  ].join("|");
}

async function computeCandidate(
  input: {
    orm: QlOrm;
    user: QlUserContext;
    editionKey: string;
    normalizedForm: string;
    candidateId?: string;
  },
): Promise<QlRecord> {
  const candidates = await input.orm.queryComputedModel(
    "corpus.lexical_candidate",
    input.user,
    {
      filters: {
        edition_key: input.editionKey,
        normalized_form: input.normalizedForm,
      },
      limit: MAX_REVIEW_QUEUE,
    },
  );
  const candidate = candidates.find(
    (record) =>
      typeof record.id === "string" &&
      (input.candidateId === undefined || record.id === input.candidateId),
  );
  if (candidate === undefined) {
    throw new QlNotFoundError(
      "The lexical candidate is no longer available in the requested source snapshot.",
    );
  }
  return candidate;
}

export async function listLexicalCandidateReviewQueue(
  orm: QlOrm,
  user: QlUserContext,
  editionKey: string,
): Promise<LexicalReviewQueueItem[]> {
  assertReviewer(user);
  if (!editionKey.trim() || editionKey.length > 160) {
    throw new QlValidationError("edition_key must contain 1 to 160 characters.");
  }
  const candidates = await orm.queryComputedModel(
    "corpus.lexical_candidate",
    user,
    {
      filters: { edition_key: editionKey },
      limit: MAX_REVIEW_QUEUE,
    },
  );
  const reviews = await orm.findManyByService(
    "research.lexical_review",
    { edition_key: editionKey },
    {
      limit: MAX_REVIEW_HISTORY,
      orderBy: { field: "reviewed_at", direction: "desc" },
    },
  );
  if (reviews.length === MAX_REVIEW_HISTORY) {
    throw new QlValidationError(
      "Research review history reached the 500-record safety limit; use a narrower review scope.",
    );
  }
  const latest = new Map<string, QlRecord>();
  for (const review of reviews) {
    const key = reviewSnapshotKey(review);
    if (!latest.has(key)) latest.set(key, review);
  }
  return candidates.map((candidate) => ({
    candidate,
    review: latest.get(candidateSnapshotKey(candidate)) ?? null,
  }));
}

export async function recordLexicalCandidateReview(
  orm: QlOrm,
  user: QlUserContext,
  candidateId: string,
  submission: LexicalReviewSubmission,
): Promise<QlRecord> {
  assertReviewer(user);
  if (!/^[a-f0-9]{64}$/u.test(candidateId)) {
    throw new QlValidationError("candidate_id must be a SHA-256 identifier.");
  }
  if (
    typeof submission.editionKey !== "string" ||
    !submission.editionKey.trim() ||
    submission.editionKey.length > 160
  ) {
    throw new QlValidationError("edition_key must contain 1 to 160 characters.");
  }
  if (
    typeof submission.normalizedForm !== "string" ||
    !submission.normalizedForm.trim() ||
    submission.normalizedForm.length > 128
  ) {
    throw new QlValidationError(
      "normalized_form must contain 1 to 128 characters.",
    );
  }
  if (
    typeof submission.decision !== "string" ||
    !LEXICAL_REVIEW_DECISIONS.some((decision) => decision === submission.decision)
  ) {
    throw new QlValidationError(
      `decision must be one of ${LEXICAL_REVIEW_DECISIONS.join(", ")}.`,
    );
  }
  if (
    typeof submission.rationale !== "string" ||
    !submission.rationale.trim() ||
    submission.rationale.trim().length > 4000
  ) {
    throw new QlValidationError(
      "rationale must contain 1 to 4000 characters.",
    );
  }

  const candidate = await computeCandidate({
    orm,
    user,
    editionKey: submission.editionKey,
    normalizedForm: submission.normalizedForm,
    candidateId,
  });
  const sourceReferences = requiredCandidateString(candidate, "source_references");
  let parsedReferences: unknown;
  try {
    parsedReferences = JSON.parse(sourceReferences) as unknown;
  } catch (error) {
    throw new Error("Computed lexical candidate has invalid source references.", {
      cause: error,
    });
  }
  if (!Array.isArray(parsedReferences)) {
    throw new Error("Computed lexical candidate references must be an array.");
  }

  const record = await orm.createRecordForService("research.lexical_review", {
    candidate_id: requiredCandidateString(candidate, "id"),
    edition_key: submission.editionKey,
    source_version_id: requiredCandidateString(candidate, "source_version_id"),
    normalization_version: requiredCandidateString(
      candidate,
      "normalization_version",
    ),
    algorithm_version: requiredCandidateString(candidate, "algorithm_version"),
    occurrence_count: candidate.occurrence_count,
    verse_reference_count: candidate.verse_reference_count,
    source_references: sourceReferences,
    source_reference_digest: createHash("sha256")
      .update(sourceReferences, "utf8")
      .digest("hex"),
    decision: submission.decision,
    rationale: submission.rationale.trim(),
    reviewer_id: user.id,
    reviewed_at: new Date(),
  });
  return record;
}
