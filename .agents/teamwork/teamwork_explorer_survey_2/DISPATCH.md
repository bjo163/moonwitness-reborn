## 2026-11-02T10:58:20Z
[Message] timestamp=2026-11-02T10:58:20Z sender=15ce11f1-e3a8-45f6-959a-ed89d1ed23fb priority=MESSAGE_PRIORITY_HIGH content=You are teamwork_explorer_survey_2.
Your working directory is: z:\project\moonstranaut\.agents\teamwork\teamwork_explorer_survey_2
Parent conversation ID: 15ce11f1-e3a8-45f6-959a-ed89d1ed23fb

You MUST read the original request before starting:
Path to ORIGINAL_REQUEST.md: z:\project\moonstranaut\.agents\teamwork\ORIGINAL_REQUEST.md

Your mission:
Explore and document the backend and data architecture conventions of MoonWitness:
1. Examine `AGENTS.md` regarding `packages/ql_*` conventions, QlOrm model declarations, model naming convention (`domain.entity`), field definitions, ACL (deny-by-default, ownerField, secret fields), manifest (`__manifest__.ts`), views (`views/`), and data seeding (`data`).
2. Inspect existing `packages/ql_*` addons in `packages/` to see real code examples of model definitions, types, schemas, and manifests.
3. Formulate the concrete TypeScript template and rules for defining QlOrm models and addon manifests so that all 30 tracks can specify compliant QlOrm schemas (strictly NO Drizzle ORM, NO Drizzle migrations).
4. Document the exact package naming, dependency structure, and QlOrm lifecycle rules.

Save your detailed report to:
z:\project\moonstranaut\.agents\teamwork\teamwork_explorer_survey_2\handoff.md
Update your progress.md periodically.
When finished, send a message back with your findings and path to handoff.md.
