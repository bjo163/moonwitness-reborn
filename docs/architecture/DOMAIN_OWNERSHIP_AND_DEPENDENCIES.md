# Domain Ownership and Dependency Registry

**Status: PROPOSED.** Each canonical object has one owner. Package names are candidate `ql_*` addon names consistent with local policy; approve names before adding models. Consumers store typed references, not shadow copies.

This table now covers **all 23 domains mapped from the D30 legacy requirement catalog's §4.3** plus four addons not listed as domains (`ql_base` shared kernel, `ql_chat`, `ql_integration`, `ql_cloudflare`). The row-by-row mapping is shown in *§4.3 coverage* below; six of those 23 (Evidence, Legal/AWS, Creative, Publication, Search, Platform Operations) were absent from this registry until this pass, which is recorded as R-44 in `docs/audit/ARCHITECTURE_AND_DOCUMENTATION_RECONCILIATION.md`.

| Addon/domain | Canonical ownership | Explicit non-ownership / consumers |
|---|---|---|
| `ql_base` / shared kernel | shared identifiers, locale primitives, temporal primitives, common errors and the metadata shapes other domains reuse | No universal business entity table; holds no operational or domain records itself |
| `@moonwitness/types` / type-only vocabulary kernel | transport-neutral TypeScript unions reused by `ql_orm`, `@moonwitness/moonclient`, and every `ql_*` addon: `FieldType`, `ViewType`, `Operation`, `RecordValue`/`RecordValues`, `ConnectorTokenSource`, `ConnectorVerifyStatus`, `ChatRole` | Not a domain model. Holds no `*Dto`, no routes, no runtime values. Request/response contracts and the SDK still live in `@moonwitness/moonclient` (MW-ADR-004). `ql_base` remains the shared *addon* kernel that owns models. |
| `ql_auth` / identity | user principals, credentials, sessions, roles/grants, single-use verification tokens (`res.verification`) | Not a historical/fictional person registry; no addon stores message content — the API-side SMTP adapter and password-reset email were removed |
| `ql_org` / organization | organizations, tenant scopes, memberships/groups if required | Not product navigation or person biography |
| `ql_source` / source registry | source artifact, source version, source citation, rights record and provenance — **first-slice MVP implemented** as four models (`source.artifact`, `source.version`, `source.rights`, append-only `source.provenance`) behind a `/source/*` read-only prefix handler; the 9-stage lifecycle from `docs/data/DATA_LIFECYCLE_AND_PROVENANCE.md:8-12` is a required field on every record with `rights_status` defaulting to `"unknown"` (deny-by-default); rights/provenance transitions only via service path per MW-ADR-019 | Does not own normalized corpus text or research conclusions — that is `ql_corpus` |
| `ql_corpus` / RGBL | work, expression/edition, passage, exact text, translation and lexical records — **first-slice MVP implemented** as four models (`corpus.work`, `corpus.edition`, `corpus.passage`, `corpus.annotation`) with the storage-level religious-integrity invariant from MW-ADR-019: `corpus.passage.authority` accepts only `"revelation_verbatim"` or `"translation"` via `authorityValidator(TEXT_AUTHORITIES)`, `corpus.annotation.authority` rejects `"revelation_verbatim"` via `authorityValidator(ANNOTATION_AUTHORITIES)`, and `assertEditionKindLocaleInvariant` closes the cross-field gap that a single-value QlOrm validator cannot express; text is imported exclusively via the offline `pnpm --filter ql_corpus import:quran` CLI (bulk HTTP is disallowed by `apps/api/src/http/server.ts:111` body cap and by the capability-surface rule in `AGENTS.md:20`); nothing renders publicly until `source.rights.rights_status === "cleared"` and an operator publish action flips `stage` from `"staged"` to `"published"` | Does not own evidence verdicts, rights authority, or all annotation — rights/provenance live in `ql_source`, research conclusions live in `ql_research` |
| `ql_ontology` / UNILEX | canonical term/concept, definition, alias, semantic mapping — **deferred, not implemented**; nothing in reading or attributing the Al-Qur'an requires canonical-term mapping in this slice. `mw:dataset:lexicon:quran-arabic-core` (14 rows supplemental, per `docs/knowledge/CORPUS_INTEGRATION_PLAN.md:73`) is the first candidate once UNILEX ships. | Does not own every domain's descriptive text |
| `ql_person` | real/historical person identity, sourced roles/biography | Not user account, fictional character or AI agent |
| `ql_character` | fictional character, universe membership, canon, arc | Not a real person, prophet, angel, user or executable agent |
| `ql_witness` | testimony, observation, witness statement and transmission | References person/source/event; no duplicate identity |
| `ql_event` / LEGEND | historical/event record, chronology, place/time relations | Not story chapter or proof by itself |
| `ql_story` / MFTL | narrative, myth, folklore, motifs, story versions and story claims in a declared fictional/historical mode | Not event canonical facts, not source text, and not original creative production (that is `ql_creative`) |
| `ql_evidence` | evidence records and their support/contradiction/chain references, each traceable to a source and an interpretation | Not the original source artifact (that stays `ql_source`) and not the research case that consumes it |
| `ql_research` | question, hypothesis/claim, method, assessment, uncertainty and review | Evidence records belong to `ql_evidence`; no duplicate corpus or identity owner |
| `ql_law` / AWS | legal sources, jurisdiction, legal applicability and legal arguments | Not a general ethics engine; the underlying text stays in `ql_source`/`ql_corpus` |
| `ql_mizan` | named method/framework, rubric and versioned assessment method | Research owns each application/result; Mizan is not an overlapping verdict store |
| `ql_relationship` / CORRELATION | typed relationship assertion, direction, scope and supporting sources | No implicit truth; endpoint entity remains with its domain |
| `ql_workflow` | process definitions, review tasks, states, transitions and their executions — **first-slice MVP implemented** as four models (`workflow.project`, `workflow.task` for PM tracker; `workflow.change` and append-only `workflow.transition` for CAB) behind a `/workflow/*` prefix handler; reviewer group reuses `admin`/`operator` per MW-ADR-017 | Does not own domain content, author identity, or the published record itself (that is `ql_publication`); `ql_ops` (run/notification records) and rights clearance remain out of scope for MVP |
| `ql_publication` | editorial decisions and publication records: what was released, in which version, when, under what approval and rights state | Not the authoring data of any domain; cannot expose unlicensed or private content |
| `ql_journey` | user/organization journey plan and accountable action records | References research/content; does not certify external outcomes |
| `ql_creative` | original creative works, drafts, production records and derivative metadata | Not canonical ownership of the source content a derivative is based on |
| `ql_ai` | provider config, model capabilities, prompt/tool policy and execution audit | Agent execution is not character canon; no silent canonical writes |
| `ql_chat` | conversation/message records and retention policy | Not a research claim or canonical source record |
| `ql_integration` | external-service connector registry (`integration.connector`) and the action audit trail (`integration.audit`); the kind catalog and its read-only flag | Never stores a service credential — no secret column, no token in any DTO; it does not know transport details of any provider |
| `ql_cloudflare` | mirrored Cloudflare zones/records (`cloudflare.zone`, `cloudflare.record`), the API client, sync and DNS mutation rules | The mirror is a cache, not the authority (Cloudflare owns the real zone); it does not own the connector row, the credential, or the audit store |
| `ql_media` (candidate) | media metadata and approved asset links | Binary storage may be external adapter; rights remain linked to `ql_source` |
| `ql_search` | derived indexes, search sessions and retrieval configuration | Never canonical content: an index is rebuildable and search results never replace the authoritative record |
| `ql_ops` / platform operations | operational records inside the product — job/run state, notification records, health and configuration state, domain audit references | Not domain knowledge; it records that something happened, it does not decide content. Cloud credentials and connector actions stay in `ql_integration` |

