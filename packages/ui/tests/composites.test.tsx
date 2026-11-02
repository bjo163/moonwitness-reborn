import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EmptyState,
  HeroStage,
  IconTile,
  ListOption,
  LoadingScreen,
  MetricList,
  MetricRow,
  NavSectionLabel,
  NavLink,
  OptionNav,
  PageHeader,
  PortalCard,
  SectionGrid,
  SpatialRegion,
  TransmissionCard,
  SidePanel,
  SidebarBrand,
  SidebarFooter,
  SidebarNav,
  SidebarTrigger,
  ThemeToggle,
  WorkspaceSidebar,
  type SidebarNavItem,
} from "../src/index.js";
import { assertNoOwnColours, render } from "./render-helpers.js";

/**
 * Behaviour of each composite (MW-0574, MW-0580): the states it renders, the
 * slots it exposes, and the accessibility names it carries. The shared
 * `className`-override contract lives in `class-name-contract.test.tsx`, and
 * the colour rules it is checked against come from `render-helpers.tsx`.
 */
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
  assert.match(markup, /ql-icon-tile/);
  assert.match(markup, /ql-icon-tile--sm/);
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
  // The eyebrow is the package's shared `.ql-eyebrow` rule (the one SidePanel
  // uses), not a per-component utility copy of it.
  assert.match(markup, /class="ql-eyebrow"/);
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
  assert.match(empty, /ql-card/);
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
  assert.equal(
    /ql-metric-row--divided/.test(rows[0]),
    false,
    "first row must be undivided",
  );
  assert.match(rows[1], /ql-metric-row--divided/);
  assert.match(markup, /ql-metric-row__label/);
  assert.match(markup, /ql-metric-row__value/);
  assert.match(markup, /ql-metric-row__hint/);
  assertNoOwnColours(markup, "MetricRow");
});

void test("IconTile exposes size and tone variants", () => {
  const accent = render(
    <IconTile size="sm">
      <i />
    </IconTile>,
  );
  assert.match(accent, /ql-icon-tile/);
  assert.match(accent, /ql-icon-tile--sm/);
  assert.match(accent, /aria-hidden="true"/);

  const large = render(
    <IconTile size="lg" tone="plain">
      <i />
    </IconTile>,
  );
  assert.match(large, /ql-icon-tile--lg/);
  assert.match(large, /ql-icon-tile--plain/);
  assertNoOwnColours(large, "IconTile");
});

void test("SidebarNav renders its list shape from ql-sidebar-nav", () => {
  const nav = render(
    <SidebarNav items={[{ href: "/corpus", label: "Quran" }]} label="Sections" />,
  );
  assert.match(nav, /<nav[^>]*class="ql-sidebar-nav mt-6"/);
  assert.match(nav, /aria-label="Sections"/);
  assertNoOwnColours(nav, "SidebarNav");
});

void test("NavSectionLabel renders the design-system section heading", () => {
  const markup = render(<NavSectionLabel>Zones</NavSectionLabel>);
  assert.match(markup, /ql-nav-section/);
  assert.match(markup, /Zones/);
  assertNoOwnColours(markup, "NavSectionLabel");
});

