import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

/**
 * `ql_corpus` — the RGBL corpus layer that owns work, expression/edition,
 * passage, exact text, translation, and lexical records. Source
 * artifact/version/rights/provenance are owned by `ql_source`.
 *
 * ACL is deny-by-default and structured around the "one writer" rule from
 * MW-ADR-019:
 *
 *   - `corpus.work` and `corpus.edition` are readable by every authenticated
 *     group and by viewers. Writes go through the importer service path,
 *     except that admins may edit a limited set of curator metadata (title,
 *     publisher, attribution text) via the generic `/models` handler. That is
 *     intentional — a curator fixing a typo in a publisher name should not
 *     have to run the importer again. `stage` and `edition_key` are excluded
 *     from the form view for this reason.
 *
 *   - `corpus.passage` and `corpus.annotation` are readable only by
 *     `admin` and `operator` through the generic `/models` path — members
 *     get a 403 because a raw listing of `staged` rows would leak scripture
 *     before rights are cleared. The reader's **published-only** access for
 *     members is provided by the dedicated `/corpus/*` HTTP routes which
 *     hard-filter `stage: "published"` and enforce the rights gate
 *     (`packages/ql_corpus/services/reader-service.ts`).
 *
 *   - Every model has `write:false, create:false, unlink:false` except
 *     `corpus.work` / `corpus.edition` for the admin group. The importer's
 *     service writes bypass the model ACL but **not** the field validators
 *     (`packages/ql-orm/src/index.ts:319-322`), so the storage-level
 *     religious-integrity invariant from MW-ADR-019 still holds even for a
 *     typo in the importer.
 */
const manifest: QlAddonManifest = {
  name: "ql_corpus",
  version: "1.0.0",
  description:
    "RGBL corpus layer: work, edition, passage, dan annotation; authority di level storage menegakkan canon text-vs-commentary.",
  depends: ["ql_base", "ql_auth", "ql_source"],
  models,
  access: [
    // corpus.work — read everywhere, admin-curated metadata edits allowed.
    {
      model: "corpus.work",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.work",
      group: "viewer",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.work",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.work",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "corpus.work",
      group: "root",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    // corpus.edition — same shape as work; stage flip stays service-only.
    {
      model: "corpus.edition",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.edition",
      group: "viewer",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.edition",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.edition",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "corpus.edition",
      group: "root",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    // corpus.passage — read only via `/corpus/*` (published+rights) for
    // members; admin/operator can inspect the raw registry through the
    // generic `/models` path. No writes for anyone except via the importer.
    {
      model: "corpus.passage",
      group: "user",
      read: false,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.passage",
      group: "viewer",
      read: false,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.passage",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.passage",
      group: "admin",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.passage",
      group: "root",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    // corpus.annotation — same shape as passage; MVP table stays empty
    // because tafsir rights are unverified. Model ships anyway so the
    // storage-level invariant is regression-tested on day one (test 2).
    {
      model: "corpus.annotation",
      group: "user",
      read: false,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.annotation",
      group: "viewer",
      read: false,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.annotation",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.annotation",
      group: "admin",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "corpus.annotation",
      group: "root",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
  ],
  views,
};

export default manifest;
