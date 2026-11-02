# Handoff Report: Survey 3 — API/Client & Frontend/UI Architectural Conventions

> **Agent:** `teamwork_explorer_survey_3`  
> **Parent Conversation ID:** `15ce11f1-e3a8-45f6-959a-ed89d1ed23fb`  
> **Mission:** Deep exploration and documentation of `@moonwitness/moonclient`, `@moonwitness/ui`, `apps/web`, Anti-Slop standards, and the formulation of API contracts and UI component specifications across all 30 Strategic Tracks.

---

## 1. Observation

### 1.1 `@moonwitness/moonclient` Architecture & Patterns
- **Location:** `packages/moonclient/` (`packages/moonclient/src/index.ts`, `packages/moonclient/src/index.test.ts`, `packages/moonclient/package.json`).
- **Route Declaration Pattern (`apiRoutes`):**
  - Routes are defined centrally in `apiRoutes` as a deeply frozen `const` object (`as const`).
  - Static endpoints are defined as plain string literals (e.g., `health: "/health"`, `chat: "/chat"`).
  - Parameterized endpoints use functional closures that encode dynamic parameters using a dedicated helper `const segment = (value: string) => encodeURIComponent(value);`.
  - Verbatim inspection from `packages/moonclient/src/index.ts:867-983`:
    ```typescript
    const segment = (value: string) => encodeURIComponent(value);

    export const apiRoutes = {
      health: "/health",
      auth: {
        me: "/auth/me",
        preferences: "/auth/me/preferences",
        setup: "/auth/setup",
        register: "/auth/register",
        login: "/auth/login",
        logout: "/auth/logout",
      },
      chat: "/chat",
      conversations: {
        collection: "/conversations",
        prefix: "/conversations/",
        item: (id: string) => `/conversations/${segment(id)}`,
        messages: (id: string) => `/conversations/${segment(id)}/messages`,
      },
      corpus: {
        editions: "/corpus/editions",
        prefix: "/corpus/",
        edition: (key: string) => `/corpus/editions/${segment(key)}`,
        surah: (key: string, surah: number) =>
          `/corpus/editions/${segment(key)}/surahs/${segment(String(surah))}`,
        verse: (key: string, surah: number, ayah: number) =>
          `/corpus/editions/${segment(key)}/surahs/${segment(String(surah))}/verses/${segment(String(ayah))}`,
      },
      // ...
    } as const;
    ```
- **DTO Structure & Typing Standards:**
  - Standardized PascalCase naming conventions: `*RequestDto`, `*ResponseDto`, `*ItemDto`.
  - Strict re-exports from `@moonwitness/types` for domain primitives (`AddonCategory`, `UiLocale`, `PassageKindDto`, etc.).
  - Discriminated union typing for polymorphic responses (e.g., `ChatResponseDto` discriminated on `groundingStatus: "grounded" | "insufficient_evidence" | "legacy"`).
  - Explicit projection and privacy guarantees (e.g. `SourceRightsSummaryDto` deliberately excludes private model fields like `license_evidence_ref` and `owner_id`).
- **Client Implementation (`MoonClient` Class & Singleton):**
  - Uses a dedicated `MoonClientError` class capturing `message`, `status: number`, and optional `code?: string`.
  - Fetch receiver binding: to prevent browser runtime `Illegal invocation` errors when calling global fetch, `MoonClient` explicitly defaults fetcher to `((input, init) => globalThis.fetch(input, init))` (`index.ts:1004`).
  - Strict HTTP defaults: all requests enforce `credentials: "same-origin"` and `headers: { "content-type": "application/json" }`.
  - The client provides typed helper methods returning `Promise<T>`.
  - Exported as a singleton instance: `export const moonClient = new MoonClient();`.
  - Unit test suite (`packages/moonclient/src/index.test.ts`): 15 comprehensive tests covering route encoding, grounding status preservation, error statuses, and credential safety.

---

### 1.2 `@moonwitness/ui` Architecture, Tokens & Anti-Slop
- **Location:** `packages/ui/` (`src/atoms/`, `src/blocks/`, `src/components/`, `src/composites/`, `styles/`, `tests/`).
- **Design Tokens Architecture (`packages/ui/styles/tokens.css`):**
  - MW-ADR-020 defines `tokens.css` as the **single source of truth** for colors and typography.
  - Closed palette declared via Tailwind v4 `@theme` block:
    - Primary surface & text: `--color-ink` (`#f1ead9`), `--color-ink-soft` (`#d3cbb8`), `--color-muted` (`#a6a3bb`), `--color-muted-dim` (`#8d8aa6`).
    - Panels & HUD depths: `--color-panel` (`#0f1230`), `--color-panel-raised` (`#171a3d`), `--color-panel-deep` (`#0a0c24`), `--color-panel-deeper` (`#070918`), `--color-panel-edge` (`#12153a`), `--color-panel-well` (`#0a0c22`).
    - Borders: `--color-hairline` (`#3a3560`), `--color-hairline-soft` (`#2a2750`), `--color-hairline-strong` (`#4a4478`).
    - Accent: `--color-acid` (warm gold `#f2c15e`), `--color-acid-dark` (`#c99a3a`), `--color-acid-muted` (`#d9bf86`), `--color-acid-shadow` (`#8a6a22`).
    - Status: `--color-danger` (`#ff8a80`), `--color-success` (`#6ee7b7`), `--color-warning` (`#fbbf24`), `--color-void` (`#04050f`).
    - Typography: `--font-sans` (Inter), `--font-display` (Cormorant Garamond), `--font-mono` (Cascadia Code).
  - Adaptive Light Theme (`tokens.css:173-250`):
    - Activated via `:root[data-theme="light"], [data-theme="light"]`.
    - Deep night indigo inverted to rich parchment: `--color-ink` (`#1c1738`), `--color-panel` (`#fffdf7`), `--color-panel-deep` (`#f3ecda`), `--color-acid` (`#8a5a00`).
  - Component-specific palette (`:root`): `--ql-button-*`, `--ql-input-*`, `--ql-hud-*`, `--ql-glow-gold`, etc.
  - Enforced by automated test `tests/tokens.test.ts` (fails if any stylesheet outside `tokens.css` writes a hex literal or undeclared token).
- **CSS Class Conventions & State Vocabulary (`packages/ui/styles/components.css`):**
  - Blocks and elements: `.ql-*` (e.g. `.ql-button`, `.ql-card`, `.ql-input`, `.ql-nav-link`, `.ql-hud-app`, `.ql-workspace__sidebar`).
  - Modifiers: `.ql-*--*` (e.g. `.ql-button--default`, `.ql-button--secondary`, `.ql-button--ghost`, `.ql-button--sm`).
  - Dynamic States: strictly `.is-*` (e.g. `.is-active`, `.is-open`, `.is-selected`).
