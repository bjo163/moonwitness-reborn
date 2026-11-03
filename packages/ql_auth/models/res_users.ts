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
    setup_claim: {
      type: "char",
      unique: true,
      private: true,
      maxLength: 32,
      validator: (value) =>
        value === "initial_super_admin"
          ? undefined
          : "Field 'setup_claim' is invalid.",
    },
    preferred_locale: {
      type: "char",
      required: true,
      default: "id",
      maxLength: 2,
      validator: (value) =>
        value === "id" || value === "en"
          ? undefined
          : "Field 'preferred_locale' must be 'id' or 'en'.",
    },
  },
};
