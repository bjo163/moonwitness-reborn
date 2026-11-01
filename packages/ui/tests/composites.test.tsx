import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import {
  EmptyState,
  IconTile,
  ListOption,
  LoadingScreen,
  MetricList,
  MetricRow,
  NavSectionLabel,
  NavLink,
  PageHeader,
  SectionGrid,
  SidePanel,
  SidebarBrand,
  SidebarFooter,
  SidebarNav,
  WorkspaceSidebar,
  type SidebarNavItem,
} from "../src/index.js";

/**
 * Rendering contract for the `@moonwitness/ui` composites (MW-0574, MW-0580).
 *
 * Two properties matter for the centralisation workstream and are easy to
 * regress silently: the design-system class must survive a caller-supplied
 * `className`, and no screen may end up shipping its own colours again. The
 * second one is asserted on rendered markup, so it catches a hardcoded colour
 * wherever it lands, and comments are irrelevant to it.
 */
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const DEFAULT_PALETTE =
  /(?:bg|text|border|divide|outline|ring|placeholder)-(?:stone|zinc|neutral|gray|slate|white|black|amber|emerald|green|red|rose|sky|blue)-\d?/;

function render(node: ReactNode): string {
  return renderToStaticMarkup(node);
}

function assertNoOwnColours(markup: string, label: string): void {
  assert.equal(HEX.test(markup), false, `${label} rendered a hex colour`);
  assert.equal(
    DEFAULT_PALETTE.test(markup),
    false,
    `${label} rendered a Tailwind default-palette class`,
  );
}

void test("NavLink keeps ql-nav-link when className overrides and marks the active row", () => {
  const plain = render(
    <NavLink href="/models">Models</NavLink>,
  );
  assert.match(plain, /class="ql-nav-link"/);
  assert.match(plain, /href="\/models"/);
  assert.doesNotMatch(plain, /aria-current/);

  const overridden = render(
    <NavLink className="mt-2" href="/models">
      Models
    </NavLink>,
  );
  assert.match(overridden, /ql-nav-link/);
  assert.match(overridden, /mt-2/);

  const active = render(
    <NavLink active href="/models">
      Models
    </NavLink>,
  );
  assert.match(active, /is-active/);
  assert.match(active, /aria-current="page"/);
  assertNoOwnColours(active, "NavLink");
});

void test("SidebarBrand renders the wordmark, the tile, and a safe default href", () => {
  const markup = render(<SidebarBrand icon={<i />} label="MoonWitness" />);
  assert.match(markup, /href="\/command-center"/);
  assert.match(markup, /ql-hud-brand/);
  assert.match(markup, /rounded-xl/);
  assert.match(markup, /border-hairline/);
  assert.match(markup, /bg-panel-edge/);
  assert.match(markup, /text-acid/);
  assert.match(markup, /MoonWitness/);
  assertNoOwnColours(markup, "SidebarBrand");
});

void test("SidebarFooter renders identity lines and only logs out when asked", () => {
  const withLogout = render(
    <SidebarFooter
      logoutLabel="Sign out"
      onLogout={() => undefined}
      userSubtitle="user@example.com"
      userName="Ada"
    />,
  );
  assert.match(withLogout, /border-t/);
  assert.match(withLogout, /Ada/);
  assert.match(withLogout, /user@example\.com/);
  assert.match(withLogout, /aria-label="Sign out"/);
  assertNoOwnColours(withLogout, "SidebarFooter (logout)");

  const identityOnly = render(
    <SidebarFooter logoutLabel="Sign out" userName="Ada" />,
  );
  assert.doesNotMatch(identityOnly, /aria-label="Sign out"/);
  assertNoOwnColours(identityOnly, "SidebarFooter (identity only)");
});

void test("PageHeader emits eyebrow, heading, description and an action slot", () => {
  const markup = render(
    <PageHeader
      actions={<button type="button">Add</button>}
      description="A description"
      eyebrow="Section"
      title="Providers"
    />,
  );
  assert.match(markup, /<h1[^>]*>Providers<\/h1>/);
  assert.match(markup, /A description/);
  assert.match(markup, /Section/);
  assert.match(markup, /text-acid-dark/);
  assertNoOwnColours(markup, "PageHeader");
});

void test("LoadingScreen prefers the error over the label and exposes a status", () => {
  const loading = render(<LoadingScreen label="Loading" />);
  assert.match(loading, /ql-hud-app/);
  assert.match(loading, /role="status"/);
  assert.match(loading, /Loading/);

  const failed = render(<LoadingScreen error="Boom" label="Loading" />);
  assert.match(failed, /role="alert"/);
  assert.match(failed, /Boom/);
  assert.doesNotMatch(failed, /Loading/);
  assertNoOwnColours(failed, "LoadingScreen");
});

