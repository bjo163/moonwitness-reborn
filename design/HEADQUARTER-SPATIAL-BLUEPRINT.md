# HEADQUARTER — Spatial Command Center
## Design Foundation & Product Blueprint

**Status:** Design direction locked  
**Antislop mode:** DURING  
**Target repository:** `bjo163/moonwitness-reborn`  
**Target branch:** `dev`  
**Document type:** Product / experience / information architecture / UI blueprint  
**Implementation status:** Not implemented by this document

---

## 1. Executive direction

Headquarter is the **Spatial Command Center** of the MoonWitness ecosystem. Its entry experience is **Cinematic Arrival** and its visual identity is **Monumental Celestial Architecture**.

Headquarter is not a conventional dashboard decorated with space imagery. It is a functional digital environment: the world is the interface, every space has a purpose, and every action leaves a trace.

The experience must communicate:
- where the user is within the ecosystem;
- what is happening and what needs attention;
- which work, missions, knowledge, and transmissions are active;
- how the user's permitted actions connect to the wider ecosystem.

Spatial does not require VR, a heavy 3D engine, or unrestricted camera controls. It is expressed through depth, perspective, landmarks, spatial relationships, environmental transitions, and consistent navigation. Mouse, keyboard, touch, and accessible conventional controls remain first-class.

### Locked design decisions

1. One coherent Headquarter environment with six functional regions.
2. Command Deck is the orientation and decision-making center.
3. World Core is the primary spatial landmark.
4. Cinematic arrival is short, skippable, and never blocks core functionality.
5. Spatial navigation is complemented by direct, accessible navigation.
6. Visual identity is monumental, celestial, architectural, restrained, and premium.
7. Headquarter shares Moon UI and the existing MoonWitness application architecture.
8. No parallel identity system, database authority, or backend is introduced.
9. No fake metrics, fabricated operational states, or decorative pseudo-data.
10. Mockups precede implementation; this document does not authorize coding or deployment.

---

## 2. Product boundaries in the ecosystem

| Experience | Responsibility |
|---|---|
| Dock | Community and user interaction space |
| Cockpit | Personal workspace and personal controls |
| Headquarter | Ecosystem coordination and operations |
| Moon UI | Shared design system and reusable interface language |

Headquarter must not absorb Cockpit's personal-workspace responsibilities or duplicate Dock's community experience. It may surface only the identity and personal context needed for operational orientation.

---

## 3. Spatial information architecture

The environment contains six regions. These are functional areas inside one product, not six separate applications.

### 01 — Command Deck
The primary orientation and decision center.

Responsibilities:
- role-aware activity overview;
- current priorities and actionable alerts;
- active work and recent activity;
- spatial access to the other five regions;
- World Core visualization.

### 02 — Identity & Access
The identity, membership, and authorization area.

Responsibilities:
- user identity and profile summary;
- memberships, roles, and permissions;
- sessions and devices;
- security history where supported by authoritative records.

Private information is visible only to its owner and explicitly authorized roles.

### 03 — Mission Control
The operational work and mission area.

Responsibilities:
- mission board, quests, and milestones;
- tasks and assignments;
- user contributions;
- evidence and completion records;
- status history and traceability.

The MoonWitness 33 real-world bugs campaign may be represented as a campaign or quest. Progress must be evidence-backed; a target count must never be presented as completed progress without verified records.

### 04 — Knowledge & Intelligence
The research and knowledge environment.

Responsibilities:
- Knowledge Vault;
- research workspace;
- source explorer and citations;
- evidence review;
- AI-assisted analysis;
- relationships between knowledge objects.

Important conclusions must expose source provenance, confidence/qualification where available, and verification status. Narrative, dream, personal reflection, historical data, and scientific fact must retain distinct provenance labels.

### 05 — Universe & Transmissions
The narrative, archive, and publication environment.

Responsibilities:
- Universe Map;
- story and creative archives;
- timelines;
- transmissions and publications;
- relationships between stories, research, and archives.

### 06 — System Observatory
The technical operations and operational-intelligence environment, restricted by role.

Responsibilities:
- service health, availability, monitored targets, check results, and incidents;
- integration and executor-provider status;
- automation definitions, triggers, schedules, and policy visibility;
- execution runs, step results, retries, approvals, and evidence references;
- browser operations and isolated automation execution visibility;
- operational audit, errors, and system administration.

