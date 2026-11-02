# A-L-L-A-H.COM Home — Implementation Reconciliation Audit

**Audit date:** 2026-11-02  
**Repository:** `bjo163/moonwitness-reborn`  
**Branch:** `dev`  
**Reviewed HEAD:** `f60a418bda8754b618d1abdaa57706b244ce5825`  
**Scope:** Static design/content review of the latest Home implementation against the design library.  
**Not performed:** Runtime browser QA, automated tests, accessibility testing, production verification, or code changes.

## 1. Executive finding

The latest `dev` commit implements a substantial eight-movement Home sequence and adds shared `SpatialRegion` and `TransmissionCard` UI composites. This is real repository implementation, not merely a mockup.

However, the implementation and design library are not yet fully reconciled. The most important gaps are:

1. The current Moon UI palette has moved to Cosmic Ivory & Antique Gold, while some design documents still described acid green as the primary accent.
2. Several Home movements use repeated card-grid composition even though the approved Home blueprint requires distinct authored compositions and explicitly rejects a repeated card-grid language.
3. The featured transmission contains fixed sacred-content copy and a strong provenance label without an explicit edition/translation/source record or a verse-specific destination in the component contract.
4. Some navigation and footer elements look like functional destinations but are either hard-coded, point to a section rather than a product, or render as plain text.
5. Community and member copy describes capabilities that must be checked against actual product availability before being presented as current features.

The design work below records these gaps and establishes the correction order. It does not modify application code or declare the current implementation approved.

## 2. Evidence and limits

Reviewed:
- Current `dev` branch head and its latest commit diff.
- `apps/web/src/app/page.tsx` as represented by the latest commit.
- Current `packages/ui/styles/tokens.css`.
- Design library: Home blueprint, Information Architecture, Design DNA, Design Tokens, Master Design Constitution, Mockup Specification, and README.
- Current App Router directory listing for the public routes referenced by the Home implementation.

The presence of a route directory is not proof that its content, data source, permission behavior, or user journey is complete. No route was executed in a browser during this audit.

## 3. Findings

### P0 — Sacred-content provenance and wording

**Observed**
- The featured transmission uses a fixed excerpt attributed to Surah Al-Fatihah (1:1–7).
- The visible provenance label is `Transmisi Wahyu Sahih` / `Verified Canonical Revelation`.
- The component links to the generic `/corpus` route rather than a clearly identified verse-range destination.
- The displayed excerpt is a selected rendering, but the interface does not identify the translation edition, translator, text source, or whether the excerpt is a paraphrase or translation.

**Why this matters**
A sacred text must not be given a vague editorial verification badge. The source identity, exact verse range, translation edition, and displayed-text status must be unambiguous. The UI must not suggest that the website itself certifies divine authority.

**Design correction**
- Replace the generic status-like provenance label with a source descriptor such as `Al-Qur'an · Al-Fatihah 1:1–7`.
- Record the canonical Arabic text source and the exact translation edition/translator if a translation is displayed.
- Label any shortened rendering as an excerpt and preserve the full verse context at the destination.
- Link to the exact canonical passage when that route exists; otherwise link to the corpus index and do not imply a deep link.
- Keep source metadata separate from UI status badges.

**Gate:** No sacred excerpt is approved for public Home until its source, edition, range, and rendering are checked.

### P1 — Palette documentation drift

**Observed**
- Current `tokens.css` declares deep indigo / obsidian foundations, warm ivory text, and Antique Gold accent values.
- The token family still uses the legacy semantic names `acid`, `acid-dark`, `acid-muted`, and `acid-shadow`.
- Older design prose described acid green as the signature interaction accent.

**Correction**
The current approved direction is Cosmic Ivory & Antique Gold. The token names are a compatibility contract, not a description of their current hue. Gold is a brand/interaction accent and must not be used as success, warning, or danger feedback. Both dark and light theme mappings remain part of the shared system.

**Status:** The Master Design Constitution, Design DNA, Design Token Contract, and Headquarter Spatial Blueprint have been aligned with the current token implementation in this audit sequence.

### P1 — Repeated composition and anti-slop drift

**Observed**
- Movement 02 uses a portal-card grid.
- Movement 03 uses three similar destination cards.
- Movement 05 uses four equal topic tiles.
- Movement 06 uses two parallel content panels.
- Movement 07 uses two parallel access panels.

**Why this matters**
The Home blueprint calls for eight different narrative movements, not eight instances of a repeated component template. The Universe is specifically described as an authored spatial composition rather than a grid of identical app cards. The Design DNA also says that section rhythm must come from content, not repeated card grids.

**Design correction**
- Treat Movement 02 as the principal spatial relationship map: unequal scale, distinct silhouettes, clear hierarchy, and a semantic list alternative.
- Give Explore an editorial index or layered discovery composition rather than another equal-card set.
- Make Discover a taxonomy / topic navigation instrument with clear hierarchy, not a second card mosaic.
- Make Community feel like a place of participation and expectations, not two generic value cards.
- Make Your Journey a clear choice between public exploration and authenticated personal work, without presenting either as a dashboard tile.
- Retain cards only where the information type genuinely benefits from a contained unit.

**Gate:** MW-01 and MW-02 must establish the visual grammar before the other mockups are composed.

### P1 — Navigation and destination truth

