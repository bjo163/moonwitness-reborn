# Owner Decision Record

**Status:** Active
**Authority:** Product owner (delegated in conversation on 2026-11-02)
**Scope:** Home mockup `mw-01-arrival-concept-v02` and the rules it conflicts with
**Reversibility:** Every decision below can be reverted by editing this file and the affected component.

The Master Design Constitution (section 9) requires any exception to a higher-level rule to be recorded with its rationale. This file is that record. The original rule text in the other documents is not deleted; those documents point here.

## 1. Overrides

| ID | Rule overridden | Source | Decision | Limits |
|---|---|---|---|---|
| ODR-001 | Repeated identical cards are rejected | `IMPLEMENTATION-RECONCILIATION-AUDIT.md` P1, `DESIGN-DNA.md` sections 8 and 11 | The hero portal strip may use four equal tiles | Hero portal strip only. Movements 03, 05, 06 and 07 stay non-card compositions. |
| ODR-002 | Glass is an accent on one important layer | `DESIGN-DNA.md` section 11, antislop R-10 | The portal strip may use a blurred glass surface | One glass layer on the whole Home page. |
| ODR-003 | No logo or emblem without approval | `DESIGN-DNA.md` section 9, Constitution section 8 | An abstract emblem (gate arch and crescent) is approved | No calligraphy, scripture-like glyph, face or figure. Vector master in `apps/web/public/brand/emblem.svg`. |
| ODR-004 | Decorative metadata is removed | `IMPLEMENTATION-RECONCILIATION-AUDIT.md` P2 | `EST. 2026` and the values strip may appear in the hero base bar | Text comes from the i18n catalogs. No counters, coordinates or status readouts. |
| ODR-005 | Wide-tracked uppercase display text | antislop R-06 | Allowed for the hero wordmark | Hero only. |
| ODR-006 | Generic icon libraries | antislop R-04 | Icons are allowed in the top navigation | Each icon must name a real destination or action. |
| ODR-007 | Headquarter is not a public destination | `INFORMATION-ARCHITECTURE.md` section 3 | A restricted Headquarter tile may appear in the hero portal strip | Labelled as restricted. Links to `/command-center`, which redirects anonymous visitors to sign-in. Shows no protected data. |

Per antislop R-37, each row records that the owner chose to keep the named pattern.

## 2. Rules deliberately kept

These are not blockers for the mockup, and they protect honesty, safety or access:

- No fabricated claims: no invented numbers, testimonials, partner logos, "live" status for features that do not exist. Dock remains labelled Proposed.
- Sacred-content provenance (audit P0) and the ban on depicting prophets, angels or faces. A figure in hero artwork may only be unidentified, seen from behind, without halo, and never labelled.
- WCAG 2.2 AA: contrast of text over imagery, visible keyboard focus, reduced motion, no essential text inside images.
- No control without a real action. Search and avatar controls appear only when a signed-in destination exists.
- Technical rules in `AGENTS.md` (no raw `fetch` in `apps/web`, no raw form elements, no arbitrary colours, ID/EN catalog parity).

## 3. Asset notes

- `design/assets/mw-01-arrival-concept-v02.jpg` is an owner-supplied concept. It contains baked-in text and interface, so it is a reference, not a production hero. The hero stays `apps/web/public/hero-empire.jpg`.
- See `design/assets/ASSET-REGISTER.md` for source, status and alt text.
