import type { QlModelDefinition } from "ql_orm";
import { bcp47Validator, enumValidator } from "../services/field-validators.js";
import {
  CORPUS_STAGES,
  DEFAULT_CORPUS_STAGE,
  PASSAGE_KINDS,
} from "../services/corpus-vocabulary.js";

/**
 * `corpus.edition` — an expression of a work in a specific language/authority
 * (RGBL: Expression / Edition). The composite `edition_key` =
 * `<work_id>|<locale>|<authority>` is a **denormalized unique column**, not
 * a real composite index — QlOrm creates only `PRIMARY KEY` and
 * single-column `UNIQUE` (`packages/ql-orm/src/index.ts:519`), so a
 * denormalized unique string is the only way to get an indexed lookup for
 * "find the Arabic verbatim edition of the Quran".
 *
 * The cross-field invariant `authority === "revelation_verbatim" ⇒ locale
 * === "ar"` **cannot be expressed** in a QlOrm field validator (which sees
 * only the value under test), so it is enforced at the service layer by
 * `assertEditionKindLocaleInvariant` in `services/corpus-service.ts` and
 * tested directly in `models/index.test.ts` assertion 3.
 *
 * `stage` is deliberately excluded from the form view (see `views/index.ts`)
 * — no user can flip an edition from `staged` to `published` through
 * `/models`; only an operator via `publishEdition(...)` after rights are
 * cleared per MW-ADR-019 §(e).
 */
export const corpusEdition: QlModelDefinition = {
  name: "corpus.edition",
  description:
    "Edisi work dalam bahasa dan authority tertentu; stage mengontrol visibilitas publik.",
  tableName: "corpus_edition",
  fields: {
    canonical_id: { type: "char", required: true, unique: true, maxLength: 100 },
    work_id: { type: "char", required: true, maxLength: 64 },
    source_version_id: { type: "char", required: true, maxLength: 64 },
    rights_id: { type: "char", required: true, maxLength: 64 },
    edition_key: { type: "char", required: true, unique: true, maxLength: 160 },
    authority: {
      type: "char",
      required: true,
      maxLength: 24,
      validator: enumValidator("authority", PASSAGE_KINDS),
    },
    locale: { type: "char", required: true, maxLength: 12, validator: bcp47Validator("locale") },
    publisher: { type: "char", maxLength: 200 },
    author_or_translator: { type: "char", maxLength: 200 },
    attribution_text: { type: "text", required: true, maxLength: 4000 },
    revision: { type: "char", maxLength: 64 },
    imported_row_count: { type: "integer", required: true, minValue: 0, default: 0 },
    materialized_row_count: { type: "integer", minValue: 0 },
    stage: {
      type: "char",
      required: true,
      maxLength: 16,
      default: DEFAULT_CORPUS_STAGE,
      validator: enumValidator("stage", CORPUS_STAGES),
    },
  },
};
