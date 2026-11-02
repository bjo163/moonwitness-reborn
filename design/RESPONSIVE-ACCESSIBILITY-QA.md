# Responsive Art Direction & Accessibility QA

**Status:** Cross-screen quality contract  
**Authority:** `MASTER-DESIGN-CONSTITUTION.md`  
**Target:** WCAG 2.2 AA for shipped public interactions

## 1. Responsive philosophy

Responsive design is art direction across contexts, not proportional shrinking. Each breakpoint must preserve the same purpose and information hierarchy while adapting composition, navigation, density, and interaction.

Use existing project breakpoints and Moon UI responsive conventions as the implementation source of truth. The ranges below are design review bands, not permission to create a competing breakpoint system.

## 2. Review bands

| Context | Approximate review width | Composition requirement |
|---|---:|---|
| Wide desktop | 1440 px and above | Full architectural scene, spacious editorial layout, clear focal point |
| Standard desktop/laptop | 1024–1439 px | Preserve focal hierarchy while reducing secondary depth and side detail |
| Tablet landscape/portrait | 768–1023 px | Recompose regions and panels; avoid compressed desktop sidebars |
| Mobile | 320–767 px | Direct vertical reading, thumb-reachable actions, compact destination navigation |

Test intermediate widths and zoom; do not rely only on named device presets.

## 3. Composition rules by context

### Desktop
- One primary focal point per viewport.
- Keep primary navigation discoverable without a full-screen menu.
- Use side/context panels only when they improve the task.
- Preserve comfortable text measure and stable contrast.
- Avoid fixed overlays that obscure the primary content.

### Tablet
- Reduce secondary visual layers before shrinking text.
- Reflow spatial landmarks into a clear region selector when needed.
- Give detail panels sufficient reading width.
- Keep controls usable in portrait and landscape.
- Do not depend on hover or precision pointer movement.

### Mobile
- Use a vertical, task-first composition.
- Keep primary actions within comfortable thumb reach.
- Use touch targets of at least 44 × 44 CSS pixels as the project design target.
- Replace wide maps/spatial scenes with named destinations and direct navigation.
- Avoid horizontal scrolling except for explicitly labelled, independently useful content.
- Keep text readable without pinch zoom.
- Never place essential text inside image artwork.
- Provide image crops with an intentional mobile focal point.

## 4. Accessibility contract

### Perceivable
- Text contrast target: 4.5:1 for normal text and 3:1 for large text.
- UI component and meaningful graphic contrast target: 3:1 where WCAG requires it.
- Do not communicate state by color alone.
- Provide meaningful alt text for informative images; decorative images use empty alt.
- Captions/transcripts for meaningful audio/video.
- Avoid flashing and excessive motion.

### Operable
- Full keyboard access with logical focus order.
- Visible focus that is not obscured.
- No keyboard traps.
- Touch targets meet WCAG 2.2 AA minimum requirements; project design target is 44 × 44 CSS pixels.
- No hover-only or drag-only essential action.
- Skip links and semantic landmarks for long pages.

### Understandable
- Clear labels and consistent navigation.
- Explain errors in plain language and provide recovery.
- Identify required fields and input constraints before submission.
- Avoid unexplained abbreviations and fake technical labels.
- Preserve Indonesian and English localization; test long strings and diacritics.

### Robust
- Semantic HTML and accessible names/roles/states.
- Screen-reader announcement for meaningful asynchronous updates.
- No reliance on visual position alone.
- Components remain usable at 200% zoom and reflow at narrow widths.
- Respect reduced motion and user preferences.

## 5. Required state coverage

For every meaningful screen and component, review applicable states:

| State | Design expectation |
|---|---|
| Default | Clear hierarchy and available actions |
| Hover | Optional preview/feedback; no essential content hidden |
| Focus | Visible, high-contrast keyboard focus |
| Selected | Clear selected state with text or shape, not color alone |
| Disabled | Explain why where the reason is not obvious |
| Loading | Real waiting state; no fabricated percentage |
| Empty | Explain what is absent and what can be done |
| Error | Describe issue and safe recovery |
| Restricted | Explain access boundary without exposing private data |
| Offline | Show real connection status and any limited capability |
| Success | Confirm only after authoritative success |

## 6. Test matrix

| Test | Desktop | Tablet | Mobile |
|---|---|---|---|
| Initial viewport and primary action | Required | Required | Required |
| Navigation and return path | Required | Required | Required |
| Keyboard-only path | Required | Required | Required |
| Screen-reader names/states | Required | Required | Required |
| Reduced-motion mode | Required | Required | Required |
| 200% zoom / text scaling | Required | Required | Required |
| Long Indonesian and English strings | Required | Required | Required |
| Loading/empty/error/restricted/offline | Required | Required | Required |
| Portrait/landscape | — | Required | Required |
| Touch target and thumb reach | — | Required | Required |
| No horizontal overflow | Required | Required | Required |

## 7. Review severity

- **Blocker:** prevents access, causes data exposure, hides a critical action, creates inaccessible trap, or misrepresents status/evidence.
- **Major:** breaks a primary journey, keyboard/touch use, responsive composition, or meaningful content comprehension.
- **Minor:** visual inconsistency or secondary friction without blocking the journey.
- **Polish:** nonessential refinement that does not affect clarity or access.

Do not approve a screen with unresolved blockers or majors in its primary journey.

## 8. Performance and resilience

- Prioritize content and navigation over decorative scene assets.
- Provide responsive image sizes and appropriate formats.
- Lazy-load noncritical media; do not lazy-load the primary visual if it causes a blank first impression.
- Provide static fallbacks for animation and scene failures.
- Avoid large assets that block interaction.
- Test on constrained mobile bandwidth and mid-range hardware.
- No implementation-specific performance claim until measured in the actual application.

## 9. Acceptance gate

- [ ] Responsive composition reviewed at narrow, intermediate, and wide widths.
- [ ] No horizontal overflow or clipped primary actions.
- [ ] Primary task works without pointer precision or hover.
- [ ] Keyboard order and visible focus are correct.
- [ ] Screen-reader names, roles, states, and announcements are meaningful.
- [ ] Contrast and non-color status cues pass.
- [ ] Reduced-motion alternative is functional.
- [ ] 200% zoom and text scaling remain usable.
- [ ] Long localized strings do not break layout.
- [ ] Empty, loading, error, restricted, offline, and success states are covered.
- [ ] Image assets have responsive crop and alt/decorative treatment.
- [ ] No blockers or majors remain for the primary journey.

## 10. Related sources

- [Master design constitution](./MASTER-DESIGN-CONSTITUTION.md)
- [Vision](./VISION.md)
- [Design DNA](./DESIGN-DNA.md)
- [Interaction, motion and sound](./INTERACTION-MOTION-SOUND.md)
- [Mockup specification](./MOCKUP-SPEC.md)
