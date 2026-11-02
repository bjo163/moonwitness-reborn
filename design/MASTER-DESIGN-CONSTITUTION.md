# A-L-L-A-H.COM & Moon UI — Master Design Constitution

**Status:** Design authority for the visual-design phase  
**Mode:** Antislop DURING  
**Branch:** `dev`  
**Implementation authorization:** Not granted by this document

## 1. Purpose

This constitution is the highest-level design decision record for A-L-L-A-H.COM and its connected experiences. It resolves conflicts by preserving the product vision, truthful communication, accessibility, and the existing Moon UI architecture. It does not replace the focused source documents; it defines how they fit together.

The experience is a navigable digital world with clear human purpose. It must not become a generic SaaS landing page, a game HUD pasted over a website, or an opaque cinematic experiment.

## 2. Product boundaries

| Product | One job | Must not become |
|---|---|---|
| A-L-L-A-H.COM / The Gate | Public orientation and entry to the ecosystem | Member dashboard or content archive |
| MoonWitness | Stories, transmissions, timelines, creative works, sourced research | System control panel |
| Dock | Community participation and shared discussion | Personal workspace |
| Cockpit | Personal workspace, tools, saved work, personal controls | Public front door |
| Headquarter | Authorized ecosystem coordination and operations | Social feed or personal dashboard |
| Moon UI | Shared design language, tokens, components, accessibility and behavior | Separate destination or competing design system |

Each destination must have a clear reason to exist and a distinct visual emphasis. Shared identity does not mean identical layouts.

## 3. Experience laws

1. **Meaning before spectacle.** Every visual decision must clarify, orient, invite, or communicate a real state.
2. **Truth before immersion.** Never fabricate activity, metrics, endorsements, operational status, evidence, or divine authority.
3. **Reverence without appropriation.** Sacred references are treated with care and are never used as decorative texture, gamified reward, or proof of divine approval.
4. **Invitation without coercion.** No forced cinematic sequence, guilt, fake urgency, artificial scarcity, or manipulative sign-up wall.
5. **Spatial but usable.** Spatial metaphors always have direct navigation alternatives.
6. **One system.** Existing Moon UI tokens and components remain the source of truth. No independent palette or shadow token universe.
7. **Distinct compositions.** Do not repeat one page template across all destinations.
8. **Accessible by default.** Keyboard, touch, screen reader, contrast, reduced motion, zoom, and mobile are design inputs, not late fixes.
9. **Evidence has provenance.** Narrative, personal reflection, hypothesis, historical report, scripture, and scientific observation remain visibly distinguishable.
10. **No false completion.** Proposed, designed, implemented, tested, verified, and deployed are separate states.

## 4. Visual identity contract

The world is monumental, celestial, architectural, editorial, and restrained. Its identity comes from silhouette, proportion, negative space, material, light direction, typography, and navigation choreography—not from a pile of effects.

### Materials and atmosphere
- Deep mineral/obsidian environments may frame selected cinematic scenes.
- Stone, mineral, brushed metal, and restrained aged-brass cues are environmental materials, not new semantic colors.
- Light must have a plausible source and a compositional job.
- Texture is subtle and intentional; no stock noise, random star fields, or decorative technical grids.
- Sacred text and divine names are never treated as surface patterns or ornamental glyphs.

### Color authority
- Existing Moon UI semantic tokens are authoritative.
- Acid green remains a restrained interaction accent.
- Brass/gold may appear as material/light, not as a competing success or warning color.
- Obsidian/ink and muted surfaces provide depth without reducing readability.
- Any new semantic color requires a documented proposal and token review.

### Shape and composition
- Use architectural thresholds, portals, planes, paths, frames, and landmarks when they improve spatial comprehension.
- Use asymmetry and negative space intentionally.
- Rounded cards are not the default container for every content type.
- Typography carries editorial hierarchy; monospace is reserved for genuinely technical values.
- Avoid all-caps system text as a substitute for visual identity.

## 5. Navigation and interface laws

