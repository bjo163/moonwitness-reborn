import type { QlModelDefinition } from "ql_orm";

const purposes = new Set(["password_reset", "email_verify"]);

export const resVerification: QlModelDefinition = {
  name: "res.verification",
  description: "Token sekali pakai untuk pemulihan akun.",
  tableName: "res_verification",
  fields: {
    user_id: { type: "char", required: true, private: true },
    purpose: {
      type: "char",
      required: true,
      maxLength: 32,
      private: true,
      validator: (value) =>
        typeof value === "string" && purposes.has(value)
          ? undefined
          : `Field 'purpose' must be one of: ${[...purposes].join(", ")}.`,
    },
    token_hash: { type: "char", required: true, unique: true, private: true },
    expires_at: { type: "datetime", required: true, private: true },
    created_at: { type: "datetime", required: true, private: true },
  },
};
