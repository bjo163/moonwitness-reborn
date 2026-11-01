import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import {
  runAgent,
  type AgentRequest,
  type ModelProvider,
  type OpenAICompatibleProviderOptions,
} from "@moonwitness/agent-runtime";
import type { ConversationStore, User } from "@moonwitness/database";
import {
  apiRoutes,
  type AdminUserDto,
  type AdminUserListResponseDto,
  type AuthResponseDto,
  type ChatMessageDto,
  type ChatRequestDto,
  type ChatResponseDto,
  type ConversationDto,
  type ConversationListResponseDto,
  type ModelProviderDto,
  type RoleDto,
  type RoleListResponseDto,
} from "@moonwitness/moonclient";
import {
  QlAccessError,
  QlConflictError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
} from "ql_orm";
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
  ROLE_CATALOG,
  countUsersWithRole,
  findRoleDefinition,
  groupsForRole,
  isKnownRole,
} from "ql_auth/services/rbac";
import {
  shouldGrantSuperAdmin,
  type BootstrapAdminSettings,
} from "../auth/bootstrap.js";
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

function messageDto(
  message: Awaited<ReturnType<ConversationStore["addMessage"]>>,
): ChatMessageDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

class RequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

async function readJsonBody(
  request: IncomingMessage,
): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
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

function parseAgentRequest(body: unknown): AgentRequest & ChatRequestDto {
  const { input, instructions, conversationId } = parseObject(body);
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
  return {
    input,
    conversationId,
    ...(typeof instructions === "string" ? { instructions } : {}),
  };
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: object,
  headers: Record<string, string> = {},
) {
  response.writeHead(statusCode, { "content-type": "application/json", ...headers });
  response.end(JSON.stringify(body));
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
  resolveToken: () => Promise<ResolvedCredential>;
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

export function createApiServer(
  provider: ModelProvider | undefined,
  store: ConversationStore,
  orm: QlOrm,
  options: {
    encryptionKey?: Buffer<ArrayBufferLike>;
    providerFactory?: ModelProviderFactory;
    bootstrapAdmin?: BootstrapAdminSettings;
    resolveConnectorToken?: () => Promise<ResolvedCredential>;
    cloudflareFetcher?: typeof fetch;
  } = {},
) {
  const connectorCredentials: ConnectorCredentials = {
    resolveToken: options.resolveConnectorToken ?? (() => resolveCloudflareToken()),
    fetcher: options.cloudflareFetcher ?? globalThis.fetch,
  };

  async function handleApiRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

    if (request.method === "GET" && pathname === apiRoutes.health) {
      sendJson(response, 200, { status: "ok" });
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
        if (await store.getUserByEmail(credentials.email)) {
          sendJson(response, 409, { error: "Email sudah terdaftar." });
          return;
        }
        let user;
        try {
          const grantRoot = await shouldGrantSuperAdmin(
            orm,
            credentials.email,
            options.bootstrapAdmin ?? {},
          );
          user = await store.createUser({
            name: credentials.name,
            email: credentials.email,
            passwordHash: await hashPassword(credentials.password),
            ...(grantRoot ? { role: "super_admin" } : {}),
          });
          if (grantRoot) {
            console.log(
              "Peran super_admin di-bootstrap dari BOOTSTRAP_ADMIN_EMAIL; cabut env tersebut setelah akun owner jadi.",
            );
          }
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
        const models = orm.registry
          .getModels()
          .filter((model) => orm.registry.can(model.name, groups, "read"))
          .map((model) => ({
            name: model.name,
            description: model.description,
            fields: Object.fromEntries(
              Object.entries(model.fields).filter(([, field]) => !field.private),
            ),
            views: orm.registry
              .getViews(model.name)
              .map((view) => ({
                ...view,
                fields: view.fields.filter(
                  (field) => !model.fields[field]?.private,
                ),
              })),
            permissions: {
              create: orm.registry.can(model.name, groups, "create"),
              write: orm.registry.can(model.name, groups, "write"),
              unlink: orm.registry.can(model.name, groups, "unlink"),
            },
          }));
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
                name: String(row.name ?? ""),
                description: String(row.description ?? ""),
                groups: splitGroups(String(row.groups ?? "user")),
                assignable: row.assignable === true,
              }))
            : ROLE_CATALOG.map((role) => ({
                code: role.code,
                name: role.name,
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
        sendJson(response, 200, {
          messages: (await store.getMessages(conversationId, user.id)).map(
            messageDto,
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

    if (request.method === "POST" && pathname === apiRoutes.chat) {
      const user = await requireAuthenticatedUser(request, response, store);
      if (!user) return;
      try {
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
        const chatProvider = configuredProviders.length
          ? createFallbackProvider(configuredProviders, options.providerFactory)
          : provider;
        if (!chatProvider) {
          request.resume();
          sendJson(response, 503, { error: "No model provider is configured." });
          return;
        }
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
        await store.addMessage(
          agentRequest.conversationId,
          user.id,
          "user",
          agentRequest.input.trim(),
        );

        let reply: string;
        try {
          reply = await runAgent(chatProvider, {
            ...agentRequest,
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
