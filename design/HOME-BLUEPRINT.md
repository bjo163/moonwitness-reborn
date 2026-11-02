# A-L-L-A-H.COM — Home Experience Blueprint

**Status:** Foundation blueprint  
**Implementation:** Not implemented or approved by this document  
**Primary role:** Public front door — The Gate  
**Design direction:** Living Cosmic Interface / Celestial Architecture

## 1. Home's job

Home is the first public encounter with the A-L-L-A-H.COM ecosystem. It introduces the world, gives visitors a mental map, presents real stories and transmissions, and guides people to the correct destination.

Home is not a dashboard, an app launcher full of tiles, or a long generic marketing page. It should feel like a single authored environment with distinct editorial scenes and purposeful transitions.

The page must make sense even when cinematic assets fail, motion is disabled, JavaScript is slow, or the visitor uses a phone or keyboard.

## 2. Opening proposition

The opening should communicate three things in a few seconds:
- this is a coherent world with a clear purpose;
- the visitor can explore stories, transmissions, knowledge, and community;
- the visitor remains in control of where to go next.

The primary headline and supporting copy must be written and reviewed as editorial content, not invented as a temporary slogan during implementation. The final copy needs Indonesian-first and English variants.

Suggested editorial territory, not final locked copy:
- **A world to enter. Stories to receive. Knowledge to examine.**
- **When the moon rises, we share messages.** (existing MoonWitness tagline; use only in the MoonWitness context where appropriate)

Do not use a generic eyebrow badge above the headline. The environment itself establishes context.

## 3. Home's eight narrative movements

The eight movements below are the agreed conceptual structure. They are not eight identical page sections. Each has a different composition, information density, and interaction purpose.

### 01 — Arrival / The Gate

**Purpose:** Establish identity, atmosphere, and orientation.

Composition:
- A strong architectural threshold or distant monumental form.
- One primary focal point.
- The A-L-L-A-H.COM identity integrated into the environment, not placed in a giant floating banner.
- One concise statement of purpose.
- One clear primary action and one quiet secondary path, if both are needed.

Behavior:
- Optional short arrival transition.
- Skip is visible and keyboard accessible.
- Returning visitors can enter directly.
- No forced account creation.
- No autoplay audio.
- No fake system readouts or decorative interface labels.

Primary action should lead to a real exploration destination. The secondary action may open a concise explanation of the ecosystem.

### 02 — The Universe

**Purpose:** Give the visitor a mental model of the ecosystem.

This is an authored spatial composition, not a grid of six identical app cards. Show the relationship between:
- MoonWitness — story, archive, and transmissions;
- Dock — community and participation;
- Cockpit — personal workspace;
- Headquarter — ecosystem coordination;
- Moon UI — the shared visual and interaction foundation.

Use distinct silhouettes, landmarks, or connected spaces. Each destination needs a concise explanation and a real route or a clearly marked unavailable state.

Do not expose restricted operational data or make Headquarter appear publicly accessible to every visitor.

### 03 — Explore

**Purpose:** Offer a guided way to enter the world.

Possible discovery paths:
- Stories and chapters;
- Universe archive and timeline;
- Research and source records;
- Creative collections;
- Community contributions.

The actual list must be driven by published content and existing routes. Do not show empty categories as if populated. Do not invent counts, rankings, or “trending” labels.

The composition may use a world map, constellation of destinations, or editorial index, but it must also provide a semantic list alternative.

### 04 — Transmissions

**Purpose:** Bring the voice of MoonWitness into the public Home experience.

Content:
- A featured transmission or story, only when a real published item is available.
- A small number of recent items only when ordering and publication metadata are authoritative.
- Clear content type and series/chapter context.
- A direct link to the canonical item.

Design:
- One editorially dominant piece, with supporting entries treated differently.
- Avoid identical card rows.
- Use meaningful artwork only when approved and available.
- Provide a text-first fallback if media is missing.

Content integrity:
- Distinguish creative story from research and factual report.
- Music lyrics or third-party copyrighted text must not be reproduced beyond applicable limits.
- Do not turn an editorial selection into a claim of divine endorsement or supernatural certainty.

### 05 — Discover

**Purpose:** Help visitors find something relevant without pretending to know them.

Possible discovery lenses:
- By theme;
- By format;
- By time/timeline;
- By source/evidence type;
- By universe/series.

Only expose filters backed by actual metadata. Search must have a real query destination and useful empty/error states. If search is not implemented, show a curated index link rather than a fake search box.

### 06 — Community

**Purpose:** Explain participation and point to Dock.

Content:
- What the community is for;
- What meaningful participation looks like;
- Community guidelines and safety expectations;
- A real entry point to Dock.

Do not invent member counts, testimonials, activity volume, or endorsements. Do not use generated people or fake profile imagery. Any public community content must respect privacy and moderation rules.

### 07 — Your Journey

**Purpose:** Invite a personal next step without coercion.

For anonymous visitors:
- Continue exploring public stories;
- Learn how to participate;
- Sign in only when a member feature is needed.

For signed-in users:
- A real return-to-work or saved-item path may appear if the existing API supplies it and permissions allow it.
- Never invent recent activity, reading history, saved items, progress, or recommendations.
- Do not turn this area into a duplicate Cockpit dashboard.

Headquarter access is shown only when authorization permits it.