System Observatory is the operational control and evidence surface for the wider ecosystem. It does not own mission/task records, research content, stories, media publications, or personal workspace data. It coordinates and observes work owned by those domains through authorized contracts.

Monitoring and durable scheduling must continue independently of AI availability. Playwright is an isolated browser executor; OpenClaw is an optional external agent/runtime adapter. Neither is the domain database, policy authority, or required platform foundation.

Never expose secrets, tokens, credentials, browser cookies, or private operational data to unauthorized users.

---

## 4. Cinematic Arrival — entry sequence

The arrival experience has four beats:

1. **The Threshold** — a first glimpse of the exterior architecture, the light from within, and the primary landmark. Branding belongs to the environment, not a giant overlay.
2. **The Approach** — a short, controlled camera movement toward the central space.
3. **The Awakening** — the environment becomes active as real data and available regions load progressively.
4. **The Command Deck** — the camera settles into the main perspective and the user can navigate or act.

### Entry rules
- First visit may show the full cinematic sequence, with a clear skip action.
- Returning visits use a shortened sequence or enter directly.
- Users can disable cinematic movement.
- Respect `prefers-reduced-motion`.
- Animation or asset failure must never prevent access to the application.
- Never force users to watch a long intro before doing work.
- Do not make sound essential to understanding or navigation.

---

## 5. Command Deck composition

The Command Deck is a spatial environment, not a conventional card dashboard.

### Five primary elements

1. **World Core** — the central spatial landmark and interactive activity/region map. It must have a real navigation or information purpose, not be decorative.
2. **Spatial Navigation** — region landmarks and paths. Avoid a permanently dominant, long sidebar.
3. **Intelligence Feed** — relevant notifications with context and source.
4. **Mission Strip** — active work, next actions, and verified progress.
5. **Identity Frame** — account, role, preferences, and session access.

The composition should establish one visual focal point. Secondary elements recede until relevant. When a region is entered, contextual information takes focus without losing orientation.

### Information hierarchy
- Primary: current place, primary object, or next meaningful action.
- Secondary: status, relevant activity, and context.
- Tertiary: technical metadata and supporting detail, available on demand.

Do not show every panel at full prominence at once.

---

## 6. Visual identity — Monumental Celestial Architecture

### Art direction
A monumental, cinematic, celestial architectural environment with a distinctive MoonWitness identity.

| Dimension | Direction |
|---|---|
| Form | Monumental, geometric, architectural |
| Materials | Obsidian, dark stone, brushed metal, selective glass |
| Light | Moonlight, restrained ambient illumination, warm accents |
| Accent | Antique Gold via the existing Moon UI semantic accent tokens; never use it as success/warning/danger status |
| Depth | Clear foreground, midground, and background |
| Typography | Characterful sans-serif for navigation; monospace only for technical data |
| Motion | Deliberate camera movement and spatial transitions |
| Icons | A coherent symbolic vocabulary, not a random generic icon collection |

### Existing design-system continuity
The current Moon UI direction is Cosmic Ivory & Antique Gold: deep indigo / obsidian foundations, warm ivory text, Antique Gold interaction emphasis, and a parchment / bronze light-theme counterpart. The existing token family retains historical names such as `acid`; those names must not be mistaken for the current rendered hue. Preserve the shared tokens rather than introducing an unrelated palette or a second design system.

Antique Gold is the brand/interaction accent, not a success, warning, or danger status color. Use it sparingly and only through the existing semantic token contract.

### HUD principles
- HUD elements are contextual parts of the environment, not labels announcing themselves as HUD.
- Reveal labels on relevant objects or selected landmarks.
- Keep operational status concise.
- Detail panels open on demand.
- No fabricated coordinates, radar, counters, telemetry, or pseudo-system readouts.
- Keep visual focus on the selected object or meaningful action.
- Do not use oversized decorative labels to fill empty space.

### Antislop constraints
- No generic SaaS dashboard template.
- No default bento-grid solution.
- No glow applied to every element.
- No blanket glassmorphism.
- No identical card collections for every region.
- No animation used to disguise missing functionality.
- No new brand mark or logo asset without a defined direction and approval.
- Every visual effect must have a purpose in hierarchy, orientation, feedback, or atmosphere.

