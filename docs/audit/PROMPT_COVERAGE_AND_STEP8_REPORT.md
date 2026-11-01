# Archived Prompt Coverage and STEP 8 Report

**Status: historical snapshot, superseded by D30.** This report records the former source's FINAL ASSIGNMENT / STEP 8 mapping and gate output. It is not a current definition, validation result, or implementation approval. The authoritative requirement inventory and current gate are `docs/governance/REQUIREMENTS_TRACEABILITY.md` and `docs/audit/tools/requirement_coverage_gate.py`.

Coverage is machine-checked rather than asserted. Two offline/online gates back the claims below:

- `docs/audit/tools/repository_census_gate.py` — re-runs the three-source union census against GitHub and diffs it against the D02 matrix, then checks the estate-wide owner roll-up assigns every matrix row exactly once.
- The former prompt-coverage gate is retired. Its transcript below is retained solely as historical evidence and is not reproducible against the current catalog gate.

The transcript below is a historical local prompt-coverage run against `dev` HEAD `8fe4713e58c7`; its `BASELINE_TRACKING` line is not current. The gate was subsequently rerun against `dev` HEAD `40c04f172ff9` and passed, including all 23 domains, 20 contract attributes, 31 deliverables, 87 planning items, 37 build-item goals, 15 crosswalk rows, eight final-assignment steps, and the 58-task acyclic dependency map. GitHub Actions `validate` also passed on that exact commit: build, lint, typecheck, and tests completed successfully.

Separate local `pnpm lint`, `pnpm typecheck`, and `pnpm test` checks also passed on the current working tree, which contains uncommitted changes; they are preliminary evidence only and do not certify the clean commit. The prompt-coverage gate proves mapping consistency, not requirement implementation. A current implementation audit remains open under MW-0601; the repository census gate and deployment were not run for this update. `BASELINE_TRACKING` is a point-in-time snapshot; it separates unpushed commits from commits ahead of `origin/main`.

```text
PROMPT_43_COVERAGE 23 of 23 domains | missing: none | not in prompt: none | duplicated: none | unresolved owner: none
REGISTRY_ADDONS 27 rows | 23 distinct §4.3 owners | addons owning no §4.3 domain: ['ql_base', 'ql_chat', 'ql_cloudflare', 'ql_integration']
PROMPT_44_COVERAGE 20 of 20 attributes | missing: none | duplicated: none | attribute-name mismatch: none
D01_D31_REGISTER 31 of 31 | missing: none | extra: none | duplicated: none | bad document path: none
BASELINE_TRACKING 29 canonical documents | 0 not in HEAD, 0 not in index (R-49 closed: baseline committed, ratification still owed) | branch dev HEAD 8fe4713e58c7 | upstream origin/dev unpushed 0 | tracked-modified 6 | origin/main 4fdb7c777956 | ahead 17 behind 0 | tags on origin/main: v0.1.0
PROMPT_PHASES 13 in prompt | 13 in TODO.md | TODO has no row for PHASE: none
TODO_PHASES_NOT_IN_PROMPT: none (recorded as R-45; the prompt has no PHASE 13)
PHASE_TITLE_DRIFT (beyond the tolerated renumbering): none
PHASE_LISTS 87 of 87 planning items mapped across PHASE 0-7 | COVERED 74 PARTIAL 11 NONE 2
PHASE_LISTS_UNMAPPED: none
PHASE_LISTS_NOT_IN_PROMPT: none
PHASE_LISTS_BAD_CARRIER: none
PHASE_LISTS_STATUS_OR_GAP: none
PHASE_LIST_HOLES 13 item(s) not fully covered | PHASE 0 Inspect GitHub permissions (PARTIAL); PHASE 3 Search (NONE); PHASE 3 Storage (PARTIAL); PHASE 5 Brand (PARTIAL); PHASE 5 Design Tokens (PARTIAL); PHASE 6 Tenant Model (PARTIAL); PHASE 6 Performance Requirements (PARTIAL); PHASE 7 Microtask breakdown (PARTIAL); PHASE 7 Dependencies (PARTIAL); PHASE 7 GitHub Issues (PARTIAL); PHASE 7 GitHub Project (PARTIAL); PHASE 7 Labels (NONE); PHASE 7 Milestones (PARTIAL)
PHASE_LIST_HOLES_NAMED_IN_REPORT omitted: none
PHASE_BUILD_LISTS 8:14 9:0 10:0 11:13 12:8 | count drift: none | phases with no build row: none | rows outside 8-12: none
PILLAR_CROSSWALK 15 of 15 required rows | missing: none | invalid TODO IDs: none
FINAL_ASSIGNMENT_STEPS 8 of 8 | missing: none | extra: none | invalid TODO IDs: none
PLANNING_GAP_GOALS 13 of 13 | missing: none | extra: none | invalid TODO IDs: none
BUILD_ITEM_GOALS 37 of 37 | missing: none | extra: none | invalid TODO IDs: none
GOAL_TASK_IDS 58 declared | duplicates: none
GOAL_DEPENDENCIES 115 edges | missing: none | cycles: none
ACCEPTANCE_CRITERIA 9 of 9 addressed in the coverage report | not addressed: none
STEP8_REPORT 12 of 12 items present | missing: none | extra: none | title drift: none
OWNER_VOCABULARY 102 rows | ql_* names not in registry: none
PROSE_TALLIES 12 per-addon claims + 7 slot claims | mismatch: none
DOMAINS_WITH_NO_ESTATE_MATERIAL: ['ql_cloudflare', 'ql_creative', 'ql_journey', 'ql_org', 'ql_person', 'ql_search'] | of those, §4.3-required: ['ql_creative', 'ql_journey', 'ql_org', 'ql_person', 'ql_search']
FAMILY_VIEWS 44 compared rows | conflicts: none
MIGRATION_DECISIONS 102 rows | REFERENCE=76 REBUILD=12 IMPORT=3 ADOPT=1 RETAIN=1 | no label: 9
MIGRATION_ROWS_NAMED_IN_REPORT omitted: none
RECON_ENTRIES 53 distinct R-rows | R-01 -> R-53
BLOCKER_LISTS D03 18 items | TODO.md 18 items
GATE: PASS
```

