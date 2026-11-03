import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  QlConflictError,
  QlNotFoundError,
  QlValidationError,
  type QlOrm,
  type QlRecord,
  type QlSeedDataRecord,
} from "ql_orm";
import {
  compilePoCatalog,
  parsePoCatalog,
  type PluralCategory,
  type PoCatalogEntry,
} from "./po.js";

export const ENABLED_LOCALES = ["id", "en"] as const;
export type EnabledLocale = (typeof ENABLED_LOCALES)[number];
export type TranslationState = "draft" | "published";

export interface TranslationCatalogItem {
  namespace: string;
  key: string;
  value: string;
  pluralForms?: Partial<Record<PluralCategory, string>>;
}

export interface TranslationAdminItem extends TranslationCatalogItem {
  locale: EnabledLocale;
  sourceText: string;
  sourcePluralText?: string;
  translatedPluralTexts?: Partial<Record<PluralCategory, string>>;
  context: string;
  status: TranslationState;
  draftSource: "manual" | "import" | "ai" | "seed";
  updatedBy: string;
  updatedAt: string;
  id: string;
}

export interface TranslationDraftInput {
  locale: EnabledLocale;
  namespace: string;
  key: string;
  sourceText: string;
  translatedText: string;
  sourcePluralText?: string;
  translatedPluralTexts?: Partial<Record<PluralCategory, string>>;
  context?: string;
  source?: "manual" | "import" | "ai";
}

export interface UiLanguage {
  code: EnabledLocale;
  label: string;
  direction: "ltr" | "rtl";
  isDefault: boolean;
}

export function isEnabledLocale(value: unknown): value is EnabledLocale {
  return (
    typeof value === "string" &&
    (ENABLED_LOCALES as readonly string[]).includes(value)
  );
}

function recordString(record: QlRecord, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`Stored i18n.translation field '${key}' is invalid.`);
  }
  return value;
}

function recordPluralForms(
  record: QlRecord,
): Partial<Record<PluralCategory, string>> {
  const raw = record.translated_plural_texts;
  if (raw === undefined || raw === null || raw === "") return {};
  if (typeof raw !== "string") {
    throw new Error("Stored translation plural forms are invalid.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error("Stored translation plural forms are invalid JSON.", {
      cause: error,
    });
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Stored translation plural forms are invalid.");
  }
  const forms: Partial<Record<PluralCategory, string>> = {};
  for (const [category, value] of Object.entries(parsed)) {
    if (
      (category !== "one" && category !== "other") ||
      typeof value !== "string"
    ) {
      throw new Error("Stored translation plural forms have an invalid shape.");
    }
    forms[category] = value;
  }
  return forms;
}

function mapAdminRecord(record: QlRecord): TranslationAdminItem {
  const translatedPluralTexts = recordPluralForms(record);
  const locale = recordString(record, "locale");
  if (!isEnabledLocale(locale)) {
    throw new Error("Stored translation locale is unsupported.");
  }
  const status = recordString(record, "status");
  const draftSource = recordString(record, "draft_source");
  if (status !== "draft" && status !== "published") {
    throw new Error("Stored translation state is invalid.");
  }
  if (
    draftSource !== "manual" &&
    draftSource !== "import" &&
    draftSource !== "ai" &&
    draftSource !== "seed"
  ) {
    throw new Error("Stored translation source is invalid.");
  }
  const updatedAt = record.updated_at;
  let updatedAtIso: string;
  if (typeof updatedAt === "number") {
    updatedAtIso = new Date(updatedAt).toISOString();
  } else if (typeof updatedAt === "string") {
    updatedAtIso = updatedAt;
  } else {
    updatedAtIso = "";
  }
  return {
    id: recordString(record, "id"),
    locale,
    namespace: recordString(record, "namespace"),
    key: recordString(record, "message_key"),
    value: recordString(record, "translated_text"),
    sourceText: recordString(record, "source_text"),
    ...(typeof record.source_plural_text === "string" &&
    record.source_plural_text
      ? { sourcePluralText: record.source_plural_text }
      : {}),
    ...(Object.keys(translatedPluralTexts).length > 0
      ? { translatedPluralTexts }
      : {}),
    context: typeof record.context === "string" ? record.context : "",
    status,
    draftSource,
    updatedBy: recordString(record, "updated_by"),
    updatedAt: updatedAtIso,
  };
}

