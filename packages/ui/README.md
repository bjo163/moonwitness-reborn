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
| `OptionNav` | the same `<nav>` shell for sidebar lists whose rows are selectable options instead of links |
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
  OptionNav,
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

## Examples

One usage per exported primitive and composite. `apps/web` is the reference for
how these compose into a screen.

### Atoms and blocks

```tsx
<Button size="sm" variant="secondary">Save</Button>
<Button size="icon" variant="ghost" aria-label="Close"><X /></Button>

<Input id="name" maxLength={80} placeholder="Name" value={name} onChange={onChange} />
<Textarea id="value" rows={4} value={value} onChange={onChange} />
<Select id="kind" value={kind} onChange={onChange}><option value="dns">DNS</option></Select>
<Checkbox id="enabled" checked={enabled} onChange={onChange} />

<Badge variant="live">Synced</Badge>
<Badge variant="outline">Read only</Badge>
<Alert variant="error">{message}</Alert>

<FormField label="Connector" htmlFor="connector-kind">
  <Select id="connector-kind" value={kind} onChange={onChange} />
</FormField>

{/* The unstyled layer FormField builds on; use it when the field needs no
   design-system chrome of its own. */}
<RawField label="Value" htmlFor="raw-value" description="Free text">
  <input id="raw-value" />
</RawField>
```

### Surfaces

```tsx
<Card>
  <CardHeader><h2>Accounts</h2></CardHeader>
  <CardContent>Body text.</CardContent>
  {/* `.ql-card--flush` removes the card padding, e.g. for a full-bleed table. */}
  <CardContent className="ql-card--flush"><DataTable {/* … */} /></CardContent>
</Card>

<DataTable
  columns={columns}
  rows={rows}
  rowKey="id"
  emptyMessage={t("web.adminUsers.empty")}
  actionsLabel={t("web.common.actions")}
  yesLabel={t("web.common.yes")}
  noLabel={t("web.common.no")}
  onRowClick={(row) => select(row)}
  renderActions={(row) => <Button size="sm">Edit</Button>}
/>
```

All four label props are required: the package must not carry user-facing copy,
so every caller passes localised strings from the catalogue.

### Page structure

```tsx
<CenteredAuth>
  <h1>Sign in</h1>
  <form>{/* … */}</form>
</CenteredAuth>

<WorkspaceTemplate
  sidebar={<WorkspaceSidebar {/* … */} />}
  header={<>{title}<LocaleSwitcher /></>}
  sidebarOpen={sidebarOpen}
  onCloseSidebar={() => setSidebarOpen(false)}
  closeLabel={t("web.common.closeMenu")}
>
  <div className="ql-page-body">{/* screen content */}</div>
</WorkspaceTemplate>
{/* Standalone loading / error surface for a screen resolving its session. */}
<LoadingScreen label={t("web.common.loading")} />
<LoadingScreen error={authFailure} />
```

### Composites