The repository census gate was not run during this update. Do not copy its historical PASS into a claim about the latest commit.


## Historical verdict on requirement coverage

**Every normative list is mapped, but mapping is not implementation.** The current gate finds 13 PHASE 0–7 items still PARTIAL/NONE; all 13 now have TODO goals. The 35 enumerated build/verification/release items, plus the two prose-only phase outcomes, map to 37 blocked goals. The current crosswalk covers the 12 pillars, 31 deliverables, 23 domains, 20 contract attributes, nine acceptance criteria, 12 STEP 8 report requirements, and the final-assignment steps. None of these counts certifies code, tests, deployment, or owner ratification.

The official A-L-L-A-H.COM identity is now ratified in `docs/vision/ALLAH_COM_OFFICIAL_CANON.md`. PHASE 5 Brand is therefore PARTIAL, not NONE: visual brand usage, token ownership, and an approved production design remain separate work.

### Earlier audit closures (historical context)

1. §4.3 requires 23 canonical domains; the ownership registry carried 17. Evidence, Legal / AWS, Creative, Publication, Search and Platform Operations were missing, and three concepts had their owner in the wrong place. Now 23 of 23, each with §4.3's "must not own" text verbatim, with the three overlapping owners narrowed to one each, and with entity rows added to the data dictionary. (R-44)
2. §4.4 requires 20 contract attributes per domain. All 20 are now addressed in a coverage table that names the file carrying each, with the shortfall stated as a position instead of an omission. (R-46)
3. Two family-level capability maps disagreed with the evidence-based roll-up in four places each — the LAW corpus was mapped to the AI provider domain, the observability node to Person, the STORY corpus to Research, the operational console to Corpus. Corrected, and the roll-up is now authoritative by check, not by claim. (R-47)
4. The D02 roll-up's owner vocabulary can no longer name an addon the registry lacks, and the counts typed in its prose are compared to a fresh recount on every run. The three hand-typed-number errors this session produced are exactly the failure class this closes.
5. The two ratification-blocker lists had silently diverged: `TODO.md` item 11 still asked the owner to "rule on material with no ratified landing spot" — the question this pass answered by creating `ql_law` — while D03 item 11 had become "authorize committing the baseline". Both were reconciled to the same eighteen items in the same order, keyed to the same R-numbers, and compared during the historical audit. Now eighteen items, after R-50/R-51/R-52. (R-44/R-45/R-48/R-49)
6. **The per-phase deliverable lists were never checked at all.** The gate matched `## PHASE n — title` headings and stopped, so the `Produce:` / `Finalize:` / `Create:` / `Build:` / `Verify:` bullets under each phase — the part of the EXECUTION PROTOCOL that says what the plan must contain — could be dropped silently and nothing would notice. All 87 items of PHASE 0–7 are now mapped row by row in `docs/governance/REQUIREMENTS_TRACEABILITY.md` §PHASE 0–7 deliverable coverage, each with the carrier that holds it and a COVERED/PARTIAL/NONE status; the build phases carry their prompt item counts (8:14, 9:0, 10:0, 11:13, 12:8) recomputed on every run, and every non-covered row must cite a reconciliation entry that exists. Mapping them is what produced R-50, R-51 and R-52 — the check did not confirm the baseline was complete, it found three new problems.
7. **STEP 8's twelve items were verified by eye.** The prompt numbers twelve things the final report must contain; this document had twelve sections and no proof they were the same twelve. The gate now parses the prompt's numbered list and this file's `## n.` headings and compares them title by title: `STEP8_REPORT 12 of 12 items present | missing: none | extra: none | title drift: none`.
8. **The baseline is in git.** `8016edc…` on `dev` carries the 27 untracked planning files plus the two tracked-modified ones; the child commit `85feec0…` carries the last three documents, which turned out to be blocked by tooling rather than by the owner — an unanchored `data/` pattern in `.gitignore` line 9 silently excluded `docs/data/`, so three canonical documents were invisible to `git status` and could not be committed. Fixed with `!docs/data/`, verified by `git check-ignore` still matching runtime `data/` directories and by the gate's count reaching zero — and the count itself then had to be corrected, because it had been read from `git ls-files`, i.e. from the index, so `git add` alone made the baseline look committed; `BASELINE_TRACKING` now asks HEAD and prints `N not in HEAD, M not in index` (R-53). Ratification can now name a commit.