---

## 7. Navigation and interaction model

### Desktop
- Click a landmark to enter a region.
- Hover may provide a preview, but hover must not be the only way to access information.
- Full keyboard navigation.
- Escape closes a contextual panel or returns to the prior context.
- A spatial breadcrumb or equivalent orientation cue always shows where the user is.

### Tablet
- Condense landmark navigation without removing the spatial model.
- Give detail panels more room.
- Gestures are optional enhancements, never the only interaction.

### Mobile
Mobile is a distinct composition, not a shrunk desktop scene.

- Use an action-oriented vertical Command Deck.
- Keep primary navigation within comfortable thumb reach.
- Convert the region map into compact, legible region choices.
- Avoid horizontal overflow.
- Use touch targets of at least 44 × 44 CSS pixels.
- Keep all essential actions available without hover.

### Accessibility
- Keyboard access and visible focus.
- Semantic landmarks and labels.
- Sufficient contrast.
- Reduced-motion mode.
- Screen-reader-friendly state changes.
- No color-only status communication.
- Provide a direct navigation alternative to spatial movement.

---

## 8. Information architecture and application architecture

This is a logical responsibility map, not a claim that all services or domain models already exist.

```text
HEADQUARTER EXPERIENCE
  Spatial shell
  Cinematic entry
  Region navigation
  Context and local interaction
       |
       +-- Six functional regions
       +-- Shared Moon UI components and tokens
       |
MOONCLIENT — shared API contract
  Authentication
  DTOs
  Request / error contract
       |
SERVER / DOMAIN ADDONS
  Identity & Access
  Mission
  Knowledge & Research
  Universe & Transmissions
  System Operations
    Observability / Automation / Execution
       |
QLORM / DATA AUTHORITY
  Domain models
  Access control
  Ownership
  Provenance
```

### Repository integration constraints
The current `dev` application structure observed during blueprint preparation includes:
- Next.js web application under `apps/web`;
- shared client package `@moonwitness/moonclient`;
- shared UI package `@moonwitness/ui`;
- shared UI preset and tokens under `packages/ui/styles`;
- workspace template and reusable UI composites;
- the `/command-center` route currently delegates to `DashboardPage`.

The route is a current implementation fact, not a requirement to preserve the old dashboard composition. The future spatial experience should evolve the existing route and shared architecture.

### Technical guardrails
- Web application remains Next.js.
- Web data access goes through `@moonwitness/moonclient`.
- UI uses `@moonwitness/ui` and its shared tokens.
- Domain models, ACL, and views follow the existing QlOrm / `ql_*` addon conventions.
- Do not add direct browser-to-database access or a parallel backend authority.
- Do not use raw `fetch` directly from `apps/web` where the project contract requires moonClient.
- ACL is deny-by-default; enforce ownership and role permissions server-side.
- UI copy belongs in the translation catalogs; Indonesian is the default language and English must remain supported.
- Respect the repository's GitHub Actions validation workflow; do not bypass project CI policy.

---

## 9. Domain data requirements

| Region | Required authoritative data |
|---|---|
| Command Deck | Activity summary, priorities, recent events |
| Identity & Access | User, membership, role, permission, session |
| Mission Control | Mission, quest, task, progress, evidence |
| Knowledge & Intelligence | Knowledge object, source, citation, research |
| Universe & Transmissions | Story, timeline, publication, relationship |
| System Observatory | Service health, integration status, audit events |

Data rules:
- If a model, API, or trusted source does not exist, show an explicit unavailable/empty state.
- Never substitute fabricated metrics or demo values that look real.
- Distinguish proposed, implemented, tested, verified, and deployed states.
- Preserve provenance for narrative, reflection, historical claims, and scientific evidence.
- Enforce permissions at the server/API layer, not only by hiding UI controls.

---

## 10. Required UI states

Every region must define and design these states:

| State | Expected behavior |
|---|---|
| Loading | Progressive loading; never lock the whole environment unnecessarily |
| Empty | Explain why no data is present and what action is possible |
| Error | Explain the issue and provide safe retry where applicable |
| Restricted | Explain access restriction without leaking protected data |
| Offline | Explain connection state and identify any available limited functionality |
| Success | Confirm the completed action and show relevant evidence/context |

