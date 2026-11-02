import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AmbientAtmosphere,
  HolographicOrbitDeck,
  ChimeToggle,
  SanctuaryZenStage,
  AdaptiveHudShell,
  microChimeEngine,
  type OrbitRegionNode,
} from "../src/index.js";
import { assertNoOwnColours, render } from "./render-helpers.js";

const testRegions: OrbitRegionNode[] = [
  {
    id: "revelation",
    label: "Revelation Archive",
    tagline: "Holy Quranic text and classical readings",
    href: "/corpus",
    thetaRad: 0,
    status: "nominal",
    metricLabel: "Surah Count",
    metricValue: "114",
  },
  {
    id: "hermeneutics",
    label: "Hermeneutic Core",
    tagline: "Cross-surah thematic discourse",
    href: "/research",
    thetaRad: (2 * Math.PI) / 5,
    status: "nominal",
    metricLabel: "Semantic Nodes",
    metricValue: "6,236",
  },
  {
    id: "sanad",
    label: "Epistemic Sanad",
    tagline: "Cryptographic attribution chain",
    href: "/workflow",
    thetaRad: (4 * Math.PI) / 5,
    status: "nominal",
    metricLabel: "Verified Hashes",
    metricValue: "100%",
  },
  {
    id: "harbor",
    label: "Harbor Concourse",
    tagline: "Collaborative inquiry and reflections",
    href: "/community",
    thetaRad: (6 * Math.PI) / 5,
    status: "nominal",
    metricLabel: "Active Circles",
    metricValue: "12",
  },
  {
    id: "telemetry",
    label: "Fleet Operability",
    tagline: "System health and telemetry monitors",
    href: "/command-center",
    thetaRad: (8 * Math.PI) / 5,
    status: "nominal",
    metricLabel: "Latency",
    metricValue: "14ms",
  },
];

void test("AmbientAtmosphere renders canvas with accessible aria-hidden attribute", () => {
  const markup = render(<AmbientAtmosphere density="subtle" />);
  assert.match(markup, /<canvas/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /data-testid="ambient-atmosphere-canvas"/);
  assertNoOwnColours(markup, "AmbientAtmosphere");
});

void test("HolographicOrbitDeck renders 5 planetary region nodes and tablist", () => {
  const markup = render(
    <HolographicOrbitDeck
      regions={testRegions}
      activeRegionId="revelation"
      onSelectRegion={() => undefined}
    />,
  );
  assert.match(markup, /ql-holographic-orbit-deck/);
  assert.match(markup, /role="region"/);
  assert.match(markup, /Revelation Archive/);
  assert.match(markup, /Hermeneutic Core/);
  assert.match(markup, /Epistemic Sanad/);
  assert.match(markup, /Harbor Concourse/);
  assert.match(markup, /Fleet Operability/);
  assert.match(markup, /role="tablist"/);
  assertNoOwnColours(markup, "HolographicOrbitDeck");
});

void test("ChimeToggle renders accessible audio consent toggle button", () => {
  const mutedMarkup = render(
    <ChimeToggle enabled={false} onToggle={() => undefined} label="Suara Harmoni (Nonaktif)" />,
  );
  assert.match(mutedMarkup, /aria-pressed="false"/);
  assert.match(mutedMarkup, /ql-chime-toggle/);
  assert.match(mutedMarkup, /Suara Harmoni \(Nonaktif\)/);
  assertNoOwnColours(mutedMarkup, "ChimeToggle");

  const activeMarkup = render(
    <ChimeToggle enabled={true} onToggle={() => undefined} label="Suara Harmoni (Aktif)" />,
  );
  assert.match(activeMarkup, /aria-pressed="true"/);
  assert.match(activeMarkup, /text-acid/);
  assertNoOwnColours(activeMarkup, "ChimeToggle");
});

void test("SanctuaryZenStage renders modal scripture dialog with escape exit triggers", () => {
  const markup = render(
    <SanctuaryZenStage
      arabicText="بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
      citation="Al-Fatihah 1:1"
      translationText="Dengan nama Allah Yang Maha Pengasih, Maha Penyayang."
      surahNumber={1}
      ayahNumber={1}
      onExit={() => undefined}
      exitLabel="Keluar Mode Hening"
    />,
  );
  assert.match(markup, /role="dialog"/);
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /Al-Fatihah 1:1/);
  assert.match(markup, /بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ/);
  assert.match(markup, /Keluar Mode Hening/);
  assertNoOwnColours(markup, "SanctuaryZenStage");
});

void test("AdaptiveHudShell renders dynamic panes preserving measure clamp", () => {
  const markup = render(
    <AdaptiveHudShell
      panes={[
        { id: "pane1", title: "Pane 1", minWidthPx: 300, priority: 1, content: <div>Primary Stream</div> },
        { id: "pane2", title: "Pane 2", minWidthPx: 300, priority: 2, content: <div>Secondary Stream</div> },
      ]}
      densityMode="dual"
    />,
  );
  assert.match(markup, /ql-adaptive-hud-shell/);
  assert.match(markup, /ql-density--dual/);
  assert.match(markup, /data-density-tier="dual"/);
  assert.match(markup, /Primary Stream/);
  assert.match(markup, /Secondary Stream/);
  assertNoOwnColours(markup, "AdaptiveHudShell");
});

void test("microChimeEngine respects strict consent default (muted)", () => {
  // Engine must be muted by default
  assert.equal(microChimeEngine.isEnabled(), false);
  // Setting enabled to true
  microChimeEngine.setEnabled(true);
  assert.equal(microChimeEngine.isEnabled(), true);
  // Setting enabled back to false
  microChimeEngine.setEnabled(false);
  assert.equal(microChimeEngine.isEnabled(), false);
});
