import type { QlModelDefinition } from "ql_orm";
import { enumValidator, sha256Validator } from "../services/field-validators.js";
import {
  DEFAULT_LIFECYCLE_STAGE,
  LIFECYCLE_STAGES,
} from "../services/source-vocabulary.js";

/**
 * `source.version` — one frozen snapshot of an artifact (repository, branch,
 * commit SHA, checksum, row count). `DATA_LIFECYCLE_AND_PROVENANCE.md:35`
 * requires that "Import controls (1) freeze and identify source snapshot";
 * every corpus passage carries a `import_run_id` and can be traced back to
 * exactly one `source.version`.
 *
 * `version_key` is a **denormalized composite unique column**
 * (`<artifact_id>@<release_label>`). `packages/ql-orm/src/index.ts:519` is
 * the only `CREATE UNIQUE INDEX` site in QlOrm; there is no composite index
 * and no non-unique secondary index, so the sole way to make a lookup on
 * the pair indexed is to store the pair in one string column and mark it
 * `unique: true`. This is documented here because a reader might otherwise
 * assume the denormalization is accidental.
 *
 * `checkpoint_ordinal` is the resume pointer for the importer's idempotent
 * re-run: it records the last row ordinal committed, so an interrupted run
 * can continue without re-reading prior lines.
 */
export const sourceVersion: QlModelDefinition = {
  name: "source.version",
  description:
    "Snapshot beku dari sebuah artifact: repo, branch, SHA, checksum, jumlah baris.",
  tableName: "source_version",
  ownerField: "owner_id",
  fields: {
    artifact_id: { type: "char", required: true, maxLength: 64 },
    version_key: { type: "char", required: true, unique: true, maxLength: 140 },
    release_label: { type: "char", required: true, maxLength: 120 },
    snapshot_repo: { type: "char", maxLength: 200 },
    snapshot_ref: { type: "char", maxLength: 80 },
    snapshot_sha: {
      type: "char",
      maxLength: 64,
      validator: sha256Validator("snapshot_sha"),
    },
    checksum_sha256: {
      type: "char",
      maxLength: 64,
      validator: sha256Validator("checksum_sha256"),
    },
    row_count_expected: { type: "integer", required: true, minValue: 0 },
    row_count_observed: { type: "integer", minValue: 0 },
    checkpoint_ordinal: { type: "integer", minValue: 0 },
    acquired_at: { type: "datetime", required: true },
    method: { type: "char", required: true, maxLength: 120 },
    tool_version: { type: "char", maxLength: 40 },
    lifecycle_stage: {
      type: "char",
      required: true,
      maxLength: 24,
      default: DEFAULT_LIFECYCLE_STAGE,
      options: LIFECYCLE_STAGES,
      validator: enumValidator("lifecycle_stage", LIFECYCLE_STAGES),
    },
    owner_id: { type: "char", required: true, private: true },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