Two status changes landed under the audit rather than inside it. The CI `validate` gate that R-42 recorded as red at three consecutive tips went **green** at `7d801c3…`; then, in the last half hour of this pass, a parallel session merged PR #1 and PR #2, published tag and release **`v0.1.0`** at `4fdb7c7…` and switched on classic `main` protection (required `validate` check, `strict`, `enforce_admins` enabled). PHASE 7's "Branch Protection" and "Release Automation" items and PHASE 12's entire list are therefore now satisfied by work that was never part of this plan, while the plan they should have followed was sitting untracked (R-49 — now committed at `8016edc…` on `dev`) and is still unratified. Blocker 9 changes meaning again: the question is no longer "repair the gate" or "stabilize the branch" but **which commit ratification is allowed to name**, now that the branch has a released history and this checkout sits behind it.

### Current open decisions and gaps

- **R-49 — baseline ratification.** Planning files are committed. The current observed HEAD is `8fe4713e58c7099b3e52c76d3c64cbeb5d16b50c`; the owner must accept/amend against an exact SHA and decide how that snapshot is stabilized.
- **R-45 — phase numbering.** All PHASE 0–12 headings now exist in TODO; the older shifted interpretation for PHASE 3–11 remains pending owner reconciliation (MW-0615). Cloudflare is now labeled as the separate MW-0500 workstream, not prompt PHASE 12.
- **R-46/R-48 — domain contract depth and missing-source domains.** MW-0610 defines the goal to settle per-domain §4.4 requirements and write the events/notifications contract; MW-0611 records first-principles scope decisions for `ql_creative`, `ql_journey`, `ql_org`, `ql_person`, and `ql_search`.
- **R-50 — six phase-list items remain incomplete:** Search (NONE); Storage, Brand, Design Tokens, Tenant Model, and Performance Requirements (PARTIAL). Each now has a linked goal MW-0604–MW-0609. A-L-L-A-H.COM identity is ratified; visual brand usage is not.
- **R-51 — governance gaps.** Permission inventory, dependencies/DoD, labels, and GitHub Issues/Projects/Milestones mapping have goals MW-0603 and MW-0612–MW-0614. External GitHub objects remain intentionally gated.
- **R-52 — execution sequencing.** All 35 numbered PHASE 8/11/12 items and the prose-only PHASE 9/10 outcomes now map to 37 blocked TODO goals. Owner still must rule on prior work and `v0.1.0`; no CI result is established here for the current HEAD.

