export interface ApiErrorBody {
  error: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  groups: string[];
}

export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: AuthUserDto;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

/** Always the same shape, so a caller cannot learn whether an address exists. */
export interface ForgotPasswordResponseDto {
  sent: boolean;
}

export interface ResetPasswordRequestDto {
  token: string;
  password: string;
}

export interface ResetPasswordResponseDto {
  reset: boolean;
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
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatRequestDto {
  conversationId: string;
  input: string;
  instructions?: string;
}

export interface ChatResponseDto {
  reply: string;
}

export interface ModelFieldDto {
  type: "char" | "text" | "integer" | "boolean" | "datetime";
  required?: boolean;
  maxLength?: number;
}

export interface ModelViewDto {
  name: string;
  model: string;
  type: "list" | "form";
  fields: string[];
}

export interface ModelMetadataDto {
  name: string;
  description: string;
  fields: Record<string, ModelFieldDto>;
  views: ModelViewDto[];
  permissions: {
    create: boolean;
    write: boolean;
    unlink: boolean;
  };
}

export type ModelRecordDto = Record<string, string | number | boolean | null>;

export interface ModelRecordsResponseDto {
  records: ModelRecordDto[];
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
  name: string;
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

export type ConnectorTokenSource = "unresolved" | "env" | "keychain" | "config_file";
export type ConnectorVerifyStatus = "unverified" | "ok" | "invalid" | "network" | "missing";

export interface ConnectorKindDto {
  kind: string;
  label: string;
  /** Where the app looks for this service's credential; displayed, never submitted. */
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

export interface MoonClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

const segment = (value: string) => encodeURIComponent(value);

export const apiRoutes = {
  health: "/health",
  auth: {
    me: "/auth/me",
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
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
  },
} as const;

export class MoonClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
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

  register(input: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.request(apiRoutes.auth.register, "POST", input);
  }

  login(input: LoginRequestDto): Promise<AuthResponseDto> {
    return this.request(apiRoutes.auth.login, "POST", input);
  }

  logout(): Promise<{ loggedOut: boolean }> {
    return this.request(apiRoutes.auth.logout, "POST");
  }

  requestPasswordReset(
    input: ForgotPasswordRequestDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.request(apiRoutes.auth.forgotPassword, "POST", input);
  }

  resetPassword(
    input: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    return this.request(apiRoutes.auth.resetPassword, "POST", input);
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
      throw new MoonClientError(message, response.status);
    }
    return payload as T;
  }
}

export const moonClient = new MoonClient();
