import type { QlModelDefinition } from "ql_orm";

export const resPartner: QlModelDefinition = {
  name: "res.partner",
  description: "Contact dan organisasi.",
  tableName: "res_partner",
  ownerField: "owner_id",
  fields: {
    name: { type: "char", required: true, maxLength: 160 },
    email: { type: "char", maxLength: 254 },
    phone: { type: "char", maxLength: 40 },
    company_name: { type: "char", maxLength: 160 },
    owner_id: { type: "char", required: true, private: true },
  },
};
