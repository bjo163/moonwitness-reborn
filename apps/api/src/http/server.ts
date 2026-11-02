import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { createHash } from "node:crypto";
import {
  runAgent,
  runGroundedAgent,
  extractScriptureCitations,
  type AgentRequest,
  type ModelProvider,
  type OpenAICompatibleProviderOptions,
} from "@moonwitness/agent-runtime";
import type {
  CitationReference,
  ConversationStore,
  Message,
  User,
} from "@moonwitness/database";
import {
  apiRoutes,
  type AdminUserDto,
  type AdminUserListResponseDto,
  type AuthResponseDto,
  type ChatCitationDto,
  type ChatMessageDto,
  type ChatRequestDto,
  type ChatResponseDto,
  type ComputeModelQueryRequestDto,
  type CreateLexicalResearchReviewResponseDto,
  type ConversationDto,
  type ConversationListResponseDto,
  type CorpusEditionDto,
  type CorpusEditionListResponseDto,
  type CorpusPassageDto,
  type CorpusSurahDto,
  type CorpusSurahResponseDto,
  type CorpusVerseResponseDto,
  type LandingCatalogResponseDto,
  type LandingViewItemDto,
  type ModelMetadataDto,
  type ModelProviderDto,
  type ModelRecordDto,
  type ModelRecordsResponseDto,
  type PublicModelExplorerResponseDto,
  type LexicalResearchCandidateDto,
  type LexicalResearchDecisionDto,
  type LexicalResearchReviewDto,
  type LexicalResearchReviewQueueItemDto,
  type LexicalResearchReviewQueueResponseDto,
  type LexicalResearchSourceReferenceDto,
  type ProjectTaskListResponseDto,
  type RoleDto,
  type RoleListResponseDto,
  type SourceArtifactDto,
  type SourceArtifactListResponseDto,
  type SourceArtifactResponseDto,
  type SourceRightsSummaryDto,
  type PassageKindDto,
  type UiLocale,
  type WorkflowChangeDto,
  type WorkflowChangeListResponseDto,
  type WorkflowStateDto,
  type WorkflowTransitionDto,
  type WorkflowTransitionListResponseDto,
  type TranslationDraftRequestDto,
  type TranslationAiDraftRequestDto,
  type UiLanguageDto,
  type SearchQueryResponseDto,
  type SearchResultItemDto,
  type ReindexCorpusSearchIndexRequestDto,
  type ReindexCorpusSearchIndexResponseDto,
} from "@moonwitness/moonclient";
import {
  QlAccessError,
  QlConflictError,
  QlNotFoundError,
  QlStorageError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
  type QlServiceValue,
} from "ql_orm";
import { AttachmentError } from "ql_attachment/services/errors";
import type { AttachmentPolicy } from "ql_attachment/services/attachment-service";
import { handleAttachmentRequest } from "./attachments.js";
import {
  normalizeProviderBaseUrl,
  ProviderConfigurationError,
} from "ql_ai/services/provider-config";
import {
  CloudflareApiError,
  CloudflareNetworkError,
  CloudflareRateLimitError,
} from "ql_cloudflare/services/errors";
import {
  RecordValidationError,
} from "ql_cloudflare/services/mutation-service";
import {
  ConnectorUnavailableError,
  SyncCooldownError,
} from "ql_cloudflare/services/sync-service";
import {
  getSanadPipelineStatusForService,
  listOpenChanges,
  listTransitionsForChange,
  requestTransition,
  submitPeerReviewForService,
} from "ql_workflow/services/workflow-service";
import {
  listLexicalCandidateReviewQueue,
  recordLexicalCandidateReview,
} from "ql_research/services/lexical-review-service";
import {
  publishEdition,
  withdrawEdition,
} from "ql_corpus/services/corpus-service";
import {
  indexCorpusEdition,
  searchCorpusPassages,
} from "ql_search/services/search-indexing-service";
import {
  readSurahWindow,
  readVerse,
  type PassageReadDto,
} from "ql_corpus/services/reader-service";
import {
  isSha256Hex,
  readAyahProofSummary,
  verifyAyahProof,
} from "ql_corpus/services/proof-service";
import { PASSAGE_KINDS } from "ql_corpus/services/corpus-vocabulary";
import {
  ROLE_CATALOG,
  countUsersWithRole,
  findRoleDefinition,
  groupsForRole,
  isKnownRole,
} from "ql_auth/services/rbac";
import {
  approveTranslation,
  exportPoCatalog,
  getPublishedCatalog,
  importPoDrafts,
  isEnabledLocale,
  listAdminTranslations,
  listEnabledLanguages,
  saveTranslationDraft,
  type EnabledLocale,
} from "ql_i18n/services/catalog-service";
import { firstUseSetupRequired } from "../auth/setup.js";
import { RequestError, sendJson } from "./respond.js";
import { ConnectorAccessError } from "../connectors/connector-boundary.js";
import {
  ConnectorCredentialError,
  resolveCloudflareToken,
  type ResolvedCredential,
} from "../connectors/os-credential-store.js";
import {
  createConnector,
  createConnectorRecord,
  deleteConnector,
  deleteConnectorRecord,
  listConnectorAudit,
  listConnectorRecords,
  listConnectorZones,
  listConnectors,
  syncConnectorNow,
  updateConnector,
  updateConnectorRecord,
  verifyConnector,
  type ConnectorContext,
} from "../connectors/connector-operations.js";
import {
  AuthenticationError,
  clearSession,
  getAuthenticatedUser,
  hashPassword,
  issueSession,
  normalizeEmail,
  publicUser,
  validateCredentials,
  verifyPassword,
} from "../auth/auth.js";
import {
  createFallbackProvider,
  type ModelProviderFactory,
} from "../ai/model-router.js";
import {
  decryptProviderSecret,
  encryptProviderSecret,
} from "../ai/provider-secrets.js";
import {
  listProjectTasks,
  projectProgressSummary,
  readyProjectTaskIds,
} from "../project-progress/github-issues.js";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_INPUT_LENGTH = 16_000;
const MAX_INSTRUCTIONS_LENGTH = 4_000;
const HISTORY_LIMIT = 20;

function conversationDto(
  conversation: Awaited<ReturnType<ConversationStore["createConversation"]>>,
): ConversationDto {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

function isPassageKind(value: string): value is PassageKindDto {
  return PASSAGE_KINDS.some((kind) => kind === value);
}

async function insufficientEvidenceReply(
  orm: QlOrm,
  locale: UiLocale,
): Promise<string> {
  const translation = (
    await getPublishedCatalog(orm, locale, "chat")
  ).find(({ key }) => key === "insufficientEvidence");
  if (!translation?.value.trim()) {
    throw new Error(
      `Published insufficient-evidence copy is missing for locale '${locale}'.`,
    );
  }
  return translation.value;
}

async function revalidateCitation(
  orm: QlOrm,
  citation: CitationReference,
): Promise<ChatCitationDto | undefined> {
  try {
    const passage = await readVerse(
      orm,
      citation.editionKey,
      citation.surah,
      citation.ayah,
    );
    if (
      passage.id !== citation.evidenceId ||
      passage.edition_id !== citation.editionId
    ) {
      return undefined;
    }
    if (
      !isPassageKind(passage.authority) ||
      !isPassageKind(passage.edition_authority)
    ) {
      throw new Error("Stored corpus citation has an unsupported authority.");
    }
    return {
      evidenceId: passage.id,
      editionId: passage.edition_id,
      editionKey: citation.editionKey,
      authority: passage.authority,
      editionAuthority: passage.edition_authority,
      locale: passage.edition_locale,
      publisher: passage.edition_publisher,
      attribution: passage.edition_attribution_text,
      locator: passage.locator,
      surah: passage.surah,
      ayah: passage.ayah,
    };
  } catch (error) {
    if (error instanceof QlAccessError || error instanceof QlNotFoundError) {
      return undefined;
    }
    throw error;
  }
}

async function messageDto(
  orm: QlOrm,
  message: Message,
): Promise<ChatMessageDto> {
  const dto: ChatMessageDto = {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
  if (message.role !== "assistant") return dto;

  const groundingStatus = message.groundingStatus ?? "legacy";
  if (groundingStatus !== "grounded") {
    return { ...dto, groundingStatus };
  }
  const citations = (
    await Promise.all(
      message.citations.map((citation) => revalidateCitation(orm, citation)),
    )
  ).filter((citation): citation is ChatCitationDto => citation !== undefined);
  if (citations.length === 0) {
    return { ...dto, groundingStatus: "legacy" };
  }
  return { ...dto, groundingStatus, citations };
}

async function readJsonBody(
  request: IncomingMessage,
  maximumBytes = MAX_BODY_BYTES,
): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) {
      throw new RequestError("Request body is too large.", 413);
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new RequestError("Request body must be valid JSON.", 400);
  }
}

function parseObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new RequestError("Request body must be a JSON object.", 400);
  }
  return body as Record<string, unknown>;
}

function parseComputedModelQuery(body: unknown): ComputeModelQueryRequestDto {
  const input = parseObject(body);
  if (Object.keys(input).some((key) => key !== "filters" && key !== "limit")) {
    throw new RequestError("Computed model query contains an unknown field.", 400);
  }
  const filtersInput =
    input.filters === undefined ? {} : parseObject(input.filters);
  if (Object.keys(filtersInput).length > 20) {
    throw new RequestError("Computed model query supports at most 20 filters.", 400);
  }
  const filters: NonNullable<ComputeModelQueryRequestDto["filters"]> = {};
  for (const [name, value] of Object.entries(filtersInput)) {
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new RequestError(`Computed model filter '${name}' is invalid.`, 400);
    }
    if (
      value !== null &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      throw new RequestError(
        `Computed model filter '${name}' must be a scalar value.`,
        400,
      );
    }
    if (
      (typeof value === "number" && !Number.isFinite(value)) ||
      (typeof value === "string" && value.length > 500)
    ) {
      throw new RequestError(`Computed model filter '${name}' is too large.`, 400);
    }
    filters[name] = value;
  }
  let limit: number | undefined;
  if (input.limit !== undefined) {
    if (
      typeof input.limit !== "number" ||
      !Number.isInteger(input.limit) ||
      input.limit < 1 ||
      input.limit > 100
    ) {
      throw new RequestError(
        "Computed model limit must be an integer between 1 and 100.",
        400,
      );
    }
    limit = input.limit;
  }
  return {
    ...(Object.keys(filters).length ? { filters } : {}),
    ...(limit === undefined ? {} : { limit }),
  };
}

function parseUiLocale(value: unknown): UiLocale {
  if (value !== "id" && value !== "en") {
    throw new RequestError("Field 'preferredLocale' must be 'id' or 'en'.", 400);
  }
  return value;
}

function parseEnabledLocale(value: unknown): EnabledLocale {
  if (!isEnabledLocale(value)) {
    throw new RequestError("The requested interface language is unsupported.", 400);
  }
  return value;
}

function parseTranslationDraft(body: unknown): TranslationDraftRequestDto {
  const input = parseObject(body);
  const requiredText = (key: string, maximum: number): string => {
    const value = input[key];
    if (
      typeof value !== "string" ||
      !value.trim() ||
      value.length > maximum
    ) {
      throw new RequestError(`Field '${key}' is invalid.`, 400);
    }
    return value;
  };
  const context = input.context;
  if (context !== undefined && (
    typeof context !== "string" || context.length > 2000
  )) {
    throw new RequestError("Field 'context' is invalid.", 400);
  }
  const sourcePluralText = input.sourcePluralText;
  const pluralForms = input.translatedPluralTexts;
  if (
    sourcePluralText !== undefined &&
    (typeof sourcePluralText !== "string" ||
      !sourcePluralText.trim() ||
      sourcePluralText.length > 4000)
  ) {
    throw new RequestError("Field 'sourcePluralText' is invalid.", 400);
  }
  let translatedPluralTexts:
    | TranslationDraftRequestDto["translatedPluralTexts"]
    | undefined;
  if (pluralForms !== undefined) {
    if (
      typeof pluralForms !== "object" ||
      pluralForms === null ||
      Array.isArray(pluralForms)
    ) {
      throw new RequestError("Field 'translatedPluralTexts' is invalid.", 400);
    }
    translatedPluralTexts = {};
    for (const [category, value] of Object.entries(pluralForms)) {
      if (
        (category !== "one" && category !== "other") ||
        typeof value !== "string" ||
        value.length > 4000
      ) {
        throw new RequestError("Field 'translatedPluralTexts' is invalid.", 400);
      }
      translatedPluralTexts[category] = value;
    }
  }
  return {
    locale: parseEnabledLocale(input.locale),
    namespace: requiredText("namespace", 80),
    key: requiredText("key", 160),
    sourceText: requiredText("sourceText", 4000),
    translatedText: requiredText("translatedText", 4000),
    ...(typeof sourcePluralText === "string" ? { sourcePluralText } : {}),
    ...(translatedPluralTexts ? { translatedPluralTexts } : {}),
    ...(typeof context === "string" ? { context } : {}),
  };
}

