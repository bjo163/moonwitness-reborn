# Visual World & Asset Language

**Status:** Art-direction specification  
**Authority:** `MASTER-DESIGN-CONSTITUTION.md`  
**Scope:** A-L-L-A-H.COM, MoonWitness, Dock, Cockpit, Headquarter and Moon UI

## 1. The visual premise

The ecosystem should feel like a world made of places, thresholds, chambers, horizons, archives, and pathways. It is not a literal fantasy game and should not imitate a known game's interface. Its visual signature is architectural scale combined with editorial restraint and human-readable navigation.

The visual world must remain recognizable in a still frame, in monochrome, and with all animation disabled.

## 2. Art-direction pillars

### Monumental
Use large architectural silhouettes, deep perspective, deliberate framing, and a clear sense of scale. Monumentality is not synonymous with a giant logo or oversized text.

### Celestial
Use darkness, horizon light, atmospheric distance, and carefully controlled highlights. Avoid generic galaxy wallpaper, random planets, and star particles as a shortcut to “cosmic”.

### Crafted
Surfaces should suggest real material logic: mineral, carved stone, dark metal, brushed metal, aged brass, paper, or archival glass. Material cues must be restrained and legible.

### Editorial
Text is part of the composition. Use short, meaningful statements, intentional line breaks, readable body width, and strong typographic contrast. Avoid dense fake interface labels.

### Navigable
A visual landmark must communicate where it leads or what it represents. The environment should never require guessing.

## 3. World grammar

Use these spatial primitives as a vocabulary, not a checklist for every screen.

| Primitive | Meaning | Appropriate use |
|---|---|---|
| Threshold | Entry or transition | Home arrival, entering a major destination |
| Horizon | Direction, openness, future | Hero or closing composition |
| Axis | Orientation and relationship | Ecosystem map or spatial overview |
| Chamber | Focused working area | Headquarter region, research workspace |
| Archive wall | Collected knowledge and stories | MoonWitness archive |
| Harbor | Participation and gathering | Dock |
| Personal instrument | Individual agency and tools | Cockpit |
| Observatory | Evidence and system observation | Research or authorized operations |
| Path | Sequence or progress | Journey, guided discovery, task flow |
| Landmark | Recognizable destination | Primary navigation |

Do not combine every primitive into one screen. One dominant metaphor per composition is usually enough.

## 4. Product-specific visual emphasis

| Destination | Dominant visual idea | Composition | Avoid |
|---|---|---|---|
| A-L-L-A-H.COM | The Gate / threshold into a wider world | One monumental focal structure, editorial invitation, visible destinations | Feature-card marketing layout |
| MoonWitness | Transmission / archive / narrative horizon | Editorial storytelling, chapter sequence, archival depth | Admin panels and social-feed sameness |
| Dock | Harbor / gathering / shared contribution | Human-scale community context, clear participation routes | Operations telemetry |
| Cockpit | Personal instrument / private workspace | Calm, focused, task-first work surface | Public spectacle and community feed |
| Headquarter | Command architecture / observatory | Spatial regions, one primary landmark, role-aware context | Conventional dashboard mosaic |
| Moon UI | Craft language / navigation grammar | Consistent primitives and states across products | One identical layout imposed on all |

## 5. Composition and camera

- Establish one primary focal point per viewport.
- Use foreground, midground, and background only when they create meaningful depth.
- Keep text on stable, sufficiently opaque/readable planes; do not place paragraphs over visually noisy imagery.
- Use perspective to lead the eye toward a destination, not to distort text or controls.
- Keep the user's primary action within the first meaningful viewport.
- Preserve a quiet region for editorial copy and accessible navigation.
- Never make the camera the only way to inspect content.
- Avoid fake depth that causes overlap, clipping, or scroll confusion.

## 6. Light and material direction

Light must be motivated by an architectural opening, horizon, reflected surface, or a meaningful selected state. Highlights should guide the eye rather than outline every object.

Material rules:
- Obsidian/mineral: background depth and environmental mass.
- Stone: monumental structure, foundations, thresholds.
- Brushed/dark metal: precision, frames, mechanical details.
- Aged brass: rare warm accent, not a semantic status.
- Paper/archival surface: long-form reading and preserved records.
- Glass: only for a genuinely floating contextual layer; never blanket glassmorphism.

No decorative sacred calligraphy, scripture fragments as texture, or invented religious iconography.

## 7. Typography and symbols

- Use the existing Moon UI font families and token definitions.
- Display typography may be expressive, but body copy must remain calm and readable.
- Monospace is limited to identifiers, dates, source codes, and genuine technical metadata.
- Icons must be from a coherent family and represent recognizable actions or concepts.
- Do not invent an emblem, seal, angel silhouette, prophet depiction, or character as a brand shortcut.
- Avoid ornamental glyphs that resemble scripture or sacred writing.

## 8. Asset classes and production rules

| Asset class | Purpose | Required variants / metadata |
|---|---|---|
| Environment plate | Establish a place or atmosphere | Desktop wide, mobile crop, focal point, alt text |
| Landmark illustration | Identify a destination | Default, focus/selected, monochrome fallback |
| Material texture | Add subtle surface character | Seamless tile or bounded use, source/license |
| Icon | Action or navigation | Vector source, viewBox, accessible label |
| Wordmark/logo | Brand identification | Approved vector master, clear-space and contrast rules |
| Motion asset | Transition or feedback | Static fallback, reduced-motion alternative, duration |
| Editorial image | Support a story or transmission | Caption, provenance, rights, crop guidance |

Every asset record must include:
- stable filename and owner;
- purpose and destination;
- source/provenance and license;
- dimensions and intended crop;
- alt text or explicit decorative classification;
- responsive fallback;
- status: concept, approved, production-ready, or retired.

## 9. Image-generation and review rules

Generated imagery is concept art until reviewed. It must not be described as a real location, scientific visualization, production-ready logo, or verified data visualization unless that is accurate.

Prompting should specify composition, focal hierarchy, material, lighting, crop, negative space, and prohibited elements. Avoid prompts that simply stack adjectives such as “epic, futuristic, ultra premium, 8K”.

Review each generated image for:
- unwanted text or pseudo-interface labels;
- malformed architecture and inconsistent perspective;
- accidental faces or human figures;
- religious imagery or sacred text rendered inappropriately;
- generic AI visual tropes;
- focal point conflict with copy or navigation;
- desktop-to-mobile crop failure;
- accessibility contrast when text overlays are proposed.

## 10. Asset naming

Use lowercase kebab-case and stable screen identifiers:
- `mw-01-arrival-concept-v01.png`
- `mw-02-universe-concept-v01.png`
- `mw-06-headquarter-command-concept-v01.png`

Do not overwrite approved assets silently. Increment the version and record what changed. Store accepted assets under `design/assets/` only after source/provenance and review are documented.

## 11. Related sources

- [Master design constitution](./MASTER-DESIGN-CONSTITUTION.md)
- [Design DNA](./DESIGN-DNA.md)
- [Design token contract](./DESIGN-TOKENS.md)
- [Mockup specification](./MOCKUP-SPEC.md)
