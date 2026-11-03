import type { QlModelDefinition } from "ql_orm";
import { bcp47Validator, enumValidator } from "../services/field-validators.js";
import { WORK_KINDS } from "../services/corpus-vocabulary.js";

/**
 * `corpus.work` — the top-level "work" (RGBL: Work) that many editions may
 * express. For the Al-Qur'an slice there is one work (`mw:work:quran`) with
 * three editions pointing at it (Tanzil Uthmani Arabic, RWWAD English,
 * Kemenag Indonesian).
 *
 * No `ownerField` — a work is platform-owned reference data, not user-
 * created content. Writes flow through the importer's service path only;
 * the ACL in `__manifest__.ts` denies `create`/`write`/`unlink` to every
 * group so the generic `/models` handler cannot be used as a second writer.
 */
export const corpusWork: QlModelDefinition = {
  name: "corpus.work",
  description:
    "Karya tingkat atas (mis. Al-Qur'an); banyak edisi/bahasa dapat merujuk ke satu work.",
  tableName: "corpus_work",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 80 },
    title: { type: "char", required: true, maxLength: 200 },
    work_kind: {
      type: "char",
      required: true,
      maxLength: 32,
      options: WORK_KINDS,
      validator: enumValidator("work_kind", WORK_KINDS),
    },
    primary_locale: { type: "char", required: true, maxLength: 12, validator: bcp47Validator("primary_locale") },
    description: { type: "text", maxLength: 4000 },
    source_artifact_id: { type: "char", maxLength: 64 },
  },
};
