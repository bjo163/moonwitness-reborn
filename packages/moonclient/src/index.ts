export interface ApiErrorBody {
  error: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
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
    this.fetcher = options.fetcher ?? fetch;
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
