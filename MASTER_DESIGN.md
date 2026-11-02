# MoonWitness Master Design System

**Ecosystem context:** Moon UI is the shared design-system identity implemented by `@moonwitness/ui`; it is not a separate application. A-L-L-A-H.COM / EMPIRE OF THE LIGHT public identity is governed by [`docs/vision/ALLAH_COM_OFFICIAL_CANON.md`](docs/vision/ALLAH_COM_OFFICIAL_CANON.md).

**Status: PROPOSED · Design authority pending owner ratification**
**Edition:** MASTER FINAL v2.0 · Derived from the D30 requirement catalog (legacy PILLAR 08 section) and repository evidence

## Scoped decisions recorded under owner delegation (2026-11-02)

The owner explicitly delegated selection among the prepared MW-0606 options in chat. The resulting choices are limited to identity usage and governance; they do not ratify this full design system or approve new visual assets.

- Use the canonical ecosystem and product names as text wordmarks. Do not create or imply an approved visual logo.
- The ratified official canon is the only approved public ecosystem voice. Product and interface copy remains separate and must not invent endorsements, claims, or identity language.
- Ecosystem identity colors and MoonWitness semantic UI tokens are separately governed. `MASTER_DESIGN.md` owns product token direction and `@moonwitness/ui` owns token implementation; this does not select or ratify palette values.
- Tenant-specific names, logos, and theme overrides are out of scope for the current single-installation product model.
- Any future concept art or mockup is illustrative, not an approved identity asset, unless separately ratified.

---

## D20 — Master Design System

### 1. Design principles

- **Preserve first.** Design serves knowledge preservation, not distraction.
- **Source everything.** Attribution and provenance are visible, not hidden.
- **Respect context.** Locale, culture and uncertainty are part of the experience.
- **Human responsibility.** Automation assists; humans decide.
- **Privacy and rights.** Private fields and rights status are queryable and visible.
- **One design system.** `@moonwitness/ui` is the canonical component owner; external packages are references only after compatibility review.
- **Honest states.** Loading, error, empty and unavailable states are explicit, not templated.

### 2. Visual system requirements

The D30 requirements originating in the legacy PILLAR 08 visual-system section require:

- **Dark Theme and Light Theme.** Both required; current local UI is dark-only and must be extended.
- **Semantic Color Tokens.** Not hard-coded values; tokens carry meaning.
- **Typography System.** Hierarchy, scale, line-height, weights and locale-aware font choices.
- **Spacing.** Consistent scale, not arbitrary pixels.
- **Elevation.** Z-axis semantics for overlays, modals and depth.
- **Borders and Radii.** Consistent stroke and corner treatment.
- **Iconography.** Semantic, accessible, locale-neutral where possible.
- **Illustration.** Purposeful, attributed, rights-cleared.
- **Motion.** Meaningful, not decorative; reduced-motion support required.
- **Responsive Layout.** Mobile-first, container queries, fluid typography.
- **Accessibility.** WCAG-informed contrast, focus, keyboard navigation, ARIA, touch targets.

### 3. Current gaps

- `@moonwitness/ui` tokens are dark-only; `color-scheme: dark` declared.
- No locale framework found; no `id`/`en` message catalogs.
- External UI packages (`moonwitness-frontend-platform`, `rocksoul-ui`, `moonframe`) are references only after compatibility/license review.
- Local `moonframe` is dirty and 14 commits ahead; compatibility review pending.

#### Existing token inventory (observed snapshot, not ratified)

This inventory records declarations currently present in `packages/ui/styles/tokens.css`. Values are implementation facts, not an approved brand palette or a decision to preserve them. `@moonwitness/ui` remains the single canonical token owner under MW-ADR-020; the file is exported as `@moonwitness/ui/styles/tokens.css`, and `packages/ui/tests/tokens.test.ts` checks declared-token use and prevents component stylesheets from introducing independent color literals.

