import type { QlModelDefinition } from "ql_orm";
import { researchLexicalReview } from "./research_lexical_review.js";
import { storyNarrative } from "./story_narrative.js";
import { witnessStatement } from "./witness_statement.js";

export const models: QlModelDefinition[] = [
  researchLexicalReview,
  witnessStatement,
  storyNarrative,
];

export { researchLexicalReview } from "./research_lexical_review.js";
export { witnessStatement } from "./witness_statement.js";
export { storyNarrative, STORY_MODES } from "./story_narrative.js";