- **Composite Components Architecture (`packages/ui/src/composites/`):**
  - Composites consolidate recurring patterns across web screens:
    - `EmptyState`: Standardized card-based "no data" / "nothing matches" surface with title, description, icon, and actionable remediation button (`action` prop).
    - `LoadingScreen`: HUD-styled loading surface with accessible `role="status"` and error prioritization.
    - `NavLink`: Navigation anchor wrapping Next.js `Link`, automatically emitting `ql-nav-link`, `is-active`, and `aria-current="page"`.
    - `PageHeader`, `SectionGrid`, `SidePanel`, `WorkspaceSidebar`, `SidebarBrand`, `SidebarFooter`, `SidebarTrigger`, `SidebarNav`, `OptionNav`, `NavSectionLabel`, `MetricRow`, `MetricList`, `IconTile`, `ListOption`, `HeroStage`, `ThemeToggle`, `SearchDialog`, `SanctuaryHeader`, `PortalCard`, `TransmissionCard`, `SpatialRegion`.
  - Contract Guarantee (`tests/class-name-contract.test.tsx`): Caller-supplied `className` is merged via `cn(...)` and **never** displaces the base `.ql-*` class.
  - Zero Hardcoded Copy: User-facing text is passed as props (`label`, `title`, `description`) or via `children`. No hardcoded strings exist inside `@moonwitness/ui`.
- **Anti-Slop Guidelines Integration (`.agents/skills/antislop/`):**
  - 40 mandatory rules across 3 tiers:
    1. **Hard Gate:** Absolute prohibition of em dashes `—` (R-02); mandatory mobile responsiveness without overflow (R-03); zero fabricated statistics (R-17); zero fake testimonials (R-18); mandatory placeholders or asking (R-23); zero dead navigation links (R-24); WCAG AA color contrast (4.5:1 normal, 3:1 large/boundary) (R-25); all interactive elements must have real behaviors (R-26); mandatory empty, loading, error states for all data views (R-27); relevant FAQs only (R-28); full keyboard navigability with visible focus indicators (R-32); no patch scripts (R-33); dual-theme functionality required for both dark and light modes (R-34); verify before deliver (R-35); no fabricated claims (R-36); style direction required (R-37); real content or honest placeholders (R-38); accessible semantics and `cursor: pointer` affordances (R-39); performance and media dimension rules (R-40).
    2. **Purpose Gate:** Techniques permitted only with explicit written rationale: gradients (R-01), relevant icons (R-04), brand typography (R-06), background patterns (R-07), button arrows (R-08), functional badges (R-09), capped glassmorphism (R-10), purposeful shadows (R-12), capped glow (R-13), varied card hierarchy (R-14), purposeful animation (R-19), relevant illustrations (R-22).
    3. **Quality Locks:** Non-template layout rhythm (R-05), consistent border radius (R-11), context-specific CTAs (R-15), zero marketing buzzwords (R-16), strong visual identity (R-20), intentional dark/light theme (R-21), palette capped at 2-3 core colors + 1 accent (R-29), no clone of popular products (R-30), write down reason for every major decision (R-31).
  - Liveliness Toolkit: Three dials (ENERGY 1-3, RHYTHM 1-3, MOTION 1-3), Five Levers (single focal point, hierarchical contrast, whitespace as structure, one deliberate accent, identity motif), Design Read declaration.

---

### 1.3 `apps/web` Architecture & Boundary Rules
- **Location:** `apps/web/` (`src/app/`, `src/features/`, `scripts/`, `package.json`, `.size-budget.json`).
- **MW-ADR-020 Architectural Governance (`packages/eslint-config/index.js`):**
  - Raw form primitives banned: `<button>`, `<input>`, `<textarea>`, `<select>` trigger ESLint errors (`UI_PRIMITIVE_BAN_MESSAGE`). Must use `Button`, `Input`, `Textarea`, `Select` from `@moonwitness/ui`.
  - `<style>` tags banned (`JSXOpeningElement[name.name="style"]`).
  - Raw internal anchors banned: `JSXOpeningElement[name.name="a"]` with literal `href` triggers `UI_INTERNAL_LINK_MESSAGE`. Must use Next.js `<Link>` or `@moonwitness/ui` `NavLink`.
  - Inline styles banned: `JSXAttribute[name.name="style"]` triggers `UI_INLINE_STYLE_MESSAGE`.
  - Arbitrary Tailwind hex values banned: `className` matching `#[0-9a-fA-F]+` triggers `UI_ARBITRARY_HEX_MESSAGE`.
  - Tailwind default palette banned: `className` matching `stone|zinc|neutral|gray|slate|amber|emerald|green|red|rose|sky|blue|indigo|violet|purple|pink|cyan|teal|lime|orange|yellow|fuchsia` or `white|black` triggers `UI_DEFAULT_PALETTE_MESSAGE`.
  - HTTP boundary: `fetch`, `XMLHttpRequest`, `axios`, `got`, `ky`, `node-fetch` are banned in `apps/web`. All communications must use `moonClient`.
  - Browser boundary: Server packages (`ql_orm`, `ql_ai`, `ql_chat`, `ql_corpus`, `ql_workflow`, `@moonwitness/database`, `@moonwitness/agent-runtime`, etc.) are banned from web imports. Only `ql_i18n/catalogs` is permitted for i18n messages.
- **Global Styles:**
  - `apps/web/src/app/globals.css` consists exclusively of `@import "@moonwitness/ui/preset.css";`. Local CSS overrides or resets in web apps are strictly forbidden.
- **First Load JS Bundle Budget (`apps/web/.size-budget.json` & `scripts/check-bundle-budget.mjs`):**
  - Maximum First Load JS ceiling: **150 kB**.
  - Maximum route delta: **2 kB**.
  - Enforced via gzip measurement of Next.js production build chunks in `app-build-manifest.json`.

---

## 2. Logic Chain

```
Observation 1: packages/moonclient centralizes all HTTP routes in apiRoutes, exposes typed DTOs, and executes requests via MoonClient singleton.
    ↓ (leads to)
Inference 1: Every new capability across the 30 tracks must specify its endpoint in apiRoutes, declare exact TypeScript Request/Response DTOs, and export typed MoonClient methods. No web screen may construct raw URLs or use raw fetch.

Observation 2: packages/ui enforces a closed semantic token palette (tokens.css), .ql-* / is-* naming (components.css), reusable composites, and zero hardcoded copy.
    ↓ (leads to)
Inference 2: All UI components for the 30 tracks must be specified as @moonwitness/ui atoms or composites, using only semantic tokens (ink, panel, acid, hairline, etc.), state classes (.is-*), and props-driven copy linked to id/en translation catalogs.

Observation 3: packages/eslint-config strictly bans raw HTML form elements (<button>, <input>), raw internal <a>, inline styles, arbitrary hex colors, and Tailwind default palettes in apps/web.
    ↓ (leads to)
Inference 3: UI specifications for apps/web screens across all 30 tracks must strictly mandate @moonwitness/ui primitives (Button, Input), Next.js <Link> or NavLink, and semantic class names.

Observation 4: Anti-slop guidelines require explicit liveliness dials (ENERGY, RHYTHM, MOTION), purpose-justified techniques (caps on glow, glass, shadows), and strict WCAG 2.2 AA accessibility (contrast, keyboard nav, screen-reader semantics).
    ↓ (leads to)
Inference 4: Every track's UI specification must explicitly define its Anti-Slop Dials, Purpose Justifications, UI States (Empty, Loading, Error, Success), and Accessibility Tree mapping.
```

