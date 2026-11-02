import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "ai.provider.list",
    model: "ai.provider",
    type: "list",
    fields: ["name", "base_url", "model", "priority", "enabled"],
  },
  {
    name: "ai.provider.form",
    model: "ai.provider",
    type: "form",
    fields: ["name", "base_url", "model", "priority", "enabled"],
  },
  {
    name: "ai.provider.landing",
    model: "ai.provider",
    type: "landing",
    fields: ["name", "model", "enabled"],
    landing: {
      section: "foundation",
      sequence: 20,
      href: "/providers",
      status: "available",
      titleKey: "web.landing.views.ai_provider.title",
      descriptionKey: "web.landing.views.ai_provider.description",
    },
  },
];
