import type { QlModelDefinition } from "ql_orm";

export const i18nLanguage: QlModelDefinition = {
  name: "i18n.language",
  description: "Bahasa antarmuka yang diaktifkan untuk MoonWitness.",
  tableName: "i18n_language",
  fields: {
    code: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 35,
      validator: (value) =>
        typeof value === "string" && /^[a-z]{2,3}(?:-[A-Z][a-zA-Z0-9]{1,7})*$/.test(value)
          ? undefined
          : "Field 'code' must be a valid locale tag.",
    },
    label: { type: "char", required: true, maxLength: 80 },
    enabled: { type: "boolean", required: true, default: true },
    direction: {
      type: "char",
      required: true,
      default: "ltr",
      maxLength: 3,
      validator: (value) =>
        value === "ltr" || value === "rtl"
          ? undefined
          : "Field 'direction' must be 'ltr' or 'rtl'.",
    },
    is_default: { type: "boolean", required: true, default: false },
  },
};
