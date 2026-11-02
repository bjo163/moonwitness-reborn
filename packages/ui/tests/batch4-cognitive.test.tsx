import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LexicalRootSearch,
  QuranicMorphologyVisualizer,
  LocalInferenceToggle,
} from "../src/index.js";
import { render } from "./render-helpers.js";

void test("LexicalRootSearch renders root chips and accessible radiogroup", () => {
  const markup = render(
    <LexicalRootSearch
      selectedRoot="ر-ح-م"
    />,
  );
  assert.ok(markup.includes("ql-lexical-root-search"));
  assert.ok(markup.includes('role="radiogroup"'));
  assert.ok(markup.includes("ر-ح-م"));
  assert.ok(markup.includes("339x"));
  assert.ok(markup.includes("Kasih sayang, rahmat, kelembutan"));
});

void test("QuranicMorphologyVisualizer renders word-by-word syntax tree and I'rab details", () => {
  const markup = render(
    <QuranicMorphologyVisualizer
      surahNumber={1}
      ayahNumber={1}
      activeSegmentId="seg-1-1-2"
    />,
  );
  assert.ok(markup.includes("ql-morphology-visualizer"));
  assert.ok(markup.includes('role="tree"'));
  assert.ok(markup.includes('role="treeitem"'));
  assert.ok(markup.includes("ql-syntax-node"));
  assert.ok(markup.includes("اسْمِ"));
  assert.ok(markup.includes("ql-irab-drawer"));
  assert.ok(markup.includes("Ism majrur bi-harf al-jar"));
});

void test("LocalInferenceToggle renders private inference switch and accelerator telemetry", () => {
  const markupEnabled = render(
    <LocalInferenceToggle
      isEnabled={true}
      modelStatus={{
        isAvailable: true,
        backend: "webgpu",
        modelLoaded: true,
        downloadProgressPct: 100,
        memoryUsedMb: 34,
      }}
      onToggle={() => undefined}
    />,
  );
  assert.ok(markupEnabled.includes("ql-local-inference-toggle"));
  assert.ok(markupEnabled.includes('aria-checked="true"'));
  assert.ok(markupEnabled.includes("WEBGPU"));
  assert.ok(markupEnabled.includes("34 MB"));
  assert.ok(markupEnabled.includes("Zero Network Egress"));

  const markupDisabled = render(
    <LocalInferenceToggle
      isEnabled={false}
      onToggle={() => undefined}
    />,
  );
  assert.ok(markupDisabled.includes('aria-checked="false"'));
  assert.ok(markupDisabled.includes("Cloud Assisted"));
});
