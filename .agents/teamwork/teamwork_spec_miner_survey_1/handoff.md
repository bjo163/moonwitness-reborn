# Handoff Report: Survey & Specification Audit of the 30 Grand Strategic Tracks

**Author**: `teamwork_spec_miner_survey_1`  
**Parent Agent ID**: `15ce11f1-e3a8-45f6-959a-ed89d1ed23fb`  
**Target Plan Artifact**: `C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md`  
**Project Base Path**: `z:\project\moonstranaut`  
**Timestamp**: 2026-11-02T11:10:00Z  

---

## 1. Observation

A complete physical and architectural inspection was performed on the target plan artifact `plan_30_grand_strategic_tracks.md`, the request requirements in `ORIGINAL_REQUEST.md`, and the active MoonWitness workspace codebase (`packages/ql_*`, `packages/moonclient`, `packages/ui`, `packages/agent-runtime`, `apps/web`, and `apps/api`).

### 1.1 Target Plan Artifact Inspection
- **File Path**: `C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md`
- **Total Lines**: 193 lines (12,476 bytes).
- **Existing Document Structure**:
  - `## 0. Executive Vision & Foundational Directives` (lines 3–6): A brief introductory paragraph mentioning `packages/ql_*`, Anti-Slop, `AGENTS.md`, and WCAG 2.2 AA.
  - `## 1. The 30 Master Strategic Tracks Matrix` (lines 8–50): A Mermaid `mindmap` diagram listing the 30 tracks grouped under 6 domain labels.
  - `## 2. In-Depth Track Specifications (Tracks 01 – 30)` (lines 52–174): 6 subsections (Groups A to F). Each track currently contains only **1 to 2 bullet points** (averaging 2–4 lines of high-level conceptual text per track, e.g. `- **Konsep:** ...`).
  - `## 3. Recommended Phased Execution Strategy` (lines 175–185): A 5-batch summary table containing only **20 of the 30 tracks** (Tracks 03, 04, 05, 07, 09, 10, 15, 19, 24, 29 are completely omitted from the batch table).
  - `## 4. User Review Required` (lines 187–193): A callout box recommending starting with Batch 1 (Track 26, 01, 02, 23).

### 1.2 Verbatim Depth Audit of Existing Tracks
Every track in Section 2 lacks concrete implementation depth. For example:
- **Track 01 (lines 57–59)**:
  > `#### 🔹 Track 01: Mushaf Typography & Diacritics Engine (ql_corpus, @moonwitness/ui)`  
  > `- **Konsep:** Rendering tipografi Mushaf Madinah & Uthmani beresolusi tinggi dengan dukungan font variable Arab, kerning dinamis, dan penandaan tanda waqaf (stop symbols) yang indah.`  
  > `- **Implementasi:** Pembuatan komposit @moonwitness/ui/src/atoms/quran-text.tsx yang menangani skala tipografi adaptif dan penegakan right-to-left (RTL) tanpa pergeseran layout (zero cumulative layout shift).`
- **Track 06 (lines 77–79)**:
  > `#### 🔹 Track 06: Hallucination-Shielded Grounded Chat (ql_chat, @moonwitness/agent-runtime)`  
  > `- **Konsep:** Memperkuat parser parseGroundedAgentOutput di /command-center/chat agar setiap respons AI yang mengutip Al-Qur'an wajib merujuk ID ayat valid di ql_corpus; jika kutipan tidak ditemukan, teks ditandai dengan peringatan "Unverified Citation".`
- **Track 26 (lines 153–160)**:
  > `#### 🔹 Track 26: Modular Movement Componentization (apps/web/src/app/page.tsx)`  
  > `- **Konsep:** Memecah file monolithic page.tsx (800 baris) menjadi modul-modul elegan berukuran <150 baris...`

### 1.3 Baseline Codebase & Architectural Alignment Findings
1. **QlOrm Addons (`packages/ql_*`)**:
   - `ql_corpus` (`packages/ql_corpus/__manifest__.ts`, 297 lines; models include `corpus.work`, `corpus.edition`, `corpus.passage`, `corpus.annotation`, `corpus.term`, `corpus.concept`, computed `corpus.lexical_candidate`). Storage-level religious integrity invariant enforces `authority` enum `["revelation_verbatim", "translation"]` on passages.
   - `ql_ai` (`packages/ql_ai/__manifest__.ts`, 35 lines; models include `ai.provider`).
   - `ql_chat` (`packages/ql_chat/__manifest__.ts`, 26 lines; models include `chat.channel`, `chat.message`).
   - `ql_workflow` (`packages/ql_workflow/models/index.ts`; models include `workflow.project`, `workflow.task`, `workflow.change`, `workflow.transition`).
   - `ql_research` (`packages/ql_research/models/index.ts`, 42 lines; 12 models including `research.lexical_review`, `witness.statement`, `story.narrative`, `event.record`, `person.profile`, `law.instrument`, `mizan.assessment`, `studio.artifact`).
   - `ql_search` (`packages/ql_search/models/index.ts`; model `search.index_entry`).
   - `ql_i18n` (`packages/ql_i18n`; catalogs for `id.po` and `en.po`, parser `gettext-parser`).
2. **SDK & API Boundary (`@moonwitness/moonclient`)**:
   - File `packages/moonclient/src/index.ts` (1,416 lines) centralizes all routes (`apiRoutes`), DTO contracts (`*Dto`), and the singleton `moonClient`. Browser code in `apps/web` is strictly banned from importing `ql_*` directly and must invoke `moonClient`.
3. **UI Composites & Design Tokens (`@moonwitness/ui`)**:
   - Package `packages/ui/src/composites` contains 21 composite primitives (`hero-stage.tsx`, `portal-card.tsx`, `sanctuary-header.tsx`, `search-dialog.tsx`, `spatial-region.tsx`, `workspace-sidebar.tsx`, etc.).
   - Anti-slop and WCAG 2.2 AA rules mandate zero raw form elements, no inline styles, no unconstrained color palettes, and strict keyboard/focus/reduced-motion affordances.
4. **Landing Page Monolith (`apps/web/src/app/page.tsx`)**:
   - Currently 844 lines, containing landing stage, navigation, portal cards, transmissions, and footer inline. Directly motivates Track 26.
5. **Bundle Size Budgets (`apps/web/.size-budget.json`)**:
   - `maxFirstLoadKb: 150`. Routes `/page` (149.9 kB), `/command-center/page` (150.8 kB), `/connectors/[connectorId]/dns/page` (151.6 kB) are right on the verge of budget violations.

---

## 2. Logic Chain

1. **Premise 1 (R1 Mandate)**: The original user request demands comprehensive technical specifications for all 30 strategic tracks across the 6 major domains (Sacred Corpus, Cognitive AI, Spatial HUD, Harbor Community, Command Deck, Engineering Excellence).
2. **Premise 2 (R2 Mandate)**: Each track must provide concrete component interface definitions, QlOrm model/schema declarations adhering to `packages/ql_*` conventions (no Drizzle, strict ACL), API/DTO contracts conforming to `@moonwitness/moonclient`, and UI specifications adhering to `@moonwitness/ui` and anti-slop guidelines.
3. **Premise 3 (R3 Mandate)**: Each track must define a step-by-step phased implementation roadmap with concrete, objective acceptance and verification criteria for every milestone.
4. **Observation Fact**: The current artifact `plan_30_grand_strategic_tracks.md` (193 lines) contains only a conceptual overview (1–2 sentences per track), **0** component interface definitions, **0** QlOrm model schemas, **0** moonClient DTO/route contracts, **0** UI token/anti-slop specifications, and an incomplete batch table in Section 3 that omits 10 tracks entirely.
5. **Deduction & Assessment**: To transform `plan_30_grand_strategic_tracks.md` into an authoritative, actionable, production-ready blueprint satisfying R1, R2, and R3, the document requires a massive, structured expansion. Every track must receive a dedicated, standardized technical specification block containing:
   - System Architecture & Interaction Flow
   - Concrete TypeScript Component Interfaces / Signatures
   - QlOrm Model Declarations & Field Constraints (`packages/ql_*`)
   - API Contracts & DTOs (`@moonwitness/moonclient`)
   - UI / UX & Anti-Slop Specifications (`@moonwitness/ui`, WCAG 2.2 AA)
   - Phased Implementation Roadmap (Phases 1–3)
   - Verification Rubrics & Acceptance Criteria (Automated test commands, invariants, exit criteria)

---

## 3. Caveats

1. **Role Scope Boundary**: As `teamwork_spec_miner_survey_1`, this role is strictly an auditor, explorer, and specification miner. No direct code implementation or modification of the target plan artifact was performed during this survey phase; the findings in this report serve as the authoritative blueprint for the subsequent expansion task.
2. **Model Schema Evolution**: Some tracks introduce new models into existing addons (e.g. `corpus.reciter` in `ql_corpus`, `ai.provider_metric` in `ql_ai`, `workflow.peer_review` in `ql_workflow`), while other tracks introduce models in existing addons that do not yet have those schemas defined (e.g. `community.covenant_signature` in `ql_workflow` or a new `ql_community` addon). The inventory provides recommended package placement based on existing `AGENTS.md` boundaries.
3. **Third-Party Dependencies**: Local-first AI inference (Track 10) relies on browser-level WebGPU / `@xenova/transformers` / ONNX runtime, which requires dynamic loading and Web Worker isolation to respect the 150 kB bundle budget (Track 28).

---

## 4. Conclusion

The target plan artifact `plan_30_grand_strategic_tracks.md` establishes an exceptional conceptual vision across 30 tracks, but currently functions as an executive outline rather than an engineering blueprint.