The 13 current planning-list holes are: PHASE 0 — Inspect GitHub permissions (PARTIAL); PHASE 3 — Search (NONE) and Storage (PARTIAL); PHASE 5 — Brand and Design Tokens (PARTIAL); PHASE 6 — Tenant Model and Performance Requirements (PARTIAL); PHASE 7 — Microtask breakdown, Dependencies, GitHub Issues, GitHub Project, and Milestones (PARTIAL), Labels (NONE). They are enumerated with carriers and status in `docs/governance/REQUIREMENTS_TRACEABILITY.md`; all 13 now point to a TODO goal, but remain open until goal evidence is accepted.

### Historical audit snapshot

The numbered report sections below preserve evidence captured during the earlier 2026-11-01 audit. They are historical snapshots, not fresh verification of the current code, branch, CI, or deployment state. Use the current goal map and exact-SHA evidence for present status.

## 1. Repository audit

`docs/audit/COMPLETE_REPOSITORY_INTELLIGENCE_AUDIT.md` (D01). Census method: three-source union (GraphQL `search(query:"user:<owner>")` with cursor pagination, REST `users/<owner>/repos`, REST `orgs/<owner>/repos`) after two discovery defects were proven — GitHub repository search excludes forks unless `fork:true`, and `ArsyBelovedLabs` is an organization, so a user-only listing missed 25 of its 27 repositories. Result: 259 + 27 names screened, **90 filter-matched candidates**, 84 with a pinned SHA, 6 verified empty, plus 2 carried rows = **92 tracked repository rows**, and 102 rows in total with the XV component slices. Depth, not breadth, is what remains partial: every row's Evidence column states what was and was not read.

## 2. Verified implementation reality

`bjo163/moonwitness-reborn` is the implementation repository of record. Its default branch showed **twelve pushed tips during this audit**; the twelfth, `7d801c348fab5bb24cf19c4fdb3961e5faf84375` ("Kelola DNS Cloudflare dari MoonWitness tanpa menyimpan token layanan"), is where the `validate` check-run this audit recorded as failing at three earlier tips concluded **success**. That session then went further while this report was being written: PR #1 and PR #2 merged, `main` gained classic branch protection with a required `validate` check and `enforce_admins`, and the new head `4fdb7c7…` carries the `v0.1.0` tag and release. This checkout sits on `dev` at `7e7a66c…` — the `origin/dev` tip, two commits ahead of the released `main` and green there (`validate` success, Actions run `41291851818`) — while this audit's own documents were, at that reading, what remained outside git: two tracked files modified and 26 canonical documents untracked (R-49). Item 8 above closes the second half: the baseline is committed as `8016edc…` plus its child, so the only local commits are those two, ahead of `origin/dev` until pushed. The branch, upstream, unpushed count, tracked-modified count and tag list come from the former coverage gate, not from this sentence. Both baseline commits are now pushed, and `validate` concluded **success** at `b6a57ca…` (Actions run `41294122698`) — the first time this audit's own output has passed the workspace gate it is auditing against, which matters because that gate is the thing `main` protection requires. What is implemented and tested is the Cloudflare DNS lane (`ql_integration`, `ql_cloudflare`, moonclient connector routes, `/connectors` UI); the ratified domain model is not. No other session's work is vouched for here, and the moving-tip pattern is the reason the plan requires re-reading `origin/main` before any implementation step.

## 3. Important conflicts

