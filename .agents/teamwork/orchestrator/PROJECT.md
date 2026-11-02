# Project: MoonWitness & A-L-L-A-H.COM 30 Grand Strategic Tracks Technical Blueprint

## Architecture
- **Target Plan Artifact**: `C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md`
- **Backend Architecture**: All domain models, persistence schemas, ACL rules, view declarations, and seed data reside in addon packages matching `packages/ql_*` using TypeScript. Strictly NO Drizzle ORM, NO Drizzle schema definitions, and NO migration files. Models synchronized at runtime via `syncSchema()` and seeded via `loadDefaultData()`. Model naming strictly `domain.entity`.
- **Client & API Architecture**: Centralized in `@moonwitness/moonclient` (`packages/moonclient`). Routes declared in frozen `apiRoutes` object with encoded path segments. Strongly-typed DTOs (`*RequestDto`, `*ResponseDto`, `*ItemDto`). Singleton client instance `moonClient`. Browser code in `apps/web` strictly banned from direct DB/ORM access or raw `fetch`.
- **UI & Component Architecture**: UI primitives and composites in `@moonwitness/ui` (`packages/ui`). CSS tokens in `tokens.css` with dark/light theme parity. Classes follow `.ql-*` block, `--*` modifiers, and `.is-*` dynamic states. Zero hardcoded copy in UI components; copy passed via props and backed by `ql_i18n` catalogs (`id.po`, `en.po`). Anti-slop rules strictly enforced (no raw HTML form elements, no inline styles, no arbitrary hex colors, no Tailwind default palette, WCAG 2.2 AA accessibility, 150 kB bundle budget).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 01 | Mushaf Typography & Diacritics Engine | High-resolution Madinah/Uthmani Arabic typography with variable font scaling, dynamic kerning, and waqaf symbol formatting | M1 | Survey 1, Survey 2, Survey 3 |
| 02 | Dual-Stream Hermeneutic Reader | Synchronized dual-pane reader comparing revelation verbatim Arabic with authoritative translations | M1 | Survey 1, Survey 2, Survey 3 |
| 03 | Semantic Cross-Surah Graph | Interactive SVG knowledge graph visualizing thematic narratives and cross-surah concept links | M1 | Survey 1, Survey 2, Survey 3 |
| 04 | Verifiable Ayah Cryptographic Proofs | Clipboard copying and sharing utility embedding canonical SHA-256 verse hashes and citation seals | M1 | Survey 1, Survey 2, Survey 3 |
| 05 | Audio Tilawah Spatial Resonance | Verified tilawah audio playback with minimalist whispering waveform and real-time ayah highlighting | M1 | Survey 1, Survey 2, Survey 3 |
| 06 | Hallucination-Shielded Grounded Chat | AI query assistant that strictly validates Quranic quotations against canonical `corpus.passage` records | M1 | Survey 1, Survey 2, Survey 3 |
| 07 | Multi-Provider Failover Mesh | Resilient gateway routing queries across primary and fallback LLMs with 3000ms timeout circuit breaker | M1 | Survey 1, Survey 2, Survey 3 |
| 08 | Lexical Morphology Search | Root word search indexing 3-consonant Arabic roots (juzur) and derived morphological paradigms | M1 | Survey 1, Survey 2, Survey 3 |
| 09 | Quranic Morphological Visualizer | Interactive word-by-word grammatical tree (I'rab, syntax dependency, POS tagging) | M1 | Survey 1, Survey 2, Survey 3 |
| 10 | Local-First Private AI Inference | Browser-native WebGPU / ONNX embedding and classification running zero-egress client-side | M1 | Survey 1, Survey 2, Survey 3 |
| 11 | Universal Ambient Atmosphere Provider | Lightweight HTML5 Canvas cosmic particle engine with dynamic nebula glow rendering at 60 FPS (<1% CPU) | M2 | Survey 1, Survey 2, Survey 3 |
| 12 | 5-Region 3D Holographic Orbit | Interactive SVG orbital ring visualizing the 5 Command Center regions with smooth rotation | M2 | Survey 1, Survey 2, Survey 3 |
| 13 | Micro-Chime Web Audio Interaction | Sub-100ms pure sine tone synthesis (432 Hz / 528 Hz) for sacred milestone and navigation feedback | M2 | Survey 1, Survey 2, Survey 3 |
| 14 | Sanctuary Minimalist Mode (Extreme Zen) | Distraction-free reading state hiding HUD, navigation bars, and panels into pitch-black void | M2 | Survey 1, Survey 2, Survey 3 |
| 15 | Adaptive Spatial Density Engine | Dynamic layout reflow adjusting from 360px mobile compact to 3440px quad-pane ultrawide HUD | M2 | Survey 1, Survey 2, Survey 3 |
| 16 | Architectural Covenant Signature Ledger | Digital cryptographic covenant registry where contributors commit to research ethics and truthfulness | M2 | Survey 1, Survey 2, Survey 3 |
| 17 | Sanad-Verified Review Pipeline | Multi-peer scholarly review engine requiring at least 2 independent verifiers before content publication | M2 | Survey 1, Survey 2, Survey 3 |
| 18 | Collaborative Harbor Study Circles | Moderated virtual study rooms for collaborative surah contemplation and verified research notes | M2 | Survey 1, Survey 2, Survey 3 |
| 19 | Proof-of-Beneficial-Deeds Activity Ledger | Dignified, non-gamified public ledger recording verified beneficial deeds (translations, typos fixed) | M2 | Survey 1, Survey 2, Survey 3 |
| 20 | Editorial Reflection & Ethics Checklist | Pre-publication ethical gate preventing unauthorized fatwa claims and enforcing classical attribution | M2 | Survey 1, Survey 2, Survey 3 |
| 21 | Realtime Telemetry Orbit Monitor | Live operational dashboard tracking API response latency, Cloudflare edge health, and search throughput | M3 | Survey 1, Survey 2, Survey 3 |
| 22 | Automated PO Parity Synchronizer Tooling | CLI developer tool (`pnpm i18n:sync`) verifying parity and sorting between `id.po` and `en.po` catalogs | M3 | Survey 1, Survey 2, Survey 3 |
| 23 | Next-Gen Spotlight Command Palette | Universal keyboard-driven command palette supporting navigation, search, theme toggling, and deep links | M3 | Survey 1, Survey 2, Survey 3 |
| 24 | Studio Multi-Format Exporter | High-fidelity export engine producing print-ready mushaf PDFs, Markdown with frontmatter, and JSON | M3 | Survey 1, Survey 2, Survey 3 |
| 25 | Resilient Offline PWA & Service Worker | Service Worker cache architecture ensuring core mushaf and bookmarks remain readable without internet | M3 | Survey 1, Survey 2, Survey 3 |
| 26 | Modular Movement Componentization | Deconstruction of monolithic 844-line `apps/web/src/app/page.tsx` into 5 focused sub-movement modules (<150 lines each) | M3 | Survey 1, Survey 2, Survey 3 |
| 27 | Zero-Warning Strict Typing Hardening | Remediation of remaining linter warnings (`max-lines`, nested callbacks, explicit `this: void` callbacks) | M3 | Survey 1, Survey 2, Survey 3 |
| 28 | Web Bundle Budget Hardening | Dynamic code-splitting of dialogs, visualizers, and heavy icons to keep main route first-load JS < 140 kB | M3 | Survey 1, Survey 2, Survey 3 |
| 29 | Autonomous Workflow State Machine Testing | Rigorous automated testing of workflow state transitions ensuring zero lockdown bypass or self-approval | M3 | Survey 1, Survey 2, Survey 3 |
| 30 | Comprehensive E2E Playwright Suite | Automated multi-breakpoint visual regression and critical user journey tests (Mobile, Tablet, Desktop, 4K) | M3 | Survey 1, Survey 2, Survey 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Survey & Architecture Mapping | Survey target plan artifact, QlOrm backend, and moonClient/@moonwitness/ui contracts | none | DONE |
| M1 | Domain A & B Specifications | Deep technical specifications for Tracks 01-05 (Sacred Corpus) & Tracks 06-10 (Cognitive AI) | M0 | DONE (2,298 lines in draft_domains_ab.md) |
| M2 | Domain C & D Specifications | Deep technical specifications for Tracks 11-15 (Spatial HUD) & Tracks 16-20 (Harbor Community) | M0 | DONE (2,486 lines in draft_domains_cd.md) |
| M3 | Domain E & F Specifications | Deep technical specifications for Tracks 21-25 (Command Deck) & Tracks 26-30 (Engineering Excellence) | M0 | DONE (1,200+ lines in draft_domains_ef.md) |
| M4 | Artifact Integration & Synthesis | Integrate M1, M2, M3 drafts into master artifact `plan_30_grand_strategic_tracks.md`, complete Section 3 batch roadmap (Batches 1-6) and Section 4 decision gates | M1, M2, M3 | DONE (7,659 lines in plan_30_grand_strategic_tracks.md) |
| M5 | Multi-Perspective Verification & Audit | 2 Reviewers, 2 Challengers, and 1 Forensic Auditor gate check for integrity, compliance, and completeness | M4 | DONE (Auditor 3 verdict: CLEAN; Gate Result: PASS) |

## Interface Contracts
### Standard Technical Specification Structure (Per Track)
Each of the 30 tracks must strictly contain the 7 standardized sections:
1. **System Architecture & Interaction Flow**: Data flow, state transitions, runtime sequence.
2. **Concrete TypeScript Component Interfaces / Signatures**: Explicit exported props, handler signatures, return types.
3. **QlOrm Model Declarations & Field Constraints**: Strict adherence to `packages/ql_*` conventions (`QlModelDefinition`, field types `char` | `text` | `integer` | `boolean` | `datetime`, `ownerField`, `private: true`, deny-by-default ACL rules, seed records with stable IDs via `ir.model.data`). Strictly NO Drizzle ORM.
4. **API Contracts & DTOs**: Frozen path in `apiRoutes`, Request DTO, Response DTO, typed `MoonClient` method signature in `@moonwitness/moonclient`.
5. **UI / UX & Anti-Slop Specifications**: Composite component mapping in `@moonwitness/ui`, semantic tokens from `tokens.css`, state classes (`.is-*`), copy props for `ql_i18n` catalogs (`id.po` / `en.po`), Anti-Slop Dials (ENERGY, RHYTHM, MOTION), Purpose Justifications, UI States (Empty, Loading, Error, Success), WCAG 2.2 AA accessibility requirements.
6. **Phased Implementation Roadmap**: Phased breakdown (Phase 1: Foundation, Phase 2: Core Experience, Phase 3: Hardening) with explicit milestone milestones.
7. **Verification Rubrics & Acceptance Criteria**: Automated test commands, mathematical/integrity invariants, exit criteria.

### Section 3 Phased Execution Strategy Requirement
Must integrate all 30 tracks across 6 sequential execution batches:
- Batch 1: Foundations & Sacred Anchor (Tracks 26, 01, 02, 23, 27)
- Batch 2: Truth Provenance & Audio Resonance (Tracks 04, 05, 08, 09, 22)
- Batch 3: Cognitive Intelligence & Failover (Tracks 06, 07, 10, 03)
- Batch 4: Spatial Immersion & Atmosphere (Tracks 11, 12, 13, 14, 15)
- Batch 5: Harbor Governance & Peer Review (Tracks 16, 17, 18, 19, 20)
- Batch 6: Mission Command & Engineering Hardening (Tracks 21, 24, 25, 28, 29, 30)

## Code Layout
- Target Plan Artifact: `C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md`
- Working Directory M1: `.agents/teamwork/worker_m1/` -> output: `draft_domains_ab.md`
- Working Directory M2: `.agents/teamwork/worker_m2/` -> output: `draft_domains_cd.md`
- Working Directory M3: `.agents/teamwork/worker_m3/` -> output: `draft_domains_ef.md`
- Working Directory M4: `.agents/teamwork/worker_m4_integrator/` -> updates target plan artifact directly
- Reviewers: `.agents/teamwork/reviewer_1/`, `.agents/teamwork/reviewer_2/`
- Challengers: `.agents/teamwork/challenger_1/`, `.agents/teamwork/challenger_2/`
- Forensic Auditor: `.agents/teamwork/auditor_1/`
