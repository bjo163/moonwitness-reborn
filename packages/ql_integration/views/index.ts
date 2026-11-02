import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "integration.connector.list",
    model: "integration.connector",
    type: "list",
    fields: [
      "kind",
      "label",
      "token_source",
      "enabled",
      "verify_status",
      "last_verify_at",
      "updated_at",
    ],
  },
  {
    name: "integration.connector.form",
    model: "integration.connector",
    type: "form",
    fields: ["kind", "label", "enabled"],
  },
  {
    name: "integration.connector.landing",
    model: "integration.connector",
    type: "landing",
    fields: ["kind", "label", "enabled", "verify_status"],
    landing: {
      section: "foundation",
      sequence: 40,
      href: "/connectors",
      status: "available",
      titleKey: "web.landing.views.integration_connector.title",
      descriptionKey: "web.landing.views.integration_connector.description",
    },
  },
  {
    name: "integration.audit.list",
    model: "integration.audit",
    type: "list",
    fields: ["created_at", "action", "outcome", "target", "error_message"],
  },
  {
    name: "integration.audit.form",
    model: "integration.audit",
    type: "form",
    fields: [
      "created_at",
      "action",
      "outcome",
      "target",
      "detail",
      "error_message",
    ],
  },
];