```tsx
<PageHeader
  eyebrow={t("web.models.section")}
  title={modelLabel}
  description={modelDescription}
  actions={<Button onClick={openForm}>Add record</Button>}
/>

<NavLink href="/workflow" icon={<ShieldCheck />} active>
  {t("web.common.workflow")}
</NavLink>

<SidebarNav
  label={t("web.common.mainNavigation")}
  items={[
    { href: "/command-center", label: "Dashboard", active: true },
    { href: "/models", label: "Models", onSelect: () => setSidebarOpen(false) },
  ]}
/>
<NavSectionLabel>Zones</NavSectionLabel>

{/* Same list geometry, rows supplied by the screen: use this instead of
   writing className="ql-sidebar-nav" on a hand-built <nav>. */}
<OptionNav label={t("web.dns.zoneList")}>
  {zones.map((zone) => (
    <ListOption
      key={zone.id}
      selected={zone.id === selectedZoneId}
      variant="nav"
      onSelect={() => selectZone(zone)}
    >
      {zone.name}
    </ListOption>
  ))}
</OptionNav>

<SidebarBrand href="/command-center" icon={<Sparkles />} label="MoonWitness" />

<SidebarFooter
  userName={user.name}
  userSubtitle={user.email}
  logoutLabel={t("web.common.logout")}
  onLogout={() => void signOut()}
/>

<SectionGrid columns={3} gap={6}>{cards}</SectionGrid>

<EmptyState
  icon={<BookOpen />}
  title={t("web.corpus.noEditions")}
  description={t("web.corpus.noEditionsHint")}
  action={<Button onClick={refresh}>Retry</Button>}
/>

<IconTile size="sm" tone="accent"><Sparkles /></IconTile>
<IconTile size="lg" tone="plain"><Bot /></IconTile>

<MetricList>
  <MetricRow label={t("web.landing.done")} value="38 / 117" hint="since Monday" />
  <MetricRow label={t("web.landing.blocked")} value={64} divided={false} />
</MetricList>

{/* Master-detail rows: `nav` matches sidebar rows, `card` is a boxed row. */}
<ListOption
  selected={entry.id === selectedId}
  onSelect={() => setSelectedId(entry.id)}
  variant="nav"
  ariaLabel={`${entry.namespace}.${entry.key}`}
>
  {entry.key}
</ListOption>

<SidePanel
  label={t("web.dns.recordForm")}
  eyebrow={t("web.dns.newRecordLabel")}
  title={zone.name}
  closeLabel={t("web.dns.closeForm")}
  onClose={() => setDraft(null)}
>
  <form className="ql-side-panel__form">{/* fields */}</form>
</SidePanel>
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

## Raw `.ql-*` class contracts

Most shapes are reached through a component. A handful are modifiers of markup
the caller must own (a card body that has to carry the `DataTable`, the page
scroll container inside `WorkspaceTemplate`), so the package exports the class
name as the contract instead of a wrapper:

| Class | Applied to | Why it stays a class |
| --- | --- | --- |
| `ql-page-body` | the screen's content wrapper | the wrapper holds arbitrary screen markup |
| `ql-card` | an `<aside>`/`<article>` that must stay a semantic element | `Card` renders a `div`, the surface rule is reusable |
| `ql-card--flush` | `CardContent` | modifier of a component the caller already renders |
| `ql-inline-label` | a `label` wrapping a `Checkbox` | the label text belongs to the field |
| `ql-side-panel__form` | the `form` inside `SidePanel` | the form's fields belong to the screen |
| `ql-eyebrow` | an eyebrow above a local heading | `PageHeader`/`SidePanel` already own it where they render |
| `ql-hud-app` | a `<main>` outside `WorkspaceTemplate`/`CenteredAuth` (landing, reader) | the screen is its own page shell |
| `ql-hud-thread`, `ql-hud-composer`, `ql-hud-status`, `ql-hud-user-message`, `ql-hud-assistant-mark` | the assistant chat surface | message markup is screen-owned; only the surface is shared |

Anything not in this table must come from a component: a screen that writes
`ql-nav-link`, `ql-icon-tile`, or `ql-metric-row` by hand is re-implementing a
composite, which MW-0576 forbids.

## Testing and boundaries

```
pnpm --filter @moonwitness/ui test        # 37 rendering + token contract tests
pnpm --filter @moonwitness/ui typecheck   # build project and tests project
```

Two properties are locked by those tests, because both regress silently: every
composite keeps its design-system class when a caller passes `className` (a
table-driven contract over all 16 composites), and no rendered markup contains a
hex value or a Tailwind default-palette class. `tests/tokens.test.ts` adds the
css side: every token a component or rule consumes must be declared in
`tokens.css`, and no other stylesheet may write a colour literal.

The package does no data fetching: it must not import `@moonwitness/moonclient`
or any `ql_*` addon. `lucide-react` is an optional peer dependency — components
accept an `icon` prop rather than hardcoding a glyph, except where one glyph is
the whole point of the control (`SidebarFooter`'s logout, `SidePanel`'s close).
