import type { QlModelDefinition } from "ql_orm";
import { corpusAnnotation } from "./corpus_annotation.js";
import { corpusConcept } from "./corpus_concept.js";
import { corpusEdition } from "./corpus_edition.js";
import { corpusLexicalCandidate } from "./corpus_lexical_candidate.js";
import { corpusPassage } from "./corpus_passage.js";
import { corpusTerm } from "./corpus_term.js";
import { corpusWork } from "./corpus_work.js";

export const models: QlModelDefinition[] = [
  corpusWork,
  corpusEdition,
  corpusPassage,
  corpusAnnotation,
  corpusTerm,
  corpusConcept,
];

export const computedModels = [corpusLexicalCandidate] as const;

export { corpusTerm } from "./corpus_term.js";
export { corpusConcept } from "./corpus_concept.js";
