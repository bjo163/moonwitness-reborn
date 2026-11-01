type TranslateMetadata = (key: string, fallback: string) => string;

export function translateMetadata(
  key: string | undefined,
  fallback: string,
  tm: TranslateMetadata,
): string {
  return key ? tm(key, fallback) : fallback;
}