void test("EmptyState and SectionGrid compose without stealing the caller class", () => {
  const empty = render(
    <EmptyState className="mt-6" description="Nothing here" title="Empty" />,
  );
  assert.match(empty, /border-hairline/);
  assert.match(empty, /mt-6/);
  assert.match(empty, /Nothing here/);
  assertNoOwnColours(empty, "EmptyState");

  const grid = render(
    <SectionGrid className="mt-4" columns={3}>
      <span>row</span>
    </SectionGrid>,
  );
  assert.match(grid, /grid-cols-1/);
  assert.match(grid, /md:grid-cols-3/);
  assert.match(grid, /mt-4/);
  assertNoOwnColours(grid, "SectionGrid");
});

void test("MetricList/MetricRow pair the terms and can drop the divider", () => {
  const markup = render(
    <MetricList>
      <MetricRow divided={false} hint="last run" label="Done" value={7} />
      <MetricRow label="Blocked" value={2} />
    </MetricList>,
  );
  assert.match(markup, /<dl/);
  assert.match(markup, /<dt/);
  assert.match(markup, /<dd/);
  assert.match(markup, /last run/);
  const rows = markup.split("</dt>");
  assert.equal(/sm:border-b-0/.test(rows[0]), false, "first row must be undivided");
  assert.match(rows[1], /sm:border-b-0/);
  assertNoOwnColours(markup, "MetricRow");
});

void test("IconTile exposes size and tone variants", () => {
  const accent = render(
    <IconTile size="sm">
      <i />
    </IconTile>,
  );
  assert.match(accent, /size-8/);
  assert.match(accent, /text-acid/);
  assert.match(accent, /aria-hidden="true"/);

  const large = render(
    <IconTile size="lg" tone="plain">
      <i />
    </IconTile>,
  );
  assert.match(large, /size-14/);
  assert.match(large, /shadow-hud-sm/);
  assert.match(large, /text-ink-soft/);
  assertNoOwnColours(large, "IconTile");
});

void test("NavSectionLabel renders the design-system section heading", () => {
  const markup = render(<NavSectionLabel>Zones</NavSectionLabel>);
  assert.match(markup, /ql-nav-section/);
  assert.match(markup, /Zones/);
  assertNoOwnColours(markup, "NavSectionLabel");
});

void test("ListOption marks selection with is-selected, and is-active in the nav variant", () => {
  const card = render(
    <ListOption onSelect={() => undefined} selected>
      key.one
    </ListOption>,
  );
  assert.match(card, /ql-list-option/);
  assert.match(card, /is-selected/);
  assert.match(card, /aria-current="true"/);

  const nav = render(
    <ListOption onSelect={() => undefined} selected variant="nav">
      key.two
    </ListOption>,
  );
  assert.match(nav, /ql-nav-link/);
  assert.match(nav, /is-active/);
  assert.doesNotMatch(nav, /is-selected/);

  const idle = render(
    <ListOption onSelect={() => undefined} selected={false}>
      key.three
    </ListOption>,
  );
  assert.doesNotMatch(idle, /is-selected|is-active|aria-current/);
  assertNoOwnColours(nav, "ListOption");
});

void test("SidePanel labels itself, shows the eyebrow and closes through a Button", () => {
  const markup = render(
    <SidePanel
      closeLabel="Close form"
      eyebrow="New record"
      label="Record form"
      onClose={() => undefined}
      title="example.com"
    >
      <p>fields</p>
    </SidePanel>,
  );
  assert.match(markup, /ql-side-panel/);
  assert.match(markup, /aria-label="Record form"/);
  assert.match(markup, /<h2[^>]*>example\.com<\/h2>/);
  assert.match(markup, /New record/);
  assert.match(markup, /aria-label="Close form"/);
  assert.match(markup, /class="ql-button/);
  assert.match(markup, /fields/);
  assertNoOwnColours(markup, "SidePanel");
});

const items: readonly SidebarNavItem[] = [
  { href: "/command-center", label: "Dashboard" },
  { href: "/workflow", label: "Workflow", active: true },
];

void test("SidebarNav renders one accessible labelled list with the given items", () => {
  const nav = render(<SidebarNav items={items} label="Main navigation" />);
  assert.match(nav, /<nav[^>]*aria-label="Main navigation"/);
  assert.equal((nav.match(/ql-nav-link/g) ?? []).length, 2);
  assert.match(nav, /aria-current="page"/);
  assertNoOwnColours(nav, "SidebarNav");
});

void test("WorkspaceSidebar composes brand row, nav list, children and footer once", () => {
  const markup = render(
    <WorkspaceSidebar
      brandIcon={<i />}
      brandLabel="MoonWitness"
      closeLabel="Close menu"
      identity={{ name: "Ada", subtitle: "ada@example.com" }}
      items={items}
      logout={{ label: "Sign out", onLogout: () => undefined }}
      navLabel="Main navigation"
      onCloseSidebar={() => undefined}
    >
      <NavSectionLabel>Zones</NavSectionLabel>
    </WorkspaceSidebar>,
  );
  assert.match(markup, /ql-hud-brand/);
  assert.match(markup, /aria-label="Close menu"/);
  assert.match(markup, /aria-label="Main navigation"/);
  assert.match(markup, /Zones/);
  assert.match(markup, /aria-label="Sign out"/);
  assert.equal((markup.match(/ql-nav-link/g) ?? []).length, 2);
  assertNoOwnColours(markup, "WorkspaceSidebar");
});
