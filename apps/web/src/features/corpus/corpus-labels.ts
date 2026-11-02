import type { useTranslationCatalog } from "../locale/translation-catalog";

type Translate = ReturnType<typeof useTranslationCatalog>["t"];

export function authorityLabel(
  authority: string,
  locale: string,
  t: Translate,
): string {
  if (authority === "revelation_verbatim") {
    return t("web.corpus.authorityVerbatim", { locale });
  }
  if (authority === "translation") {
    return t("web.corpus.authorityTranslation", { locale });
  }
  return t("web.corpus.authorityAttributed", { authority });
}
