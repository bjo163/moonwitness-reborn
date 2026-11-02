import type { QlModelDefinition } from "ql_orm";
import { chatCitation } from "./chat_citation.js";
import { chatCitationVerification } from "./chat_citation_verification.js";
import { chatConversation } from "./chat_conversation.js";
import { chatMessage } from "./chat_message.js";

export const models: QlModelDefinition[] = [
  chatConversation,
  chatMessage,
  chatCitation,
  chatCitationVerification,
];

export { chatCitationVerification } from "./chat_citation_verification.js";
