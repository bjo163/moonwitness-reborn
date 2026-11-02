import type {
  AddonCategory,
  ChatRole,
  ConnectorTokenSource,
  ConnectorVerifyStatus,
  FieldType,
  LandingViewSection,
  RecordValues,
  UiLocale,
  ViewType,
} from "@moonwitness/types";

export type {
  AddonCategory,
  ConnectorTokenSource,
  ConnectorVerifyStatus,
  LandingViewSection,
  UiLocale,
} from "@moonwitness/types";

export interface ApiErrorBody {
  error: string;
  code?: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  groups: string[];
  preferredLocale: UiLocale;
}

export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
  preferredLocale?: UiLocale;
}

export type InitialSetupRequestDto = RegisterRequestDto;

export interface InitialSetupStatusDto {
  required: boolean;
}


export interface SearchQueryRequestDto {
  q: string;
  targetModel?: string;
  limit?: number;
}

export interface SearchResultItemDto {
  id: string;
  targetModel: string;
  targetId: string;
  token: string;
  weight: number;
  snippet?: string;
}

export interface SearchQueryResponseDto {
  query: string;
  total: number;
  results: SearchResultItemDto[];
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface UpdatePreferredLocaleRequestDto {
  preferredLocale: UiLocale;
}

export interface UiLanguageDto {
  code: UiLocale;
  label: string;
  direction: "ltr" | "rtl";
  isDefault: boolean;
}

export interface TranslationCatalogItemDto {
  namespace: string;
  key: string;
  value: string;
  pluralForms?: Partial<Record<TranslationPluralCategoryDto, string>>;
}

export type TranslationPluralCategoryDto = "one" | "other";

export interface TranslationCatalogResponseDto {
  locale: UiLocale;
  entries: TranslationCatalogItemDto[];
}

export type TranslationStateDto = "draft" | "published";
export type TranslationDraftSourceDto = "manual" | "import" | "ai" | "seed";

export interface TranslationAdminItemDto extends TranslationCatalogItemDto {
  id: string;
  locale: UiLocale;
  sourceText: string;
  sourcePluralText?: string;
  translatedPluralTexts?: Partial<
    Record<TranslationPluralCategoryDto, string>
  >;
  context: string;
  status: TranslationStateDto;
  draftSource: TranslationDraftSourceDto;
  updatedBy: string;
  updatedAt: string;
}

export interface TranslationDraftRequestDto {
  locale: UiLocale;
  namespace: string;
  key: string;
  sourceText: string;
  translatedText: string;
  sourcePluralText?: string;
  translatedPluralTexts?: Partial<
    Record<TranslationPluralCategoryDto, string>
  >;
  context?: string;
}

export interface TranslationAiDraftRequestDto {
  locale: UiLocale;
  namespace: string;
  key: string;
  sourceText: string;
  sourcePluralText?: string;
  context?: string;
}

export interface AuthResponseDto {
  user: AuthUserDto;
}

export interface ConversationDto {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationListResponseDto {
  conversations: ConversationDto[];
}

export interface ConversationMessagesResponseDto {
  messages: ChatMessageDto[];
}

export interface CreateConversationRequestDto {
  title?: string;
}

export interface ChatMessageDto {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatRequestDto {
  conversationId: string;
  input: string;
  instructions?: string;
  grounding?: "grounded";
}

export type ChatGroundingStatus =
  | "grounded"
  | "insufficient_evidence"
  | "legacy";

export type ChatGroundingStatusDto = ChatGroundingStatus;

export interface ChatCitationDto {
  evidenceId: string;
  editionId: string;
  editionKey: string;
  authority: PassageKindDto;
  editionAuthority: PassageKindDto;
  locale: string;
  publisher: string;
  attribution: string;
  locator: string;
  surah: number;
  ayah: number;
}

export type GroundedChatResponseDto = Extract<
  ChatResponseDto,
  { groundingStatus: "grounded" | "insufficient_evidence" }
>;

export type ChatResponseDto =
  | {
      reply: string;
      groundingStatus: "grounded";
      citations: ChatCitationDto[];
    }
  | {
      reply: string;
      groundingStatus: "insufficient_evidence";
      citations: [];
    }
  | {
      reply: string;
      groundingStatus: "legacy";
      citations?: never;
    }
  | {
      reply: string;
      groundingStatus?: never;
      citations?: never;
    };

export interface ModelFieldDto {
  type: FieldType;
  labelKey: string;
  helpKey?: string;
  selectionKeys?: Record<string, string>;
  options?: readonly string[];
  required?: boolean;
  maxLength?: number;
  computed?: boolean;
  readOnly?: boolean;
  dependsOn?: string[];
}

export interface ModelViewDto {
  name: string;
  labelKey: string;
  helpKey?: string;
  model: string;
  type: ViewType;
  fields: string[];
}

export interface ModelMetadataDto {
  kind: "table" | "computed";
  name: string;
  addon?: string;
  category?: AddonCategory;
  labelKey: string;
  description: string;
  descriptionKey: string;
  fields: Record<string, ModelFieldDto>;
  views: ModelViewDto[];
  permissions: {
    create: boolean;
    write: boolean;
    unlink: boolean;
  };
}

export interface LandingViewItemDto {
  name: string;
  model: string;
  addon: string;
  category: AddonCategory;
  section: LandingViewSection;
  sequence: number;
  href: string;
  status: "available" | "proposed";
  titleKey: string;
  descriptionKey: string;
  recordCount: number | null;
}

export interface LandingCatalogResponseDto {
  items: LandingViewItemDto[];
}

export interface PublicModelExplorerResponseDto {
  model: ModelMetadataDto | null;
  models: ModelMetadataDto[];
  records: ModelRecordDto[];
}

export type ModelRecordDto = RecordValues;

export interface ModelRecordsResponseDto {
  records: ModelRecordDto[];
}

export interface ComputeModelQueryRequestDto {
  filters?: Record<string, string | number | boolean | null>;
  limit?: number;
}

export interface ModelRecordResponseDto {
  record: ModelRecordDto;
}

export interface ModelProviderDto {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  priority: number;
  enabled: boolean;
  hasApiKey: boolean;
}

export interface ModelProviderInputDto {
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  priority?: number;
  enabled?: boolean;
}

export interface ProviderListResponseDto {
  providers: ModelProviderDto[];
}

export interface ProviderResponseDto {
  provider: ModelProviderDto;
}

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  active: boolean;
  role: string;
  createdAt: string;
}

export interface AdminUserListResponseDto {
  users: AdminUserDto[];
}

export interface RoleDto {
  code: string;
  nameKey: string;
  name: string;
  descriptionKey: string;
  description: string;
  groups: string[];
  assignable: boolean;
}

export interface RoleListResponseDto {
  roles: RoleDto[];
}

export interface UpdateUserRoleRequestDto {
  role: string;
}

export interface ConnectorKindDto {
  kind: string;
  labelKey: string;
  label: string;
  /** Where the app looks for this service's credential; displayed, never submitted. */
  credentialHelpKey: string;
  credentialHelp: string;
  helpUrl: string;
  capabilities: string[];
  readonly: boolean;
  recordTypes?: string[];
  /** Record types the service can proxy; drives the UI before a write is refused. */
  proxiableTypes?: string[];
}

/**
 * There is deliberately no token field anywhere in this contract: credentials
 * stay in the OS store and are resolved server-side per request.
 */
export interface ConnectorDto {
  id: string;
  kind: string;
  label: string;
  tokenSource: ConnectorTokenSource;
  tokenRef: string;
  enabled: boolean;
  verifyStatus: ConnectorVerifyStatus;
  lastVerifyAt: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorListResponseDto {
  connectors: ConnectorDto[];
  kinds: ConnectorKindDto[];
  maxPerOwner: number;
}

export interface ConnectorResponseDto {
  connector: ConnectorDto;
}

export interface CreateConnectorRequestDto {
  kind: string;
  label: string;
}

export interface UpdateConnectorRequestDto {
  label?: string;
  enabled?: boolean;
}

export interface DeleteConnectorRequestDto {
  confirmLabel: string;
}

export interface VerifyConnectorResponseDto {
  connector: ConnectorDto;
  message: string;
}

export interface SyncConnectorResponseDto {
  connector: ConnectorDto;
  zones: number;
  records: number;
  partial: boolean;
  incompleteZones: string[];
  message: string;
}

export interface CloudflareZoneDto {
  id: string;
  externalId: string;
  name: string;
  accountId: string;
  status: string;
  paused: boolean;
  stale: boolean;
  lastSyncAt: string | null;
}

export interface ZoneListResponseDto {
  zones: CloudflareZoneDto[];
}

export interface CloudflareRecordDto {
  id: string;
  externalId: string;
  zoneId: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  managed: boolean;
  stale: boolean;
  comment: string;
  createdAt: string;
  lastSyncAt: string | null;
}

export interface RecordListResponseDto {
  records: CloudflareRecordDto[];
  zone: CloudflareZoneDto | null;
  truncated: boolean;
}

export interface RecordResponseDto {
  record: CloudflareRecordDto;
}

export interface CloudflareRecordInputDto {
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  comment?: string;
}

export interface DeleteRecordRequestDto {
  confirmName: string;
}

export interface IntegrationAuditDto {
  id: string;
  createdAt: string;
  connectorId: string;
  action: string;
  outcome: string;
  target: string;
  zoneId: string;
  recordId: string;
  errorCode: string;
  errorMessage: string;
}

export interface AuditListResponseDto {
  entries: IntegrationAuditDto[];
}

// ---------------------------------------------------------------------------
// `ql_workflow` — CAB approval queue + PM tracker contracts (MW-ADR-017).
//
// Field names match the addon's model shape exactly (`snake_case`) because
// the workflow DTO mirrors the record the QlOrm service path returns. Private
// fields (`owner_id`, `actor_id`) are stripped server-side before they reach
// this layer — they intentionally have no key here so any client drift is a
// compile error rather than a runtime leak.
// ---------------------------------------------------------------------------

/**
 * Legal values for `workflow.change.state`. Mirrors the addon's
 * `REVIEW_STATES` vocabulary verbatim (see
 * `https://github.com/bjo163/moonwitness-reborn/wiki/docs-workflows-WORKFLOW_AND_PUBLISHING_SPECIFICATION`).
 */
export type WorkflowStateDto =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "superseded"
  | "published";

/** Legal values for `workflow.transition.action`. */
export type TransitionActionDto =
  | "submit"
  | "start_review"
  | "request_changes"
  | "approve"
  | "reject"
  | "withdraw"
  | "publish"
  | "supersede";

export interface WorkflowChangeDto {
  id: string;
  title: string;
  body: string;
  subject_type: string;
  subject_id: string;
  state: WorkflowStateDto;
  urgency: string;
  revision: number;
  /** Stored as epoch-ms by QlOrm datetime fields. */
  created_at: number;
  updated_at: number;
}

export interface WorkflowTransitionDto {
  id: string;
  change_id: string;
  from_state: WorkflowStateDto;
  to_state: WorkflowStateDto;
  action: TransitionActionDto;
  reason: string;
  revision: number;
  created_at: number;
}

export interface TransitionRequestDto {
  action: TransitionActionDto;
  reason?: string;
}

export interface TransitionResponseDto {
  change: WorkflowChangeDto;
  transition: WorkflowTransitionDto;
}

export interface WorkflowChangeListResponseDto {
  changes: WorkflowChangeDto[];
}

export interface WorkflowChangeResponseDto {
  change: WorkflowChangeDto;
}

export interface WorkflowTransitionListResponseDto {
  transitions: WorkflowTransitionDto[];
}

// ---------------------------------------------------------------------------
// `ql_research` — human review of versioned lexical-frequency evidence.
// Candidate results remain computed/read-only; this contract exposes review
// decisions separately and never claims theological verification.
// ---------------------------------------------------------------------------

export type LexicalResearchDecisionDto =
  | "retain_for_research"
  | "exclude_from_research"
  | "needs_expert_review";

export interface LexicalResearchSourceReferenceDto {
  surah: number;
  ayah: number;
  passageId: string;
  checksum: string;
}

export interface LexicalResearchCandidateDto {
  id: string;
  candidate_text: string;
  normalized_form: string;
  occurrence_count: number;
  verse_reference_count: number;
  source_edition: string;
  source_version_id: string;
  source_references: LexicalResearchSourceReferenceDto[];
  normalization_version: string;
  algorithm_version: string;
}

export interface LexicalResearchReviewDto {
  id: string;
  candidate_id: string;
  edition_key: string;
  source_version_id: string;
  normalization_version: string;
  algorithm_version: string;
  occurrence_count: number;
  verse_reference_count: number;
  source_references: LexicalResearchSourceReferenceDto[];
  source_reference_digest: string;
  decision: LexicalResearchDecisionDto;
  rationale: string;
  reviewed_at: number;
}

export interface LexicalResearchReviewQueueItemDto {
  candidate: LexicalResearchCandidateDto;
  review: LexicalResearchReviewDto | null;
}

export interface LexicalResearchReviewQueueResponseDto {
  candidates: LexicalResearchReviewQueueItemDto[];
}

export interface CreateLexicalResearchReviewRequestDto {
  edition_key: string;
  normalized_form: string;
  decision: LexicalResearchDecisionDto;
  rationale: string;
}

export interface CreateLexicalResearchReviewResponseDto {
  review: LexicalResearchReviewDto;
}

export type ProjectTaskStateDto =
  | "done"
  | "in_progress"
  | "proposed"
  | "blocked"
  | "pending";

export interface ProjectProgressSummaryDto {
  total: number;
  readyCount: number;
  states: Record<ProjectTaskStateDto, number>;
}

export interface ProjectTaskDto {
  id: string;
  title: string;
  section: string;
  state: ProjectTaskStateDto;
  statusLabel: string;
  owner: string;
  dependsOn: string[];
  acceptanceCriteria: string;
  completedAt: string | null;
}

export interface ProjectTaskListResponseDto {
  tasks: ProjectTaskDto[];
  readyTaskIds: string[];
}

// ---------------------------------------------------------------------------
// `ql_source` + `ql_corpus` contracts (MW-ADR-019 / workstream MW-0560).
//
// The kind/status vocabularies below are **re-declared** as local literal
// unions rather than imported from `@moonwitness/types` or the addons —
// the browser-boundary rule in `@moonwitness/eslint-config` bans `apps/web/**`
// from touching `ql_*` at all, and `@moonwitness/types` has a proven 3-site
// duplication threshold (MW-ADR-015) these two addons do not yet cross.
//
// Private fields (`owner_id`, `verified_by_id`, `license_evidence_ref`,
// `actor_id`) are stripped server-side and have **no key here** so any
// future client drift becomes a compile error rather than a runtime leak.
// ---------------------------------------------------------------------------

export type PassageKindDto =
  | "revelation_verbatim"
  | "translation"
  | "tafsir"
  | "reflection"
  | "annotation"
  | "lexical";

export type CorpusStageDto =
  | "staged"
  | "validated"
  | "reviewed"
  | "approved"
  | "published"
  | "withdrawn"
  | "quarantined";

export type RightsStatusDto =
  | "unknown"
  | "under_review"
  | "cleared"
  | "restricted"
  | "not_applicable";

export type RightsActionDto =
  | "import"
  | "index"
  | "display"
  | "transform"
  | "export"
  | "publish";

export type LifecycleStageDto =
  | "discovered"
  | "registered"
  | "rights_checked"
  | "ingest_staged"
  | "validated"
  | "mapped"
  | "reviewed"
  | "approved"
  | "published"
  | "rejected"
  | "quarantined"
  | "superseded"
  | "withdrawn"
  | "corrected";

export interface CorpusWorkDto {
  id: string;
  canonical_id: string;
  title: string;
  work_kind: string;
  primary_locale: string;
  description: string;
  updated_at: number;
}

export interface CorpusEditionDto {
  id: string;
  canonical_id: string;
  work_id: string;
  source_version_id: string;
  rights_id: string;
  edition_key: string;
  authority: PassageKindDto;
  locale: string;
  publisher: string;
  author_or_translator: string;
  attribution_text: string;
  revision: string;
  imported_row_count: number;
  materialized_row_count: number;
  stage: CorpusStageDto;
  updated_at: number;
}

/**
 * A passage row carries its own `authority` (revelation vs. translation) AND
 * a copy of the parent edition's `attribution_text`, `locale`, and `publisher`
 * — MW-ADR-019 §(d) forbids a client from rendering text without its kind
 * and attribution, so those fields are non-optional on every row.
 */
export interface CorpusPassageDto {
  id: string;
  locator: string;
  surah: number;
  ayah: number;
  authority: PassageKindDto;
  row_kind: string;
  text: string;
  text_checksum: string;
  ordinal: number;
  edition_id: string;
  edition_authority: PassageKindDto;
  edition_locale: string;
  edition_publisher: string;
  edition_attribution_text: string;
}

export interface CorpusSurahDto {
  editionKey: string;
  editionAuthority: PassageKindDto;
  editionLocale: string;
  surah: number;
  passages: CorpusPassageDto[];
}

export interface CorpusEditionListResponseDto {
  editions: CorpusEditionDto[];
}

export interface CorpusSurahResponseDto {
  reading: CorpusSurahDto;
}

export interface CorpusVerseResponseDto {
  passage: CorpusPassageDto;
}

export interface SourceArtifactDto {
  id: string;
  canonical_id: string;
  title: string;
  kind: string;
  publisher: string;
  repository: string;
  branch: string;
  commit_sha: string;
  original_uri: string;
  lifecycle_stage: LifecycleStageDto;
  updated_at: number;
}

/**
 * Public projection of `source.rights` — deliberately **excludes**
 * `license_evidence_ref`, `verified_by_id`, and `owner_id` (all `private:true`
 * in the model) and the free-form `basis_notes`. Use this to display a
 * rights banner; the audit trail on `source.provenance` records who flipped
 * a status and why, and only admins can read it via the generic
 * `/models/source.provenance` path.
 */
export interface SourceRightsSummaryDto {
  id: string;
  version_id: string;
  action: RightsActionDto;
  rights_status: RightsStatusDto;
  license_id: string;
  attribution_required: boolean;
  attribution_text: string;
  territory: string;
  term_ends_at: number;
}

export interface SourceArtifactListResponseDto {
  artifacts: SourceArtifactDto[];
}

export interface SourceArtifactResponseDto {
  artifact: SourceArtifactDto;
  rights: SourceRightsSummaryDto[];
}

export interface MoonClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

const segment = (value: string) => encodeURIComponent(value);

export const apiRoutes = {
  health: "/health",
  auth: {
    me: "/auth/me",
    preferences: "/auth/me/preferences",
    setup: "/auth/setup",
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
  },
  chat: "/chat",
  conversations: {
    collection: "/conversations",
    prefix: "/conversations/",
    item: (id: string) => `/conversations/${segment(id)}`,
    messages: (id: string) => `/conversations/${segment(id)}/messages`,
  },
  models: {
    collection: "/models",
    prefix: "/models/",
    records: (model: string) => `/models/${segment(model)}`,
    compute: (model: string) =>
      `/models/${segment(model)}/compute`,
    record: (model: string, id: string) =>
      `/models/${segment(model)}/${segment(id)}`,
  },
  providers: {
    collection: "/settings/providers",
    prefix: "/settings/providers/",
    item: (id: string) => `/settings/providers/${segment(id)}`,
  },
  connectors: {
    collection: "/settings/connectors",
    prefix: "/settings/connectors/",
    item: (id: string) => `/settings/connectors/${segment(id)}`,
    verify: (id: string) => `/settings/connectors/${segment(id)}/verify`,
    sync: (id: string) => `/settings/connectors/${segment(id)}/sync`,
    zones: (id: string) => `/settings/connectors/${segment(id)}/zones`,
    records: (id: string, zoneId: string) =>
      `/settings/connectors/${segment(id)}/zones/${segment(zoneId)}/records`,
    record: (id: string, zoneId: string, recordId: string) =>
      `/settings/connectors/${segment(id)}/zones/${segment(zoneId)}/records/${segment(recordId)}`,
    audit: (id: string) => `/settings/connectors/${segment(id)}/audit`,
  },
  workflow: {
    queue: "/workflow/queue",
    collection: "/workflow/changes",
    prefix: "/workflow/changes/",
    item: (id: string) => `/workflow/changes/${segment(id)}`,
    transition: (id: string) => `/workflow/changes/${segment(id)}/transition`,
    transitions: (id: string) => `/workflow/changes/${segment(id)}/transitions`,
  },
  research: {
    lexicalCandidates: "/research/lexical-candidates",
    lexicalCandidatePrefix: "/research/lexical-candidates/",
    lexicalCandidateQueue: (editionKey: string) =>
      `/research/lexical-candidates?edition_key=${encodeURIComponent(editionKey)}`,
    lexicalCandidateReview: (id: string) =>
      `/research/lexical-candidates/${segment(id)}/reviews`,
  },
  corpus: {
    editions: "/corpus/editions",
    prefix: "/corpus/",
    edition: (key: string) => `/corpus/editions/${segment(key)}`,
    surah: (key: string, surah: number) =>
      `/corpus/editions/${segment(key)}/surahs/${segment(String(surah))}`,
    verse: (key: string, surah: number, ayah: number) =>
      `/corpus/editions/${segment(key)}/surahs/${segment(String(surah))}/verses/${segment(String(ayah))}`,
  },
  source: {
    artifacts: "/source/artifacts",
    prefix: "/source/",
    item: (id: string) => `/source/artifacts/${segment(id)}`,
    rights: (id: string) => `/source/artifacts/${segment(id)}/rights`,
    provenance: (id: string) => `/source/artifacts/${segment(id)}/provenance`,
  },
  projectProgress: {
    summary: "/project/progress/summary",
    tasks: "/project/progress/tasks",
  },
  search: {
    query: "/search",
  },
  landing: {
    catalog: "/public/landing",
    models: "/public/models",
    modelPrefix: "/public/models/",
    model: (modelName: string) => `/public/models/${segment(modelName)}`,
  },
  admin: {
    users: {
      collection: "/admin/users",
      prefix: "/admin/users/",
      item: (id: string) => `/admin/users/${segment(id)}`,
      role: (id: string) => `/admin/users/${segment(id)}/role`,
      deactivate: (id: string) => `/admin/users/${segment(id)}/deactivate`,
    },
    roles: {
      collection: "/admin/roles",
    },
    translations: {
      collection: "/admin/translations",
      item: (id: string) => `/admin/translations/${segment(id)}`,
      approve: (id: string) =>
        `/admin/translations/${segment(id)}/approve`,
      import: "/admin/translations/import",
      export: "/admin/translations/export",
      aiDraft: "/admin/translations/ai-draft",
    },
  },
  translations: {
    languages: "/translations/languages",
    catalog: "/translations/catalog",
  },
} as const;

export class MoonClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "MoonClientError";
  }
}

export class MoonClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(options: MoonClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "/api").replace(/\/+$/, "");
    // Menyimpan global fetch sebagai properti membuat panggilan this.fetcher()
    // berjalan dengan this = klien, dan browser menolaknya dengan "Illegal invocation".
    this.fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
  }

  currentUser(): Promise<AuthResponseDto> {
    return this.request(apiRoutes.auth.me);
  }

  initialSetupStatus(): Promise<InitialSetupStatusDto> {
    return this.request(apiRoutes.auth.setup);
  }

  completeInitialSetup(input: InitialSetupRequestDto): Promise<AuthResponseDto> {
    return this.request(apiRoutes.auth.setup, "POST", input);
  }

  updatePreferredLocale(
    preferredLocale: UiLocale,
  ): Promise<AuthResponseDto> {
    const body: UpdatePreferredLocaleRequestDto = { preferredLocale };
    return this.request(apiRoutes.auth.preferences, "PATCH", body);
  }

  listUiLanguages(): Promise<{ languages: UiLanguageDto[] }> {
    return this.request(apiRoutes.translations.languages);
  }

  getTranslationCatalog(
    locale: UiLocale,
    namespace?: string,
  ): Promise<TranslationCatalogResponseDto> {
    const query = new URLSearchParams({ locale });
    if (namespace) query.set("namespace", namespace);
    return this.request(`${apiRoutes.translations.catalog}?${query}`);
  }

  listAdminTranslations(
    locale?: UiLocale,
  ): Promise<{ translations: TranslationAdminItemDto[] }> {
    const query = new URLSearchParams();
    if (locale) query.set("locale", locale);
    const suffix = query.toString();
    return this.request(
      `${apiRoutes.admin.translations.collection}${suffix ? `?${suffix}` : ""}`,
    );
  }

  saveTranslationDraft(
    input: TranslationDraftRequestDto,
  ): Promise<{ translation: TranslationAdminItemDto }> {
    return this.request(
      apiRoutes.admin.translations.collection,
      "POST",
      input,
    );
  }

  approveTranslation(
    id: string,
  ): Promise<{ translation: TranslationAdminItemDto }> {
    return this.request(apiRoutes.admin.translations.approve(id), "POST");
  }

  importTranslationPo(
    locale: UiLocale,
    content: string,
  ): Promise<{ translations: TranslationAdminItemDto[] }> {
    return this.request(apiRoutes.admin.translations.import, "POST", {
      locale,
      content,
    });
  }

  createAiTranslationDraft(
    input: TranslationAiDraftRequestDto,
  ): Promise<{ translation: TranslationAdminItemDto }> {
    return this.request(apiRoutes.admin.translations.aiDraft, "POST", input);
  }

  exportTranslationPo(locale: UiLocale): Promise<{ content: string }> {
    const query = new URLSearchParams({ locale });
    return this.request(
      `${apiRoutes.admin.translations.export}?${query}`,
    );
  }

  register(input: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.request(apiRoutes.auth.register, "POST", input);
  }

  login(input: LoginRequestDto): Promise<AuthResponseDto> {
    return this.request(apiRoutes.auth.login, "POST", input);
  }

  search(params: SearchQueryRequestDto): Promise<SearchQueryResponseDto> {
    const queryParams = new URLSearchParams();
    queryParams.set("q", params.q);
    if (params.targetModel) queryParams.set("targetModel", params.targetModel);
    if (params.limit) queryParams.set("limit", String(params.limit));
    return this.request(`${apiRoutes.search.query}?${queryParams.toString()}`);
  }

  logout(): Promise<{ loggedOut: boolean }> {
    return this.request(apiRoutes.auth.logout, "POST");
  }

  sendChat(input: ChatRequestDto): Promise<ChatResponseDto> {
    return this.request(apiRoutes.chat, "POST", input);
  }

  listConversations(): Promise<ConversationListResponseDto> {
    return this.request(apiRoutes.conversations.collection);
  }

  createConversation(
    input: CreateConversationRequestDto = {},
  ): Promise<{ conversation: ConversationDto }> {
    return this.request(apiRoutes.conversations.collection, "POST", input);
  }

  listMessages(id: string): Promise<ConversationMessagesResponseDto> {
    return this.request(apiRoutes.conversations.messages(id));
  }

  deleteConversation(id: string): Promise<{ deleted: boolean }> {
    return this.request(apiRoutes.conversations.item(id), "DELETE");
  }

  listModels(): Promise<{ models: ModelMetadataDto[] }> {
    return this.request(apiRoutes.models.collection);
  }

  listRecords(model: string): Promise<ModelRecordsResponseDto> {
    return this.request(apiRoutes.models.records(model));
  }

  computeModel(
    model: string,
    input: ComputeModelQueryRequestDto = {},
  ): Promise<ModelRecordsResponseDto> {
    return this.request(apiRoutes.models.compute(model), "POST", input);
  }

  createRecord(
    model: string,
    values: ModelRecordDto,
  ): Promise<ModelRecordResponseDto> {
    return this.request(apiRoutes.models.records(model), "POST", { values });
  }

  updateRecord(
    model: string,
    id: string,
    values: ModelRecordDto,
  ): Promise<ModelRecordResponseDto> {
    return this.request(apiRoutes.models.record(model, id), "PATCH", { values });
  }

  deleteRecord(model: string, id: string): Promise<{ deleted: boolean }> {
    return this.request(apiRoutes.models.record(model, id), "DELETE");
  }

  listProviders(): Promise<ProviderListResponseDto> {
    return this.request(apiRoutes.providers.collection);
  }

  createProvider(input: ModelProviderInputDto): Promise<ProviderResponseDto> {
    return this.request(apiRoutes.providers.collection, "POST", input);
  }

  updateProvider(
    id: string,
    input: ModelProviderInputDto,
  ): Promise<ProviderResponseDto> {
    return this.request(apiRoutes.providers.item(id), "PUT", input);
  }

  deleteProvider(id: string): Promise<{ deleted: boolean }> {
    return this.request(apiRoutes.providers.item(id), "DELETE");
  }

  listConnectors(): Promise<ConnectorListResponseDto> {
    return this.request(apiRoutes.connectors.collection);
  }

  createConnector(input: CreateConnectorRequestDto): Promise<ConnectorResponseDto> {
    return this.request(apiRoutes.connectors.collection, "POST", input);
  }

  updateConnector(
    id: string,
    input: UpdateConnectorRequestDto,
  ): Promise<ConnectorResponseDto> {
    return this.request(apiRoutes.connectors.item(id), "PUT", input);
  }

  deleteConnector(
    id: string,
    input: DeleteConnectorRequestDto,
  ): Promise<{ deleted: boolean }> {
    return this.request(apiRoutes.connectors.item(id), "DELETE", input);
  }

  verifyConnector(id: string): Promise<VerifyConnectorResponseDto> {
    return this.request(apiRoutes.connectors.verify(id), "POST");
  }

  syncConnector(id: string): Promise<SyncConnectorResponseDto> {
    return this.request(apiRoutes.connectors.sync(id), "POST");
  }

  listConnectorZones(id: string): Promise<ZoneListResponseDto> {
    return this.request(apiRoutes.connectors.zones(id));
  }

  listConnectorRecords(
    id: string,
    zoneId: string,
    filter: { name?: string; type?: string } = {},
  ): Promise<RecordListResponseDto> {
    const query = new URLSearchParams();
    if (filter.name) query.set("name", filter.name);
    if (filter.type) query.set("type", filter.type);
    const suffix = query.toString();
    return this.request(
      `${apiRoutes.connectors.records(id, zoneId)}${suffix ? `?${suffix}` : ""}`,
    );
  }

  createConnectorRecord(
    id: string,
    zoneId: string,
    input: CloudflareRecordInputDto,
  ): Promise<RecordResponseDto> {
    return this.request(apiRoutes.connectors.records(id, zoneId), "POST", input);
  }

  updateConnectorRecord(
    id: string,
    zoneId: string,
    recordId: string,
    input: CloudflareRecordInputDto,
  ): Promise<RecordResponseDto> {
    return this.request(
      apiRoutes.connectors.record(id, zoneId, recordId),
      "PATCH",
      input,
    );
  }

  deleteConnectorRecord(
    id: string,
    zoneId: string,
    recordId: string,
    input: DeleteRecordRequestDto,
  ): Promise<{ deleted: boolean; name: string }> {
    return this.request(
      apiRoutes.connectors.record(id, zoneId, recordId),
      "DELETE",
      input,
    );
  }

  listConnectorAudit(id: string): Promise<AuditListResponseDto> {
    return this.request(apiRoutes.connectors.audit(id));
  }

  listWorkflowQueue(): Promise<WorkflowChangeListResponseDto> {
    return this.request(apiRoutes.workflow.queue);
  }

  requestWorkflowTransition(
    id: string,
    input: TransitionRequestDto,
  ): Promise<TransitionResponseDto> {
    return this.request(apiRoutes.workflow.transition(id), "POST", input);
  }

  listWorkflowTransitions(
    id: string,
  ): Promise<WorkflowTransitionListResponseDto> {
    return this.request(apiRoutes.workflow.transitions(id));
  }

  listLexicalResearchCandidates(
    editionKey: string,
  ): Promise<LexicalResearchReviewQueueResponseDto> {
    return this.request(apiRoutes.research.lexicalCandidateQueue(editionKey));
  }

  createLexicalResearchReview(
    candidateId: string,
    input: CreateLexicalResearchReviewRequestDto,
  ): Promise<CreateLexicalResearchReviewResponseDto> {
    return this.request(
      apiRoutes.research.lexicalCandidateReview(candidateId),
      "POST",
      input,
    );
  }

  listCorpusEditions(): Promise<CorpusEditionListResponseDto> {
    return this.request(apiRoutes.corpus.editions);
  }

  readCorpusSurah(
    editionKey: string,
    surah: number,
  ): Promise<CorpusSurahResponseDto> {
    return this.request(apiRoutes.corpus.surah(editionKey, surah));
  }

  readCorpusVerse(
    editionKey: string,
    surah: number,
    ayah: number,
  ): Promise<CorpusVerseResponseDto> {
    return this.request(apiRoutes.corpus.verse(editionKey, surah, ayah));
  }

  listSourceArtifacts(): Promise<SourceArtifactListResponseDto> {
    return this.request(apiRoutes.source.artifacts);
  }

  getSourceArtifact(id: string): Promise<SourceArtifactResponseDto> {
    return this.request(apiRoutes.source.item(id));
  }

  projectProgressSummary(): Promise<ProjectProgressSummaryDto> {
    return this.request(apiRoutes.projectProgress.summary);
  }

  landingCatalog(): Promise<LandingCatalogResponseDto> {
    return this.request(apiRoutes.landing.catalog);
  }

  publicModelExplorer(
    modelName?: string,
  ): Promise<PublicModelExplorerResponseDto> {
    return this.request(
      modelName
        ? apiRoutes.landing.model(modelName)
        : apiRoutes.landing.models,
    );
  }

  listProjectTasks(): Promise<ProjectTaskListResponseDto> {
    return this.request(apiRoutes.projectProgress.tasks);
  }

  listAdminUsers(): Promise<AdminUserListResponseDto> {
    return this.request(apiRoutes.admin.users.collection);
  }

  listRoles(): Promise<RoleListResponseDto> {
    return this.request(apiRoutes.admin.roles.collection);
  }

  updateUserRole(
    id: string,
    role: string,
  ): Promise<{ user: AdminUserDto }> {
    const body: UpdateUserRoleRequestDto = { role };
    return this.request(apiRoutes.admin.users.role(id), "PATCH", body);
  }

  deactivateUser(id: string): Promise<{ deactivated: boolean }> {
    return this.request(apiRoutes.admin.users.deactivate(id), "POST");
  }

  private async request<T>(
    path: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    body?: unknown,
  ): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      method,
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new MoonClientError(
        "Server mengembalikan respons yang tidak valid.",
        response.status,
      );
    }
    if (!response.ok) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "Permintaan gagal. Coba lagi.";
      const code =
        typeof payload === "object" &&
        payload !== null &&
        "code" in payload &&
        typeof payload.code === "string"
          ? payload.code
          : undefined;
      throw new MoonClientError(message, response.status, code);
    }
    return payload as T;
  }
}

export const moonClient = new MoonClient();
