export function enumValidator(
  label: string,
  allowed: readonly string[],
): (value: unknown) => string | undefined {
  return (value) =>
    typeof value === "string" && allowed.includes(value)
      ? undefined
      : `Field '${label}' must be one of: ${allowed.join(", ")}.`;
}