---

## 3. Concrete Design Templates & Rules

### 3.1 Standard Template for API Contracts in `@moonwitness/moonclient`

When introducing an API endpoint for any strategic track, the specification must provide the following three code blocks:

#### 1. DTO Definitions (`packages/moonclient/src/index.ts`)
```typescript
// 1. Domain Request DTO
export interface TrackNameActionRequestDto {
  targetId: string;
  parameters: Record<string, unknown>;
}

// 2. Domain Item/Entity DTO
export interface TrackNameItemDto {
  id: string;
  title: string;
  status: "staged" | "active" | "archived";
  checksum: string;
  createdAt: string;
  updatedAt: string;
}

// 3. Domain Response DTO
export interface TrackNameActionResponseDto {
  item: TrackNameItemDto;
  metadata?: Record<string, string>;
}
```

#### 2. Route Declaration (`apiRoutes` in `packages/moonclient/src/index.ts`)
```typescript
export const apiRoutes = {
  // ... existing routes
  trackNamespace: {
    collection: "/track-namespace/items",
    prefix: "/track-namespace/",
    item: (id: string) => `/track-namespace/items/${segment(id)}`,
    action: (id: string) => `/track-namespace/items/${segment(id)}/action`,
  },
} as const;
```

#### 3. Client Method Implementation (`MoonClient` class in `packages/moonclient/src/index.ts`)
```typescript
export class MoonClient {
  // ...
  trackNameAction(
    id: string,
    input: TrackNameActionRequestDto,
  ): Promise<TrackNameActionResponseDto> {
    return this.request(
      apiRoutes.trackNamespace.action(id),
      "POST",
      input,
    );
  }
}
```

---

### 3.2 Standard Template for UI Components in `@moonwitness/ui` & `apps/web`

When specifying or implementing a UI component for any strategic track:

#### 1. Component Specification Template (`packages/ui/src/composites/<name>.tsx`)
```typescript
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface TrackComponentProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  status?: "idle" | "active" | "warning";
  actionSlot?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * [Purpose Statement]: Explains why this component exists and what content hierarchy it serves.
 * Anti-Slop Compliance:
 * - Dials: ENERGY [1-3] / RHYTHM [1-3] / MOTION [1-3]
 * - Technique Purpose: [e.g. subtle gold glow on status indicator to signal active state]
 * - Accessibility: Accessible name, ARIA roles, WCAG 2.2 AA contrast verified.
 */
export function TrackComponent({
  title,
  eyebrow,
  description,
  status = "idle",
  actionSlot,
  className,
  children,
}: TrackComponentProps) {
  return (
    <section
      className={cn(
        "ql-card relative flex flex-col gap-4 border border-hairline bg-panel p-6 transition-all",
        status === "active" && "border-acid/60 shadow-[0_0_20px_var(--ql-glow-gold)]",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-xs font-mono uppercase tracking-widest text-muted">
          {eyebrow}
        </span>
      )}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-serif font-semibold text-ink">{title}</h3>
        {actionSlot && <div>{actionSlot}</div>}
      </div>
      {description && (
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      )}
      {children}
    </section>
  );
}
```

#### 2. Screen Integration Template in `apps/web` (`apps/web/src/features/<track>/<screen>.tsx`)
- Must declare `"use client"` where state or hooks are needed.
- Must fetch data exclusively via `moonClient`.
- Must handle 4 distinct states: Loading, Error, Empty, and Success (R-27).
- Must use UI primitives (`Button`, `Input`) and composites from `@moonwitness/ui`.
- Must fetch copy via `useTranslationCatalog()` (`t` / `tm`) supporting `id` and `en`.

---

## 4. Track-by-Track Technical Specifications (Tracks 01 – 30)

Below is the complete architectural specification for all 30 tracks, detailing the `moonClient` API contract and the `@moonwitness/ui` / `apps/web` component specifications:

### Group A: Sacred Corpus, Research & Truth Provenance

#### 🔹 Track 01: Mushaf Typography & Diacritics Engine
- **Primary Packages:** `packages/ql_corpus`, `packages/ui`, `apps/web`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.corpus.glyphVariant(editionKey, surah, ayah)` -> `/corpus/editions/${segment(editionKey)}/surahs/${segment(String(surah))}/ayahs/${segment(String(ayah))}/glyphs`
  - DTOs:
    ```typescript
    export interface QuranAyahGlyphsDto {
      locator: string;
      surah: number;
      ayah: number;
      uthmaniText: string;
      fontVariableWeights: { minKerning: number; targetKerning: number };
      stopSigns: Array<{ position: number; sign: string; signType: "mandatory" | "permissible" | "forbidden" }>;
    }
    export interface QuranAyahGlyphsResponseDto {
      glyphs: QuranAyahGlyphsDto;
    }
    ```
  - Method: `moonClient.readAyahGlyphs(editionKey: string, surah: number, ayah: number): Promise<QuranAyahGlyphsResponseDto>`
- **UI Component Specification (`@moonwitness/ui` & `apps/web`):**
  - Component: `@moonwitness/ui/src/composites/quran-text.tsx` (`QuranText`)
  - Props: `text: string; stopSigns?: StopSignItem[]; scale?: "sm" | "md" | "lg" | "xl"; rtl?: boolean; lang?: string;`
  - Styling Tokens: `.ql-quran-text`, `font-serif`, `text-ink`, `leading-[2.6]`, `dir="rtl"`, `lang="ar"`, stop symbols styled with `text-acid`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Zero Cumulative Layout Shift (CLS) via explicit line-height and font metric fallbacks; `aria-label` providing phonetic plain-text reading for screen readers.

#### 🔹 Track 02: Dual-Stream Hermeneutic Reader
- **Primary Packages:** `apps/web/src/features/corpus/`, `@moonwitness/ui`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.corpus.parallelReading(sourceEditionKey, translationEditionKey, surah)` -> `/corpus/parallel?source=${segment(sourceEditionKey)}&translation=${segment(translationEditionKey)}&surah=${segment(String(surah))}`
  - DTOs:
    ```typescript
    export interface CorpusParallelAyahDto {
      surah: number;
      ayah: number;
      locator: string;
      sourcePassage: CorpusPassageDto;
      translationPassage: CorpusPassageDto;
    }
    export interface CorpusParallelResponseDto {
      surah: number;
      pairs: CorpusParallelAyahDto[];
    }
    ```
  - Method: `moonClient.readParallelSurah(sourceKey: string, translationKey: string, surah: number): Promise<CorpusParallelResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/corpus/dual-stream-reader.tsx` (`DualStreamReader`)
  - Composite: `packages/ui/src/composites/dual-pane-grid.tsx` (`DualPaneGrid`)
  - Styling Tokens: `grid grid-cols-1 md:grid-cols-2 gap-6`, border-hairline vertical separator, `bg-panel-deep`, synchronous scroll synchronization via ref observer.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 2 / MOTION 1. Distinct `lang="ar"` (RTL) and `lang="id"/"en"` (LTR) containers; synchronized highlight without flashing colors; keyboard shortcut (`J`/`K`) for ayah-by-ayah stepping.

