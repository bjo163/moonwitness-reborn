import {
  QlValidationError,
  type QlComputedModelDefinition,
} from "ql_orm";
import { discoverArabicLexicalCandidates } from "../services/lexical-discovery.js";

export const corpusLexicalCandidate: QlComputedModelDefinition = {
  name: "corpus.lexical_candidate",
  labelKey: "web.models.entities.corpus_lexical_candidate",
  description:
    "Exploratory Arabic token frequencies from rights-cleared published Quran editions; this model does not identify or rank Divine Names.",
  descriptionKey: "web.models.descriptions.corpus_lexical_candidate",
  sources: ["corpus.edition", "corpus.passage", "source.rights"],
  queryFields: {
    edition_key: { type: "char", maxLength: 160 },
    normalized_form: { type: "char", maxLength: 128 },
  },
  fields: {
    candidate_text: {
      type: "char",
      required: true,
      maxLength: 128,
      labelKey: "web.models.fieldCandidateText",
    },
    normalized_form: {
      type: "char",
      required: true,
      maxLength: 128,
      labelKey: "web.models.fieldNormalizedForm",
    },
    occurrence_count: {
      type: "integer",
      required: true,
      minValue: 1,
      labelKey: "web.models.fieldOccurrenceCount",
    },
    verse_reference_count: {
      type: "integer",
      required: true,
      minValue: 1,
      labelKey: "web.models.fieldVerseReferenceCount",
    },
    source_edition: {
      type: "char",
      required: true,
      maxLength: 160,
      labelKey: "web.models.fieldSourceEdition",
    },
    source_version_id: {
      type: "char",
      required: true,
      maxLength: 64,
      labelKey: "web.models.fieldSourceVersionId",
    },
    source_references: {
      type: "text",
      required: true,
      maxLength: 16_000,
      labelKey: "web.models.fieldSourceReferences",
    },
    normalization_version: {
      type: "char",
      required: true,
      maxLength: 80,
      labelKey: "web.models.fieldNormalizationVersion",
    },
    algorithm_version: {
      type: "char",
      required: true,
      maxLength: 80,
      labelKey: "web.models.fieldAlgorithmVersion",
    },
  },
  async compute({ orm, query }) {
    const editionKey = query.filters.edition_key;
    if (editionKey !== undefined && typeof editionKey !== "string") {
      throw new QlValidationError("edition_key must be a string.");
    }
    const normalizedForm = query.filters.normalized_form;
    if (normalizedForm !== undefined && typeof normalizedForm !== "string") {
      throw new QlValidationError("normalized_form must be a string.");
    }
    return discoverArabicLexicalCandidates(
      orm,
      editionKey,
      query.limit,
      normalizedForm,
    );
  },
};
