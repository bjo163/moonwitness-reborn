import type { QlModelDefinition } from "ql_orm";
import { DEFAULT_ROLE, isKnownRole } from "../services/rbac.js";

export const resUsers: QlModelDefinition = {
  name: "res.users",
  description: "Akun pengguna.",
  tableName: "res_users",
  fields: {
    name: { type: "char", required: true, maxLength: 100 },
    email: { type: "char", required: true, unique: true, maxLength: 254 },
    password_hash: { type: "char", required: true, private: true },
    active: { type: "boolean", required: true, default: true },
    role: {
      type: "char",
      required: true,
      default: DEFAULT_ROLE,
      maxLength: 40,
      private: true,
      validator: (value) =>
        typeof value === "string" && isKnownRole(value)
          ? undefined
          : "Field 'role' must be a known role code.",
    },
    created_at: { type: "datetime", required: true },
  },
};
