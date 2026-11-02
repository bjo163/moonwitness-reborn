# Asset Register

Every asset records source, status, intended use and accessibility treatment, as required by `VISUAL-WORLD-ASSET-LANGUAGE.md` section 8.

| File | Purpose | Source / provenance | Status | Alt text | Crop and fallback |
|---|---|---|---|---|---|
| `apps/web/public/hero-empire.jpg` | Home hero plate behind the text column | Generated concept art committed during the Home build. License and exact generation record not yet documented. | concept (in use) | Decorative (`alt=""`, `aria-hidden`) | Desktop wide. Mobile uses the veil gradient and `object-position`; the page works if the image fails. |
| `design/assets/mw-01-arrival-concept-v02.jpg` | Owner-supplied visual reference for Home | Supplied by the product owner in conversation on 2026-11-02. Generation tool and rights not recorded. | concept (reference only) | Not used in the product | Contains baked-in text and interface. Never used as a production background. |
| `apps/web/public/brand/emblem.svg` | Brand emblem next to the wordmark | Hand-authored vector, abstract gate arch and crescent (ODR-003). | approved by owner decision | Decorative when next to the wordmark text | Single colour via `currentColor`. Renders in both themes. |

Open items:
- Record the generation source and license for `hero-empire.jpg`.
- Add a mobile-specific crop if the focal point is lost at 390 px width.