**Observed**
- Several primary navigation labels are hard-coded in English rather than sourced from the locale catalog.
- The Dock portal currently points to the Home community section anchor, not to a distinct Dock product destination.
- The footer labels for ecosystem constitution, privacy, and ethics/terms are rendered as text spans rather than navigable links.
- The implementation contains links to `/corpus`, `/research`, `/models`, and `/workflow`; matching route directories exist, but this audit has not verified their page semantics or end-to-end completion.

**Design correction**
- All visible navigation labels must come from the Indonesian/English translation catalogs.
- Distinguish `Jump to Community section` from `Enter Dock`. Do not imply Dock is open if the Dock route or product entry is not available.
- Footer items must be actual links only when a canonical destination exists. Otherwise omit them until their destination is ready.
- Review every Home link against the route contract: path, owner, access class, canonical destination, and fallback.
- Keep route presence, feature availability, and product readiness as separate facts.

### P1 — Community and member capability claims

**Observed**
- Community copy describes a collaboration space and says contributions are recorded and accountable.
- Member copy says users can save research, connect personal AI models in Cockpit, and contribute.
- Dock is also marked as proposed in the current section.

**Why this matters**
Copy must not promise capabilities that are not currently available, authorized, or backed by the relevant product/API.

**Design correction**
- Keep proposed capabilities visibly described as planned, or rewrite the copy as an explanation of the product's intended purpose rather than a claim that the feature is live.
- Verify the real submission, moderation, audit, personal-save, and AI-connection flows before using present-tense capability claims.
- Avoid implying that all contributions are automatically recorded or that a complete audit trail exists unless the system confirms it.

### P2 — Closing statement and editorial source

**Observed**
- The closing movement contains a broad theological-sounding statement about accountability and the recompense of good deeds.
- It is presented as a quotation-style editorial block without an adjacent source attribution.

**Design correction**
Choose one:
1. Treat it explicitly as original editorial reflection and remove quotation styling that could imply scripture; or
2. If it is intended as a religious quotation or paraphrase, attach the exact Qur'anic/hadith reference and a reviewed translation.

Do not blur original project copy, paraphrase, and scripture.

### P2 — Visual labels and metadata

**Observed**
- The footer includes `EST. 2026`.
- The UI uses movement labels and other editorial eyebrow text.

**Design correction**
- Keep only metadata that serves orientation or authorship.
- Avoid labels that simulate a system console or add atmosphere without meaning.
- Do not add decorative coordinates, counters, scanlines, radar, or status readouts to make the page appear more technical.

## 4. Route and content verification matrix

| Destination / element | Repository evidence | Audit status |
|---|---|---|
| `/corpus` | Route directory exists | Route presence only; page/data/deep-link behavior unverified |
| `/research` | Route directory exists | Route presence only; page/data behavior unverified |
| `/models` | Route directory exists | Route presence only; page/data behavior unverified |
| `/workflow` | Route directory exists | Route presence only; semantic fit for the linked topic unverified |
| Dock product entry | Home anchor exists | Not evidence of a separate Dock product route |
| Footer policy destinations | Text labels are present | Not navigable links in the reviewed Home markup |
| Featured Al-Fatihah passage | Fixed copy and generic corpus link are present | Source edition and exact destination require verification |

## 5. Prioritized design remediation

| Priority | Task | Required evidence to close |
|---|---|---|
| P0 | Sacred passage provenance and exact destination | Source record, translation edition, verse range, approved label |
| P1 | Reconcile palette and typography documentation | Shared token contract and matching design prose |
| P1 | Re-compose repeated Home movements | Distinct composition intent for each movement; MW-01/MW-02 review |
| P1 | Verify Home navigation and footer destinations | Route contract with real destination and access behavior |
| P1 | Reconcile community/member copy with actual capability | Feature owner/source and honest availability wording |
| P2 | Review closing statement provenance | Explicit editorial label or exact source reference |
| P2 | Remove decorative metadata without user value | Purpose statement for each visible label |

## 6. Design acceptance checklist

- [ ] Eight movements have distinct compositional roles, not one repeated card template.
- [ ] Cosmic Ivory & Antique Gold is consistently described across design documents.
- [ ] Existing Moon UI tokens remain the only color source of truth.
- [ ] Sacred text has exact source, edition, verse range, and rendering status.
- [ ] No status badge is used as a substitute for source provenance.
- [ ] Every navigation label is localized.
- [ ] Every visible link has a real canonical destination or is clearly marked proposed.
- [ ] Dock and Cockpit remain distinct product responsibilities.
- [ ] Community/member capability claims are backed by real functionality.
- [ ] Closing editorial copy is distinguished from scripture and sourced paraphrase.
- [ ] Desktop, tablet, mobile, keyboard, reduced-motion, and failure states are reviewed.
- [ ] No implementation or deployment status is inferred from design documentation.

## 7. Delivery boundary

This audit is a design and content-governance artifact. It does not modify application code, route behavior, API contracts, data models, visual assets, or deployment settings. The current Home implementation remains **implemented in the repository but not design-approved or runtime-verified by this audit**.

The next design-only work is to close the P0/P1 findings and then review the visual mockup sequence. Implementation changes require a separate explicit authorization.

> **Owner decision:** exceptions to this document for the Home mockup are recorded in [OWNER-DECISIONS.md](./OWNER-DECISIONS.md).
