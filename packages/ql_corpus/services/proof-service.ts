import {
  QlAccessError,
  QlNotFoundError,
  type QlOrm,
  type QlRecord,
} from "ql_orm";
import { sha256 } from "./import-service.js";
import { readVerse, type PassageReadDto } from "./reader-service.js";

/**
 * Track 04 — verifiable ayah provenance.
 *
 * Two digests exist on purpose and must never be conflated:
 *
 * - the **authoritative digest** is `sha256(corpus.passage.text)`, the same
 *   canonicalisation the importer stamps into `corpus.passage.text_checksum`
 *   (`services/import-service.ts`). It is what a reader copies and what a
 *   verifier recomputes.
 * - an **anchor digest** is `sha256(canonical payload)` stored on
 *   `corpus.ayah_proof`. The payload carries the edition and locator, so the
 *   same verse in two editions cannot collide on the model's unique hash.
 *
 * Verification recomputes from the corpus row rather than trusting either
 * stored column, which is what makes a silent edit of the database detectable.
 */
export const CANONICAL_PAYLOAD_PREFIX = "V1";

export type AyahProofStatus =
  | "verified"
  | "tampered"
  | "edition_mismatch"
  | "not_found";

export interface VerifyAyahProofInput {
  surahNumber: number;
  ayahNumber: number;
  editionCode: string;
  claimedHash: string;
  claimedText?: string;
}

export interface AyahProofVerification {
  status: AyahProofStatus;
  isValid: boolean;
  surahNumber: number;
  ayahNumber: number;
  canonicalText: string;
  authoritativeHash: string;
  editionTitle: string;
  diffExplanation?: string;
}

export interface AyahProofSummary {
  surahNumber: number;
  ayahNumber: number;
  editionCode: string;
  editionTitle: string;
  canonicalText: string;
  authoritativeHash: string;
  anchored: boolean;
  anchorHash: string | null;
  verificationCount: number;
}

const SHA256_HEX = /^[0-9a-f]{64}$/i;

export function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && SHA256_HEX.test(value);
}

export function canonicalPayload(input: {
  editionCode: string;
  surahNumber: number;
  ayahNumber: number;
  text: string;
}): string {
  return [
    CANONICAL_PAYLOAD_PREFIX,
    `edition:${input.editionCode}`,
    `surah:${input.surahNumber}`,
    `ayah:${input.ayahNumber}`,
    `text:${input.text}`,
  ].join("|");
}

export function anchorDigest(input: {
  editionCode: string;
  surahNumber: number;
  ayahNumber: number;
  text: string;
}): string {
  return sha256(canonicalPayload(input));
}

function readString(row: QlRecord | null | undefined, key: string): string {
  return row === null || row === undefined || row[key] === undefined || row[key] === null
    ? ""
    : String(row[key]);
}

function readNumber(row: QlRecord | null | undefined, key: string): number {
  return row === null || row === undefined ? 0 : Number(row[key] ?? 0);
}

/**
 * Returns a description of an anchor that no longer agrees with itself or with
 * the corpus row, or `null` when the anchor is consistent.
 */
function describeAnchorDrift(
  anchor: QlRecord | null | undefined,
  live: { editionCode: string; surahNumber: number; ayahNumber: number; text: string },
): string | null {
  if (!anchor) return null;
  const storedHash = readString(anchor, "content_hash_sha256");
  const storedPayload = readString(anchor, "canonical_payload");
  if (sha256(storedPayload) !== storedHash) {
    return "The anchored proof record no longer hashes to its own stored digest.";
  }
  const expectedPayload = canonicalPayload(live);
  if (storedPayload !== expectedPayload) {
    const anchoredText = storedPayload.startsWith(`${CANONICAL_PAYLOAD_PREFIX}|`)
      ? storedPayload.slice(storedPayload.indexOf("|text:") + "|text:".length)
      : "";
    return anchoredText === live.text
      ? "The anchored proof was written for a different edition or locator than the verse being verified."
      : "The corpus text changed after this verse was anchored.";
  }
  return null;
}

async function findMatchingPublishedEdition(
  orm: QlOrm,
  input: { surahNumber: number; ayahNumber: number; claimedHash: string; excludeEditionKey: string },
): Promise<string | null> {
  const editions = await orm.findManyByService(
    "corpus.edition",
    { stage: "published" },
    { limit: 200, orderBy: { field: "edition_key", direction: "asc" } },
  );
  for (const edition of editions) {
    const editionKey = readString(edition, "edition_key");
    if (!editionKey || editionKey === input.excludeEditionKey) continue;
    try {
      const other = await readVerse(
        orm,
        editionKey,
        input.surahNumber,
        input.ayahNumber,
      );
      if (sha256(other.text) === input.claimedHash) {
        return readString(edition, "attribution_text") || editionKey;
      }
    } catch (error) {
      // A published edition that lacks this locator, or whose display rights
      // are not cleared, is simply not a match candidate. Rights-blocked rows
      // are skipped rather than named: reporting "your digest belongs to
      // edition X" for an edition the caller may not read would leak it.
      // Neither case may abort the verification of the requested edition.
      if (error instanceof QlNotFoundError || error instanceof QlAccessError) {
        continue;
      }
      throw error;
    }
  }
  return null;
}

