import type { QlAddonManifest } from "ql_orm";
import { models } from "./models/index.js";
import { views } from "./views/index.js";

/**
 * `ql_workflow` — CAB (Change Advisory Board) approval workflow and PM
 * (Project Management) tracker.
 *
 * Ownership boundary (see `docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md:26`
 * and MW-ADR-017): this addon owns process definitions, review tasks, states,
 * and transitions. It does **not** own domain content (research/publication
 * records live elsewhere) and it is **not** a rights store — `APPROVED` here
 * never implies publication is allowed.
 *
 * Bypass lockdown on `workflow.change` and `workflow.transition`: the ACL
 * below sets `write:false, create:false, unlink:false` for **every** group on
 * both models. `state` therefore cannot be mutated through the generic
 * `/models/:model` PATCH dispatcher; transitions run through
 * `ql_workflow/services/workflow-service.ts`, which uses
 * `orm.updateRecordsForService`/`orm.createRecordForService` (bypasses ACL
 * but not the guard rules — see
 * `docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md:29`).
 */
const manifest: QlAddonManifest = {
  name: "ql_workflow",
  version: "1.0.0",
  description:
    "Antrean review CAB (change request + transisi tak dapat diubah) dan pelacak proyek/PM.",
  depends: ["ql_base", "ql_auth"],
  models,
  access: [
    // PM tracker — regular owner-scoped CRUD.
    {
      model: "workflow.project",
      group: "user",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "workflow.project",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    {
      model: "workflow.task",
      group: "user",
      read: true,
      write: true,
      create: true,
      unlink: false,
    },
    {
      model: "workflow.task",
      group: "admin",
      read: true,
      write: true,
      create: true,
      unlink: true,
    },
    // CAB change requests — `create:true` lets a member open a draft via the
    // generic `/models` POST path (owner_id is auto-stamped by QlOrm); every
    // subsequent mutation goes through the guarded transition handler.
    {
      model: "workflow.change",
      group: "user",
      read: true,
      write: false,
      create: true,
      unlink: false,
    },
    {
      model: "workflow.change",
      group: "admin",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "workflow.change",
      group: "operator",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    // CAB transitions — append-only audit; only writable via service path.
    {
      model: "workflow.transition",
      group: "user",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "workflow.transition",
      group: "admin",
      read: true,
      write: false,
      create: false,
      unlink: false,
    },
    {
      model: "workflow.transition",
      group: "operator",
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
