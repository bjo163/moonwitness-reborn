/**
 * Shared field-level validators for `ql_source`. `enumValidator` is the
 * same helper `ql_integration` and `ql_workflow` use — a future PR may
 * promote it to `@moonwitness/types` or a shared infra package once a
 * 4th addon needs it (per MW-ADR-015's 3-site duplication threshold).
 */

export function enumValidator(
  label: string,
  allowed: readonly string[],
): (value: unknown) => string | undefined {
  return (value) =>
    typeof value === "string" && allowed.includes(value)
      ? undefined
      : `Field '${label}' must be one of: ${allowed.join(", ")}.`;
}

/** Lowercase 64-hex SHA-256 checksum — the shape `source.version` and rights evidence require. */
export function sha256Validator(
  label: string,
): (value: unknown) => string | undefined {
  return (value) =>
    typeof value === "string" && /^[0-9a-f]{64}$/.test(value)
      ? undefined
      : `Field '${label}' must be a 64-character lowercase hex SHA-256.`;
}

/** Loose BCP 47 language-tag check (`ar`, `ar-SA`, `en`, `id`, `de-DE`, …). */
export function bcp47Validator(
  label: string,
): (value: unknown) => string | undefined {
  return (value) =>
    typeof value === "string" &&
    /^[a-zA-Z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(value)
      ? undefined
      : `Field '${label}' must be a BCP 47 language tag.`;
}