| Category | Existing names and values |
|---|---|
| Dark semantic colors | `--color-ink: #e9eee6`; `--color-ink-soft: #c6cfc0`; `--color-muted: #9da69a`; `--color-muted-dim: #7c8679`; `--color-panel: #111713`; `--color-panel-raised: #18211b`; `--color-panel-deep: #0b110b`; `--color-panel-deeper: #0a0e0b`; `--color-panel-edge: #121a13`; `--color-panel-well: #0c110e`; `--color-hairline: #354135`; `--color-hairline-soft: #2a342a`; `--color-hairline-strong: #38443a`; `--color-acid: #d7ff63`; `--color-acid-dark: #9ebd42`; `--color-acid-muted: #b8cc91`; `--color-acid-shadow: #738d32`; `--color-danger: #ff766d`; `--color-void: #050706`. |
| Typography families | `--font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; `--font-mono: "Cascadia Code", "SFMono-Regular", Consolas, monospace`. |
| General elevation | `--shadow-hud: 6px 6px 0 var(--color-void)`; `--shadow-hud-sm: 4px 4px 0 var(--color-void)`. |
| Component-specific opaque values | `--ql-on-acid: #141912`; `--ql-button-secondary-border: #687744`; `--ql-button-secondary-bg: #293320`; `--ql-button-secondary-bg-hover: #364329`; `--ql-button-ghost-bg-hover: #202a22`; `--ql-button-danger-border: #633d38`; `--ql-button-danger-bg: #311f1e`; `--ql-input-placeholder: #747d72`; `--ql-field-ink: #dce5d6`; `--ql-card-shadow: #080b09`; `--ql-alert-error-border: #70413b`; `--ql-alert-error-bg: #251615`; `--ql-alert-error-ink: #ffb6aa`; `--ql-badge-default-border: #53613d`; `--ql-badge-default-bg: #20281b`; `--ql-hud-panel: #101612`; `--ql-nav-active-border: #3b4937`; `--ql-nav-active-bg: #192119`; `--ql-hud-topbar-border: #2e392f`; `--ql-hud-user-border: #566543`; `--ql-hud-user-bg: #293220`; `--ql-hud-user-ink: #eff8dd`; `--ql-hud-user-shadow: #10150e`; `--ql-hud-assistant-border: #607444`; `--ql-hud-assistant-bg: #29351f`; `--ql-hud-composer-border: #495540`; `--ql-hud-composer-border-focus: #859e56`; `--ql-hud-status-border: #374532`; `--ql-hud-status-bg: #151d15`; `--ql-hud-status-ink: #cfdda8`; `--ql-hud-auth-bg: #090d0a`; `--ql-hud-auth-card-border: #49563e`; `--ql-hud-auth-card-shadow: #030504`. |
| Component-specific translucent values | `--ql-hud-grid-line: rgba(185, 204, 157, 0.025)`; `--ql-hud-auth-grid-line: rgba(185, 204, 157, 0.04)`; `--ql-table-row-border: rgba(56, 68, 58, 0.65)`; `--ql-table-row-hover: rgba(215, 255, 99, 0.045)`; `--ql-hud-app-glow: rgba(84, 111, 54, 0.14)`; `--ql-backdrop: rgba(0, 0, 0, 0.58)`; `--ql-scanline: rgba(255, 255, 255, 0.016)`; `--ql-hud-sidebar-tint: rgba(208, 255, 92, 0.045)`; `--ql-hud-topbar-bg: rgba(11, 16, 12, 0.78)`; `--ql-hud-composer-bg: rgba(15, 21, 16, 0.97)`; `--ql-hud-composer-sheen: rgba(220, 255, 133, 0.08)`; `--ql-hud-auth-glow: rgba(115, 145, 66, 0.2)`; `--ql-hud-auth-card-tint: rgba(205, 255, 95, 0.055)`; `--ql-hud-auth-card-glow: rgba(145, 185, 78, 0.09)`; `--ql-side-panel-tint: rgba(215, 255, 99, 0.055)`; `--ql-side-panel-shadow: rgba(0, 0, 0, 0.4)`. |
| Legacy aliases | `--ql-ui-ink`, `--ql-ui-ink-soft`, `--ql-ui-muted`, `--ql-ui-panel`, `--ql-ui-panel-raised`, `--ql-ui-panel-edge`, `--ql-ui-panel-well`, `--ql-ui-border`, `--ql-ui-hairline`, `--ql-ui-acid`, `--ql-ui-acid-dark`, `--ql-ui-acid-muted`, `--ql-ui-danger`, `--ql-ui-void`, `--ql-ui-font-mono`, `--ql-ui-font-sans` resolve to their matching `--color-*`/`--font-*` values in the same file. They are compatibility aliases, not a second token owner. |