function validateInput(input: TranslationDraftInput): PoCatalogEntry {
  if (!isEnabledLocale(input.locale)) {
    throw new QlValidationError("Translation locale is unsupported.");
  }
  const entry = {
    namespace: input.namespace,
    key: input.key,
    sourceText: input.sourceText,
    translatedText: input.translatedText,
    ...(input.sourcePluralText
      ? { sourcePluralText: input.sourcePluralText }
      : {}),
    ...(input.translatedPluralTexts
      ? { translatedPluralTexts: input.translatedPluralTexts }
      : {}),
    ...(input.context ? { context: input.context } : {}),
  };
  compilePoCatalog(input.locale, [entry]);
  return entry;
}

function catalogKey(locale: string, namespace: string, key: string): string {
  return `${locale}:${namespace}:${key}`;
}

export async function listAdminTranslations(
  orm: QlOrm,
  locale?: EnabledLocale,
): Promise<TranslationAdminItem[]> {
  const records = await orm.findManyByService(
    "i18n.translation",
    locale ? { locale } : {},
    { limit: 500, orderBy: { field: "namespace", direction: "asc" } },
  );
  return records.map(mapAdminRecord);
}

export async function getPublishedCatalog(
  orm: QlOrm,
  locale: EnabledLocale,
  namespace?: string,
): Promise<TranslationCatalogItem[]> {
  const records = await orm.findManyByService(
    "i18n.translation",
    {
      locale,
      status: "published",
      ...(namespace ? { namespace } : {}),
    },
    { limit: 500, orderBy: { field: "message_key", direction: "asc" } },
  );
  return records.map((record) => {
    const pluralForms = recordPluralForms(record);
    return {
      namespace: recordString(record, "namespace"),
      key: recordString(record, "message_key"),
      value: recordString(record, "translated_text"),
      ...(Object.keys(pluralForms).length > 0 ? { pluralForms } : {}),
    };
  });
}

export async function saveTranslationDraft(
  orm: QlOrm,
  input: TranslationDraftInput,
  actorId: string,
): Promise<TranslationAdminItem> {
  const entry = validateInput(input);
  const key = catalogKey(input.locale, input.namespace, input.key);
  const existing = await orm.findOneByService("i18n.translation", {
    catalog_key: key,
  });
  const values = {
    namespace: entry.namespace,
    message_key: entry.key,
    locale: input.locale,
    source_text: entry.sourceText,
    source_plural_text: entry.sourcePluralText ?? "",
    context: input.context ?? "",
    translated_text: entry.translatedText,
    translated_plural_texts: JSON.stringify(
      entry.translatedPluralTexts ?? {},
    ),
    status: "draft",
    draft_source: input.source ?? "manual",
    updated_by: actorId,
    updated_at: new Date().toISOString(),
  };
  if (existing) {
    await orm.updateRecordsForService(
      "i18n.translation",
      { id: existing.id },
      values,
      { actorId },
    );
    const updated = await orm.findOneByService("i18n.translation", {
      id: existing.id,
    });
    if (!updated) throw new Error("Updated translation could not be loaded.");
    return mapAdminRecord(updated);
  }
  const created = await orm.createRecordForService(
    "i18n.translation",
    {
      ...values,
      catalog_key: key,
    },
    { actorId },
  );
  return mapAdminRecord(created);
}

export async function approveTranslation(
  orm: QlOrm,
  id: string,
  actorId: string,
): Promise<TranslationAdminItem> {
  const existing = await orm.findOneByService("i18n.translation", { id });
  if (!existing) throw new QlNotFoundError("Translation entry not found.");
  if (recordString(existing, "status") !== "draft") {
    throw new QlConflictError("Only draft translations can be approved.");
  }
  await orm.updateRecordsForService(
    "i18n.translation",
    { id },
    {
      status: "published",
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    },
    { actorId },
  );
  const approved = await orm.findOneByService("i18n.translation", { id });
  if (!approved) throw new Error("Approved translation could not be loaded.");
  return mapAdminRecord(approved);
}

