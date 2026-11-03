import React from "react";
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
import {
  graphLabels,
  proofCardLabels,
  proofResultLabels,
  tilawahLabels,
} from "./batch3-labels.js";

const weightedNodes: ThematicGraphNode[] = [
  {
    id: "node-nur",
    label: "An-Nur (The Light)",
    category: "concept",
    surahNumber: 24,
    weight: 8,
  },
  {
    id: "node-musa",
    label: "Prophet Musa",
    category: "prophet_narrative",
    surahNumber: 20,
    weight: 10,
  },
];

const evidenceEdges: ThematicGraphEdge[] = [
  {
    id: "edge-1",
    sourceId: "node-musa",
    targetId: "node-nur",
    relationType: "thematic_echo",
    weight: 4,
    evidencePassages: [{ surah: 20, ayah: 10 }, { surah: 24, ayah: 35 }],
  },
];

/** The research graph reads models that store no importance or verse evidence. */
const bareNodes: ThematicGraphNode[] = [
  { id: "node-nur", label: "An-Nur (The Light)", category: "concept", surahNumber: 24 },
  { id: "node-musa", label: "Prophet Musa", category: "prophet_narrative", surahNumber: 20 },
];
const bareEdges: ThematicGraphEdge[] = [
  { id: "edge-1", sourceId: "node-musa", targetId: "node-nur", relationType: "thematic_echo" },
];

void test("SemanticCrossSurahGraph renders SVG graph and accessible table mode", () => {
  const graphMarkup = render(
    <SemanticCrossSurahGraph
      nodes={weightedNodes}
      edges={evidenceEdges}
      viewMode="graph"
      {...graphLabels}
    />,
  );
  assert.ok(graphMarkup.includes("ql-semantic-graph"));
  assert.ok(graphMarkup.includes("<svg"));
  assert.ok(graphMarkup.includes("An-Nur (The Light)"));
  assert.ok(graphMarkup.includes("Prophet Musa"));
  assert.ok(graphMarkup.includes(`aria-label="${graphLabels.graphDescriptionLabel}"`));
  assert.ok(graphMarkup.includes(graphLabels.summaryLabel));
  assertNoOwnColours(graphMarkup, "SemanticCrossSurahGraph [graph]");

  const tableMarkup = render(
    <SemanticCrossSurahGraph
      nodes={weightedNodes}
      edges={evidenceEdges}
      viewMode="table"
      {...graphLabels}
    />,
  );
  assert.ok(tableMarkup.includes("<table"));
  assert.ok(tableMarkup.includes("An-Nur (The Light)"));
  assert.ok(tableMarkup.includes("prophet_narrative"));
  assert.ok(tableMarkup.includes(graphLabels.weightColumnLabel));
  assert.ok(tableMarkup.includes(graphLabels.evidenceColumnLabel));
  assert.ok(tableMarkup.includes("20:10, 24:35"));
  assertNoOwnColours(tableMarkup, "SemanticCrossSurahGraph [table]");
});

void test("SemanticCrossSurahGraph drops columns the source records cannot fill", () => {
  const markup = render(
    <SemanticCrossSurahGraph
      nodes={bareNodes}
      edges={bareEdges}
      viewMode="table"
      {...graphLabels}
    />,
  );
  assert.ok(markup.includes("<table"));
  assert.ok(
    !markup.includes(graphLabels.weightColumnLabel),
    "a weight column must not appear when no record carries a weight",
  );
  assert.ok(
    !markup.includes(graphLabels.evidenceColumnLabel),
    "an evidence column must not appear when no record carries evidence",
  );
});

void test("SemanticCrossSurahGraph shows the empty state instead of an invented graph", () => {
  const markup = render(
    <SemanticCrossSurahGraph nodes={[]} edges={[]} viewMode="graph" {...graphLabels} />,
  );
  assert.ok(markup.includes(graphLabels.emptyLabel));
  assert.ok(!markup.includes("<svg"));
});

