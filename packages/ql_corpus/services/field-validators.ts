/**
 * Shared field-level validators for `ql_corpus`. `enumValidator` mirrors
 * `ql_integration` / `ql_workflow` / `ql_source`; `authorityValidator` is
 * the **narrower subset guard** that makes MW-ADR-019's religious-integrity
 * invariant structural: it accepts only a caller-supplied subset of the
 * global `PASSAGE_KINDS` union, so the same enum vocabulary can legally
 * resolve for the passage table (TEXT_AUTHORITIES) while rejecting the
 * tafsir/reflection entries, and vice versa for the annotation table.
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

/**
 * Subset guard. `allowed` is a **narrow** list — e.g. `TEXT_AUTHORITIES`
 * for `corpus.passage.authority`, `ANNOTATION_AUTHORITIES` for
 * `corpus.annotation.authority`. Passing a value from the broader
 * `PASSAGE_KINDS` union that is not in the subset is a validation failure,
 * and QlOrm's `createRecordForService` / `createForService` paths both run
 * the validator (`packages/ql-orm/src/index.ts:319-322`), so even the
 * importer cannot bypass this by writing through the service path.
 */
export function authorityValidator(
  label: string,
  allowed: readonly string[],
): (value: unknown) => string | undefined {
  return (value) =>
    typeof value === "string" && allowed.includes(value)
      ? undefined
      : `Field '${label}' must be one of [${allowed.join(", ")}] — cross-class writes are refused by MW-ADR-019.`;
}

/** Lowercase 64-hex SHA-256 checksum. */
export function sha256Validator(
  label: string,
): (value: unknown) => string | undefined {
  return (value) =>
    typeof value === "string" && /^[0-9a-f]{64}$/.test(value)
      ? undefined
      : `Field '${label}' must be a 64-character lowercase hex SHA-256.`;
}

/** Loose BCP 47 language-tag check (`ar`, `ar-SA`, `en`, `id`, …). */
export function bcp47Validator(
  label: string,
): (value: unknown) => string | undefined {
  return (value) =>
    typeof value === "string" &&
    /^[a-zA-Z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(value)
      ? undefined
      : `Field '${label}' must be a BCP 47 language tag.`;
}
