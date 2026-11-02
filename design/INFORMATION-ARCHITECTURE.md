# A-L-L-A-H.COM — Information Architecture

**Status:** Foundation  
**Purpose:** Define destinations, navigation, boundaries, content types, and access levels.

## 1. Top-level map

```text
A-L-L-A-H.COM
├── Home / The Gate
│   ├── Arrival
│   ├── The Universe
│   ├── Explore
│   ├── Transmissions
│   ├── Discover
│   ├── Community
│   ├── Your Journey
│   └── Closing / Next step
│
├── MoonWitness
│   ├── Transmissions
│   ├── Stories / Chapters
│   ├── Universe Archive
│   ├── Living Timeline
│   ├── Research & Sources
│   └── Creative Collections
│
├── Dock
│   ├── Community overview
│   ├── Discussions / circles
│   ├── Contributions
│   └── Community guidelines
│
├── Cockpit [authenticated]
│   ├── Personal workspace
│   ├── AI interaction
│   ├── Saved work
│   ├── Personal tools
│   └── Preferences
│
└── Headquarter [role-restricted]
    ├── Command Deck
    ├── Identity & Access
    ├── Mission Control
    ├── Knowledge & Intelligence
    ├── Universe & Transmissions
    └── System Observatory
```

The tree describes conceptual destinations. It does not assert that every route or feature already exists.

## 2. Destination responsibilities

| Destination | Primary question it answers | Owns | Must not own |
|---|---|---|---|
| Home | What is this world and where can I go? | Public orientation and discovery | Member operations, private data |
| MoonWitness | What is the story, transmission, or archive? | Narrative and creative archive | Account settings, admin control |
| Dock | Where can people participate together? | Community and contribution interaction | System administration |
| Cockpit | What am I working on? | Personal workspace and preferences | Public editorial home |
| Headquarter | What is happening across the ecosystem? | Authorized coordination and operations | Personal-only workspace |
| Moon UI | How should interfaces behave and look? | Shared design system | Product-specific content |

## 3. Home navigation model

The Home experience has two navigation layers:

**Primary destinations**
- The Universe
- Transmissions
- Explore
- Community
- Your Journey / Sign in

**Contextual paths**
- Read a story
- Open a research source
- View a timeline
- Visit Dock
- Enter Cockpit
- Enter Headquarter (only when the user's role and access permit it)

Do not expose Headquarter as a public operational destination to anonymous visitors. If a public link to the sign-in entry exists, it must not reveal restricted data or imply access is guaranteed.

## 4. Navigation behavior

- The primary navigation remains understandable without animation.
- Desktop may use a restrained persistent navigation rail or top-level spatial anchors, selected after mockup review.
- Mobile must use a compact menu or bottom navigation appropriate to the public site's content; do not squeeze the desktop nav.
- All hover previews must have click/tap and keyboard equivalents.
- Active destination is identified by more than color alone.
- Back navigation preserves useful context when possible.
- External links are clearly identified.
- A visitor should never be trapped in a cinematic scene or modal.

## 5. Content model and taxonomy

Each public content item should be modeled conceptually with:
- stable identifier;
- title and short description;
- content type;
- language and localization status;
- publication status;
- author/owner where appropriate;
- created and updated timestamps;
- source/provenance references;
- visibility/access classification;
- related items;
- canonical destination.

Recommended content types:
- `transmission`
- `story`
- `chapter`
- `archive_item`
- `timeline_event`
- `research_note`
- `source_reference`
- `community_contribution`
- `campaign`
- `mission`

Do not create a data model or schema solely from this conceptual list. Actual domain models belong to QlOrm `ql_*` addons and require a separate implementation task.

## 6. Visibility and access classes

| Class | Meaning | Example |
|---|---|---|
| Public | Available without sign-in | Published story, public transmission |
| Member | Requires authenticated account | Personal saved work, member participation |
| Owner-only | Visible to the owning user | Private notes, personal settings |
| Role-restricted | Requires explicit role/permission | Headquarter operations |
| Internal-secret | Never exposed to browser UI | Credentials, tokens, private keys |

The server/API must enforce access. Hiding a link in the UI is not an access-control mechanism.

## 7. Search and discovery

Search should distinguish:
- story and chapter results;
- transmissions;
- research and source records;
- timeline entries;
- community material.

Filters must be based on real indexed metadata. Do not show empty filters, fake counts, or result totals that are not returned by an authoritative service.

A result card/list item should communicate its content type, title, concise context, language, and provenance when relevant. Avoid treating every content type as an identical card.

## 8. Cross-product handoffs

- Home → MoonWitness: open the relevant public story/transmission at its canonical location.
- Home → Dock: explain participation and community expectations before entry if necessary.
- Home → Cockpit: authenticate, then return to the intended personal destination.
- Home → Headquarter: allow only authorized roles; preserve a safe sign-in/denied path.
- MoonWitness → Dock: allow discussion/contribution handoff only when a real feature exists.
- MoonWitness → Cockpit: save/resume actions require authentication and must preserve return context.
- Dock → Cockpit: personal work and settings belong to Cockpit.
- Cockpit → Headquarter: only authorized operators can enter operational functions.

## 9. Route contract

Final route strings are intentionally not frozen in this document. Before mockup implementation, inspect the current Next.js route tree and existing route ownership. Reuse existing routes where appropriate; do not create duplicate destinations or dead links.

A route map approved for implementation must list:
- route path;
- owning application/layout;
- public or protected access;
- canonical page;
- entry points;
- fallback and unauthorized behavior;
- translation keys;
- analytics/privacy requirements if analytics are enabled.

## 10. Architecture contract

- Web remains within the existing Next.js application architecture.
- Browser API communication uses `@moonwitness/moonclient`.
- Shared components and tokens come from `@moonwitness/ui`.
- Domain data, ownership, ACL, and views belong to QlOrm `ql_*` addons.
- No parallel backend, direct browser database access, or second identity authority.
- Keep Indonesian and English translation catalogs aligned.
- Respect deny-by-default ACL and record ownership.

## 11. IA acceptance criteria

- Every primary destination has one clear responsibility.
- No destination owns another product's core function.
- Every navigation item has a real route/action or is explicitly identified as unavailable/future.
- Public and restricted content are visibly and technically separated.
- The sitemap is understandable to first-time visitors.
- The route contract is checked against the actual repository before coding.
