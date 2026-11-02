import assert from "node:assert/strict";
import test from "node:test";
import { QlNotFoundError, QlValidationError, type QlOrm } from "ql_orm";
import { stubAddonManifest, withMemoryOrm } from "ql_orm/testing";
import corpusManifest from "../__manifest__.js";
import sourceManifest from "ql_source/__manifest__";
import {
  assertReciterSlug,
  assertSurahNumber,
  listReciters,
  readSurahAudioManifest,
  type RecitationStyle,
} from "./audio-service.js";

const manifests = [
  stubAddonManifest("ql_base"),
  stubAddonManifest("ql_auth"),
  sourceManifest,
  corpusManifest,
];

async function seedReciter(
  orm: QlOrm,
  input: {
    slug: string;
    style?: RecitationStyle;
    licenseType?: string;
    isActive?: boolean;
  },
): Promise<void> {
  await orm.createRecordForService("corpus.reciter", {
    slug: input.slug,
    name_translit: `Reciter ${input.slug}`,
    name_arabic: `قارئ ${input.slug}`,
    recitation_style: input.style ?? "murattal",
    audio_base_url: "https://audio.invalid/base",
    license_type: input.licenseType ?? "public_domain",
    is_active: input.isActive ?? true,
  });
}

async function seedSegment(
  orm: QlOrm,
  input: {
    reciter: string;
    surah: number;
    ayah: number;
    startMs: number;
    endMs: number;
  },
): Promise<void> {
  await orm.createRecordForService("corpus.audio_segment", {
    reciter_slug: input.reciter,
    surah_number: input.surah,
    ayah_number: input.ayah,
    start_ms: input.startMs,
    end_ms: input.endMs,
    audio_file_url: `https://audio.invalid/${input.reciter}/${String(input.surah)}:${String(input.ayah)}.mp3`,
  });
}

void test("an empty registry gives no reciter and no fabricated timeline", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    assert.deepEqual(await listReciters(orm), []);
    await assert.rejects(
      readSurahAudioManifest(orm, "al-husary", 1),
      QlNotFoundError,
      "naming a reciter the registry does not carry would be a false attribution",
    );
  });
});

void test("the manifest reads name, licence and clip bounds from the rows", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await seedReciter(orm, {
      slug: "al-husary",
      style: "mujawwad",
      licenseType: "licensed_for_display",
    });
    // Inserted out of order so the sort has to come from the query, not luck.
    await seedSegment(orm, { reciter: "al-husary", surah: 1, ayah: 7, startMs: 36000, endMs: 41500 });
    await seedSegment(orm, { reciter: "al-husary", surah: 1, ayah: 1, startMs: 0, endMs: 5200 });

    const manifest = await readSurahAudioManifest(orm, "al-husary", 1);
    assert.equal(manifest.reciterName, "Reciter al-husary");
    assert.equal(manifest.reciterStyle, "mujawwad");
    assert.equal(manifest.licenseType, "licensed_for_display");
    assert.deepEqual(
      manifest.segments.map((segment) => segment.ayahNumber),
      [1, 7],
    );
    assert.equal(manifest.segments[0]?.audioFileUrl, "https://audio.invalid/al-husary/1:1.mp3");
    assert.equal(manifest.durationMs, 41500);
    assert.equal(manifest.streamUrl, null, "two verse-sized files are not one surah stream");

    const otherSurah = await readSurahAudioManifest(orm, "al-husary", 112);
    assert.deepEqual(otherSurah.segments, [], "an un-curated surah stays visibly un-curated");
    assert.equal(otherSurah.durationMs, 0);
    assert.equal(otherSurah.streamUrl, null);

    const reciters = await listReciters(orm);
    assert.equal(reciters.length, 1);
    assert.equal(reciters[0]?.isActive, true);
  });
});

