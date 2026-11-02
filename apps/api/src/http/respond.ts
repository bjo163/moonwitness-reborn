import type { ServerResponse } from "node:http";

export class RequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

const CODE_BY_STATUS: Record<number, string> = {
  400: "REQUEST_INVALID",
  401: "AUTHENTICATION_REQUIRED",
  403: "ACCESS_DENIED",
  404: "RESOURCE_NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  409: "RESOURCE_CONFLICT",
  413: "REQUEST_TOO_LARGE",
  415: "MEDIA_TYPE_REJECTED",
  416: "RANGE_UNSATISFIABLE",
  429: "RATE_LIMITED",
  502: "UPSTREAM_FAILURE",
  503: "SERVICE_UNAVAILABLE",
  507: "STORAGE_QUOTA_REACHED",
};

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: object,
  headers: Record<string, string> = {},
) {
  const bodyRecord = body as Record<string, unknown>;
  const errorBody =
    statusCode >= 400 &&
    typeof bodyRecord.error === "string" &&
    typeof bodyRecord.code !== "string"
      ? {
          ...bodyRecord,
          code: CODE_BY_STATUS[statusCode] ?? "INTERNAL_ERROR",
        }
      : body;
  response.writeHead(statusCode, {
    "content-type": "application/json",
    ...headers,
  });
  response.end(JSON.stringify(errorBody));
}
