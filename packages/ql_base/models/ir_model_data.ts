import type { QlModelDefinition } from "ql_orm";

export const irModelData: QlModelDefinition = {
  name: "ir.model.data",
  description: "External identifiers for stable addon seed data.",
  tableName: "ir_model_data",
  fields: {
    external_id: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 255,
      private: true,
    },
    model_name: {
      type: "char",
      required: true,
      maxLength: 120,
      private: true,
    },
    record_id: {
      type: "char",
      required: true,
      maxLength: 120,
      private: true,
    },
  },
};