Full register in `docs/audit/ARCHITECTURE_AND_DOCUMENTATION_RECONCILIATION.md` (D03), 53 entries R-01–R-53. The ones that change what should be built:

- **R-49** the baseline's git position (above — now committed, ratification still owed); **R-53** the ignore rule that hid three of those documents from `git status`; **R-45** phase numbering; **R-44** six missing domains; **R-47** competing family maps.
- **R-43** every single-owner slot is oversubscribed before any adoption: 7 sources onto one design system, 2 onto one contract owner, 10 web surfaces onto one `apps/web`, 4 worker/API designs onto one `apps/api`.
- **R-40 / R-41** third-party material inside the account: a SurrealDB fork under BSL 1.1 whose grant withholds "use as a Database Service", and `bjo163/mooncripsy`, an unlinked rebranded copy of an external assistant-driving tool that is **still receiving commits in this account** and whose `PRODUCT.md` protects the positioning that contradicts the workspace's authenticated-provider model.
- **R-37–R-39** citation ambiguity: a shared "Empire of the Light" baseline claimed by two repositories, a broken supersession pointer, and a same-named organization/repository pair.

## 4. Resolved overlap

Resolution rule applied throughout, from `AGENTS.md` and §4.3: one canonical owner per concept, everything else stores typed references. Concretely — publication decisions moved out of `ql_workflow` into `ql_publication`; evidence records moved out of a `ql_research` field into `ql_evidence`; "narrative/creative work" split into `ql_story` (narrative, myth, folklore, versions) and `ql_creative` (original works, drafts, production, derivatives); operational records (jobs, runs, notifications, configuration state) given one owner in `ql_ops`; indexes given a derived-only owner in `ql_search` that can never hold canonical content. `mooncripsy` is excluded from every owner slot rather than mapped.

## 5. Missing capabilities

Domains with no estate material to build from: `ql_creative`, `ql_journey`, `ql_org`, `ql_person`, `ql_search` (and `ql_law` has exactly one source). Specification gaps: events and notifications (§4.4 attribute 13) has an owner but no written contract; field-level definitions exist as a template, not as data; per-domain ACL matrices, route sets and read models are pending; the two `TBD` private repositories (`moonwitness-xiv`, `bjo163/mw-core`) were never inventoried and stay `UNKNOWN` rather than guessed. Asset and model licensing is unresolved across the estate — `rocksoul-assets` has no LICENSE file at all.

## 6. Single application architecture

`BLUEPRINT.md` (D06/D07) and `MASTER_DESIGN.md` (D20) define one Web/API product: a modular monolith in one repository, `apps/web` plus `apps/api`, all domain behavior in `ql_*` TypeScript addons synchronized by QlOrm, `@moonwitness/moonclient` as the only DTO/route/SDK owner, `@moonwitness/ui` as the only design system, and no Drizzle, migration files, second shell or second identity authority. The audit's contribution is the count of what that rule displaces: 10 separate web surfaces, 4 worker/API designs, 7 design-system candidates and 2 SDK candidates that must be absorbed rather than added.

## 7. Canonical ownership

`docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md` (D08/D09) now covers all 23 §4.3 domains across 27 addon rows, the extra four being non-domain addons (`ql_base` shared kernel, `ql_chat`, `ql_integration`, `ql_cloudflare`). `docs/data/CANONICAL_DATA_DICTIONARY.md` (D11) carries entity-level ownership for every one of them. The per-repository assignment of all 102 mapped rows lives in the D02 roll-up; `36` rows resolve to `NONE`, `3` to `MULTIPLE` (split per capability, never adopt whole), and `2` stay honestly `TBD`.

## 8. Migration candidates

