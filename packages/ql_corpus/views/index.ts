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
];