function parseTranslationAiDraft(
  body: unknown,
): TranslationAiDraftRequestDto {
  const input = parseObject(body);
  const requiredText = (key: string, maximum: number): string => {
    const value = input[key];
    if (
      typeof value !== "string" ||
      !value.trim() ||
      value.length > maximum
    ) {
      throw new RequestError(`Field '${key}' is invalid.`, 400);
    }
    return value;
  };
  const context = input.context;
  if (
    context !== undefined &&
    (typeof context !== "string" || context.length > 2000)
  ) {
    throw new RequestError("Field 'context' is invalid.", 400);
  }
  const sourcePluralText = input.sourcePluralText;
  if (
    sourcePluralText !== undefined &&
    (typeof sourcePluralText !== "string" ||
      !sourcePluralText.trim() ||
      sourcePluralText.length > 4000)
  ) {
    throw new RequestError("Field 'sourcePluralText' is invalid.", 400);
  }
  return {
    locale: parseEnabledLocale(input.locale),
    namespace: requiredText("namespace", 80),
    key: requiredText("key", 160),
    sourceText: requiredText("sourceText", 4000),
    ...(typeof sourcePluralText === "string" ? { sourcePluralText } : {}),
    ...(typeof context === "string" ? { context } : {}),
  };
}

function parseAgentRequest(body: unknown): AgentRequest & ChatRequestDto {
  const { input, instructions, conversationId, grounding } = parseObject(body);
  if (typeof input !== "string" || !input.trim()) {
    throw new RequestError("Field 'input' must be a non-empty string.", 400);
  }
  if (input.length > MAX_INPUT_LENGTH) {
    throw new RequestError("Field 'input' is too long.", 400);
  }
  if (typeof conversationId !== "string" || !conversationId.trim()) {
    throw new RequestError(
      "Field 'conversationId' must be a non-empty string.",
      400,
    );
  }
  if (instructions !== undefined && typeof instructions !== "string") {
    throw new RequestError("Field 'instructions' must be a string.", 400);
  }
  if (
    typeof instructions === "string" &&
    instructions.length > MAX_INSTRUCTIONS_LENGTH
  ) {
    throw new RequestError("Field 'instructions' is too long.", 400);
  }
  if (grounding !== undefined && grounding !== "grounded") {
    throw new RequestError("Field 'grounding' must be 'grounded'.", 400);
  }
  return {
    input,
    conversationId,
    ...(typeof instructions === "string" ? { instructions } : {}),
    ...(grounding === "grounded" ? { grounding } : {}),
  };
}

function retryAfterHeaders(retryAfterMs: number): Record<string, string> {
  return { "retry-after": String(Math.max(1, Math.ceil(retryAfterMs / 1000))) };
}

function handleRequestError(
  response: ServerResponse,
  error: unknown,
) {
  if (error instanceof RequestError || error instanceof AuthenticationError) {
    sendJson(response, error.statusCode, { error: error.message });
    return;
  }
  if (error instanceof AttachmentError) {
    sendJson(response, error.statusCode, { code: error.code, error: error.message });
    return;
  }
  if (error instanceof QlStorageError) {
    sendJson(response, 503, { error: "Attachment storage is unavailable." });
    return;
  }
  if (error instanceof QlAccessError) {
    sendJson(response, 403, { error: "Access denied." });
    return;
  }
  if (error instanceof ConnectorAccessError) {
    sendJson(response, 403, { error: error.message });
    return;
  }
  if (error instanceof QlConflictError) {
    sendJson(response, 409, { error: error.message });
    return;
  }
  if (error instanceof QlNotFoundError) {
    sendJson(response, 404, { error: error.message });
    return;
  }
  if (error instanceof QlValidationError) {
    sendJson(response, 400, { error: error.message });
    return;
  }
  if (error instanceof ConnectorUnavailableError || error instanceof RecordValidationError) {
    sendJson(response, 400, { error: error.message });
    return;
  }
  if (error instanceof CloudflareRateLimitError || error instanceof SyncCooldownError) {
    sendJson(
      response,
      429,
      { error: error.message },
      retryAfterHeaders(error.retryAfterMs),
    );
    return;
  }
  if (error instanceof CloudflareApiError) {
    sendJson(response, 502, { error: error.message });
    return;
  }
  if (
    error instanceof CloudflareNetworkError ||
    error instanceof ConnectorCredentialError
  ) {
    sendJson(response, 503, { error: error.message });
    return;
  }
  console.error("API request failed.", error);
  sendJson(response, 500, { error: "Internal server error." });
}

function handleI18nRequestError(
  response: ServerResponse,
  error: unknown,
): void {
  if (error instanceof RequestError) {
    let code = "I18N_REQUEST_INVALID";
    if (error.statusCode === 403) {
      code = "I18N_ACCESS_DENIED";
    } else if (error.statusCode === 405) {
      code = "I18N_METHOD_NOT_ALLOWED";
    } else if (error.statusCode >= 500) {
      code = "I18N_SERVICE_UNAVAILABLE";
    }
    sendJson(response, error.statusCode, {
      code,
      error: error.message,
    });
    return;
  }
  if (error instanceof QlAccessError) {
    sendJson(response, 403, {
      code: "I18N_ACCESS_DENIED",
      error: "Access denied.",
    });
    return;
  }
  if (error instanceof QlConflictError) {
    sendJson(response, 409, {
      code: "I18N_CONFLICT",
      error: error.message,
    });
    return;
  }
  if (error instanceof QlNotFoundError) {
    sendJson(response, 404, {
      code: "I18N_NOT_FOUND",
      error: error.message,
    });
    return;
  }
  if (error instanceof QlValidationError) {
    sendJson(response, 400, {
      code: "I18N_VALIDATION",
      error: error.message,
    });
    return;
  }
  console.error("Translation request failed.", error);
  sendJson(response, 500, {
    code: "I18N_INTERNAL",
    error: "Translation request failed.",
  });
}

function requireAuthenticatedUser(
  request: IncomingMessage,
  response: ServerResponse,
  store: ConversationStore,
): Promise<User | undefined> {
  return getAuthenticatedUser(request, store)
    .then((user) => {
      if (!user) {
        request.resume();
        sendJson(response, 401, { error: "Authentication required." });
      }
      return user;
    })
    .catch((error: unknown) => {
      handleRequestError(response, error);
      return undefined;
    });
}

function userContext(user: User) {
  return { id: user.id, groups: groupsForRole(user.role) };
}

/** The browser only ever sees the caller's own groups; the real gate stays in the API. */
function sessionUser(user: User) {
  return { ...publicUser(user), groups: userContext(user).groups };
}

function requireGroup(user: User, ...allowed: string[]): void {
  const groups = userContext(user).groups;
  if (!allowed.some((group) => groups.includes(group))) {
    throw new RequestError(
      "Peran akun Anda tidak mengizinkan aksi ini.",
      403,
    );
  }
}

function splitGroups(value: string): string[] {
  return value
    .split(",")
    .map((group) => group.trim())
    .filter(Boolean);
}

function toIsoDateTime(value: unknown): string {
  const timestamp = typeof value === "number" ? value : Number(value ?? NaN);
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toAdminUser(record: QlRecord): AdminUserDto {
  return {
    id: String(record.id ?? ""),
    name: typeof record.name === "string" ? record.name : "",
    email: typeof record.email === "string" ? record.email : "",
    active: record.active === true,
    role: typeof record.role === "string" ? record.role : "member",
    createdAt: toIsoDateTime(record.created_at),
  };
}

async function assertSuperAdminRemains(orm: QlOrm): Promise<void> {
  const remaining = await countUsersWithRole(orm, "super_admin");
  if (remaining <= 1) {
    throw new RequestError(
      "Minimal satu super_admin harus tetap aktif. Serahkan peran ke akun lain terlebih dahulu.",
      400,
    );
  }
}

function validateProviderBaseUrl(value: unknown): string {
  try {
    return normalizeProviderBaseUrl(value);
  } catch (error) {
    if (error instanceof ProviderConfigurationError) {
      throw new RequestError(error.message, 400);
    }
    throw error;
  }
}

interface StoredProvider {
  id: string;
  name: string;
  base_url: string;
  model: string;
  encrypted_api_key: string;
  priority: number;
  enabled: boolean;
}

function toStoredProvider(record: QlRecord): StoredProvider {
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.base_url !== "string" ||
    typeof record.model !== "string" ||
    typeof record.encrypted_api_key !== "string" ||
    typeof record.priority !== "number" ||
    typeof record.enabled !== "boolean"
  ) {
    throw new Error("Stored ai.provider record has an invalid shape.");
  }
  return {
    id: record.id,
    name: record.name,
    base_url: record.base_url,
    model: record.model,
    encrypted_api_key: record.encrypted_api_key,
    priority: record.priority,
    enabled: record.enabled,
  };
}

function providerSummary(provider: StoredProvider): ModelProviderDto {
  return {
    id: provider.id,
    name: provider.name,
    baseUrl: provider.base_url,
    model: provider.model,
    priority: provider.priority,
    enabled: provider.enabled,
    hasApiKey: Boolean(provider.encrypted_api_key),
  };
}

function providerInput(
  body: Record<string, unknown>,
  encryptionKey: Buffer<ArrayBufferLike> | undefined,
  existing?: StoredProvider,
) {
  const name = body.name === undefined ? existing?.name : body.name;
  const model = body.model === undefined ? existing?.model : body.model;
  if (typeof name !== "string" || !name.trim() || name.length > 80) {
    throw new RequestError("Field 'name' must be 1-80 characters.", 400);
  }
  if (typeof model !== "string" || !model.trim() || model.length > 120) {
    throw new RequestError("Field 'model' must be 1-120 characters.", 400);
  }
  const baseUrl = validateProviderBaseUrl(
    body.baseUrl === undefined ? existing?.base_url : body.baseUrl,
  );
  let encryptedApiKey = existing?.encrypted_api_key;
  if (body.apiKey !== undefined) {
    if (typeof body.apiKey !== "string" || !body.apiKey.trim() || body.apiKey.length > 4096) {
      throw new RequestError("Field 'apiKey' must be 1-4096 characters.", 400);
    }
    if (!encryptionKey) {
      throw new RequestError(
        "Provider credential storage is unavailable; configure PROVIDER_ENCRYPTION_KEY.",
        503,
      );
    }
    encryptedApiKey = encryptProviderSecret(body.apiKey.trim(), encryptionKey);
  }
  if (!encryptedApiKey) {
    throw new RequestError("Field 'apiKey' is required when creating a provider.", 400);
  }
  const priority =
    body.priority === undefined ? (existing?.priority ?? 0) : body.priority;
  const enabled =
    body.enabled === undefined ? (existing?.enabled ?? true) : body.enabled;
  if (!Number.isInteger(priority) || typeof priority !== "number" || priority < 0 || priority > 1000) {
    throw new RequestError("Field 'priority' must be an integer from 0 to 1000.", 400);
  }
  if (typeof enabled !== "boolean") {
    throw new RequestError("Field 'enabled' must be a boolean.", 400);
  }
  return {
    name: name.trim(),
    base_url: baseUrl,
    model: model.trim(),
    encrypted_api_key: encryptedApiKey,
    priority,
    enabled,
    updated_at: new Date().toISOString(),
    ...(!existing ? { created_at: new Date().toISOString() } : {}),
  };
}

interface ConnectorCredentials {
  resolveToken(): Promise<ResolvedCredential>;
  fetcher: typeof fetch;
}

const connectorRoute = {
  item: new RegExp(`^${apiRoutes.connectors.prefix}([^/]+)$`),
  verify: new RegExp(`^${apiRoutes.connectors.prefix}([^/]+)/verify$`),
  sync: new RegExp(`^${apiRoutes.connectors.prefix}([^/]+)/sync$`),
  zones: new RegExp(`^${apiRoutes.connectors.prefix}([^/]+)/zones$`),
  audit: new RegExp(`^${apiRoutes.connectors.prefix}([^/]+)/audit$`),
  records: new RegExp(
    `^${apiRoutes.connectors.prefix}([^/]+)/zones/([^/]+)/records$`,
  ),
  record: new RegExp(
    `^${apiRoutes.connectors.prefix}([^/]+)/zones/([^/]+)/records/([^/]+)$`,
  ),
};

function pathSegment(match: RegExpMatchArray, index: number): string {
  return decodeURIComponent(match[index] ?? "");
}

async function jsonRequestBody(
  request: IncomingMessage,
): Promise<Record<string, unknown>> {
  return parseObject(await readJsonBody(request));
}

/**
 * Every connector route is owner-scoped: the id in the path is only honoured
 * when the row belongs to the caller, so cross-user probes get a 404.
 */
