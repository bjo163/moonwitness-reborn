import type { QlModelDefinition } from "ql_orm";
import { corpusAnnotation } from "./corpus_annotation.js";
import { corpusConcept } from "./corpus_concept.js";
import { corpusEdition } from "./corpus_edition.js";
import { corpusLexicalCandidate } from "./corpus_lexical_candidate.js";
import { corpusPassage } from "./corpus_passage.js";
import { corpusTerm } from "./corpus_term.js";
import { corpusWork } from "./corpus_work.js";
import { corpusAyahProof } from "./corpus_ayah_proof.js";
import { corpusReciter, corpusAudioSegment } from "./corpus_reciter.js";

export const models: QlModelDefinition[] = [
  corpusWork,
  corpusEdition,
  corpusPassage,
  corpusAnnotation,
  corpusTerm,
  corpusConcept,
  corpusAyahProof,
  corpusReciter,
  corpusAudioSegment,
];

export const computedModels = [corpusLexicalCandidate] as const;

export { corpusTerm } from "./corpus_term.js";
export { corpusConcept } from "./corpus_concept.js";
export { corpusAyahProof } from "./corpus_ayah_proof.js";
export { corpusReciter, corpusAudioSegment } from "./corpus_reciter.js";