| Required token area | Observed state | Gap before acceptance |
|---|---|---|
| Light theme | No light-theme semantic token set; `base.css` declares `color-scheme: dark`. | Define and review light values, theme selectors, and contrast behavior before claiming light-theme support. |
| Typography scale | Font-family tokens only. Component CSS still contains direct font sizes, weights, line heights, and letter spacing. | Decide named semantic roles and values, including locale needs; no scale is ratified. |
| Spacing | No semantic spacing custom properties are declared in `tokens.css`; component styles use direct `rem`/`px` values and utilities. | Establish a named scale and map consumers; do not infer a canonical scale from current literals. |
| Elevation | Two general shadow tokens exist; additional component shadow/tint variables are local to components. | Review semantic levels and component exceptions; existing shadow values are not an approved elevation system. |
| Borders and radii | Semantic border-color tokens exist. Border widths and radii are literals in component CSS, including square, `0.75rem`, and circular treatments. | Name any shared width/radius tokens only after direction and component review. |
| Focus | Focus styles use the acid color alias with a literal `2px` outline and `3px`, `2px`, or `-2px` offsets in component rules. | No dedicated focus color, width, or offset tokens; verify contrast and all interactive states. |
| Status | `--color-danger` and error-specific component values exist; HUD status values are component-specific. | No shared success, warning, or informational semantic tokens; define only after status meanings and contrast are reviewed. |

No values were added or changed by this inventory. In particular, it does not select a palette, authorize a theme implementation, or claim that existing color values pass contrast review in every context.

### 4. Theme system

Both dark and light themes must be supported via semantic tokens. The theme switch must:

- Persist per user (signed-in) or locally (anonymous).
- Respect system preference as initial default where not overridden.
- Not break layout, contrast or component states.
- Work in both `id` and `en` locales.

### 5. Component system

`@moonwitness/ui` owns reusable components. External component libraries are not added as runtime dependencies without explicit ADR.

**Required component categories:**

- **Primitives.** Button, input, label, checkbox, radio, select, textarea, switch, slider.
- **Navigation.** App shell, sidebar, breadcrumb, tabs, pagination.
- **Data display.** Table, list, card, badge, tooltip, popover, modal, drawer.
- **Feedback.** Alert, progress, spinner, skeleton, toast.
- **Domain instruments.** Source reader, passage viewer, evidence linker, claim editor, review panel, publication workflow, research workspace, journey tracker.
- **Templates.** Reader page, explorer page, workspace page, admin page, creative page.

### 6. Internationalization (D21)

The D30 requirements originating in the legacy PILLAR 08 internationalization section specify:

**Initial locales:** Indonesian (`id`) and English (`en`).

**Locale preference chain:**
1. Explicit URL locale.
2. Saved user preference.
3. Account preference.
4. Accept-Language header.
5. Default locale.

**Requirements:**

- Complete translation catalog with type-safe keys.
- Translation parity tests.
- Localized navigation, validation messages, accessibility labels.
- Localized emails, date/number formatting.
- Route preservation across locale switch.
- SEO metadata per locale.
- RTL support (future-ready; not initial requirement).
- Original source-language preservation; never translate canonical source text merely because application language changes.
- Do not use precise geolocation merely to select a language.

**Implementation rules:**

- Use namespaced message catalogs with typed keys.
- Fail lint/build on missing required translations where feasible.
- Never use translation as a substitute for canonical original text.
- Preserve exact punctuation and normalization metadata for source passages.
- Include locale in cache keys when response is localized.
- Avoid concatenating fragments that break grammar.

**Testing:**

Test locale switch and persistence, missing-key fallback, long-string layout, date/time formatting, search locale and mixed-language content, keyboard/screen reader labels in both locales, and responsive layout. Add RTL-ready primitives before an RTL locale is approved.

### 7. Accessibility

- Semantic HTML (headings, landmarks, lists, forms).
- ARIA labels where native semantics are insufficient.
- Focus-visible states on all interactive elements.
- Keyboard navigation for all surfaces.
- Sufficient color contrast (WCAG AA minimum; AAA target where feasible).
- Tap targets sized for touch (minimum 44x44 CSS pixels).
- Reduced motion mode honored.
- Screen reader testing in both `id` and `en`.

### 8. Responsive design

- Mobile-first breakpoints.
- Container queries for component-level responsiveness.
- Fluid typography and spacing scales.
- Layout gracefully degrades from large to small screens.
- No horizontal scroll on standard content pages.

### 9. Application shell

One app shell with role-checked routes. No separate public/admin/command-center applications.

**Candidate routes:**

- Reader (corpus/source browsing).
- Explorer (entities, events, persons, stories).
- Workspace (research, evidence, claims).
- Creative (characters, journeys, storytelling).
- Admin (publication, roles, configuration — role-gated).

### 10. Non-goals

- A second design system parallel to `@moonwitness/ui`.
- Importing external UI packages without compatibility/rights review.
- Visual direction that conflicts with source attribution and honesty.
- Decorative motion or illustration that distracts from knowledge work.

---

**Gate:** This design system is a planning document. No production feature coding begins until the owner reviews and ratifies the visual direction, theme system, component inventory, and i18n framework.