## Dependency graph (proposed; arrows mean “depends on/reference contract”)

```text
ql_base ──► all addons (shared primitives only)
ql_auth ──► ql_org, ql_ai, ql_chat, ql_workflow, ql_ops, owner-scoped domains
ql_source ──► ql_corpus, ql_evidence, ql_witness, ql_research, ql_story, ql_law, ql_media, ql_publication
ql_ontology ──► ql_person, ql_event, ql_corpus, ql_research, ql_law (term references)
ql_person ──► ql_witness, ql_event, ql_story, ql_research
ql_character ──► ql_story, ql_creative
ql_corpus ──► ql_research, ql_law, reader/search UX
ql_evidence ──► ql_research, ql_mizan (evidence records consumed by assessment)
ql_event ──► ql_witness, ql_story, ql_research
ql_mizan ──► ql_research (method/version reference)
ql_research ──► ql_workflow, ql_journey, ql_publication
ql_workflow ──► ql_publication (approval handoff), ql_ops (execution records), publisher-facing experiences
ql_publication ──► ql_search and reader UX (read projections only)
ql_creative ──► ql_media, ql_source (derivative provenance), ql_character
ql_search ──► derives from canonical domains; owns no content and is never depended on for truth
ql_ops ──► operational records only; no domain read or write outside the owning addon
ql_integration ──► ql_auth (owner scope + role groups); connector registry and audit only, no credential storage
ql_cloudflare ──► ql_integration (connector scope), ql_ops (sync run/notification records), then the operator UI through moonclient routes
```

