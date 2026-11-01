# Domain Ownership and Dependency Registry

**Status: PROPOSED.** Each canonical object has one owner. Package names are candidate `ql_*` addon names consistent with local policy; approve names before adding models. Consumers store typed references, not shadow copies.

| Addon/domain | Canonical ownership | Explicit non-ownership / consumers |
|---|---|---|
| `ql_base` / platform | shared identifiers, locale primitives, audit metadata, common errors | No universal business entity table |
| `ql_auth` / identity | user principals, credentials, sessions, roles/grants, single-use verification tokens (`res.verification`) | Not a historical/fictional person registry; does not deliver mail — sending stays an API-side SMTP adapter, and no addon stores message content |
| `ql_org` / organization | organizations, tenant scopes, memberships/groups if required | Not product navigation or person biography |
| `ql_source` / source registry | source artifact, source version, source citation, rights record and provenance | Does not own normalized corpus text or research conclusions |
| `ql_corpus` / RGBL | work, expression/edition, passage, exact text, translation/lexical records | Does not own evidence verdicts, rights authority, or all annotation |
| `ql_ontology` / UNILEX | canonical term/concept, definition, alias, semantic mapping | Does not own every domain's descriptive text |
| `ql_person` | real/historical person identity, sourced roles/biography | Not user account, fictional character or AI agent |
| `ql_character` | fictional character, universe membership, canon, arc | Not a real person, prophet, angel, user or executable agent |
| `ql_witness` | testimony, observation, witness statement and transmission | References person/source/event; no duplicate identity |
| `ql_event` / LEGEND | historical/event record, chronology, place/time relations | Not story chapter or proof by itself |
| `ql_story` | narrative/creative work and its declared fictional/historical mode | Not event facts or source text |
| `ql_research` | question, hypothesis/claim, method, evidence links, assessment, uncertainty and review | No duplicate corpus or identity owner |
| `ql_mizan` | named method/framework, rubric and versioned assessment method | Research owns each application/result; Mizan is not an overlapping verdict store |
| `ql_relationship` / CORRELATION | typed relationship assertion, direction, scope and supporting sources | No implicit truth; endpoint entity remains with its domain |
| `ql_workflow` | review tasks, transitions, publication approvals and audit references | Does not own domain content or author identity |
| `ql_journey` | user/organization journey plan and accountable action records | References research/content; does not certify external outcomes |
| `ql_ai` | provider config, model capabilities, prompt/tool policy and execution audit | Agent execution is not character canon; no silent canonical writes |
| `ql_chat` | conversation/message records and retention policy | Not a research claim or canonical source record |
| `ql_media` (candidate) | media metadata and approved asset links | Binary storage may be external adapter; rights remain linked to `ql_source` |

## Dependency graph (proposed; arrows mean “depends on/reference contract”)

```text
ql_base ──► all addons (shared primitives only)
ql_auth ──► ql_org, ql_ai, ql_chat, ql_workflow, owner-scoped domains
ql_source ──► ql_corpus, ql_witness, ql_research, ql_story, ql_media
ql_ontology ──► ql_person, ql_event, ql_corpus, ql_research (term references)
ql_person ──► ql_witness, ql_event, ql_story, ql_research
ql_character ──► ql_story, ql_creative UX
ql_corpus ──► ql_research, reader/search UX
ql_event ──► ql_witness, ql_story, ql_research
ql_mizan ──► ql_research (method/version reference)
ql_research ──► ql_workflow, ql_journey, publication UX
ql_workflow ──► publisher-facing experiences across domains
```

The graph is a planning hypothesis. Avoid cyclic addon dependencies; cross-links should use IDs and stable contracts. Keep package dependencies explicit in manifests and API bootstrap as required by `AGENTS.md`.

## First slice candidate

`ql_base` → `ql_auth` → `ql_source` → `ql_corpus` → `ql_research` → `ql_workflow`, with `moonclient` DTOs/routes and `@moonwitness/ui` reader/review experience. This is proposed; select the source/edition after rights review. Do not create unrelated domain addons ahead of the approved journey.

## ROCKSOUL Ecosystem Mapping

This section maps each rocksoul repository to its relationship with the canonical `ql_*` addon domains per `AGENTS.md`. The mapping confirms that rocksoul repositories are external reference sources only; actual domain ownership resides in QlOrm addons.

