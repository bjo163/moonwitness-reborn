# Moon UI — Design Token Contract

**Status:** Mapping specification; existing tokens remain authoritative.  
**Source inspected:** `packages/ui/styles/tokens.css`, `preset.css`, and `components.css` on `dev`.

## 1. Purpose

This document defines how A-L-L-A-H.COM, MoonWitness, Dock, Cockpit, and Headquarter consume one shared design system. It does not create a new palette or prescribe arbitrary new CSS values.

The existing `packages/ui/styles/tokens.css` is the single source of truth for shared colors and typography. The shared preset imports Tailwind, tokens, base styles, and component styles in the required order. Application screens must consume named tokens and exported components rather than introducing local hex values or duplicate component styling.

## 2. Existing semantic token families

| Family | Existing semantic names | Intended role |
|---|---|---|
| Text | `ink`, `ink-soft`, `muted`, `muted-dim` | Primary, supporting, and subdued text |
| Surface | `panel`, `panel-raised`, `panel-deep`, `panel-deeper`, `panel-edge`, `panel-well` | Content and environmental surfaces |
| Border | `hairline`, `hairline-soft`, `hairline-strong` | Structural separation |
| Brand accent | `acid`, `acid-dark`, `acid-muted`, `acid-shadow` | Focus, primary action, selected state |
| Semantic status | `success`, `warning`, `danger` | Actual state feedback |
| Base | `void` | Deep environmental base |
| Typography | `font-sans`, `font-display`, `font-mono` | Interface/body, selected editorial display, and technical metadata |
| Elevation | `shadow-hud`, `shadow-hud-sm` | Existing hard-edge elevation treatment |

These names are verified in the current token file. Use the exact exported names and existing CSS variable contract. The accent names are historical API names: `acid` currently renders Antique Gold, not acid green.

## 3. Current approved palette and themes

The current token implementation identifies the direction as **Empire of the Light / Cosmic Ivory & Antique Gold**.

- Dark theme: deep indigo night and obsidian foundations, warm ivory primary text, muted lavender-grey supporting text, and Antique Gold interaction emphasis.
- Light theme: parchment / warm ivory surfaces, deep ink text, and bronze/gold interaction emphasis.
- `acid` is a legacy semantic token name. Its current rendered value is gold; do not describe the current palette as acid-green.
- Home may open with a cinematic dark scene as a deliberate editorial choice, but readable content and shared application components must remain compatible with the supported theme strategy.

The token file includes a `data-theme="light"` adaptive layer. New experiences must not silently hard-code dark-only colors.

Theme switching behavior must be consistent with the current application preference contract. Do not invent a second theme state.

## 4. Component-level tokens

The existing token file also contains component-specific `--ql-*` variables for buttons, fields, cards, alerts, badges, and HUD-related components. These values belong to the shared UI package. A screen should use the corresponding exported component rather than consuming component-private variables directly.

Do not promote every component variable into a general-purpose Tailwind color. The palette is intentionally closed.

## 5. Semantic mapping for the new experiences

| Experience need | Token family |
|---|---|
| Public editorial text | `ink`, `ink-soft`, `muted` |
| Public scene / deep backdrop | `void`, `panel-deep`, `panel-deeper` |
| Reading surface | `panel`, `panel-raised` |
| Dividers and architecture edges | `hairline`, `hairline-soft`, `hairline-strong` |
| Primary interactive moment | Antique Gold via `acid` with the approved readable foreground |
| Secondary selected state | `acid-dark`, `acid-muted` where contrast is valid |
| Success / warning / danger | semantic status tokens only |
| Technical identifiers | `font-mono` |
| Editorial and navigation | `font-sans` |

Antique Gold is already an approved brand/interaction accent through the existing semantic token family; do not add a parallel gold palette or use it to communicate success, warning, or danger. Any new semantic color requires a proposal, contrast evidence, dark/light mapping, and token tests.

## 6. Typography contract

- Use the existing Inter-based `font-sans` for paragraphs, navigation, and controls.
- Use the existing Cormorant Garamond `font-display` selectively for editorial/monumental headings.
- Use Cascadia Code / `font-mono` for genuine technical metadata only.
- Use a responsive type scale; avoid fixed desktop-sized headings on mobile.
- Long-form content must prioritize line length, leading, paragraph rhythm, and language-specific wrapping.
- Keep heading levels semantic and sequential.
- Avoid tracking-heavy uppercase body copy.

No new font file or external font service is approved by this document.

## 7. Shape, spacing, and elevation

The current component system intentionally includes squared controls and hard-edge elevation. New mockups should build on this recognizable character rather than defaulting to rounded cards and soft shadows everywhere.

Spacing should use the existing workspace conventions and component primitives. A future token expansion must be justified by repeated use across multiple screens, not by one mockup.

Elevation is reserved for meaningful layering. Most surfaces should remain grounded.

## 8. Motion tokens and preferences

No new motion token names are frozen here. Reuse the project's existing motion conventions and honor reduced motion. If the design requires a shared motion scale, propose it in a separate reviewed change with durations, easing, reduced-motion behavior, and tests.

## 9. Prohibited implementation shortcuts

- No arbitrary hex colors in app markup or screen-scoped CSS.
- No default Tailwind palette colors as a substitute for semantic tokens.
- No inline `style` attributes or ad hoc `<style>` blocks in app screens.
- No duplicate shared component implementations.
- No direct edits to `apps/web/src/app/globals.css` beyond the approved preset import contract.
- No new theme state outside the existing preference model.
- No component-private `--ql-*` variable used as a public screen token.

Follow `AGENTS.md`, MW-ADR-020, the existing lint rules, and `@moonwitness/ui` exports.

## 10. Token change proposal checklist

Before adding or changing a token:
1. State the repeated design need and the screens that consume it.
2. Identify whether an existing semantic token already fits.
3. Define dark and light values where theme support applies.
4. Check text, non-text, focus, disabled, and interactive contrast.
5. Define the semantic name and intended role.
6. Update the single source of truth in `packages/ui/styles/tokens.css`.
7. Update token tests and any affected component tests.
8. Confirm the shared preset consumes the token.
9. Obtain GitHub Actions evidence for the exact reviewed SHA.

## 11. Acceptance

A design is token-compliant when all visible color, type, and component treatments map to existing shared tokens/components or an explicitly approved token change; both themes remain legible; and no screen creates a competing design system.