From the D02 matrix's migration column, counted over all 102 rows: **REFERENCE 76, REBUILD 12, IMPORT 3, ADOPT 1, RETAIN 1**, and 9 rows that carry an explicit exclusion or deferral instead of a label — the parked XV `apps/orbit`, `bjo163/mooncripsy`, `ArsyBelovedLabs/moonwitness-lab`, and the five `ArsyBelovedLabs/rocksoul-*` automation services `rocksoul-browser-worker`, `rocksoul-code-web`, `rocksoul-gateway`, `rocksoul-orchestrator` and `rocksoul-runner`, plus `bjo163/rocksoul-mind`. Each states its own condition rather than a decision word: `apps/orbit` is deferred pending approved UX inside one shell; `mooncripsy` and `moonwitness-lab` are excluded from capability migration, with `mooncripsy` also awaiting an owner statement of why it is in the account; the five automation services are not to be adopted, deployed or run as MoonWitness services, and only bounded, owner-approved capability ideas would be rebuilt inside the unified app; `rocksoul-mind` stays reference-only pending rights, provenance, evaluation, privacy and security review. Nothing is adopted by right of name similarity; each candidate still requires exact source SHA, code/test review, rights and provenance, and owner ratification.

## 9. Master documents

D01–D31 all have exactly one canonical document and all 31 paths exist — `D01_D31_REGISTER 31 of 31`. Status detail lives in `docs/audit/DELIVERABLE_REGISTER.md`; the register is where the "substantial / pending ratification" wording belongs, and this report deliberately does not restate it. The one correction worth stating here: existence is not reviewability, which is R-49.

## 10. Proposed implementation order

Unchanged in substance, with two steps added at the front:

0. Commit the baseline and make it the reviewable snapshot (R-49); settle phase numbering before any GitHub milestone is created (R-45).
1. Ratify or amend: vision (D04), product specification (D05), architecture (D06/D07), the 23 domains and their names (D08/D09), data and design baselines (D10–D21), security and operations (D22–D24, D29, D31), governance (D25–D28, D30).
2. First vertical slice as already specified — the Horizon 1 source-to-publication lifecycle through `ql_base` → `ql_auth` → `ql_source` → `ql_corpus` → `ql_research` → `ql_workflow` → `ql_publication`, with `moonclient` contracts and `@moonwitness/ui` reader/review screens, selected only after rights review of the chosen edition.
3. Domain expansion in dependency order, then integration and hardening, then release. Do not create unrelated addons ahead of the approved journey, and do not open a new lane the way the Cloudflare lane was opened mid-plan.

## 11. Risks and unresolved decisions

`docs/audit/ARCHITECTURE_AND_DOCUMENTATION_RECONCILIATION.md` lists **18 ratification blockers**, mirrored item-for-item in `TODO.md` §5 and checked as a pair by the gate; the six added by the last two passes are R-44 (corrected), R-45, R-46, R-49 and the phase-list findings R-50/R-51/R-52, with R-53 recorded as the tooling cause behind part of R-49. Highest-consequence items: ruling on a baseline that only became SHA-nameable during this pass (R-49 — `8016edc…` and its child, `0 not in git`; the decision is what is owed, not the files); a third-party product under active development inside the account with a written positioning that contradicts the provider model (R-41); BSL-licensed persistence material that must never become a dependency (R-40); assets with no license (rights risk); a repository that advanced twelve tips inside one audit and shipped `v0.1.0` before the plan that governs it was ratified (process risk — the build has outrun the review, R-42 and R-52); five §4.3 domains the estate cannot supply (delivery risk, since their design must be done from first principles); and two governance mechanics that are simply missing rather than deferred — no label scheme and no task-level dependencies (R-51).

## 12. First eligible implementation tasks

Only two kinds of work are eligible before ratification, and neither is feature coding:

- Owner actions: commit the baseline, then review and ratify or amend the 18 blockers; pick the phase ladder; ratify the six new domains and the single-owner capacity rule.
- Agent actions that remain inside the planning gate: re-run both gates after any move of `origin/main`; commission the two `TBD` inventories if the owner asks; write the events/notifications specification (R-48) and the per-domain contract pass (R-46) as documents; and add the rights register for `rocksoul-assets` and the corpus editions the first slice needs.

Everything else — new addons, routes, screens, migrations, CI lanes, branch protection changes, issue creation — waits behind the ratification gate.

## MASTER ACCEPTANCE CRITERIA coverage

How the baseline addresses each criterion of the legacy MASTER ACCEPTANCE CRITERIA. These are claims about the *plan*; the source's wording was that the project is not complete until its claims are supported by verifiable evidence, so each line names the document and the current evidence state.

