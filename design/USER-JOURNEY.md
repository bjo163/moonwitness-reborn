# A-L-L-A-H.COM — User Journeys

**Status:** Foundation  
**Purpose:** Describe user intent and successful paths before designing screens.

## 1. Journey principles

- Start from the user's intent, not from a page template.
- Keep the first decision small and understandable.
- Allow visitors to explore public content without forced registration.
- Authentication should preserve the destination the user intended to reach.
- A failed or restricted action must explain the reason and a safe next step.
- Motion and spatial metaphors are optional enhancements, never prerequisites.
- Never invent user history, progress, notifications, or personalized recommendations.

## 2. Journey A — First-time visitor

**Intent:** Understand what A-L-L-A-H.COM is and find a meaningful place to begin.

1. Visitor arrives at Home.
2. A short, optional arrival establishes the environment and orientation.
3. The opening message explains the purpose in plain language.
4. Visitor sees the connected destinations and their distinct roles.
5. Visitor chooses a story, transmission, research item, or community path.
6. The destination opens with its content type and provenance clear.
7. Visitor can return to Home or continue to a related public item.

**Success:** Visitor understands the project and reaches one relevant destination without forced sign-in.

**Failure handling:** If a destination is unavailable, explain that it is not yet available; do not link to an empty route or fabricate a preview.

## 3. Journey B — Returning reader

**Intent:** Continue a story or transmission.

1. Visitor opens Home or a saved/bookmarked canonical URL.
2. Home may show a real recently published or featured item only if an authoritative content source provides it.
3. Reader opens the item.
4. Reader sees title, content, chapter/series context, and source/provenance labels where needed.
5. Reader continues to the next item or returns to the archive.

**Success:** The reader can resume without navigating through an unnecessary onboarding sequence.

**Empty state:** If there is no reading history or personalization source, show a neutral public discovery path rather than pretending to know what the visitor last read.

## 4. Journey C — Research-minded visitor

**Intent:** Inspect evidence behind a claim or research note.

1. Visitor opens a research item.
2. The item identifies whether it is a fact summary, hypothesis, reflection, or creative narrative.
3. Source list shows title, publisher/author, date, and direct reference where available.
4. Method, uncertainty, and limitations are visible when relevant.
5. Visitor opens the primary source or related records.
6. Visitor returns to the item without losing context.

**Success:** The visitor can distinguish source evidence from interpretation.

**Failure handling:** Missing or unverified sources are disclosed. Do not display a confidence score unless the method and data support it.

## 5. Journey D — Community participant

**Intent:** Discover how to participate.

1. Visitor opens Community from Home.
2. A short explanation sets expectations and points to community guidelines.
3. Public information remains readable without sign-in where appropriate.
4. Participation action leads to Dock.
5. If authentication is required, the user signs in and returns to the intended action.
6. User sees permission, posting, and moderation constraints before submitting.

**Success:** The user understands how to participate and what rules apply.

**Failure handling:** If posting is unavailable or permission is missing, explain why and offer a valid alternative.

## 6. Journey E — Member entering Cockpit

**Intent:** Open personal workspace or saved work.

1. User selects Cockpit.
2. Authentication is checked through the existing application contract.
3. On success, user lands in the intended personal destination.
4. Only the user's authorized personal data is shown.
5. User can return to Home or MoonWitness.

**Success:** A secure, direct transition into personal work.

**Failure handling:** Expired session returns to sign-in with the destination preserved. No private details appear in a public error message.

## 7. Journey F — Authorized operator entering Headquarter

**Intent:** Coordinate missions, knowledge, and system operations.

1. Operator selects the authorized Headquarter entry.
2. Server-side authorization is checked.
3. Command Deck presents the current context and available regions.
4. Each region shows only authoritative data within the operator's permission.
5. An operation requires explicit confirmation when it is consequential.
6. The system records the relevant audit event where supported.

**Success:** Operator reaches the correct operational function with clear scope and traceability.

**Failure handling:** Unauthorized users receive a safe restricted state. The UI must not leak role lists, private records, service secrets, or operational internals.

## 8. Journey G — Mobile visitor

**Intent:** Complete any public journey on a phone.

- Arrival can be skipped and does not require camera movement.
- Primary navigation is reachable by thumb.
- Content reflows to a single-column reading path where appropriate.
- Spatial map/scene becomes a concise set of labeled destinations.
- No hover-only interaction exists.
- No horizontal overflow or clipped controls.
- Touch targets meet the 44 × 44 CSS pixel minimum.
- Sticky navigation respects safe-area insets and never covers the final content/action.

**Success:** The same information and essential actions are available without a desktop or landscape screen.

## 9. Journey H — Reduced-motion and assistive technology

**Intent:** Use the experience without cinematic movement or visual-only cues.

- Reduced-motion preference removes camera travel, parallax, and nonessential transitions.
- The visitor can use semantic navigation and direct links.
- Focus order follows reading and action order.
- State changes are announced appropriately.
- Meaning is not communicated by color, sound, or spatial position alone.

**Success:** No essential information or action is lost.

## 10. Cross-journey state contract

| State | User-facing response |
|---|---|
| Loading | Identify what is loading when helpful; preserve usable navigation |
| Empty | Explain why content is absent and the next useful action |
| Error | Explain what failed without exposing internals; offer retry when safe |
| Offline | State what cannot be reached and preserve any genuinely available local state |
| Restricted | Explain that access is limited without confirming protected record details |
| Success | Confirm the action and its result; do not imply more than the server confirmed |
| Stale | Identify that displayed information may be outdated and provide refresh where safe |

## 11. Journey acceptance

- A visitor can complete the first-time journey without an account.
- Deep links open the intended destination.
- Authentication preserves the intended destination.
- Restricted data is never exposed in client-only logic.
- Every action has a defined success, failure, and permission state.
- Mobile, keyboard, and reduced-motion paths remain complete.
- Personalization is based on actual data and consent, not invented history.
