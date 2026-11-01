import type { QlModelDefinition } from "ql_orm";

export const i18nTranslation: QlModelDefinition = {
  name: "i18n.translation",
  description: "Entri katalog UI dan status terjemahannya.",
  tableName: "i18n_translation",
  fields: {
    catalog_key: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 280,
    },
    namespace: { type: "char", required: true, maxLength: 80 },
    message_key: { type: "char", required: true, maxLength: 160 },
    locale: { type: "char", required: true, maxLength: 35 },
    source_text: { type: "text", required: true, maxLength: 4000 },
    source_plural_text: { type: "text", maxLength: 4000 },
    context: { type: "text", maxLength: 2000 },
    translated_text: { type: "text", required: true, maxLength: 4000 },
    translated_plural_texts: {
      type: "text",
      required: true,
      default: "{}",
      maxLength: 10000,
      validator: (value) => {
        if (typeof value !== "string") {
          return "Field 'translated_plural_texts' must be JSON text.";
        }
        try {
          const parsed = JSON.parse(value) as unknown;
          return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
            ? undefined
            : "Field 'translated_plural_texts' must be a JSON object.";
        } catch {
          return "Field 'translated_plural_texts' must be valid JSON.";
        }
      },
    },
    status: {
      type: "char",
      required: true,
      default: "draft",
      maxLength: 12,
      validator: (value) =>
        value === "draft" || value === "published"
          ? undefined
          : "Field 'status' must be 'draft' or 'published'.",
    },
    draft_source: {
      type: "char",
      required: true,
      default: "manual",
      maxLength: 12,
      validator: (value) =>
        value === "manual" || value === "import" || value === "ai" || value === "seed"
          ? undefined
          : "Field 'draft_source' is invalid.",
    },
    updated_by: { type: "char", required: true, maxLength: 64 },
    updated_at: { type: "datetime", required: true },
  },
};