| Repository | Related ql* Domain | Relationship Type | Notes |
|---|---|---|---|
| `rocksoul` | ql_base / platform | REFERENCE: shared identifier patterns | No runtime adoption; independent Rust runtime |
| `rocksoul-mftl` | ql_research / research | REFERENCE: method patterns | Cognitive pattern reference; method validity unverified |
| `rocksoul-legend` | ql_event / LEGEND | REFERENCE: event record patterns | No causal claims; event chronology reference only |
| `rocksoul-superhero` | ql_character / character | REFERENCE: fictional canon | Not real person, prophet, angel, or user account |
| `rocksoul-aws` | ql_ai / AI provider | REFERENCE: model config patterns | External API review required; no adoption |
| `rocksoul-correlation` | ql_relationship / CORRELATION | REFERENCE: relationship assertions | No implicit truth; endpoint entity remains with its domain |
| `rocksoul-crayon` | ql_corpus / RGBL | REFERENCE: work/edition patterns | Rights review required before import |
| `rocksoul-jizz` | ql_research / research | REFERENCE: hypothesis/claim patterns | Method review pending |
| `rocksoul-omen` | ql_person / person | REFERENCE: identity patterns | Not user account, fictional character, or AI agent |
| `rocksoul-ui` | `@moonwitness/ui` | REFERENCE: UI token/component compatibility | Compare and reconcile; no second design-system dependency |
| `rocksoul-platform` | design authority only | REFERENCE: ecosystem contract v1 | **NOT** a canonical data owner; actual ownership in QlOrm addons per AGENTS.md |
| `rocksoul-community` | design authority only | REFERENCE: community patterns | No product boundary based on name alone |
| `rocksoul-game` | design authority only | REFERENCE: gameplay concepts | No adoption without approved need |
| `rocksoul-web` | `@moonwitness/ui` / ql_source | REFERENCE: public observatory patterns | REBUILD in one `apps/web` shell using `@moonwitness/ui` |
| `rocksoul-runtime` | ql_workflow / workflow | REFERENCE: state-transition library | REBUILD lifecycle in single codebase; no standalone process |
| `rocksoul-container-manager` | ql_ai / infrastructure | REFERENCE: deployment adapter patterns | REBUILD in platform services |
| `rocksoul-container-runtime` | ql_ai / infrastructure | REFERENCE: engine adapter patterns | REBUILD in platform services |
| `rocksoul-deploy` | ql_workflow / infrastructure | REFERENCE: PaaS control plane | REBUILD deployment in unified app |
| `rocksoul-rockcode` | design reference only | REFERENCE: engineering tool | REBUILD in platform services; MIT licensed |
| `rocksoul-igate` | UNKNOWN | REFERENCE: empty repository | Await content before classification |
| `moonframe` | `@moonwitness/ui` | REFERENCE: MIT licensed design system | Compatibility review required; no second design-system dependency |

**Key principles for ALL rocksoul mappings:**
- All rocksoul repositories are **REFERENCE** only — no runtime adoption, no import without full rights/provenance/code review
- Domain ownership **always** resides in `ql_*` addons per `AGENTS.md`, not in rocksoul repositories
- `rocksoul-platform`'s ecosystem contract v1 is a **design authority**, NOT a canonical data owner; actual ownership is in QlOrm addons
- `@moonwitness/ui` is the local design system owner; external UI packages are references only after compatibility review
- No rocksoul repository provides QlOrm models, API contracts, or moonclient DTOs/routes
- `rocksoul-assets` has NO LICENSE; rights review required before any import consideration
- The graph below shows proposed dependencies using ID references, not cyclic addon dependencies

```text
ql_base ──► all addons (shared primitives only)
ql_auth ──► ql_org, ql_ai, ql_chat, ql_workflow, owner-scoped domains
ql_source ──► ql_corpus, ql_witness, ql_research, ql_story, ql_media
ql_ontology ──► ql_person, ql_event, ql_corpus, ql_research (term references)
ql_person ──► ql_witness, ql_event, ql_story, ql_research
ql_character ──► ql_story, ql_creative UX
ql_corpus ──► ql_research, reader/search UX
ql_event ──► ql_witness, ql_story, ql_research
ql_mizan ──► ql_research (method/version reference)
ql_research ──► ql_workflow, ql_journey, publication UX
ql_workflow ──► publisher-facing experiences across domains
```

The graph is a planning hypothesis. Avoid cyclic addon dependencies; cross-links should use IDs and stable contracts. Keep package dependencies explicit in manifests and API bootstrap as required by `AGENTS.md`.

**First slice candidate (unchanged):**
`ql_base` → `ql_auth` → `ql_source` → `ql_corpus` → `ql_research` → `ql_workflow`, with `moonclient` DTOs/routes and `@moonwitness/ui` reader/review experience. This is proposed; select the source/edition after rights review. Do not create unrelated domain addons ahead of the approved journey.