To fulfill R1, R2, and R3:
1. All 30 tracks must be systematically augmented with 7 standard technical specification sections.
2. Section 3 (Phased Execution Strategy) must be revised to integrate all 30 tracks into a cohesive dependency-ordered execution matrix (Batches 1 to 6).
3. Section 4 (User Review Required) must be updated with clear decision gates and risk mitigation controls.

---

## 5. Verification Method

- **Inspection of Target Plan Artifact**:
  - Path: `C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md`
  - Current line count: 193 lines.
  - Verification condition after expansion: The document should expand to include all 30 tracks with full TypeScript interfaces, QlOrm model definitions, moonClient DTOs, and test specifications.
- **Architectural Conformance Checks**:
  - Run `pnpm typecheck` in workspace to verify existing package contracts.
  - Run `pnpm lint` to confirm ESLint boundary enforcement rules.
  - Inspect `packages/ql-orm` to verify model declaration syntax (`QlModelDefinition`, `field` types: `char`, `text`, `integer`, `boolean`, `datetime`, `json`).
  - Invalidation condition: If any track recommends Drizzle ORM, raw fetch in `apps/web`, or uncontained color tokens, it violates project architecture rules.

---

## 6. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 01 | Sacred Corpus | Mushaf Typography & Diacritics Engine | High-resolution Madinah/Uthmani Arabic typography with variable font scaling, dynamic kerning, and waqaf symbol formatting | Surah/Ayah text, font size token (`sm`..`2xl`), waqaf rule toggles | Rendered RTL DOM with zero layout shift, semantic glyph spans | Fallback to Amiri/Scheherazade font; malformed marks sanitized | `plan_30_grand_strategic_tracks.md:57`, `packages/ql_corpus` |
| 02 | Sacred Corpus | Dual-Stream Hermeneutic Reader | Synchronized dual-pane reader comparing revelation verbatim Arabic with authoritative translations | Edition key, Surah index, translation edition ID | Synchronized scroll dual-column layout with active verse alignment | Independent scroll unlock if translation missing; 404 on invalid edition | `plan_30_grand_strategic_tracks.md:61`, `apps/web/src/features/corpus` |
| 03 | Sacred Corpus | Semantic Cross-Surah Graph | Interactive SVG knowledge graph visualizing thematic narratives and cross-surah concept links | Concept token / Surah filter / narrative tag | Graph topology (nodes, edges, thematic clusters) | Empty state if no concept links; gracefully scales to <16ms frame render | `plan_30_grand_strategic_tracks.md:64`, `packages/ql_research` |
| 04 | Sacred Corpus | Verifiable Ayah Cryptographic Proofs | Clipboard copying and sharing utility embedding canonical SHA-256 verse hashes and citation seals | Verse ID, canonical passage text, edition ID | Formatted citation text + SHA-256 seal + verification URL | Hash mismatch marks quotation as "Modified/Unverified" | `plan_30_grand_strategic_tracks.md:67`, `ql_corpus/models/corpus_passage.ts:79` |
| 05 | Sacred Corpus | Audio Tilawah Spatial Resonance | Verified tilawah audio playback with minimalist whispering waveform and real-time ayah highlighting | Reciter ID, Surah number, Ayah timing segment | Web Audio streaming, canvas waveform, ayah scroll focus | Silent fallback on stream error; auto-paused when muted | `plan_30_grand_strategic_tracks.md:70`, `packages/ui` |
| 06 | Cognitive AI | Hallucination-Shielded Grounded Chat | AI query assistant that strictly validates Quranic quotations against canonical `corpus.passage` records | User natural language query, retrieved evidence passages | Grounded answer with verified citation chips and corpus drawer links | Flags ungrounded citations with warning badge `Unverified Citation` | `plan_30_grand_strategic_tracks.md:77`, `packages/agent-runtime` |
| 07 | Cognitive AI | Multi-Provider Failover Mesh | Resilient gateway routing queries across primary and fallback LLMs with 3000ms timeout circuit breaker | Agent chat request, provider priority list | Streamed AI completion from fastest healthy provider | Automatic failover on timeout/5xx; logs circuit breaker trip | `plan_30_grand_strategic_tracks.md:80`, `packages/ql_ai` |
| 08 | Cognitive AI | Lexical Morphology Search | Root word search indexing 3-consonant Arabic roots (juzur) and derived morphological paradigms | Arabic root token (e.g. `ر-ح-م`), lemma query | Ranked root occurrences, derived forms, surah distributions | Empty state with suggestions if root not found | `plan_30_grand_strategic_tracks.md:83`, `packages/ql_search` |
| 09 | Cognitive AI | Quranic Morphological Visualizer | Interactive word-by-word grammatical tree (I'rab, syntax dependency, POS tagging) | Surah number, Ayah number, word index | Horizontal interactive syntax graph and grammatical breakdown table | Graceful simplification if detailed dependency tree unavailable | `plan_30_grand_strategic_tracks.md:86`, `apps/web/src/features/research` |
| 10 | Cognitive AI | Local-First Private AI Inference | Browser-native WebGPU / ONNX embedding and classification running zero-egress client-side | Search query text, local model weights (Cache API) | Local vector embeddings, semantic ranking | Falls back to server API if WebGPU is unsupported or memory exhausted | `plan_30_grand_strategic_tracks.md:89`, `apps/web` |
| 11 | Spatial HUD | Universal Ambient Atmosphere Provider | Lightweight HTML5 Canvas cosmic particle engine with dynamic nebula glow rendering at 60 FPS (<1% CPU) | Viewport dimensions, theme mode (dark/light), motion preference | Ambient cosmic background visual canvas | Automatically disabled when `prefers-reduced-motion` is active | `plan_30_grand_strategic_tracks.md:96`, `packages/ui` |
| 12 | Spatial HUD | 5-Region 3D Holographic Orbit | Interactive SVG orbital ring visualizing the 5 Command Center regions with smooth rotation | Region telemetry metrics, selected region state | Rotatable holographic SVG diagram with active sector focus | Fallback to 2D flat grid on low-performance devices | `plan_30_grand_strategic_tracks.md:99`, `@moonwitness/ui/src/composites/spatial-region.tsx` |
| 13 | Spatial HUD | Micro-Chime Web Audio Interaction | Sub-100ms pure sine tone synthesis (432 Hz / 528 Hz) for sacred milestone and navigation feedback | Audio trigger event (surah switch, task approval) | Synthesized harmonic tone via Web Audio API | Muted by default; respects user audio toggle and browser autoplay policy | `plan_30_grand_strategic_tracks.md:102`, `packages/ui` |
| 14 | Spatial HUD | Sanctuary Minimalist Mode (Extreme Zen) | Distraction-free reading state hiding HUD, navigation bars, and panels into pitch-black void | Toggle shortcut (`Z` or `Escape`), reading preferences | Pure centered sacred text on `#030712` void canvas | Floating restore trigger always accessible via keyboard or mouse move | `plan_30_grand_strategic_tracks.md:105`, `apps/web` |
| 15 | Spatial HUD | Adaptive Spatial Density Engine | Dynamic layout reflow adjusting from 360px mobile compact to 3440px quad-pane ultrawide HUD | Window resize event, breakpoint token (`xs`..`4k`) | Adaptive pane distribution (1 to 4 panes) with 65ch line limits | Preserves reading position across breakpoint transitions | `plan_30_grand_strategic_tracks.md:108`, `packages/ui/styles` |
| 16 | Harbor Community | Architectural Covenant Signature Ledger | Digital cryptographic covenant registry where contributors commit to research ethics and truthfulness | User profile ID, covenant version, signature affirmation | Signed covenant record, public attribution badge | Duplicate signature rejected; unauthenticated user prompted to login | `plan_30_grand_strategic_tracks.md:115`, `apps/web/src/app/community` |
| 17 | Harbor Community | Sanad-Verified Review Pipeline | Multi-peer scholarly review engine requiring at least 2 independent verifiers before content publication | Task ID, reviewer critique, approval vote | Workflow state transition to `published` or `rejected` | 403 Forbidden on author self-approval; 422 if reviewer quota not met | `plan_30_grand_strategic_tracks.md:118`, `packages/ql_workflow` |
| 18 | Harbor Community | Collaborative Harbor Study Circles | Moderated virtual study rooms for collaborative surah contemplation and verified research notes | Circle ID, user reflection entry, surah reference | Real-time discussion thread, curated community reflections | Unmoderated entries quarantined until facilitator clears them | `plan_30_grand_strategic_tracks.md:121`, `apps/web/src/app/community` |
| 19 | Harbor Community | Proof-of-Beneficial-Deeds Activity Ledger | Dignified, non-gamified public ledger recording verified beneficial deeds (translations, typos fixed) | User action event, verification proof hash | Audit log entry, contributor profile transparency trail | Gamified scoring/XP strictly prohibited; private actions masked | `plan_30_grand_strategic_tracks.md:124`, `packages/ql_base` |
| 20 | Harbor Community | Editorial Reflection & Ethics Checklist | Pre-publication ethical gate preventing unauthorized fatwa claims and enforcing classical attribution | Author article payload, checklist confirmation booleans | Submission pass token, validated review bundle | Blocks submission with actionable errors if mandatory criteria unchecked | `plan_30_grand_strategic_tracks.md:127`, `@moonwitness/ui` |
| 21 | Command Deck | Realtime Telemetry Orbit Monitor | Live operational dashboard tracking API response latency, Cloudflare edge health, and search throughput | Server telemetry stream, ping interval | Real-time SVG gauge, latency sparklines, system status pills | Automatically backs off polling frequency when browser tab is hidden | `plan_30_grand_strategic_tracks.md:134`, `apps/web/src/features/dashboard` |
| 22 | Command Deck | Automated PO Parity Synchronizer Tooling | CLI developer tool (`pnpm i18n:sync`) verifying parity and sorting between `id.po` and `en.po` catalogs | PO catalog files (`packages/ql_i18n/i18n/*.po`) | Synchronized PO files, structural diff report | Returns non-zero exit code on CI if unmerged catalog disparities exist | `plan_30_grand_strategic_tracks.md:137`, `packages/ql_i18n` |
| 23 | Command Deck | Next-Gen Spotlight Command Palette | Universal keyboard-driven command palette supporting navigation, search, theme toggling, and deep links | Shortcut (`Cmd+K`), command string (`> surah 18`) | Filtered command list, instantaneous route execution | ARIA announcements on active items; no matching command suggestions | `plan_30_grand_strategic_tracks.md:140`, `@moonwitness/ui/src/composites/search-dialog.tsx` |
| 24 | Command Deck | Studio Multi-Format Exporter | High-fidelity export engine producing print-ready mushaf PDFs, Markdown with frontmatter, and JSON | Research artifact ID, format target (`pdf` \| `md` \| `json`) | Downloadable binary/text document stream | Validation error if draft artifact is incomplete or unapproved | `plan_30_grand_strategic_tracks.md:143`, `packages/ql_research` |
| 25 | Command Deck | Resilient Offline PWA & Service Worker | Service Worker cache architecture ensuring core mushaf and bookmarks remain readable without internet | HTTP fetch requests, offline network events | Cached response assets from Cache API / IndexedDB | Offline status banner presented; sync queue replayed on reconnection | `plan_30_grand_strategic_tracks.md:146`, `apps/web` |
| 26 | Engineering Excellence | Modular Movement Componentization | Deconstruction of monolithic 844-line `apps/web/src/app/page.tsx` into 5 focused sub-movement modules (<150 lines each) | Monolithic `page.tsx` AST and UI state | 5 discrete modules in `apps/web/src/features/landing/components/` | Zero visual regression; exact DOM and accessibility parity preserved | `plan_30_grand_strategic_tracks.md:153`, `apps/web/src/app/page.tsx` |
| 27 | Engineering Excellence | Zero-Warning Strict Typing Hardening | Remediation of remaining linter warnings (`max-lines`, nested callbacks, explicit `this: void` callbacks) | Workspace TypeScript source files | 0 errors and 0 warnings under `pnpm lint` and `pnpm typecheck` | Lint errors block CI gate immediately | `plan_30_grand_strategic_tracks.md:161`, `eslint.config.mjs` |
| 28 | Engineering Excellence | Web Bundle Budget Hardening | Dynamic code-splitting of dialogs, visualizers, and heavy icons to keep main route first-load JS < 140 kB | Next.js build chunks, `.size-budget.json` | Optimized route bundles with dynamic `next/dynamic` loaders | CI fails if any route exceeds size budget threshold | `plan_30_grand_strategic_tracks.md:164`, `apps/web/.size-budget.json` |
| 29 | Engineering Excellence | Autonomous Workflow State Machine Testing | Rigorous automated testing of workflow state transitions ensuring zero lockdown bypass or self-approval | Transition matrices, role permissions, test permutations | Validated state machine invariants, 100% branch test coverage | Test suite fails on illegal state transitions or unauthorized approvals | `plan_30_grand_strategic_tracks.md:167`, `packages/ql_workflow` |
| 30 | Engineering Excellence | Comprehensive E2E Playwright Suite | Automated multi-breakpoint visual regression and critical user journey tests (Mobile, Tablet, Desktop, 4K) | Headless browser execution against staging environment | Visual diff screenshots, trace logs, pass/fail status | Pixel mismatch > 1% fails visual regression gate | `plan_30_grand_strategic_tracks.md:170`, `apps/web/e2e` |

---

## 7. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 01 | Track 01 (Mushaf Typography) | High-DPI screen with right-to-left layout and dynamic font size switching | Text reflow could trigger Cumulative Layout Shift (CLS) if font metrics are not pre-reserved; requires CSS `font-display: swap` with size-adjust fallback overrides. |
| 02 | Track 02 (Dual-Stream Reader) | Surah where translation has fewer or split verses relative to Arabic Uthmani text | Verses desynchronize in 2-column view; system must group or mark joined verses with clear visual anchors rather than misaligning succeeding lines. |
| 03 | Track 06 (Grounded Chat) | AI model hallucinates a non-existent Surah number (e.g. Surah 115) or non-existent ayah | Grounded output parser fails lookup in `ql_corpus`; must emit `GroundedAgentOutputError` or sanitize output to tag with `.is-unverified-citation`. |
| 04 | Track 07 (Provider Failover Mesh) | Primary provider hangs indefinitely (streaming socket open but 0 bytes transferred) | Socket timeout must trigger at exactly 3,000ms, abort the fetch signal, record failure in circuit breaker, and route request to backup provider. |
| 05 | Track 10 (Local-First AI) | Client browser has WebGPU disabled or has <512MB free VRAM | WebGPU initialization promise rejects; system must seamlessly fall back to WASM or transparently invoke remote `moonClient` API without user interruption. |
| 06 | Track 11 (Ambient Atmosphere) | User enables system-level `prefers-reduced-motion: reduce` while viewing cosmic canvas | Canvas `requestAnimationFrame` loop immediately halts, rendering a single static subtle gradient backdrop with zero CPU consumption. |
| 07 | Track 13 (Micro-Chime Audio) | User loads application without prior user interaction on page | Browser autoplay policy blocks `AudioContext.resume()`; system queues audio trigger until first user click, avoiding console warnings. |
| 08 | Track 17 (Sanad Review Pipeline) | Author of research paper attempts to approve their own article using an operator session | QlOrm model validator checks `actor_id !== record.author_id`; operation aborts with `QlForbiddenError` ("Self-review strictly prohibited by Sanad rules"). |
| 09 | Track 22 (PO Parity Sync) | Developer adds a new key to `id.po` but forgets to add it to `en.po` | CLI tool `pnpm i18n:sync --check` identifies key disparity, logs exact missing key and file path, and exits with code 1 in CI. |
| 10 | Track 25 (Resilient Offline PWA) | User goes offline and requests an uncached audio tilawah recitation file | Audio player displays accessible offline badge ("Audio available online only; text available offline") while keeping Quran text reader fully interactive. |
| 11 | Track 26 (Modular Movement) | Decomposing `page.tsx` moves state hooks into child components | If state is not lifted correctly, search dialog trigger or theme toggling might become disconnected; props contract must pass handler callbacks cleanly. |
| 12 | Track 28 (Bundle Budget) | A developer imports a large icon library or charting component statically in `/page` | CI build triggers size budget calculation; bundle exceeds 150 kB limit and gate fails with an explicit byte overflow notice. |

---

## 8. Detailed 30-Track Inventory & Gap Audit

Every track of the 30 tracks is inventoried below with its current footprint in `plan_30_grand_strategic_tracks.md`, architectural boundaries, missing specifications relative to R1/R2/R3, and the exact technical sections that must be added to make the track production-ready.

---

### Grand Domain A: Sacred Corpus, Research & Truth Provenance (Tracks 01 – 05)

#### 🔹 Track 01: Mushaf Typography & Diacritics Engine
- **Grand Domain**: Sacred Corpus & Truth Provenance
- **Current Status in Artifact**: Lines 57–59 (2 bullet points: high-level concept & component name mention).
- **Scope & Boundaries**: Addon `packages/ql_corpus`, `@moonwitness/ui/src/atoms/quran-text.tsx`, `apps/web/src/features/corpus`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks font loading pipeline, glyph metric normalization, and waqaf marker rules.
  - *R2 (Contracts & Models)*: Missing `QuranTextProps` interface; missing QlOrm model `corpus.waqaf_mark` or passage glyph segmentation fields; missing `moonClient` typography configuration DTO.
  - *R3 (Roadmap & Verif)*: No phased milestones; no zero-CLS visual regression test criteria.
- **Exact Technical Sections to Add**:
  1. Component Interface: `QuranTextProps` (`surah: number`, `ayah: number`, `text: string`, `script: 'uthmani' | 'indopak'`, `fontSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl'`, `showWaqafSigns: boolean`, `className?: string`).
  2. Data Schema: Extend `corpus.passage` with `script_type: 'uthmani' | 'madinah'`, `glyph_positions: json` (character indices for waqaf markers).
  3. API Contract: `moonClient.readCorpusVerse()` enhanced with typography metadata DTO.
  4. UI / Anti-Slop: RTL CSS isolation, `font-feature-settings: "cv01" on`, contrast check >= 7:1 against cosmic background.
  5. Roadmap: Phase 1 (Font bundling & glyph parser) -> Phase 2 (Atom component & RTL rendering) -> Phase 3 (Zero-CLS validation).
  6. Verification: Playwright visual snapshot at 360px and 1440px; Lighthouse CLS = 0.000.

#### 🔹 Track 02: Dual-Stream Hermeneutic Reader
- **Grand Domain**: Sacred Corpus & Truth Provenance
- **Current Status in Artifact**: Lines 61–63 (1 bullet point: concept of two-pane reading).
- **Scope & Boundaries**: `apps/web/src/features/corpus`, `@moonwitness/ui`, `packages/moonclient`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks synchronized scrolling state machine and responsive mobile collapse behavior.
  - *R2 (Contracts & Models)*: Missing `DualStreamReaderProps` and `useSynchronizedScroll` hook signatures; missing multi-edition pairing API in `moonClient`.
  - *R3 (Roadmap & Verif)*: No scroll performance benchmarks; no missing verse fallback rubrics.
- **Exact Technical Sections to Add**:
  1. Component Interface: `DualStreamReaderProps` (`surahNumber: number`, `arabicEditionKey: string`, `translationEditionKey: string`, `activeAyah?: number`, `onAyahSelect: (ayah: number) => void`).
  2. Data Schema: Addon `ql_corpus` cross-edition locator resolution mapping (`edition_id` + `locator`).
  3. API Contract: `moonClient.readDualStreamSurah(arabicEdition: string, translationEdition: string, surah: number): Promise<DualStreamSurahResponseDto>`.
  4. UI / Anti-Slop: 2-column grid (`grid-cols-1 md:grid-cols-2`), scroll lock toggle button, keyboard navigation (`j`/`k` for next/prev verse).
  5. Roadmap: Phase 1 (Dual-stream layout & scroll sync hook) -> Phase 2 (Keyboard shortcuts & edition selector) -> Phase 3 (Mobile accordion fallback).
  6. Verification: Vitest unit test for scroll synchronization algorithm; Playwright mobile breakpoint test.

#### 🔹 Track 03: Semantic Cross-Surah Knowledge Graph
- **Grand Domain**: Sacred Corpus & Truth Provenance
- **Current Status in Artifact**: Lines 64–66 (1 bullet point: concept of interactive SVG graph).
- **Scope & Boundaries**: `ql_search`, `ql_corpus`, `ql_research`, `apps/web/src/features/corpus/graph`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks graph data model, node/edge physics calculation strategy, and bundle impact control.
  - *R2 (Contracts & Models)*: Missing QlOrm model `corpus.concept_relation`; missing `TopicGraphResponseDto`; missing SVG canvas component props.
  - *R3 (Roadmap & Verif)*: No rendering performance limits (fps, node count); no accessibility fallback for screen readers.
- **Exact Technical Sections to Add**:
  1. Component Interface: `SemanticGraphViewProps` (`activeSurah?: number`, `activeConceptId?: string`, `onNodeClick: (node: GraphNode) => void`).
  2. Data Schema: QlOrm model `corpus.concept_relation` (`source_concept_id`, `target_concept_id`, `relation_type`, `evidence_passages`, `weight`).
  3. API Contract: `moonClient.getSemanticGraph(conceptId?: string): Promise<SemanticGraphResponseDto>`.
  4. UI / Anti-Slop: Pure SVG force-directed simulation (custom lightweight math, no 500kB D3 bundle), accessible tabular list view alternative.
  5. Roadmap: Phase 1 (Concept relation model & seed data) -> Phase 2 (Lightweight SVG canvas renderer) -> Phase 3 (Accessible table & search integration).
  6. Verification: Memory leak check on 1,000 node graph; WCAG tabular navigation test.

#### 🔹 Track 04: Verifiable Ayah Cryptographic Proofs & Attribution Stamp
- **Grand Domain**: Sacred Corpus & Truth Provenance
- **Current Status in Artifact**: Lines 67–69 (1 bullet point: concept of clipboard stamp with SHA-256).
- **Scope & Boundaries**: `packages/ql_corpus`, `packages/moonclient`, `@moonwitness/ui`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks specification of canonical serialization string format before hashing.
  - *R2 (Contracts & Models)*: Missing verification utility signature; missing API endpoint for public checksum validation.
  - *R3 (Roadmap & Verif)*: No unit tests asserting hash stability across Unicode normalization forms (NFC vs NFD).
- **Exact Technical Sections to Add**:
  1. Component Interface: `AyahAttributionStampProps` (`verseId: string`, `passageText: string`, `surah: number`, `ayah: number`, `showSeal: boolean`).
  2. Data Schema: Leverage existing `content_hash` in `corpus.passage` (`corpus_passage.ts:79`) with digital verification stamp.
  3. API Contract: `moonClient.verifyAyahProof(payload: VerifyAyahProofRequestDto): Promise<VerifyAyahProofResponseDto>`.
  4. UI / Anti-Slop: Discrete copy action icon, non-obtrusive toast notification (`Attribution seal copied`), QR/URL verification link.
  5. Roadmap: Phase 1 (Deterministic NFC canonical serializer) -> Phase 2 (Clipboard copy handler & visual seal) -> Phase 3 (Public verification route).
  6. Verification: Vitest test suite checking 100 random ayat for deterministic SHA-256 generation; tamper detection test.

#### 🔹 Track 05: Audio Tilawah Spatial Resonance
- **Grand Domain**: Sacred Corpus & Truth Provenance
- **Current Status in Artifact**: Lines 70–72 (1 bullet point: concept of audio player with whispering waveform).
- **Scope & Boundaries**: `packages/ql_corpus`, `packages/ui`, `apps/web/src/features/corpus/audio`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks audio segment streaming protocol, reciter rights/licensing model, and timeupdate debouncing.
  - *R2 (Contracts & Models)*: Missing QlOrm models `corpus.reciter` and `corpus.audio_segment`; missing `moonClient` audio manifest DTO.
  - *R3 (Roadmap & Verif)*: No audio latency benchmarks; no WCAG 1.4.2 (audio control) compliance rules.
- **Exact Technical Sections to Add**:
  1. Component Interface: `AudioTilawahPlayerProps` (`surah: number`, `activeAyah: number`, `reciterId: string`, `onAyahTimeUpdate: (ayah: number) => void`).
  2. Data Schema: QlOrm models `corpus.reciter` (`name`, `style`, `license_evidence_ref`) and `corpus.audio_segment` (`reciter_id`, `surah`, `ayah`, `start_ms`, `duration_ms`, `audio_url`).
  3. API Contract: `moonClient.getSurahAudioTiming(reciterId: string, surah: number): Promise<SurahAudioTimingResponseDto>`.
  4. UI / Anti-Slop: Canvas audio visualizer (minimal whispering waveform, 12 bars, subdued green/amber), zero autoplay, keyboard spacebar play/pause.
  5. Roadmap: Phase 1 (Audio segment schema & public-domain audio seeding) -> Phase 2 (Audio player & waveform component) -> Phase 3 (Verse auto-scroll lock).
  6. Verification: Audio playback time synchronization unit tests; license attribution assertion test.

---

### Grand Domain B: Cognitive AI & Grounded Reasoning Engine (Tracks 06 – 10)

#### 🔹 Track 06: Hallucination-Shielded Grounded Chat
- **Grand Domain**: Cognitive AI & Grounded Reasoning
- **Current Status in Artifact**: Lines 77–79 (1 bullet point: concept of parser validation in `/command-center/chat`).
- **Scope & Boundaries**: `packages/ql_chat`, `packages/agent-runtime`, `apps/web/src/app/command-center/chat`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks citation extraction regex, verification pipeline against `corpus.passage`, and fallback rendering state.
  - *R2 (Contracts & Models)*: Missing `GroundedChatBoxProps`; missing QlOrm model `chat.citation_log`; missing DTOs in `moonclient`.
  - *R3 (Roadmap & Verif)*: No synthetic hallucination benchmark test; no agent-as-judge evaluation rubric.
- **Exact Technical Sections to Add**:
  1. Component Interface: `GroundedChatBoxProps` (`channelId: string`, `onCitationClick: (passageId: string) => void`).
  2. Data Schema: QlOrm model `chat.message_citation` (`message_id`, `passage_id`, `status: 'grounded' | 'unverified'`, `score`).
  3. API Contract: Extend `packages/agent-runtime` `parseGroundedAgentOutput()` and add `moonClient.sendGroundedChatMessage()`.
  4. UI / Anti-Slop: Citation pill with verified checkmark, side-drawer preview of source scripture, warning banner `.ql-unverified-citation` when citation fails match.
  5. Roadmap: Phase 1 (Corpus ID validator in `agent-runtime`) -> Phase 2 (Chat UI citation pills & side drawer) -> Phase 3 (Automated hallucination stress test).
  6. Verification: Vitest test asserting fabricated ayah IDs are rejected and flagged; Playwright citation drawer test.

#### 🔹 Track 07: Multi-Provider Failover Mesh
- **Grand Domain**: Cognitive AI & Grounded Reasoning
- **Current Status in Artifact**: Lines 80–82 (1 bullet point: concept of FreeLLMAPI 3000ms timeout failover).
- **Scope & Boundaries**: `packages/ql_ai`, `packages/agent-runtime`, `apps/api`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks circuit breaker state machine (`CLOSED`, `OPEN`, `HALF_OPEN`) and provider health telemetry logging.
  - *R2 (Contracts & Models)*: Missing model fields on `ai.provider` (`timeout_ms`, `failover_priority`, `failure_count`); missing failover event DTO.
  - *R3 (Roadmap & Verif)*: No chaos injection test specs simulating 3,000ms latency.
- **Exact Technical Sections to Add**:
  1. Component Interface: `ProviderMeshStatusBadgeProps` (`activeProviderName: string`, `failoverCount: number`, `latencyMs: number`).
  2. Data Schema: Extend `ai.provider` (`failover_order: integer`, `timeout_ms: integer`, `circuit_status: 'closed' | 'open' | 'half_open'`).
  3. API Contract: `moonClient.getProviderMeshStatus(): Promise<ProviderMeshStatusResponseDto>`.
  4. Server Runtime: `FailoverProviderMesh` class in `agent-runtime` wrapping `ModelProvider` with `AbortController` timeout race.
  5. Roadmap: Phase 1 (Circuit breaker logic & timeout wrapper) -> Phase 2 (Provider priority schema update) -> Phase 3 (Chaos timeout tests).
  6. Verification: Node.js test simulating 3000ms hang on provider 1 with automatic fallback to provider 2 under 50ms.

#### 🔹 Track 08: Lexical Morphology Search & Root Word Indexer
- **Grand Domain**: Cognitive AI & Grounded Reasoning
- **Current Status in Artifact**: Lines 83–85 (1 bullet point: concept of 3-consonant root search e.g. `r-h-m`).
- **Scope & Boundaries**: `packages/ql_search`, `packages/ql_corpus`, `packages/moonclient`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks root-to-lemma indexing algorithm, Arabic diacritic stripping pipeline, and morphology schema.
  - *R2 (Contracts & Models)*: Missing QlOrm models `corpus.root_word` and `corpus.lemma`; missing `RootSearchRequestDto` / `RootSearchResponseDto`.
  - *R3 (Roadmap & Verif)*: No query latency SLA (e.g. <50ms across 77k words); no root coverage test suite.
- **Exact Technical Sections to Add**:
  1. Component Interface: `RootWordSearchProps` (`onSelectRoot: (root: string) => void`, `popularRoots: string[]`).
  2. Data Schema: QlOrm models `corpus.root_word` (`root_ar`, `root_translit`, `frequency`) and `corpus.word_derivation` (`root_id`, `passage_id`, `lemma`, `form_pattern`).
  3. API Contract: `moonClient.searchByRoot(root: string): Promise<RootWordSearchResponseDto>`.
  4. UI / Anti-Slop: Arabic root character selector chips, transliteration guidance, clean table of derived occurrences without clutter.
  5. Roadmap: Phase 1 (Root & derivation model + seed database) -> Phase 2 (Search indexer integration) -> Phase 3 (Root explorer UI).
  6. Verification: Vitest indexing test checking all derivations of `ر-ح-م` resolve to Surah 1:1, 1:3, etc.

#### 🔹 Track 09: Quranic Morphological Visualizer
- **Grand Domain**: Cognitive AI & Grounded Reasoning
- **Current Status in Artifact**: Lines 86–88 (1 bullet point: concept of I'rab syntax tree visualization).
- **Scope & Boundaries**: `apps/web/src/features/research`, `packages/ql_research`, `@moonwitness/ui`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks grammatical tree hierarchy representation and responsive layout for complex Arabic clauses.
  - *R2 (Contracts & Models)*: Missing QlOrm model `corpus.syntax_node`; missing `MorphologyTreeResponseDto`; missing tree component interface.
  - *R3 (Roadmap & Verif)*: No accessibility tree mapping for screen readers (ARIA `tree`, `treeitem`).
- **Exact Technical Sections to Add**:
  1. Component Interface: `MorphologyVisualizerProps` (`surah: number`, `ayah: number`, `highlightWordIndex?: number`).
  2. Data Schema: QlOrm model `corpus.syntax_segment` (`passage_id`, `word_index`, `pos_tag`, `case_ending`, `dependency_head`, `dependency_relation`).
  3. API Contract: `moonClient.getAyahMorphology(surah: number, ayah: number): Promise<AyahMorphologyResponseDto>`.
  4. UI / Anti-Slop: Horizontal tree node graph, semantic color tokens for grammatical cases (marfu' = gold, mansub = cyan, majrur = slate), full ARIA tree role attributes.
  5. Roadmap: Phase 1 (Grammar segmentation schema) -> Phase 2 (Syntax tree SVG visualizer) -> Phase 3 (Screen reader accessibility audit).
  6. Verification: Playwright accessibility test checking `role="tree"` hierarchy; visual snapshot of Ayat al-Kursi (2:255).

#### 🔹 Track 10: Local-First Private AI Inference Mode
- **Grand Domain**: Cognitive AI & Grounded Reasoning
- **Current Status in Artifact**: Lines 89–91 (1 bullet point: concept of WebGPU / Transformers.js zero-egress mode).
- **Scope & Boundaries**: `apps/web/src/features/ai`, `packages/agent-runtime`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks Web Worker thread offloading, model weight caching strategy, and WebGPU capability detection.
  - *R2 (Contracts & Models)*: Missing worker message interface; missing client toggle state and download progress contract.
  - *R3 (Roadmap & Verif)*: No network egress isolation test asserting 0 HTTP packets emitted during private inference.
- **Exact Technical Sections to Add**:
  1. Component Interface: `LocalInferenceToggleProps` (`enabled: boolean`, `onToggle: (state: boolean) => void`, `onProgress: (pct: number) => void`).
  2. Worker Protocol: `LocalInferenceWorkerMessage` (`type: 'init' | 'embed' | 'classify'`, `payload: unknown`, `transferBuffer?: ArrayBuffer`).
  3. Client Service: `LocalInferenceEngine` running quantized ONNX model in Web Worker with Cache API weight storage.
  4. UI / Anti-Slop: Minimalist progress bar during one-time model load (<45MB), shield icon showing "100% Private Client-Side Inference".
  5. Roadmap: Phase 1 (Web Worker wrapper & ONNX model integration) -> Phase 2 (Local vector cosine similarity) -> Phase 3 (Network egress assertion test).
  6. Verification: Playwright test monitoring network tab to assert zero external fetch calls while local mode is enabled.

---

### Grand Domain C: Spatial HUD, Visual World & Atmosphere (Tracks 11 – 15)

#### 🔹 Track 11: Universal Ambient Atmosphere Provider
- **Grand Domain**: Spatial HUD & Atmosphere
- **Current Status in Artifact**: Lines 96–98 (1 bullet point: `<AmbientAtmosphere>` HTML5 canvas, 60 FPS, <1% CPU).
- **Scope & Boundaries**: `@moonwitness/ui/src/atoms/ambient-atmosphere.tsx`, `apps/web`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks canvas particle lifecycle, resize debouncing, and reduced-motion event subscription.
  - *R2 (Contracts & Models)*: Missing `AmbientAtmosphereProps` component interface and theme token mapping.
  - *R3 (Roadmap & Verif)*: No CPU profile benchmark rubric (<1% sustained utilization).
- **Exact Technical Sections to Add**:
  1. Component Interface: `AmbientAtmosphereProps` (`density?: 'subtle' | 'dense'`, `interactive?: boolean`, `starCount?: number`, `className?: string`).
  2. Canvas Architecture: Double-buffered HTML5 Canvas with pre-calculated star positions, dynamic alpha breathing, and `requestAnimationFrame` loop.
  3. Motion & Accessibility: Automatic immediate pause if `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
  4. UI / Anti-Slop: Cosmic palette using CSS variables `--ql-cosmic-bg`, `--ql-cosmic-star`, zero heavy WebGL shaders.
  5. Roadmap: Phase 1 (Canvas render loop & motion listener) -> Phase 2 (Theme integration) -> Phase 3 (CPU utilization benchmark).
  6. Verification: Vitest unmount test verifying timer and animation frame cleanup; Chrome DevTools CPU profile test.

#### 🔹 Track 12: 5-Region 3D Holographic Orbit
- **Grand Domain**: Spatial HUD & Atmosphere
- **Current Status in Artifact**: Lines 99–101 (1 bullet point: concept of interactive SVG 5-region orbit).
- **Scope & Boundaries**: `apps/web/src/features/dashboard`, `@moonwitness/ui/src/composites/spatial-region.tsx`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks mathematical ellipse projection, SVG path generation, and keyboard navigation.
  - *R2 (Contracts & Models)*: Missing `HolographicOrbitProps` and `OrbitSectorData` interfaces.
  - *R3 (Roadmap & Verif)*: No responsiveness thresholds across mobile to 4K.
- **Exact Technical Sections to Add**:
  1. Component Interface: `HolographicOrbitProps` (`regions: OrbitRegion[]`, `activeRegionId: string`, `onSelectRegion: (id: string) => void`).
  2. SVG Geometry Engine: Parametric orbital ellipse calculations (`x = cx + rx * cos(theta)`, `y = cy + ry * sin(theta)`), SVG filter glows.
  3. UI / Anti-Slop: Vector-based holographic styling, crisp at any resolution without pixelation, keyboard arrow rotation.
  4. Roadmap: Phase 1 (SVG geometry math & region nodes) -> Phase 2 (Interactive rotation & active state focus) -> Phase 3 (Keyboard accessibility).
  5. Verification: Playwright cross-resolution visual tests (360px, 1080p, 4K); ARIA active-descendant validation.

#### 🔹 Track 13: Micro-Chime Web Audio Interaction System
- **Grand Domain**: Spatial HUD & Atmosphere
- **Current Status in Artifact**: Lines 102–104 (1 bullet point: Web Audio pure sine 432 Hz / 528 Hz, 100ms duration, muted default).
- **Scope & Boundaries**: `@moonwitness/ui/src/lib/micro-chime.ts`, `@moonwitness/ui/src/atoms/audio-chime-toggle.tsx`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks Web Audio `AudioContext` initialization on first user gesture and gain node exponential decay envelope.
  - *R2 (Contracts & Models)*: Missing sound type enums (`contemplation` = 432Hz, `affirmation` = 528Hz); missing user preference storage key.
  - *R3 (Roadmap & Verif)*: No audio click/pop prevention test (zero-crossing gain ramping).
- **Exact Technical Sections to Add**:
  1. API Interface: `MicroChimeEngine` (`playChime(type: 'contemplation' | 'affirmation' | 'transition'): void`, `toggleMute(): boolean`, `isMuted(): boolean`).
  2. Audio Synthesis: Pure oscillator node with exponential ramp-down (`gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)`).
  3. UI / Anti-Slop: Header bell/speaker icon toggle with clear visual indicator (`muted` / `active`), default muted.
  4. Roadmap: Phase 1 (Web Audio engine & gain envelope) -> Phase 2 (Audio toggle component & localStorage persistence) -> Phase 3 (Event dispatch integration).
  5. Verification: Vitest mock audio test asserting zero audio calls when muted; absence of audio pops.

#### 🔹 Track 14: Sanctuary Minimalist Mode (Extreme Zen Mode)
- **Grand Domain**: Spatial HUD & Atmosphere
- **Current Status in Artifact**: Lines 105–107 (1 bullet point: concept of "Hening" mode hiding all chrome).
- **Scope & Boundaries**: `apps/web/src/features/sanctuary`, `@moonwitness/ui`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks state transition coordination across global layouts and keyboard focus restoration.
  - *R2 (Contracts & Models)*: Missing `useSanctuaryMode` hook contract and floating restore trigger interface.
  - *R3 (Roadmap & Verif)*: No keyboard trap avoidance test or full screen API failure fallback.
- **Exact Technical Sections to Add**:
  1. Component Interface: `SanctuaryProviderProps`, `SanctuaryToggleProps` (`active: boolean`, `onToggle: () => void`).
  2. Layout Engine: CSS state modifier `.is-sanctuary-mode` on root layout hiding header, sidebar, footer with smooth 300ms fade.
  3. UI / Anti-Slop: Pure pitch-black background (`#030712`), centered reading text (`max-w-2xl mx-auto`), discreet restore pill on mouse move or `Escape`.
  4. Roadmap: Phase 1 (Global sanctuary state provider) -> Phase 2 (Layout fade-out animations & keyboard shortcut) -> Phase 3 (Focus management).
  5. Verification: Playwright test ensuring all sidebars achieve `aria-hidden="true"` and focus returns cleanly to toggle on exit.

#### 🔹 Track 15: Adaptive Spatial Density Engine (Phone to Ultra-wide 4K)
- **Grand Domain**: Spatial HUD & Atmosphere
- **Current Status in Artifact**: Lines 108–110 (1 bullet point: concept of 360px single column to 3440px quad-pane).
- **Scope & Boundaries**: `@moonwitness/ui/styles`, `apps/web`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks breakpoint token matrix, column width clamping (`max-w-[65ch]`), and multi-pane distribution rules.
  - *R2 (Contracts & Models)*: Missing layout density enum (`compact` | `standard` | `expanded` | `panoramic`).
  - *R3 (Roadmap & Verif)*: No multi-breakpoint screenshot regression test suite.
- **Exact Technical Sections to Add**:
  1. Responsive Tokens: Tailwind / CSS tokens (`xs: 360px`, `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1440px`, `2xl: 1920px`, `4k: 2560px+`).
  2. Density Rules: Single-column on mobile, dual-column on tablet/desktop, quad-pane on 21:9 ultra-wide (Nav, Mushaf, Commentary, Notes).
  3. UI / Anti-Slop: Reading measure strictly clamped to 65 characters per line to preserve typographic legibility on large screens.
  4. Roadmap: Phase 1 (Responsive grid tokens & density classes) -> Phase 2 (Quad-pane HUD component) -> Phase 3 (Visual breakpoint testing).
  5. Verification: Playwright screenshot suite at 360px, 768px, 1280px, 1920px, and 3440px.

---

### Grand Domain D: Harbor Community, Ethics & Governance (Tracks 16 – 20)

#### 🔹 Track 16: Architectural Covenant Signature Ledger
- **Grand Domain**: Harbor Community & Governance
- **Current Status in Artifact**: Lines 115–117 (1 bullet point: concept of digital covenant signature ledger).
- **Scope & Boundaries**: `apps/web/src/app/community`, `packages/ql_workflow` (or `ql_community`), `packages/moonclient`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks signature verification protocol, covenant versioning strategy, and audit trail schema.
  - *R2 (Contracts & Models)*: Missing QlOrm model `community.covenant_signature`; missing `SignCovenantRequestDto` and response contracts.
  - *R3 (Roadmap & Verif)*: No duplicate signature rejection tests or tamper-proof record validation.
- **Exact Technical Sections to Add**:
  1. Component Interface: `CovenantSignDialogProps` (`covenantVersion: string`, `onSigned: () => void`), `CovenantLedgerTableProps`.
  2. Data Schema: QlOrm model `community.covenant_signature` (`user_id: char`, `covenant_version: char`, `signed_at: datetime`, `signature_hash: char`, `ip_mask: char`).
  3. API Contract: `moonClient.signCovenant(version: string): Promise<CovenantSignResponseDto>`; `moonClient.listCovenantSignatures()`.
  4. UI / Anti-Slop: Dignified pledge dialog, explicit affirmative checkboxes, signed badge on contributor profile.
  5. Roadmap: Phase 1 (QlOrm covenant model & ACL) -> Phase 2 (Signature dialog & API) -> Phase 3 (Public audit ledger view).
  6. Verification: Integration test proving a user cannot double-sign the same version; ACL test preventing unauthorized modification.

#### 🔹 Track 17: Sanad-Verified Review Pipeline
- **Grand Domain**: Harbor Community & Governance
- **Current Status in Artifact**: Lines 118–120 (1 bullet point: concept of requiring at least 2 peer reviewers before `published`).
- **Scope & Boundaries**: `packages/ql_workflow`, `packages/ql_research`, `apps/web/src/features/workflow`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks workflow state machine definition and anti-self-approval enforcement.
  - *R2 (Contracts & Models)*: Missing QlOrm model `workflow.peer_review`; missing peer review DTOs in `moonclient`.
  - *R3 (Roadmap & Verif)*: No negative security test verifying self-approval attempts produce 403 Forbidden.
- **Exact Technical Sections to Add**:
  1. Component Interface: `PeerReviewFormProps` (`taskId: string`, `onSubmitReview: (decision: 'approved' | 'changes_requested') => void`).
  2. Data Schema: QlOrm model `workflow.peer_review` (`task_id: char`, `reviewer_id: char`, `decision: char`, `notes: text`, `sanad_chain_ref: char`).
  3. Workflow Rule: State transition from `under_review` to `published` requires `SELECT COUNT(*) >= 2 WHERE decision = 'approved' AND reviewer_id != author_id`.
  4. API Contract: `moonClient.submitPeerReview(taskId: string, payload: PeerReviewRequestDto): Promise<PeerReviewResponseDto>`.
  5. UI / Anti-Slop: Diff viewer comparing proposed changes against canonical text; reviewer sanad accreditation badge.
  6. Roadmap: Phase 1 (Workflow model & anti-self-approval rule) -> Phase 2 (Reviewer submission UI) -> Phase 3 (Security audit test).
  7. Verification: Vitest state machine test asserting transition failure when only 1 review exists or author tries to review self.

#### 🔹 Track 18: Collaborative Harbor Study Circles
- **Grand Domain**: Harbor Community & Governance
- **Current Status in Artifact**: Lines 121–123 (1 bullet point: concept of virtual study rooms with moderated notes).
- **Scope & Boundaries**: `apps/web/src/app/community`, `packages/ql_research`, `packages/moonclient`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks study room lifecycle, moderation workflow, and real-time collaboration structure.
  - *R2 (Contracts & Models)*: Missing QlOrm models `community.study_circle` and `community.circle_reflection`; missing DTOs in `moonclient`.
  - *R3 (Roadmap & Verif)*: No moderation quarantine test checking unapproved reflections remain hidden from general members.
- **Exact Technical Sections to Add**:
  1. Component Interface: `StudyCircleRoomProps` (`circleId: string`, `surahNumber: number`), `CircleReflectionBoardProps`.
  2. Data Schema: QlOrm models `community.study_circle` (`title`, `surah_id`, `facilitator_id`, `status`) and `community.circle_reflection` (`circle_id`, `passage_id`, `author_id`, `content`, `moderation_status`).
  3. API Contract: `moonClient.getStudyCircle(id: string): Promise<StudyCircleResponseDto>`; `moonClient.submitCircleReflection()`.
  4. UI / Anti-Slop: Quiet contemplation board, moderated cards, clear distinction between personal reflection and verified tafsir.
  5. Roadmap: Phase 1 (Circle models & moderation ACL) -> Phase 2 (Room interface & reflection board) -> Phase 3 (Moderation review portal).
  6. Verification: Moderation isolation test verifying `quarantined` notes return 403 to non-facilitator requests.

#### 🔹 Track 19: Proof-of-Beneficial-Deeds Activity Ledger
- **Grand Domain**: Harbor Community & Governance
- **Current Status in Artifact**: Lines 124–126 (1 bullet point: concept of public audit ledger without gamified coins/levels).
- **Scope & Boundaries**: `apps/web/src/app/community`, `packages/ql_base`, `packages/moonclient`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks action event taxonomy and anti-gamification design enforcement.
  - *R2 (Contracts & Models)*: Missing QlOrm model `community.beneficial_deed`; missing `DeedsLedgerResponseDto`.
  - *R3 (Roadmap & Verif)*: No privacy compliance test ensuring users can toggle anonymity for their deeds.
- **Exact Technical Sections to Add**:
  1. Component Interface: `DeedsLedgerTableProps` (`filterType?: DeedType`, `userId?: string`), `DeedItemRowProps`.
  2. Data Schema: QlOrm model `community.beneficial_deed` (`actor_id`, `deed_type: 'translation_audit' | 'source_verification' | 'typo_fix'`, `target_model`, `target_id`, `is_anonymous: boolean`, `created_at`).
  3. API Contract: `moonClient.listBeneficialDeeds(filter?: DeedsFilterDto): Promise<DeedsLedgerResponseDto>`.
  4. UI / Anti-Slop: Strict anti-gamification rule: NO experience points (XP), NO leaderboard ranks, NO virtual badges. Pure transparent historical audit trail.
  5. Roadmap: Phase 1 (Deed event model & event emitter hooks) -> Phase 2 (Ledger table component) -> Phase 3 (Privacy anonymity toggle).
  6. Verification: Snapshot test verifying absence of gamification words/elements; anonymous identity mask verification.

#### 🔹 Track 20: Editorial Reflection & Ethics Checklist
- **Grand Domain**: Harbor Community & Governance
- **Current Status in Artifact**: Lines 127–129 (1 bullet point: pre-publication dialog preventing unauthorized fatwa claims).
- **Scope & Boundaries**: `@moonwitness/ui`, `apps/web/src/features/research`, `packages/ql_research`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks client-side validation schema and server-side verification of checked ethics criteria.
  - *R2 (Contracts & Models)*: Missing `EthicsChecklistModalProps` interface and `EthicsAffirmationDto`.
  - *R3 (Roadmap & Verif)*: No submission rejection test when mandatory criteria are skipped.
- **Exact Technical Sections to Add**:
  1. Component Interface: `EthicsChecklistModalProps` (`isOpen: boolean`, `onConfirm: (affirmations: string[]) => void`, `onCancel: () => void`).
  2. Data Schema: Add `ethics_checklist_signed_at: datetime` and `ethics_assertions: json` to `ql_research` models (`story.narrative`, `witness.statement`).
  3. API Contract: Enforce presence of `ethicsAffirmation` in publication request DTOs in `moonclient`.
  4. UI / Anti-Slop: High-contrast modal dialog, explicit checklist items (e.g. "I affirm this is personal reflection, not a binding religious verdict"), bilingual text (`id` and `en`).
  5. Roadmap: Phase 1 (Ethics schema & validation rules) -> Phase 2 (Modal dialog component) -> Phase 3 (Publication API gate enforcement).
  6. Verification: Vitest test asserting API returns 422 Unprocessable Entity if publication is attempted without complete ethics payload.

---

### Grand Domain E: Command Deck & System Telemetry (Tracks 21 – 25)

#### 🔹 Track 21: Realtime Telemetry Orbit Monitor
- **Grand Domain**: Command Deck & Operability
- **Current Status in Artifact**: Lines 134–136 (1 bullet point: concept of health widget with API latency, connectors, and throughput).
- **Scope & Boundaries**: `apps/web/src/features/dashboard`, `apps/api`, `packages/ql_cloudflare`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks polling / server-sent events architecture and tab-visibility pause behavior.
  - *R2 (Contracts & Models)*: Missing `TelemetryOrbitWidgetProps`; missing `SystemTelemetryResponseDto` in `moonclient`.
  - *R3 (Roadmap & Verif)*: No background tab polling suppression test.
- **Exact Technical Sections to Add**:
  1. Component Interface: `TelemetryOrbitWidgetProps` (`refreshIntervalMs?: number`, `showSparklines?: boolean`), `MetricGaugeProps`.
  2. Data Schema: Telemetry payload contract (`dbLatencyMs`, `apiPingMs`, `activeConnectorCount`, `searchQueriesPerMin`, `errorRate`).
  3. API Contract: `moonClient.getSystemTelemetry(): Promise<SystemTelemetryResponseDto>`.
  4. UI / Anti-Slop: Lightweight SVG sparkline (custom inline path, 0 external chart libraries), status indicator dots (`.ql-status-healthy`, `.ql-status-warn`).
  5. Roadmap: Phase 1 (API telemetry aggregator route) -> Phase 2 (SVG sparkline & telemetry widget) -> Phase 3 (Tab-visibility pause hook).
  6. Verification: Mock timer test asserting polling frequency backs off from 5s to 60s when `document.hidden === true`.

#### 🔹 Track 22: Automated PO Parity Synchronizer Tooling
- **Grand Domain**: Command Deck & Operability
- **Current Status in Artifact**: Lines 137–139 (1 bullet point: concept of `pnpm i18n:sync` CLI tool).
- **Scope & Boundaries**: `packages/ql_i18n`, `scripts/i18n-sync.mjs`, `.github/workflows/ci.yml`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks CLI architecture, sorting algorithm, and CI gate exit code specification.
  - *R2 (Contracts & Models)*: Missing PO parse/diff interface; missing `package.json` script registration.
  - *R3 (Roadmap & Verif)*: No test validating that missing or misplaced msgids trigger process exit code 1.
- **Exact Technical Sections to Add**:
  1. CLI Command Specification: `pnpm i18n:sync` (synchronize and auto-fill placeholder keys) and `pnpm i18n:sync --check` (CI verification mode).
  2. Sync Algorithm: Parse `id.po` and `en.po` via `gettext-parser`, find symmetric difference, sort entries alphabetically by `msgid`, format comments.
  3. CI Integration: Add step to `.github/workflows/ci.yml` before typecheck to prevent catalog drift.
  4. Roadmap: Phase 1 (PO comparison script & sort logic) -> Phase 2 (`package.json` scripts & CLI flags) -> Phase 3 (CI workflow gate).
  5. Verification: Node.js test adding a dummy asymmetric key and asserting `pnpm i18n:sync --check` exits with code 1.

#### 🔹 Track 23: Next-Gen Spotlight Command Palette
- **Grand Domain**: Command Deck & Operability
- **Current Status in Artifact**: Lines 140–142 (1 bullet point: concept of expanding SearchDialog to handle commands like `> surah 18`).
- **Scope & Boundaries**: `@moonwitness/ui/src/composites/search-dialog.tsx`, `apps/web`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks command parser grammar, action registry, and keyboard selection state machine.
  - *R2 (Contracts & Models)*: Missing `CommandAction` interface and command handler signatures.
  - *R3 (Roadmap & Verif)*: No WCAG 2.2 AA combobox keyboard navigation test suite.
- **Exact Technical Sections to Add**:
  1. Component Interface: `CommandPaletteProps` (`isOpen: boolean`, `onClose: () => void`, `actions: CommandAction[]`, `onExecute: (action: CommandAction) => void`).
  2. Command Grammar: Standard search (`query`) vs Command mode (`> [verb] [args]`, e.g. `> theme [light|dark]`, `> surah [1-114]`, `> nav [destination]`).
  3. UI / Anti-Slop: ARIA 1.2 compliant combobox (`role="combobox"`, `aria-expanded`, `aria-activedescendant`), keyboard shortcuts (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`), zero mouse dependency.
  4. Roadmap: Phase 1 (Command grammar parser & action registry) -> Phase 2 (UI composite expansion in `@moonwitness/ui`) -> Phase 3 (Keyboard navigation E2E).
  5. Verification: Playwright test testing `Cmd+K` -> typing `> theme dark` -> `Enter` and verifying theme state changes.

#### 🔹 Track 24: Studio Multi-Format Exporter
- **Grand Domain**: Command Deck & Operability
- **Current Status in Artifact**: Lines 143–145 (1 bullet point: concept of PDF mushaf-layout, Markdown with frontmatter, and JSON).
- **Scope & Boundaries**: `apps/web/src/features/export`, `packages/ql_research`, `apps/api`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks document generation engine, PDF styling templates, and streaming download pipeline.
  - *R2 (Contracts & Models)*: Missing `ExportArtifactRequestDto`; missing `ExportDialogProps` interface.
  - *R3 (Roadmap & Verif)*: No regression tests asserting exported JSON validates against RGBL schemas.
- **Exact Technical Sections to Add**:
  1. Component Interface: `ExportDialogProps` (`artifactId: string`, `artifactTitle: string`, `isOpen: boolean`, `onClose: () => void`).
  2. Export Formats:
     - Markdown: Clean frontmatter (title, author, surah reference, sha256) followed by dual-column quotes.
     - PDF: Server-rendered or print-stylesheet Uthmani Arabic typography with headers and page numbers.
     - JSON: Structured RGBL export conforming to MoonWitness JSON Schema.
  3. API Contract: `moonClient.exportArtifact(id: string, format: 'pdf' | 'md' | 'json'): Promise<Blob>`.
  4. UI / Anti-Slop: Download progress spinner, format selector radio group, clear size preview before generation.
  5. Roadmap: Phase 1 (Markdown & JSON serializers) -> Phase 2 (PDF print template) -> Phase 3 (Export dialog UI & stream delivery).
  6. Verification: Vitest schema validation test checking exported JSON output against `packages/types`.

#### 🔹 Track 25: Resilient Offline PWA & Service Worker
- **Grand Domain**: Command Deck & Operability
- **Current Status in Artifact**: Lines 146–148 (1 bullet point: concept of Service Worker offline cache for Mushaf and bookmarks).
- **Scope & Boundaries**: `apps/web/public/sw.js`, `apps/web/src/service-worker`, `apps/web/public/manifest.json`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks cache invalidation strategy, precache asset list, and offline IndexedDB sync queue.
  - *R2 (Contracts & Models)*: Missing Service Worker lifecycle message contracts and offline banner component props.
  - *R3 (Roadmap & Verif)*: No automated offline network emulation tests in Playwright.
- **Exact Technical Sections to Add**:
  1. Caching Strategy: Cache-First for static font files and Quranic text JSON (`/api/corpus/*`); Network-First with Cache fallback for user notes.
  2. Component Interface: `OfflineStatusBarProps` (`isOffline: boolean`, `pendingSyncCount: number`).
  3. Web App Manifest: PWA icons, `theme_color: "#030712"`, `background_color: "#030712"`, `display: "standalone"`.
  4. Roadmap: Phase 1 (Service worker registration & Cache-First font/text rules) -> Phase 2 (Offline status banner & indicator) -> Phase 3 (Offline E2E emulation).
  5. Verification: Playwright test dispatching `page.context().setOffline(true)` and asserting Surah 18 remains readable and navigable.

---

### Grand Domain F: Engineering Excellence, Modularity & Performance (Tracks 26 – 30)

#### 🔹 Track 26: Modular Movement Componentization (`apps/web/src/app/page.tsx`)
- **Grand Domain**: Engineering Excellence & Modularity
- **Current Status in Artifact**: Lines 153–160 (Lists 5 sub-movement component names to split 844-line `page.tsx`).
- **Scope & Boundaries**: `apps/web/src/features/landing/components/`, `apps/web/src/app/page.tsx`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks component decomposition boundary specifications and state encapsulation strategy.
  - *R2 (Contracts & Models)*: Missing explicit props interfaces for all 5 submodules; missing refactored `page.tsx` scaffold.
  - *R3 (Roadmap & Verif)*: No visual regression / DOM parity test confirming 0 markup changes after decomposition.
- **Exact Technical Sections to Add**:
  1. Submodule Interfaces:
     - `HeroArrivalStageProps` (`user?: AuthUserDto | null`, `brandName: string`, `onOpenSearch: () => void`)
     - `UniversePortalDockProps` (`sections: readonly LandingSectionConfig[]`, `activeFilter?: string`)
     - `ExploreKnowledgeTreasuryProps` (`items: LandingViewItemDto[]`, `loading: boolean`, `error: unknown`)
     - `TransmissionsSanctuaryProps` (`transmissions: TransmissionItemDto[]`)
     - `ReturnFooterClosingProps` (`locale: UiLocale`, `theme: 'dark' | 'light'`, `onLocaleChange: (loc: UiLocale) => void`, `onToggleTheme: () => void`)
  2. File Line Target: Every submodule strictly under 150 lines; `page.tsx` orchestrator reduced from 844 lines to <120 lines.
  3. Roadmap: Phase 1 (Draft submodule props interfaces) -> Phase 2 (Extract components into `src/features/landing/components/`) -> Phase 3 (Refactor `page.tsx` & DOM parity test).
  4. Verification: Playwright visual regression test comparing before-and-after screenshots with 0.00% pixel diff.

#### 🔹 Track 27: Zero-Warning Strict Typing Hardening
- **Grand Domain**: Engineering Excellence & Modularity
- **Current Status in Artifact**: Lines 161–163 (1 bullet point: concept of resolving remaining linter warnings).
- **Scope & Boundaries**: `apps/web`, `packages/*`, `eslint.config.mjs`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks precise audit of existing warnings (e.g. `max-lines`, nested callbacks, callback `this: void` typing).
  - *R2 (Contracts & Models)*: Missing strict typing rules and function signature convention definitions.
  - *R3 (Roadmap & Verif)*: No zero-warning gate command in CI pipeline.
- **Exact Technical Sections to Add**:
  1. Remediation Checklist:
     - Refactor files exceeding 300 lines into sub-modules.
     - Add explicit `this: void` annotation on detached callbacks.
     - Eliminate any remaining implicit `any` or loose type casts (`as unknown as ...`).
  2. Linter Gate: Update ESLint config to treat all warnings as errors (`--max-warnings 0`) in CI.
  3. Roadmap: Phase 1 (Audit active warnings) -> Phase 2 (Apply strict typings & refactor complex closures) -> Phase 3 (Enforce zero-warning gate).
  4. Verification: Execute `pnpm lint` and `pnpm typecheck` locally and verify exit code 0 with 0 warnings.

#### 🔹 Track 28: Web Bundle Budget Hardening (`apps/web/.size-budget.json`)
- **Grand Domain**: Engineering Excellence & Modularity
- **Current Status in Artifact**: Lines 164–166 (1 bullet point: concept of dynamic imports to bring Home initial JS under 140 kB).
- **Scope & Boundaries**: `apps/web/.size-budget.json`, `apps/web/src/app/`, `next.config.mjs`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks dynamic import mapping of heavy components (`SearchDialog`, modals, charts, SVG orbit).
  - *R2 (Contracts & Models)*: Missing skeleton fallback components during dynamic chunk load.
  - *R3 (Roadmap & Verif)*: No updated `.size-budget.json` target thresholds.
- **Exact Technical Sections to Add**:
  1. Dynamic Import Strategy:
     - `const SearchDialog = dynamic(() => import('@moonwitness/ui').then(m => m.SearchDialog), { ssr: false })`
     - Code-split complex visualizers and telemetry widgets with CSS skeleton loaders.
  2. Budget Update: Lower `maxFirstLoadKb` from 150 to 140; adjust route targets in `.size-budget.json`.
  3. Roadmap: Phase 1 (Identify top 3 heaviest modules in Webpack bundle analyzer) -> Phase 2 (Implement `next/dynamic` splitting) -> Phase 3 (Size-budget CI validation).
  4. Verification: Run `pnpm build` in `apps/web` and assert initial load JS for `/page` is <= 138.0 kB.

#### 🔹 Track 29: Autonomous Workflow State Machine Testing (`ql_workflow`)
- **Grand Domain**: Engineering Excellence & Modularity
- **Current Status in Artifact**: Lines 167–169 (1 bullet point: concept of stress-testing transition matrix to prevent lockdown bypass).
- **Scope & Boundaries**: `packages/ql_workflow/tests/`, `packages/ql_workflow/models/`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks state transition matrix diagram and illegal transition enumeration.
  - *R2 (Contracts & Models)*: Missing property-based transition test generator specification.
  - *R3 (Roadmap & Verif)*: No transition matrix test execution command.
- **Exact Technical Sections to Add**:
  1. State Transition Matrix:
     - `draft` -> `submitted` -> `under_peer_review` -> `peer_approved` -> `published`
     - Illegal shortcuts (e.g. `draft` -> `published`, or `under_peer_review` -> `published` with 0 reviews) must throw `WorkflowTransitionError`.
  2. Security Invariants: Anti-self-approval rule; immutable audit logging on every transition attempt.
  3. Roadmap: Phase 1 (Exhaustive state transition matrix test) -> Phase 2 (Fuzzing randomized invalid transition paths) -> Phase 3 (Role-based privilege escalation test).
  4. Verification: Vitest test suite executing all permutations of state transitions and asserting 100% of illegal transitions fail.

#### 🔹 Track 30: Comprehensive E2E Playwright Spatial Testing Suite
- **Grand Domain**: Engineering Excellence & Modularity
- **Current Status in Artifact**: Lines 170–172 (1 bullet point: concept of automated multi-breakpoint visual regression suite).
- **Scope & Boundaries**: `apps/web/e2e/`, `playwright.config.ts`, `.github/workflows/ci.yml`.
- **Identified Technical Gaps (R1, R2, R3)**:
  - *R1 (Architecture)*: Lacks Playwright configuration specs, breakpoint definitions, and test fixtures.
  - *R2 (Contracts & Models)*: Missing Page Object Models (POM) for Landing, Corpus Reader, Chat, and Command Center.
  - *R3 (Roadmap & Verif)*: No visual regression pixel tolerance threshold definition (`maxDiffPixelRatio: 0.01`).
- **Exact Technical Sections to Add**:
  1. Playwright Test Suite Matrix:
     - `landing-spatial.spec.ts`: Test Hero arrival, search dialog `Cmd+K`, theme toggle.
     - `corpus-dual-stream.spec.ts`: Test synchronized scroll and ayah selection.
     - `sanctuary-mode.spec.ts`: Test distraction-free toggle and keyboard shortcuts.
     - `workflow-governance.spec.ts`: Test peer review approval gates.
  2. Viewport Matrix: Mobile (375x667), Tablet (768x1024), Desktop (1440x900), Ultrawide (2560x1080).
  3. Roadmap: Phase 1 (Playwright test harness setup & POMs) -> Phase 2 (Core user journey test implementation) -> Phase 3 (CI visual regression artifact upload).
  4. Verification: Execute `pnpm test:e2e` and verify all tests pass with zero screenshot regressions.

---

### Section 3 & 4 Deficiencies & Proposed Fixes

#### Section 3: Recommended Phased Execution Strategy
- **Current State**: Only 20 tracks mapped across 5 batches. Tracks 03, 04, 05, 07, 09, 10, 15, 19, 24, 29 are omitted.
- **Required Expansion**: Expand to a comprehensive 6-batch execution roadmap containing **all 30 tracks**, mapped by dependency hierarchy:
  - **Batch 1 (Foundations & Refactoring)**: Track 26 (Modularize `page.tsx`), Track 01 (Mushaf Typography), Track 02 (Dual-Stream Reader), Track 23 (Command Palette).
  - **Batch 2 (Spatial HUD & Atmosphere)**: Track 11 (Ambient Atmosphere), Track 12 (3D Holographic Orbit), Track 13 (Micro-Chime Audio), Track 14 (Sanctuary Mode), Track 15 (Adaptive Density).
  - **Batch 3 (Cognitive AI & Search)**: Track 06 (Grounded Chat), Track 07 (Provider Failover Mesh), Track 08 (Lexical Morphology Search), Track 09 (Morphological Visualizer), Track 10 (Local-First Private AI).
  - **Batch 4 (Corpus Truth & Verification)**: Track 03 (Semantic Graph), Track 04 (Verifiable Cryptographic Proofs), Track 05 (Spatial Audio Tilawah).
  - **Batch 5 (Harbor Community & Governance)**: Track 16 (Covenant Ledger), Track 17 (Sanad Review Pipeline), Track 18 (Study Circles), Track 19 (Beneficial Deeds Ledger), Track 20 (Ethics Checklist).
  - **Batch 6 (Hardening, Telemetry & Quality Gates)**: Track 21 (Realtime Telemetry), Track 22 (PO Parity Sync), Track 24 (Multi-Format Exporter), Track 25 (Offline PWA), Track 27 (Zero-Warning Strict Typing), Track 28 (Bundle Budget Hardening), Track 29 (Workflow State Machine Tests), Track 30 (Playwright E2E Suite).

#### Section 4: User Review Required
- **Current State**: Short informal callout.
- **Required Expansion**: Formal decision gates, risk mitigation matrices, and clear operational recommendations for incremental rollout.

---

## 9. Summary for Implementation Next Steps

1. **Target Artifact**: `C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md`
2. **Action Plan**:
   - Expand every track with the 7 standardized technical subsections documented in Section 8 above.
   - Update Section 3 with the complete 6-batch execution matrix incorporating all 30 tracks.
   - Formalize Section 4 with architectural governance gates.
