import assert from "node:assert/strict";
import { test } from "node:test";
import { QuranText, AyahEndMarker, WaqafSign } from "../src/atoms/quran-text.js";
import { DualStreamReader } from "../src/composites/hermeneutic-reader.js";
import { CommandPalette } from "../src/composites/command-palette.js";
import { render } from "./render-helpers.js";

void test("QuranText renders Arabic verbatim scripture with bidi isolation and ayah marker", () => {
  const html = render(
    <QuranText
      text="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
      surah={1}
      ayah={1}
      scale="lg"
    />
  );
  assert.match(html, /class="ql-quran-text ql-quran-text--lg"/);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /lang="ar"/);
  assert.match(html, /<bdi>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ<\/bdi>/);
  assert.match(html, /class="ql-ayah-marker"/);
  assert.match(html, /1<\/span>/);
});

void test("DualStreamReader renders synchronized translation and verbatim columns", () => {
  const verses = [
    {
      surahNumber: 1,
      ayahNumber: 1,
      verbatimText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translationText: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      authorityLevel: "revelation_verbatim" as const,
    },
  ];

  const html = render(
    <DualStreamReader
      surahNumber={1}
      arabicEditionKey="quran-ar"
      translationEditionKey="en-sahih"
      verses={verses}
      activeAyah={1}
    />
  );

  assert.match(html, /class="ql-hermeneutic-reader"/);
  assert.match(html, /class="ql-reader-pane ql-reader-pane--translation/);
  assert.match(html, /class="ql-reader-pane ql-reader-pane--verbatim/);
  assert.match(html, /In the name of Allah/);
  assert.match(html, /بِسْمِ اللَّهِ/);
});

void test("CommandPalette renders accessible combobox dialog when open", () => {
  const actions = [
    {
      id: "corpus-fatihah",
      category: "corpus" as const,
      titleKey: "corpus.fatihah",
      titleFallback: "1. Al-Fatihah",
      shortcut: ["1"],
      perform: () => undefined,
    },
  ];

  const html = render(
    <CommandPalette
      open={true}
      onOpenChange={() => undefined}
      actions={actions}
      title="Search Actions"
      placeholder="Type here..."
    />
  );

  assert.match(html, /role="combobox"/);
  assert.match(html, /aria-haspopup="listbox"/);
  assert.match(html, /1\. Al-Fatihah/);
});

void test("AyahEndMarker and WaqafSign render expected markers and accessible tokens", () => {
  const markerHtml = render(<AyahEndMarker ayahNumber={7} />);
  assert.match(markerHtml, /class="ql-ayah-marker"/);
  assert.match(markerHtml, /aria-label="Ayah 7"/);
  assert.match(markerHtml, />7</);

  const waqafHtml = render(
    <WaqafSign
      token={{
        characterIndex: 12,
        symbol: "ج",
        name: "jaiz",
        prohibited: false,
      }}
    />
  );
  assert.match(waqafHtml, /class="ql-waqaf-sign"/);
  assert.match(waqafHtml, /title="jaiz"/);
  assert.match(waqafHtml, />ج</);
});

