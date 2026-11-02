import type { QlViewDefinition } from "ql_orm";

export const views: QlViewDefinition[] = [
  {
    name: "workflow.project.list",
    model: "workflow.project",
    type: "list",
    fields: ["title", "state", "created_at", "updated_at"],
  },
  {
    name: "workflow.project.form",
    model: "workflow.project",
    type: "form",
    fields: ["title", "description", "state"],
  },
  {
    name: "workflow.task.list",
    model: "workflow.task",
    type: "list",
    fields: ["title", "status", "priority", "due_at", "project_id", "updated_at"],
  },
  {
    name: "workflow.task.form",
    model: "workflow.task",
    type: "form",
    fields: ["project_id", "title", "notes", "status", "priority", "due_at"],
  },
  {
    name: "workflow.change.list",
    model: "workflow.change",
    type: "list",
    fields: ["title", "state", "urgency", "revision", "updated_at"],
  },
  {
    // `state` is deliberately excluded from the form view so the generic
    // `/models` workspace never offers a dropdown the server would reject;
    // transitions go through `/workflow/changes/:id/transition`.
    name: "workflow.change.form",
    model: "workflow.change",
    type: "form",
    fields: ["title", "body", "subject_type", "subject_id", "urgency"],
  },
  {
    name: "workflow.change.landing",
    model: "workflow.change",
    type: "landing",
    fields: ["title", "state", "urgency", "revision"],
    landing: {
      section: "foundation",
      sequence: 30,
      href: "/workflow",
      status: "available",
      titleKey: "web.landing.views.workflow_change.title",
      descriptionKey: "web.landing.views.workflow_change.description",
    },
  },
  {
    name: "workflow.transition.list",
    model: "workflow.transition",
    type: "list",
    fields: ["created_at", "action", "from_state", "to_state", "reason"],
  },
];
