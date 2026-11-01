# Canonical Data Dictionary (Entity-Level Draft)

**Status: initial entity registry; field-level definitions require addon design and ratification.** One row means one canonical owner, not a commitment to implement every entity in the first release.

This dictionary now reaches every domain in `docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md`, including the six §4.3 domains added by the prompt-coverage pass (Evidence, Law/AWS, Creative, Publication, Search, Platform Operations). `masterprompt.md` §4.4 requires entities, schema, lifecycle, routes, permissions, read models and tests **per domain**; those attributes exist today only as estate-wide rules, which is tracked as R-46. Events and notifications (§4.4 item 13) had no specification anywhere until this pass assigned them to `ql_ops`.

| Entity | Canonical owner | Core meaning | Key references / constraints |
|---|---|---|---|
| UserPrincipal | `ql_auth` | Authenticated account subject | Credentials private; never a historical Person |
| Session | `ql_auth` | Revocable authenticated session | Store token hash, expiry and revocation; no raw token persistence |
| Organization / Membership | `ql_org` (if multi-tenant approved) | Organization and membership/role scope | Tenant boundary explicit; needs decision whether required initially |
| SourceArtifact | `ql_source` | Identified source item or publication | Has origin, rights status and stable reference |
| SourceVersion | `ql_source` | Specific revision/edition of an artifact | Immutable/versioned locator and acquisition metadata |
| RightsRecord | `ql_source` | Permission/terms governing use | Per artifact/edition/asset; status can block import/publication |
| ProvenanceRecord | `ql_source` | Origin, method and transformation chain | Actor/time/input references; not a truth verdict |
| Work | `ql_corpus` | Abstract intellectual work | References source; distinct from edition and text |
| Edition / Expression | `ql_corpus` | Language, version, publisher/translator and edition identity | Rights, source and locale required where applicable |
| Passage | `ql_corpus` | Addressable segment of an edition | Stable edition-scoped locator; exact text separately governed |
| TextSegment | `ql_corpus` | Exact source text or translation segment | Edition and language mandatory; do not mix commentary/AI output |
| Term / Concept | `ql_ontology` | Canonical concept or term | Aliases and definitions sourced and locale-tagged |
| Person | `ql_person` | Real/historical person identity | Evidence-backed attributes; not an account or fictional character |
| Character | `ql_character` | Fictional identity in controlled canon | Universe and fictional status explicit; not a real person/agent |
| WitnessStatement | `ql_witness` | Attributed observation or testimony | Author/source, time/place scope, privacy and review state |
| Event | `ql_event` | Historical/event record | Temporal/geographic claims carry sources and uncertainty |
| Story | `ql_story` | Narrative work | Fictional/historical mode and source links explicit |
| ResearchQuestion | `ql_research` | Bounded question under investigation | Scope, owner, method and lifecycle |
| Claim | `ql_research` | Attributable proposition assessed by evidence | Claim type, subject, source links and uncertainty; not fact by default |
| EvidenceRecord | `ql_evidence` | Supporting or countervailing record used by research, with its own interpretation attribution | Not the source artifact (stays `ql_source`); every record needs a source reference and a chain reference |
| EvidenceLink | `ql_research` | Typed support/challenge/context relation from an evidence record to a claim | Points to `ql_evidence` and `ql_source`; the relation, not the evidence itself |
| Assessment | `ql_research` | Versioned evaluation of a claim under a method | Reviewer, method/version, rationale, evidence and uncertainty required |
| RelationshipAssertion | `ql_relationship` | Typed, scoped relation between domain records | Direction, source, confidence/status; endpoint owners remain separate |
| ReviewTask | `ql_workflow` | Human review action | Assignee/role, transition, timestamp and reason; ACL enforced |
| PublicationRecord | `ql_publication` | What was released, in which version, when, under which approval and rights state | One owner per released version; cannot expose unlicensed or private content; the authoring data stays with its domain |
| EditorialDecision | `ql_publication` | The accept/reject/revise outcome and its reason | References the `ql_workflow` review task that produced it; owns no process state |
| AIProviderConfig | `ql_ai` | Server-side provider settings | Secret is private, encrypted, masked and never returned to browser |
| AIExecution | `ql_ai` | Invocation and tool/action audit | Inputs/output retention bounded; no silent canonical writes |
| Conversation / Message | `ql_chat` | User/assistant exchange | Owner scope, retention and private prompt data policy |
| Journey / Action | `ql_journey` | User-governed plan and accountability record | References evidence/work; distinguish intended from completed outcome |
| LegalSource / Jurisdiction | `ql_law` | A legal instrument and the jurisdiction it applies in | Text stays in `ql_source`/`ql_corpus`; `ql_law` owns applicability, not the artifact |
| LegalApplicability / LegalArgument | `ql_law` | Claim that a source applies to a matter, and the argument around it | Not a general ethics engine; each argument needs its evidence chain |
| CreativeWork / Draft | `ql_creative` | Original creative work in production, with its versions | Not canonical ownership of the source content a derivative quotes |
| DerivativeRecord | `ql_creative` | What a derivative is based on and how | Links to `ql_source`/`ql_corpus` provenance and to `ql_character`/`ql_story` where relevant |
| SearchIndex / RetrievalConfig | `ql_search` | A derived index over canonical records and how it is queried | Rebuildable; never a source of truth; owns no canonical content |
| SearchSession | `ql_search` | A user's retrieval interaction under retention policy | Owner-scoped; query text may be private content |
| OperationalRun / JobRecord | `ql_ops` | Durable record that an in-product job or workflow execution ran, retried or failed | The owning domain decides the transition; `ql_ops` records it |
| NotificationRecord | `ql_ops` | A notification the product produced, to whom and why | No message bodies or secrets; delivery itself stays an API-side adapter |
| ConfigurationRecord | `ql_ops` | Non-secret product configuration state and its audit reference | Secrets are `private`, encrypted and never returned after receipt; connector credentials live in `ql_integration`, which stores none |

## Field-definition template for future addon models

For each field record: stable name; user-facing label/locale; QlOrm type; required/nullability; maximum length; validation; `ownerField` and/or tenant scope; ACL for read/write/create/delete; private flag; view exposure; indexes/performance need; provenance/rights semantics; tests. Do not add fields until their owner and lifecycle are clear.

## Exclusions from initial canonical scope

Do not create universal `entity`, `content`, `knowledge`, `evidence` or `metadata` tables that span domains as shortcuts — `ql_evidence` is a bounded domain with its own record types and source references, not a generic dump for anything called "evidence". Do not duplicate user/Person/Character/AI Agent identities. Do not represent a translation or interpretation as the exact source text.
