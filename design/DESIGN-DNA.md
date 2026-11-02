# A-L-L-A-H.COM — Design DNA

**Status:** Direction foundation  
**Antislop:** DURING  
**Purpose:** Establish a recognizable visual and interaction identity before mockups.

## 1. Identity in one sentence

**A living celestial world shaped like a place, not a dashboard: monumental, intimate, mysterious, grounded, and navigable.**

The identity must remain recognizable even if the logo and product name are removed. Its character comes from composition, spatial grammar, material treatment, light, typography, editorial voice, and purposeful interaction.

## 2. Emotional sequence

1. **Wonder:** a sense of scale and discovery without overwhelming the visitor.
2. **Orientation:** the visitor understands where they are and what is available.
3. **Connection:** stories, people, knowledge, and missions feel related.
4. **Agency:** the visitor can choose a meaningful action.
5. **Reflection:** the experience leaves room for quiet reading and thought.

Do not sustain maximum spectacle across every section. Contrast and quiet are part of the identity.

## 3. Visual world

### Materials
- Deep mineral surfaces and near-black foundations for selected cinematic scenes.
- Stone, brushed metal, aged brass, and restrained glass as material cues.
- Light is directional and motivated, not a blanket glow.
- Texture should suggest crafted architecture, not stock noise or a generic technical grid.

### Palette
The existing Moon UI palette is the source of truth. Its semantic families include ink, muted text, panel surfaces, hairlines, void, acid accent, and semantic success/warning/danger colors. Home and Headquarter may compose those tokens differently, but must not invent independent hex palettes.

Acid green is a signature interaction accent, not a flood color. Brass/gold is a material/narrative accent, not a new status system. Any additional palette expansion requires a token-level proposal and review.

### Form language
- Architectural silhouettes and intentional asymmetry.
- Strong focal hierarchy with deliberate negative space.
- Landmarks, thresholds, frames, portals, and paths used where they improve orientation.
- Sharp, cut, machined, or selectively softened geometry consistent with the existing Moon UI character.
- Avoid making every surface a rounded card.

### Typography
- Use the existing sans family for readable editorial and interface text.
- Use monospace selectively for actual technical identifiers, timestamps, or system metadata.
- Headings should have character and editorial hierarchy; do not default to all-caps monospace.
- Body text must remain comfortably readable, especially for long-form stories and mobile.
- Preserve Indonesian diacritics and punctuation; test localized line wrapping.

## 4. Spatial language

Spatial does not mean requiring WebGL, VR, or a 3D engine. It may be expressed through:
- layered foreground, middle distance, and background;
- perspective and architectural scale;
- persistent landmarks and recognizable regions;
- transitions between spaces;
- meaningful depth cues;
- optional camera movement.

Every spatial device must have a functional purpose: orientation, navigation, hierarchy, narrative transition, or feedback. Provide a direct non-spatial alternative.

## 5. HUD and interface overlays

HUD is an interaction grammar, not a visible label or decorative theme.

- Never write the word “HUD” into the user interface as a label.
- Do not surround the whole screen with boxes, telemetry, fake coordinates, reticles, or pseudo-radar.
- Show contextual information only when the user needs it.
- Selected landmarks may reveal concise names and actions.
- System metadata belongs in technical contexts, not public editorial sections.
- No fabricated counters, live signals, mission progress, coordinates, or status indicators.
- Every status light must represent a real state.
- Keep controls recognizable and accessible even when integrated into the environment.

## 6. Motion grammar

Motion should feel deliberate, controlled, and tied to a cause.

| Motion | Purpose | Constraint |
|---|---|---|
| Arrival reveal | Establish the world and orientation | Short, skippable, once or infrequently |
| Camera/scene transition | Communicate movement between spaces | Optional; no motion sickness; reduced-motion alternative |
| Landmark response | Confirm selection or focus | Brief and restrained |
| Content reveal | Preserve hierarchy while opening detail | No endless loop |
| Loading feedback | Explain real waiting | No fake progress percentage |
| Success feedback | Confirm a completed action | Only after authoritative success |

No perpetual floating, pulsing, or parallax by default. No animation that hides missing behavior.

## 7. Audio

Audio is optional and off by default. It must never carry essential information. Provide a visible control if sound is introduced, respect user preference, and ensure no autoplay with sound. Audio assets require separate creative approval and licensing review.

## 8. Composition rhythm

The Home page should not repeat the same section template. Its rhythm moves between:
- cinematic threshold;
- spacious editorial statement;
- a world/region reveal;
- focused content transmission;
- a discovery-oriented composition;
- human/community context;
- a personal invitation;
- a quiet closing.

The rhythm must arise from the content. Do not force every section into a card grid or alternate background colors as the only source of variation.

## 9. Image and asset rules

- No logo, emblem, character, angel, prophet depiction, human portrait, or brand asset may be invented without explicit direction and approval.
- Existing canon constraints such as no visible faces for MoonWitness narrative artwork remain in force where applicable.
- Religious figures and sacred references require exceptional care; do not generate or depict prophets.
- A reference image is not a production asset and must not be represented as one.
- Every production asset needs source, ownership/license, intended crop, responsive variants, alt text, and a fallback.
- Do not generate or upload assets as a side effect of writing this document.

## 10. Antislop purpose test

For every technique, write down what it serves:
- gradient: depth separation or meaningful environmental light;
- glass: one important floating layer only when it improves separation;
- glow: focus or real active state;
- grid: only when it is part of a meaningful in-world instrument;
- card: grouping of related content, not default layout;
- animation: orientation, state feedback, or narrative transition;
- badge: concise, meaningful status only;
- icon: recognizable action or concept, not generic decoration.

If no purpose can be stated, remove the technique.

## 11. Explicit anti-patterns

- Generic SaaS hero + two buttons + screenshot + feature cards.
- Default bento mosaic used as the whole design language.
- Blue/purple AI gradients and random neon palette.
- Glass on every panel.
- Glow on every object.
- Endless pulsing lights.
- Generic AI sparkles/orbs as identity.
- Repeated identical cards.
- Decorative grid/noise without a world-building purpose.
- Fake terminal, fake metrics, fake live feeds, fake testimonials.
- Giant text overlays that obscure the actual scene.
- Labels that merely announce visual techniques.
- Overly cryptic navigation that sacrifices usability.

## 12. Accessibility and resilience

- WCAG 2.2 AA is the target for shipped public interactions.
- Keyboard navigation and visible focus are first-class.
- Reduced motion is respected.
- Contrast is checked, including text over imagery.
- Status is never color-only.
- Mobile is a distinct composition, not a scaled desktop.
- Essential information is available in semantic text.
- Image failure, slow network, and animation failure never block the experience.

## 13. Design dials for mockup review

| Dial | Direction |
|---|---|
| Identity | Celestial architecture, editorial storytelling, MoonWitness-specific |
| Energy | Cinematic peaks with quiet intervals |
| Density | Low at entry; increases only when context requires |
| Contrast | Strong focal contrast; readable body copy |
| Motion | Deliberate and sparse; reduced-motion complete |
| Texture | Material and environmental, not generic tech decoration |
| Spatiality | Strong landmarks; direct navigation always available |
| Copy | Humble, clear, warm, Indonesian-first |
