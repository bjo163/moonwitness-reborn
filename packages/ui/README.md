# @moonwitness/ui

The MoonWitness design system: one token layer, one browser reset, one `.ql-*`
component vocabulary, and the React primitives and composites that consume them.
A consuming app imports the design system and never writes CSS of its own —
that boundary is `MW-ADR-020`, and `@moonwitness/eslint-config` enforces it.

## Install

```json
{
  "dependencies": {
    "@moonwitness/ui": "workspace:*"
  }
}
```

Wire the stylesheet once, in the app's global CSS entry:

```css
/* apps/<app>/src/app/globals.css — this is the whole file. */
@import "@moonwitness/ui/preset.css";
```

`preset.css` is the only entry an app should import. It composes
`@import "tailwindcss"` → `tokens.css` → `base.css` → `components.css` in that
order, so the `@theme` block extends the Tailwind palette before any rule reads
it. The legacy `@moonwitness/ui/styles.css` path still resolves (a three-import
aggregator) for consumers that adopted the package before the split; new apps
use `preset.css` or they get no named Tailwind utilities.

## Layers

| Layer | Contents |
| --- | --- |
| `raw/` | semantic, unstyled primitives (`RawField`) |
| `atoms/` | accessible styled controls (`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Badge`) |
| `blocks/` | interaction patterns (`FormField`) |
| `components/` | reusable surfaces (`Card`/`CardHeader`/`CardContent`, `Alert`, `DataTable`) |
| `composites/` | cross-screen building blocks (list below) |
| `templates/` | page structure (`WorkspaceTemplate`, `CenteredAuth`) |

### Composites

Each one replaces markup that used to be copy-pasted across `apps/web` screens.
None of them declare `"use client"` — interactive state stays in the screen, so
they render from a Server or Client boundary alike. All copy arrives through
props: the package owns no user-facing text.

| Component | Replaces |
| --- | --- |
| `NavLink` | `<Link className="ql-nav-link is-active" aria-current="page">` rows |
| `SidebarNav`, `NavSectionLabel` | the scrollable sidebar `<nav>` and its group headings |
| `SidebarBrand` | the brand mark + wordmark link |
| `SidebarFooter` | the identity chip + logout row |
| `WorkspaceSidebar` | the whole sidebar: brand row, nav list, extra sections, footer |
| `PageHeader` | eyebrow + `<h1>` + description + right-aligned actions |
| `LoadingScreen` | full-viewport loading surface; shows an error `Alert` instead when `error` is set |
| `EmptyState` | "nothing here yet" surface |
| `SectionGrid` | `grid grid-cols-1 … md:grid-cols-N` card/form grids |
| `IconTile` | the squared glyph (`size` sm/md/lg, `tone` accent/plain) |
| `MetricList`, `MetricRow` | `<dl>` label/value rows and their hairline dividers |
| `ListOption` | a selectable master-detail row (`card`, or `nav` to match sidebar rows) |
| `SidePanel` | the right-hand editor drawer |

```tsx
import {
  PageHeader,
  SectionGrid,
  SidebarBrand,
  WorkspaceSidebar,
  type SidebarNavItem,
} from "@moonwitness/ui";

const items: readonly SidebarNavItem[] = [
  { href: "/command-center", label: "Dashboard", active: true },
  { href: "/models", label: "Models" },
];

export function Workspace({ user, closeLabel }: Props) {
  return (
    <WorkspaceSidebar
      brandIcon={<Sparkles aria-hidden="true" size={16} />}
      closeLabel={closeLabel}
      identity={{ name: user.name, subtitle: user.email }}
      items={items}
      logout={{ label: "Sign out", onLogout: () => void signOut() }}
      navLabel="Main navigation"
      onCloseSidebar={() => setSidebarOpen(false)}
    />
  );
}
```

## Tokens

`styles/tokens.css` is the only place a colour or font value is written. The
`@theme` block feeds Tailwind named utilities, so markup says `text-ink-soft`,
never `text-stone-300`, and never `bg-[#121a13]`:

`ink`, `ink-soft`, `muted`, `muted-dim`, `panel`, `panel-raised`, `panel-deep`,
`panel-deeper`, `panel-edge`, `panel-well`, `hairline`, `hairline-soft`,
`hairline-strong`, `acid`, `acid-dark`, `acid-muted`, `acid-shadow`, `danger`,
`void`; fonts `sans`, `mono`; shadows `shadow-hud`, `shadow-hud-sm`.

The `:root` block re-aliases the same values as `--ql-ui-*` for the `.ql-*`
rules. Both blocks are asserted by `tests/tokens.test.ts`: a token consumed but
never declared, a removed legacy alias, or a component reaching for an
undeclared token name all fail `pnpm --filter @moonwitness/ui test`.

### Adding a token

1. Declare it in the `@theme` block of `styles/tokens.css`; add a `--ql-ui-*`
   alias in `:root` only if a `.ql-*` rule needs to read it.
2. Use it as a utility (`text-<name>`, `bg-<name>`, `border-<name>`) in the
   component, or as `var(--color-<name>)` inside `components.css`.
3. Never re-declare the hex in a screen. The lint gate fails default-palette and
   arbitrary-hex classes in `apps/web/src/**/*.tsx`, and `tests/tokens.test.ts`
   fails a component that names a token that does not exist.

## Testing and boundaries

```
pnpm --filter @moonwitness/ui test        # 18 rendering + token contract tests
pnpm --filter @moonwitness/ui typecheck   # build project and tests project
```

The package does no data fetching: it must not import `@moonwitness/moonclient`
or any `ql_*` addon. `lucide-react` is an optional peer dependency — components
accept an `icon` prop rather than hardcoding a glyph, except where one glyph is
the whole point of the control (`SidebarFooter`'s logout, `SidePanel`'s close).