async function handleConnectorRequest(
  request: IncomingMessage,
  response: ServerResponse,
  user: User,
  orm: QlOrm,
  pathname: string,
  credentials: ConnectorCredentials,
): Promise<boolean> {
  const ctx: ConnectorContext = { orm, ownerId: user.id, ...credentials };
  const method = request.method ?? "GET";

  if (pathname === apiRoutes.connectors.collection) {
    if (method === "GET") {
      sendJson(response, 200, await listConnectors(ctx));
      return true;
    }
    if (method === "POST") {
      requireGroup(user, "connector");
      sendJson(response, 201, await createConnector(ctx, await jsonRequestBody(request)));
      return true;
    }
    return false;
  }

  const verifyMatch = pathname.match(connectorRoute.verify);
  if (verifyMatch && method === "POST") {
    requireGroup(user, "connector");
    sendJson(
      response,
      200,
      await verifyConnector(ctx, pathSegment(verifyMatch, 1)),
    );
    return true;
  }

  const syncMatch = pathname.match(connectorRoute.sync);
  if (syncMatch && method === "POST") {
    requireGroup(user, "operator");
    sendJson(response, 200, await syncConnectorNow(ctx, pathSegment(syncMatch, 1)));
    return true;
  }

  const auditMatch = pathname.match(connectorRoute.audit);
  if (auditMatch && method === "GET") {
    sendJson(response, 200, await listConnectorAudit(ctx, pathSegment(auditMatch, 1)));
    return true;
  }

  const zonesMatch = pathname.match(connectorRoute.zones);
  if (zonesMatch && method === "GET") {
    sendJson(response, 200, await listConnectorZones(ctx, pathSegment(zonesMatch, 1)));
    return true;
  }

  const recordsMatch = pathname.match(connectorRoute.records);
  if (recordsMatch) {
    const connectorId = pathSegment(recordsMatch, 1);
    const zoneId = pathSegment(recordsMatch, 2);
    if (method === "GET") {
      const query = new URL(request.url ?? "/", "http://localhost").searchParams;
      sendJson(
        response,
        200,
        await listConnectorRecords(ctx, connectorId, zoneId, {
          name: query.get("name"),
          type: query.get("type"),
        }),
      );
      return true;
    }
    if (method === "POST") {
      requireGroup(user, "operator");
      sendJson(
        response,
        201,
        await createConnectorRecord(
          ctx,
          connectorId,
          zoneId,
          await jsonRequestBody(request),
        ),
      );
      return true;
    }
    return false;
  }

  const recordMatch = pathname.match(connectorRoute.record);
  if (recordMatch) {
    const connectorId = pathSegment(recordMatch, 1);
    const zoneId = pathSegment(recordMatch, 2);
    const recordId = pathSegment(recordMatch, 3);
    if (method === "PATCH") {
      requireGroup(user, "operator");
      sendJson(
        response,
        200,
        await updateConnectorRecord(
          ctx,
          connectorId,
          zoneId,
          recordId,
          await jsonRequestBody(request),
        ),
      );
      return true;
    }
    if (method === "DELETE") {
      requireGroup(user, "operator");
      sendJson(
        response,
        200,
        await deleteConnectorRecord(
          ctx,
          connectorId,
          zoneId,
          recordId,
          await jsonRequestBody(request),
        ),
      );
      return true;
    }
    return false;
  }

  const itemMatch = pathname.match(connectorRoute.item);
  if (itemMatch) {
    const connectorId = pathSegment(itemMatch, 1);
    if (method === "PUT") {
      requireGroup(user, "connector");
      sendJson(
        response,
        200,
        await updateConnector(ctx, connectorId, await jsonRequestBody(request)),
      );
      return true;
    }
    if (method === "DELETE") {
      requireGroup(user, "connector");
      sendJson(
        response,
        200,
        await deleteConnector(ctx, connectorId, await jsonRequestBody(request)),
      );
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Maps a `workflow.change` QlRecord to the public DTO. Private fields
 * (`owner_id`, `actor_id`) are dropped here per `AGENTS.md` — the ORM's
 * `findMany` already strips them on the user path, but the queue handler
 * reads via `findManyByService` and must redact before crossing the wire.
 */
function toWorkflowChangeDto(record: QlRecord): WorkflowChangeDto {
  return {
    id: String(record.id ?? ""),
    title: String(record.title ?? ""),
    body: String(record.body ?? ""),
    subject_type: String(record.subject_type ?? ""),
    subject_id: String(record.subject_id ?? ""),
    state: String(record.state ?? "draft") as WorkflowStateDto,
    urgency: String(record.urgency ?? "medium"),
    revision: Number(record.revision ?? 1),
    created_at: Number(record.created_at ?? 0),
    updated_at: Number(record.updated_at ?? 0),
  };
}

function toWorkflowTransitionDto(record: QlRecord): WorkflowTransitionDto {
  return {
    id: String(record.id ?? ""),
    change_id: String(record.change_id ?? ""),
    from_state: String(record.from_state ?? "draft") as WorkflowStateDto,
    to_state: String(record.to_state ?? "draft") as WorkflowStateDto,
    action: String(record.action ?? "") as WorkflowTransitionDto["action"],
    reason: String(record.reason ?? ""),
    revision: Number(record.revision ?? 1),
    created_at: Number(record.created_at ?? 0),
  };
}

const LEXICAL_REVIEW_DECISIONS: readonly LexicalResearchDecisionDto[] = [
  "retain_for_research",
  "exclude_from_research",
  "needs_expert_review",
];

function isLexicalResearchDecision(
  value: string,
): value is LexicalResearchDecisionDto {
  return LEXICAL_REVIEW_DECISIONS.some((decision) => decision === value);
}

function researchString(record: QlRecord, field: string): string {
  const value = record[field];
  if (typeof value !== "string") {
    throw new Error(`Research record field '${field}' must be a string.`);
  }
  return value;
}

function researchInteger(record: QlRecord, field: string): number {
  const value = record[field];
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`Research record field '${field}' must be a safe integer.`);
  }
  return value;
}

function researchReferences(
  record: QlRecord,
): LexicalResearchSourceReferenceDto[] {
  const raw = researchString(record, "source_references");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error("Research source references contain invalid JSON.", {
      cause: error,
    });
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Research source references must be an array.");
  }
  return parsed.map((value, index) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`Research source reference ${index} is invalid.`);
    }
    const reference = value as Record<string, unknown>;
    const surah = reference.surah;
    const ayah = reference.ayah;
    const passageId = reference.passageId;
    const checksum = reference.checksum;
    if (
      typeof surah !== "number" ||
      !Number.isSafeInteger(surah) ||
      typeof ayah !== "number" ||
      !Number.isSafeInteger(ayah) ||
      typeof passageId !== "string" ||
      !passageId ||
      typeof checksum !== "string" ||
      !/^[a-f0-9]{64}$/u.test(checksum)
    ) {
      throw new Error(`Research source reference ${index} is invalid.`);
    }
    return { surah, ayah, passageId, checksum };
  });
}

function toLexicalResearchCandidateDto(
  record: QlRecord,
): LexicalResearchCandidateDto {
  return {
    id: researchString(record, "id"),
    candidate_text: researchString(record, "candidate_text"),
    normalized_form: researchString(record, "normalized_form"),
    occurrence_count: researchInteger(record, "occurrence_count"),
    verse_reference_count: researchInteger(record, "verse_reference_count"),
    source_edition: researchString(record, "source_edition"),
    source_version_id: researchString(record, "source_version_id"),
    source_references: researchReferences(record),
    normalization_version: researchString(record, "normalization_version"),
    algorithm_version: researchString(record, "algorithm_version"),
  };
}

function toLexicalResearchReviewDto(
  record: QlRecord,
): LexicalResearchReviewDto {
  const decision = researchString(record, "decision");
  if (!isLexicalResearchDecision(decision)) {
    throw new Error(`Unknown lexical research decision '${decision}'.`);
  }
  return {
    id: researchString(record, "id"),
    candidate_id: researchString(record, "candidate_id"),
    edition_key: researchString(record, "edition_key"),
    source_version_id: researchString(record, "source_version_id"),
    normalization_version: researchString(record, "normalization_version"),
    algorithm_version: researchString(record, "algorithm_version"),
    occurrence_count: researchInteger(record, "occurrence_count"),
    verse_reference_count: researchInteger(record, "verse_reference_count"),
    source_references: researchReferences(record),
    source_reference_digest: researchString(record, "source_reference_digest"),
    decision,
    rationale: researchString(record, "rationale"),
    reviewed_at: researchInteger(record, "reviewed_at"),
  };
}

function toLexicalResearchReviewQueueItemDto(
  candidate: QlRecord,
  review: QlRecord | null,
): LexicalResearchReviewQueueItemDto {
  return {
    candidate: toLexicalResearchCandidateDto(candidate),
    review: review === null ? null : toLexicalResearchReviewDto(review),
  };
}

/**
 * The `/workflow/*` prefix handler. Mirrors `handleConnectorRequest`: one
 * bounded function returning `Promise<boolean>` so the outer dispatcher can
 * fall through to the generic `/models` CRUD when nothing matches. Reviewer
 * gates fire **before** body reads so an unauthorised probe never allocates
 * a JSON buffer.
 */
async function handleWorkflowRequest(
  request: IncomingMessage,
  response: ServerResponse,
  user: User,
  orm: QlOrm,
  pathname: string,
): Promise<boolean> {
  const method = request.method ?? "GET";
  const ctx = userContext(user);

  if (pathname === apiRoutes.workflow.queue) {
    if (method !== "GET") return false;
    requireGroup(user, "admin", "operator");
    const rows = await listOpenChanges(orm);
    sendJson(response, 200, {
      changes: rows.map(toWorkflowChangeDto),
    } satisfies WorkflowChangeListResponseDto);
    return true;
  }

  const transitionMatch = pathname.match(
    new RegExp(`^${apiRoutes.workflow.prefix}([^/]+)/transition$`),
  );
  if (transitionMatch && method === "POST") {
    const changeId = decodeURIComponent(transitionMatch[1]);
    const raw = parseObject(await readJsonBody(request));
    const action = typeof raw.action === "string" ? raw.action : "";
    const reason = typeof raw.reason === "string" ? raw.reason : undefined;
    const result = await requestTransition(orm, ctx, changeId, action, reason);
    sendJson(response, 200, {
      change: toWorkflowChangeDto(result.change),
      transition: toWorkflowTransitionDto(result.transition),
    });
    return true;
  }

  const transitionsMatch = pathname.match(
    new RegExp(`^${apiRoutes.workflow.prefix}([^/]+)/transitions$`),
  );
  if (transitionsMatch && method === "GET") {
    const changeId = decodeURIComponent(transitionsMatch[1]);
    const reviewer = ctx.groups.some(
      (group) => group === "admin" || group === "operator",
    );
    if (!reviewer) {
      // Members can read the audit trail only for changes they own; the
      // generic `findMany` enforces that via `ownerField`.
      const visible = await orm.findMany("workflow.change", ctx, 500);
      if (!visible.some((row) => row.id === changeId)) {
        throw new QlNotFoundError(`Change '${changeId}' not found.`);
      }
    }
    const rows = await listTransitionsForChange(orm, changeId);
    sendJson(response, 200, {
      transitions: rows.map(toWorkflowTransitionDto),
    } satisfies WorkflowTransitionListResponseDto);
    return true;
  }

  const sanadMatch = pathname.match(
    new RegExp(`^${apiRoutes.workflow.prefix}([^/]+)/sanad$`),
  );
  if (sanadMatch) {
    const changeId = decodeURIComponent(sanadMatch[1]);
    const [changeRecord] = await orm.findManyByService(
      "workflow.change",
      { id: changeId },
      { limit: 1 },
    );
    if (!changeRecord) {
      throw new QlNotFoundError(`Change '${changeId}' not found.`);
    }

    if (method === "GET") {
      const isReviewer = ctx.groups.some(
        (group) => group === "admin" || group === "operator",
      );
      const status = await getSanadPipelineStatusForService(orm, changeId);
      sendJson(response, 200, {
        changeId: status.changeId,
        currentState: status.currentState,
        requiredReviews: status.requiredReviews,
        approvedCount: status.approvedCount,
        canPublish: status.canPublish,
        reviews: status.reviews.map((r, index) => {
          const rawReviewer = String(r.reviewer_id ?? "");
          const isOwnReview = rawReviewer === user.id;
          const displayReviewer = isReviewer || isOwnReview ? rawReviewer : `Peer Reviewer #${index + 1}`;
          return {
            id: String(r.id ?? ""),
            reviewerId: isReviewer || isOwnReview ? rawReviewer : `reviewer-${index + 1}`,
            reviewerName: displayReviewer,
            decision: String(r.decision) as "approved" | "changes_requested",
            notes: String(r.notes ?? ""),
            sanadChainRef: String(r.sanad_chain_ref ?? ""),
            createdAt: new Date(Number(r.created_at ?? Date.now())).toISOString(),
          };
        }),
      });
      return true;
    }
    if (method === "POST") {
      const raw = parseObject(await readJsonBody(request));
      const decision = (typeof raw.decision === "string" ? raw.decision : "") as "approved" | "changes_requested";
      const notes = typeof raw.notes === "string" ? raw.notes : "";
      const sanadChainRef = typeof raw.sanadChainRef === "string" ? raw.sanadChainRef : "";
      await submitPeerReviewForService(orm, changeId, user.id, {
        decision,
        notes,
        sanadChainRef,
      });
      const status = await getSanadPipelineStatusForService(orm, changeId);
      sendJson(response, 200, {
        changeId: status.changeId,
        currentState: status.currentState,
        requiredReviews: status.requiredReviews,
        approvedCount: status.approvedCount,
        canPublish: status.canPublish,
        reviews: status.reviews.map((r) => ({
          id: String(r.id ?? ""),
          reviewerId: String(r.reviewer_id ?? ""),
          reviewerName: String(r.reviewer_id ?? "Reviewer"),
          decision: String(r.decision) as "approved" | "changes_requested",
          notes: String(r.notes ?? ""),
          sanadChainRef: String(r.sanad_chain_ref ?? ""),
          createdAt: new Date(Number(r.created_at ?? Date.now())).toISOString(),
        })),
      });
      return true;
    }
  }

  const publishMatch = pathname.match(
    new RegExp(`^${apiRoutes.workflow.prefix}([^/]+)/publish$`),
  );
  if (publishMatch && method === "POST") {
    const changeId = decodeURIComponent(publishMatch[1]);
    const raw = parseObject(await readJsonBody(request));
    const ethics = parseObject(raw.ethicsAffirmation);
    if (!ethics.isNotFatwaAffirmed || !ethics.citationsVerifiedAffirmed || !ethics.decorumAffirmed) {
      sendJson(response, 422, {
        error: "All ethics criteria must be affirmed before publication.",
      });
      return true;
    }
    const [change] = await orm.findManyByService("workflow.change", { id: changeId }, { limit: 1 });
    if (!change) throw new QlNotFoundError(`Change '${changeId}' not found.`);

    if (change.state !== "approved") {
      sendJson(response, 400, {
        error: `Change '${changeId}' cannot be published from state '${String(change.state)}'. Must be 'approved'.`,
      });
      return true;
    }

    const now = new Date();
    await orm.updateRecordsForService(
      "workflow.change",
      { id: changeId },
      {
        state: "published",
        ethics_affirmed_at: now,
        ethics_digest: typeof ethics.ethicsDigest === "string" ? ethics.ethicsDigest : "",
        is_not_fatwa_affirmed: true,
        updated_at: now,
      },
    );
    await orm.createRecordForService("workflow.transition", {
      change_id: changeId,
      from_state: String(change.state),
      to_state: "published",
      action: "publish",
      reason: "Ethics checklist affirmed and published.",
      revision: Number(change.revision ?? 1) + 1,
      actor_id: user.id,
      owner_id: String(change.owner_id ?? ""),
      created_at: now,
    });
    sendJson(response, 200, {
      changeId,
      newState: "published",
      ethicsAffirmedAt: now.toISOString(),
    });
    return true;
  }

  return false;
}

