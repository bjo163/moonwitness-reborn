import type { QlModelDefinition } from "ql_orm";
import { corpusLexicalCandidate } from "./corpus_lexical_candidate.js";
import { corpusAnnotation } from "./corpus_annotation.js";
import { corpusEdition } from "./corpus_edition.js";
import { corpusPassage } from "./corpus_passage.js";
import { corpusWork } from "./corpus_work.js";

export const models: QlModelDefinition[] = [
  corpusWork,
  corpusEdition,
  corpusPassage,
  corpusAnnotation,
];

export const computedModels = [corpusLexicalCandidate] as const;
