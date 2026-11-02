# BRIEFING — 2026-11-02T11:00:00Z

## Mission
Explore and document the backend and data architecture conventions of MoonWitness: QlOrm models, manifests, views, seeding, ACL, and package conventions.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: z:\project\moonstranaut\.agents\teamwork\teamwork_explorer_survey_2
- Original parent: 15ce11f1-e3a8-45f6-959a-ed89d1ed23fb
- Milestone: survey backend and data architecture conventions (QlOrm, packages/ql_*)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strictly NO Drizzle ORM, NO Drizzle migrations
- All domain models must be declared as `ql_*` addons in `packages/`
- Model naming format: `domain.entity`
- Deny-by-default ACL, ownerField, private secret fields
- HTTP contracts in `@moonwitness/moonclient`

## Current Parent
- Conversation ID: 15ce11f1-e3a8-45f6-959a-ed89d1ed23fb
- Updated: not yet

## Investigation State
- **Explored paths**: `packages/ql-orm`, `packages/types`, `packages/ql_base`, `packages/ql_auth`, `packages/ql_corpus`, `packages/ql_source`, `packages/ql_geo`, `packages/ql_ai`, `packages/database`, `packages/moonclient`, `apps/api`
- **Key findings**: Complete QlOrm lifecycle, model definitions, field types (`char`, `text`, `integer`, `boolean`, `datetime`), owner isolation rules (`ownerField`), private secret fields, deny-by-default ACL, declarative views, external ID seed reconciliation (`ir.model.data`), and zero-migration runtime schema synchronization.
- **Unexplored areas**: None.

## Key Decisions Made
- Formulated concrete TypeScript templates for user-scoped models, platform reference models, and addon manifests.
- Mapped all 30 strategic tracks to their respective QlOrm models, addons, and immutability invariants.

## Artifact Index
- handoff.md — Comprehensive findings and TypeScript templates for QlOrm models and manifests
- progress.md — Liveness heartbeat and progress tracking
- DISPATCH.md — Stored dispatch instructions