#### 🔹 Track 03: Semantic Cross-Surah Knowledge Graph
- **Primary Packages:** `packages/ql_search`, `packages/ql_corpus`, `apps/web/src/features/graph/`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.graph.correlations(conceptId)` -> `/graph/correlations/${segment(conceptId)}`
  - DTOs:
    ```typescript
    export interface GraphNodeDto {
      id: string;
      label: string;
      kind: "concept" | "surah" | "prophet" | "event";
      weight: number;
    }
    export interface GraphEdgeDto {
      source: string;
      target: string;
      relationship: string;
      evidenceCount: number;
    }
    export interface KnowledgeGraphResponseDto {
      nodes: GraphNodeDto[];
      edges: GraphEdgeDto[];
    }
    ```
  - Method: `moonClient.getKnowledgeGraph(conceptId: string): Promise<KnowledgeGraphResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/graph/correlation-graph-canvas.tsx`
  - Composite: `packages/ui/src/composites/svg-graph-viewport.tsx` (`SvgGraphViewport`)
  - Styling Tokens: Pure SVG vector nodes (`stroke-hairline-strong`, `fill-panel`, `text-ink`), interactive nodes highlighted with `stroke-acid`, node glow capped via `var(--ql-glow-gold)`.
  - Anti-Slop & A11y: Dials: ENERGY 2 / RHYTHM 3 / MOTION 1. No continuous spinning canvas; static SVG layout with smooth transition on node selection; complete accessible table alternative (`<DataTable>`) available below canvas for keyboard and screen-reader users (WCAG 2.2 AA).

#### 🔹 Track 04: Verifiable Ayah Cryptographic Proofs & Attribution Stamp
- **Primary Packages:** `packages/ql_corpus`, `@moonwitness/ui`, `apps/web`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.corpus.attributionProof(editionKey, surah, ayah)` -> `/corpus/proofs/${segment(editionKey)}/${segment(String(surah))}/${segment(String(ayah))}`
  - DTOs:
    ```typescript
    export interface AyahAttributionProofDto {
      locator: string;
      editionKey: string;
      publisher: string;
      sha256Checksum: string;
      canonicalUri: string;
      stampFormattedText: string;
    }
    export interface AyahProofResponseDto {
      proof: AyahAttributionProofDto;
    }
    ```
  - Method: `moonClient.verifyAyahProof(editionKey: string, surah: number, ayah: number): Promise<AyahProofResponseDto>`
- **UI Component Specification:**
  - Component: `@moonwitness/ui/src/composites/attribution-badge.tsx` (`AttributionBadge`), `AttributionCopyModal`
  - Styling Tokens: `.ql-badge`, `border-hairline`, `bg-panel-well`, `text-acid-muted`, monospace checksum representation (`font-mono text-[10px]`).
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Real cryptographic SHA-256 hash (never simulated numbers R-17); copy button shows verified tooltip feedback; clipboard payload includes verifiable citation metadata.

#### 🔹 Track 05: Audio Tilawah Spatial Resonance
- **Primary Packages:** `packages/ui`, `apps/web/src/features/corpus/`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.corpus.audio(reciterKey, surah)` -> `/corpus/audio/${segment(reciterKey)}/${segment(String(surah))}`
  - DTOs:
    ```typescript
    export interface AudioVerseTimingDto {
      ayah: number;
      startMs: number;
      endMs: number;
    }
    export interface TilawahAudioTrackDto {
      reciterKey: string;
      reciterName: string;
      license: "public_domain" | "creative_commons_by";
      audioUrl: string;
      durationSec: number;
      timings: AudioVerseTimingDto[];
    }
    export interface TilawahAudioResponseDto {
      track: TilawahAudioTrackDto;
    }
    ```
  - Method: `moonClient.getTilawahAudio(reciterKey: string, surah: number): Promise<TilawahAudioResponseDto>`
- **UI Component Specification:**
  - Component: `@moonwitness/ui/src/composites/whispering-waveform.tsx` (`WhisperingWaveform`), `TilawahPlayerBar`
  - Styling Tokens: `.ql-audio-bar`, `bg-panel-edge`, `border-hairline`, animated bars capped at 60 FPS using HTML Canvas with reduced amplitude, active ayah highlighted with `border-acid`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 2 / MOTION 2. Waveform canvas stops under `prefers-reduced-motion`; keyboard play/pause (`Space`), rewind/forward (`Left`/`Right`); explicit accessible volume control with aria labels.

---

### Group B: Cognitive AI & Grounded Reasoning Engine

#### 🔹 Track 06: Hallucination-Shielded Grounded Chat
- **Primary Packages:** `packages/ql_chat`, `@moonwitness/agent-runtime`, `apps/web/src/features/assistant/`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.chat` -> `/chat` (POST)
  - DTOs (Enhanced `ChatResponseDto`):
    ```typescript
    export interface GroundedVerificationDto {
      verified: boolean;
      unverifiedCitations: string[];
      groundingScore: number;
    }
    export type GroundedChatResponseDto = {
      reply: string;
      groundingStatus: "grounded" | "insufficient_evidence";
      citations: ChatCitationDto[];
      verification?: GroundedVerificationDto;
    };
    ```
  - Method: `moonClient.sendChat(input: ChatRequestDto): Promise<ChatResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/assistant/grounded-message-item.tsx` (`GroundedMessageItem`)
  - Composite: `@moonwitness/ui/src/composites/citation-card.tsx` (`CitationCard`)
  - Styling Tokens: `.ql-chat-bubble`, `bg-panel-raised`, `border-hairline`, citation pills in `bg-panel-well text-acid border-hairline`, unverified warning in `text-warning bg-panel border-warning/40`.
  - Anti-Slop & A11y: Dials: ENERGY 2 / RHYTHM 2 / MOTION 1. No generic AI sparkle icons (R-04); explicit grounded badge with clickable locator modal; honest warning when evidence is insufficient (R-27, R-38).