void test("OptionNav keeps the shared list shape for row-provided navs", () => {
  const nav = render(
    <OptionNav label="Zones">
      <ListOption selected onSelect={() => undefined} variant="nav">
        example.com
      </ListOption>
    </OptionNav>,
  );
  // No top margin: the section label above already carries the spacing, and
  // the geometry of the list must come from the stylesheet, not the screen.
  assert.match(nav, /<nav[^>]*class="ql-sidebar-nav"/);
  assert.doesNotMatch(nav, /ql-sidebar-nav mt-/);
  assert.match(nav, /aria-label="Zones"/);
  assert.match(nav, /ql-nav-link[^>"]*is-active|is-active/);
  assertNoOwnColours(nav, "OptionNav");
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

void test("SidebarTrigger links the hamburger to the drawer via aria-controls and reflects open state in aria-expanded", () => {
  const closed = render(
    <SidebarTrigger
      label="Open menu"
      onOpenSidebar={() => undefined}
      sidebarOpen={false}
    />,
  );
  assert.match(closed, /aria-label="Open menu"/);
  assert.match(closed, /aria-controls="ql-workspace-sidebar"/);
  assert.match(closed, /aria-expanded="false"/);
  assert.match(closed, /class="[^"]*ql-sidebar-trigger[^"]*"/);
  assert.match(closed, /ql-button--icon/);
  assertNoOwnColours(closed, "SidebarTrigger");

  const open = render(
    <SidebarTrigger
      label="Open menu"
      onOpenSidebar={() => undefined}
      sidebarOpen
    />,
  );
  assert.match(open, /aria-expanded="true"/);

  const renamed = render(
    <SidebarTrigger
      label="Open menu"
      onOpenSidebar={() => undefined}
      sidebarId="ql-secondary-workspace-sidebar"
      sidebarOpen={false}
    />,
  );
  assert.match(renamed, /aria-controls="ql-secondary-workspace-sidebar"/);
});

void test("HeroStage hides decorative artwork and keeps ql-hero when className overrides", () => {
  const markup = render(
    <HeroStage className="probe-keep-class" imageSrc="/hero.jpg">
      <h1>Title</h1>
    </HeroStage>,
  );
  assert.match(markup, /ql-hero/);
  assert.match(markup, /probe-keep-class/);
  assert.match(markup, /ql-hero__veil/);
  assert.match(markup, /alt=""/);
  assert.match(markup, /<h1>Title<\/h1>/);
  assertNoOwnColours(markup, "HeroStage");
});

void test("PortalCard is one link named by its title and carries description and status", () => {
  const markup = render(
    <PortalCard
      className="probe-keep-class"
      description="Community portal"
      href="/corpus"
      icon={<i />}
      status="Proposed"
      title="Dock"
    />,
  );
  assert.match(markup, /href="\/corpus"/);
  assert.match(markup, /ql-portal-card/);
  assert.match(markup, /probe-keep-class/);
  assert.match(markup, /Dock/);
  assert.match(markup, /Community portal \(Proposed\)/);
  assert.equal((markup.match(/<a /g) ?? []).length, 1);
  assertNoOwnColours(markup, "PortalCard");

  const plain = render(<PortalCard description="d" href="/x" title="T" />);
  assert.doesNotMatch(plain, /ql-portal-card__icon/);
  assert.doesNotMatch(plain, /\(/);
});
void test("TransmissionCard renders title, excerpt and provenance", () => {
  const markup = render(
    <TransmissionCard
      excerpt="When the moon rises, messages are shared."
      href="/corpus/quran-en/1"
      provenanceLabel="Verified Revelation"
      readActionLabel="Read Chapter"
      source="Surah Al-Fatihah"
      title="The Opening"
    />,
  );
  assert.match(markup, /The Opening/);
  assert.match(markup, /Surah Al-Fatihah/);
  assert.match(markup, /Verified Revelation/);
  assert.match(markup, /Read Chapter/);
  assertNoOwnColours(markup, "TransmissionCard");
});

void test("SpatialRegion renders heading, eyebrow and children", () => {
  const markup = render(
    <SpatialRegion
      eyebrow="Movement 03"
      id="explore-region"
      title="Explore the Knowledge"
    >
      <p>Inner content</p>
    </SpatialRegion>,
  );
  assert.match(markup, /id="explore-region"/);
  assert.match(markup, /Movement 03/);
  assert.match(markup, /Explore the Knowledge/);
  assert.match(markup, /Inner content/);
  assertNoOwnColours(markup, "SpatialRegion");
});

void test("HeroStage renders background media and children", () => {
  const markup = render(
    <HeroStage imageSrc="/hero.jpg">
      <h1>Title</h1>
    </HeroStage>,
  );
  assert.match(markup, /src="\/hero\.jpg"/);
  assert.match(markup, /width="1920"/);
  assert.match(markup, /height="1080"/);
  assert.match(markup, /fetchPriority="high"/);
  assert.match(markup, /decoding="async"/);
  assert.match(markup, /Title/);
  assertNoOwnColours(markup, "HeroStage");
});

void test("ThemeToggle renders aria-pressed and label", () => {
  const markup = render(
    <ThemeToggle
      theme="light"
      label="Beralih ke tema gelap"
      onToggle={() => undefined}
    />,
  );
  assert.match(markup, /aria-pressed="true"/);
  assert.match(markup, /aria-label="Beralih ke tema gelap"/);
  assert.match(markup, /ql-nav-link/);
  assertNoOwnColours(markup, "ThemeToggle");
});
