# Interaction, Motion & Sound Direction

**Status:** Interaction specification  
**Authority:** `MASTER-DESIGN-CONSTITUTION.md`  
**Scope:** Shared interaction behavior across A-L-L-A-H.COM and Moon UI

## 1. Interaction philosophy

The world may be spatial, but the interface must remain direct. The user should never need to learn a game control scheme to read a story, find a destination, or complete a task. Spatial affordances enrich navigation; conventional controls guarantee access.

Every interaction must answer three questions:
1. What can I do here?
2. What will happen if I do it?
3. How do I recover, cancel, or return?

## 2. Input model

| Input | Required behavior |
|---|---|
| Pointer | Click/tap targets, optional hover preview, visible focus |
| Keyboard | Tab order, Enter/Space activation, Escape dismissal, arrow keys only where a familiar composite pattern is used |
| Touch | Large targets, no hover dependency, gestures optional |
| Screen reader | Semantic names, roles, state announcements, logical reading order |
| Reduced motion | Static or low-motion equivalent for every spatial transition |

Never implement a custom interaction where a native semantic control already solves the task accessibly.

## 3. Navigation choreography

- Primary destinations remain available through a stable navigation structure.
- Spatial landmarks may provide a second, more immersive way to navigate.
- Selecting a landmark gives immediate visual feedback and a clear destination name.
- Context panels open adjacent to the selected object without covering the primary action.
- Breadcrumb or equivalent orientation remains available after entering a subspace.
- Back/Escape behavior must be consistent and must not unexpectedly discard unsaved work.
- Focus returns to the initiating control when a modal or popover closes.
- Deep links must open the same destination without requiring the arrival animation.

## 4. Motion vocabulary

| Motion | Trigger | Purpose | Default behavior |
|---|---|---|---|
| Arrival | First entry or explicit replay | Establish place and orientation | Short, skippable, never blocks |
| Approach | User chooses a destination | Reinforce spatial transition | Brief, interruptible |
| Landmark response | Hover, focus, selection | Confirm target and state | Subtle, immediate |
| Panel reveal | User opens contextual detail | Preserve hierarchy | Short opacity/position change |
| Content reveal | User expands a section | Show progressive detail | Local, no whole-page theatrics |
| Success | Server confirms action | Confirm completion | Clear and restrained |
| Error | Operation fails | Explain recovery | No celebratory animation |
| Loading | Real asynchronous work | Communicate waiting | Indeterminate unless measurable progress exists |

## 5. Timing and easing

These are starting design ranges, not mandatory animation on every element:
- micro feedback: 100–180 ms;
- local panel/content transition: 160–260 ms;
- spatial scene transition: 280–550 ms;
- full arrival sequence: aim for 2–4 seconds, with skip available immediately.

Use existing Moon UI motion tokens where available. If a required token is missing, propose it rather than inventing local values across multiple screens. Prefer ease-out for entering, ease-in for leaving, and restrained standard easing for state changes. Avoid elastic/bouncy motion for serious navigation or research content.

## 6. Reduced motion and resilience

- Respect `prefers-reduced-motion` and provide an in-product motion preference if the product already supports preferences.
- In reduced-motion mode, replace camera travel with a direct scene change or simple opacity transition.
- No parallax, looping movement, or forced zoom when reduced motion is active.
- If animation assets fail, navigation and content remain fully usable.
- Never delay an actionable interface until an animation finishes.
- Avoid flashing, rapid luminance changes, and motion that can cause vestibular discomfort.

## 7. Sound direction

- Sound is off by default and never starts automatically with sound.
- Sound is not used to communicate essential status or instructions.
- A persistent, understandable control is required if optional sound is offered.
- Respect mute, device settings, and reduced sensory preferences.
- Audio assets require documented source, license, intended use, and fallback.
- No sound effect should imitate an alarm or emergency signal unless it represents a real, authorized alert.

## 8. Component behavior contract

| Component pattern | Behavior |
|---|---|
| Button | Clear verb, visible focus, disabled reason where relevant |
| Link | Navigates; does not imitate an action button without reason |
| Landmark | Has name, destination, selected/focus state, keyboard equivalent |
| Dialog | Traps focus appropriately, closes predictably, restores focus |
| Popover | Dismissible, keyboard reachable, does not hide critical content |
| Tabs | Familiar keyboard behavior and clear selected state |
| Disclosure | Announces expanded/collapsed state |
| Toast | Brief feedback; important errors persist in a readable region |
| Progress | Only when backed by measurable progress |
| Status | Text/icon plus color; never color alone |

## 9. State truth contract

- Loading means a real request or operation is pending.
- Success means the authoritative operation succeeded.
- Error means an operation failed or data could not be retrieved.
- Empty means a valid result contains no items.
- Restricted means the user lacks permission; do not leak protected data.
- Offline means connectivity is unavailable or a known offline mode is active.
- No fake percentage, simulated scanning, or decorative activity indicator.

## 10. Interaction acceptance checklist

- [ ] Every interactive element has a discoverable purpose.
- [ ] All pointer interactions have keyboard and touch equivalents.
- [ ] Hover is never the only way to discover a control.
- [ ] Escape/back behavior is consistent and safe.
- [ ] Focus is visible and restored after overlays close.
- [ ] Deep links bypass cinematic entry.
- [ ] Reduced-motion behavior is defined.
- [ ] Sound is optional, off by default, and licensed.
- [ ] Loading and success states reflect real operations.
- [ ] No fake progress, telemetry, or state.
- [ ] Core content and actions remain available if motion fails.

## 11. Related sources

- [Master design constitution](./MASTER-DESIGN-CONSTITUTION.md)
- [Design DNA](./DESIGN-DNA.md)
- [Design tokens](./DESIGN-TOKENS.md)
- [Responsive and accessibility QA](./RESPONSIVE-ACCESSIBILITY-QA.md)
