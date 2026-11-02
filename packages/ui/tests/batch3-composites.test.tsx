import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SemanticCrossSurahGraph,
  AyahProofCard,
  ProofVerificationResult,
  AudioTilawahPlayer,
  WhisperingWaveform,
  type ThematicGraphNode,
  type ThematicGraphEdge,
} from "../src/index.js";
import { render, assertNoOwnColours } from "./render-helpers.js";

const sampleNodes: ThematicGraphNode[] = [
  {
    id: "node-nur",
    label: "An-Nur (The Light)",
    category: "concept",
    surahNumber: 24,
    weight: 8,
    x: 400,
    y: 200,
  },
  {
    id: "node-musa",
    label: "Prophet Musa",
    category: "prophet_narrative",
    surahNumber: 20,
    weight: 10,
    x: 250,
    y: 300,
  },
];

const sampleEdges: ThematicGraphEdge[] = [
  {
    id: "edge-1",
    sourceId: "node-musa",
    targetId: "node-nur",
    relationType: "thematic_echo",
    weight: 4,
    evidencePassages: [{ surah: 20, ayah: 10 }, { surah: 24, ayah: 35 }],
  },
];

void test("SemanticCrossSurahGraph renders SVG graph and accessible table mode", () => {
  const graphMarkup = render(
    <SemanticCrossSurahGraph
      nodes={sampleNodes}
      edges={sampleEdges}
      viewMode="graph"
      graphLabel="Graph View"
      tableLabel="Data Table"
    />,
  );
  assert.ok(graphMarkup.includes("ql-semantic-graph"));
  assert.ok(graphMarkup.includes("<svg"));
  assert.ok(graphMarkup.includes("An-Nur (The Light)"));
  assert.ok(graphMarkup.includes("Prophet Musa"));
  assertNoOwnColours(graphMarkup, "SemanticCrossSurahGraph [graph]");

  const tableMarkup = render(
    <SemanticCrossSurahGraph
      nodes={sampleNodes}
      edges={sampleEdges}
      viewMode="table"
    />,
  );
  assert.ok(tableMarkup.includes("<table"));
  assert.ok(tableMarkup.includes("An-Nur (The Light)"));
  assert.ok(tableMarkup.includes("prophet_narrative"));
  assertNoOwnColours(tableMarkup, "SemanticCrossSurahGraph [table]");
});

void test("AyahProofCard renders proof digest and verified status stamp", () => {
  const markup = render(
    <AyahProofCard
      surahNumber={34}
      ayahNumber={28}
      text="Dan Kami tidak mengutus engkau (Muhammad), melainkan kepada seluruh umat manusia..."
      editionCode="kemenag_id"
      editionName="Kemenag RI"
      proofHash="7a9f4c2e6b8d1a3f5c7e9b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d1a3f"
      isVerified={true}
    />,
  );
  assert.ok(markup.includes("ql-ayah-proof-card"));
  assert.ok(markup.includes("ql-proof-badge"));
  assert.ok(markup.includes("is-valid"));
  assert.ok(markup.includes("Surah 34:28"));
  assert.ok(markup.includes("Kemenag RI"));
  assert.ok(markup.includes("7a9f4c2e6b8d1a3f"));
  assertNoOwnColours(markup, "AyahProofCard");
});

void test("ProofVerificationResult differentiates verified and tampered statuses", () => {
  const validMarkup = render(
    <ProofVerificationResult
      status="verified"
      expectedHash="sha-valid"
      providedHash="sha-valid"
      canonicalText="Canonical verse verbatim."
      surahNumber={2}
      ayahNumber={255}
    />,
  );
  assert.ok(validMarkup.includes("is-valid"));
  assert.ok(validMarkup.includes("TAMPER-PROOF VERIFIED"));
  assertNoOwnColours(validMarkup, "ProofVerificationResult [verified]");

  const tamperedMarkup = render(
    <ProofVerificationResult
      status="tampered"
      expectedHash="sha-expected"
      providedHash="sha-modified"
      canonicalText="Canonical verse verbatim."
      submittedText="Modified verse with missing word."
      surahNumber={2}
      ayahNumber={255}
    />,
  );
  assert.ok(tamperedMarkup.includes("is-tampered"));
  assert.ok(tamperedMarkup.includes("INTEGRITY MISMATCH"));
  assert.ok(tamperedMarkup.includes("Modified verse with missing word."));
  assertNoOwnColours(tamperedMarkup, "ProofVerificationResult [tampered]");
});

void test("AudioTilawahPlayer renders player bar with reciter and whispering waveform", () => {
  const markup = render(
    <AudioTilawahPlayer
      surahNumber={1}
      activeAyahNumber={1}
      reciterName="Sheikh Mahmoud Khalil Al-Husary"
      reciterStyle="Murattal"
      audioStreamUrl="https://audio.moonwitness.com/husary/001.mp3"
      isPlaying={false}
    />,
  );
  assert.ok(markup.includes("ql-audio-bar"));
  assert.ok(markup.includes("ql-whispering-waveform"));
  assert.ok(markup.includes("Sheikh Mahmoud Khalil Al-Husary"));
  assert.ok(markup.includes("Surah 1 · Ayah 1"));
  assert.ok(markup.includes("Recite"));
  assertNoOwnColours(markup, "AudioTilawahPlayer");
});

void test("WhisperingWaveform renders accessible canvas bars", () => {
  const markup = render(<WhisperingWaveform isPlaying={false} barCount={12} />);
  assert.ok(markup.includes("ql-whispering-waveform"));
  assert.ok(markup.includes('aria-hidden="true"'));
  assertNoOwnColours(markup, "WhisperingWaveform");
});