#### 🔹 Track 07: Multi-Provider Failover Mesh
- **Primary Packages:** `packages/ql_ai`, `apps/api`, `apps/web/src/features/providers/`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.providers.failoverStatus` -> `/settings/providers/failover-mesh`
  - DTOs:
    ```typescript
    export interface ProviderMeshNodeDto {
      id: string;
      name: string;
      priority: number;
      latencyMs: number;
      healthy: boolean;
      lastHeartbeat: string;
    }
    export interface FailoverMeshStatusDto {
      activeProviderId: string;
      failoverCountLast24h: number;
      nodes: ProviderMeshNodeDto[];
    }
    ```
  - Method: `moonClient.getFailoverMeshStatus(): Promise<FailoverMeshStatusDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/providers/mesh-monitor-card.tsx` (`MeshMonitorCard`)
  - Composite: `@moonwitness/ui/src/composites/metric-row.tsx` (`MetricList`, `MetricRow`)
  - Styling Tokens: `.ql-card`, healthy node badge `text-success bg-panel`, latency indicator in `text-muted`, failover alert in `Alert variant="info"`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Real measured latency and timestamps (R-17); no decorative pulse dots (R-19).

#### 🔹 Track 08: Lexical Morphology Search & Root Word Indexer
- **Primary Packages:** `packages/ql_search`, `apps/web/src/features/search/`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.search.morphology` -> `/search/morphology?root=${segment(root)}`
  - DTOs:
    ```typescript
    export interface MorphologicalDerivationDto {
      lemma: string;
      partOfSpeech: string;
      occurrenceCount: number;
      sampleAyahs: Array<{ surah: number; ayah: number; textSnippet: string }>;
    }
    export interface RootMorphologyResponseDto {
      root: string;
      rootTransliteration: string;
      derivations: MorphologicalDerivationDto[];
    }
    ```
  - Method: `moonClient.searchMorphology(root: string): Promise<RootMorphologyResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/search/morphology-results-shelf.tsx`
  - Composite: `@moonwitness/ui/src/composites/list-option.tsx`, `packages/ui/src/components/data-table.tsx`
  - Styling Tokens: Root letters rendered in large Arabic glyphs (`font-serif text-2xl text-acid`), derivations structured in clean semantic table rows with `hover:bg-panel-raised`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 2 / MOTION 1. Input field paired with visible label and virtual Arabic keyboard assistant; full keyboard navigation through search results.

#### 🔹 Track 09: Quranic Morphological Visualizer (I'rab & Syntax Tree)
- **Primary Packages:** `apps/web/src/features/research/`, `@moonwitness/ui`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.research.syntaxTree(surah, ayah)` -> `/research/syntax-tree/${segment(String(surah))}/${segment(String(ayah))}`
  - DTOs:
    ```typescript
    export interface MorphologicalWordTokenDto {
      index: number;
      token: string;
      stem: string;
      posTag: string; // e.g. "V", "N", "PRON"
      grammaticalCase: "nominative" | "accusative" | "genitive" | "none";
      irabNote: string;
      governorIndex?: number;
    }
    export interface SyntaxTreeResponseDto {
      surah: number;
      ayah: number;
      tokens: MorphologicalWordTokenDto[];
    }
    ```
  - Method: `moonClient.getSyntaxTree(surah: number, ayah: number): Promise<SyntaxTreeResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/research/irab-syntax-tree.tsx` (`IrabSyntaxTree`)
  - Composite: `@moonwitness/ui/src/composites/syntax-token-node.tsx`
  - Styling Tokens: Token cards in `bg-panel-well border-hairline`, POS tag badge `text-acid-dark font-mono text-[11px]`, connecting lines in `stroke-hairline-strong`.
  - Anti-Slop & A11y: Dials: ENERGY 2 / RHYTHM 3 / MOTION 1. Token card click displays side panel (`SidePanel`) with detailed grammatical explanation; accessible tabular mode toggle for non-visual assistive technology.

#### 🔹 Track 10: Local-First Private AI Inference Mode (WebGPU)
- **Primary Packages:** `apps/web/src/features/assistant/`, `apps/web/src/features/search/`
- **Client SDK Contract:**
  - Client interface: `@moonwitness/web/features/ai/local-inference-engine.ts`
  - Contract:
    ```typescript
    export interface LocalInferenceCapabilities {
      webGpuSupported: boolean;
      modelLoaded: boolean;
      deviceMemoryGb?: number;
    }
    export interface LocalEmbeddingRequest {
      text: string;
    }
    export interface LocalEmbeddingResult {
      vector: Float32Array;
      inferenceTimeMs: number;
    }
    ```
  - Storage: In-memory WebGPU buffers + indexedDB weights cache (zero HTTP transport crossing).
- **UI Component Specification:**
  - Component: `apps/web/src/features/assistant/local-ai-toggle-widget.tsx`
  - Composite: `@moonwitness/ui/src/composites/theme-toggle.tsx` / `Button`
  - Styling Tokens: Privacy indicator badge `text-success border-success/30 bg-panel`, progress bar in `bg-panel-well` with `fill-acid`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Explicit device capability detection; no deceptive "instant" claims (real download progress shown R-38); clear explanation that user data never leaves the device.

---

### Group C: Spatial HUD, Visual World & Atmosphere

#### 🔹 Track 11: Universal Ambient Atmosphere Provider
- **Primary Packages:** `packages/ui/src/composites/ambient-atmosphere.tsx`, `apps/web`
- **UI Component Specification:**
  - Component: `@moonwitness/ui/src/composites/ambient-atmosphere.tsx` (`AmbientAtmosphere`)
  - Props: `enabled?: boolean; density?: "low" | "medium" | "zen"; particlesCount?: number; className?: string;`
  - Implementation: Pure HTML5 Canvas with `requestAnimationFrame`, rendering subtle gold/indigo stardust particles (opacity 0.02 - 0.08, CPU < 1%).
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Hard Gate compliance: automatically detects `@media (prefers-reduced-motion: reduce)` and disables animation completely, rendering a static CSS background; zero render-blocking scripts; uses `pointer-events-none` and `aria-hidden="true"`.

#### 🔹 Track 12: 5-Region 3D Holographic Orbit
- **Primary Packages:** `apps/web/src/features/dashboard/`, `@moonwitness/ui`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.dashboard.regionalTelemetry` -> `/dashboard/regions/telemetry`
  - DTOs:
    ```typescript
    export interface RegionTelemetryDto {
      regionId: string;
      name: string;
      nodeCount: number;
      syncHealth: "synced" | "syncing" | "stale";
      activeConnections: number;
      orbitPositionDeg: number;
    }
    export interface RegionalTelemetryResponseDto {
      regions: RegionTelemetryDto[];
    }
    ```
  - Method: `moonClient.getRegionalTelemetry(): Promise<RegionalTelemetryResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/dashboard/holographic-orbit-deck.tsx`
  - Composite: `@moonwitness/ui/src/composites/spatial-region.tsx` (`SpatialRegion`)
  - Styling Tokens: SVG orbit rings in `stroke-hairline-soft`, region planetary nodes in `fill-panel-raised stroke-hairline-strong`, active node ring in `stroke-acid shadow-hud`.
  - Anti-Slop & A11y: Dials: ENERGY 2 / RHYTHM 3 / MOTION 2. Orbit rotation smooth and controllable; interactive nodes reachable by `Tab` with visible focus rings; list view toggle provided for instant non-spatial navigation.