The graph is a planning hypothesis. Avoid cyclic addon dependencies; cross-links should use IDs and stable contracts. Keep package dependencies explicit in manifests and API bootstrap as required by `AGENTS.md`.

## §4.3 coverage — every domain in the D30 legacy requirement crosswalk

The D30 catalog preserves the §4.3 source requirements. This table records the proposed row-by-row ownership mapping and the "must not own" boundaries; the 23-row count is checked by the independent D30 requirement gate, but owner correctness and future changes still require review against the catalog and this registry.

| §4.3 domain | Registry owner | Must not own (§4.3) | Owner status here |
|---|---|---|---|
| Identity | `ql_auth` | Historical person identity | already present |
| Organization | `ql_org` | Person biographies | already present |
| Person | `ql_person` | Fictional character | already present |
| Character | `ql_character` | System user and AI execution | already present |
| Source Registry | `ql_source` | Full corpus content ownership | already present |
| Corpus / RGBL | `ql_corpus` | Research verdict | already present |
| Ontology / UNILEX | `ql_ontology` | Every domain's descriptive text | already present |
| Witness | `ql_witness` | Duplicate person identity | already present |
| Event / LEGEND | `ql_event` | Narrative story ownership | already present |
| Story / MFTL | `ql_story` | Historical event canonical records | already present |
| Evidence | `ql_evidence` | Original source artifact ownership | ADDED by this pass |
| Research | `ql_research` | Canonical scripture text | already present |
| Legal / AWS | `ql_law` | General ethics engine | ADDED by this pass |
| Relationship / CORRELATION | `ql_relationship` | Duplicated domain entities | already present |
| Assessment / Mizan | `ql_mizan` | Universal truth authority | already present |
| Journey | `ql_journey` | System workflow state machine | already present |
| Creative | `ql_creative` | Source content canonical ownership | ADDED by this pass |
| Media | `ql_media` | Physical storage implementation | already present |
| AI Platform | `ql_ai` | User identity and domain canonical truth | already present |
| Workflow | `ql_workflow` | Domain-specific canonical data | already present |
| Publication | `ql_publication` | Original authoring data of every domain | ADDED by this pass |
| Search | `ql_search` | Canonical content | ADDED by this pass |
| Platform Operations | `ql_ops` | Domain knowledge | ADDED by this pass |

Four addons in the registry above are deliberately **not** §4.3 domains and add no domain claim: `ql_base` (shared kernel, owns no records), `ql_chat` (conversation persistence; the prompt treats it inside the AI platform pillar rather than as a matrix row), `ql_integration` (connector registry and audit), and `ql_cloudflare` (a provider mirror). They must never absorb canonical data.

Adding the six missing rows forced three owner narrowings, because §4.3 allows exactly one canonical owner per concept and the earlier registry had each of these living in two places:

