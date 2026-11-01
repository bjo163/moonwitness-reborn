# Implementation Conformance Audit

**Audit result: PARTIAL; product conformance is not certified.** This report records
implementation evidence observed in the workspace and separates it from the canonical
requirement catalog. Presence of a document, package, route, or passing build is not proof
that every requirement is implemented.

## Audit snapshot and method

- Repository: `bjo163/moonwitness-reborn`, branch `dev`.
- Committed baseline: `40c04f172ff91d8002c8d51c4922c8abc6b59a37` (`origin/dev` at inspection).
- The workspace was dirty and changed during this audit. Local checks therefore describe
  the checked working tree at the time each command ran, not a reproducible clean SHA.
- A workflow UI feature appeared in the working tree during the final verification pass.
  The feature files remain untracked and were not edited by this audit.
- Inspected the API and web source trees, package/addon manifests, model/service/view/ACL
  code, shared client contracts, relevant tests, root checks, and GitHub Actions for the
  committed baseline.
- Confirmed D30 has 1,891 catalog entries, 29 canonical owner documents, valid TODO links,
  and complete legacy domain/phase/deliverable crosswalks. Every entry now has an explicit
  implementation disposition and review basis: 369 `GAP`, 267 `PARTIAL`, 1,255 `UNKNOWN`,
  and zero `UNVERIFIED`. These dispositions are conservative triage, not requirement-level
  certification.

## Atomic requirement disposition

The catalog now records a status and rationale for every `MWREQ-*` entry. The triage rules
are intentionally conservative:

| Disposition | Count | Basis |
|---|---:|---|
| `GAP` | 369 | The owning addon is absent for the requirement's explicit domain section, or the end-to-end journey/domain capability has no owner implementation. The domain inventory below records the missing owners. |
| `PARTIAL` | 267 | The related subsystem and some code/tests exist (the review basis names the observed package or test area), but the individual statement has no separate requirement-level test mapping. |
| `UNKNOWN` | 1,255 | This audit did not establish direct implementation-and-test evidence for the individual statement. Specifications, links, and aggregate green checks are not treated as proof. |
| `UNVERIFIED` | 0 | All catalog entries have been dispositioned; the gate rejects missing rationale and `UNVERIFIED` status. |

This closes the **audit-triage** portion of MW-0601: no catalog entry is silently left
unreviewed, and each remaining gap/unknown retains its existing TODO link(s). It does not
mean that the 1,255 unknown requirements are implemented, that the 267 partial requirements
meet their full acceptance criteria, or that the 369 gaps are approved for deferral. Owner
ratification and feature delivery remain separate work.

## Domain implementation coverage

The target architecture names 23 domain owners. Only three of those currently have addon
manifests/models in the inspected working tree. `ql_workflow` is untracked in this workspace,
so it is not part of the committed baseline and is not present in the successful CI run.

| Target domain | Addon | Workspace evidence | Status |
|---|---|---|---|
| Identity | `ql_auth` | `packages/ql_auth/__manifest__.ts`, models and RBAC tests | Partial |
| Organization | `ql_org` | No addon manifest found | Gap |
| Person | `ql_person` | No addon manifest found | Gap |
| Character | `ql_character` | No addon manifest found | Gap |
| Source Registry | `ql_source` | No addon manifest found | Gap |
| Corpus / RGBL | `ql_corpus` | No addon manifest found | Gap |
| Ontology / UNILEX | `ql_ontology` | No addon manifest found | Gap |
| Witness | `ql_witness` | No addon manifest found | Gap |
| Event / LEGEND | `ql_event` | No addon manifest found | Gap |
| Story / MFTL | `ql_story` | No addon manifest found | Gap |
| Evidence | `ql_evidence` | No addon manifest found | Gap |
| Research | `ql_research` | No addon manifest found | Gap |
| Legal / AWS | `ql_law` | No addon manifest found | Gap |
| Relationship / CORRELATION | `ql_relationship` | No addon manifest found | Gap |
| Assessment / Mizan | `ql_mizan` | No addon manifest found | Gap |
| Journey | `ql_journey` | No addon manifest found | Gap |
| Creative | `ql_creative` | No addon manifest found | Gap |
| Media | `ql_media` | No addon manifest found | Gap |
| AI Platform | `ql_ai` | `packages/ql_ai/__manifest__.ts`, provider model/service | Partial |
| Workflow | `ql_workflow` | Manifest, models, services and tests exist only in the dirty workspace | Partial; uncommitted |
| Publication | `ql_publication` | No addon manifest found | Gap |
| Search | `ql_search` | No addon manifest found | Gap |
| Platform Operations | `ql_ops` | No addon manifest found | Gap |

`ql_base`, `ql_chat`, `ql_integration`, and `ql_cloudflare` also have code, but the
architecture explicitly classifies them as shared-kernel or supporting addons, not substitutes
for the missing domain owners. The absence of a manifest is direct evidence of a domain
implementation gap; it does not rule out incidental or duplicate logic elsewhere.

## Evidence by implementation area

