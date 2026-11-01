import {
  MoonClientError,
} from "@moonwitness/moonclient";
import type { UiMessageKey } from "ql_i18n/catalogs";

type Translate = (key: UiMessageKey) => string;

const translationErrorKeys: Record<string, UiMessageKey> = {
  ACCESS_DENIED: "web.errors.accessDenied",
  AUTHENTICATION_REQUIRED: "web.errors.authentication",
  INTERNAL_ERROR: "web.errors.server",
  I18N_ACCESS_DENIED: "web.errors.accessDenied",
  I18N_CONFLICT: "web.errors.conflict",
  I18N_INTERNAL: "web.errors.server",
  I18N_NOT_FOUND: "web.errors.notFound",
  I18N_REQUEST_INVALID: "web.errors.invalidRequest",
  I18N_SERVICE_UNAVAILABLE: "web.errors.server",
  I18N_VALIDATION: "web.errors.invalidRequest",
  METHOD_NOT_ALLOWED: "web.errors.invalidRequest",
  RATE_LIMITED: "web.errors.rateLimited",
  REQUEST_INVALID: "web.errors.invalidRequest",
  REQUEST_TOO_LARGE: "web.errors.invalidRequest",
  RESOURCE_CONFLICT: "web.errors.conflict",
  RESOURCE_NOT_FOUND: "web.errors.notFound",
  SERVICE_UNAVAILABLE: "web.errors.server",
  UPSTREAM_FAILURE: "web.errors.server",
};

export function apiErrorMessage(error: unknown, t: Translate): string {
  if (!(error instanceof MoonClientError)) {
    return error instanceof TypeError
      ? t("web.errors.network")
      : t("web.errors.generic");
  }

  const keyedError = error.code ? translationErrorKeys[error.code] : undefined;
  if (keyedError) return t(keyedError);
  if (error.status === 401) return t("web.errors.authentication");
  if (error.status === 403) return t("web.errors.accessDenied");
  if (error.status === 404) return t("web.errors.notFound");
  if (error.status === 409) return t("web.errors.conflict");
  if (error.status === 413 || error.status === 400) {
    return t("web.errors.invalidRequest");
  }
  if (error.status === 429) return t("web.errors.rateLimited");
  if (error.status >= 500) return t("web.errors.server");
  return t("web.errors.generic");
}
