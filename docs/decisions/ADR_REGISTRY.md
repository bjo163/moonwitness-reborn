# Master ADR Registry

**Status:** MW-ADR-001 is accepted by the owner; all other proposed ADRs remain pending unless marked `REQUIRED` by workspace instructions. Historical ADRs retain context and are not automatically applicable.

| ID | Decision topic | Proposed direction | Status / required evidence |
|---|---|---|---|
| MW-ADR-001 | Primary repository | `bjo163/moonwitness-reborn` is the primary implementation repository; retain XV as alternate/history | ACCEPTED by owner in chat on 2026-11-01; branch-policy and clean-CI remediation remain open |
| MW-ADR-002 | Product topology | One integrated Web/API application and one identity/API/release authority | PROPOSED from owner directive; confirm foundation details |
| MW-ADR-003 | Addon/schema authority | TypeScript `ql_*` addons and QlOrm; no Drizzle/migration files | REQUIRED by local `AGENTS.md`; document accepted implementation contract |
| MW-ADR-004 | API ownership | Shared moonclient routes/DTO/SDK; web via moonClient; API thin boundary | REQUIRED by local `AGENTS.md` |
| MW-ADR-005 | Canonical data/domain owners | Domain matrix in `docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md` | PROPOSED; resolve final names/overlap before model additions |
| MW-ADR-006 | Corpus owner/import | ql_corpus/RGBL owns exact text; ql_source rights/provenance | PROPOSED; rights and dataset audit first |
| MW-ADR-007 | First vertical slice | Source→edition/passage→claim/evidence→human review→publication | PROPOSED; select audience and licensed source |
| MW-ADR-008 | Storage and database | Keep current QlOrm contract; choose engine after workload/support review | PROPOSED; current local LibSQL observed, no final engine selected |
| MW-ADR-009 | External MOONSKY/ECHOLOG | Optional adapters only, no independent identity or required product | PROPOSED; contract/threat model and measured need |
| MW-ADR-010 | UI and i18n | `@moonwitness/ui`, dark/light and id/en | REQUIRED target direction; brand/tokens/library still need review |
| MW-ADR-011 | AI canonical writes | Human approval for canonical/restricted writes; no religious/historical final authority | PROPOSED; threat model and product policy |
| MW-ADR-012 | Governance task source | Root `TODO.md` sole status register; issue records mirror after approval | PROPOSED; no issues created in audit |
| MW-ADR-013 | External-service credentials | MoonWitness never stores a service token: `integration.connector` has no secret column, no contract field accepts a token, and the API resolves the credential from the OS credential store the provider CLI uses (`CLOUDFLARE_API_TOKEN` → keychain → config file) at request time | ACCEPTED by owner in chat on 2026-11-01 (supersedes the earlier encrypted-column design); read-only kind `cloudflare_read` also accepted; revocation runbook and per-source rotation evidence pending |
| MW-ADR-014 | Roles and route gates | One `res.role` catalog compiled in `ql_auth` seeds/repairs `res.users.role` rows at boot; groups are derived from code, never from user-editable data; routes are deny-by-default on group (`connector` manages connectors, `operator` drives them and writes DNS); `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_TOKEN` grant root once, only while zero super_admins exist | ACCEPTED by owner in chat on 2026-11-01 as "standard enterprise role system"; role-to-person assignment UI exists at `/admin/users`, formal review evidence pending |

## ADR template

Each future ADR records: ID, status, date, context, problem, options, decision, rationale, consequences, risks, migration, verification, superseded decision, owner and review evidence. Use statuses PROPOSED, ACCEPTED, REJECTED, SUPERSEDED, DEPRECATED. Preserve source links and exact SHAs. Do not turn every implementation detail into an ADR.
