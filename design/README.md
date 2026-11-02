# A-L-L-A-H.COM & MoonWitness Design Library

**Status:** Foundation documentation in progress; implementation is not authorized by these documents.  
**Repository:** `bjo163/moonwitness-reborn`  
**Branch:** `dev`  
**Language policy:** Indonesian is the default product language; English remains supported.  
**Design mode:** Antislop DURING, selected for this session.

This folder is the working design source for the A-L-L-A-H.COM public experience and the connected MoonWitness product ecosystem. Documents are intentionally separated by responsibility so that visual direction, product boundaries, user journeys, and screen specifications do not contradict or duplicate one another.

## Document map

| Document | Responsibility | Status |
|---|---|---|
| [VISION.md](./VISION.md) | Product purpose, audience, promise, principles, success definition | Foundation |
| [INFORMATION-ARCHITECTURE.md](./INFORMATION-ARCHITECTURE.md) | Sitemap, product boundaries, navigation, roles, content model | Foundation |
| [USER-JOURNEY.md](./USER-JOURNEY.md) | End-to-end journeys, entry/return paths, states, trust and conversion | Foundation |
| [DESIGN-DNA.md](./DESIGN-DNA.md) | Distinctive art direction, visual grammar, motion, HUD and anti-slop rules | Foundation |
| [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) | Semantic token contract mapped to the existing Moon UI system | Foundation |
| [HOME-BLUEPRINT.md](./HOME-BLUEPRINT.md) | Full public Home experience and section-by-section behavior | Foundation |
| [MOCKUP-SPEC.md](./MOCKUP-SPEC.md) | Mockup sequence, frames, responsive coverage and review gates | Foundation |
| [HEADQUARTER-SPATIAL-BLUEPRINT.md](./HEADQUARTER-SPATIAL-BLUEPRINT.md) | Headquarter spatial command center | Existing |

## Reading order

1. Vision
2. Information architecture
3. User journeys
4. Design DNA
5. Design tokens
6. Home blueprint
7. Headquarter blueprint
8. Mockup specification

## Product boundary at a glance

- **A-L-L-A-H.COM Home:** public front door and orientation layer for the wider Empire of the Light.
- **MoonWitness:** narrative, transmissions, archive, and the creative/research story universe.
- **Dock:** community and participation.
- **Cockpit:** the user's personal workspace, tools, and personal controls.
- **Headquarter:** ecosystem coordination, governance, and operational command.
- **Moon UI:** shared interface system, components, tokens, and interaction conventions.

These are distinct responsibilities connected by one coherent identity. They are not interchangeable names for one dashboard.

## Non-negotiable project constraints

- Documentation and mockups come before implementation.
- No implementation, deployment, domain routing, database changes, or backend changes are implied by these documents.
- Keep the current repository architecture: Next.js web app, `@moonwitness/moonclient`, `@moonwitness/ui`, QlOrm and `ql_*` domain addons.
- No parallel backend, data authority, identity model, or browser-to-database path.
- Use existing Moon UI tokens and components; do not invent a second token system.
- Indonesian is the default UI language; keep English catalog coverage.
- Never invent users, testimonials, metrics, live system status, partnerships, scientific claims, or religious authority.
- Every action shown in a mockup must have a real destination or be explicitly marked as a future concept.
- Respect accessibility, keyboard use, reduced motion, touch, mobile reflow, and all relevant UI states.
- Preserve the distinction between faith/narrative/creative interpretation and verifiable scientific or historical evidence.

## Status vocabulary

- **Proposed:** a documented direction, not implemented.
- **Designed:** represented in an approved design or mockup.
- **Implemented:** present in repository code.
- **Tested:** automated or manual test evidence exists.
- **Verified:** behavior and evidence have been checked against the acceptance criteria.
- **Deployed:** available in a named environment with a verified deployment reference.

Never promote a status without evidence.

## Change control

Update the relevant document when a product boundary, design principle, route, content structure, or interaction contract changes. Keep one source of truth for each topic. Do not create issue trackers or duplicate project task status inside this folder; GitHub Issues remain the task register and the Wiki remains canonical project documentation where applicable.

## Current delivery boundary

The current deliverable is the design foundation. Next is visual mockup work in the order specified by `MOCKUP-SPEC.md`. Code changes begin only after the relevant design direction and mockups are reviewed and explicitly approved.