A finished animation is not proof that an operation succeeded. UI must reflect the authoritative result.

---

## 11. Mockup sequence — before implementation

Create mockups in this order so the first two establish the visual language for the entire product.

1. **Mockup 01 — Arrival Sequence:** exterior, threshold, approach, and Command Deck reveal.
2. **Mockup 02 — Command Deck:** World Core, spatial navigation, intelligence feed, mission strip, identity frame.
3. **Mockup 03 — Spatial Navigation:** six landmarks, transitions, selected state, contextual detail panel.
4. **Mockup 04 — Mission Control:** mission board, quest progress, evidence, contribution history.
5. **Mockup 05 — Knowledge & Intelligence:** archive, source explorer, research, evidence, AI assistance.
6. **Mockup 06 — Universe & Observatory:** universe map, transmissions, restricted system monitoring.
7. **Mockup 07 — Responsive Experience:** purpose-designed tablet and mobile compositions.

Do not create all seven as unrelated screens. Establish and approve the visual grammar in Mockups 01 and 02 first, then carry it consistently through the remaining regions.

### Asset status
The imagery shown in the preceding conversational blueprint was illustrative visual reference imagery rendered inline from image searches. It was not a set of authored, repository-ready image files. No image binaries are included in this commit. When producing actual visual assets, create them as deliberate, approved files under `design/assets/` and document their intended use, dimensions, and provenance. Do not represent reference imagery as original MoonWitness artwork.

---

## 12. Delivery and acceptance gate

The design is ready for implementation planning only when all of the following are satisfied:

- [ ] Users understand where they are and what Headquarter is for without a long tutorial.
- [ ] Cinematic entry is skippable and does not block work.
- [ ] Six regions have clear and non-overlapping responsibilities.
- [ ] Dock and Cockpit responsibilities remain separate.
- [ ] Every landmark has a real purpose.
- [ ] Data has a source and a clear truth/verification status.
- [ ] Access differs according to authorized roles.
- [ ] No fabricated data or operational status is shown.
- [ ] Keyboard, touch, reduced motion, and accessibility are covered.
- [ ] Visual language is consistent with Moon UI.
- [ ] The experience remains recognizable without relying on a large logo.
- [ ] Performance is not sacrificed for cinematic effects.
- [ ] Loading, empty, error, restricted, offline, and success states are designed.
- [ ] Mockups 01 and 02 establish the approved visual grammar before the remaining mockups.
- [ ] Design assets have provenance and are stored intentionally.

---

## 13. Delivery boundaries and current status

This document records the approved design direction and the blueprint for the next design stage. It does not mean that the spatial UI, cinematic sequence, data models, API endpoints, or visual assets have been implemented.

**Next authorized design activity:** produce Mockup 01 — Arrival Sequence and Mockup 02 — Command Deck, using this document as the source of truth. Implementation, deployment, issue changes, and additional branches require their own explicit authorization.

---

## 14. Source snapshot

Prepared after inspecting the `dev` branch of `bjo163/moonwitness-reborn` on 2026-11-02. Relevant files inspected included:
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/command-center/page.tsx`
- `apps/web/src/app/globals.css`
- `packages/ui/styles/preset.css`
- `packages/ui/styles/tokens.css`
- `packages/ui/src/templates/workspace.tsx`
- `packages/ui/src/index.ts`
- `packages/ui/package.json`

This source snapshot is informational. Re-check current files and project guidance before implementation because the branch may evolve.


---

## Related design documents

This blueprint is part of the shared design foundation. Read it together with:

- [Design library index](./README.md)
- [Product vision](./VISION.md)
- [Information architecture](./INFORMATION-ARCHITECTURE.md)
- [User journeys](./USER-JOURNEY.md)
- [Design DNA](./DESIGN-DNA.md)
- [Design token contract](./DESIGN-TOKENS.md)
- [A-L-L-A-H.COM Home blueprint](./HOME-BLUEPRINT.md)
- [Mockup specification and review gates](./MOCKUP-SPEC.md)
- [System Observatory — Automation & Operational Intelligence Architecture](./SYSTEM-OBSERVATORY-AUTOMATION-ARCHITECTURE.md)

The Headquarter experience must preserve the product boundaries and shared visual, accessibility, data-provenance, and implementation constraints defined by those documents.
