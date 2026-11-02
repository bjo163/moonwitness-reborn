import type { QlViewDefinition } from "ql_orm";

/**
 * `ql_search` view definitions.
 *
 * The thematic graph tables have no importer and no seeder: relations between
 * verses and themes are a scholarly claim, so they are authored by an operator
 * and reviewed, never shipped as `data` defaults (AGENTS.md forbids seeding
 * claims without a validated source). That makes the `form` views below the
 * only write surface for `search.thematic_node` and `search.semantic_edge`,
 * and the `list` views the only read surface outside the graph service.
 *
 * `search.index_entry` deliberately has no view. It is derived from corpus
 * text by `services/search-indexing-service.ts`; a hand-edited token would
 * make search results disagree with the passages they point at, and the
 * reindex action is the supported way to change it.
 *
 * `created_at` / `updated_at` are omitted from the forms because `QlOrm.create`
 * stamps required datetime fields itself
 * (`packages/ql-orm/src/index.ts:1412-1415`).
 */
export const views: QlViewDefinition[] = [
  {
    name: "search.thematic_node.list",
    model: "search.thematic_node",
    type: "list",
    fields: [
      "slug",
      "title_id",
      "title_en",
      "category",
      "passage_count",
      "updated_at",
    ],
  },
  {
    name: "search.thematic_node.form",
    model: "search.thematic_node",
    type: "form",
    fields: ["slug", "title_id", "title_en", "category", "passage_count"],
  },
  {
    name: "search.semantic_edge.list",
    model: "search.semantic_edge",
    type: "list",
    fields: [
      "source_node_slug",
      "target_node_slug",
      "relation_type",
      "weight",
      "updated_at",
    ],
  },
  {
    // `evidence_payload` is in the form (it is what an operator cites) but not
    // in the list: a 4 kB JSON citation blob is unreadable in a table row, and
    // the graph screen renders those citations as verse locators instead.
    name: "search.semantic_edge.form",
    model: "search.semantic_edge",
    type: "form",
    fields: [
      "source_node_slug",
      "target_node_slug",
      "relation_type",
      "weight",
      "evidence_payload",
    ],
  },
];
