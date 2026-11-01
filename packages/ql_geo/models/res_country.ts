import type { QlModelDefinition } from "ql_orm";

export const resCountry: QlModelDefinition = {
  name: "res.country",
  description: "Referensi negara ISO 3166-1.",
  tableName: "res_country",
  fields: {
    code: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 2,
      validator: (value) =>
        typeof value === "string" && /^[A-Z]{2}$/.test(value)
          ? undefined
          : "Field 'code' must be an uppercase ISO 3166-1 alpha-2 code.",
    },
    name: { type: "char", required: true, maxLength: 120 },
  },
};
