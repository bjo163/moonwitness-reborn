# Knowledge and Corpus Integration Plan

**Status: PARTIALLY UNBLOCKED.** General rule holds — "import is blocked until source, edition and rights are identified". The **Al-Qur'an first slice** (three datasets under MW-0560 / MW-ADR-019) is explicitly unblocked by owner directive on 2026-11-01 and its per-edition rights decisions are recorded in §*Al-Qur'an first-slice datasets* below; every other dataset in the registry stays blocked until the same per-edition entry is written. `ql_source` and `ql_corpus` ship as the QlOrm addon pair that implements this plan; `ql_ontology` (UNILEX) is deferred to its own slice.

## Ownership

`ql_source` owns source artifact/version, rights and provenance. `ql_corpus` (RGBL role) owns work, expression/edition, passage, exact text, translation and lexical records. `ql_research` owns claims, evidence relationships, methods and assessments. A corpus service may be used as a reference/source; it does not become a second application/backend in the target.

## Read-only lexical discovery pilot

`ql_corpus` exposes `corpus.lexical_candidate` as a read-only computed model, not a stored domain table. It scans only published Arabic `revelation_verbatim` ayah rows and independently requires `source.rights` action `transform` to be `cleared`; display permission alone never authorizes derivation. Access to the model and all declared source models is checked before its callback runs. The query accepts an optional exact edition key and is bounded to 100 output candidates, at most three editions when unfiltered, and explicit passage/term scan ceilings.

The pilot tokenizes Arabic text and removes tashkeel and tatweel for grouping while preserving an observed surface form. Each result records the normalization and extraction algorithm versions, source version, occurrence and verse counts, and up to 80 verse references containing passage IDs and source checksums. Results are recomputed at read time and are never persisted or cached. The compute output has no confidence score: frequency/tokenization correctness has not been measured as a probability, and frequency is not evidence that a token is a Divine Name. The output is exploratory lexical frequency only, not Asmaulhusna detection or a religious conclusion. It does not alter canonical passage text.

## Human lexical research review

`ql_research` owns append-only assessments of these computed results. The review queue recomputes a candidate from the exact published edition and normalized form before accepting an assessment; the stored record pins candidate ID, edition/source version, algorithm/normalization versions, counts, and checksummed verse references. The stored assessment does not duplicate the candidate token or verse text. Reviewer identity is private, timestamps are server-assigned, and only admin/operator reviewers can read or submit assessments. Generic CRUD cannot create, mutate, or delete them. The neutral decisions (`retain_for_research`, `exclude_from_research`, `needs_expert_review`) route further research only; none means a Divine Name, tafsir, or theological fact has been verified.

## Observed source

`bjo163/moonwitness-corpus` README assigns canonical exact-text/corpus/provenance ownership to RGBL and states 537,093 raw records in a generated database. At `main` SHA `534a21893728de64b5f28f27ea600e8609d7b8c4`, the tree has 5,278 entries, 343 files under `datasets/`, and 130 JSONL files totaling 264,890,943 bytes, with no checked-in SQLite/database artifact. GitHub lists two browser-database release archives (~67.7 MB each). The newer archive's published SHA-256 was verified; its config identifies schema v3, corpus hash `c654dcb2f346b44c0610532240bc3b8deee0bc25abadc5251ab820f9db97c869`, and a 375,140,352-byte database. A read-only query of that database found 39 datasets, 536,996 summed dataset records, 239,841 indexed texts, 200,671 passages, 28 works and 31 editions. The current main catalog hash is `41b5a6d3412d0798056969c57f908704bddb3ea95e17c035b37b709c5f4ce49e`; the release database is therefore behind the current catalog. The README's 239,881 indexed records, 200,681 passages, 36 materialized works and 38 materialized editions do not match this browser artifact; its 729.16 MB database figure needs artifact-specific reconciliation. The repository has no GitHub-selected or root `LICENSE`/`COPYING` file; GitHub reported 50 open issues. Its individual data manifests declare rights, but those declarations still need verification against source publishers and exact editions before any import or public display.

