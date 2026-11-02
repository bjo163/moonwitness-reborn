import type { QlModelDefinition } from "ql_orm";
import { researchLexicalReview } from "./research_lexical_review.js";
import { witnessStatement } from "./witness_statement.js";

export const models: QlModelDefinition[] = [
  researchLexicalReview,
  witnessStatement,
];

export { researchLexicalReview } from "./research_lexical_review.js";
export { witnessStatement } from "./witness_statement.js";
