import type { QlModelDefinition } from "ql_orm";

export const resSessions: QlModelDefinition = {
  name: "res.sessions",
  description: "Sesi autentikasi pengguna.",
  tableName: "res_sessions",
  softDelete: false,
  fields: {
    user_id: { type: "char", required: true, private: true },
    token_hash: { type: "char", required: true, unique: true, private: true },
    expires_at: { type: "datetime", required: true, private: true },
  },
};
