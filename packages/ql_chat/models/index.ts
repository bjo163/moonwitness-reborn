import type { QlModelDefinition } from "ql_orm";
import { chatConversation } from "./chat_conversation.js";
import { chatMessage } from "./chat_message.js";

export const models: QlModelDefinition[] = [chatConversation, chatMessage];
