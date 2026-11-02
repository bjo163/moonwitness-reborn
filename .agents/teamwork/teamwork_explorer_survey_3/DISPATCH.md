## 2026-11-02T10:58:30Z
You are teamwork_explorer_survey_3.
Your working directory is: z:\project\moonstranaut\.agents\teamwork\teamwork_explorer_survey_3
Parent conversation ID: 15ce11f1-e3a8-45f6-959a-ed89d1ed23fb

You MUST read the original request before starting:
Path to ORIGINAL_REQUEST.md: z:\project\moonstranaut\.agents\teamwork\ORIGINAL_REQUEST.md

Your mission:
Explore and document the API/client and frontend/UI architectural conventions of MoonWitness:
1. Examine `@moonwitness/moonclient` (in `packages/moonclient` or wherever it resides): inspect how routes are declared, how DTOs are structured, request/response contracts, and how `moonClient` client methods are exposed.
2. Examine `@moonwitness/ui` (in `packages/ui`): inspect composites (`packages/ui/src/composites/`), styles (`packages/ui/styles/**`), `.ql-*` and `is-*` token conventions, CSS tokens, and anti-slop guidelines in `.agents/skills/antislop/` (and antislop-ui, antislop-human, antislop-layoutmobile).
3. Examine `apps/web`: inspect how `moonClient` is called, how pages/composites are structured, WCAG 2.2 AA accessibility conventions, and the ban on raw form elements, inline styles, arbitrary colors, or raw internal anchors.
4. Formulate the concrete template and rules for defining API contracts in `moonClient` and UI component specifications adhering to `@moonwitness/ui` and anti-slop standards for each of the 30 tracks.

Save your detailed report to:
z:\project\moonstranaut\.agents\teamwork\teamwork_explorer_survey_3\handoff.md
Update your progress.md periodically.
When finished, send a message back with your findings and path to handoff.md.