- publication decisions were listed under `ql_workflow`; they now belong to `ql_publication`, and `ql_workflow` keeps process definitions, states, transitions and executions.
- evidence was reachable only as an `evidence link` field of `ql_research`; evidence records now belong to `ql_evidence`, and `ql_research` keeps questions, hypotheses, methods, assessments and findings.
- `ql_story` was described as owning "narrative/creative work"; original creative works, drafts, production and derivative metadata now belong to `ql_creative`, and `ql_story` keeps narrative, myth, folklore, motifs, story versions and story claims.

The five §4.3-specific boundary rules in §4.3 ("Identity vs Person", "Person vs Character", "Character vs AI Persona vs Agent", "Witness vs Person", "Story vs Event", "Source vs Corpus", "Research vs Evidence", "Mizan vs Research", "Relationship vs Domain Relations", "Knowledge vs Domain Data", "Search vs Canonical Records") are already carried by the non-ownership column above; the last two are what make `ql_evidence`, `ql_publication` and `ql_search` necessary rather than optional.

## §4.4 domain contract coverage

The D30 catalog preserves the legacy §4.4 requirement for 20 attributes per domain. This table records where each attribute is defined today and, honestly, whether it exists **per domain** or only as an estate-wide rule. `AGENTS.md` makes the per-domain detail live in addon manifests and models, which cannot be written before ratification, so "estate-wide rule only" is the accurate current state for most rows rather than a claim of completion.

| # | §4.4 attribute | Where it is defined today | Per-domain completeness |
|---|---|---|---|
| 1 | Domain ID | this registry, first column, `ql_*` addon names | complete for all 23 |
| 2 | Purpose | this registry (canonical ownership column) + `docs/vision/MASTER_VISION_NARRATIVE.md` | complete at domain level |
| 3 | Scope | this registry (non-ownership column) + `docs/product/PRODUCT_SPECIFICATION.md` | complete at domain level |
| 4 | Canonical entities | `docs/data/CANONICAL_DATA_DICTIONARY.md` | **incomplete** — the six added domains have no entity rows yet |
| 5 | Owned schema/tables | `docs/data/DATABASE_AND_SCHEMA_STRATEGY.md` (QlOrm syncs from addon models) | incomplete by design — models are the source and are not yet ratified |
| 6 | Identifier strategy | `docs/architecture/SHARED_KERNEL_SPECIFICATION.md` (Canonical ID) | estate-wide rule only |
| 7 | Data lifecycle | `docs/data/DATA_LIFECYCLE_AND_PROVENANCE.md` | estate-wide rule only |
| 8 | API routes/contracts | `docs/api/API_CONTRACT_SPECIFICATION.md` route registry + `@moonwitness/moonclient` | estate-wide rule only; per-domain route sets pending |
| 9 | Service boundaries | `AGENTS.md` (API is boundary only; behavior lives in addon/runtime) + `BLUEPRINT.md` | complete as a rule |
| 10 | Permissions | `docs/security/SECURITY_AND_PRIVACY_BLUEPRINT.md`, MW-ADR-014 role catalog, `ownerField` deny-by-default ACL | estate-wide rule only; per-entity ACL matrix pending |
| 11 | Dependencies | the graph above and each manifest's explicit dependency list | complete as a proposal, unratified |
| 12 | Read models | view metadata per addon (`MASTER_DESIGN.md`, `@moonwitness/ui`) | estate-wide rule only |
| 13 | Events and notifications | **nowhere yet** | **gap.** Until this pass no domain owned them at all; §4.3 assigns them to Platform Operations, so `ql_ops` is now the owner and the specification itself is still to be written |
| 14 | Provenance | `docs/data/DATA_LIFECYCLE_AND_PROVENANCE.md` provenance minimum | complete as a rule |
| 15 | Retention | `docs/data/DATA_LIFECYCLE_AND_PROVENANCE.md` + `docs/security/SECURITY_AND_PRIVACY_BLUEPRINT.md` | estate-wide rule only |
| 16 | Migration | `docs/data/DATABASE_AND_SCHEMA_STRATEGY.md` + `docs/operations/MIGRATION_AND_ROLLBACK_PLAN.md` | complete as a rule |
| 17 | Testing | `docs/quality/QUALITY_AND_TESTING_STRATEGY.md` + `AGENTS.md` (manifest/model/ACL tests per addon) | estate-wide rule only |
| 18 | Integration contracts | `docs/api/API_CONTRACT_SPECIFICATION.md` + `ql_integration` connector catalog | estate-wide rule only |
| 19 | Owner | this registry, one owner row per concept | complete for all 23 |
| 20 | Non-goals | the non-ownership column above and §4.3 verbatim | complete for all 23 |