The corpus registry has 49 entries (15 active, 28 supplemental, 6 fixtures), each with a matching manifest. The tree has 52 manifests total: 46 first-level dataset manifests and six example fixtures. Three first-level manifests are not in the registry (`ancient-egypt-book-of-dead-budge`, `dhammapada-sujato-1-20`, `hadith-bukhari-core`). All 46 first-level manifests contain non-empty rights text; three example fixture manifests omit rights and four omit source declarations. This is a repository-level declaration inventory, not a source/edition-level rights clearance. The newer browser-database archive's checksum and contents were verified; the older release remains uninspected. Four non-fixture registry entries are absent from that older release database: `world-religions:timeline-wikidata`, `zhuangzi:giles-1889`, `ancient-egyptian:book-dead-budge`, and `ancient-egyptian:book-dead-renouf-1904`. The release workflow requires manual dispatch to publish, and the CI workflow itself is manual-only. `dev` is 126 commits ahead of `main` at this snapshot, although the release-verification workflow says the histories diverge. No dataset is selected for import.

`moonwitness-II-q4q` references a closed `QURAN_CORE_V1` and Supabase runtime; that does not establish current edition, completeness, or reuse rights.

### Private corpus helper package evidence

`ArsyBelovedLabs/moonwitness-corpus` private `main` at `e81d2fd8b0318fc2b9e3522b091f188e403aa797` has a limited TypeScript package tranche. Its source normalizes *derived search keys* while retaining the original text outside that function; validates record IDs, source IDs, lowercase SHA-256 hashes and duplicate IDs; and `materializeCorpus` sorts valid manifest records and computes a deterministic hash. That helper explicitly does not fetch, persist or interpret source content. It is useful as a validation/release-input reference, but it is not a corpus database, a rights decision, an importer or an implemented publication workflow. Rebuild only accepted boundary checks inside the eventual QlOrm-owning addon/service; preserve source text and IDs, and never treat normalization output as canonical text. Package tests are declared but were not run in this audit.

### Browser DB v3 materialization by dataset

Counts below come from the released v3 database's `datasets.record_count` column, not a fresh line count of current `main` JSONL files. The release corpus hash is older than the current catalog; these counts are evidence about that release only.

The SQLite `sqlite_master` inventory contained these tables. FTS helper tables are retained in this list because the release is a browser search database.

| Table | Rows |
|---|---:|
| `artifacts` | 32 |
| `assertion_evidence` | 14 |
| `assertions` | 85 |
| `datasets` | 39 |
| `edition_expressions` | 57 |
| `editions` | 31 |
| `evidence` | 23,229 |
| `expressions` | 58 |
| `fts_contents` | 239,841 |
| `fts_contents_content` | 239,841 |
| `fts_contents_segdir` | 1 |
| `fts_contents_segments` | 3,593 |
| `passages` | 200,671 |
| `provenance` | 39 |
| `relation_targets` | 145,172 |
| `relations` | 72,586 |
| `search_meta` | 239,841 |
| `works` | 28 |

These counts describe the archived browser database, not a rebuild from the current Git tree.

