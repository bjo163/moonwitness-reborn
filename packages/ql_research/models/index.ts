import type { QlModelDefinition } from "ql_orm";
import { eventRecord } from "./event_record.js";
import { personProfile } from "./person_profile.js";
import { researchLexicalReview } from "./research_lexical_review.js";
import { storyNarrative } from "./story_narrative.js";
import { witnessStatement } from "./witness_statement.js";

export const models: QlModelDefinition[] = [
  researchLexicalReview,
  witnessStatement,
  storyNarrative,
  eventRecord,
  personProfile,
];

export { researchLexicalReview } from "./research_lexical_review.js";
export { witnessStatement } from "./witness_statement.js";
export { storyNarrative, STORY_MODES } from "./story_narrative.js";
export { eventRecord, EVENT_EPISTEMIC_STATUSES } from "./event_record.js";
export { personProfile, HISTORICAL_PERSON_ROLES } from "./person_profile.js";
