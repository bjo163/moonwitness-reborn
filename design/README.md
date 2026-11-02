# A-L-L-A-H.COM & MoonWitness Design Library

**Status:** Design foundation and art-direction contracts  
**Repository:** `bjo163/moonwitness-reborn`  
**Branch:** `dev`  
**Language policy:** Indonesian is the default product language; English remains supported.  
**Design mode:** Antislop DURING.

This folder is the source of truth for design intent, product boundaries, visual language, interaction behavior, responsive composition, and mockup review. Documents are separated by responsibility to prevent duplication and contradiction.

## Document map

| Document | Responsibility |
|---|---|
| [MASTER-DESIGN-CONSTITUTION.md](./MASTER-DESIGN-CONSTITUTION.md) | Highest-level design laws, decision hierarchy, approval gate |
| [VISION.md](./VISION.md) | Product purpose, audience, promise, principles, success definition |
| [INFORMATION-ARCHITECTURE.md](./INFORMATION-ARCHITECTURE.md) | Sitemap, product boundaries, navigation, roles, content model |
| [USER-JOURNEY.md](./USER-JOURNEY.md) | End-to-end journeys, entry/return paths, states, trust and conversion |
| [DESIGN-DNA.md](./DESIGN-DNA.md) | Distinctive art direction, visual grammar, motion, HUD and anti-slop rules |
| [VISUAL-WORLD-ASSET-LANGUAGE.md](./VISUAL-WORLD-ASSET-LANGUAGE.md) | World grammar, destination art direction, material/light, asset provenance |
| [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) | Semantic token contract mapped to the existing Moon UI system |
| [INTERACTION-MOTION-SOUND.md](./INTERACTION-MOTION-SOUND.md) | Input, navigation choreography, motion, sound and state truth |
| [RESPONSIVE-ACCESSIBILITY-QA.md](./RESPONSIVE-ACCESSIBILITY-QA.md) | Responsive art direction, WCAG review, test matrix and acceptance gates |
| [HOME-BLUEPRINT.md](./HOME-BLUEPRINT.md) | Full public Home experience and section-by-section behavior |
| [MOCKUP-SPEC.md](./MOCKUP-SPEC.md) | Nine mockup sequence, frames, responsive coverage and review gates |
| [HEADQUARTER-SPATIAL-BLUEPRINT.md](./HEADQUARTER-SPATIAL-BLUEPRINT.md) | Headquarter spatial command center and six functional regions |
| [SYSTEM-OBSERVATORY-AUTOMATION-ARCHITECTURE.md](./SYSTEM-OBSERVATORY-AUTOMATION-ARCHITECTURE.md) | System Observatory ownership, monitoring, automation, native ARSY runtime, browser execution and governance |
| [ARSY-RESEARCH-AND-IMPLEMENTATION-ROADMAP.md](./ARSY-RESEARCH-AND-IMPLEMENTATION-ROADMAP.md) | Research synthesis, repository audit, native intelligence design, evaluation strategy and implementation sequence |
| [IMPLEMENTATION-RECONCILIATION-AUDIT.md](./IMPLEMENTATION-RECONCILIATION-AUDIT.md) | Static review of the latest Home implementation against design, route, content, and trust contracts |

## Reading order

1. Master design constitution
2. Product vision and information architecture
3. User journeys
4. Design DNA and visual world / asset language
5. Design tokens and interaction / motion / sound
6. Responsive / accessibility QA
7. Home and Headquarter blueprints
8. System Observatory operational architecture and ARSY direction\n9. ARSY research synthesis and implementation roadmap
9. Implementation reconciliation audit
10. Mockup specification and visual review

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
- No implementation, deployment, domain routing, database changes, or backend changes are implied by design documents.
- Keep the current repository architecture: Next.js web app, `@moonwitness/moonclient`, `@moonwitness/ui`, QlOrm and `ql_*` domain addons.
- No parallel backend, data authority, identity model, or browser-to-database path.
- Use existing Moon UI tokens and components; do not invent a second token system.
- Indonesian is the default UI language; keep English catalog coverage.
- Never invent users, testimonials, metrics, live system status, partnerships, scientific claims, or religious authority.
- Every action shown in a mockup must have a real destination or be explicitly marked as a future concept.
- Respect accessibility, keyboard use, reduced motion, touch, mobile reflow, and all relevant UI states.
- Preserve the distinction between faith/narrative/creative interpretation and verifiable scientific or historical evidence.
- Generated images are concepts until reviewed; document provenance and rights before production use.

## Status vocabulary

- **Proposed:** a documented direction, not implemented.
- **Designed:** represented in a design or mockup; approval status must be stated separately.
- **Approved:** explicitly accepted for the next design/implementation stage.
- **Implemented:** present in repository code.
- **Tested:** automated or manual test evidence exists.
- **Verified:** behavior and evidence have been checked against acceptance criteria.
- **Deployed:** available in a named environment with a verified deployment reference.

Never promote a status without evidence.

## Change control

Update the relevant source document when a product boundary, design principle, route, content structure, visual rule, or interaction contract changes. Keep one source of truth for each topic. Do not create issue trackers or duplicate project task status inside this folder; GitHub Issues remain the task register and the Wiki remains canonical project documentation where applicable.

## Current delivery boundary

The design foundation is documented. The latest `dev` branch also contains an eight-movement Home implementation; its presence in code does not mean the design has passed visual review or runtime verification. Use `IMPLEMENTATION-RECONCILIATION-AUDIT.md` to close content, navigation, palette, and composition gaps. Visual mockups remain a separate deliverable. Further code changes, asset production adoption, and deployment require their own explicit approval.