Three rows are load-bearing for ratification: #4 (six domains have no entity inventory), #13 (events and notifications have no specification anywhere in the baseline), and the cluster of "estate-wide rule only" rows, which §4.4 asks for per domain. Those are recorded as R-45 and R-46 in `docs/audit/ARCHITECTURE_AND_DOCUMENTATION_RECONCILIATION.md`.

## First slice candidate

`ql_base` → `ql_auth` → `ql_source` → `ql_corpus` → `ql_research` → `ql_workflow`, with `moonclient` DTOs/routes and `@moonwitness/ui` reader/review experience. This is proposed; select the source/edition after rights review. Do not create unrelated domain addons ahead of the approved journey.

## ROCKSOUL Ecosystem Mapping

This section maps each rocksoul repository to its relationship with the canonical `ql_*` addon domains per `AGENTS.md`. The estate-wide roll-up in `docs/audit/REPOSITORY_CAPABILITY_MATRIX.md` is the authoritative per-repository assignment; `docs/audit/tools/requirements_traceability_gate.py` compares the two and fails on any disagreement, which is how four stale rows in this table (the LAW corpus under `ql_ai`, the observability node under `ql_person`, the STORY corpus under `ql_research`, the operational console under `ql_corpus`) were found and corrected. The mapping confirms that rocksoul repositories are external reference sources only; actual domain ownership resides in QlOrm addons.

| Repository | Related ql* Domain | Relationship Type | Notes |
|---|---|---|---|
| `rocksoul` | NONE (patterns to `ql_research`) | REFERENCE: cognitive runtime patterns | No runtime adoption; independent Rust local-first product |
| `rocksoul-mftl` | `ql_story` + `ql_corpus` + `ql_evidence` | REFERENCE: STORY/belief narrative corpus | Mapped, rights-cleared records only |
| `rocksoul-legend` | `ql_event` / LEGEND | REFERENCE: event record patterns | No causal claims; event chronology reference only |
| `rocksoul-superhero` | `ql_character` | REFERENCE: fictional canon | Not real person, prophet, angel, or user account |
| `rocksoul-aws` | `ql_law` / AWS | REFERENCE: international-law and regulation corpus | LAW domain, not an AI provider; per-record rights and jurisdiction review |
| `rocksoul-correlation` | `ql_relationship` / CORRELATION | REFERENCE: relationship assertions | No implicit truth; endpoint entity remains with its domain |
| `rocksoul-crayon` | `apps/web` | REFERENCE: operational console surface | REBUILD in one web shell; rights review for any data |
| `rocksoul-assets` | `ql_media` | REFERENCE: brand/UI/illustration assets | **no LICENSE file** — rights review mandatory before import |
| `rocksoul-jizz` | `ql_research` | REFERENCE: hypothesis/claim patterns | Method review pending |
| `rocksoul-omen` | `ql_ops` (records only) | REFERENCE: observability event node | In-product operational records only; no separate service |
| `rocksoul-ui` | `@moonwitness/ui` | REFERENCE: UI token/component compatibility | Compare and reconcile; no second design-system dependency |
| `rocksoul-platform` | `ql_auth` + `apps/web` | REFERENCE: ecosystem contract v1 + admin/IAM | **NOT** a canonical data owner; ownership stays in QlOrm addons per AGENTS.md |
| `rocksoul-community` | `apps/web` | REFERENCE: community patterns | No product boundary based on name alone |
| `rocksoul-game` | NONE | REFERENCE: gameplay concepts | Outside current product scope; no adoption without approved need |
| `rocksoul-web` | `apps/web` | REFERENCE: public observatory patterns | REBUILD in one `apps/web` shell using `@moonwitness/ui` |
| `rocksoul-runtime` | `ql_workflow` | REFERENCE: state-transition library | REBUILD lifecycle in single codebase; no standalone process |
| `rocksoul-container-manager` | NONE (infrastructure) | REFERENCE: deployment adapter patterns | D23 owns the deployment route; not product data |
| `rocksoul-container-runtime` | NONE (infrastructure) | REFERENCE: engine adapter patterns | Same as above |
| `rocksoul-deploy` | NONE (infrastructure) | REFERENCE: PaaS control plane | Not a product data owner |
| `rocksoul-rockcode` | NONE | REFERENCE: engineering tool | Out of product scope; MIT licensed |
| `rocksoul-igate` | NONE — empty | REFERENCE: no content at inspected snapshot | UNKNOWN until content appears |
| `moonframe` | `@moonwitness/ui` | REFERENCE: MIT licensed design system | Compatibility review required; no second design-system dependency |

