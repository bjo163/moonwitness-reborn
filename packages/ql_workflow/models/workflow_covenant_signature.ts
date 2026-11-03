import type { QlModelDefinition } from "ql_orm";

export const workflowCovenantSignature: QlModelDefinition = {
  name: "workflow.covenant_signature",
  description: "Cryptographic contributor covenant signature and research ethics oath.",
  tableName: "workflow_covenant_signature",
  fields: {
    covenant_version: {
      type: "char",
      required: true,
      maxLength: 32,
    },
    terms_digest: {
      type: "char",
      required: true,
      maxLength: 64, // SHA-256 hash of the exact terms text
    },
    signature_hash: {
      type: "char",
      required: true,
      maxLength: 64, // Cryptographic signature proof
    },
    contributor_callsign: {
      type: "char",
      required: true,
      maxLength: 100,
    },
    statement_accepted: {
      type: "boolean",
      required: true,
      validator(value) {
        return value === true ? undefined : "statement_accepted must be true to sign.";
      },
    },
    signer_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
  },
};
