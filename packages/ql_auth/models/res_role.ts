import type { QlModelDefinition } from "ql_orm";

export const resRole: QlModelDefinition = {
  name: "res.role",
  description: "Katalog peran dan grup akses yang diberikan.",
  tableName: "res_role",
  fields: {
    code: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 40,
      validator: (value) =>
        typeof value === "string" && /^[a-z][a-z0-9_]{2,39}$/.test(value)
          ? undefined
          : "Field 'code' must be a lowercase role identifier.",
    },
    name: { type: "char", required: true, maxLength: 80 },
    description: { type: "char", maxLength: 300 },
    groups: {
      type: "char",
      required: true,
      maxLength: 200,
      validator: (value) =>
        typeof value === "string" &&
        value
          .split(",")
          .every((group) => /^[a-z][a-z0-9_]{1,39}$/.test(group.trim()))
          ? undefined
          : "Field 'groups' must be a comma-separated list of group identifiers.",
    },
    assignable: { type: "boolean", required: true, default: true },
  },
};
