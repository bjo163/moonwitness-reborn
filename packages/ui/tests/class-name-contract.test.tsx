import assert from "node:assert/strict";
import { test } from "node:test";
import type { ReactNode } from "react";
import {
  EmptyState,
  IconTile,
  ListOption,
  LoadingScreen,
  MetricList,
  MetricRow,
  NavLink,
  NavSectionLabel,
  OptionNav,
  PageHeader,
  SectionGrid,
  SidePanel,
  SidebarBrand,
  SidebarFooter,
  SidebarNav,
  SidebarTrigger,
  WorkspaceSidebar,
  HolographicOrbitDeck,
  ChimeToggle,
  AdaptiveHudShell,
  AmbientAtmosphere,
  SanctuaryZenStage,
  SemanticCrossSurahGraph,
  AyahProofCard,
  ProofVerificationResult,
  AudioTilawahPlayer,
  WhisperingWaveform,
  type SidebarNavItem,
} from "../src/index.js";
import { assertNoOwnColours, render } from "./render-helpers.js";

/**
 * MW-0574's core contract, asserted for every composite at once: a caller
 * adding a `className` must never displace the design-system class it builds
 * on, because every `.ql-*` rule in the stylesheet keys off that class.
 *
 * `MetricList` owns no class of its own (the `<dl>` is bare by design), so its
 * marker is the caller's grid utility — what is proven there is that the class
 * lands on the `<dl>` instead of being dropped.
 */
const CALLER_CLASS = "probe-keep-class";

const items: readonly SidebarNavItem[] = [
  { href: "/command-center", label: "Dashboard" },
  { href: "/workflow", label: "Workflow", active: true },
];

const classNameContract: readonly [string, RegExp, (className: string) => ReactNode][] = [
  ["NavLink", /ql-nav-link/, (c) => <NavLink className={c} href="/models">Models</NavLink>],
  ["SidebarBrand", /ql-hud-brand/, (c) => <SidebarBrand className={c} icon={<i />} />],
  ["SidebarFooter", /border-hairline/, (c) => (
    <SidebarFooter className={c} logoutLabel="Sign out" onLogout={() => undefined} userName="Ada" />
  )],
  ["PageHeader", /border-hairline/, (c) => <PageHeader className={c} title="Providers" />],
  ["LoadingScreen", /ql-hud-app/, (c) => <LoadingScreen className={c} label="Loading" />],
  ["EmptyState", /ql-card/, (c) => <EmptyState className={c} description="Nothing" title="Empty" />],
  ["SectionGrid", /grid-cols-1/, (c) => <SectionGrid className={c} columns={2}><span>r</span></SectionGrid>],
  ["IconTile", /ql-icon-tile/, (c) => <IconTile className={c}><i /></IconTile>],
  ["SidebarNav", /ql-sidebar-nav/, (c) => <SidebarNav className={c} items={items} label="Nav" />],
  ["NavSectionLabel", /ql-nav-section/, (c) => <NavSectionLabel className={c}>Zones</NavSectionLabel>],
  ["OptionNav", /ql-sidebar-nav/, (c) => (
    <OptionNav className={c} label="Zones">
      <ListOption onSelect={() => undefined} selected={false}>row</ListOption>
    </OptionNav>
  )],
  ["MetricList", /grid/, (c) => (
    <MetricList className={`grid ${c}`}>
      <MetricRow label="Done" value={1} />
    </MetricList>
  )],
  ["MetricRow", /ql-metric-row/, (c) => <MetricRow className={c} label="Done" value={1} />],
  ["ListOption", /ql-list-option/, (c) => (
    <ListOption className={c} onSelect={() => undefined} selected={false}>row</ListOption>
  )],
  ["SidePanel", /ql-side-panel/, (c) => (
    <SidePanel className={c} closeLabel="Close" label="Form" onClose={() => undefined} title="Record">
      <p>fields</p>
    </SidePanel>
  )],
  ["WorkspaceSidebar", /ql-sidebar-nav/, (c) => (
    <WorkspaceSidebar
      className={c}
      closeLabel="Close menu"
      items={items}
      navLabel="Main navigation"
      onCloseSidebar={() => undefined}
    />
  )],
  ["SidebarTrigger", /ql-sidebar-trigger/, (c) => (
    <SidebarTrigger
      className={c}
      label="Open menu"
      onOpenSidebar={() => undefined}
      sidebarOpen={false}
    />
  )],
  ["HolographicOrbitDeck", /ql-holographic-orbit-deck/, (c) => (
    <HolographicOrbitDeck
      className={c}
      regions={[]}
      activeRegionId="revelation"
      onSelectRegion={() => undefined}
    />
  )],
  ["ChimeToggle", /ql-chime-toggle/, (c) => (
    <ChimeToggle className={c} enabled={false} label="Audio" onToggle={() => undefined} />
  )],
  ["AdaptiveHudShell", /ql-adaptive-hud-shell/, (c) => (
    <AdaptiveHudShell className={c} panes={[]} />
  )],
  ["AmbientAtmosphere", /ql-ambient-atmosphere/, (c) => (
    <AmbientAtmosphere className={c} density="subtle" />
  )],
  ["SanctuaryZenStage", /ql-sanctuary-zen-stage/, (c) => (
    <SanctuaryZenStage
      className={c}
      arabicText="بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
      citation="Al-Fatihah 1:1"
      surahNumber={1}
      ayahNumber={1}
      onExit={() => undefined}
    />
  )],
  ["SemanticCrossSurahGraph", /ql-semantic-graph/, (c) => (
    <SemanticCrossSurahGraph className={c} nodes={[]} edges={[]} />
  )],
  ["AyahProofCard", /ql-ayah-proof-card/, (c) => (
    <AyahProofCard
      className={c}
      surahNumber={1}
      ayahNumber={1}
      text="Bismillah"
      editionCode="uthmani"
      proofHash="abc1234567890def"
    />
  )],
  ["ProofVerificationResult", /ql-proof-verification-result/, (c) => (
    <ProofVerificationResult
      className={c}
      status="verified"
      expectedHash="hash"
      providedHash="hash"
      canonicalText="Bismillah"
      surahNumber={1}
      ayahNumber={1}
    />
  )],
  ["AudioTilawahPlayer", /ql-audio-bar/, (c) => (
    <AudioTilawahPlayer className={c} surahNumber={1} activeAyahNumber={1} />
  )],
  ["WhisperingWaveform", /ql-whispering-waveform/, (c) => (
    <WhisperingWaveform className={c} isPlaying={false} />
  )],
];

for (const [label, baseClass, build] of classNameContract) {
  void test(`${label} keeps ${baseClass.source} when the caller passes a className`, () => {
    const markup = render(build(CALLER_CLASS));
    const classAttributes = [...markup.matchAll(/class="([^"]*)"/g)].map((match) => match[1]);
    const merged = classAttributes.find(
      (value) => baseClass.test(value) && value.includes(CALLER_CLASS),
    );
    assert.ok(
      merged !== undefined,
      `${label}: no element carries both the design-system class and the caller's class; saw ${classAttributes.join(" | ")}`,
    );
    assertNoOwnColours(markup, label);
  });
}