| Dataset ID | Release record count | Current registry status |
|---|---:|---|
| `mw:dataset:bahai:hidden-words` | 21 | supplemental |
| `mw:dataset:bible:passage-alignments` | 30950 | active |
| `mw:dataset:bible:tsi-2021` | 61869 | active |
| `mw:dataset:christianity:early-writings` | 18 | supplemental |
| `mw:dataset:confucianism:analects` | 1030 | supplemental |
| `mw:dataset:devotional:baseline` | 139 | supplemental |
| `mw:dataset:dhammapada:indonesian-wikisource` | 849 | active |
| `mw:dataset:dhammapada:sujato` | 4005 | active |
| `mw:dataset:hadith:bukhari` | 22748 | supplemental |
| `mw:dataset:hadith:muslim` | 308 | supplemental |
| `mw:dataset:hadith:nawawi-40` | 141 | supplemental |
| `mw:dataset:hinduism:bhagavad-gita` | 2812 | supplemental |
| `mw:dataset:hinduism:principal-upanishads` | 73 | supplemental |
| `mw:dataset:hinduism:yoga-sutras` | 787 | supplemental |
| `mw:dataset:islam:asmaul-husna-99` | 102 | supplemental |
| `mw:dataset:islam:duas-authentic` | 638 | supplemental |
| `mw:dataset:islam:quran-tafsir-sample` | 20 | supplemental |
| `mw:dataset:jainism:tattvartha-sutra` | 33 | supplemental |
| `mw:dataset:lexicon:dhammapada-core` | 10 | supplemental |
| `mw:dataset:lexicon:greek-christian-core` | 34 | supplemental |
| `mw:dataset:lexicon:hebrew-biblical-core` | 35 | supplemental |
| `mw:dataset:lexicon:quran-arabic-core` | 14 | supplemental |
| `mw:dataset:lexicon:sanskrit-hindu-core` | 35 | supplemental |
| `mw:dataset:mishnah:pirkei-avot` | 24 | supplemental |
| `mw:dataset:oshb:wlc` | 69648 | active |
| `mw:dataset:quran:tanzil-uthmani` | 12594 | active |
| `mw:dataset:quranenc:english-rwwad` | 6240 | active |
| `mw:dataset:quranenc:indonesian-kemenag` | 6240 | active |
| `mw:dataset:research-graph:baseline` | 18 | supplemental |
| `mw:dataset:sblgnt:v1-2` | 15885 | active |
| `mw:dataset:shinto:kojiki` | 21 | supplemental |
| `mw:dataset:sikhism:japji-sahib` | 29 | supplemental |
| `mw:dataset:suttacentral:dn-mn-sujato` | 75089 | active |
| `mw:dataset:suttacentral:sn-an-sujato` | 147914 | active |
| `mw:dataset:taoism:tao-te-ching` | 250 | supplemental |
| `mw:dataset:web-classic:2020` | 76124 | active |
| `mw:dataset:world-religions:baseline` | 164 | active |
| `mw:dataset:world-religions:textual-evidence` | 9 | active |
| `mw:dataset:zoroastrianism:gathas` | 76 | supplemental |

## Import decision per source component

| Component | Decision | Conditions |
|---|---|---|
| Source metadata and citations | IMPORT candidate | Validate attribution, identifiers, accuracy and metadata rights |
| Exact text / translation | IMPORT candidate | Edition-specific license, permitted display/derivatives, canonical IDs, checksums |
| Commentary / interpretation | IMPORT only as attributed authored work | Rights, author, locale and type boundaries |
| Derived embeddings/indexes | REBUILD or regenerate only if rights permit | Record model/tool/version and retention; no unapproved external provider |
| Existing API/web app | REFERENCE; rebuild needed reader workflows in unified app | No second corpus service or frontend |
| Research labels / assessments | IMPORT only after method and provenance audit | Research domain owns result; Mizan method not duplicated |

## Al-Qur'an first-slice datasets (MW-0560, MW-ADR-019)

Owner directive on 2026-11-01 unblocks ratification blockers #1 and #2 **for these three datasets only**. Every other dataset in the registry above remains blocked until the owner records the same per-edition decision. The importer CLI (`pnpm --filter ql_corpus import:quran`) is a hard reconciliation gate — it refuses to write a single row if `observed ≠ expected` — so the row-count resolution below is a machine-enforced precondition, not a suggestion.