### 08 — Closing / The Return

**Purpose:** End with a calm, memorable orientation and clear next action.

The closing should echo the opening visual language without repeating the same hero. It can use a quiet architectural horizon, a final editorial line, and direct navigation to the ecosystem's public destinations.

Footer content must be purposeful: legal/privacy, contact/support where real, language, accessibility, and destination links. Avoid a generic four-column footer template if the actual content does not need it.

## 4. Navigation contract

- A-L-L-A-H.COM identity returns to Home.
- Primary navigation remains concise.
- Destination labels are understandable without relying on icon-only navigation.
- Mobile navigation is a distinct pattern with clear labels.
- Sign-in is separate from public discovery.
- Restricted Headquarter access is permission-aware.
- No dead links, fake buttons, or placeholder controls presented as functional.

## 5. Interaction details

### Scroll and scene transitions
- Scrolling may move through authored scenes, but content remains a normal document with semantic headings.
- Avoid scroll hijacking and mandatory full-screen snapping.
- Scene transitions should not trap keyboard focus.
- Deep links and browser back/forward must work.

### Spatial exploration
- A spatial overview may provide direct selection of the ecosystem destinations.
- Each destination has a text label, short description, and action.
- Keyboard users can reach every destination without pointer movement.
- Mobile users receive a compact list or navigable sequence instead of a tiny spatial map.

### Search/discovery
- Search only appears if it has a real backend contract and useful results.
- Loading, empty, error, and no-match states must be designed.
- Search results expose type and provenance where relevant.

### Personalization
- Anonymous view is complete.
- Signed-in personalization is progressive and permission-aware.
- No tracking or personalization claims without an approved data and privacy model.

## 6. Responsive composition

### Wide desktop
- Use the full spatial composition and layered scene depth.
- Keep the focal point singular.
- Use secondary navigation and contextual overlays sparingly.
- Avoid filling all available space with panels.

### Tablet / compact laptop
- Reduce scene complexity while preserving hierarchy.
- Recompose the Universe into fewer, larger destinations.
- Keep the primary content readable and avoid narrow multi-column text.
- Ensure navigation does not collide with the focal composition.

### Mobile
- Recompose as a vertical editorial journey.
- Replace spatial map complexity with labeled destinations.
- Reduce hero height to preserve a visible next action.
- Keep text width and line length readable.
- Use touch targets of at least 44 × 44 CSS pixels with clear separation.
- No hover dependency, horizontal overflow, clipped controls, or fixed bars covering content.
- Respect safe-area insets.

## 7. Content and data requirements

Home may consume only real public data:
- published transmissions and stories;
- public archive/timeline items;
- approved community content;
- destination availability metadata;
- public explanatory copy.

It must not consume or expose:
- private member records;
- Headquarter operational telemetry;
- secrets or integration credentials;
- unverified progress counters;
- fake activity, testimonials, metrics, or rankings.

If a public content source is unavailable, the page falls back to authored evergreen orientation and clearly marked unavailable content, not synthetic live data.

## 8. Required states

| State | Required behavior |
|---|---|
| Initial loading | Paint meaningful static identity and navigation; load secondary content progressively |
| Content empty | Explain that no published item is available and link to the archive or another real destination |
| Content error | Preserve Home navigation and show a safe retry or fallback |
| Offline | Keep static/publicly cached content only when genuinely available; state limitations |
| Anonymous | Complete public experience; no broken personalization placeholders |
| Signed-in | Show only verified, permission-scoped personal shortcuts |
| Restricted destination | Explain that sign-in or permission is required without leaking data |
| Reduced motion | Remove camera travel/parallax and preserve the same content and actions |
| Media unavailable | Use a designed text/surface fallback, not a skeleton pretending to be artwork |

## 9. Performance and resilience

- First meaningful content must not depend on a large 3D bundle.
- The opening image/visual, if used, must have a deliberate loading priority and responsive asset strategy.
- Below-the-fold media is lazy-loaded.
- Avoid render-blocking third-party scripts.
- Keep motion progressive enhancement.
- Avoid layout shift from late-loading fonts or media.
- Provide meaningful alt text for informative images and empty alt for purely decorative imagery.
- Measure real performance before making performance claims.

## 10. SEO, sharing, and metadata

- One clear page title and description in each supported language.
- Canonical URL and social preview metadata based on approved brand assets.
- Semantic heading structure.
- Structured data only when the content genuinely qualifies.
- Share previews must not expose private content.
- No fabricated organization, product, or review schema.

## 11. Home acceptance criteria

- A first-time visitor can explain the project and distinguish its destinations.
- All eight narrative movements have a distinct purpose and composition.
- Home works as a semantic page without animation.
- Every visible action has a real destination or a clear unavailable state.
- Public and restricted data are separated.
- No invented statistics, testimonials, live activity, or claims.
- Indonesian and English copy are both accounted for.
- Mobile, tablet, keyboard, and reduced-motion experiences are specified.
- Content provenance is visible where factual claims appear.
- The design remains recognizable without the logo or wordmark.

## 12. Out of scope

This blueprint does not create:
- production artwork, logo, emblem, or 3D assets;
- new routes or code;
- new API endpoints or data models;
- authentication changes;
- deployment or DNS changes;
- analytics or tracking;
- claims of publication readiness.

Those require separate approval and implementation tasks.
