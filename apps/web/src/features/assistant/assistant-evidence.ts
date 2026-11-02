import type {
  ChatCitationDto,
  ChatMessageDto,
  UnverifiedCitationDto,
} from "@moonwitness/moonclient";

export type AssistantEvidenceStatus = NonNullable<
  ChatMessageDto["groundingStatus"]
>;

export interface AssistantEvidence {
  status: AssistantEvidenceStatus;
  citations: ChatCitationDto[];
  unverifiedCitations: UnverifiedCitationDto[];
}

export function assistantEvidenceFor(
  message: {
    groundingStatus?: ChatMessageDto["groundingStatus"];
    citations?: ChatCitationDto[];
    unverifiedCitations?: UnverifiedCitationDto[];
  },
): AssistantEvidence {
  const status = message.groundingStatus ?? "legacy";
  return {
    status,
    citations: status === "grounded" ? (message.citations ?? []) : [],
    unverifiedCitations: message.unverifiedCitations ?? [],
  };
}

export function citationReaderHref(
  citation: Pick<ChatCitationDto, "editionKey" | "surah">,
): string {
  return `/corpus/${encodeURIComponent(citation.editionKey)}/${citation.surah}`;
}