**A. Product Integrity** — one Web/API application, one UX, one navigation, no duplicate surfaces, domain boundaries preserved. Defined in `BLUEPRINT.md` and `MASTER_DESIGN.md`; D02 roll-up quantifies the duplicate surfaces to be absorbed (10 web, 4 API, 7 design-system candidates). Evidence state: specification only; the current application has not been shown to satisfy it.

**B. Architecture Integrity** — one entry, one API authority, one identity authority, one transactional database authority, one schema ownership, internal modularity, no cycles, no duplicate canonical owners. Now machine-supported: `PROMPT_43_COVERAGE 23 of 23` with one owner per domain, `OWNER_VOCABULARY` with no invented addon, `FAMILY_VIEWS` with no competing map. The dependency graph is still a proposal and unratified.

**C. Knowledge Integrity** — sources, editions and passages identifiable; claims attributable; evidence inspectable; rights, provenance and uncertainty represented. `docs/data/DATA_LIFECYCLE_AND_PROVENANCE.md`, `docs/research/RESEARCH_AND_EVIDENCE_SPECIFICATION.md` and the newly separated `ql_evidence` domain define it; the census shows most of the actual corpus material is blocked on per-record rights, which is why the first slice cannot pick an edition yet.

**D. Character Integrity** — fictional and real identities separated; AI personas separated from agent execution; canon controlled. The registry keeps `ql_person`, `ql_character`, `ql_ai` and `ql_auth` apart with §4.3's boundary rules reproduced verbatim; `docs/creative/CHARACTER_BIBLE.md` is a boundary specification only. Note the estate supplies no `ql_person` material at all (R-48).

**E. AI Integrity** — explicit permissions, controlled tools, source-aware answers, no silent canonical writes, human approvals, evaluation, audit. `docs/ai/AI_AND_AGENT_ARCHITECTURE.md`, `docs/governance/AI_EXECUTION_CONTRACT.md` and the implemented `ql_ai`/`ql_workflow` rules define it. This is the criterion most directly contradicted by an in-account reality: an external assistant-driving tool whose README advertises driving provider web sessions with no API key and no MCP, and which is still being developed here (R-41).

**F. UX Integrity** — working navigation and forms, dark and light themes, Indonesian and English, responsive, accessible, honest states. `MASTER_DESIGN.md`, `docs/design/INTERNATIONALIZATION_SPECIFICATION.md` and `@moonwitness/ui` cover it; the i18n document records its own gap analysis (no locale framework yet, dark-only CSS), and no rendered UI has been verified in a browser for the connector work either.

**G. Security Integrity** — backend authorization, tenant isolation, secure secrets, rights enforcement, privacy, retention and deletion, recovery. `docs/security/SECURITY_AND_PRIVACY_BLUEPRINT.md`, MW-ADR-013 (no stored service credential) and MW-ADR-014 (compiled roles, deny-by-default) plus the implemented owner-scoped `ql_integration`/`ql_cloudflare` suites. Open: role-to-person assignment in production, removal of the bootstrap env after first login, and browser verification.

**H. Operational Integrity** — reproducible build and Docker deployment, health checks, structured observability, backup/restore evidence, versioned releases, rollback plan. `docs/operations/INFRASTRUCTURE_AND_DEPLOYMENT_BLUEPRINT.md`, `docs/operations/MIGRATION_AND_ROLLBACK_PLAN.md`, `docs/operations/RELEASE_AND_ACCEPTANCE_STRATEGY.md`, `docs/quality/QUALITY_AND_TESTING_STRATEGY.md`. `ql_ops` now owns in-product operational records; the events/notifications contract is still unwritten (R-48). Evidence of a backup and restore actually performed is still owed.

**I. Governance Integrity** — unique tasks, no duplicated issues, accepted decisions documented, exact-SHA evidence, CI verification, release traceability. Strongest on SHA discipline (two gates, one of which exists only to catch its own documents going stale) and weakest on R-49: the decisions being documented are not in the repository yet. `TODO.md` remains the single task registry, and R-45 is precisely an I-criterion violation waiting to be settled before GitHub milestones exist.
