import { po as gettextPo } from "gettext-parser";
import { QlValidationError } from "ql_orm";

export interface PoCatalogEntry {
  namespace: string;
  key: string;
  sourceText: string;
  translatedText: string;
  sourcePluralText?: string;
  translatedPluralTexts?: Partial<Record<PluralCategory, string>>;
  context?: string;
}

export type PluralCategory = "one" | "other";

const KEY_PATTERN = /^[a-z][a-z0-9_-]*(?:\.[a-z][a-zA-Z0-9_-]*)+$/;
const PLACEHOLDER_PATTERN = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;
const PLURAL_CATEGORIES: Record<string, readonly PluralCategory[]> = {
  id: ["other"],
  en: ["one", "other"],
};

export function pluralCategories(locale: string): readonly PluralCategory[] {
  const categories = PLURAL_CATEGORIES[locale];
  if (!categories) {
    throw new QlValidationError(`PO plural rules are not configured for '${locale}'.`);
  }
  return categories;
}

function placeholders(value: string): string[] {
  return [...value.matchAll(PLACEHOLDER_PATTERN)]
    .map((match) => match[1])
    .sort();
}

function validateEntry(
  locale: string,
  context: string,
  sourceText: string,
  translatedText: string,
  sourcePluralText?: string,
  translatedPluralTexts?: Partial<Record<PluralCategory, string>>,
): PoCatalogEntry {
  const separator = context.indexOf(":");
  if (separator <= 0 || separator === context.length - 1) {
    throw new QlValidationError("PO entries require msgctxt 'namespace:key'.");
  }
  const namespace = context.slice(0, separator);
  const key = context.slice(separator + 1);
  if (!KEY_PATTERN.test(`${namespace}.${key}`)) {
    throw new QlValidationError(`PO message key '${context}' is invalid.`);
  }
  if (!sourceText.trim() || sourceText.length > 4000 || translatedText.length > 4000) {
    throw new QlValidationError(`PO message '${context}' has invalid text length.`);
  }
  if (
    JSON.stringify(placeholders(sourceText)) !==
    JSON.stringify(placeholders(translatedText))
  ) {
    throw new QlValidationError(
      `PO message '${context}' does not preserve its source placeholders.`,
    );
  }
  if (sourcePluralText !== undefined || translatedPluralTexts !== undefined) {
    if (!sourcePluralText || !translatedPluralTexts) {
      throw new QlValidationError(
        `PO plural message '${context}' requires source and translated plural forms.`,
      );
    }
    if (
      sourcePluralText.length > 4000 ||
      JSON.stringify(placeholders(sourcePluralText)) !==
        JSON.stringify(placeholders(sourceText))
    ) {
      throw new QlValidationError(
        `PO plural message '${context}' has incompatible source placeholders.`,
      );
    }
    for (const category of pluralCategories(locale)) {
      const translatedPluralText = translatedPluralTexts[category];
      if (
        typeof translatedPluralText !== "string" ||
        translatedPluralText.length > 4000 ||
        JSON.stringify(placeholders(sourcePluralText)) !==
          JSON.stringify(placeholders(translatedPluralText))
      ) {
        throw new QlValidationError(
          `PO plural message '${context}' has an invalid '${category}' form.`,
        );
      }
    }
  }
  return {
    namespace,
    key,
    sourceText,
    translatedText,
    ...(sourcePluralText ? { sourcePluralText } : {}),
    ...(translatedPluralTexts ? { translatedPluralTexts } : {}),
  };
}

export function parsePoCatalog(
  source: string,
  locale = "en",
): PoCatalogEntry[] {
  const categories = pluralCategories(locale);
  let parsed: ReturnType<typeof gettextPo.parse>;
  try {
    parsed = gettextPo.parse(Buffer.from(source, "utf8"));
  } catch (error) {
    throw new QlValidationError(
      `PO catalog could not be parsed: ${error instanceof Error ? error.message : "invalid syntax"}`,
    );
  }

  const entries: PoCatalogEntry[] = [];
  for (const [namespace, messages] of Object.entries(parsed.translations)) {
    for (const message of Object.values(messages)) {
      if (!message.msgid) continue;
      const context = message.msgctxt ?? namespace;
      if (message.msgid_plural) {
        const translatedPluralTexts = Object.fromEntries(
          categories.map((category, index) => [
            category,
            message.msgstr[index] ?? "",
          ]),
        ) as Partial<Record<PluralCategory, string>>;
        const translatedText =
          translatedPluralTexts.one ?? translatedPluralTexts.other ?? "";
        if (categories.some((category) => !translatedPluralTexts[category])) {
          continue;
        }
        entries.push(
          validateEntry(
            locale,
            context,
            message.msgid,
            translatedText,
            message.msgid_plural,
            translatedPluralTexts,
          ),
        );
      } else {
        const translatedText = message.msgstr[0] ?? "";
        if (!translatedText) continue;
        entries.push(validateEntry(locale, context, message.msgid, translatedText));
      }
    }
  }
  return entries;
}

export function compilePoCatalog(
  locale: string,
  entries: readonly PoCatalogEntry[],
): string {
  const translations: Record<
    string,
    Record<
      string,
      {
        msgid: string;
        msgctxt: string;
        msgstr: string[];
        msgid_plural?: string;
      }
    >
  > = {};
  const categories = pluralCategories(locale);
  for (const entry of entries) {
    const context = `${entry.namespace}:${entry.key}`;
    validateEntry(
      locale,
      context,
      entry.sourceText,
      entry.translatedText,
      entry.sourcePluralText,
      entry.translatedPluralTexts,
    );
    translations[context] ??= {};
    translations[context][entry.sourceText] = {
      msgid: entry.sourceText,
      msgctxt: context,
      msgstr: entry.translatedPluralTexts
        ? categories.map((category) => entry.translatedPluralTexts?.[category] ?? "")
        : [entry.translatedText],
      ...(entry.sourcePluralText ? { msgid_plural: entry.sourcePluralText } : {}),
    };
  }
  const pluralHeader =
    locale === "id"
      ? "nplurals=1; plural=0;"
      : "nplurals=2; plural=(n != 1);";
  return gettextPo
    .compile({
      charset: "UTF-8",
      headers: {
        "content-type": "text/plain; charset=UTF-8",
        "language": locale,
        "plural-forms": pluralHeader,
      },
      translations,
    })
    .toString("utf8");
}
