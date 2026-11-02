import type {
  ChatCitationDto,
  ChatMessageDto,
} from "@moonwitness/moonclient";

export type AssistantEvidenceStatus = NonNullable<
  ChatMessageDto["groundingStatus"]
>;

export interface AssistantEvidence {
  status: AssistantEvidenceStatus;
  citations: ChatCitationDto[];
}

export function assistantEvidenceFor(
  message: Pick<ChatMessageDto, "groundingStatus" | "citations">,
): AssistantEvidence {
  const status = message.groundingStatus ?? "legacy";
  return {
    status,
    citations: status === "grounded" ? (message.citations ?? []) : [],
  };
}

export function citationReaderHref(
  citation: Pick<ChatCitationDto, "editionKey" | "surah">,
): string {
  return `/corpus/${encodeURIComponent(citation.editionKey)}/${citation.surah}`;
}
