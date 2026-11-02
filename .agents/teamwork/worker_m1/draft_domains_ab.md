# Master Technical Specification: Domains A & B (Tracks 01 – 10)

> **Document Scope**: Grand Strategic Tracks 01 to 10 covering Group A (Sacred Corpus, Research & Truth Provenance) and Group B (Cognitive AI & Grounded Reasoning Engine).  
> **Target Master Artifact Integration**: `C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md`  
> **Architectural Governance**: Strictly compliant with `AGENTS.md`, `MW-ADR-020`, QlOrm (`packages/ql_*`), `@moonwitness/moonclient`, `@moonwitness/ui` token architecture, and Anti-Slop Design Guidelines.

---

## Table of Contents
- [Group A: Sacred Corpus, Research & Truth Provenance](#group-a-sacred-corpus-research--truth-provenance)
  - [Track 01: Mushaf Typography & Diacritics Engine](#track-01-mushaf-typography--diacritics-engine)
  - [Track 02: Dual-Stream Hermeneutic Reader](#track-02-dual-stream-hermeneutic-reader)
  - [Track 03: Semantic Cross-Surah Knowledge Graph](#track-03-semantic-cross-surah-knowledge-graph)
  - [Track 04: Verifiable Ayah Cryptographic Proofs & Attribution Stamp](#track-04-verifiable-ayah-cryptographic-proofs--attribution-stamp)
  - [Track 05: Audio Tilawah Spatial Resonance](#track-05-audio-tilawah-spatial-resonance)
- [Group B: Cognitive AI & Grounded Reasoning Engine](#group-b-cognitive-ai--grounded-reasoning-engine)
  - [Track 06: Hallucination-Shielded Grounded Chat](#track-06-hallucination-shielded-grounded-chat)
  - [Track 07: Multi-Provider Failover Mesh](#track-07-multi-provider-failover-mesh)
  - [Track 08: Lexical Morphology Search & Root Word Indexer](#track-08-lexical-morphology-search--root-word-indexer)
  - [Track 09: Quranic Morphological Visualizer](#track-09-quranic-morphological-visualizer)
  - [Track 10: Local-First Private AI Inference Mode](#track-10-local-first-private-ai-inference-mode)

---

# Group A: Sacred Corpus, Research & Truth Provenance

---

## Track 01: Mushaf Typography & Diacritics Engine

### 1. System Architecture & Interaction Flow
The Mushaf Typography & Diacritics Engine delivers pixel-perfect, high-resolution rendering of Sacred Uthmanic and Madinah script. The system architecture decouples typography layout calculation from DOM rendering to eliminate Cumulative Layout Shift (CLS):
1. **Font Asset Pipeline**: WOFF2 font subsets for the King Fahd Complex (KFGQPC Uthmanic Hafs) and Amiri Quran fonts are loaded through Next.js `next/font/local` with fallback metric overrides (`ascent-override: 125%`, `descent-override: 45%`, `size-adjust: 100%`) ensuring identical line-box bounding boxes during font swap.
2. **Glyph Segmentation Pipeline**: When a passage is requested, raw Arabic Unicode text is normalized into discrete tokens: base letters, combining harakat (fathah, dammah, kasrah, sukun, shaddah), waqaf stop symbols (`ۖ`, `ۗ`, `ۘ`, `ۙ`, `ۚ`, `ۛ`), and ayah end medallions (`۝`).
3. **RTL Formatting Context**: An explicit CSS containment boundary (`direction: rtl; unicode-bidi: isolate; text-rendering: geometricPrecision`) ensures diacritics stack vertically without glyph collision across 100% to 200% font scaling.
4. **Dynamic Scaling Controller**: An interactive scale slider in the UI updates an isolated CSS custom variable `--mushaf-font-scale` without triggering document-level style re-computations.

```
[Corpus Passage Data] ──► [Glyph Parser & Waqaf Normalizer]
                                   │
                                   ▼
[Font Metrics Pre-calc] ──► [QuranText Atom (RTL Isolate)] ──► [Zero-CLS Mushaf Canvas]
                                   ▲
                                   │
                     [Scale Controller Token]
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
import type { CSSProperties, ReactNode } from "react";

export type MushafScriptStyle = "uthmani_hafs" | "indopak" | "madinah_classic";
export type MushafScaleLevel = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface WaqafPositionToken {
  characterIndex: number;
  symbol: string;
  name: "lazim" | "mutlaq" | "jaiz" | "mujawwaz" | "murakhkhas" | "qif" | "saktah";
  prohibited: boolean;
}

export interface QuranTextProps {
  /** Revelation verbatim Arabic text string */
  text: string;
  /** Surah number (1 - 114) */
  surah: number;
  /** Ayah number within the surah */
  ayah: number;
  /** Script style variant */
  script?: MushafScriptStyle;
  /** Scale sizing token */
  scale?: MushafScaleLevel;
  /** Whether to format waqaf signs as distinct colored glyph spans */
  highlightWaqaf?: boolean;
  /** Show decorative ayah end marker medallion containing verse number */
  showEndMarker?: boolean;
  /** Callback when user selects or highlights a word token */
  onWordClick?: (wordIndex: number, text: string) => void;
  /** Optional class override adhering to @moonwitness/ui conventions */
  className?: string;
  /** Accessibility label for screen readers */
  ariaLabel?: string;
}

export interface AyahEndMarkerProps {
  ayahNumber: number;
  className?: string;
}

export interface WaqafSignProps {
  token: WaqafPositionToken;
  className?: string;
}
```

### 3. QlOrm Model Declarations & Field Constraints
The typography configuration and waqaf rules are governed by `ql_corpus` under the `corpus` domain:

```typescript
import type { QlModelDefinition } from "ql_orm";

export const corpusFontManifest: QlModelDefinition = {
  name: "corpus.font_manifest",
  labelKey: "web.models.entities.corpus_font_manifest",
  description: "Cryptographically verified font bundle manifest for sacred Arabic typography.",
  descriptionKey: "web.models.descriptions.corpus_font_manifest",
  tableName: "corpus_font_manifest",
  fields: {
    code: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 64,
    },
    display_name: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    script_family: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ["uthmani_hafs", "indopak", "madinah_classic"],
    },
    woff2_url: {
      type: "char",
      required: true,
      maxLength: 512,
    },
    checksum_sha256: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    ascent_ratio: {
      type: "integer",
      required: true,
      default: 125,
      minValue: 50,
      maxValue: 250,
    },
    descent_ratio: {
      type: "integer",
      required: true,
      default: 45,
      minValue: 10,
      maxValue: 150,
    },
    is_active: {
      type: "boolean",
      required: true,
      default: true,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};

export const corpusWaqafRule: QlModelDefinition = {
  name: "corpus.waqaf_rule",
  labelKey: "web.models.entities.corpus_waqaf_rule",
  description: "Rules and syntactic classifications for Quranic waqaf (cessation) symbols.",
  descriptionKey: "web.models.descriptions.corpus_waqaf_rule",
  tableName: "corpus_waqaf_rule",
  fields: {
    symbol_char: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 8,
    },
    rule_code: {
      type: "char",
      required: true,
      maxLength: 32,
    },
    name_translit: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    description_id: {
      type: "char",
      required: true,
      maxLength: 255,
    },
    description_en: {
      type: "char",
      required: true,
      maxLength: 255,
    },
    color_token: {
      type: "char",
      required: true,
      maxLength: 32,
      default: "text-acid",
    },
    is_mandatory_stop: {
      type: "boolean",
      required: true,
      default: false,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_corpus/__manifest__.ts`)**:
```typescript
{
  model: "corpus.font_manifest",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
},
{
  model: "corpus.font_manifest",
  group: "admin",
  read: true,
  write: true,
  create: true,
  unlink: false,
},
{
  model: "corpus.waqaf_rule",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
}
```

### 4. API Contracts & DTOs
**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface FontManifestItemDto {
  code: string;
  displayName: string;
  scriptFamily: string;
  woff2Url: string;
  checksumSha256: string;
  ascentRatio: number;
  descentRatio: number;
  isActive: boolean;
}

export interface FontManifestListResponseDto {
  items: FontManifestItemDto[];
  total: number;
}

export interface WaqafRuleItemDto {
  symbolChar: string;
  ruleCode: string;
  nameTranslit: string;
  description: {
    id: string;
    en: string;
  };
  colorToken: string;
  isMandatoryStop: boolean;
}

export interface WaqafRuleListResponseDto {
  rules: WaqafRuleItemDto[];
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  corpusTypography: {
    fonts: "/corpus/typography/fonts",
    fontByCode: (code: string) => `/corpus/typography/fonts/${segment(code)}`,
    waqafRules: "/corpus/typography/waqaf-rules",
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  getTypographyFonts(): Promise<FontManifestListResponseDto> {
    return this.request(apiRoutes.corpusTypography.fonts, "GET");
  }

  getWaqafRules(): Promise<WaqafRuleListResponseDto> {
    return this.request(apiRoutes.corpusTypography.waqafRules, "GET");
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 1 (Calm, sacred contemplation), RHYTHM: 2 (Even baseline text flow), MOTION: 1 (Static, motionless sacred text).
- **Technique Purpose**: Vertical diacritic balancing prevents visual clipping in high-density Arabic verses. Gold accent (`--color-acid`) is applied exclusively to waqaf symbols and verse end medallions to guide eye cadence without clutter.
- **Tokens & CSS**:
  - Container: `.ql-quran-text` (`font-family: var(--font-arabic-uthmani); direction: rtl; text-align: justify; text-justify: kashida; line-height: 2.7;`)
  - Scaling tiers: `sm` (1.5rem), `md` (2.0rem), `lg` (2.5rem), `xl` (3.0rem), `2xl` (3.75rem), `3xl` (4.5rem).
  - Waqaf Sign: `.ql-waqaf-sign` (`color: var(--color-acid); font-size: 0.65em; vertical-align: super; padding: 0 0.15em;`)
  - End Marker: `.ql-ayah-marker` (`display: inline-flex; align-items: center; justify-content: center; width: 1.8em; height: 1.8em; border: 1px solid var(--color-hairline-strong); border-radius: 9999px; margin: 0 0.4em; font-family: var(--font-mono); font-size: 0.55em; color: var(--color-acid);`)
- **State Handling**:
  - Loading: Skeleton text line with pre-computed height matching selected scale tier.
  - Error: Graceful fallback font cascade (`KFGQPC Uthmanic` -> `Amiri Quran` -> `Scheherazade New` -> `serif`).
- **Accessibility**: Bidi isolation via `<bdi>` tag; screen readers announce normalized text without reading raw waqaf Unicode points; full contrast >= 7:1 against `--color-panel-deep` (dark: `#0a0c24`, light: `#f3ecda`).

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: WOFF2 font optimization, metric override declarations in `packages/ui/styles/tokens.css`, unit tests for glyph segmentation parser.
- **Phase 2 (Core Experience)**: Construction of `QuranText` and `AyahEndMarker` components in `@moonwitness/ui/src/atoms/`, scale tier state persistence in local preferences.
- **Phase 3 (Hardening)**: Automated visual regression tests across Chrome, Firefox, Safari on Windows and macOS verifying 0.000 CLS during font loading.

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter @moonwitness/ui test -- tests/quran-text.test.tsx`
- **Invariants**:
  1. CLS metric must be exactly `0.000` when font swaps from system fallback to downloaded WOFF2.
  2. Bounding rect height for 2:255 (Ayat al-Kursi) must remain deterministic (+/- 1px) across 10 consecutive renders.
  3. No raw Tailwind palette classes (`slate`, `zinc`, etc.) in generated HTML output.

---

## Track 02: Dual-Stream Hermeneutic Reader

### 1. System Architecture & Interaction Flow
The Dual-Stream Hermeneutic Reader provides a simultaneous, synchronized reading experience that pairs verbatim Arabic scripture (`authority: "revelation_verbatim"`) with authoritative translations (`authority: "translation"`).
1. **Edition Resolution**: The reader fetches passage locators for both editions from `ql_corpus` through `moonClient.readDualStreamSurah()`.
2. **Synchronized Layout Engine**: The viewport is partitioned into a 2-column grid (`grid-cols-1 lg:grid-cols-2`). The left column renders translations with LTR reading direction; the right column renders Arabic verbatim with RTL reading direction.
3. **Lockstep Scroll State Machine**:
   - Each verse row is bound to a shared `data-ayah-index` attribute.
   - An `IntersectionObserver` with root margin `-20% 0px -70% 0px` tracks the currently centered verse in the viewport.
   - When the user scrolls either pane, the inactive pane executes an aligned smooth scroll to match the active verse index.
   - An intuitive lock/unlock button (`ScrollLockToggle`) allows users to detach panes for independent reading.
4. **Keyboard Navigation**: Global hotkeys `j` (next verse), `k` (previous verse), and `Space` (toggle play/pause for tilawah audio) adjust active verse selection with automatic smooth centering.

```
[User Scroll / Hotkey (j/k)]
            │
            ▼
[Synchronized Scroll State Machine]
            │
      ┌─────┴────────────────┐
      ▼                      ▼
[Pane 1: LTR Translation]  [Pane 2: RTL Arabic Verbatim]
      │                      │
      └──────► [Active Verse Anchor Highlight] ◄──────┘
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
import type { ReactNode } from "react";

export interface DualStreamVersePair {
  surahNumber: number;
  ayahNumber: number;
  verbatimText: string;
  translationText: string;
  footnoteRefs?: Array<{ id: string; marker: string; text: string }>;
  authorityLevel: "revelation_verbatim" | "translation";
}

export interface DualStreamReaderProps {
  surahNumber: number;
  arabicEditionKey: string;
  translationEditionKey: string;
  activeAyah?: number;
  isScrollLocked?: boolean;
  onAyahSelect?: (ayahNumber: number) => void;
  onScrollLockChange?: (locked: boolean) => void;
  className?: string;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
}

export interface ReaderPaneProps {
  side: "verbatim" | "translation";
  verses: DualStreamVersePair[];
  activeAyah: number;
  onVerseVisible: (ayahNumber: number) => void;
  onVerseClick: (ayahNumber: number) => void;
  className?: string;
}

export interface ScrollLockToggleProps {
  isLocked: boolean;
  onToggle: () => void;
  ariaLabel?: string;
}
```

### 3. QlOrm Model Declarations & Field Constraints
```typescript
import type { QlModelDefinition } from "ql_orm";

export const corpusAlignmentPair: QlModelDefinition = {
  name: "corpus.alignment_pair",
  labelKey: "web.models.entities.corpus_alignment_pair",
  description: "Synchronized alignment mapping between scripture editions.",
  descriptionKey: "web.models.descriptions.corpus_alignment_pair",
  tableName: "corpus_alignment_pair",
  fields: {
    source_passage_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    target_passage_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    surah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 114,
    },
    ayah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 286,
    },
    alignment_type: {
      type: "char",
      required: true,
      maxLength: 32,
      default: "one_to_one",
      options: ["one_to_one", "one_to_many", "many_to_one"],
    },
    notes: {
      type: "char",
      required: false,
      maxLength: 500,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_corpus/__manifest__.ts`)**:
```typescript
{
  model: "corpus.alignment_pair",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
},
{
  model: "corpus.alignment_pair",
  group: "admin",
  read: true,
  write: true,
  create: true,
  unlink: false,
}
```

### 4. API Contracts & DTOs
**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface DualStreamVerseDto {
  surah: number;
  ayah: number;
  verbatimArabic: string;
  translatedText: string;
  translatorAttribution: string;
  editionCodeArabic: string;
  editionCodeTranslation: string;
}

export interface DualStreamSurahResponseDto {
  surahNumber: number;
  surahNameArabic: string;
  surahNameTranslated: string;
  totalVerses: number;
  verses: DualStreamVerseDto[];
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  corpusReader: {
    dualStream: (arabicKey: string, transKey: string, surah: number) =>
      `/corpus/reader/dual-stream/${segment(arabicKey)}/${segment(transKey)}/surah/${segment(String(surah))}`,
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  readDualStreamSurah(
    arabicEditionKey: string,
    translationEditionKey: string,
    surahNumber: number,
  ): Promise<DualStreamSurahResponseDto> {
    return this.request(
      apiRoutes.corpusReader.dualStream(arabicEditionKey, translationEditionKey, surahNumber),
      "GET",
    );
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 1, RHYTHM: 3 (Strict parallel alignment), MOTION: 1 (Gentle 150ms ease-out scroll interpolation).
- **Technique Purpose**: Grid layout places sacred Arabic on the right and translation on the left without clutter. Active verse highlighting utilizes subtle hairline borders (`--color-hairline-strong`) rather than garish full-card background fills.
- **Tokens & CSS**:
  - Container: `.ql-dual-stream-reader` (`display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-6);`)
  - Active Row: `.ql-reader-row.is-active` (`border-left: 2px solid var(--color-acid); background-color: var(--color-panel-raised);`)
  - Mobile Reflow: Under 1024px (`@media (max-width: 1023px)`), panes collapse into stacked tabbed mode (`Arabic` / `Translation` / `Combined Stack`) to prevent cramped text lines.
- **States**:
  - Empty: Standard `@moonwitness/ui` `EmptyState` when translation edition is unavailable.
  - Loading: Synchronized dual-column skeleton loader matching verse count.
  - Error: Inline warning message with retry button via `Button`.
- **Accessibility**: ARIA live region announces active verse change during keyboard traversal; panes support independent focus outlines via `:focus-visible`.

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: Dual-stream data fetcher in `packages/moonclient`, `corpus.alignment_pair` model synchronization.
- **Phase 2 (Core Experience)**: `DualStreamReader` composite in `apps/web/src/features/corpus`, synchronized scroll hook with mobile tabbed fallback.
- **Phase 3 (Hardening)**: Automated keyboard navigation tests, scroll performance benchmarks ensuring 60 FPS scrolling on mobile browsers.

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter web test -- tests/dual-stream-reader.test.tsx`
- **Invariants**:
  1. Pressing `j` key increments `activeAyah` by 1 and positions target verse within 100px of viewport center.
  2. Scroll synchronization must maintain latency < 16ms without scroll stuttering or feedback loops.
  3. No raw form elements or unstyled internal links used.

---

## Track 03: Semantic Cross-Surah Knowledge Graph

### 1. System Architecture & Interaction Flow
The Semantic Cross-Surah Knowledge Graph models thematic connections across revelation, linking conceptual motifs (e.g. Divine Justice, Musa AS narrative arcs, Covenant obligations) across different surahs.
1. **Graph Query Pipeline**: User queries a concept token (e.g. `musa_pharaoh` or `nur_light`). The API queries `search.semantic_edge` and `search.thematic_node` to construct an adjacency graph.
2. **Lightweight Force Layout Simulation**:
   - To strictly avoid introducing heavy graph bundles (such as 500 kB D3 libraries) which violate the 150 kB bundle budget, layout positions are computed via a lightweight Web Worker simulation (`<12 kB` compiled) executing Verlet integration.
   - Node positions are calculated off the main thread and transferred via `Float32Array` buffers.
3. **Pure SVG Rendering Engine**: The client renders nodes and connecting quadratic bezier curves into an interactive SVG canvas. Nodes represent surahs and thematic hubs; edge thickness indicates passage frequency.
4. **Accessible Tabular Alternative**: For keyboard-only users and screen readers, an accessible structured data table (`<table role="table">`) is rendered alongside, allowing direct navigation to connected passages.

```
[User Concept Selection] ──► [moonClient.getSemanticGraph()]
                                       │
                                       ▼
                  [Web Worker Physics Simulation (<12 kB)]
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
            [Pure SVG Canvas View]      [Accessible Tabular View]
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
export interface ThematicGraphNode {
  id: string;
  label: string;
  category: "concept" | "surah" | "prophet_narrative" | "legal_ruling";
  surahNumber?: number;
  weight: number;
  x: number;
  y: number;
}

export interface ThematicGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: "chronological" | "thematic_echo" | "contrast" | "elaboration";
  weight: number;
  evidencePassages: Array<{ surah: number; ayah: number }>;
}

export interface SemanticCrossSurahGraphProps {
  initialConceptId?: string;
  activeSurahFilter?: number;
  onNodeClick?: (node: ThematicGraphNode) => void;
  onEdgeClick?: (edge: ThematicGraphEdge) => void;
  viewMode?: "graph" | "table";
  onViewModeChange?: (mode: "graph" | "table") => void;
  className?: string;
}

export interface GraphDetailDrawerProps {
  selectedNode: ThematicGraphNode | null;
  onClose: () => void;
  onNavigateToPassage: (surah: number, ayah: number) => void;
}
```

### 3. QlOrm Model Declarations & Field Constraints
Governed under `ql_search`:

```typescript
import type { QlModelDefinition } from "ql_orm";

export const searchThematicNode: QlModelDefinition = {
  name: "search.thematic_node",
  labelKey: "web.models.entities.search_thematic_node",
  description: "Knowledge graph entity node representing themes, figures, and concepts.",
  descriptionKey: "web.models.descriptions.search_thematic_node",
  tableName: "search_thematic_node",
  fields: {
    slug: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 64,
    },
    title_id: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    title_en: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    category: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ["concept", "surah", "prophet_narrative", "legal_ruling"],
    },
    passage_count: {
      type: "integer",
      required: true,
      default: 0,
      minValue: 0,
      maxValue: 10000,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};

export const searchSemanticEdge: QlModelDefinition = {
  name: "search.semantic_edge",
  labelKey: "web.models.entities.search_semantic_edge",
  description: "Cross-surah semantic edge linking thematic nodes with passage evidence.",
  descriptionKey: "web.models.descriptions.search_semantic_edge",
  tableName: "search_semantic_edge",
  fields: {
    source_node_slug: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    target_node_slug: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    relation_type: {
      type: "char",
      required: true,
      maxLength: 32,
      options: ["chronological", "thematic_echo", "contrast", "elaboration"],
    },
    weight: {
      type: "integer",
      required: true,
      default: 1,
      minValue: 1,
      maxValue: 100,
    },
    evidence_payload: {
      type: "text",
      required: true,
      maxLength: 4000,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_search/__manifest__.ts`)**:
```typescript
{
  model: "search.thematic_node",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
},
{
  model: "search.semantic_edge",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
}
```

### 4. API Contracts & DTOs
**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface SemanticGraphNodeDto {
  id: string;
  slug: string;
  title: string;
  category: "concept" | "surah" | "prophet_narrative" | "legal_ruling";
  passageCount: number;
}

export interface SemanticGraphEdgeDto {
  id: string;
  sourceSlug: string;
  targetSlug: string;
  relationType: "chronological" | "thematic_echo" | "contrast" | "elaboration";
  weight: number;
  evidencePassages: Array<{ surah: number; ayah: number }>;
}

export interface SemanticGraphResponseDto {
  conceptSlug: string;
  nodes: SemanticGraphNodeDto[];
  edges: SemanticGraphEdgeDto[];
  totalEdges: number;
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  searchGraph: {
    byConcept: (slug: string) => `/search/graph/concepts/${segment(slug)}`,
    allConcepts: "/search/graph/concepts",
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  getSemanticGraph(conceptSlug: string): Promise<SemanticGraphResponseDto> {
    return this.request(apiRoutes.searchGraph.byConcept(conceptSlug), "GET");
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 2 (Analytical engagement), RHYTHM: 2 (Harmonic orbital distribution), MOTION: 2 (Gentle spring physics stabilization under 800ms).
- **Technique Purpose**: SVG canvas allows vector scaling up to 4K displays without blurring. Curve edges use subtle gradients between node states without decorative neon glows.
- **Tokens & CSS**:
  - Canvas: `.ql-semantic-graph` (`width: 100%; height: 600px; background: var(--color-panel-deep); border: 1px solid var(--color-hairline); border-radius: var(--radius-lg);`)
  - Nodes: `.ql-graph-node` (`fill: var(--color-panel-raised); stroke: var(--color-hairline-strong); stroke-width: 1.5; cursor: pointer; transition: all 150ms ease;`)
  - Active Node: `.ql-graph-node.is-active` (`stroke: var(--color-acid); fill: var(--color-panel); filter: drop-shadow(0 0 8px var(--ql-glow-gold));`)
  - Edges: `.ql-graph-edge` (`stroke: var(--color-hairline); stroke-width: 1; fill: none; opacity: 0.7;`)
- **Accessibility**: Dual-view toggle (`SVG Graph` vs `Data Table`); table conforms to WCAG 2.2 AA table headers with caption and column scopes.

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: Schema definitions in `ql_search`, concept seed data insertion for primary Quranic themes (Musa narrative, Bani Israil, Creation, Akhirah).
- **Phase 2 (Core Experience)**: Web Worker force layout simulation, SVG component with pan/zoom controls in `apps/web/src/features/corpus/graph`.
- **Phase 3 (Hardening)**: Memory profiling for 500+ node graphs ensuring heap stability < 15 MB.

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter web test -- tests/semantic-graph.test.tsx`
- **Invariants**:
  1. Web Worker calculation must terminate and yield stable coordinates within 800ms for graphs <= 100 nodes.
  2. Total client JS footprint for graph renderer must not exceed 18 kB gzipped.
  3. Screen reader mode provides 100% equivalent passage links.

---

## Track 04: Verifiable Ayah Cryptographic Proofs & Attribution Stamp

### 1. System Architecture & Interaction Flow
The Verifiable Ayah Cryptographic Proofs system guarantees integrity and attribution for shared Quranic texts, preventing out-of-context truncations or malicious misquotes:
1. **Selection & Canonical Normalization**: When a user selects and copies an ayah in the web reader, the client intercepts the copy event and extracts the authoritative passage record.
2. **Canonical Serialization & Hash Generation**:
   - The passage text is normalized into Unicode NFC format.
   - A deterministic canonical string is composed: `V1|edition:${editionCode}|surah:${surah}|ayah:${ayah}|text:${nfcText}`.
   - A SHA-256 digest is computed over this canonical representation.
3. **Attribution Seal Assembly**:
   - The clipboard receives formatted text accompanied by a human-readable attribution seal and an unalterable verification URI:
     ```
     "Dan Kami tidak mengutus engkau (Muhammad), melainkan kepada seluruh umat manusia..."
     [QS. Saba': 28 | Kemenag RI]
     MoonWitness Proof: https://moonwitness.com/verify/ayah/34/28?hash=7a9f4c2...
     ```
4. **Public Verification Route**: Navigating to `/verify/ayah/[surah]/[ayah]` validates the incoming SHA-256 against `corpus.passage.content_hash`. If a single character was altered or omitted, the verification badge emits `is-tampered` with an explicit diff alert.

```
[User Selects & Copies Ayah] ──► [Canonical NFC Serializer] ──► [SHA-256 Generator]
                                                                        │
                                                                        ▼
[Public Verification Route] ◄── [Verification URL & Proof Seal in Clipboard]
         │
   [Hash Comparison]
         ├── Match ────► [Verified Truth Seal (Green)]
         └── Mismatch ─► [Tampered / Modified Warning (Red)]
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
export interface AyahProofMetadata {
  surahNumber: number;
  ayahNumber: number;
  editionCode: string;
  editionName: string;
  sha256Hash: string;
  verificationUri: string;
  copiedAtIso: string;
}

export interface AyahProofCardProps {
  surahNumber: number;
  ayahNumber: number;
  text: string;
  editionCode: string;
  proofHash: string;
  isVerified?: boolean;
  onCopyProof?: (metadata: AyahProofMetadata) => void;
  className?: string;
}

export interface ProofVerificationResultProps {
  status: "verified" | "tampered" | "edition_mismatch" | "not_found";
  expectedHash: string;
  providedHash: string;
  canonicalText: string;
  submittedText?: string;
  surahNumber: number;
  ayahNumber: number;
  className?: string;
}
```

### 3. QlOrm Model Declarations & Field Constraints
Extending `ql_corpus` and `ql_source`:

```typescript
import type { QlModelDefinition } from "ql_orm";

export const corpusAyahProof: QlModelDefinition = {
  name: "corpus.ayah_proof",
  labelKey: "web.models.entities.corpus_ayah_proof",
  description: "Cryptographic proof record anchoring immutable passage content hashes.",
  descriptionKey: "web.models.descriptions.corpus_ayah_proof",
  tableName: "corpus_ayah_proof",
  fields: {
    passage_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    surah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 114,
    },
    ayah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 286,
    },
    edition_code: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    content_hash_sha256: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 64,
    },
    canonical_payload: {
      type: "text",
      required: true,
      maxLength: 8000,
    },
    verification_count: {
      type: "integer",
      required: true,
      default: 0,
      minValue: 0,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_corpus/__manifest__.ts`)**:
```typescript
{
  model: "corpus.ayah_proof",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
},
{
  model: "corpus.ayah_proof",
  group: "operator",
  read: true,
  write: true,
  create: true,
  unlink: false,
}
```

### 4. API Contracts & DTOs
**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface VerifyAyahProofRequestDto {
  surahNumber: number;
  ayahNumber: number;
  editionCode: string;
  claimedHash: string;
  claimedText?: string;
}

export interface VerifyAyahProofResponseDto {
  status: "verified" | "tampered" | "edition_mismatch" | "not_found";
  isValid: boolean;
  surahNumber: number;
  ayahNumber: number;
  canonicalText: string;
  authoritativeHash: string;
  editionTitle: string;
  diffExplanation?: string;
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  corpusProofs: {
    verify: "/corpus/proofs/verify",
    getProof: (edition: string, surah: number, ayah: number) =>
      `/corpus/proofs/${segment(edition)}/${segment(String(surah))}/${segment(String(ayah))}`,
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  verifyAyahProof(
    payload: VerifyAyahProofRequestDto,
  ): Promise<VerifyAyahProofResponseDto> {
    return this.request(apiRoutes.corpusProofs.verify, "POST", payload);
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 1, RHYTHM: 1, MOTION: 1.
- **Technique Purpose**: Verification stamp provides digital authenticity without marketing bravado. Green verified checkmark (`--color-success`) signals integrity; red tampered banner (`--color-danger`) gives immediate notice if characters were omitted or injected.
- **Tokens & CSS**:
  - Proof Badge: `.ql-proof-badge` (`display: inline-flex; align-items: center; gap: var(--spacing-2); padding: 0.25rem 0.625rem; font-family: var(--font-mono); font-size: 0.75rem; border: 1px solid var(--color-hairline); border-radius: var(--radius-sm);`)
  - Status Valid: `.ql-proof-badge.is-valid` (`border-color: var(--color-success); color: var(--color-success); background: rgba(110, 231, 183, 0.05);`)
  - Status Tampered: `.ql-proof-badge.is-tampered` (`border-color: var(--color-danger); color: var(--color-danger); background: rgba(255, 138, 128, 0.05);`)
- **Copy**: Supported in both `id` and `en` catalog:
  - `id`: `"Bukti Keaslian Ayat Terverifikasi"` / `"PERINGATAN: Teks kutipan telah diubah dari mushaf kanonis."`
  - `en`: `"Ayah Authenticity Proof Verified"` / `"WARNING: Citation text has been modified from canonical mushaf."`
- **Accessibility**: ARIA alert role (`role="alert"`) on tampered notification; clear copy-to-clipboard button with visible focus indicator.

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: Canonical NFC serialization utility in `@moonwitness/types`, hash calculation integration into `ql_corpus` sync.
- **Phase 2 (Core Experience)**: Copy event enhancer in web reader, `/verify/ayah/[surah]/[ayah]` public validation route.
- **Phase 3 (Hardening)**: Fuzz testing checking 6,236 ayat against known Quranic SHA-256 integrity tables.

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter ql_corpus test -- models/corpus_passage.test.ts`
- **Invariants**:
  1. Normalization must be idempotent: `serialize(normalize(text)) === serialize(text)`.
  2. Single character alteration (e.g. changing fatha to damma) must change the SHA-256 digest and cause `isValid === false`.
  3. No private API keys or unencrypted identifiers exposed in verification URL.

---

## Track 05: Audio Tilawah Spatial Resonance

### 1. System Architecture & Interaction Flow
The Audio Tilawah Spatial Resonance engine delivers high-fidelity Quranic recitation playback with whispering audio waveform synchronization:
1. **Audio Segment Mapping**: Audio manifests contain millisecond timestamps (`start_ms`, `end_ms`) for each ayah by verified reciters (e.g. Sheikh Mahmoud Khalil Al-Husary, Sheikh Mishary Rashid Alafasy).
2. **Web Audio Playback Pipeline**:
   - An HTML5 `Audio` element streams recitations from verified, rights-cleared CDNs.
   - A `Web Audio API` `AudioContext` connects an `AnalyserNode` (`fftSize: 64`, `smoothingTimeConstant: 0.85`) to capture real-time frequency amplitude.
3. **Minimalist Whispering Waveform Canvas**:
   - An isolated HTML5 canvas renders 12 vertical bars reflecting frequency resonance.
   - Colors transition smoothly across `--color-hairline-strong` to `--color-acid` without harsh pulsing or strobing.
4. **Auto-Scroll & Active Highlighting**:
   - The playback timeupdate event fires every 100ms.
   - The player checks the active ayah range and highlights the corresponding verse in the reader pane with smooth scroll alignment.

```
[Audio Stream Source] ──► [HTML5 Audio Player] ──► [AnalyserNode (Web Audio API)]
                                  │                             │
                                  ▼                             ▼
                    [Timestamp Sync Engine]          [12-Bar Whispering Waveform]
                                  │
                                  ▼
                    [Auto-scroll Verse in Reader]
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
export interface AudioTimestampSegment {
  surahNumber: number;
  ayahNumber: number;
  startMs: number;
  endMs: number;
}

export interface ReciterProfile {
  id: string;
  nameTranslit: string;
  nameArabic: string;
  style: "murattal" | "mujawwad" | "tahfeedh";
  bitrateKbps: number;
  licenseAttribution: string;
}

export interface AudioTilawahPlayerProps {
  surahNumber: number;
  activeAyahNumber: number;
  reciterId: string;
  isPlaying?: boolean;
  autoScroll?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onAyahChange?: (ayahNumber: number) => void;
  onReciterChange?: (reciterId: string) => void;
  className?: string;
}

export interface WhisperingWaveformProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  barCount?: number;
  heightPx?: number;
  className?: string;
}
```

### 3. QlOrm Model Declarations & Field Constraints
Extending `ql_corpus`:

```typescript
import type { QlModelDefinition } from "ql_orm";

export const corpusReciter: QlModelDefinition = {
  name: "corpus.reciter",
  labelKey: "web.models.entities.corpus_reciter",
  description: "Verified Quranic reciter metadata and rights certification.",
  descriptionKey: "web.models.descriptions.corpus_reciter",
  tableName: "corpus_reciter",
  fields: {
    slug: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 64,
    },
    name_translit: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    name_arabic: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    recitation_style: {
      type: "char",
      required: true,
      maxLength: 32,
      default: "murattal",
      options: ["murattal", "mujawwad", "tahfeedh"],
    },
    audio_base_url: {
      type: "char",
      required: true,
      maxLength: 512,
    },
    license_type: {
      type: "char",
      required: true,
      maxLength: 64,
      default: "public_domain",
    },
    is_active: {
      type: "boolean",
      required: true,
      default: true,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};

export const corpusAudioSegment: QlModelDefinition = {
  name: "corpus.audio_segment",
  labelKey: "web.models.entities.corpus_audio_segment",
  description: "Millisecond timestamp boundaries for ayah audio synchronization.",
  descriptionKey: "web.models.descriptions.corpus_audio_segment",
  tableName: "corpus_audio_segment",
  fields: {
    reciter_slug: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    surah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 114,
    },
    ayah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 286,
    },
    start_ms: {
      type: "integer",
      required: true,
      minValue: 0,
    },
    end_ms: {
      type: "integer",
      required: true,
      minValue: 0,
    },
    audio_file_url: {
      type: "char",
      required: true,
      maxLength: 512,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_corpus/__manifest__.ts`)**:
```typescript
{
  model: "corpus.reciter",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
},
{
  model: "corpus.audio_segment",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
}
```

### 4. API Contracts & DTOs
**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface ReciterListItemDto {
  id: string;
  slug: string;
  nameTranslit: string;
  nameArabic: string;
  style: string;
}

export interface SurahAudioManifestResponseDto {
  surahNumber: number;
  reciterSlug: string;
  audioStreamUrl: string;
  durationMs: number;
  segments: Array<{
    ayahNumber: number;
    startMs: number;
    endMs: number;
  }>;
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  corpusAudio: {
    reciters: "/corpus/audio/reciters",
    surahManifest: (reciter: string, surah: number) =>
      `/corpus/audio/manifest/${segment(reciter)}/surah/${segment(String(surah))}`,
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  getReciters(): Promise<ReciterListItemDto[]> {
    return this.request(apiRoutes.corpusAudio.reciters, "GET");
  }

  getSurahAudioManifest(
    reciterSlug: string,
    surahNumber: number,
  ): Promise<SurahAudioManifestResponseDto> {
    return this.request(
      apiRoutes.corpusAudio.surahManifest(reciterSlug, surahNumber),
      "GET",
    );
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 2, RHYTHM: 2, MOTION: 2 (Fluid waveform bars).
- **Technique Purpose**: Whispering waveform gives visual confirmation of recitation playback without energetic club-style equalizer visuals. 12 slender bars in subdued warm gold (`--color-acid`) communicate reverence.
- **Tokens & CSS**:
  - Audio Bar: `.ql-audio-bar` (`display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: var(--color-panel-raised); border: 1px solid var(--color-hairline); border-radius: var(--radius-lg);`)
  - Waveform Canvas: `.ql-whispering-waveform` (`width: 96px; height: 28px; vertical-align: middle;`)
- **Autoplay Compliance**: Zero autoplay policy. Recitation only begins following explicit user click on Play button or Spacebar hotkey.
- **Accessibility**: Full keyboard controls (Space: play/pause, Left Arrow: seek back 5s, Right Arrow: seek forward 5s, `m`: mute/unmute). Volume changes are accompanied by `aria-valuenow` announcements.

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: Schema definitions in `ql_corpus`, public-domain audio CDN manifest integration.
- **Phase 2 (Core Experience)**: `AudioTilawahPlayer` and `WhisperingWaveform` composites in `@moonwitness/ui`, synchronized auto-scroll hook in `apps/web`.
- **Phase 3 (Hardening)**: Audio buffer underrun handling and offline audio segment caching in Service Worker (Track 25).

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter web test -- tests/audio-player.test.tsx`
- **Invariants**:
  1. Audio playback timeupdate must synchronize active ayah indicator within +/- 150ms of audio marker.
  2. AudioContext must never initialize or resume prior to a user gesture.
  3. All reciters must have documented, verified public domain or open scholarly licenses.

---

# Group B: Cognitive AI & Grounded Reasoning Engine

---

## Track 06: Hallucination-Shielded Grounded Chat

### 1. System Architecture & Interaction Flow
The Hallucination-Shielded Grounded Chat engine prevents generative AI hallucinations when responding to Islamic queries, enforcing zero-tolerance quotation validation:
1. **Model Generation & Citation Extraction**:
   - The user query is processed by the AI pipeline with structured system prompts demanding canonical citations formatted as `[verse:<surah>:<ayah>]`.
   - The response output is intercepted by `parseGroundedAgentOutput()` in `@moonwitness/agent-runtime` before any tokens are returned to the client.
2. **Storage-Level Verification Gate**:
   - The parser extracts all cited surah/ayah references.
   - A batch query executes against `ql_corpus` model `corpus.passage` to verify that the cited surah and ayah exist in canonical scripture.
   - A fuzzy match compares the AI's quoted Arabic or translation snippet against the stored authoritative text.
3. **Shielding & Warning Classification**:
   - **Grounded Status (`status: "grounded"`)**: If all citations are authentic, citations render as interactive verified citation chips (`CitationChip`) that open the passage in the dual-stream reader.
   - **Unverified Status (`status: "insufficient_evidence"`)**: If an AI hallucinated a non-existent surah (e.g. Surah 115) or an ayah out of range, the response is tagged with an unverified warning badge (`.ql-unverified-citation`) and a disclaimer alert.
4. **Audit Trail**: Every citation check is recorded in `chat.message_citation` for forensic research.

```
[User Query] ──► [LLM Streaming Response] ──► [parseGroundedAgentOutput()]
                                                      │
                                                      ▼
                                       [Query ql_corpus Passages]
                                                      │
                          ┌───────────────────────────┴───────────────────────────┐
                          ▼                                                       ▼
                [Passage Found & Matched]                               [Invalid / Fabricated]
                          │                                                       │
                          ▼                                                       ▼
           [Grounded Citation Chip (Green)]                       [.ql-unverified-citation Warning (Red)]
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
import type { ReactNode } from "react";

export type GroundingVerificationStatus = "grounded" | "insufficient_evidence" | "unverified_citation";

export interface ExtractedCitation {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  verbatimExcerpt: string;
  status: "verified" | "fabricated" | "mismatched";
  similarityScore: number;
}

export interface GroundedChatMessageProps {
  messageId: string;
  role: "user" | "assistant" | "system";
  content: string;
  groundingStatus: GroundingVerificationStatus;
  citations: ExtractedCitation[];
  onCitationClick?: (surah: number, ayah: number) => void;
  className?: string;
}

export interface CitationChipProps {
  citation: ExtractedCitation;
  onClick?: () => void;
  className?: string;
}

export interface HallucinationWarningBannerProps {
  unverifiedCitations: ExtractedCitation[];
  className?: string;
}
```

### 3. QlOrm Model Declarations & Field Constraints
Governed under `ql_chat`:

```typescript
import type { QlModelDefinition } from "ql_orm";

export const chatMessageCitation: QlModelDefinition = {
  name: "chat.message_citation",
  labelKey: "web.models.entities.chat_message_citation",
  description: "Grounded citation verification audit log for AI chat messages.",
  descriptionKey: "web.models.descriptions.chat_message_citation",
  tableName: "chat_message_citation",
  ownerField: "owner_id",
  fields: {
    message_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    surah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 114,
    },
    ayah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 286,
    },
    claimed_snippet: {
      type: "text",
      required: true,
      maxLength: 1000,
    },
    verification_status: {
      type: "char",
      required: true,
      maxLength: 32,
      default: "verified",
      options: ["verified", "fabricated", "mismatched"],
    },
    match_similarity_pct: {
      type: "integer",
      required: true,
      minValue: 0,
      maxValue: 100,
    },
    owner_id: {
      type: "char",
      required: true,
      maxLength: 64,
      private: true,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_chat/__manifest__.ts`)**:
```typescript
{
  model: "chat.message_citation",
  group: "user",
  read: true,
  write: false,
  create: true,
  unlink: false,
},
{
  model: "chat.message_citation",
  group: "admin",
  read: true,
  write: true,
  create: true,
  unlink: true,
}
```

### 4. API Contracts & DTOs
**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface GroundedCitationDto {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  excerpt: string;
  status: "verified" | "fabricated" | "mismatched";
  similarityScore: number;
}

export interface SendGroundedChatRequestDto {
  conversationId: string;
  userPrompt: string;
  preferredEdition?: string;
}

export interface SendGroundedChatResponseDto {
  messageId: string;
  content: string;
  groundingStatus: "grounded" | "insufficient_evidence";
  citations: GroundedCitationDto[];
  hallucinationDetected: boolean;
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  chatGrounded: {
    send: "/chat/grounded/messages",
    citations: (messageId: string) => `/chat/grounded/messages/${segment(messageId)}/citations`,
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  sendGroundedChatMessage(
    payload: SendGroundedChatRequestDto,
  ): Promise<SendGroundedChatResponseDto> {
    return this.request(apiRoutes.chatGrounded.send, "POST", payload);
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 2, RHYTHM: 2, MOTION: 1.
- **Technique Purpose**: Verified citation pills use warm gold outline (`--color-acid`) with book icon to signify sacred scholarly connection. Unverified citations use an amber-red outline (`--color-danger`) with an explicit warning triangle.
- **Tokens & CSS**:
  - Citation Chip: `.ql-citation-chip` (`display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.125rem 0.5rem; font-size: 0.75rem; font-family: var(--font-mono); border: 1px solid var(--color-hairline-strong); border-radius: var(--radius-sm); background: var(--color-panel-raised); transition: border-color 150ms ease;`)
  - Grounded: `.ql-citation-chip.is-grounded` (`border-color: var(--color-acid); color: var(--color-acid);`)
  - Warning Banner: `.ql-unverified-citation` (`margin-top: 0.75rem; padding: 0.75rem 1rem; border: 1px solid var(--color-danger); background: rgba(255, 138, 128, 0.08); border-radius: var(--radius-md); color: var(--color-ink);`)
- **Copy**:
  - `id`: `"Kutipan Al-Qur'an Terverifikasi"` / `"PERINGATAN: Respons AI memuat kutipan ayat yang tidak ditemukan dalam mushaf resmi."`
  - `en`: `"Verified Quranic Citation"` / `"WARNING: The AI response contains verse citations not found in the official corpus."`
- **Accessibility**: ARIA label `"Verified scripture citation: Surah [Name] verse [Number]"`; clicking opens the verse in an accessible slide-over drawer without losing chat scroll position.

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: Parser pipeline in `@moonwitness/agent-runtime`, schema integration in `ql_chat`.
- **Phase 2 (Core Experience)**: Chat UI citation drawer in `apps/web/src/app/command-center/chat`, side-by-side passage validation.
- **Phase 3 (Hardening)**: Automated adversarial benchmark suite testing 100 deceptive theological prompts to confirm 100% detection rate.

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter @moonwitness/agent-runtime test -- grounding-parser.test.ts`
- **Invariants**:
  1. Any prompt asking for nonexistent ayat (e.g. Surah 115 or Al-Baqarah 287) must be flagged with `status === "insufficient_evidence"`.
  2. The parser must reject citations with text divergence > 25% Levenshtein distance against canonical passage.
  3. No private user fields or API tokens leaked in client telemetry.

---

## Track 07: Multi-Provider Failover Mesh

### 1. System Architecture & Interaction Flow
The Multi-Provider Failover Mesh guarantees AI reasoning resilience by automatically routing inference requests across healthy providers with zero user disruption:
1. **Provider Priority Hierarchy**: Providers are configured with failover rankings (e.g. Priority 1: FreeLLMAPI / vLLM, Priority 2: Groq Cloud, Priority 3: Cerebras, Priority 4: OpenRouter Fallback).
2. **Circuit Breaker State Machine**:
   - Each provider maintains a circuit breaker status: `CLOSED` (Healthy, serving requests), `OPEN` (Tripped due to errors/timeouts, routing bypassed), and `HALF_OPEN` (Testing canary requests).
   - If a provider incurs 3 consecutive failures or any request exceeds 3,000ms latency, the circuit trips to `OPEN` for a 60-second cooldown period.
3. **Transparent Timeout Race**:
   - The gateway initiates requests with an `AbortController` configured for exactly 3,000ms.
   - If the primary provider fails to deliver the first response token within 3,000ms, the request is aborted and immediately rerouted to the next priority provider.
4. **Telemetry & Audit Logging**: Circuit state transitions and provider latencies are logged to `ai.endpoint_telemetry` for operational observability.

```
[Incoming Chat Request]
           │
           ▼
[Failover Gateway Mesh]
           ├──► [Provider 1 (FreeLLMAPI)] ──► (Timeout >=3000ms / 5xx) ──┐
           │                                                              │ (Abort & Failover)
           ▼                                                              ▼
[Circuit Breaker Status Check] ──────────────────────────────────► [Provider 2 (Groq / Backup)]
                                                                          │ (Success <250ms)
                                                                          ▼
                                                            [Stream Tokens to User]
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
export type CircuitBreakerState = "closed" | "open" | "half_open";

export interface ProviderHealthTelemetry {
  providerId: string;
  providerCode: string;
  displayName: string;
  circuitState: CircuitBreakerState;
  p95LatencyMs: number;
  failureRatePct: number;
  activeRequests: number;
  lastFailoverTimestampIso?: string;
}

export interface ProviderMeshStatusBadgeProps {
  activeProviderCode: string;
  failoverCount: number;
  latencyMs: number;
  circuitState: CircuitBreakerState;
  className?: string;
}

export interface FailoverMeshConfig {
  primaryProviderCode: string;
  timeoutMs: number;
  failureThreshold: number;
  cooldownPeriodMs: number;
  providers: Array<{
    code: string;
    priority: number;
    enabled: boolean;
  }>;
}
```

### 3. QlOrm Model Declarations & Field Constraints
Governed under `ql_ai`:

```typescript
import type { QlModelDefinition } from "ql_orm";

export const aiProviderMeshConfig: QlModelDefinition = {
  name: "ai.provider_mesh_config",
  labelKey: "web.models.entities.ai_provider_mesh_config",
  description: "Configuration and failover prioritization for AI inference providers.",
  descriptionKey: "web.models.descriptions.ai_provider_mesh_config",
  tableName: "ai_provider_mesh_config",
  fields: {
    provider_code: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 64,
    },
    display_name: {
      type: "char",
      required: true,
      maxLength: 128,
    },
    priority_order: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 100,
    },
    timeout_threshold_ms: {
      type: "integer",
      required: true,
      default: 3000,
      minValue: 500,
      maxValue: 30000,
    },
    consecutive_failures: {
      type: "integer",
      required: true,
      default: 0,
      minValue: 0,
    },
    circuit_state: {
      type: "char",
      required: true,
      maxLength: 16,
      default: "closed",
      options: ["closed", "open", "half_open"],
    },
    endpoint_url: {
      type: "char",
      required: true,
      maxLength: 512,
    },
    api_key_secret: {
      type: "char",
      required: true,
      maxLength: 256,
      private: true,
    },
    is_enabled: {
      type: "boolean",
      required: true,
      default: true,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};

export const aiEndpointTelemetry: QlModelDefinition = {
  name: "ai.endpoint_telemetry",
  labelKey: "web.models.entities.ai_endpoint_telemetry",
  description: "Real-time latency and reliability metrics for provider health analysis.",
  descriptionKey: "web.models.descriptions.ai_endpoint_telemetry",
  tableName: "ai_endpoint_telemetry",
  fields: {
    provider_code: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    latency_ms: {
      type: "integer",
      required: true,
      minValue: 0,
    },
    status_code: {
      type: "integer",
      required: true,
      minValue: 100,
      maxValue: 599,
    },
    was_failover: {
      type: "boolean",
      required: true,
      default: false,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_ai/__manifest__.ts`)**:
```typescript
{
  model: "ai.provider_mesh_config",
  group: "admin",
  read: true,
  write: true,
  create: true,
  unlink: false,
},
{
  model: "ai.provider_mesh_config",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
},
{
  model: "ai.endpoint_telemetry",
  group: "admin",
  read: true,
  write: true,
  create: true,
  unlink: false,
}
```

### 4. API Contracts & DTOs
**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface ProviderMeshTelemetryItemDto {
  providerCode: string;
  displayName: string;
  priorityOrder: number;
  circuitState: "closed" | "open" | "half_open";
  p95LatencyMs: number;
  consecutiveFailures: number;
  isEnabled: boolean;
}

export interface ProviderMeshStatusResponseDto {
  activeProvider: string;
  providers: ProviderMeshTelemetryItemDto[];
  totalFailovers24h: number;
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  aiMesh: {
    status: "/ai/mesh/status",
    telemetry: "/ai/mesh/telemetry",
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  getProviderMeshStatus(): Promise<ProviderMeshStatusResponseDto> {
    return this.request(apiRoutes.aiMesh.status, "GET");
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 1, RHYTHM: 1, MOTION: 1.
- **Technique Purpose**: Subtle telemetry indicator in Command Center header displays operational provider health without distracting users with modal warnings during seamless background failover.
- **Tokens & CSS**:
  - Telemetry Badge: `.ql-mesh-badge` (`display: inline-flex; align-items: center; gap: 0.375rem; font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-muted); padding: 0.125rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--color-hairline);`)
  - Closed (Healthy): `.ql-mesh-badge--healthy` (`border-color: var(--color-hairline-strong);`)
  - Failover Active: `.ql-mesh-badge--failover` (`border-color: var(--color-warning); color: var(--color-warning);`)
- **Accessibility**: Screen reader announcement emitted only when failover occurs: `"AI gateway rerouted request to secondary provider."`

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: Circuit breaker class and AbortController timeout race in `packages/agent-runtime`.
- **Phase 2 (Core Experience)**: Schema update in `ql_ai`, provider priority seed data, telemetry ingestion route in `apps/api`.
- **Phase 3 (Hardening)**: Chaos testing with mocked 3,500ms delay asserting transparent client failover within < 3,100ms total elapsed time.

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter @moonwitness/agent-runtime test -- circuit-breaker.test.ts`
- **Invariants**:
  1. Requests hanging for >= 3,000ms must be aborted and rerouted to provider 2 without throwing uncaught promises.
  2. Secret API keys must remain marked `private: true` and never leak to browser clients or log files.
  3. Total failover latency overhead must not exceed 100ms beyond timeout threshold.

---

## Track 08: Lexical Morphology Search & Root Word Indexer

### 1. System Architecture & Interaction Flow
The Lexical Morphology Search engine indexes the three-consonant Arabic roots (*juzur*) across the entire Quranic corpus (e.g. `ر-ح-م`, `ع-ل-م`, `ق-و-ل`), mapping every derived verbal and nominal form:
1. **Root Normalization & Diacritic Stripping**: Input terms are stripped of diacritics (tashkeel), hamza variations are normalized (`أ`, `إ`, `آ` -> `ا`), and prefixed prepositions/articles (`al-`, `wa-`, `fa-`, `bi-`, `li-`) are detached.
2. **Morphological Lookup Index**:
   - The query matches against `corpus.root_word` to locate the tri-literal root.
   - Related derivations are queried from `corpus.word_derivation`, joining passages in `corpus.passage`.
3. **Paradigmatic Grouping**:
   - Results are categorized by grammatical paradigm: Form I through Form X verbs, active participles (*ism fa'il*), passive participles (*ism maf'ul*), and verbal nouns (*masdar*).
4. **Passage Distribution Matrix**:
   - Frequency counters group occurrences by Makki vs Madani surahs, showing revelation context.

```
[Search Input: "Rahman" / "r-h-m"] ──► [Normalizer & Prefix Stripper]
                                                │
                                                ▼
                                    [Root: "ر-ح-م" (r-h-m)]
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
        [Derivation Groups: Forms I-X]                       [Distribution: 339 Occurrences]
                     │                                                     │
                     └───────────────► [Results Grid with Ayah Preview] ◄──┘
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
export interface ArabicRootEntry {
  id: string;
  rootArabic: string;
  rootTranslit: string;
  totalOccurrences: number;
  distinctFormsCount: number;
  meaningSummaryId: string;
  meaningSummaryEn: string;
}

export interface MorphologicalDerivationGroup {
  formPattern: string;
  grammarCategory: "verb_form_i" | "verb_form_ii" | "verb_form_iv" | "noun_masdar" | "noun_participle";
  arabicLemma: string;
  occurrenceCount: number;
  samplePassages: Array<{
    surah: number;
    ayah: number;
    verbatimText: string;
  }>;
}

export interface LexicalRootSearchProps {
  initialRoot?: string;
  onSelectPassage?: (surah: number, ayah: number) => void;
  onSelectRoot?: (root: string) => void;
  className?: string;
}

export interface RootCharPickerProps {
  onCharSelect: (char: string) => void;
  selectedChars: string[];
  onReset: () => void;
}
```

### 3. QlOrm Model Declarations & Field Constraints
Governed under `ql_corpus` and `ql_search`:

```typescript
import type { QlModelDefinition } from "ql_orm";

export const corpusRootWord: QlModelDefinition = {
  name: "corpus.root_word",
  labelKey: "web.models.entities.corpus_root_word",
  description: "Trilateral and quadrilateral Arabic root index.",
  descriptionKey: "web.models.descriptions.corpus_root_word",
  tableName: "corpus_root_word",
  fields: {
    root_arabic: {
      type: "char",
      required: true,
      unique: true,
      maxLength: 16,
    },
    root_translit: {
      type: "char",
      required: true,
      maxLength: 32,
    },
    total_occurrences: {
      type: "integer",
      required: true,
      default: 0,
      minValue: 0,
    },
    meaning_id: {
      type: "char",
      required: true,
      maxLength: 255,
    },
    meaning_en: {
      type: "char",
      required: true,
      maxLength: 255,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};

export const corpusWordDerivation: QlModelDefinition = {
  name: "corpus.word_derivation",
  labelKey: "web.models.entities.corpus_word_derivation",
  description: "Grammatical derivation linkage between roots, lemmas, and passages.",
  descriptionKey: "web.models.descriptions.corpus_word_derivation",
  tableName: "corpus_word_derivation",
  fields: {
    root_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    passage_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    surah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 114,
    },
    ayah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 286,
    },
    word_index_in_ayah: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 150,
    },
    arabic_lemma: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    form_pattern: {
      type: "char",
      required: true,
      maxLength: 32,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_corpus/__manifest__.ts`)**:
```typescript
{
  model: "corpus.root_word",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
},
{
  model: "corpus.word_derivation",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
}
```

### 4. API Contracts & DTOs
**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface RootDerivationOccurrenceDto {
  surahNumber: number;
  ayahNumber: number;
  wordIndex: number;
  lemma: string;
  formPattern: string;
  passageSnippet: string;
}

export interface RootSearchResponseDto {
  rootArabic: string;
  rootTranslit: string;
  totalOccurrences: number;
  meaningId: string;
  meaningEn: string;
  derivationsByForm: Record<string, RootDerivationOccurrenceDto[]>;
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  searchMorphology: {
    root: (rootStr: string) => `/search/morphology/roots/${segment(rootStr)}`,
    rootsList: "/search/morphology/roots",
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  searchByRoot(rootArabicOrTranslit: string): Promise<RootSearchResponseDto> {
    return this.request(
      apiRoutes.searchMorphology.root(rootArabicOrTranslit),
      "GET",
    );
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 1, RHYTHM: 2, MOTION: 1.
- **Technique Purpose**: Morphological roots are presented in structured semantic tables without overwhelming users with cluttered tag clouds. Interactive 3-character picker allows non-Arabic keyboard users to construct roots with ease.
- **Tokens & CSS**:
  - Root Table: `.ql-root-table` (`width: 100%; border-collapse: collapse; font-family: var(--font-sans);`)
  - Form Pill: `.ql-form-pill` (`display: inline-block; padding: 0.125rem 0.375rem; font-family: var(--font-mono); font-size: 0.75rem; background: var(--color-panel-raised); border: 1px solid var(--color-hairline); border-radius: var(--radius-sm);`)
  - Char Button: `.ql-char-btn` (`width: 2.25rem; height: 2.25rem; font-family: var(--font-arabic-uthmani); font-size: 1.25rem; border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); background: var(--color-panel);`)
- **States**:
  - Empty: Shows popular roots (`ر-ح-م`, `ع-ل-م`, `ه-د-ي`) with sample definitions.
  - Loading: Skeleton table structure matching standard 5-row morphology layout.
- **Accessibility**: Full screen-reader support announcing letter selections and derivation counts; tables use proper `<th scope="col">` and `<th scope="row">` markup.

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: Schema definitions in `ql_corpus`, morphological seed ingestion for top 500 Quranic roots.
- **Phase 2 (Core Experience)**: `LexicalRootSearch` and `RootCharPicker` composites in `apps/web/src/features/corpus`.
- **Phase 3 (Hardening)**: Ingestion of full Quranic root catalog (1,600+ roots, 77,430 word occurrences) with query latency benchmarked < 40ms.

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter ql_corpus test -- morphology.test.ts`
- **Invariants**:
  1. Searching root `ر-ح-م` must return exactly 339 occurrences across Surah Al-Fatihah, Al-Baqarah, etc.
  2. Index lookups must complete in under 50ms on cold SQLite/Postgres instances.
  3. No raw form `<button>` elements in UI; use `@moonwitness/ui` `Button`.

---

## Track 09: Quranic Morphological Visualizer

### 1. System Architecture & Interaction Flow
The Quranic Morphological Visualizer renders detailed word-by-word grammatical trees (I'rab, dependency syntax, Part-of-Speech tagging, and case inflection) for linguistic research:
1. **Sentence Parsing**: The system splits each ayah into grammatical tokens: prefixes (harf jar, istifham), roots/stems (ism, fi'il), and suffixed object/possessive pronouns (dhamir).
2. **Dependency Tree Construction**:
   - Syntactic dependency relationships (Mubtada -> Khabar, Fi'il -> Fa'il -> Maf'ul Bih) are structured into a directed acyclic tree.
   - Grammatical cases are mapped: Marfu' (Nominative), Mansub (Accusative), Majrur (Genitive), and Majzum (Jussive).
3. **Responsive Visual Tree Component**:
   - The tree renders horizontally for Arabic reading flow (right-to-left).
   - Parent nodes link to child branches with curved SVG connectors.
   - Clicking any word segment opens a comprehensive I'rab analysis drawer containing classical commentary citations.

```
[Select Ayah: 1:2] ──► [Grammatical Tokenizer & I'rab Parser]
                                  │
                                  ▼
[Syntax Dependency Hierarchy: Al-Hamdu (Mubtada) ──► Li-Llahi (Jar wa Majrur / Khabar)]
                                  │
                                  ▼
[Horizontal RTL Dependency Graph + Semantic Case Ending Badges]
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
export type ArabicGrammaticalCase = "marfu" | "mansub" | "majrur" | "majzum" | "mabni";
export type ArabicPartOfSpeech = "noun" | "verb" | "particle" | "pronoun" | "adjective";

export interface SyntaxSegmentToken {
  id: string;
  wordIndex: number;
  segmentIndex: number;
  arabicText: string;
  transliteration: string;
  pos: ArabicPartOfSpeech;
  posTag: string;
  grammaticalCase: ArabicGrammaticalCase;
  caseExplanation: string;
  dependencyRelation?: string;
  parentSegmentId?: string;
}

export interface MorphologyVisualizerProps {
  surahNumber: number;
  ayahNumber: number;
  activeSegmentId?: string;
  onSegmentClick?: (segment: SyntaxSegmentToken) => void;
  className?: string;
}

export interface IrabDetailDrawerProps {
  segment: SyntaxSegmentToken | null;
  onClose: () => void;
}
```

### 3. QlOrm Model Declarations & Field Constraints
Governed under `ql_research`:

```typescript
import type { QlModelDefinition } from "ql_orm";

export const researchSyntaxSegment: QlModelDefinition = {
  name: "research.syntax_segment",
  labelKey: "web.models.entities.research_syntax_segment",
  description: "Word segment linguistic syntax tree and I'rab inflection model.",
  descriptionKey: "web.models.descriptions.research_syntax_segment",
  tableName: "research_syntax_segment",
  fields: {
    passage_id: {
      type: "char",
      required: true,
      maxLength: 64,
    },
    surah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 114,
    },
    ayah_number: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 286,
    },
    word_index: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 150,
    },
    segment_index: {
      type: "integer",
      required: true,
      minValue: 1,
      maxValue: 10,
    },
    arabic_text: {
      type: "char",
      required: true,
      maxLength: 32,
    },
    pos_tag: {
      type: "char",
      required: true,
      maxLength: 16,
    },
    grammatical_case: {
      type: "char",
      required: true,
      maxLength: 16,
      options: ["marfu", "mansub", "majrur", "majzum", "mabni"],
    },
    irab_explanation_id: {
      type: "char",
      required: true,
      maxLength: 500,
    },
    irab_explanation_en: {
      type: "char",
      required: true,
      maxLength: 500,
    },
    dependency_relation: {
      type: "char",
      required: false,
      maxLength: 32,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_research/__manifest__.ts`)**:
```typescript
{
  model: "research.syntax_segment",
  group: "viewer",
  read: true,
  write: false,
  create: false,
  unlink: false,
},
{
  model: "research.syntax_segment",
  group: "admin",
  read: true,
  write: true,
  create: true,
  unlink: false,
}
```

### 4. API Contracts & DTOs
**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface SyntaxSegmentDto {
  id: string;
  wordIndex: number;
  segmentIndex: number;
  arabicText: string;
  posTag: string;
  grammaticalCase: "marfu" | "mansub" | "majrur" | "majzum" | "mabni";
  irabExplanationId: string;
  irabExplanationEn: string;
  dependencyRelation?: string;
}

export interface AyahMorphologyResponseDto {
  surahNumber: number;
  ayahNumber: number;
  totalWords: number;
  segments: SyntaxSegmentDto[];
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  researchMorphology: {
    ayah: (surah: number, ayah: number) =>
      `/research/morphology/surah/${segment(String(surah))}/ayah/${segment(String(ayah))}`,
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  getAyahMorphology(
    surahNumber: number,
    ayahNumber: number,
  ): Promise<AyahMorphologyResponseDto> {
    return this.request(
      apiRoutes.researchMorphology.ayah(surahNumber, ayahNumber),
      "GET",
    );
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 2, RHYTHM: 2, MOTION: 1.
- **Technique Purpose**: Semantic color coding of grammatical cases reinforces linguistic comprehension:
  - Marfu' (Nominative): Warm gold `--color-acid`
  - Mansub (Accusative): Teal/Cyan subtle tone
  - Majrur (Genitive): Ink soft `--color-ink-soft`
  - Majzum (Jussive): Danger muted tone
- **Tokens & CSS**:
  - Segment Node: `.ql-syntax-node` (`display: flex; flex-direction: column; align-items: center; padding: 0.5rem 0.75rem; background: var(--color-panel-raised); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); cursor: pointer;`)
  - Case Badge: `.ql-case-badge` (`font-size: 0.65rem; font-family: var(--font-mono); text-transform: uppercase; margin-top: 0.25rem;`)
- **Accessibility**: Employs ARIA `tree` and `treeitem` roles; screen readers announce Arabic text, Part of Speech, and I'rab case.

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: Schema definitions in `ql_research`, seed ingestion for Surah Al-Fatihah and Ayat al-Kursi syntax data.
- **Phase 2 (Core Experience)**: `MorphologyVisualizer` and `IrabDetailDrawer` composites in `apps/web/src/features/research`.
- **Phase 3 (Hardening)**: Corpus-wide syntax expansion covering all 30 Juz with automated structural integrity validation.

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter web test -- tests/morphology-visualizer.test.tsx`
- **Invariants**:
  1. Tree structure must strictly conform to W3C ARIA Treeview Pattern.
  2. Selecting any segment must populate the I'rab explanation drawer without triggering unhandled exceptions.
  3. No raw form primitives or inline CSS styles utilized.

---

## Track 10: Local-First Private AI Inference Mode

### 1. System Architecture & Interaction Flow
The Local-First Private AI Inference Mode empowers privacy-sensitive researchers to execute semantic vector search and intent classification client-side using WebGPU without sending queries over the network:
1. **Capability Detection & Initialization**:
   - The client checks for WebGPU support via `navigator.gpu`. If unsupported, it gracefully degrades to WebAssembly (WASM) or server-assisted inference.
2. **Dedicated Web Worker Isolation**:
   - To keep the main UI thread at 60 FPS, all tensor operations execute inside a dedicated Web Worker (`local-inference.worker.ts`).
   - Quantized ONNX model weights (e.g. `bge-small-en-v1.5-q4` or `all-MiniLM-L6-v2-quantized`, <42 MB total) are downloaded once and cached in the browser's `Cache API`.
3. **Zero-Network Egress Guarantee**:
   - While Local-First mode is active, an internal security guard monitors network requests; outbound search query packets are strictly banned.
   - Cosine similarity vector comparisons against pre-embedded Quranic passages execute in-memory using TypedArrays.
4. **Offline Resilience**:
   - Once cached, semantic search operates completely offline, fulfilling PWA offline research criteria (Track 25).

```
[User Search Query] ──► [Local Inference Web Worker]
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
            [WebGPU Pipeline]       [Cached ONNX Weights (Cache API)]
                     │                       │
                     └───────────┬───────────┘
                                 ▼
                     [Zero-Network Vector Match]
                                 │
                                 ▼
                     [Instant Local Results (<35ms)]
```

### 2. Concrete TypeScript Component Interfaces / Signatures
```typescript
export interface LocalInferenceModelStatus {
  isAvailable: boolean;
  backend: "webgpu" | "wasm" | "unavailable";
  modelLoaded: boolean;
  downloadProgressPct: number;
  memoryUsedMb: number;
}

export interface LocalInferenceToggleProps {
  isEnabled: boolean;
  modelStatus: LocalInferenceModelStatus;
  onToggle: (enabled: boolean) => void;
  onDownloadModel: () => void;
  className?: string;
}

export interface LocalWorkerRequestMessage {
  type: "INIT" | "EMBED" | "CLASSIFY";
  requestId: string;
  payload: {
    text?: string;
    modelName?: string;
  };
}

export interface LocalWorkerResponseMessage {
  type: "INIT_SUCCESS" | "EMBED_SUCCESS" | "PROGRESS" | "ERROR";
  requestId: string;
  payload: {
    embeddings?: Float32Array;
    progressPct?: number;
    error?: string;
  };
}
```

### 3. QlOrm Model Declarations & Field Constraints
Governed under `ql_ai`:

```typescript
import type { QlModelDefinition } from "ql_orm";

export const aiClientPreference: QlModelDefinition = {
  name: "ai.client_preference",
  labelKey: "web.models.entities.ai_client_preference",
  description: "User preference settings for local-first private AI inference.",
  descriptionKey: "web.models.descriptions.ai_client_preference",
  tableName: "ai_client_preference",
  ownerField: "owner_id",
  fields: {
    prefer_local_inference: {
      type: "boolean",
      required: true,
      default: false,
    },
    local_backend_selected: {
      type: "char",
      required: true,
      maxLength: 16,
      default: "auto",
      options: ["auto", "webgpu", "wasm"],
    },
    cache_model_weights: {
      type: "boolean",
      required: true,
      default: true,
    },
    owner_id: {
      type: "char",
      required: true,
      maxLength: 64,
      private: true,
    },
    created_at: {
      type: "datetime",
      required: true,
    },
    updated_at: {
      type: "datetime",
      required: true,
    },
  },
};
```

**ACL Definition (`packages/ql_ai/__manifest__.ts`)**:
```typescript
{
  model: "ai.client_preference",
  group: "user",
  read: true,
  write: true,
  create: true,
  unlink: true,
}
```

### 4. API Contracts & DTOs
*Note: Local-First mode minimizes remote API calls by design. Telemetry and preference synchronization contracts are provided below.*

**DTO Definitions (`packages/moonclient/src/index.ts`)**:
```typescript
export interface ClientAiPreferenceDto {
  preferLocalInference: boolean;
  localBackendSelected: "auto" | "webgpu" | "wasm";
  cacheModelWeights: boolean;
}

export interface UpdateClientAiPreferenceRequestDto {
  preferLocalInference: boolean;
  localBackendSelected?: "auto" | "webgpu" | "wasm";
}
```

**Route Declarations (`packages/moonclient/src/index.ts`)**:
```typescript
export const apiRoutes = {
  // ...
  aiPreferences: {
    myPreferences: "/ai/preferences/me",
  },
} as const;
```

**MoonClient SDK Method Signature**:
```typescript
export class MoonClient {
  getMyAiPreferences(): Promise<ClientAiPreferenceDto> {
    return this.request(apiRoutes.aiPreferences.myPreferences, "GET");
  }

  updateMyAiPreferences(
    payload: UpdateClientAiPreferenceRequestDto,
  ): Promise<ClientAiPreferenceDto> {
    return this.request(
      apiRoutes.aiPreferences.myPreferences,
      "PUT",
      payload,
    );
  }
}
```

### 5. UI / UX & Anti-Slop Specifications
- **Anti-Slop Dials**: ENERGY: 1, RHYTHM: 1, MOTION: 1.
- **Technique Purpose**: A privacy shield icon with a green indicator signals zero-network transmission. A single progress bar reflects weight download progress without distracting animations.
- **Tokens & CSS**:
  - Shield Indicator: `.ql-privacy-badge` (`display: inline-flex; align-items: center; gap: 0.375rem; font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-success); padding: 0.25rem 0.625rem; border: 1px solid var(--color-success); border-radius: var(--radius-sm); background: rgba(110, 231, 183, 0.05);`)
  - Progress Track: `.ql-download-progress` (`width: 100%; height: 4px; background: var(--color-panel-deep); border-radius: var(--radius-sm); overflow: hidden;`)
  - Progress Fill: `.ql-download-progress__fill` (`height: 100%; background: var(--color-acid); transition: width 150ms ease;`)
- **Copy**:
  - `id`: `"Inferensi Lokal 100% Privat (Tanpa Akses Jaringan)"` / `"Mengunduh bobot model aman..."`
  - `en`: `"100% Private Local Inference (Zero Network Egress)"` / `"Downloading secure model weights..."`
- **Accessibility**: ARIA progress bar role (`role="progressbar"`) with dynamic `aria-valuenow` announcements; toggle switch keyboard navigable with Space/Enter.

### 6. Phased Implementation Roadmap
- **Phase 1 (Foundation)**: Dedicated Web Worker script and Cache API model loader in `apps/web/src/features/ai`.
- **Phase 2 (Core Experience)**: Vector cosine similarity engine in Web Worker, UI toggle in Command Center settings.
- **Phase 3 (Hardening)**: Network tab assertion test in Playwright confirming 0 outbound HTTP fetch requests during local semantic search.

### 7. Verification Rubrics & Acceptance Criteria
- **Test Command**: `pnpm --filter web test -- tests/local-inference.test.ts`
- **Invariants**:
  1. In local inference mode, exactly 0 HTTP requests outside same-origin static assets may be triggered.
  2. Embeddings calculation on WebGPU must execute under 45ms per query for models <= 45 MB.
  3. Total First Load JS impact on web routes must remain < 5 kB through dynamic `next/dynamic` splitting.

---
*(End of Master Technical Specification for Domains A & B)*
