import type { QlViewDefinition } from "ql_orm";

/**
 * `ql_corpus` view definitions.
 *
 * No `form` view is registered for `corpus.passage` or `corpus.annotation`:
 * those tables are written exclusively by the offline importer, and the
 * view-driven `/models` workspace therefore must not offer Add / Edit /
 * Delete controls for them (`packages/ui/src/components/data-table.tsx`
 * reads the `permissions` block on the metadata DTO — see
 * `apps/api/src/http/server.ts:950-983`). `corpus.work` and `corpus.edition`
 * expose list views so a curator can browse the registry; editability there
 * is deliberately limited to a small allow-list of non-authoritative fields.
 *
 * Every form view also omits `stage`: transitioning a corpus row between
 * `staged` and `published` requires the operator publish action, gated on
 * `source.rights.rights_status === "cleared"`.
 */
export const views: QlViewDefinition[] = [
  {
    name: "corpus.work.list",
    model: "corpus.work",
    type: "list",
    fields: ["canonical_id", "title", "work_kind", "primary_locale", "updated_at"],
  },
  {
    name: "corpus.work.form",
    model: "corpus.work",
    type: "form",
    fields: ["canonical_id", "title", "work_kind", "primary_locale", "description"],
  },
  {
    name: "corpus.edition.list",
    model: "corpus.edition",
    type: "list",
    fields: [
      "canonical_id",
      "work_id",
      "authority",
      "locale",
      "publisher",
      "author_or_translator",
      "attribution_text",
      "stage",
      "imported_row_count",
      "updated_at",
    ],
  },
  {
    // `stage` intentionally excluded from the form fields list —
    // `services/corpus-service.ts` is the only writer, gated on rights.
    name: "corpus.edition.form",
    model: "corpus.edition",
    type: "form",
    fields: [
      "canonical_id",
      "work_id",
      "source_version_id",
      "rights_id",
      "edition_key",
      "authority",
      "locale",
      "publisher",
      "author_or_translator",
      "attribution_text",
      "revision",
      "imported_row_count",
    ],
  },
  {
    name: "corpus.edition.landing",
    model: "corpus.edition",
    type: "landing",
    fields: ["canonical_id", "authority", "locale", "publisher", "stage"],
    landing: {
      section: "knowledge",
      sequence: 10,
      href: "/corpus",
      status: "available",
      titleKey: "web.landing.views.corpus_edition.title",
      descriptionKey: "web.landing.views.corpus_edition.description",
      publicCountFilter: { stage: "published" },
    },
  },
  {
    name: "corpus.passage.list",
    model: "corpus.passage",
    type: "list",
    fields: [
      "locator",
      "surah",
      "ayah",
      "authority",
      "row_kind",
      "edition_kind_denorm",
      "ordinal",
      "stage",
      "updated_at",
    ],
  },
  {
    name: "corpus.annotation.list",
    model: "corpus.annotation",
    type: "list",
    fields: [
      "canonical_id",
      "authority",
      "quoted_passage_id",
      "annotator",
      "school_or_tradition",
      "locale",
      "locator",
      "stage",
      "updated_at",
    ],
  },
  {
    // No form view on purpose: `content_hash_sha256` has to equal
    // `sha256(canonical_payload)` and both have to derive from the published
    // text. A hand-typed row is exactly the drift `verifyAyahProof` reports as
    // `tampered`, so anchors are written only by a path that computes both.
    name: "corpus.ayah_proof.list",
    model: "corpus.ayah_proof",
    type: "list",
    fields: [
      "passage_id",
      "edition_code",
      "surah_number",
      "ayah_number",
      "content_hash_sha256",
      "verification_count",
      "created_at",
    ],
  },
  {
    // Track 05. A reciter is authorable metadata — name, style, licence — and
    // the licence column is why the form exists at all: an attribution has to
    // be recorded next to the voice it covers.
    name: "corpus.reciter.list",
    model: "corpus.reciter",
    type: "list",
    fields: [
      "slug",
      "name_translit",
      "name_arabic",
      "recitation_style",
      "license_type",
      "is_active",
      "updated_at",
    ],
  },
  {
    // `audio_base_url` is deliberately absent from the form: the read path
    // addresses clips through `corpus.audio_segment.audio_file_url`, so a base
    // URL typed here would be a second, unused source of truth.
    name: "corpus.reciter.form",
    model: "corpus.reciter",
    type: "form",
    fields: [
      "slug",
      "name_translit",
      "name_arabic",
      "recitation_style",
      "license_type",
      "is_active",
    ],
  },
  {
    // List only, no form: millisecond boundaries are the output of aligning a
    // real recording to the text, not something to type by hand. A hand-made
    // timeline is exactly the fabricated synchronisation this track removed.
    name: "corpus.audio_segment.list",
    model: "corpus.audio_segment",
    type: "list",
    fields: [
      "reciter_slug",
      "surah_number",
      "ayah_number",
      "start_ms",
      "end_ms",
      "audio_file_url",
      "updated_at",
    ],
  },
  {
    name: "corpus.term.list",
    model: "corpus.term",
    type: "list",
    fields: [
      "canonical_id",
      "term",
      "lemma",
      "root",
      "part_of_speech",
      "primary_locale",
      "updated_at",
    ],
  },
  {
    name: "corpus.term.form",
    model: "corpus.term",
    type: "form",
    fields: [
      "canonical_id",
      "term",
      "lemma",
      "root",
      "part_of_speech",
      "primary_locale",
      "transliteration",
      "description",
    ],
  },
  {
    name: "corpus.term.landing",
    model: "corpus.term",
    type: "landing",
    fields: ["canonical_id", "term", "root", "primary_locale"],
    landing: {
      section: "knowledge",
      sequence: 20,
      href: "/models?model=corpus.term",
      status: "available",
      titleKey: "web.landing.views.corpus_term.title",
      descriptionKey: "web.landing.views.corpus_term.description",
      publicCountFilter: {},
    },
  },
  {
    name: "corpus.concept.list",
    model: "corpus.concept",
    type: "list",
    fields: [
      "canonical_id",
      "name",
      "category",
      "domain",
      "primary_locale",
      "version",
      "is_deprecated",
      "updated_at",
    ],
  },
  {
    name: "corpus.concept.form",
    model: "corpus.concept",
    type: "form",
    fields: [
      "canonical_id",
      "name",
      "category",
      "domain",
      "definition",
      "primary_locale",
      "version",
      "is_deprecated",
    ],
  },
  {
    name: "corpus.lexical_candidate.list",
    model: "corpus.lexical_candidate",
    type: "list",
    fields: [
      "candidate_text",
      "normalized_form",
      "occurrence_count",
      "verse_reference_count",
      "source_edition",
      "algorithm_version",
    ],
  },
  {
    name: "corpus.offline_manifest.list",
    model: "corpus.offline_manifest",
    type: "list",
    fields: [
      "edition_key",
      "version_tag",
      "total_surahs",
      "total_bytes",
      "sha256_checksum",
      "is_active",
    ],
  },
];