export async function importPoDrafts(
  orm: QlOrm,
  locale: EnabledLocale,
  content: string,
  actorId: string,
): Promise<TranslationAdminItem[]> {
  if (!isEnabledLocale(locale)) {
    throw new QlValidationError("Translation locale is unsupported.");
  }
  const entries = parsePoCatalog(content, locale);
  const imported: TranslationAdminItem[] = [];
  for (const entry of entries) {
    imported.push(
      await saveTranslationDraft(
        orm,
        {
          ...entry,
          locale,
          source: "import",
        },
        actorId,
      ),
    );
  }
  return imported;
}

export async function exportPoCatalog(
  orm: QlOrm,
  locale: EnabledLocale,
): Promise<string> {
  if (!isEnabledLocale(locale)) {
    throw new QlValidationError("Translation locale is unsupported.");
  }
  const all = await orm.findManyByService(
    "i18n.translation",
    { locale, status: "published" },
    { limit: 500 },
  );
  return compilePoCatalog(
    locale,
    all.map((record) => ({
      namespace: recordString(record, "namespace"),
      key: recordString(record, "message_key"),
      sourceText: recordString(record, "source_text"),
      translatedText: recordString(record, "translated_text"),
      ...(typeof record.source_plural_text === "string" &&
      record.source_plural_text
        ? { sourcePluralText: record.source_plural_text }
        : {}),
      ...(Object.keys(recordPluralForms(record)).length > 0
        ? { translatedPluralTexts: recordPluralForms(record) }
        : {}),
      ...(typeof record.context === "string" && record.context
        ? { context: record.context }
        : {}),
    })),
  );
}

export function createDefaultI18nData(): QlSeedDataRecord[] {
  const data: QlSeedDataRecord[] = [
    {
      id: "language_id",
      model: "i18n.language",
      key: { field: "code", value: "id" },
      values: {
        code: "id",
        label: "Bahasa Indonesia",
        direction: "ltr",
        is_default: true,
        enabled: true,
      },
      updatePolicy: "insert_only",
    },
    {
      id: "language_en",
      model: "i18n.language",
      key: { field: "code", value: "en" },
      values: {
        code: "en",
        label: "English",
        direction: "ltr",
        is_default: false,
        enabled: true,
      },
      updatePolicy: "insert_only",
    },
  ];

  for (const locale of ENABLED_LOCALES) {
    const content = readFileSync(
      fileURLToPath(new URL(`../i18n/${locale}.po`, import.meta.url)),
      "utf8",
    );
    for (const entry of parsePoCatalog(content, locale)) {
      const key = catalogKey(locale, entry.namespace, entry.key);
      const digest = createHash("sha256").update(key).digest("hex");
      data.push({
        id: `translation_${locale}_${digest}`,
        model: "i18n.translation",
        key: { field: "catalog_key", value: key },
        values: {
          catalog_key: key,
          namespace: entry.namespace,
          message_key: entry.key,
          locale,
          source_text: entry.sourceText,
          source_plural_text: entry.sourcePluralText ?? "",
          context: entry.context ?? "",
          translated_text: entry.translatedText,
          translated_plural_texts: JSON.stringify(
            entry.translatedPluralTexts ?? {},
          ),
          status: "published",
          draft_source: "seed",
        },
        updatePolicy: "insert_only",
      });
    }
  }
  return data;
}

export async function seedLanguages(orm: QlOrm): Promise<void> {
  await orm.seedAddonData("ql_i18n");
}

export async function listEnabledLanguages(orm: QlOrm): Promise<UiLanguage[]> {
  const records = await orm.findManyByService(
    "i18n.language",
    { enabled: true },
    { limit: 100, orderBy: { field: "code", direction: "asc" } },
  );
  return records.map((record) => {
    const code = recordString(record, "code");
    const direction = recordString(record, "direction");
    if (!isEnabledLocale(code) || (direction !== "ltr" && direction !== "rtl")) {
      throw new Error("Stored enabled UI language is invalid.");
    }
    return {
      code,
      label: recordString(record, "label"),
      direction,
      isDefault: record.is_default === true,
    };
  });
}

export async function seedCatalogs(orm: QlOrm): Promise<void> {
  await orm.seedAddonData("ql_i18n");
}