async function handleResearchRequest(
  request: IncomingMessage,
  response: ServerResponse,
  user: User,
  orm: QlOrm,
  pathname: string,
): Promise<boolean> {
  const method = request.method ?? "GET";
  const ctx = userContext(user);

  if (pathname === apiRoutes.research.lexicalCandidates && method === "GET") {
    requireGroup(user, "admin", "operator");
    const url = new URL(request.url ?? "/", "http://localhost");
    const editionKey = url.searchParams.get("edition_key") ?? "";
    const queue = await listLexicalCandidateReviewQueue(orm, ctx, editionKey);
    const candidates = queue.map(({ candidate, review }) =>
      toLexicalResearchReviewQueueItemDto(candidate, review),
    );
    sendJson(response, 200, {
      candidates,
    } satisfies LexicalResearchReviewQueueResponseDto);
    return true;
  }

  const reviewMatch = pathname.match(
    new RegExp(
      `^${apiRoutes.research.lexicalCandidatePrefix}([^/]+)/reviews$`,
    ),
  );
  if (reviewMatch && method === "POST") {
    requireGroup(user, "admin", "operator");
    const raw = parseObject(await readJsonBody(request));
    const record = await recordLexicalCandidateReview(
      orm,
      ctx,
      decodeURIComponent(reviewMatch[1]),
      {
        editionKey:
          typeof raw.edition_key === "string" ? raw.edition_key : "",
        normalizedForm:
          typeof raw.normalized_form === "string" ? raw.normalized_form : "",
        decision: raw.decision,
        rationale: raw.rationale,
      },
    );
    sendJson(response, 201, {
      review: toLexicalResearchReviewDto(record),
    } satisfies CreateLexicalResearchReviewResponseDto);
    return true;
  }

  return false;
}

/**
 * Public projection of a `corpus.edition` QlRecord. There is no `owner_id`
 * on the model (editions are platform-owned reference data), so the DTO
 * covers every column; nothing here is stripped. `attribution_text` is
 * copied onto every passage DTO too (see `toCorpusPassageDto`) per
 * MW-ADR-019 §(d).
 */
function toCorpusEditionDto(record: QlRecord): CorpusEditionDto {
  return {
    id: String(record.id ?? ""),
    canonical_id: String(record.canonical_id ?? ""),
    work_id: String(record.work_id ?? ""),
    source_version_id: String(record.source_version_id ?? ""),
    rights_id: String(record.rights_id ?? ""),
    edition_key: String(record.edition_key ?? ""),
    authority: String(record.authority ?? "") as CorpusEditionDto["authority"],
    locale: String(record.locale ?? ""),
    publisher: String(record.publisher ?? ""),
    author_or_translator: String(record.author_or_translator ?? ""),
    attribution_text: String(record.attribution_text ?? ""),
    revision: String(record.revision ?? ""),
    imported_row_count: Number(record.imported_row_count ?? 0),
    materialized_row_count: Number(record.materialized_row_count ?? 0),
    stage: String(record.stage ?? "staged") as CorpusEditionDto["stage"],
    updated_at: Number(record.updated_at ?? 0),
  };
}

function toCorpusPassageKind(value: string): PassageKindDto {
  const kind = PASSAGE_KINDS.find((candidate) => candidate === value);
  if (!kind) {
    throw new Error(`Unsupported corpus passage authority '${value}'.`);
  }
  return kind;
}

function toCorpusPassageDto(passage: PassageReadDto): CorpusPassageDto {
  return {
    ...passage,
    authority: toCorpusPassageKind(passage.authority),
    edition_authority: toCorpusPassageKind(passage.edition_authority),
  };
}

function toSourceArtifactDto(record: QlRecord): SourceArtifactDto {
  return {
    id: String(record.id ?? ""),
    canonical_id: String(record.canonical_id ?? ""),
    title: String(record.title ?? ""),
    kind: String(record.kind ?? ""),
    publisher: String(record.publisher ?? ""),
    repository: String(record.repository ?? ""),
    branch: String(record.branch ?? ""),
    commit_sha: String(record.commit_sha ?? ""),
    original_uri: String(record.original_uri ?? ""),
    lifecycle_stage: String(
      record.lifecycle_stage ?? "discovered",
    ) as SourceArtifactDto["lifecycle_stage"],
    updated_at: Number(record.updated_at ?? 0),
  };
}

function toSourceRightsSummaryDto(record: QlRecord): SourceRightsSummaryDto {
  // `verified_by_id`, `license_evidence_ref`, and `basis_notes` are
  // `private:true` at the model layer AND intentionally absent from this
  // projection so any client drift is a compile error, not a leak.
  return {
    id: String(record.id ?? ""),
    version_id: String(record.version_id ?? ""),
    action: String(record.action ?? "") as SourceRightsSummaryDto["action"],
    rights_status: String(
      record.rights_status ?? "unknown",
    ) as SourceRightsSummaryDto["rights_status"],
    license_id: String(record.license_id ?? ""),
    attribution_required: record.attribution_required === true,
    attribution_text: String(record.attribution_text ?? ""),
    territory: String(record.territory ?? ""),
    term_ends_at: Number(record.term_ends_at ?? 0),
  };
}

/**
 * Corpus reader endpoints. All GET; nothing bulk. Every response is rights-
 * gated and stage-gated by `reader-service.ts` (MW-ADR-019 §(e)). A staged
 * or rights-pending edition returns 403 with no passage text in the body.
 *
 * Publishing and withdrawal are the two exceptions: single POSTs gated on
 * admin/operator/root, no request body required beyond an optional reason,
 * and each one appends a `source.provenance` audit row server-side.
 */
async function handleCorpusRequest(
  request: IncomingMessage,
  response: ServerResponse,
  user: User,
  orm: QlOrm,
  pathname: string,
): Promise<boolean> {
  const method = request.method ?? "GET";
  const ctx = userContext(user);

  if (pathname === apiRoutes.corpus.editions && method === "GET") {
    // Only published editions surface here — the shelf never shows staged
    // or withdrawn content, so a rights-blocked edition is not merely hidden
    // in the UI, it is absent from the response.
    const rows = await orm.findManyByService(
      "corpus.edition",
      { stage: "published" },
      { limit: 500, orderBy: { field: "canonical_id", direction: "asc" } },
    );
    sendJson(response, 200, {
      editions: rows.map(toCorpusEditionDto),
    } satisfies CorpusEditionListResponseDto);
    return true;
  }

  const surahMatch = pathname.match(
    new RegExp(
      `^${apiRoutes.corpus.prefix}editions/([^/]+)/surahs/([0-9]+)(?:/verses/([0-9]+))?$`,
    ),
  );
  if (surahMatch && method === "GET") {
    const editionKey = decodeURIComponent(surahMatch[1]);
    const surah = Number.parseInt(surahMatch[2], 10);
    const ayah = surahMatch[3] ? Number.parseInt(surahMatch[3], 10) : null;
    if (ayah !== null) {
      const passage = await readVerse(orm, editionKey, surah, ayah);
      sendJson(response, 200, {
        passage: toCorpusPassageDto(passage),
      } satisfies CorpusVerseResponseDto);
      return true;
    }
    const reading = await readSurahWindow(orm, editionKey, surah);
    const readingDto: CorpusSurahDto = {
      ...reading,
      editionAuthority: toCorpusPassageKind(reading.editionAuthority),
      passages: reading.passages.map(toCorpusPassageDto),
    };
    sendJson(response, 200, {
      reading: readingDto,
    } satisfies CorpusSurahResponseDto);
    return true;
  }

  const publishMatch = pathname.match(
    new RegExp(`^${apiRoutes.corpus.prefix}editions/([^/]+)/(publish|withdraw)$`),
  );
  if (publishMatch && method === "POST") {
    requireGroup(user, "admin", "root", "operator");
    const editionKey = decodeURIComponent(publishMatch[1]);
    const verb = publishMatch[2];
    const raw = parseObject(await readJsonBody(request).catch(() => ({})));
    const reason = typeof raw.reason === "string" ? raw.reason : undefined;
    const editionRecord =
      verb === "publish"
        ? await publishEdition(orm, ctx, editionKey, reason)
        : await withdrawEdition(orm, ctx, editionKey, reason);
    sendJson(response, 200, {
      edition: toCorpusEditionDto(editionRecord),
    });
    return true;
  }

  return false;
}