**Key principles for ALL rocksoul mappings:**
- All rocksoul repositories are **REFERENCE** only — no runtime adoption, no import without full rights/provenance/code review
- Domain ownership **always** resides in `ql_*` addons per `AGENTS.md`, not in rocksoul repositories
- `rocksoul-platform`'s ecosystem contract v1 is a **design authority**, NOT a canonical data owner; actual ownership is in QlOrm addons
- `@moonwitness/ui` is the local design system owner; external UI packages are references only after compatibility review
- No rocksoul repository provides QlOrm models, API contracts, or moonclient DTOs/routes
- `rocksoul-assets` has NO LICENSE; rights review required before any import consideration
- The dependency graph is defined once, at the top of this document; the ROCKSOUL rows above add no arrows, no owners and no second copy of it

## Estate-wide landing map (not only ROCKSOUL)

The ROCKSOUL table above is one family detail. The full assignment — every one of the 102 rows in the D02 matrix, repositories and XV component slices alike, mapped to exactly one target owner in this registry — is the **estate-wide capability → canonical owner roll-up** in [`docs/audit/REPOSITORY_CAPABILITY_MATRIX.md`](../audit/REPOSITORY_CAPABILITY_MATRIX.md). It is enforced by `docs/audit/tools/repository_census_gate.py`, which fails if any matrix row is missing from the roll-up, appears twice, or has an empty owner cell.

Reading that roll-up against this registry produces three facts this document could not see on its own:

1. **Every single-owner slot is oversubscribed before any adoption happens.** Seven mapped sources land on `@moonwitness/ui`, two on `@moonwitness/moonclient`, ten separate web surfaces on one `apps/web`, and four worker/API designs on `apps/api`. `AGENTS.md` allows exactly one design system and one contract owner, so adoption here is zero-sum by rule: a pattern taken from an external source is absorbed into the local owner and the source stays a reference. No row may become a dependency merely because it looks like the target shape. Recorded as R-43.
2. **Six required domains were simply missing from this registry**, which is why `bjo163/rocksoul-aws` — an international-law and regulation corpus, the estate's only LAW material — had resolved to `NONE`: there was no owner to name, and inventing one from a repository name would have been a worse answer than recording the gap. §4.3 requires Evidence, Legal / AWS, Creative, Publication, Search and Platform Operations, and all six are now rows above, so that repository lands in `ql_law` and `rocksoul-omen` in `ql_ops`. The missing domains were a registry defect against the prompt, not an open owner question; ratification is still required for the names and boundaries. Recorded as R-44.
3. **Five §4.3 domains receive no estate material at all** — `ql_creative`, `ql_journey`, `ql_org`, `ql_person` and `ql_search` — and `ql_law` receives exactly one. The estate therefore cannot supply these five from existing repositories: they will be built from the specification alone, and no migration decision can be made for them because there is nothing to migrate. That is a coverage finding, not a defect in the census. Recorded as R-48.

Two rows stay `TBD` (`bjo163/moonwitness-xiv`, `bjo163/mw-core`) because neither was ever inventoried, and 36 of 102 rows resolve to `NONE` — independent, empty, excluded, infrastructure, or a legal stop. Counts above are recomputed from the roll-up table by the gate, not maintained by hand. None of these points authorizes an adoption; each needs the owner's ratification first.