void test("AyahProofCard renders the digest and the labels passed by the caller", () => {
  const markup = render(
    <AyahProofCard
      surahNumber={34}
      ayahNumber={28}
      text="Dan Kami tidak mengutus engkau (Muhammad), melainkan kepada seluruh umat manusia..."
      editionCode="kemenag_id"
      proofHash="7a9f4c2e6b8d1a3f5c7e9b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d1a3f"
      {...proofCardLabels}
    />,
  );
  assert.ok(markup.includes("ql-ayah-proof-card"));
  assert.ok(markup.includes("ql-proof-badge"));
  assert.ok(markup.includes("QS. 34:28"));
  assert.ok(markup.includes(proofCardLabels.editionName));
  assert.ok(markup.includes(proofCardLabels.proofBadgeLabel));
  assert.ok(markup.includes(proofCardLabels.digestLabel));
  assert.ok(markup.includes(proofCardLabels.copyLabel));
  assert.ok(markup.includes("7a9f4c2e6b8d1a3f"));
  assertNoOwnColours(markup, "AyahProofCard");
});

void test("AyahProofCard renders no verification link of its own", () => {
  const withoutUri = render(
    <AyahProofCard
      surahNumber={34}
      ayahNumber={28}
      text="Wa ma arsalnaka illa kaffatan lin-naas"
      editionCode="kemenag_id"
      proofHash="7a9f4c2e6b8d1a3f5c7e9b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d1a3f"
      {...proofCardLabels}
    />,
  );
  assert.ok(!withoutUri.includes("<a "), "the card is a copy action, not a link");
  assert.ok(!withoutUri.includes("moonwitness.com"));
  assert.ok(!withoutUri.includes("is-valid"), "copying a verse is not verification");

  const withUri = render(
    <AyahProofCard
      surahNumber={34}
      ayahNumber={28}
      text="Wa ma arsalnaka illa kaffatan lin-naas"
      editionCode="kemenag_id"
      proofHash="7a9f4c2e6b8d1a3f5c7e9b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d1a3f"
      verificationUri="http://127.0.0.1:3000/verify/ayah/34/28"
      {...proofCardLabels}
    />,
  );
  assert.ok(
    !withUri.includes("/verify/ayah/"),
    "the caller's deep link travels in the copied text, not in invented markup",
  );
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
      {...proofResultLabels}
    />,
  );
  assert.ok(validMarkup.includes("is-valid"));
  assert.ok(validMarkup.includes(proofResultLabels.verifiedStampLabel));
  assert.ok(!validMarkup.includes(proofResultLabels.mismatchStampLabel));
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
      {...proofResultLabels}
    />,
  );
  assert.ok(tamperedMarkup.includes("is-tampered"));
  assert.ok(tamperedMarkup.includes(proofResultLabels.mismatchStampLabel));
  assert.ok(tamperedMarkup.includes("Modified verse with missing word."));
  assert.ok(tamperedMarkup.includes(proofResultLabels.submittedTextLabel));
  assert.ok(tamperedMarkup.includes(`aria-label="${proofResultLabels.reportLabel}"`));
  assertNoOwnColours(tamperedMarkup, "ProofVerificationResult [tampered]");
});

void test("AudioTilawahPlayer renders the reciter and controls the caller supplies", () => {
  const markup = render(
    <AudioTilawahPlayer
      surahNumber={1}
      activeAyahNumber={1}
      reciterName="Ustadz Salim"
      reciterStyle="Murattal"
      audioStreamUrl="https://cdn.moonwitness.example/husary/001.mp3"
      isPlaying={false}
      {...tilawahLabels}
    />,
  );
  assert.ok(markup.includes("ql-audio-bar"));
  assert.ok(markup.includes("ql-whispering-waveform"));
  assert.ok(markup.includes("Ustadz Salim"));
  assert.ok(markup.includes("Surah 1 · Ayah 1"));
  assert.ok(markup.includes(tilawahLabels.playLabel));
  assert.ok(!markup.includes("Recite"), "the play caption must come from props");
  assert.ok(markup.includes(`aria-label="${tilawahLabels.playerLabel}"`));
  assertNoOwnColours(markup, "AudioTilawahPlayer");
});

void test("WhisperingWaveform renders accessible canvas bars", () => {
  const markup = render(<WhisperingWaveform isPlaying={false} barCount={12} />);
  assert.ok(markup.includes("ql-whispering-waveform"));
  assert.ok(markup.includes('aria-hidden="true"'));
  assertNoOwnColours(markup, "WhisperingWaveform");
});