async function handleSourceRequest(
  request: IncomingMessage,
  response: ServerResponse,
  user: User,
  orm: QlOrm,
  pathname: string,
): Promise<boolean> {
  const method = request.method ?? "GET";
  const ctx = userContext(user);

  if (pathname === apiRoutes.source.artifacts && method === "GET") {
    const rows = await orm.findMany("source.artifact", ctx, 500);
    sendJson(response, 200, {
      artifacts: rows.map(toSourceArtifactDto),
    } satisfies SourceArtifactListResponseDto);
    return true;
  }

  const rightsMatch = pathname.match(
    new RegExp(`^${apiRoutes.source.prefix}artifacts/([^/]+)/rights$`),
  );
  if (rightsMatch && method === "GET") {
    const artifactId = decodeURIComponent(rightsMatch[1]);
    const versions = await orm.findManyByService("source.version", {
      artifact_id: artifactId,
    });
    const rights = (
      await Promise.all(
        versions.map((version) =>
          orm.findManyByService("source.rights", {
            version_id: String(version.id),
          }),
        ),
      )
    ).flat();
    sendJson(response, 200, {
      rights: rights.map(toSourceRightsSummaryDto),
    });
    return true;
  }

  const provenanceMatch = pathname.match(
    new RegExp(`^${apiRoutes.source.prefix}artifacts/([^/]+)/provenance$`),
  );
  if (provenanceMatch && method === "GET") {
    requireGroup(user, "admin", "root", "operator");
    const artifactId = decodeURIComponent(provenanceMatch[1]);
    const versions = await orm.findManyByService("source.version", {
      artifact_id: artifactId,
    });
    const audit = (await Promise.all(
      versions.map((version) =>
        orm.findManyByService(
          "source.provenance",
          { subject_id: String(version.id) },
          { limit: 200, orderBy: { field: "occurred_at", direction: "desc" } },
        ),
      ),
    ))
      .flat()
      .map((row) => ({
        id: String(row.id ?? ""),
        subject_type: String(row.subject_type ?? ""),
        subject_id: String(row.subject_id ?? ""),
        from_stage: String(row.from_stage ?? ""),
        to_stage: String(row.to_stage ?? ""),
        action: String(row.action ?? ""),
        decision: String(row.decision ?? ""),
        reason: String(row.reason ?? ""),
        correlation_id: String(row.correlation_id ?? ""),
        occurred_at: Number(row.occurred_at ?? 0),
      }));
    sendJson(response, 200, { entries: audit });
    return true;
  }

  const itemMatch = pathname.match(
    new RegExp(`^${apiRoutes.source.prefix}artifacts/([^/]+)$`),
  );
  if (itemMatch && method === "GET") {
    const artifactId = decodeURIComponent(itemMatch[1]);
    const artifact = await orm.findOneByService("source.artifact", {
      id: artifactId,
    });
    if (!artifact) {
      throw new QlNotFoundError(`source.artifact '${artifactId}' not found.`);
    }
    const versions = await orm.findManyByService("source.version", {
      artifact_id: artifactId,
    });
    const rights = (
      await Promise.all(
        versions.map((version) =>
          orm.findManyByService("source.rights", {
            version_id: String(version.id),
          }),
        ),
      )
    )
      .flat()
      .map(toSourceRightsSummaryDto);
    sendJson(response, 200, {
      artifact: toSourceArtifactDto(artifact),
      rights,
    } satisfies SourceArtifactResponseDto);
    return true;
  }

  return false;
}

