# MoonWitness Master Design System

**Ecosystem context:** Moon UI is the shared design-system identity implemented by `@moonwitness/ui`; it is not a separate application. A-L-L-A-H.COM / EMPIRE OF THE LIGHT public identity is governed by [`docs/vision/ALLAH_COM_OFFICIAL_CANON.md`](docs/vision/ALLAH_COM_OFFICIAL_CANON.md).

**Status: PROPOSED · Design authority pending owner ratification**
**Edition:** MASTER FINAL v2.0 · Derived from the D30 requirement catalog (legacy PILLAR 08 section) and repository evidence

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