void test("only a surah recorded end to end has a stream to play", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await seedReciter(orm, { slug: "al-husary" });
    await orm.createRecordForService("corpus.audio_segment", {
      reciter_slug: "al-husary",
      surah_number: 112,
      ayah_number: 1,
      start_ms: 0,
      end_ms: 3900,
      audio_file_url: "https://audio.invalid/al-husary/112.mp3",
    });
    await orm.createRecordForService("corpus.audio_segment", {
      reciter_slug: "al-husary",
      surah_number: 112,
      ayah_number: 2,
      start_ms: 3900,
      end_ms: 7400,
      audio_file_url: "https://audio.invalid/al-husary/112.mp3",
    });

    const manifest = await readSurahAudioManifest(orm, "al-husary", 112);
    assert.equal(manifest.streamUrl, "https://audio.invalid/al-husary/112.mp3");

    // The moment the clips stop agreeing on one file the stream disappears;
    // serving the first clip as if it covered the surah would desynchronise
    // every boundary the player is about to read off it.
    await orm.createRecordForService("corpus.audio_segment", {
      reciter_slug: "al-husary",
      surah_number: 112,
      ayah_number: 3,
      start_ms: 7400,
      end_ms: 10900,
      audio_file_url: "https://audio.invalid/al-husary/112:3.mp3",
    });
    const split = await readSurahAudioManifest(orm, "al-husary", 112);
    assert.equal(split.streamUrl, null);
    assert.equal(split.durationMs, 10900, "the boundaries are still reported as curated");
  });
});

void test("a clip locator the canonical table cannot produce is refused", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await seedReciter(orm, { slug: "al-husary" });
    await seedSegment(orm, { reciter: "al-husary", surah: 114, ayah: 286, startMs: 0, endMs: 5000 });
    await assert.rejects(
      readSurahAudioManifest(orm, "al-husary", 114),
      QlValidationError,
      "the coarse 286 column bound is not a per-surah permission",
    );
  });
});

void test("a clip that ends where it starts is not a span", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await seedReciter(orm, { slug: "al-husary" });
    await seedSegment(orm, { reciter: "al-husary", surah: 2, ayah: 255, startMs: 9000, endMs: 9000 });
    await assert.rejects(
      readSurahAudioManifest(orm, "al-husary", 2),
      QlValidationError,
      "a zero-length boundary cannot drive a player",
    );
  });
});

void test("reciter slugs and surah numbers are validated before any query", () => {
  assert.equal(assertReciterSlug("al-husary"), "al-husary");
  for (const bad of ["", " Al-Husary", "Al-Husary", "a/b", "x".repeat(65)]) {
    assert.throws(() => assertReciterSlug(bad), QlValidationError, `'${bad}' must be refused`);
  }
  assert.equal(assertSurahNumber(1), 1);
  assert.equal(assertSurahNumber(114), 114);
  for (const bad of [0, 115, 2.5, Number.NaN]) {
    assert.throws(() => assertSurahNumber(bad), QlValidationError, `${String(bad)} is not a surah`);
  }
});

void test("a deactivated reciter is not offered and an unknown style is refused", async () => {
  await withMemoryOrm(manifests, async (orm) => {
    await seedReciter(orm, { slug: "retired", isActive: false });
    await assert.rejects(
      readSurahAudioManifest(orm, "retired", 1),
      QlNotFoundError,
      "deactivated voices stay out of the player",
    );

    await orm.createRecordForService("corpus.reciter", {
      slug: "off-style",
      name_translit: "Off style",
      name_arabic: "خارج النمط",
      recitation_style: "murattal",
      audio_base_url: "https://audio.invalid/base",
      license_type: "public_domain",
      is_active: true,
    });
    await orm.updateRecordsForService(
      "corpus.reciter",
      { slug: "off-style" },
      { recitation_style: "qiraat_sitt" },
    );
    await assert.rejects(
      listReciters(orm),
      QlValidationError,
      "a row outside the declared style vocabulary has to be heard about",
    );
  });
});

void test("the addon exposes reciter forms and keeps hand-typed timelines out", () => {
  const forms = new Set(
    (corpusManifest.views ?? [])
      .filter((view) => view.type === "form")
      .map((view) => view.model),
  );
  const lists = new Set(
    (corpusManifest.views ?? [])
      .filter((view) => view.type === "list")
      .map((view) => view.model),
  );
  assert.equal(forms.has("corpus.reciter"), true, "reciter identity is authorable");
  assert.equal(
    lists.has("corpus.audio_segment"),
    true,
    "curated clips must at least be auditable",
  );
  assert.equal(
    forms.has("corpus.audio_segment"),
    false,
    "millisecond alignment is not something to type into a form",
  );
  assert.deepEqual(corpusManifest.data ?? [], []);
});
