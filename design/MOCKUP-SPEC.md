# A-L-L-A-H.COM — Mockup Specification

**Status:** Ready for visual design exploration; no mockup assets created by this document.  
**Sequence:** Design the shared visual grammar before designing every page.

## 1. Purpose

Mockups translate the approved vision and blueprints into reviewable visual compositions. They are not implementation and must not be treated as production assets.

The sequence below prevents premature polishing of isolated screens before the ecosystem, Home, and responsive rules agree.

## 2. Mockup sequence

| ID | Mockup | Main question | Required output |
|---|---|---|---|
| MW-01 | Arrival / The Gate | What is the first impression and how does the visitor enter? | Desktop hero scene, mobile opening, skip/direct-entry state |
| MW-02 | The Universe | How are the ecosystem destinations represented as one world? | Wide composition, compact/tablet composition, mobile destination sequence |
| MW-03 | Home — Explore & Transmissions | How does a visitor discover real content? | Editorial feature, supporting content, archive/discovery path |
| MW-04 | Home — Community & Your Journey | How do visitors participate or continue personally? | Anonymous and authenticated variants, permission-aware entry |
| MW-05 | Home — Closing | How does the experience conclude and provide exits? | Closing scene, footer/navigation behavior |
| MW-06 | Headquarter — Command Deck | How does the operator orient and act? | Wide command scene, direct navigation alternative, key states |
| MW-07 | Headquarter — Spatial Regions | How do six regions remain coherent but distinct? | Region overview and one representative region detail |
| MW-08 | Responsive & Accessibility | Does the experience hold up outside desktop and without motion? | Phone, tablet, keyboard focus, reduced-motion, high-contrast checks |
| MW-09 | Visual system sheet | Can the design be implemented consistently with Moon UI? | Type scale, token mapping, surface/material rules, interaction states |

## 3. Required frames per mockup

Every mockup must identify:
- frame name and target viewport range;
- user intent;
- primary focal point;
- information hierarchy;
- navigation and available actions;
- source of all visible data;
- loading, empty, error, restricted, and offline states where applicable;
- responsive reflow;
- keyboard/focus behavior;
- reduced-motion behavior;
- image/media fallback;
- known assumptions and unresolved questions.

Do not place fake names, user avatars, counts, mission progress, status lights, or testimonials into polished mockups. Use clearly labeled neutral placeholders only when the layout cannot be evaluated without them.

## 4. Visual review questions

1. Does the composition feel unique to A-L-L-A-H.COM and MoonWitness without the logo?
2. Does every visual technique have a stated purpose?
3. Is there one clear focal point rather than competing visual noise?
4. Does the content drive the layout?
5. Is the interface understandable without cinematic movement?
6. Does the Home explain the difference between MoonWitness, Dock, Cockpit, and Headquarter?
7. Are sacred/religious references treated with restraint and editorial accuracy?
8. Are creative narrative and factual evidence visibly distinct?
9. Are all controls meaningful and accessible?
10. Does the mobile composition feel intentionally designed?

## 5. Art direction guardrails

- Follow `DESIGN-DNA.md`; do not invent a new identity for an individual mockup.
- Follow `DESIGN-TOKENS.md`; use existing Moon UI semantic tokens.
- Do not make every section a card grid.
- Do not use generic AI gradients, generic 3D orbs, stock illustrations, or decorative fake telemetry.
- No text that labels a visual layer “HUD”.
- No faces in MoonWitness narrative artwork where the established canon prohibits them.
- No depiction of prophets or invented sacred figures.
- No logo or emblem creation without explicit approval.
- Keep references distinct from authored production artwork.

## 6. Asset provenance

Every visual asset included in a mockup must be tagged as one of:
- existing repository asset;
- licensed external reference;
- temporary visual reference;
- newly generated concept;
- production-ready approved asset.

A temporary reference must never be described as an asset already uploaded to the repository. Record source, license/permission status, crop, intended use, and replacement plan.

## 7. Responsive frame coverage

At minimum, inspect:
- wide desktop;
- compact desktop/small laptop;
- tablet portrait and landscape as relevant;
- narrow mobile;
- wider mobile.

Breakpoints should be chosen where content stops working, not copied from a device list. Check the intermediate widths, not only a phone and a desktop.

## 8. Interaction prototype requirements

If a mockup includes an interaction prototype:
- every button has an action;
- navigation has a real destination or clearly marked concept state;
- keyboard and touch alternatives exist;
- hover is never the only reveal mechanism;
- focus is visible and not trapped;
- reduced motion retains equivalent information;
- loading/error/empty/restricted behavior is represented.

## 9. Review and approval gates

**Gate A — Direction:** Vision, IA, journeys, and Design DNA agree.

**Gate B — Home:** Arrival, Universe, and the eight Home movements are reviewed as one experience.

**Gate C — Ecosystem:** Dock, Cockpit, Headquarter, and Moon UI boundaries remain clear.

**Gate D — Responsive/accessibility:** mobile, tablet, keyboard, reduced-motion, and contrast are reviewed.

**Gate E — Implementation handoff:** route ownership, API contracts, existing components, tokens, data sources, translations, and state behavior are checked against the current repository.

No implementation begins merely because a mockup exists. The user must approve the relevant direction and implementation scope.

## 10. Delivery Gate

Before calling the design package complete:
- [ ] All linked documents agree on product names and responsibilities.
- [ ] Home has a complete eight-movement narrative and interaction specification.
- [ ] Headquarter's six regions remain distinct from Dock and Cockpit.
- [ ] Existing Moon UI tokens are the only token source unless a change is approved.
- [ ] No unsupported content, claims, or data appear.
- [ ] Desktop, tablet, mobile, keyboard, and reduced-motion are covered.
- [ ] Empty/loading/error/restricted/offline states are covered.
- [ ] Asset provenance is documented.
- [ ] Every mockup has a clear review decision and unresolved assumptions.
- [ ] Implementation/deployment status is not overstated.

## 11. First execution order

Begin with **MW-01 Arrival / The Gate** and **MW-02 The Universe**. They establish the visual grammar and destination model used by the rest of Home. Continue to MW-03 through MW-05, then Headquarter MW-06 and MW-07, then responsive/accessibility MW-08 and the system sheet MW-09.

Do not create all mockups as one repeated template. Each frame should solve its own content and interaction problem.
