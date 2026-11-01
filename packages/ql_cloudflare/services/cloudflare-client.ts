import {
  CloudflareApiError,
  CloudflareNetworkError,
  CloudflareRateLimitError,
} from "./errors.js";

/**
 * `new URL(path, base)` would drop the /client/v4 prefix and Cloudflare answers
 * with error 10404, so the base must be concatenated into the pathname.
 */
export const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

export const PAGE_SIZE = 100;
export const MAX_PAGES = 20;

const RATE_LIMITED_ENVELOPE_CODE = 10107;

export interface CloudflareZoneSummary {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  accountId: string;
}

export interface CloudflareDnsRecord {
  id: string;
  zoneId: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  comment: string;
  managed: boolean;
  createdOn: string;
}

export interface CloudflarePage<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export interface CloudflareTokenInfo {
  status: string;
  id: string;
}

export interface RecordInput {
  name: string;
  type: string;
  content: string;
  ttl: number;
  proxied: boolean;
  comment?: string;
}

interface RawEnvelope<T> {
  success?: boolean;
  errors?: { code?: number; message?: string }[];
  messages?: { code?: number; message?: string }[];
  result?: T;
  result_info?: { page?: number; total_pages?: number; per_page?: number };
}

export interface CloudflareClientOptions {
  token: string;
  fetcher: typeof fetch;
  baseUrl?: string;
}

export interface CloudflareClient {
  verifyToken(): Promise<CloudflareTokenInfo>;
  listZones(params?: {
    name?: string;
    page?: number;
  }): Promise<CloudflarePage<CloudflareZoneSummary>>;
  listRecords(
    zoneId: string,
    params?: { name?: string; type?: string; page?: number },
  ): Promise<CloudflarePage<CloudflareDnsRecord>>;
  createRecord(zoneId: string, input: RecordInput): Promise<CloudflareDnsRecord>;
  updateRecord(
    zoneId: string,
    recordId: string,
    input: RecordInput,
  ): Promise<CloudflareDnsRecord>;
  deleteRecord(zoneId: string, recordId: string): Promise<void>;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function toZone(row: Record<string, unknown>): CloudflareZoneSummary {
  const account = row.account as { id?: unknown } | undefined;
  return {
    id: asString(row.id),
    name: asString(row.name),
    status: asString(row.status, "pending"),
    paused: asBoolean(row.paused),
    accountId: asString(account?.id),
  };
}

function toRecord(row: Record<string, unknown>, zoneId: string): CloudflareDnsRecord {
  return {
    id: asString(row.id),
    zoneId: asString(row.zone_id, zoneId),
    name: asString(row.name),
    type: asString(row.type),
    content: asString(row.content),
    ttl: asNumber(row.ttl, 1),
    proxied: asBoolean(row.proxied),
    comment: asString(row.comment),
    managed: asBoolean(row.managed),
    createdOn: asString(row.created_on),
  };
}

function bodyFor(input: RecordInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.name.trim(),
    type: input.type.toUpperCase(),
    content: input.content.trim(),
    ttl: input.ttl,
    proxied: input.proxied,
  };
  const comment = input.comment?.trim();
  if (comment) body.comment = comment.slice(0, 500);
  return body;
}

export function createCloudflareClient(options: CloudflareClientOptions): CloudflareClient {
  const baseUrl = options.baseUrl ?? CLOUDFLARE_API_BASE;

  async function call<T>(
    method: string,
    path: string,
    init: { body?: unknown; query?: Record<string, string | number | undefined> } = {},
  ): Promise<{ result: T; page: number; totalPages: number }> {
    const url = new URL(baseUrl + path);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    let response: Response;
    try {
      response = await options.fetcher(url, {
        method,
        headers: {
          authorization: `Bearer ${options.token}`,
          ...(init.body === undefined
            ? {}
            : { "content-type": "application/json" }),
        },
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      });
    } catch {
      throw new CloudflareNetworkError();
    }

    let envelope: RawEnvelope<T>;
    try {
      envelope = (await response.json()) as RawEnvelope<T>;
    } catch {
      if (response.status === 429) throw new CloudflareRateLimitError(5000);
      throw new CloudflareNetworkError(
        `Cloudflare membalas status ${response.status} dengan body yang tidak dapat dibaca.`,
      );
    }

    if (envelope.success !== true) {
      const first = envelope.errors?.[0];
      const code = asNumber(first?.code, response.status);
      if (response.status === 429 || code === RATE_LIMITED_ENVELOPE_CODE) {
        const retryAfter = Number(response.headers.get("retry-after"));
        throw new CloudflareRateLimitError(
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000,
        );
      }
      throw new CloudflareApiError(
        code,
        asString(first?.message, `Permintaan Cloudflare gagal (HTTP ${response.status}).`),
      );
    }

    return {
      result: envelope.result as T,
      page: asNumber(envelope.result_info?.page, 1),
      totalPages: asNumber(envelope.result_info?.total_pages, 1),
    };
  }

  return {
    async verifyToken() {
      const { result } = await call<{ id?: string; status?: string }>(
        "GET",
        "/user/tokens/verify",
      );
      return { status: asString(result?.status, "unknown"), id: asString(result?.id) };
    },
    async listZones(params = {}) {
      const { result, page, totalPages } = await call<Record<string, unknown>[]>(
        "GET",
        "/zones",
        {
          query: {
            name: params.name,
            page: params.page ?? 1,
            per_page: PAGE_SIZE,
          },
        },
      );
      return {
        items: (result ?? []).map((row) => toZone(row)),
        page,
        totalPages,
      };
    },
    async listRecords(zoneId, params = {}) {
      const { result, page, totalPages } = await call<Record<string, unknown>[]>(
        "GET",
        `/zones/${encodeURIComponent(zoneId)}/dns_records`,
        {
          query: {
            name: params.name,
            type: params.type,
            page: params.page ?? 1,
            per_page: PAGE_SIZE,
          },
        },
      );
      return {
        items: (result ?? []).map((row) => toRecord(row, zoneId)),
        page,
        totalPages,
      };
    },
    async createRecord(zoneId, input) {
      const { result } = await call<Record<string, unknown>>(
        "POST",
        `/zones/${encodeURIComponent(zoneId)}/dns_records`,
        { body: bodyFor(input) },
      );
      return toRecord(result, zoneId);
    },
    async updateRecord(zoneId, recordId, input) {
      const { result } = await call<Record<string, unknown>>(
        "PATCH",
        `/zones/${encodeURIComponent(zoneId)}/dns_records/${encodeURIComponent(recordId)}`,
        { body: bodyFor(input) },
      );
      return toRecord(result, zoneId);
    },
    async deleteRecord(zoneId, recordId) {
      await call<Record<string, unknown>>(
        "DELETE",
        `/zones/${encodeURIComponent(zoneId)}/dns_records/${encodeURIComponent(recordId)}`,
      );
    },
  };
}
