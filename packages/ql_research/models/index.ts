import type { QlModelDefinition } from "ql_orm";
import { eventRecord } from "./event_record.js";
import { lawInstrument } from "./law_instrument.js";
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
  lawInstrument,
];

export { researchLexicalReview } from "./research_lexical_review.js";
export { witnessStatement } from "./witness_statement.js";
export { storyNarrative, STORY_MODES } from "./story_narrative.js";
export { eventRecord, EVENT_EPISTEMIC_STATUSES } from "./event_record.js";
export { personProfile, HISTORICAL_PERSON_ROLES } from "./person_profile.js";
export { lawInstrument, LEGAL_JURISDICTIONS, INSTRUMENT_TYPES } from "./law_instrument.js";
