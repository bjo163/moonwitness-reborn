import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

/**
 * `ql_source` — the source registry that owns artifact, version, citation,
 * rights record and provenance (see
 * `https://github.com/bjo163/moonwitness-reborn/wiki/docs-architecture-DOMAIN_OWNERSHIP_AND_DEPENDENCIES`). It does **not**
 * own normalized corpus text — that is `ql_corpus`.
 *
 * ACL is deny-by-default. Notable structural choices:
 *
 * - `source.artifact` / `source.version` are owner-scoped, CRUD on ordinary
 *   metadata is allowed, but `lifecycle_stage` and `rights_status` changes
 *   go through `services/source-service.ts` only. The form views omit those
 *   fields so the view-driven UI never offers a control the API would
 *   refuse, and any hand-crafted PATCH that includes them is still rejected
 *   because the ORM validator fires before the service can act.
 * - `source.rights` is `write:false, unlink:false` for every group: a rights
 *   decision is created/updated only via `upsertRights(...)`, which also
 *   appends a `source.provenance` row.
 * - `source.provenance` is the append-only audit ledger; no group can
 *   create/write/unlink through the generic CRUD path. Only the service path
 *   appends. This mirrors `workflow.transition` in `packages/ql_workflow`.
 *
 * `read:true` for `viewer` on artifact/version/rights/provenance lets
 * unprivileged workspace members see that a source exists and what its
 * lifecycle stage is — but private fields (`owner_id`, `verified_by_id`,
 * `license_evidence_ref`, `actor_id`) are still stripped by QlOrm at read
 * time (`packages/ql-orm/src/index.ts:534-536`), and the DTO layer in
 * moonclient intentionally does not declare keys for them so client drift
 * becomes a compile error rather than a leak.
 */
const manifest: QlAddonManifest = {
  name: "ql_source",
  version: "1.0.0",
  description:
    "Registry sumber eksternal: artifact, versi beku, keputusan rights per aksi, dan provenance append-only.",
  depends: ["ql_base", "ql_auth"],
  models,
  access: [
    // source.artifact — user can register and edit their own drafts, but
    // cannot advance lifecycle_stage directly (service path only, form view
    // omits the field).
    {
      model: "source.artifact",
      group: "user",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "source.artifact",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    {
      model: "source.artifact",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "source.artifact",
      group: "viewer",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    // source.version — the frozen snapshot ledger, write-scoped to owner but
    // readable across the workspace so downstream citations resolve.
    {
      model: "source.version",
      group: "user",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "source.version",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    {
      model: "source.version",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "source.version",
      group: "viewer",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    // source.rights — a decision record; a user may see and file one, but
    // never write or unlink in place. Only upsertRights(...) advances status.
    {
      model: "source.rights",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "source.rights",
      group: "admin",
      read: true,
      write: false,
      create: true,
      unlink: false,
    },
    {
      model: "source.rights",
      group: "root",
      read: true,
      write: false,
      create: true,
      unlink: false,
    },
    {
      model: "source.rights",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "source.rights",
      group: "viewer",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    // source.provenance — append-only audit ledger. No create/write/unlink
    // for ANY group through the generic CRUD path; only the service can
    // append via `orm.createRecordForService`. Regression-locked in
    // `models/index.test.ts`.
    {
      model: "source.provenance",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "source.provenance",
      group: "admin",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "source.provenance",
      group: "root",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "source.provenance",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "source.provenance",
      group: "viewer",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
  ],
  views,
  data: [],
};

export default manifest;