export async function readAyahProofSummary(
  orm: QlOrm,
  editionCode: string,
  surahNumber: number,
  ayahNumber: number,
): Promise<AyahProofSummary> {
  const passage = await readVerse(orm, editionCode, surahNumber, ayahNumber);
  const anchor = await orm.findOneByService("corpus.ayah_proof", {
    edition_code: editionCode,
    surah_number: surahNumber,
    ayah_number: ayahNumber,
  });
  return {
    surahNumber,
    ayahNumber,
    editionCode,
    editionTitle: passage.edition_attribution_text || editionCode,
    canonicalText: passage.text,
    authoritativeHash: sha256(passage.text),
    anchored: anchor !== undefined,
    anchorHash: anchor ? readString(anchor, "content_hash_sha256") : null,
    verificationCount: readNumber(anchor, "verification_count"),
  };
}

export async function verifyAyahProof(
  orm: QlOrm,
  input: VerifyAyahProofInput,
): Promise<AyahProofVerification> {
  const base = {
    surahNumber: input.surahNumber,
    ayahNumber: input.ayahNumber,
    editionTitle: input.editionCode,
  };

  let passage: PassageReadDto;
  try {
    passage = await readVerse(orm, input.editionCode, input.surahNumber, input.ayahNumber);
  } catch (error) {
    if (error instanceof QlNotFoundError) {
      return {
        ...base,
        status: "not_found",
        isValid: false,
        canonicalText: "",
        authoritativeHash: "",
        diffExplanation: `No verse ${input.surahNumber}:${input.ayahNumber} is published in edition '${input.editionCode}'.`,
      };
    }
    throw error;
  }

  const authoritativeHash = sha256(passage.text);
  const editionTitle = passage.edition_attribution_text || input.editionCode;
  const claimedHash = input.claimedHash.toLowerCase();
  const anchor = await orm.findOneByService("corpus.ayah_proof", {
    edition_code: input.editionCode,
    surah_number: input.surahNumber,
    ayah_number: input.ayahNumber,
  });
  const anchorDrift = describeAnchorDrift(anchor ?? null, {
    editionCode: input.editionCode,
    surahNumber: input.surahNumber,
    ayahNumber: input.ayahNumber,
    text: passage.text,
  });

  const result = {
    ...base,
    editionTitle,
    canonicalText: passage.text,
    authoritativeHash,
  };

  const submittedTextHash =
    input.claimedText === undefined ? null : sha256(input.claimedText);
  const hashClaimMatches = claimedHash === authoritativeHash;
  const submittedTextMatches = submittedTextHash === authoritativeHash;

  if (!hashClaimMatches) {
    if (submittedTextMatches) {
      return {
        ...result,
        status: "tampered",
        isValid: false,
        diffExplanation:
          "The submitted text is the canonical text of this edition, but the digest it was paired with is not the canonical digest.",
      };
    }
    const otherEdition = await findMatchingPublishedEdition(orm, {
      surahNumber: input.surahNumber,
      ayahNumber: input.ayahNumber,
      claimedHash,
      excludeEditionKey: input.editionCode,
    });
    if (otherEdition !== null) {
      return {
        ...result,
        status: "edition_mismatch",
        isValid: false,
        diffExplanation: `The claimed digest matches this locator in edition '${otherEdition}', not in '${input.editionCode}'.`,
      };
    }
    return {
      ...result,
      status: "tampered",
      isValid: false,
      diffExplanation: anchorDrift === null
        ? "The claimed digest does not match the digest recomputed from the published text."
        : `The claimed digest does not match the digest recomputed from the published text, and ${anchorDrift.toLowerCase()}`,
    };
  }

  if (submittedTextHash !== null && !submittedTextMatches) {
    return {
      ...result,
      status: "tampered",
      isValid: false,
      diffExplanation:
        "The claimed digest matches the published text, but the submitted text does not hash to that digest.",
    };
  }

  if (anchorDrift !== null) {
    return {
      ...result,
      status: "tampered",
      isValid: false,
      diffExplanation: `${anchorDrift} The verse text still matches the claimed digest, so the corpus row is intact but its proof record is not.`,
    };
  }

  return { ...result, status: "verified", isValid: true };
}