| Area | Observed code and tests | Result |
|---|---|---|
| Web/API boundary | The web uses `@moonwitness/moonclient`; shared route and DTO definitions exist in `packages/moonclient/src/index.ts`. The API dispatches those shared routes in `apps/api/src/http/server.ts`. Static search found no direct `fetch`, `XMLHttpRequest`, or alternate HTTP client in `apps/web/src`. | Partial: the single transport boundary is present for scanned web code; this does not establish conformance for every planned route or domain. |
| Authentication and ACL | `ql_auth` declares models, ACL and views; `packages/ql_auth/services/rbac.test.ts` checks role behavior and private role fields. API tests cover first-use setup and authenticated model operations. | Partial: tested paths exist; full role/tenant/domain isolation is not established. |
| QlOrm and private fields | `packages/ql-orm/src/index.ts` implements manifest/model validation, ACL checks, owner-scoped service access, and private-field filtering. Its tests exercise LibSQL ACL/owner behavior and private fields. | Partial: core controls are tested; the absent 20 domain addons have no corresponding manifest/model/ACL evidence. |
| AI provider secrets | `ql_ai` declares `ownerField` and a private encrypted-key field. API tests verify encrypted storage, owner-scoped listing, hidden metadata, and foreign-owner access denial. | Partial: these tests cover the provider path, not every secret or internal-service path. |
| Connectors | `ql_integration` and `ql_cloudflare` declare read-only user ACLs; connector/API tests check token non-disclosure and foreign-owner isolation. | Partial: only the implemented Cloudflare connector is evidenced; the catalog's broader integration scope is not. |
| Workflow | The dirty workspace contains `ql_workflow` manifest/models/services and tests for state transitions, owner isolation, and private views, plus a newly appearing review-queue UI. | Partial and uncommitted: no clean-SHA or GitHub CI evidence for this addon or UI. |
| UI and localization | The production build renders routes for home, auth, admin users, command center/chat, connectors/DNS, models, and providers. The locale feature contains Indonesian and English message maps. | Partial: a successful build is not browser, accessibility, responsive, complete translation-parity, or theme verification. |
| Database/schema policy | A source scan found no Drizzle references or SQL migration files under `apps/` and `packages/`; workspace bootstrap uses QlOrm manifests. | Partial: static absence scan and build do not prove all data access, persistence behavior, or migration/recovery requirements. |
| Operations and release | A successful CI run exists for the committed baseline; this audit did not execute deployment, backup/restore, rollback, or production acceptance. | Unknown / not verified. |

## Verification evidence

### Committed baseline

GitHub Actions run [41297776561](https://github.com/bjo163/moonwitness-reborn/actions/runs/41297776561)
completed successfully on `40c04f172ff91d8002c8d51c4922c8abc6b59a37`. Its required `validate`
job passed frozen-lockfile install, build, lint, typecheck, and tests. This is evidence for
that clean commit only; it does not cover local uncommitted changes.

### Dirty workspace

Commands executed locally against the changing working tree:

| Command | Result |
|---|---|
| `pnpm lint` | Pass on the current dirty worktree |
| `pnpm typecheck` | Pass: 28 Turbo tasks, including the workflow UI |
| `pnpm test` | Pass: 22 Turbo tasks |
| `pnpm build` | Pass on the current dirty worktree: lint and 15 Turbo build tasks; the workflow route was included |
| Catalog and traceability gates | Both pass; catalog regression suite passes 12 tests; `git diff --check` passes |

The first local `pnpm build` attempt failed because ESLint scanned generated JavaScript
under the alternate Next output directory `.next-verify` (2,655 generated-file errors).
`eslint.config.mjs` now ignores `**/.next-verify/**`, matching the existing `.next` output
ignore. The root build then passed. Generated output was left untouched.

The workflow UI sources are untracked and changed during this audit; they were not modified
here. The latest typecheck now passes, but the uncommitted feature still has no clean-SHA or
GitHub CI evidence.

## Open gaps and existing task links

| Gap | Evidence required to close it | Existing TODO |
|---|---|---|
| 20 missing domain addons | Owner-approved scope; each addon manifest, models, views, ACL, shared contracts, and addon-specific tests; domain boundary checks | MW-0611, MW-0612, MW-1001, MW-1101 |
| Unknown requirement evidence | Resolve the 1,255 `UNKNOWN` dispositions with requirement-specific code/test evidence or a more precise gap/partial finding; preserve exact source and task links | Existing task IDs on each catalog row; implementation tasks in MW-08xx–MW-12xx |
| Product decisions and ratification | Record owner decisions against an exact baseline SHA | MW-0602, MW-0616 |
| Rights and first source-to-publication slice | Rights-cleared source/edition, provenance, fail-closed rights behavior, and end-to-end evidence | MW-0605, MW-0901–MW-0905, MW-1104 |
| Security coverage beyond tested paths | Documented positive/negative tests for all shipped domain ACLs, ownership boundaries, private fields, and internal services | MW-1105 |
| UX and localization acceptance | Browser verification plus keyboard, screen-reader, contrast, responsive, reduced-motion, and translation-parity checks | MW-0606–MW-0608, MW-1106–MW-1108 |
| Operations and recovery | Reproducible deployment, backup, isolated restore, rollback, and approved recovery targets | MW-0813–MW-0814, MW-1110–MW-1113 |
| Current-snapshot build evidence | Rerun lint/build against the current worktree snapshot and record the exact result; keep uncommitted workflow features distinct from baseline CI evidence | MW-0601, MW-1001, MW-1106 |

## Conclusion

The current implementation is a working foundation with significant gaps, not a complete
implementation of the D30 requirements. The catalog triage is complete: all 1,891 entries have
a status and review basis, but 1,255 remain `UNKNOWN`, 267 are `PARTIAL`, and 369 are known
`GAP`. The 20 missing domain addons remain absent; `ql_workflow` and its UI exist only in the
uncommitted workspace. MW-0601 can close as an audit/triage task, not as product conformance,
feature delivery, or release approval. Do not treat this report, local checks, or successful
clean-baseline CI as owner ratification, production certification, or deployment evidence.
