import type { QlViewDefinition } from "ql_orm";

/**
 * `ql_source` view definitions.
 *
 * Deliberate exclusions from the *form* views below are load-bearing, not
 * oversights — `lifecycle_stage`, `rights_status`, and every audit row are
 * mutable only through `services/source-service.ts` and the transition
 * guards there. The generic `/models/:model` PATCH handler cannot reach them
 * because (a) the fields are absent from the form view so the UI offers no
 * control, and (b) `source.provenance` has `write:false` in every group's
 * ACL so even a hand-crafted PATCH is refused.
 */
export const views: QlViewDefinition[] = [
  {
    name: "source.artifact.list",
    model: "source.artifact",
    type: "list",
    fields: [
      "canonical_id",
      "title",
      "kind",
      "publisher",
      "lifecycle_stage",
      "updated_at",
    ],
  },
  {
    name: "source.artifact.form",
    model: "source.artifact",
    type: "form",
    fields: [
      "canonical_id",
      "title",
      "kind",
      "publisher",
      "original_uri",
      "repository",
      "branch",
      "commit_sha",
      "lifecycle_note",
    ],
  },
  {
    name: "source.artifact.landing",
    model: "source.artifact",
    type: "landing",
    fields: ["canonical_id", "title", "kind", "publisher", "lifecycle_stage"],
    landing: {
      section: "knowledge",
      sequence: 30,
      href: "/models?model=source.artifact",
      status: "available",
      titleKey: "web.landing.views.source_artifact.title",
      descriptionKey: "web.landing.views.source_artifact.description",
    },
  },
  {
    name: "source.version.list",
    model: "source.version",
    type: "list",
    fields: [
      "artifact_id",
      "release_label",
      "snapshot_sha",
      "row_count_expected",
      "row_count_observed",
      "lifecycle_stage",
      "acquired_at",
    ],
  },
  {
    name: "source.version.form",
    model: "source.version",
    type: "form",
    fields: [
      "artifact_id",
      "release_label",
      "snapshot_repo",
      "snapshot_ref",
      "snapshot_sha",
      "checksum_sha256",
      "row_count_expected",
      "method",
      "tool_version",
    ],
  },
  {
    name: "source.rights.list",
    model: "source.rights",
    type: "list",
    fields: [
      "version_id",
      "action",
      "rights_status",
      "license_id",
      "attribution_required",
      "updated_at",
    ],
  },
  {
    name: "source.rights.form",
    model: "source.rights",
    type: "form",
    fields: [
      "version_id",
      "action",
      "license_id",
      "license_text",
      "attribution_required",
      "attribution_text",
      "territory",
      "term_ends_at",
      "basis_notes",
    ],
  },
  {
    // Audit trail is read-only across the whole workspace. No form view is
    // registered so the view-driven UI never offers Add / Edit controls here;
    // only the source-service can append rows via `createRecordForService`.
    name: "source.provenance.list",
    model: "source.provenance",
    type: "list",
    fields: [
      "occurred_at",
      "subject_type",
      "subject_id",
      "from_stage",
      "to_stage",
      "action",
      "decision",
      "reason",
      "correlation_id",
    ],
  },
];
