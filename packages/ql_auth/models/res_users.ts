import type { QlModelDefinition } from "ql_orm";

export const resUsers: QlModelDefinition = {
  name: "res.users",
  description: "Akun pengguna.",
  tableName: "res_users",
  fields: {
    name: { type: "char", required: true, maxLength: 100 },
    email: { type: "char", required: true, unique: true, maxLength: 254 },
    password_hash: { type: "char", required: true, private: true },
    active: { type: "boolean", required: true, default: true },
    created_at: { type: "datetime", required: true },
  },
};
