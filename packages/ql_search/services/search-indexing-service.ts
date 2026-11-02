import { createHash } from "node:crypto";

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

export function tokenizeText(input: string): string[] {
  if (!input || typeof input !== "string") return [];
  const normalized = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();

  const words = normalized.split(/\s+/).filter(Boolean);
  const tokens = new Set<string>();

  for (const word of words) {
    if (word.length >= 2 && !STOPWORDS.has(word)) {
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

export function generateIndexEntries(doc: IndexableDocument): GeneratedIndexEntry[] {
  const privateSet = new Set(doc.privateFieldNames ?? []);
  const entries: GeneratedIndexEntry[] = [];
  const now = new Date().toISOString();

  let contextSnippet = "";
  for (const [key, value] of Object.entries(doc.fields)) {
    if (privateSet.has(key)) continue; // Privacy filter enforcement
    if (typeof value === "string") {
      if (!contextSnippet && value.length > 10) {
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
          snippet: contextSnippet,
          owner_id: doc.ownerId,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  return entries;
}
