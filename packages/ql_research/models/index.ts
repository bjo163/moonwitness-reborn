import type { QlModelDefinition } from "ql_orm";
import { characterAppearance } from "./character_appearance.js";
import { characterCanon } from "./character_canon.js";
import { characterClassification } from "./character_classification.js";
import { eventRecord } from "./event_record.js";
import { lawInstrument } from "./law_instrument.js";
import { mizanAssessment } from "./mizan_assessment.js";
import { personProfile } from "./person_profile.js";
import { researchCorrelation } from "./research_correlation.js";
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
  mizanAssessment,
  researchCorrelation,
  characterCanon,
  characterClassification,
  characterAppearance,
];

export { researchLexicalReview } from "./research_lexical_review.js";
export { witnessStatement } from "./witness_statement.js";
export { storyNarrative, STORY_MODES } from "./story_narrative.js";
export { eventRecord, EVENT_EPISTEMIC_STATUSES } from "./event_record.js";
export { personProfile, HISTORICAL_PERSON_ROLES } from "./person_profile.js";
export { lawInstrument, LEGAL_JURISDICTIONS, INSTRUMENT_TYPES } from "./law_instrument.js";
export { mizanAssessment, MIZAN_DIMENSIONS, MIZAN_BALANCE_TIERS } from "./mizan_assessment.js";
export { researchCorrelation, CORRELATION_TYPES, CORRELATION_CERTAINTIES } from "./research_correlation.js";
export { characterCanon, CHARACTER_CANON_STATUSES } from "./character_canon.js";
export { characterClassification, CHARACTER_ARCHETYPES, CHARACTER_ALIGNMENTS } from "./character_classification.js";
export { characterAppearance, APPEARANCE_PROMINENCES } from "./character_appearance.js";