#### 🔹 Track 13: Micro-Chime Web Audio Interaction System
- **Primary Packages:** `@moonwitness/ui/src/composites/micro-chime.tsx`
- **Client SDK Interface:**
  - Pure Web Audio API utility (synthesizes 432 Hz / 528 Hz sine wave tones, duration 80-120ms with gentle gain exponential decay).
  - Contract: `triggerMicroChime(tone: "navigation" | "success" | "transition"): void`
- **UI Component Specification:**
  - Component: `@moonwitness/ui/src/composites/chime-toggle.tsx` (`ChimeToggle`), integrated into `SanctuaryHeader`
  - Props: `enabled: boolean; onToggle(): void; label: string;`
  - Styling Tokens: `.ql-button--ghost`, icon `Volume2` / `VolumeX`, `text-muted hover:text-acid`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Default state is strictly **MUTED**; activates only upon explicit user gesture (R-26); never plays background looping music; conforms to user audio interaction standards.

#### 🔹 Track 14: Sanctuary Minimalist Mode (Extreme Zen Mode)
- **Primary Packages:** `apps/web/src/features/corpus/`, `@moonwitness/ui`
- **UI Component Specification:**
  - Component: `apps/web/src/features/corpus/sanctuary-zen-stage.tsx`
  - Composite: `@moonwitness/ui/src/composites/sanctuary-header.tsx` (`SanctuaryHeader`)
  - Styling Tokens: Entire viewport darkens to `--color-panel-deeper` (`#070918`), sidebars and secondary chrome collapse off-canvas, typography enlarges to `text-3xl font-serif text-ink` with generous line-height `leading-[3]`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Single focal point; toggleable via keyboard shortcut (`Z` or `Escape` to exit); high contrast maintained (WCAG AA: text #f1ead9 on #070918 is 18.5:1 ratio).

#### 🔹 Track 15: Adaptive Spatial Density Engine (Phone to Ultra-wide 4K)
- **Primary Packages:** `@moonwitness/ui`, `apps/web`
- **UI Layout Specification:**
  - Layout Composite: `@moonwitness/ui/src/composites/adaptive-hud-shell.tsx`
  - Responsive Breakpoints:
    - Mobile (360px - 640px): Single-column reflow, bottom navigation bar, tap targets ≥ 44x44px.
    - Tablet / Laptop (641px - 1440px): Dual-column split, collapsible workspace sidebar.
    - Ultra-Wide / 4K (1441px - 3840px): Quad-pane spatial HUD, max text width clamped (`max-w-3xl`) to maintain comfortable reading eye tracking (45-75 characters per line).
  - Anti-Slop & A11y: Strict compliance with `antislop-layoutmobile`: no horizontal scroll leaks, no 2-state abrupt jumping, fluid typography using `clamp()`, media intrinsic aspect ratios.

---

### Group D: Harbor Community, Ethics & Governance

#### 🔹 Track 16: Architectural Covenant Signature Ledger
- **Primary Packages:** `apps/web/src/features/community/`, `packages/ql_auth`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.community.covenants` -> `/community/covenants`, `apiRoutes.community.signCovenant` -> `/community/covenants/sign`
  - DTOs:
    ```typescript
    export interface CovenantCommitmentDto {
      id: string;
      title: string;
      version: string;
      terms: string[];
      totalSignatures: number;
    }
    export interface SignCovenantRequestDto {
      covenantId: string;
      commitmentStatementsAccepted: boolean;
      contributorHandle: string;
    }
    export interface SignCovenantResponseDto {
      signatureHash: string;
      signedAt: string;
    }
    ```
  - Method: `moonClient.signCovenant(input: SignCovenantRequestDto): Promise<SignCovenantResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/community/covenant-signature-panel.tsx`
  - Composite: `@moonwitness/ui/src/atoms/button.tsx`, `packages/ui/src/atoms/checkbox.tsx`, `packages/ui/src/composites/card.tsx`
  - Styling Tokens: Parchment-like background in light mode (`bg-panel-well`), gold border accent (`border-acid`), signature hash in `font-mono text-xs text-acid-dark`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Checkboxes bound with visible `<label for>` tags; no fabricated signatures (real database query); explicit confirmation modal.

#### 🔹 Track 17: Sanad-Verified Review Pipeline
- **Primary Packages:** `packages/ql_workflow`, `apps/web/src/features/workflow/`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.workflow.sanadVerification(changeId)` -> `/workflow/changes/${segment(changeId)}/sanad`
  - DTOs:
    ```typescript
    export interface ReviewerVerificationDto {
      reviewerId: string;
      reviewerName: string;
      verifiedCredentials: string[];
      decision: "approved" | "changes_requested";
      signedAt: string;
    }
    export interface SanadPipelineStatusDto {
      changeId: string;
      requiredReviews: number;
      completedReviews: number;
      reviewers: ReviewerVerificationDto[];
      canPublish: boolean;
    }
    ```
  - Method: `moonClient.getSanadPipelineStatus(changeId: string): Promise<SanadPipelineStatusDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/workflow/sanad-verification-stepper.tsx`
  - Composite: `@moonwitness/ui/src/composites/workflow-status-badge.tsx`
  - Styling Tokens: Verified reviewer badge `border-success text-success bg-panel`, pending slot in `border-hairline-soft text-muted`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 2 / MOTION 1. No self-approval bypass; clear error alert when publishing is attempted without required dual signatures.

#### 🔹 Track 18: Collaborative Harbor Study Circles
- **Primary Packages:** `apps/web/src/features/community/`, `packages/ql_chat`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.community.studyCircles` -> `/community/study-circles`
  - DTOs:
    ```typescript
    export interface StudyCircleDto {
      id: string;
      title: string;
      assignedSurah: number;
      moderatorName: string;
      memberCount: number;
      status: "active" | "concluded";
      recentReflectionCount: number;
    }
    export interface StudyCircleListResponseDto {
      circles: StudyCircleDto[];
    }
    ```
  - Method: `moonClient.listStudyCircles(): Promise<StudyCircleListResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/community/study-circle-directory.tsx`
  - Composite: `@moonwitness/ui/src/composites/section-grid.tsx`, `packages/ui/src/composites/portal-card.tsx`
  - Styling Tokens: Circle cards in `ql-card bg-panel border-hairline`, member badge `text-ink-soft bg-panel-raised`.
  - Anti-Slop & A11y: Dials: ENERGY 2 / RHYTHM 2 / MOTION 1. Real member counts; honest empty state when no circles are active; keyboard navigation on cards.

#### 🔹 Track 19: Proof-of-Beneficial-Deeds Activity Ledger
- **Primary Packages:** `apps/web/src/features/community/`, `packages/ql_auth`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.community.deedsLedger` -> `/community/deeds-ledger`
  - DTOs:
    ```typescript
    export interface BeneficialDeedRecordDto {
      id: string;
      contributorName: string;
      actionKind: "typo_correction" | "translation_review" | "reference_verification";
      targetLocator: string;
      timestamp: string;
      verified: boolean;
    }
    export interface DeedsLedgerResponseDto {
      records: BeneficialDeedRecordDto[];
      totalContributions: number;
    }
    ```
  - Method: `moonClient.getDeedsLedger(): Promise<DeedsLedgerResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/community/deeds-activity-ledger.tsx`
  - Composite: `packages/ui/src/components/data-table.tsx` (`DataTable`)
  - Styling Tokens: Modest and solemn aesthetic without casino-style gamification (no coins, points, or celebratory fireworks), clean rows with `border-hairline`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Dignified spiritual tone; real timestamps and real verified actions (R-17, R-38).

#### 🔹 Track 20: Editorial Reflection & Ethics Checklist
- **Primary Packages:** `@moonwitness/ui/src/composites/ethics-dialog.tsx`, `apps/web`
- **UI Component Specification:**
  - Component: `@moonwitness/ui/src/composites/ethics-dialog.tsx` (`EthicsChecklistDialog`)
  - Props: `open: boolean; onClose(): void; onConfirm(): void; articleTitle: string;`
  - Checklist Items:
    1. Verified linguistic source citations.
    2. Zero unauthorized fatwa or legal rulings without authoritative attribution.
    3. Respectful tone adhering to the Sacred Corpus covenant.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Focus trapped inside modal (`focus-trap`); dialog closable via `Escape`; confirm button disabled until all criteria are manually checked.

---

### Group E: Command Deck & System Telemetry

#### 🔹 Track 21: Realtime Telemetry Orbit Monitor
- **Primary Packages:** `apps/web/src/features/dashboard/`, `packages/ql_cloudflare`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.telemetry.metrics` -> `/telemetry/orbit-metrics`
  - DTOs:
    ```typescript
    export interface SystemMetricDto {
      metricName: string;
      currentValue: number;
      unit: string;
      status: "healthy" | "degraded" | "critical";
      updatedAt: string;
    }
    export interface TelemetryMetricsResponseDto {
      uptimeSeconds: number;
      apiLatencyP95Ms: number;
      dnsConnectorsOnline: number;
      metrics: SystemMetricDto[];
    }
    ```
  - Method: `moonClient.getTelemetryMetrics(): Promise<TelemetryMetricsResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/dashboard/telemetry-orbit-widget.tsx`
  - Composite: `@moonwitness/ui/src/composites/metric-row.tsx` (`MetricList`, `MetricRow`)
  - Styling Tokens: `.ql-card`, status borders in `border-hairline`, healthy metrics in `text-success`, p95 latency in `font-mono text-acid`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 2 / MOTION 1. Real measured metrics; non-blocking polling interval (15s); screen-reader announcements on status degradation via `aria-live="polite"`.

#### 🔹 Track 22: Automated PO Parity Synchronizer Tooling
- **Primary Packages:** `packages/ql_i18n`, `apps/web/src/features/admin/`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.admin.translations.parityCheck` -> `/admin/translations/parity-check`
  - DTOs:
    ```typescript
    export interface TranslationParityReportDto {
      totalKeys: number;
      synchronizedKeys: number;
      missingInEn: string[];
      missingInId: string[];
      untranslatedCount: number;
    }
    ```
  - Method: `moonClient.checkTranslationParity(): Promise<TranslationParityReportDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/admin/translation-parity-card.tsx`
  - Composite: `@moonwitness/ui/src/components/alert.tsx`, `packages/ui/src/atoms/button.tsx`
  - Styling Tokens: Missing keys listed in monospace chips `bg-panel-well text-warning border-hairline`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. Exact key names reported; single-click "Sync Keys" action triggers automated schema parity.

#### 🔹 Track 23: Next-Gen Spotlight Command Palette
- **Primary Packages:** `@moonwitness/ui/src/composites/search-dialog.tsx`, `apps/web`
- **UI Component Specification:**
  - Component: `@moonwitness/ui/src/composites/command-palette.tsx` (`CommandPalette`)
  - Props: `open: boolean; onOpenChange(open: boolean): void; actions: CommandAction[]; onExecute(action: CommandAction): void;`
  - Capabilities:
    - Global shortcut: `Ctrl+K` / `Cmd+K`.
    - Prefix commands: `> theme light`, `> go dock`, `> surah 18`, `@search <query>`.
  - Styling Tokens: Backdrop in `var(--ql-backdrop)` (`rgba(2, 3, 12, 0.66)`), search box in `border-acid/50 bg-panel`, item active state in `.is-active` / `bg-panel-raised text-acid`.
  - Anti-Slop & A11y: Dials: ENERGY 2 / RHYTHM 2 / MOTION 1. `role="combobox"`, `aria-expanded`, arrow key navigation with wrap-around, `Escape` key close.

#### 🔹 Track 24: Studio Multi-Format Exporter
- **Primary Packages:** `apps/web/src/features/export/`, `@moonwitness/ui`
- **`moonClient` API Contract:**
  - Routes: `apiRoutes.export.format(type)` -> `/export/${segment(type)}`
  - DTOs:
    ```typescript
    export interface ExportResearchRequestDto {
      selectionIds: string[];
      format: "pdf" | "markdown" | "json";
      includeAttributionStamps: boolean;
    }
    export interface ExportResearchResponseDto {
      downloadUrl: string;
      expiresAt: string;
      byteSize: number;
    }
    ```
  - Method: `moonClient.exportResearchData(input: ExportResearchRequestDto): Promise<ExportResearchResponseDto>`
- **UI Component Specification:**
  - Component: `apps/web/src/features/export/studio-export-workspace.tsx`
  - Composite: `@moonwitness/ui/src/composites/page-header.tsx`, `Button`, `RadioGroup`
  - Styling Tokens: Format selection cards in `ql-card hover:border-acid`, preview pane formatted with `font-mono text-xs`.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 2 / MOTION 1. Real file download execution; loading spinner on document generation with progress announcement.

#### 🔹 Track 25: Resilient Offline PWA & Service Worker
- **Primary Packages:** `apps/web/public/`, `apps/web/src/features/offline/`
- **Client Service Worker Contract:**
  - Manifest: `apps/web/public/manifest.json`
  - Service worker: `sw.js` caching Mushaf text assets (`/corpus/editions/*`) and app shell.
- **UI Component Specification:**
  - Component: `@moonwitness/ui/src/composites/offline-status-pill.tsx` (`OfflineStatusPill`)
  - Styling Tokens: Fixed subtle pill `bg-panel border-hairline text-acid-muted text-xs`, online/offline indicator dot.
  - Anti-Slop & A11y: Dials: ENERGY 1 / RHYTHM 1 / MOTION 1. App remains fully readable offline; toast alert informs user when falling back to cached Mushaf data without blocking interactions.

---

### Group F: Engineering Excellence, Modularity & Performance

#### 🔹 Track 26: Modular Movement Componentization (`apps/web/src/app/page.tsx`)
- **Primary Packages:** `apps/web/src/features/landing/components/`
- **Decomposition Architecture:**
  - Split monolithic `page.tsx` (844 lines) into 5 focused movement modules (< 150 lines each):
    1. `HeroArrivalStage.tsx`: Movement 01 — Gate & Arrival (`HeroStage`, `SidebarBrand`, top navigation bar, search trigger).
    2. `UniversePortalDock.tsx`: Movement 02 — The Universe Portals (`PortalCard` grid, region dock links).
    3. `ExploreKnowledgeTreasury.tsx`: Movement 03 — Knowledge & Research Treasury (`SectionGrid`, catalog categories).
    4. `TransmissionsSanctuary.tsx`: Movement 04 — Transmissions Sanctuary (`TransmissionCard` stream, reflection feed).
    5. `ReturnFooterClosing.tsx`: Movement 05 — Solemn Closing Footer (`BRAND_DECLARATION`, localized links, copyright attribution).
- **Anti-Slop & A11y:** Dials: ENERGY 2 / RHYTHM 3 / MOTION 1. Each section has distinct rhythm and structure; no repetitive bento-box clones (R-05); semantic landmark tags (`<header>`, `<nav>`, `<main>`, `<footer>`).

#### 🔹 Track 27: Zero-Warning Strict Typing Hardening
- **Primary Packages:** Workspace-wide (`eslint.config.mjs`, `tsconfig.json`)
- **Strict Typing Guidelines:**
  - Explicit function callbacks require `this: void` annotation (e.g. `t(this: void, key: UiMessageKey): string`) to prevent unbound method warnings (`@typescript-eslint/unbound-method`).
  - No implicit `any`, no non-null assertions (`!`), no empty object types `{}`.
  - Max function complexity: 15; max nested callbacks: 2; max lines per file: 300.
  - All type imports use `import type { ... }`.

#### 🔹 Track 28: Web Bundle Budget Hardening
- **Primary Packages:** `apps/web/.size-budget.json`, `apps/web/scripts/check-bundle-budget.mjs`
- **Budget Enforcements:**
  - Target: Home route `/page` First Load JS reduced below **140 kB** (current baseline: 149.9 kB).
  - Optimization Mechanics:
    - Dynamic code-splitting via `next/dynamic` for heavy client modals: `SearchDialog` / `CommandPalette`, `TranslationAdminModal`.
    - SVG graph components dynamically loaded on interaction.
    - Zero heavy external libraries: Lucide icons imported individually.

#### 🔹 Track 29: Autonomous Workflow State Machine Testing
- **Primary Packages:** `packages/ql_workflow`, `packages/ql_workflow/tests/`
- **Test Matrix Specification:**
  - Test transitions: `staged` -> `reviewed` -> `approved` -> `published` -> `withdrawn`.
  - Security locks: self-approval prevention test (author ID == reviewer ID must reject with 403 Forbidden).
  - Lockdown state verification: published revisions cannot be mutated directly without new change request.

#### 🔹 Track 30: Comprehensive E2E Playwright Spatial Testing Suite
- **Primary Packages:** `apps/web/tests/e2e/`, Playwright configuration
- **E2E Test Suite Scope:**
  - Multi-device matrix: Mobile (iPhone 14 / Pixel 7 - 390px), Tablet (iPad Air - 820px), Desktop (1920x1080), Ultra-wide (3440x1440).
  - Visual regression testing: Verify zero horizontal overflow on mobile; verify no unstyled elements in dark and light themes.
  - Keyboard navigation journeys: Home -> Command Palette (Ctrl+K) -> Corpus Surah 18 -> Dual Reader -> Sanad Review Queue.

---

## 5. Caveats
1. **Read-Only Investigation:** This survey establishes architectural designs and contracts without directly mutating source code in packages or applications.
2. **Server-Side API Implementations:** While client DTOs and routes are fully mapped, actual server-side endpoint handlers reside in `apps/api` and corresponding `packages/ql_*` services, which must adhere strictly to these defined contracts.
3. **Third-Party Model Loading:** In Track 10 (WebGPU private inference), browser compatibility varies across devices; fallback to remote grounded server inference must remain seamless.

---

## 6. Conclusion
The API, frontend, and design system architecture of MoonWitness and A-L-L-A-H.COM is rigorously structured, strongly typed, and strictly governed:
1. `@moonwitness/moonclient` is the single authoritative client gateway. All requests must use its frozen `apiRoutes` and typed `MoonClient` methods with same-origin credentials and JSON boundaries.
2. `@moonwitness/ui` is the sole design system owner, featuring a closed semantic palette (`tokens.css`), `.ql-*` component classes, `.is-*` dynamic states, and accessible composites.
3. `apps/web` enforces complete isolation from server-side packages and bans raw form elements, inline styles, arbitrary hex values, and raw internal anchors via MW-ADR-020 lint rules.
4. The 30 strategic tracks now have clear, concrete, and consistent architectural specifications for API contracts, UI components, anti-slop dials, and accessibility criteria, ready for immediate execution.

---

## 7. Verification Method

To independently verify all findings and validate that the codebase adheres to these contracts:

1. **Verify `@moonwitness/moonclient` contracts and tests:**
   ```powershell
   pnpm --filter @moonwitness/moonclient test
   ```
   *Expected:* 15/15 tests pass.

2. **Verify `@moonwitness/ui` class contracts, tokens, and composites:**
   ```powershell
   pnpm --filter @moonwitness/ui test
   ```
   *Expected:* 47/47 tests pass without hex literal leaks or class displacement.

3. **Verify `apps/web` strict typechecking:**
   ```powershell
   pnpm --filter @moonwitness/web typecheck
   ```
   *Expected:* Exit code 0, 0 type errors.

4. **Verify ESLint MW-ADR-020 AST boundary enforcement:**
   ```powershell
   pnpm lint
   ```
   *Expected:* No violations of raw primitives, inline styles, or arbitrary palette colors.

5. **Verify Web Bundle Budget:**
   ```powershell
   NEXT_DIST_DIR=.next pnpm --filter @moonwitness/web build
   pnpm --filter @moonwitness/web size
   ```
   *Expected:* All routes remain within the 150 kB First Load JS ceiling.