| Dataset id | Kind / authority | Locale | Publisher / release | `rows_expected` (importer reconciliation gate) | Rights basis to record at `source.rights` |
|---|---|---|---|---|---|
| `mw:dataset:quran:tanzil-uthmani` | `revelation_verbatim` | `ar` | Tanzil.net — Uthmani script (Tajweed-annotated variant excluded). Snapshot commit **must** be pinned in `source.version.snapshot_sha` before any import run. | **12,594** — this is the archived release record count at `:77`; the reconciliation gate aborts if the actual JSONL line count differs. The 12,594 vs. 6,240 delta means Tanzil's Uthmani export contains rows beyond per-ayah text (basmalah rows per surah and/or per-word segments) — the importer preserves the upstream granularity by tagging extras via `corpus.passage.row_kind ∈ {"ayah","basmalah","surah_header","word","footnote"}` and never rewrites `source_record_id`, per the "do not rewrite IDs or normalize punctuation silently" rule at `:105`. Owner is expected to *verify* the exact count against the frozen snapshot at dry-run time (MW-0561); if the observed count differs from 12,594, the plan **requires** the owner update this cell with the verified number before a real run — the importer will not accept anything else. | `license_id` = `Tanzil-Public` per Tanzil.net's stated grant; `attribution_required = true`; `attribution_text` = "Quran text © Tanzil.net, Uthmani script edition, distributed under the Tanzil public usage grant"; `permitted_actions = ["import","index","display","export","publish"]`; `rights_status` must be flipped to `"cleared"` by the owner (via admin UI editing `source.rights`) before `publishEdition` succeeds (`packages/ql_corpus/services/corpus-service.ts`) |
| `mw:dataset:quranenc:english-rwwad` | `translation` | `en` | QuranEnc.org — *Revised Wahdatul Quran Translation with Word-by-Word Annotations* | **6,240** — one row per ayah (the translation is verse-scoped, no separate basmalah rows); the importer rejects an `observed ≠ 6,240` at dry-run. Any ayah/translation misalignment is reported as `rejected[]` (with reason) and *not* silently skipped. | `license_id` = `QuranEnc-RWWAD-NonCommercial` per QuranEnc's stated usage terms (verify against the frozen snapshot; the release repo has no root LICENSE per `:11`, so the *publisher's own page* is the rights basis, not repo visibility — `DATA_LIFECYCLE_AND_PROVENANCE.md:27`); `attribution_required = true`; `attribution_text` = "English translation: Revised Wahdatul Quran Translation with Word-by-Word Annotations © QuranEnc.org"; `permitted_actions = ["import","index","display","export","publish"]`; owner flips `rights_status` to `"cleared"` per-edition |
| `mw:dataset:quranenc:indonesian-kemenag` | `translation` | `id` | QuranEnc.org — Kemenag RI (Kementerian Agama Republik Indonesia) official Indonesian translation | **6,240** — same per-ayah granularity as the English set | `license_id` = `Kemenag-PublicDomain-ID` — the Indonesian Ministry of Religious Affairs publishes this translation for public use, but the *specific QuranEnc re-release* may add its own attribution; the owner must verify the frozen snapshot's manifest rights block before flipping to `"cleared"`; `attribution_required = true`; `attribution_text` = "Terjemahan Kementerian Agama RI, disalin dari QuranEnc.org dengan atribusi"; `permitted_actions = ["import","index","display","export","publish"]` |

**Supplemental datasets deliberately NOT in this slice**:

- `mw:dataset:islam:quran-tafsir-sample` (20 rows, `:68`) — `corpus.annotation` model ships with the storage-level validator (`authorityValidator(ANNOTATION_AUTHORITIES)` refuses `"revelation_verbatim"`) so the invariant is regression-tested on day one; the table stays **empty** until the owner records per-tafsir-edition rights. MW-ADR-019 makes it structurally impossible for a future tafsir row to be mistaken for revelation text.
- `mw:dataset:lexicon:quran-arabic-core` (14 rows, `:73`) — belongs to `ql_ontology` (UNILEX), which is deferred to its own slice per `docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md`.

**Prohibited inputs**: `moonwitness-II-q4q`'s closed `QURAN_CORE_V1` and Supabase runtime (line `:15`) may not be used as a source for these datasets — no edition, completeness, or reuse rights are established by that lineage. Importers must consume the Tanzil.net and QuranEnc.org upstreams directly, frozen at a recorded commit SHA.

## Minimum mapping

Source repo + commit/release → source artifact/version → work → edition/expression + locale + publisher/translator → passage locator → exact segment + checksum → rights/provenance → canonical ID mapping. Keep original identifiers and provide explicit mapping records. Do not rewrite IDs or normalize punctuation silently.

## Pilot gate

Select a small, rights-cleared sample; publish the rights/edition rationale; import into staging; reconcile source and target counts; validate passage ordering and checksums; test locale/projection/ACL; have a human editor compare sample records; execute rollback; only then decide whether to expand.

## Blockers

Exact dataset snapshot/branch/SHA, actual record counts, generated/materialized status, source editions, license coverage, quality and duplicate strategy remain unresolved **for every dataset except the three Al-Qur'an datasets named in §*Al-Qur'an first-slice datasets*** — those have `rows_expected` pinned by the importer's hard reconciliation gate (MW-0565) and rights bases named per edition (MW-0561), but the owner must still verify the counts against the actual frozen snapshot at dry-run time before a real import is permitted. Other datasets are not selected for import.