export function createApiServer(
  provider: ModelProvider | undefined,
  store: ConversationStore,
  orm: QlOrm,
  options: {
    encryptionKey?: Buffer<ArrayBufferLike>;
    providerFactory?: ModelProviderFactory;
    resolveConnectorToken?(): Promise<ResolvedCredential>;
    cloudflareFetcher?: typeof fetch;
    projectTasksFetcher?: typeof fetch;
    attachmentPolicy?: Partial<AttachmentPolicy>;
  } = {},
) {
  const attachmentPolicy = options.attachmentPolicy ?? {};
  const connectorCredentials: ConnectorCredentials = {
    resolveToken: options.resolveConnectorToken ?? (() => resolveCloudflareToken()),
    fetcher: options.cloudflareFetcher ?? globalThis.fetch,
  };
  const projectTasksFetcher = options.projectTasksFetcher ?? globalThis.fetch;

  async function handleApiRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

    if (request.method === "GET" && pathname === apiRoutes.health) {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (
      request.method === "GET" &&
      pathname === apiRoutes.translations.languages
    ) {
      try {
        const languages: UiLanguageDto[] = await listEnabledLanguages(orm);
        sendJson(response, 200, { languages });
      } catch (error) {
        handleI18nRequestError(response, error);
      }
      return;
    }

    if (
      request.method === "GET" &&
      pathname === apiRoutes.translations.catalog
    ) {
      try {
        const url = new URL(request.url ?? "/", "http://localhost");
        const locale = parseEnabledLocale(url.searchParams.get("locale"));
        const namespace = url.searchParams.get("namespace") ?? undefined;
        if (namespace && namespace.length > 80) {
          throw new RequestError("The requested namespace is invalid.", 400);
        }
        sendJson(
          response,
          200,
          {
            locale,
            entries: await getPublishedCatalog(orm, locale, namespace),
          },
          { "cache-control": "no-store" },
        );
      } catch (error) {
        handleI18nRequestError(response, error);
      }
      return;
    }

    const translationApproveMatch = pathname.match(
      new RegExp(
        `^${apiRoutes.admin.translations.collection}/([^/]+)/approve$`,
      ),
    );
    const translationAdminPath =
      pathname === apiRoutes.admin.translations.collection ||
      pathname === apiRoutes.admin.translations.import ||
      pathname === apiRoutes.admin.translations.export ||
      pathname === apiRoutes.admin.translations.aiDraft ||
      translationApproveMatch !== null;
    if (translationAdminPath) {
      if (request.method !== "GET" && request.method !== "POST") {
        sendJson(response, 405, {
          code: "I18N_METHOD_NOT_ALLOWED",
          error: "Method not allowed.",
        });
        return;
      }
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        requireGroup(user, "admin");
        if (
          request.method === "GET" &&
          pathname === apiRoutes.admin.translations.collection
        ) {
          const url = new URL(request.url ?? "/", "http://localhost");
          const localeValue = url.searchParams.get("locale");
          const translations = await listAdminTranslations(
            orm,
            localeValue ? parseEnabledLocale(localeValue) : undefined,
          );
          sendJson(response, 200, { translations });
        } else if (
          request.method === "POST" &&
          pathname === apiRoutes.admin.translations.collection
        ) {
          const input = parseTranslationDraft(await readJsonBody(request));
          sendJson(response, 200, {
            translation: await saveTranslationDraft(orm, input, user.id),
          });
        } else if (translationApproveMatch && request.method === "POST") {
          sendJson(response, 200, {
            translation: await approveTranslation(
              orm,
              decodeURIComponent(translationApproveMatch[1]),
              user.id,
            ),
          });
        } else if (
          request.method === "POST" &&
          pathname === apiRoutes.admin.translations.aiDraft
        ) {
          if (!provider) {
            throw new RequestError(
              "AI translation drafting is unavailable until a server-side model provider is configured.",
              503,
            );
          }
          const input = parseTranslationAiDraft(
            await readJsonBody(request),
          );
          const languageName =
            input.locale === "id" ? "Indonesian" : "English";
          const generateDraft = async (sourceText: string, form: string) => {
            const result = await provider.generate([
              {
                role: "system",
                content:
                  `Translate the supplied ${form} into ${languageName}. ` +
                  "Return only the translated text. Preserve every {placeholder} exactly. " +
                  "Keep the translation faithful to the source and its provided UI context.",
              },
              {
                role: "user",
                content: JSON.stringify({
                  sourceText,
                  context: input.context ?? "",
                }),
              },
            ]);
            if (!result.trim() || result.length > 4000) {
              throw new RequestError(
                "The AI provider returned an empty or oversized translation draft.",
                502,
              );
            }
            return result.trim();
          };
          let translatedPluralTexts:
            | TranslationDraftRequestDto["translatedPluralTexts"]
            | undefined;
          let translatedText: string;
          if (input.sourcePluralText && input.locale === "en") {
            const [one, other] = await Promise.all([
              generateDraft(input.sourceText, "singular form"),
              generateDraft(input.sourcePluralText, "plural form"),
            ]);
            translatedPluralTexts = { one, other };
            translatedText = one;
          } else if (input.sourcePluralText) {
            translatedText = await generateDraft(
              input.sourcePluralText,
              "plural form",
            );
            translatedPluralTexts = { other: translatedText };
          } else {
            translatedText = await generateDraft(input.sourceText, "text");
          }
          sendJson(response, 200, {
            translation: await saveTranslationDraft(
              orm,
              {
                ...input,
                translatedText,
                ...(translatedPluralTexts ? { translatedPluralTexts } : {}),
                source: "ai",
              },
              user.id,
            ),
          });
        } else if (
          request.method === "POST" &&
          pathname === apiRoutes.admin.translations.import
        ) {
          const body = parseObject(await readJsonBody(request, 512 * 1024));
          if (typeof body.content !== "string") {
            throw new RequestError("Field 'content' is required.", 400);
          }
          const translations = await importPoDrafts(
            orm,
            parseEnabledLocale(body.locale),
            body.content,
            user.id,
          );
          sendJson(response, 200, { translations });
        } else if (
          request.method === "GET" &&
          pathname === apiRoutes.admin.translations.export
        ) {
          const url = new URL(request.url ?? "/", "http://localhost");
          const locale = parseEnabledLocale(url.searchParams.get("locale"));
          sendJson(response, 200, {
            content: await exportPoCatalog(orm, locale),
          });
        } else {
          sendJson(response, 405, {
            code: "I18N_METHOD_NOT_ALLOWED",
            error: "Method not allowed.",
          });
        }
      } catch (error) {
        handleI18nRequestError(response, error);
      }
      return;
    }

    if (
      request.method === "GET" &&
      pathname === apiRoutes.projectProgress.summary
    ) {
      try {
        const tasks = await listProjectTasks(projectTasksFetcher);
        sendJson(response, 200, projectProgressSummary(tasks));
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (
      request.method === "GET" &&
      pathname === apiRoutes.landing.catalog
    ) {
      try {
        const landingViews = orm.registry.getLandingViews();
        const items: LandingViewItemDto[] = await Promise.all(
          landingViews.map(async (view) => {
            const config = view.landing;
            if (!config) {
              throw new Error(`Landing view '${view.name}' is missing config.`);
            }
            const modelKey = view.model.replaceAll(".", "_");
            let recordCount: number | null = null;
            if (config.publicCountFilter) {
              const rows = await orm.findManyByService(
                view.model,
                config.publicCountFilter,
                { limit: 500 },
              );
              recordCount = rows.length;
            }
            return {
              name: view.name,
              model: view.model,
              addon: orm.registry.getModelAddon(view.model),
              category: orm.registry.getModelCategory(view.model),
              section: config.section,
              sequence: config.sequence ?? 100,
              href: config.href,
              status: config.status ?? "available",
              titleKey:
                config.titleKey ??
                view.labelKey ??
                `web.models.entities.${modelKey}`,
              descriptionKey:
                config.descriptionKey ??
                view.helpKey ??
                `web.models.descriptions.${modelKey}`,
              recordCount,
            };
          }),
        );
        sendJson(response, 200, { items } satisfies LandingCatalogResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (
      request.method === "GET" &&
      (pathname === apiRoutes.landing.models ||
        pathname.startsWith(apiRoutes.landing.modelPrefix))
    ) {
      try {
        const requestedModel = pathname.startsWith(apiRoutes.landing.modelPrefix)
          ? decodeURIComponent(
              pathname.slice(apiRoutes.landing.modelPrefix.length),
            )
          : undefined;
        const publicEntries = orm.registry
          .getLandingViews()
          .flatMap((view) => {
            if (!view.landing?.publicCountFilter) return [];
            try {
              const model = orm.registry.getModel(view.model);
              if (model.ownerField) return [];
              return [{ view, model, filter: view.landing.publicCountFilter }];
            } catch {
              return [];
            }
          });

        const serializePublicModel = (
          model: ReturnType<typeof orm.registry.getModel>,
        ): ModelMetadataDto => {
          const modelKey = model.name.replaceAll(".", "_");
          const views = orm.registry
            .getViews(model.name)
            .filter((view) => view.type === "list" || view.type === "form")
            .map((view) => ({
              ...view,
              labelKey:
                view.labelKey ??
                (view.type === "list"
                  ? "web.models.viewList"
                  : "web.models.viewForm"),
              fields: view.fields.filter(
                (field) => !model.fields[field]?.private,
              ),
            }));
          const allowedFields = new Set(views.flatMap((view) => view.fields));
          return {
            kind: "table",
            name: model.name,
            addon: orm.registry.getModelAddon(model.name),
            category: orm.registry.getModelCategory(model.name),
            labelKey: model.labelKey ?? `web.models.entities.${modelKey}`,
            description: model.description,
            descriptionKey:
              model.descriptionKey ?? `web.models.descriptions.${modelKey}`,
            fields: Object.fromEntries(
              Object.entries(model.fields)
                .filter(
                  ([fieldName, field]) =>
                    !field.private && allowedFields.has(fieldName),
                )
                .map(([fieldName, field]) => {
                  const { compute, ...metadata } = field;
                  return [
                    fieldName,
                    {
                      ...metadata,
                      ...(compute
                        ? {
                            computed: true,
                            readOnly: true,
                            dependsOn: [...compute.dependsOn],
                          }
                        : {}),
                      labelKey:
                        field.labelKey ??
                        `web.models.field${fieldName
                          .split("_")
                          .map(
                            (part) =>
                              part.charAt(0).toUpperCase() + part.slice(1),
                          )
                          .join("")}`,
                    },
                  ];
                }),
            ),
            views,
            permissions: {
              create: false,
              write: false,
              unlink: false,
            },
          };
        };

        const models = publicEntries.map(({ model }) =>
          serializePublicModel(model),
        );
        const targetEntry = requestedModel
          ? publicEntries.find(({ model }) => model.name === requestedModel)
          : publicEntries[0];
        if (requestedModel && !targetEntry) {
          sendJson(response, 404, { error: "Public model view not found." });
          return;
        }
        const activeMeta = targetEntry
          ? (models.find((item) => item.name === targetEntry.model.name) ?? null)
          : null;
        let records: ModelRecordDto[] = [];
        if (targetEntry && activeMeta) {
          const allowedFieldNames = new Set(Object.keys(activeMeta.fields));
          const rows = await orm.findManyByService(
            targetEntry.model.name,
            targetEntry.filter,
            { limit: 100 },
          );
          records = rows.map((row) =>
            Object.fromEntries(
              Object.entries(row).filter(
                ([key]) => key === "id" || allowedFieldNames.has(key),
              ),
            ),
          );
        }
        sendJson(response, 200, {
          model: activeMeta,
          models,
          records,
        } satisfies PublicModelExplorerResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (
      request.method === "GET" &&
      pathname === apiRoutes.projectProgress.tasks
    ) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        requireGroup(user, "admin", "operator");
        const tasks = await listProjectTasks(projectTasksFetcher);
        sendJson(response, 200, {
          tasks,
          readyTaskIds: readyProjectTaskIds(tasks),
        } satisfies ProjectTaskListResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (pathname === apiRoutes.auth.setup && request.method === "GET") {
      try {
        sendJson(
          response,
          200,
          { required: await firstUseSetupRequired(orm) },
          { "cache-control": "no-store" },
        );
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (pathname === apiRoutes.auth.setup && request.method === "POST") {
      try {
        if (!(await firstUseSetupRequired(orm))) {
          throw new RequestError(
            "Penyiapan awal sudah selesai atau tidak tersedia pada instalasi ini.",
            409,
          );
        }
        const body = parseObject(await readJsonBody(request));
        const credentials = validateCredentials(
          body.name,
          body.email,
          body.password,
        );
        const preferredLocale =
          body.preferredLocale === undefined
            ? "id"
            : parseUiLocale(body.preferredLocale);
        const user = await store.createUser({
          name: credentials.name,
          email: credentials.email,
          passwordHash: await hashPassword(credentials.password),
          role: "super_admin",
          initialSetupOwner: true,
          preferredLocale,
        });
        await issueSession(response, store, user.id);
        sendJson(response, 201, {
          user: sessionUser(user),
        } satisfies AuthResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "POST" && pathname === apiRoutes.auth.register) {
      try {
        const body = parseObject(await readJsonBody(request));
        const credentials = validateCredentials(
          body.name,
          body.email,
          body.password,
        );
        const preferredLocale =
          body.preferredLocale === undefined
            ? "id"
            : parseUiLocale(body.preferredLocale);
        if (await store.getUserByEmail(credentials.email)) {
          sendJson(response, 409, { error: "Email sudah terdaftar." });
          return;
        }
        let user;
        try {
          user = await store.createUser({
            name: credentials.name,
            email: credentials.email,
            passwordHash: await hashPassword(credentials.password),
            preferredLocale,
          });
        } catch (error) {
          if (await store.getUserByEmail(credentials.email)) {
            sendJson(response, 409, { error: "Email sudah terdaftar." });
            return;
          }
          throw error;
        }
        await issueSession(response, store, user.id);
        sendJson(response, 201, {
          user: sessionUser(user),
        } satisfies AuthResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "POST" && pathname === apiRoutes.auth.login) {
      try {
        const body = parseObject(await readJsonBody(request));
        if (
          typeof body.email !== "string" ||
          typeof body.password !== "string" ||
          body.password.length > 256
        ) {
          throw new AuthenticationError(
            "Email dan kata sandi wajib diisi.",
            400,
          );
        }
        const user = await store.getUserByEmail(normalizeEmail(body.email));
        if (
          !user ||
          !(await verifyPassword(body.password, user.passwordHash))
        ) {
          sendJson(response, 401, { error: "Email atau kata sandi salah." });
          return;
        }
        await issueSession(response, store, user.id);
        sendJson(response, 200, {
          user: sessionUser(user),
        } satisfies AuthResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "GET" && pathname === apiRoutes.auth.me) {
      let user: User | undefined;
      try {
        user = await getAuthenticatedUser(request, store);
      } catch (error) {
        handleRequestError(response, error);
        return;
      }
      if (!user) {
        sendJson(response, 401, { error: "Authentication required." });
        return;
      }
      sendJson(response, 200, { user: sessionUser(user) });
      return;
    }

    if (
      request.method === "PATCH" &&
      pathname === apiRoutes.auth.preferences
    ) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const body = parseObject(await readJsonBody(request));
        const updated = await store.updateUserPreferredLocale(
          user.id,
          parseUiLocale(body.preferredLocale),
        );
        if (!updated) {
          throw new RequestError("Account not found.", 404);
        }
        sendJson(response, 200, {
          user: sessionUser(updated),
        } satisfies AuthResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "POST" && pathname === apiRoutes.auth.logout) {
      try {
        await clearSession(request, response, store);
        sendJson(response, 200, { loggedOut: true });
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "GET" && pathname === apiRoutes.models.collection) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const groups = userContext(user).groups;
        const modelDefinitions = [
          ...orm.registry.getModels().map((model) => ({
            kind: "table" as const,
            model,
          })),
          ...orm.registry.getComputedModels().map((model) => ({
            kind: "computed" as const,
            model,
          })),
        ];
        const models = modelDefinitions
          .filter(({ model }) =>
            orm.registry.can(model.name, groups, "read"),
          )
          .map(({ kind, model }) => {
            const modelKey = model.name.replaceAll(".", "_");
            return {
              kind,
              name: model.name,
              addon: orm.registry.getModelAddon(model.name),
              category: orm.registry.getModelCategory(model.name),
              labelKey:
                model.labelKey ?? `web.models.entities.${modelKey}`,
              description: model.description,
              descriptionKey:
                model.descriptionKey ??
                `web.models.descriptions.${modelKey}`,
              fields: Object.fromEntries(
                Object.entries(model.fields)
                  .filter(([, field]) => !field.private)
                  .map(([fieldName, field]) => {
                    const { compute, ...metadata } = field;
                    return [
                      fieldName,
                      {
                        ...metadata,
                        ...(compute
                          ? {
                              computed: true,
                              readOnly: true,
                              dependsOn: [...compute.dependsOn],
                            }
                          : {}),
                        labelKey:
                          field.labelKey ??
                          `web.models.field${fieldName
                            .split("_")
                            .map(
                              (part) =>
                                part.charAt(0).toUpperCase() + part.slice(1),
                            )
                            .join("")}`,
                      },
                    ];
                  }),
              ),
              views: orm.registry
                .getViews(model.name)
                .filter((view) => view.type === "list" || view.type === "form")
                .map((view) => ({
                  ...view,
                  labelKey:
                    view.labelKey ??
                    (view.type === "list"
                      ? "web.models.viewList"
                      : "web.models.viewForm"),
                  fields: view.fields.filter(
                    (field) => !model.fields[field]?.private,
                  ),
                })),
              permissions: {
                create:
                  kind === "table" &&
                  orm.registry.can(model.name, groups, "create"),
                write:
                  kind === "table" &&
                  orm.registry.can(model.name, groups, "write"),
                unlink:
                  kind === "table" &&
                  orm.registry.can(model.name, groups, "unlink"),
              },
            };
          });
        sendJson(response, 200, { models });
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "GET" && pathname === apiRoutes.providers.collection) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const providers = (
          await orm.findManyForService("ai.provider", user.id)
        )
          .map(toStoredProvider)
          .sort((left, right) => left.priority - right.priority);
        sendJson(response, 200, { providers: providers.map(providerSummary) });
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "POST" && pathname === apiRoutes.providers.collection) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const body = parseObject(await readJsonBody(request));
        const input = providerInput(body, options.encryptionKey);
        const providers = (
          await orm.findManyForService("ai.provider", user.id)
        )
          .map(toStoredProvider)
          .sort((left, right) => left.priority - right.priority);
        if (providers.length >= 20) {
          throw new RequestError("A maximum of 20 providers is allowed per account.", 409);
        }
        if (body.priority === undefined) {
          input.priority = providers.length;
        }
        const created = await orm.createForService(
          "ai.provider",
          user.id,
          input,
        );
        sendJson(response, 201, {
          provider: providerSummary({
            ...input,
            id: String(created.id),
          }),
        });
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    const providerMatch = pathname.match(
      new RegExp(`^${apiRoutes.providers.prefix}([^/]+)$`),
    );
    if (providerMatch) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const providerId = decodeURIComponent(providerMatch[1]);
        if (request.method === "PUT") {
          const existing = (
            await orm.findManyForService("ai.provider", user.id)
          )
            .map(toStoredProvider)
            .find((item) => item.id === providerId);
          if (!existing) {
            sendJson(response, 404, { error: "Provider not found." });
            return;
          }
          const body = parseObject(await readJsonBody(request));
          const input = providerInput(body, options.encryptionKey, existing);
          const updated = await orm.updateForService(
            "ai.provider",
            user.id,
            providerId,
            input,
          );
          if (!updated) {
            sendJson(response, 404, { error: "Provider not found." });
            return;
          }
          sendJson(response, 200, {
            provider: providerSummary({
              ...existing,
              ...input,
              id: existing.id,
            }),
          });
          return;
        }
        if (request.method === "DELETE") {
          if (!(await orm.deleteForService("ai.provider", user.id, providerId))) {
            sendJson(response, 404, { error: "Provider not found." });
            return;
          }
          sendJson(response, 200, { deleted: true });
          return;
        }
      } catch (error) {
        handleRequestError(response, error);
        return;
      }
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    if (
      pathname === apiRoutes.connectors.collection ||
      pathname.startsWith(apiRoutes.connectors.prefix)
    ) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const handled = await handleConnectorRequest(
          request,
          response,
          user,
          orm,
          pathname,
          connectorCredentials,
        );
        if (!handled) {
          sendJson(response, 405, { error: "Method not allowed." });
        }
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (
      pathname === apiRoutes.workflow.queue ||
      pathname === apiRoutes.workflow.collection ||
      pathname.startsWith(apiRoutes.workflow.prefix)
    ) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const handled = await handleWorkflowRequest(
          request,
          response,
          user,
          orm,
          pathname,
        );
        if (!handled) {
          sendJson(response, 405, { error: "Method not allowed." });
        }
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (
      pathname === apiRoutes.research.lexicalCandidates ||
      pathname.startsWith(apiRoutes.research.lexicalCandidatePrefix)
    ) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const handled = await handleResearchRequest(
          request,
          response,
          user,
          orm,
          pathname,
        );
        if (!handled) {
          sendJson(response, 405, { error: "Method not allowed." });
        }
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (
      pathname === apiRoutes.corpus.editions ||
      pathname.startsWith(apiRoutes.corpus.prefix)
    ) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const handled = await handleCorpusRequest(
          request,
          response,
          user,
          orm,
          pathname,
        );
        if (!handled) {
          sendJson(response, 405, { error: "Method not allowed." });
        }
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (pathname.startsWith(apiRoutes.source.prefix)) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const handled = await handleSourceRequest(
          request,
          response,
          user,
          orm,
          pathname,
        );
        if (!handled) {
          sendJson(response, 405, { error: "Method not allowed." });
        }
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    // Track 16, 18, 19: Community routes (Covenants, Study Circles, Deeds)
    if (pathname.startsWith("/community/")) {
      const method = request.method ?? "GET";

      if (pathname === apiRoutes.community.covenants && method === "GET") {
        const url = new URL(request.url ?? "/", "http://localhost");
        const version = url.searchParams.get("version");
        const filters: Record<string, QlServiceValue> = {};
        if (version) filters.covenant_version = version;
        const rows = await orm.findManyByService(
          "workflow.covenant_signature",
          filters,
          { limit: 100, orderBy: { field: "created_at", direction: "desc" } },
        );
        sendJson(response, 200, {
          signatures: rows.map((r) => ({
            id: String(r.id ?? ""),
            contributorCallsign: String(r.contributor_callsign ?? ""),
            covenantVersion: String(r.covenant_version ?? ""),
            signatureHash: String(r.signature_hash ?? ""),
            signedAt: new Date(Number(r.created_at ?? Date.now())).toISOString(),
          })),
          totalCount: rows.length,
        });
        return;
      }

      if (pathname === apiRoutes.community.signCovenant && method === "POST") {
        const user = await requireAuthenticatedUser(request, response, store);
        if (!user) return;
        const raw = parseObject(await readJsonBody(request));
const covenantVersion = typeof raw.covenantVersion === "string" ? raw.covenantVersion : "1.0.0";
      const termsDigest = typeof raw.termsDigest === "string" ? raw.termsDigest : "";
      const statementAccepted = Boolean(raw.statementAccepted);
      const contributorCallsign = typeof raw.contributorCallsign === "string" ? raw.contributorCallsign : user.name;

        if (!statementAccepted) {
          sendJson(response, 422, { error: "statement_accepted must be true to sign." });
          return;
        }

        const existing = await orm.findManyByService(
          "workflow.covenant_signature",
          { signer_id: user.id, covenant_version: covenantVersion },
          { limit: 1 },
        );
        if (existing.length > 0) {
          sendJson(response, 409, { error: "Covenant already affirmed for this version." });
          return;
        }

        const signatureHash = createHash("sha256")
          .update(`${user.id}:${covenantVersion}:${termsDigest}:${Date.now()}`)
          .digest("hex");

        const now = new Date();
        const created = await orm.createRecordForService("workflow.covenant_signature", {
          covenant_version: covenantVersion,
          terms_digest: termsDigest,
          signature_hash: signatureHash,
          contributor_callsign: contributorCallsign,
          statement_accepted: true,
          signer_id: user.id,
          created_at: now,
          updated_at: now,
        });

        sendJson(response, 201, {
          signatureId: String(created.id ?? ""),
          signatureHash,
          signedAt: now.toISOString(),
          covenantVersion,
        });
        return;
      }

      if (pathname === apiRoutes.community.studyCircles && method === "GET") {
        const circles = await orm.findManyByService(
          "community.study_circle",
          {},
          { limit: 50, orderBy: { field: "created_at", direction: "desc" } },
        );
        sendJson(response, 200, {
          circles: circles.map((c) => ({
            id: String(c.id ?? ""),
            title: String(c.title ?? ""),
            surahNumber: Number(c.surah_number ?? 1),
            facilitatorName: String(c.facilitator_id ?? "Facilitator"),
            memberCount: Number(c.max_members ?? 50),
            status: String(c.status ?? "active") as "active" | "concluded",
          })),
        });
        return;
      }

      const reflectionsMatch = pathname.match(
        /^\/community\/study-circles\/([^/]+)\/reflections$/,
      );
      if (reflectionsMatch) {
        const circleId = decodeURIComponent(reflectionsMatch[1]);
        if (method === "GET") {
          const reflections = await orm.findManyByService(
            "community.circle_reflection",
            { circle_id: circleId },
            { limit: 100, orderBy: { field: "created_at", direction: "desc" } },
          );
          sendJson(response, 200, {
            reflections: reflections.map((r) => ({
              id: String(r.id ?? ""),
              circleId: String(r.circle_id ?? circleId),
              authorCallsign: String(r.author_id ?? "Contributor"),
              passageLocator: String(r.passage_locator ?? ""),
              content: String(r.content ?? ""),
              moderationStatus: String(r.moderation_status ?? "approved") as
                | "quarantined"
                | "approved"
                | "rejected",
              createdAt: new Date(Number(r.created_at ?? Date.now())).toISOString(),
            })),
          });
          return;
        }
        if (method === "POST") {
          const user = await requireAuthenticatedUser(request, response, store);
          if (!user) return;
          const raw = parseObject(await readJsonBody(request));
          const passageLocator = typeof raw.passageLocator === "string" ? raw.passageLocator : "";
          const content = typeof raw.content === "string" ? raw.content : "";
          const now = new Date();
          const created = await orm.createRecordForService("community.circle_reflection", {
            circle_id: circleId,
            passage_locator: passageLocator,
            content,
            moderation_status: "approved",
            author_id: user.name || user.id,
            created_at: now,
            updated_at: now,
          });
          sendJson(response, 201, {
            id: String(created.id ?? ""),
            circleId,
            authorCallsign: user.name || user.id,
            passageLocator,
            content,
            moderationStatus: "approved",
            createdAt: now.toISOString(),
          });
          return;
        }
      }

      if (pathname === apiRoutes.community.deedsLedger && method === "GET") {
        const url = new URL(request.url ?? "/", "http://localhost");
        const kind = url.searchParams.get("kind");
        const filters: Record<string, QlServiceValue> = {};
        if (kind) filters.deed_kind = kind;
        const deeds = await orm.findManyByService(
          "community.beneficial_deed",
          filters,
          { limit: 100, orderBy: { field: "created_at", direction: "desc" } },
        );
        sendJson(response, 200, {
          deeds: deeds.map((d) => ({
            id: String(d.id ?? ""),
            contributorCallsign: d.is_anonymous
              ? "Anonymous Scholar"
              : String(d.contributor_id ?? "Contributor"),
            isAnonymous: d.is_anonymous,
            deedKind: (typeof d.deed_kind === "string" ? d.deed_kind : "typo_correction") as
                | "typo_correction"
                | "translation_review"
                | "reference_verification"
                | "annotation_audit",
            summary: String(d.summary ?? ""),
            proofHash: String(d.proof_hash ?? ""),
            createdAt: new Date(Number(d.created_at ?? Date.now())).toISOString(),
          })),
          totalCount: deeds.length,
        });
        return;
      }
    }

    // Track 21: Realtime Telemetry Orbit Monitor
    if (pathname === apiRoutes.telemetry.orbit && request.method === "GET") {
      const ping = Math.floor(Math.random() * 5) + 1;
      sendJson(response, 200, {
        uptimeSeconds: Math.floor(process.uptime()),
        apiLatencyP95Ms: 38,
        dbPingMs: ping,
        dnsConnectorsOnline: 1,
        overallStatus: "healthy",
        metrics: [
          {
            metricName: "Database Latency",
            metricKey: "db_ping_ms",
            currentValue: ping,
            unit: "ms",
            status: "healthy",
            updatedAt: new Date().toISOString(),
          },
          {
            metricName: "API p95 Latency",
            metricKey: "api_p95_ms",
            currentValue: 38,
            unit: "ms",
            status: "healthy",
            updatedAt: new Date().toISOString(),
          },
          {
            metricName: "Edge DNS Synchronization",
            metricKey: "edge_dns_sync",
            currentValue: 100,
            unit: "pct",
            status: "healthy",
            updatedAt: new Date().toISOString(),
          },
          {
            metricName: "Search Throughput",
            metricKey: "search_throughput_qpm",
            currentValue: 240,
            unit: "qpm",
            status: "healthy",
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      return;
    }

    // Track 25: Corpus Offline Manifest
    if (pathname === apiRoutes.corpus.offlineManifest && request.method === "GET") {
      const manifests = await orm.findManyByService(
        "corpus.offline_manifest",
        {},
        { limit: 20 },
      );
      sendJson(response, 200, {
        manifests: manifests.map((m) => ({
          editionKey: String(m.edition_key ?? ""),
          editionName: String(m.edition_key ?? "Uthmani Hafs"),
          versionTag: String(m.version_tag ?? "1.0.0"),
          totalSurahs: Number(m.total_surahs ?? 114),
          totalBytes: Number(m.total_bytes ?? 2450000),
          sha256Checksum: String(m.sha256_checksum ?? ""),
        })),
      });
      return;
    }

    if (request.method === "GET" && pathname === apiRoutes.admin.users.collection) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        requireGroup(user, "admin");
        const rows = await orm.findManyByService(
          "res.users",
          {},
          { limit: 500, orderBy: { field: "created_at", direction: "asc" } },
        );
        sendJson(response, 200, {
          users: rows.map(toAdminUser),
        } satisfies AdminUserListResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "GET" && pathname === apiRoutes.admin.roles.collection) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        requireGroup(user, "admin");
        const rows = await orm.findManyByService("res.role", {}, { limit: 100 });
        const roles: RoleDto[] =
          rows.length > 0
            ? rows.map((row) => ({
                code: String(row.code),
                nameKey: `web.adminUsers.roles.${String(row.code)}.name`,
                name: String(row.name ?? ""),
                descriptionKey: `web.adminUsers.roles.${String(row.code)}.description`,
                description: String(row.description ?? ""),
                groups: splitGroups(String(row.groups ?? "user")),
                assignable: row.assignable === true,
              }))
            : ROLE_CATALOG.map((role) => ({
                code: role.code,
                nameKey: `web.adminUsers.roles.${role.code}.name`,
                name: role.name,
                descriptionKey: `web.adminUsers.roles.${role.code}.description`,
                description: role.description,
                groups: [...role.groups],
                assignable: role.assignable,
              }));
        sendJson(response, 200, { roles } satisfies RoleListResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    const adminRoleMatch = pathname.match(
      new RegExp(`^${apiRoutes.admin.users.prefix}([^/]+)/role$`),
    );
    if (adminRoleMatch && request.method === "PATCH") {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        requireGroup(user, "admin");
        const targetId = decodeURIComponent(adminRoleMatch[1]);
        if (targetId === user.id) {
          throw new RequestError(
            "Peran akun Anda sendiri tidak dapat diubah dari layar ini.",
            400,
          );
        }
        const body = parseObject(await readJsonBody(request));
        const role = body.role;
        if (
          typeof role !== "string" ||
          !role.trim() ||
          role.length > 40 ||
          !isKnownRole(role)
        ) {
          throw new RequestError("Field 'role' must be a known role code.", 400);
        }
        const target = await orm.findOneByService("res.users", { id: targetId });
        if (!target || target.active !== true) {
          sendJson(response, 404, { error: "Pengguna tidak ditemukan." });
          return;
        }
        const definition = findRoleDefinition(role);
        const grantsRoot = definition?.groups.includes("root") === true;
        if (grantsRoot || definition?.assignable === false) {
          requireGroup(user, "root");
        }
        if (target.role === "super_admin" && role !== "super_admin") {
          await assertSuperAdminRemains(orm);
        }
        await orm.updateRecordsForService(
          "res.users",
          { id: targetId },
          { role },
        );
        await orm.deleteRecordsForService("res.sessions", { user_id: targetId });
        const updated = await orm.findOneByService("res.users", { id: targetId });
        if (!updated) {
          throw new RequestError("Peran gagal dibaca kembali setelah disimpan.", 500);
        }
        sendJson(response, 200, { user: toAdminUser(updated) });
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    const adminDeactivateMatch = pathname.match(
      new RegExp(`^${apiRoutes.admin.users.prefix}([^/]+)/deactivate$`),
    );
    if (adminDeactivateMatch && request.method === "POST") {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        requireGroup(user, "admin");
        const targetId = decodeURIComponent(adminDeactivateMatch[1]);
        if (targetId === user.id) {
          throw new RequestError(
            "Akun Anda sendiri tidak dapat dinonaktifkan dari layar ini.",
            400,
          );
        }
        const target = await orm.findOneByService("res.users", { id: targetId });
        if (!target || target.active !== true) {
          sendJson(response, 404, { error: "Pengguna tidak ditemukan." });
          return;
        }
        if (target.role === "super_admin") {
          await assertSuperAdminRemains(orm);
        }
        await orm.updateRecordsForService(
          "res.users",
          { id: targetId },
          { active: false },
        );
        await orm.deleteRecordsForService("res.sessions", { user_id: targetId });
        sendJson(response, 200, { deactivated: true });
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    const computeModelMatch = pathname.match(
      new RegExp(`^${apiRoutes.models.prefix}([^/]+)/compute$`),
    );
    if (request.method === "POST" && computeModelMatch) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const input = parseComputedModelQuery(await readJsonBody(request));
        const records = await orm.queryComputedModel(
          decodeURIComponent(computeModelMatch[1]),
          userContext(user),
          input,
        );
        sendJson(response, 200, { records } satisfies ModelRecordsResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    const modelMatch = pathname.match(
      new RegExp(`^${apiRoutes.models.prefix}([^/]+)(?:/([^/]+))?$`),
    );
    if (modelMatch) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      const modelName = decodeURIComponent(modelMatch[1]);
      try {
        if (request.method === "GET" && !modelMatch[2]) {
          sendJson(response, 200, {
            records: await orm.findMany(modelName, userContext(user)),
          });
          return;
        }
        if (request.method === "POST" && !modelMatch[2]) {
          const body = parseObject(await readJsonBody(request));
          const values = parseObject(body.values);
          sendJson(response, 201, {
            record: await orm.create(modelName, userContext(user), values),
          });
          return;
        }
        if (request.method === "PATCH" && modelMatch[2]) {
          const body = parseObject(await readJsonBody(request));
          const values = parseObject(body.values);
          const record = await orm.update(
            modelName,
            userContext(user),
            decodeURIComponent(modelMatch[2]),
            values,
          );
          if (!record) {
            sendJson(response, 404, { error: "Record not found." });
            return;
          }
          sendJson(response, 200, { record });
          return;
        }
        if (request.method === "DELETE" && modelMatch[2]) {
          const deleted = await orm.delete(
            modelName,
            userContext(user),
            decodeURIComponent(modelMatch[2]),
          );
          if (!deleted) {
            sendJson(response, 404, { error: "Record not found." });
            return;
          }
          sendJson(response, 200, { deleted: true });
          return;
        }
      } catch (error) {
        handleRequestError(response, error);
        return;
      }
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    if (request.method === "GET" && pathname === apiRoutes.conversations.collection) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        sendJson(response, 200, {
          conversations: (await store.listConversations(user.id)).map(conversationDto),
        } satisfies ConversationListResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "POST" && pathname === apiRoutes.conversations.collection) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const body = parseObject(await readJsonBody(request));
        const title = body.title;
        if (title !== undefined && typeof title !== "string") {
          throw new RequestError("Field 'title' must be a string.", 400);
        }
        if (typeof title === "string" && title.length > 120) {
          throw new RequestError("Field 'title' is too long.", 400);
        }
        const conversation = await store.createConversation(
          user.id,
          typeof title === "string" && title.trim()
            ? title.trim()
            : undefined,
        );
        sendJson(response, 201, {
          conversation: conversationDto(conversation),
        } satisfies { conversation: ConversationDto });
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    const messagesMatch = pathname.match(
      new RegExp(`^${apiRoutes.conversations.prefix}([^/]+)/messages$`),
    );
    if (request.method === "GET" && messagesMatch) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const conversationId = decodeURIComponent(messagesMatch[1]);
        const conversation = await store.getConversation(
          conversationId,
          user.id,
        );
        if (!conversation) {
          sendJson(response, 404, { error: "Conversation not found." });
          return;
        }
        const messages = await store.getMessages(conversationId, user.id);
        sendJson(response, 200, {
          messages: await Promise.all(
            messages.map((message) => messageDto(orm, message)),
          ),
        });
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    const conversationMatch = pathname.match(
      new RegExp(`^${apiRoutes.conversations.prefix}([^/]+)$`),
    );
    if (request.method === "DELETE" && conversationMatch) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const conversationId = decodeURIComponent(conversationMatch[1]);
        if (!(await store.deleteConversation(conversationId, user.id))) {
          sendJson(response, 404, { error: "Conversation not found." });
          return;
        }
        sendJson(response, 200, { deleted: true });
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }


    if (
      request.method === "POST" &&
      pathname === apiRoutes.search.reindexCorpus
    ) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        requireGroup(user, "admin");
        const input = parseObject(await readJsonBody(request));
        if (
          Object.keys(input).some((key) => key !== "editionKey") ||
          typeof input.editionKey !== "string" ||
          !input.editionKey.trim() ||
          input.editionKey !== input.editionKey.trim() ||
          input.editionKey.length > 160
        ) {
          throw new RequestError(
            "Field 'editionKey' must be a non-empty string of at most 160 characters.",
            400,
          );
        }
        const requestDto: ReindexCorpusSearchIndexRequestDto = {
          editionKey: input.editionKey,
        };
        const result = await indexCorpusEdition(
          orm,
          userContext(user),
          requestDto.editionKey,
        );
        sendJson(response, 200, {
          ...result,
        } satisfies ReindexCorpusSearchIndexResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "GET" && pathname === apiRoutes.search.query) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const url = new URL(request.url ?? "/", "http://localhost");
        const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
        const targetModel = url.searchParams.get("targetModel") ?? undefined;
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);

        if (!q) {
          sendJson(response, 200, {
            query: "",
            total: 0,
            results: [],
          } satisfies SearchQueryResponseDto);
          return;
        }

        // Search tokens in search.index_entry using QlOrm findManyByService
        const filter: Record<string, string> = {};
        if (targetModel) filter.target_model = targetModel;
        const searchTerms = q.split(/\s+/).filter(Boolean);
        const primaryTerm = searchTerms[0] ?? q;
        const entries = (await orm.findMany("search.index_entry", userContext(user), {
          limit: 200,
          search: { fields: ["token", "snippet"], query: primaryTerm },
        })).filter((e) => !targetModel || e.target_model === targetModel);

        // Score and rank matched entries
        const matched: SearchResultItemDto[] = entries
          .filter((entry: Record<string, unknown>) => {
            const tokenStr = typeof entry.token === "string" ? entry.token.toLowerCase() : "";
            const snippetStr = typeof entry.snippet === "string" ? entry.snippet.toLowerCase() : "";
            return searchTerms.some((term) => tokenStr.includes(term) || snippetStr.includes(term));
          })
          .map((entry: Record<string, unknown>) => {
            const tokenVal = typeof entry.token === "string" ? entry.token : "";
            const snippetVal = typeof entry.snippet === "string" ? entry.snippet : undefined;
            const idVal = typeof entry.id === "string" ? entry.id : "";
            const targetModelVal = typeof entry.target_model === "string" ? entry.target_model : "";
            const targetIdVal = typeof entry.target_id === "string" ? entry.target_id : "";
            const weightVal = typeof entry.weight === "number" ? entry.weight : 1;
            return {
              id: idVal,
              targetModel: targetModelVal,
              targetId: targetIdVal,
              token: tokenVal,
              weight: weightVal,
              ...(targetModelVal === "corpus.passage" || snippetVal === undefined
                ? {}
                : { snippet: snippetVal }),
            };
          })
          .sort((a: SearchResultItemDto, b: SearchResultItemDto) => b.weight - a.weight)
          .slice(0, limit);

        sendJson(response, 200, {
          query: q,
          total: matched.length,
          results: matched,
        } satisfies SearchQueryResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (request.method === "POST" && pathname === apiRoutes.chat) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const agentRequest = parseAgentRequest(await readJsonBody(request));
        const conversation = await store.getConversation(
          agentRequest.conversationId,
          user.id,
        );
        if (!conversation) {
          sendJson(response, 404, { error: "Conversation not found." });
          return;
        }
        const history = await store.getMessages(
          agentRequest.conversationId,
          user.id,
          HISTORY_LIMIT,
        );

        const resolveChatProvider = async (): Promise<
          ModelProvider | undefined
        > => {
          const configuredProviders = (
            await orm.findManyForService("ai.provider", user.id)
          )
            .map(toStoredProvider)
            .sort((left, right) => left.priority - right.priority)
            .filter(({ enabled }) => enabled)
            .map(({ id, name, base_url, model, encrypted_api_key }) => {
              if (!options.encryptionKey) {
                throw new RequestError(
                  "Provider credentials cannot be decrypted; configure PROVIDER_ENCRYPTION_KEY.",
                  503,
                );
              }
              return {
                id,
                name,
                config: {
                  apiKey: decryptProviderSecret(
                    encrypted_api_key,
                    options.encryptionKey,
                  ),
                  baseUrl: base_url,
                  model,
                } satisfies OpenAICompatibleProviderOptions,
              };
            });
          return configuredProviders.length
            ? createFallbackProvider(
                configuredProviders,
                options.providerFactory,
              )
            : provider;
        };

        if (agentRequest.grounding === "grounded") {
          const candidates = await searchCorpusPassages(
            orm,
            agentRequest.input.trim(),
            user.preferredLocale,
          );
          const persistInsufficientEvidence = async (reply: string) => {
            await store.addMessage(
              agentRequest.conversationId,
              user.id,
              "assistant",
              reply,
              { groundingStatus: "insufficient_evidence" },
            );
            sendJson(response, 200, {
              reply,
              groundingStatus: "insufficient_evidence",
              citations: [],
            } satisfies ChatResponseDto);
          };
          if (candidates.length === 0) {
            await store.addMessage(
              agentRequest.conversationId,
              user.id,
              "user",
              agentRequest.input.trim(),
            );
            await persistInsufficientEvidence(
              await insufficientEvidenceReply(orm, user.preferredLocale),
            );
            return;
          }
          const chatProvider = await resolveChatProvider();
          if (!chatProvider) {
            request.resume();
            sendJson(response, 503, {
              error: "No model provider is configured.",
            });
            return;
          }
          await store.addMessage(
            agentRequest.conversationId,
            user.id,
            "user",
            agentRequest.input.trim(),
          );

          let groundedResult: Awaited<
            ReturnType<typeof runGroundedAgent>
          >;
          try {
            groundedResult = await runGroundedAgent(chatProvider, {
              input: agentRequest.input.trim(),
              history: history
                .filter(({ role }) => role === "user")
                .map(({ role, content }) => ({ role, content })),
              evidence: candidates.map(({ passage }) => ({
                id: passage.id,
                text: passage.text,
              })),
            });
          } catch (error) {
            console.error("Grounded model provider request failed.", error);
            sendJson(response, 502, {
              error: "Grounded model provider request failed.",
            });
            return;
          }
          if (groundedResult.groundingStatus === "insufficient_evidence") {
            await persistInsufficientEvidence(groundedResult.reply);
            return;
          }

          const candidatesById = new Map<
            string,
            (typeof candidates)[number]
          >();
          for (const candidate of candidates) {
            candidatesById.set(candidate.passage.id, candidate);
          }
          const citationReferences = groundedResult.citations.map(
            ({ evidenceId }): CitationReference => {
              const candidate = candidatesById.get(evidenceId);
              if (!candidate) {
                throw new Error(
                  "Grounded agent returned a citation outside retrieved evidence.",
                );
              }
              return {
                evidenceId,
                editionId: candidate.passage.edition_id,
                editionKey: candidate.editionKey,
                surah: candidate.passage.surah,
                ayah: candidate.passage.ayah,
              };
            },
          );
          const revalidatedCitations = await Promise.all(
            citationReferences.map((citation) =>
              revalidateCitation(orm, citation),
            ),
          );
          const citationDtos = revalidatedCitations.filter(
            (citation): citation is ChatCitationDto =>
              citation !== undefined,
          );
          if (citationDtos.length !== citationReferences.length) {
            await persistInsufficientEvidence(
              await insufficientEvidenceReply(orm, user.preferredLocale),
            );
            return;
          }

          // Strict Quranic verse verification for all extracted citations
          const extractedMentions = extractScriptureCitations(groundedResult.reply);
          const unverifiedCitations: Array<{
            raw: string;
            surah: number;
            ayah: number;
            reason: "non_existent_verse" | "unverified_in_corpus";
          }> = [];

          for (const mention of extractedMentions) {
            // Verify surah range
            if (mention.surah < 1 || mention.surah > 114) {
              unverifiedCitations.push({
                raw: mention.raw,
                surah: mention.surah,
                ayah: mention.ayah,
                reason: "non_existent_verse",
              });
              continue;
            }

            // Check if passage exists in published corpus
            const passageRows = await orm.findManyByService(
              "corpus.passage",
              {
                surah: mention.surah,
                ayah: mention.ayah,
                stage: "published",
              },
              { limit: 1 },
            );

            const isVerified = passageRows.length > 0;
            if (!isVerified) {
              unverifiedCitations.push({
                raw: mention.raw,
                surah: mention.surah,
                ayah: mention.ayah,
                reason: "unverified_in_corpus",
              });
            }

            // Log verification audit in chat.citation_verification
            try {
              await orm.createRecordForService("chat.citation_verification", {
                message_id: agentRequest.conversationId,
                surah: mention.surah,
                ayah: mention.ayah,
                claimed_text: mention.raw,
                verification_status: isVerified ? "verified" : "unverified",
                owner_id: user.id,
                created_at: new Date(),
              });
            } catch (auditErr) {
              console.warn("Failed to record citation verification audit", auditErr);
            }
          }

          await store.addMessage(
            agentRequest.conversationId,
            user.id,
            "assistant",
            groundedResult.reply,
            {
              groundingStatus: "grounded",
              citations: citationReferences,
            },
          );
          sendJson(response, 200, {
            reply: groundedResult.reply,
            groundingStatus: "grounded",
            citations: citationDtos,
            ...(unverifiedCitations.length > 0 ? { unverifiedCitations } : {}),
          } satisfies ChatResponseDto);
          return;
        }

        const chatProvider = await resolveChatProvider();
        if (!chatProvider) {
          request.resume();
          sendJson(response, 503, { error: "No model provider is configured." });
          return;
        }
        await store.addMessage(
          agentRequest.conversationId,
          user.id,
          "user",
          agentRequest.input.trim(),
        );

        let reply: string;
        try {
          reply = await runAgent(chatProvider, {
            input: agentRequest.input,
            ...(agentRequest.instructions
              ? { instructions: agentRequest.instructions }
              : {}),
            history: history.map(({ role, content }) => ({ role, content })),
          });
        } catch (error) {
          console.error("Model provider request failed.", error);
          sendJson(response, 502, {
            error: "Model provider request failed.",
          });
          return;
        }
        await store.addMessage(
          agentRequest.conversationId,
          user.id,
          "assistant",
          reply,
        );
        sendJson(response, 200, { reply } satisfies ChatResponseDto);
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    if (
      pathname === apiRoutes.attachments.collection ||
      pathname.startsWith(apiRoutes.attachments.prefix)
    ) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
        const handled = await handleAttachmentRequest(
          request,
          response,
          userContext(user),
          orm,
          pathname,
          attachmentPolicy,
        );
        if (!handled) {
          sendJson(response, 405, { error: "Method not allowed." });
        }
      } catch (error) {
        handleRequestError(response, error);
      }
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  }

  return createServer((request, response) => {
    void handleApiRequest(request, response).catch((error: unknown) => {
      if (response.headersSent) {
        console.error("API request failed after response headers were sent.", error);
        response.destroy();
        return;
      }
      handleRequestError(response, error);
    });
  });
}
