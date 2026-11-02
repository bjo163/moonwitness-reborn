import type { QlModelDefinition } from "ql_orm";
import { enumValidator, sha256Validator } from "../services/field-validators.js";
import {
  ARTIFACT_KINDS,
  DEFAULT_LIFECYCLE_STAGE,
  LIFECYCLE_STAGES,
} from "../services/source-vocabulary.js";

/**
 * `source.artifact` — the top-level registry entry for an external body of
 * work (a Quran edition, a tafsir corpus, a lexicon release). Per
 * `https://github.com/bjo163/moonwitness-reborn/wiki/docs-architecture-DOMAIN_OWNERSHIP_AND_DEPENDENCIES` this addon
 * owns source artifact/version/citation/rights/provenance and **nothing**
 * about the normalized corpus text.
 *
 * Lifecycle and rights transitions are service-path-only: the manifest's
 * ACL grants `write:true` for the owner on ordinary metadata (`title`,
 * `publisher`, `original_uri`, `repository`, `branch`, `commit_sha`) but
 * `lifecycle_stage` is deliberately excluded from the edit form view so the
 * view-driven workspace UI cannot offer a control the API would refuse. Any
 * stage change must go through `services/source-service.ts` and append a
 * `source.provenance` row.
 */
export const sourceArtifact: QlModelDefinition = {
  name: "source.artifact",
  description:
    "Registrasi sumber eksternal (senjata: edisi Al-Qur'an, korpus tafsir, leksikon).",
  tableName: "source_artifact",
  ownerField: "owner_id",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    title: { type: "char", required: true, maxLength: 200 },
    kind: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ARTIFACT_KINDS,
      validator: enumValidator("kind", ARTIFACT_KINDS),
    },
    publisher: { type: "char", maxLength: 200 },
    original_uri: { type: "char", maxLength: 500 },
    repository: { type: "char", maxLength: 120 },
    branch: { type: "char", maxLength: 64 },
    commit_sha: {
      type: "char",
      maxLength: 64,
      validator: sha256Validator("commit_sha"),
    },
    lifecycle_stage: {
      type: "char",
      required: true,
      maxLength: 24,
      default: DEFAULT_LIFECYCLE_STAGE,
      options: LIFECYCLE_STAGES,
      validator: enumValidator("lifecycle_stage", LIFECYCLE_STAGES),
    },
    lifecycle_note: { type: "text", maxLength: 4000 },
    owner_id: { type: "char", required: true, private: true },
    created_at: { type: "datetime", required: true },
    updated_at: { type: "datetime", required: true },
  },
};
