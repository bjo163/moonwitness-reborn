import assert from "node:assert/strict";
import { test } from "node:test";
import type { ChatCitationDto } from "@moonwitness/moonclient";
import {
  assistantEvidenceFor,
  citationReaderHref,
} from "./assistant-evidence";

const citation: ChatCitationDto = {
  evidenceId: "passage-1",
  editionId: "edition-1",
  editionKey: "translation-en",
  authority: "translation",
  editionAuthority: "translation",
  locale: "en",
  publisher: "Publisher",
  attribution: "Translator attribution",
  locator: "2:255",
  surah: 2,
  ayah: 255,
};

void test("grounded messages expose their citations", () => {
  assert.deepEqual(
    assistantEvidenceFor({ groundingStatus: "grounded", citations: [citation] }),
    { status: "grounded", citations: [citation], unverifiedCitations: [] },
  );
  assert.deepEqual(assistantEvidenceFor({ groundingStatus: "grounded" }), {
    status: "grounded",
    citations: [],
    unverifiedCitations: [],
  });
});

void test("insufficient and legacy messages never expose citations", () => {
  assert.deepEqual(
    assistantEvidenceFor({
      groundingStatus: "insufficient_evidence",
      citations: [citation],
    }),
    { status: "insufficient_evidence", citations: [], unverifiedCitations: [] },
  );
  assert.deepEqual(
    assistantEvidenceFor({ groundingStatus: "legacy", citations: [citation] }),
    { status: "legacy", citations: [], unverifiedCitations: [] },
  );
  assert.deepEqual(assistantEvidenceFor({ citations: [citation] }), {
    status: "legacy",
    citations: [],
    unverifiedCitations: [],
  });
});

void test("citation links target the existing corpus reader route", () => {
  assert.equal(
    citationReaderHref({ editionKey: "english edition", surah: 2 }),
    "/corpus/english%20edition/2",
  );
});