- The user must always know the current destination and how to return.
- Primary navigation is stable and discoverable; spatial discovery is an enhancement, not a puzzle.
- Hover previews are optional and must have click, touch, and keyboard equivalents.
- Contextual overlays appear only when relevant and must not obscure the main task.
- Do not print the word “HUD” in the interface.
- No fake coordinates, reticles, radar, telemetry, counters, scan lines, or fictional system states.
- A status indicator exists only when connected to an authoritative state.
- Every visible control must have a defined action, destination, or explicit concept-only annotation in design review.

## 6. Motion and sound laws

Motion is causal, short, interruptible, and useful. It may establish arrival, communicate a transition, reveal hierarchy, or confirm a real state. No perpetual motion, forced camera movement, or animation used to disguise missing functionality.

Sound is off by default, optional, user-controlled, licensed, and never required to understand the interface. No autoplay with sound.

## 7. Responsive laws

Desktop, tablet, and mobile are related art directions, not one canvas scaled down. Mobile must preserve the same information hierarchy and destination clarity while replacing wide spatial compositions with direct, thumb-friendly navigation. No essential hover-only behavior and no horizontal overflow.

## 8. Content and trust laws

- Indonesian is the default language; English is supported.
- Public orientation uses clear, calm language. Story-specific Gen-Z playfulness belongs in story contexts, not in sensitive religious or research explanations.
- No unsupported claim that the site, a feature, or a story has divine endorsement or approval.
- Scientific and historical statements require sources, dates, units, and qualifications appropriate to the claim.
- Creative interpretation is labelled as creative interpretation.
- No invented user counts, testimonials, partner logos, live feeds, or performance claims.
- Do not depict prophets. Human faces are not to be invented for MoonWitness narrative artwork where the canon prohibits them.

## 9. Design decision hierarchy

When documents or mockups appear to conflict, resolve in this order:
1. Safety, truthfulness, privacy, accessibility, and sacred-content care.
2. Product boundaries and vision in `VISION.md`.
3. This constitution.
4. Topic-specific contracts: `DESIGN-DNA.md`, `DESIGN-TOKENS.md`, `INFORMATION-ARCHITECTURE.md`, `USER-JOURNEY.md`.
5. Screen-level specifications: `HOME-BLUEPRINT.md`, `HEADQUARTER-SPATIAL-BLUEPRINT.md`, `MOCKUP-SPEC.md`.
6. Individual mockup treatments.

A lower-level mockup cannot silently override a higher-level rule. Record any proposed exception and its rationale.

## 10. Definition of design-ready

A screen is design-ready only when:
- its audience, purpose, primary action, and exit path are clear;
- its hierarchy works without animation;
- every visible element has a purpose;
- its data and claims have provenance or are explicitly placeholders;
- desktop, tablet, mobile, keyboard, touch, and reduced-motion behavior are specified;
- loading, empty, error, restricted, offline, and success states are considered where relevant;
- its visual language uses the shared Moon UI contract;
- unresolved assumptions and review decisions are recorded.

## 11. Delivery boundary

This constitution governs design work only. It does not authorize code changes, deployment, routing, database changes, content publication, or production asset adoption. Mockups remain proposals until reviewed and approved. Implementation requires a separate explicit approval.

## 12. Related sources

- [Vision](./VISION.md)
- [Information architecture](./INFORMATION-ARCHITECTURE.md)
- [User journeys](./USER-JOURNEY.md)
- [Design DNA](./DESIGN-DNA.md)
- [Design tokens](./DESIGN-TOKENS.md)
- [Visual world and asset language](./VISUAL-WORLD-ASSET-LANGUAGE.md)
- [Interaction, motion and sound](./INTERACTION-MOTION-SOUND.md)
- [Responsive and accessibility QA](./RESPONSIVE-ACCESSIBILITY-QA.md)
- [Home blueprint](./HOME-BLUEPRINT.md)
- [Mockup specification](./MOCKUP-SPEC.md)
