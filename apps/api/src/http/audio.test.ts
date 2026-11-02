import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createConversationStore, type ConversationStore } from "@moonwitness/database";
import {
  apiRoutes,
  type ReciterListResponseDto,
  type SurahAudioManifestResponseDto,
} from "@moonwitness/moonclient";
import { createQlOrm, type QlOrm } from "ql_orm";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import corpusManifest from "ql_corpus/__manifest__";
import sourceManifest from "ql_source/__manifest__";
import { createApiServer } from "./server.js";

const testPassword = "correct horse battery staple";
const ownerEmail = "audio-owner@example.com";

let server: ReturnType<typeof createApiServer>;
let address: string;
let orm: QlOrm;
let closeOrm: () => void;
let store: ConversationStore;
let ownerCookie: string;

async function api<T>(
  path: string,
  init: { method?: string; cookie?: string } = {},
): Promise<{ status: number; text: string; body: T }> {
  const response = await fetch(`${address}${path}`, {
    method: init.method ?? "GET",
    headers: { cookie: init.cookie ?? ownerCookie },
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return { status: response.status, text, body: body as T };
}

async function seedReciter(input: {
  slug: string;
  nameTranslit: string;
  nameArabic: string;
  style?: "murattal" | "mujawwad" | "tahfeedh";
  licenseType?: string;
  isActive?: boolean;
}): Promise<void> {
  await orm.createRecordForService("corpus.reciter", {
    slug: input.slug,
    name_translit: input.nameTranslit,
    name_arabic: input.nameArabic,
    recitation_style: input.style ?? "murattal",
    // `audio_base_url` is a required column the read path never uses: clips are
    // addressed per verse through corpus.audio_segment, so a base URL here is
    // only what the fixture has to satisfy to exist.
    audio_base_url: `https://audio.invalid/${input.slug}`,
    license_type: input.licenseType ?? "public_domain",
    is_active: input.isActive ?? true,
  });
}

async function seedSegment(input: {
  reciter: string;
  surah: number;
  ayah: number;
  startMs: number;
  endMs: number;
}): Promise<void> {
  await orm.createRecordForService("corpus.audio_segment", {
    reciter_slug: input.reciter,
    surah_number: input.surah,
    ayah_number: input.ayah,
    start_ms: input.startMs,
    end_ms: input.endMs,
    audio_file_url: `https://audio.invalid/${input.reciter}/${String(input.surah).padStart(3, "0")}${String(input.ayah).padStart(3, "0")}.mp3`,
  });
}

before(async () => {
  const runtime = await createQlOrm("file::memory:", [
    baseManifest,
    authManifest,
    sourceManifest,
    corpusManifest,
  ]);
  orm = runtime.orm;
  closeOrm = runtime.close;
  store = createConversationStore(orm);
  server = createApiServer(undefined, store, orm);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const where = server.address();
  assert.ok(where !== null && typeof where !== "string");
  address = `http://127.0.0.1:${where.port}`;
  const setup = await fetch(`${address}${apiRoutes.auth.setup}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Owner",
      email: ownerEmail,
      password: testPassword,
    }),
  });
  assert.equal(setup.status, 201);
  ownerCookie = (setup.headers.get("set-cookie") ?? "").split(";", 1)[0];
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  closeOrm();
});

void test("the audio routes are owned by a handler, not a 405", async () => {
  // Both of these answered 405 before Track 05 got a handler: the `/corpus/`
  // prefix branch claimed them and nothing below the prefix matched.
  const paths = [
    apiRoutes.corpusAudio.reciters,
    apiRoutes.corpusAudio.surahManifest("al-husary", 1),
  ];
  for (const path of paths) {
    const anonymous = await fetch(`${address}${path}`);
    assert.equal(anonymous.status, 401, path);
  }
  for (const path of paths) {
    const reply = await api<{ error: string }>(path, { method: "POST" });
    assert.equal(reply.status, 405, `${path} -> ${reply.text}`);
  }
});

void test("an un-curated registry answers empty rather than naming a reciter", async () => {
  const reciters = await api<ReciterListResponseDto>(apiRoutes.corpusAudio.reciters);
  assert.equal(reciters.status, 200, reciters.text);
  assert.deepEqual(reciters.body.reciters, []);

  const manifest = await api<SurahAudioManifestResponseDto>(
    apiRoutes.corpusAudio.surahManifest("al-husary", 2),
  );
  assert.equal(manifest.status, 404, manifest.text);
});

void test("reciters come from corpus.reciter, deactivated voices stay hidden", async () => {
  await seedReciter({
    slug: "al-husary",
    nameTranslit: "Sheikh Mahmoud Khalil Al-Husary",
    nameArabic: "محمود خليل الحصري",
    licenseType: "licensed_for_display",
  });
  await seedReciter({
    slug: "as-sudais",
    nameTranslit: "Abdurrahman as-Sudais",
    nameArabic: "عبد الرحمن السديس",
    style: "mujawwad",
  });
  await seedReciter({
    slug: "retired-reciter",
    nameTranslit: "Retired",
    nameArabic: "متقاعد",
    isActive: false,
  });

  const reply = await api<ReciterListResponseDto>(apiRoutes.corpusAudio.reciters);
  assert.equal(reply.status, 200, reply.text);
  assert.deepEqual(
    reply.body.reciters.map((reciter) => reciter.slug),
    ["al-husary", "as-sudais"],
    "the deactivated row must not be offered, and insertion order is not the answer",
  );
  const [first] = reply.body.reciters;
  assert.equal(first?.nameTranslit, "Sheikh Mahmoud Khalil Al-Husary");
  assert.equal(first?.nameArabic, "محمود خليل الحصري");
  assert.equal(first?.licenseType, "licensed_for_display");
  assert.equal(first?.style, "murattal");
});

void test("clip addresses and boundaries come from corpus.audio_segment", async () => {
  await seedSegment({ reciter: "al-husary", surah: 1, ayah: 1, startMs: 0, endMs: 6400 });
  await seedSegment({ reciter: "al-husary", surah: 1, ayah: 3, startMs: 12800, endMs: 19500 });
  await seedSegment({ reciter: "al-husary", surah: 1, ayah: 2, startMs: 6400, endMs: 12800 });
  await seedSegment({ reciter: "as-sudais", surah: 112, ayah: 1, startMs: 0, endMs: 4200 });

  const reply = await api<SurahAudioManifestResponseDto>(
    apiRoutes.corpusAudio.surahManifest("al-husary", 1),
  );
  assert.equal(reply.status, 200, reply.text);
  const manifest = reply.body;
  assert.equal(manifest.reciterName, "Sheikh Mahmoud Khalil Al-Husary");
  assert.equal(manifest.reciterStyle, "murattal");
  assert.equal(manifest.licenseType, "licensed_for_display");
  assert.equal(manifest.surahNumber, 1);
  assert.deepEqual(
    manifest.segments.map((segment) => segment.ayahNumber),
    [1, 2, 3],
    "verses arrive in canonical order regardless of insertion order",
  );
  assert.deepEqual(
    manifest.segments.map((segment) => segment.endMs - segment.startMs),
    [6400, 6400, 6700],
    "boundaries are the curated columns, never index * 5000",
  );
  assert.equal(
    manifest.segments[1]?.audioFileUrl,
    "https://audio.invalid/al-husary/001002.mp3",
  );
  assert.equal(manifest.durationMs, 19500, "the timeline ends at the last curated clip");
  assert.equal(
    manifest.streamUrl,
    null,
    "three verse-sized files are not one surah-long stream",
  );

  const untouched = await api<SurahAudioManifestResponseDto>(
    apiRoutes.corpusAudio.surahManifest("al-husary", 114),
  );
  assert.equal(untouched.status, 200, untouched.text);
  assert.deepEqual(untouched.body.segments, []);
  assert.equal(untouched.body.durationMs, 0);
  assert.equal(untouched.body.streamUrl, null);
});

void test("a surah recorded as one file is the only thing that becomes a stream", async () => {
  for (const [ayahNumber, startMs, endMs] of [
    [1, 0, 3900],
    [2, 3900, 7450],
  ] as const) {
    await orm.createRecordForService("corpus.audio_segment", {
      reciter_slug: "as-sudais",
      surah_number: 113,
      ayah_number: ayahNumber,
      start_ms: startMs,
      end_ms: endMs,
      audio_file_url: "https://audio.invalid/as-sudais/113.mp3",
    });
  }

  const reply = await api<SurahAudioManifestResponseDto>(
    apiRoutes.corpusAudio.surahManifest("as-sudais", 113),
  );
  assert.equal(reply.status, 200, reply.text);
  assert.equal(reply.body.streamUrl, "https://audio.invalid/as-sudais/113.mp3");
  assert.equal(reply.body.durationMs, 7450);
});

void test("a locator the canonical table cannot produce fails the read", async () => {
  // The column bound only says "no verse is numbered above 286 anywhere"; the
  // service still refuses a clip that names a verse An-Nas does not have.
  await orm.createRecordForService("corpus.audio_segment", {
    reciter_slug: "as-sudais",
    surah_number: 114,
    ayah_number: 286,
    start_ms: 0,
    end_ms: 5000,
    audio_file_url: "https://audio.invalid/as-sudais/114286.mp3",
  });

  const reply = await api<SurahAudioManifestResponseDto>(
    apiRoutes.corpusAudio.surahManifest("as-sudais", 114),
  );
  assert.equal(reply.status, 400, reply.text);
  assert.match(reply.text, /not an addressable locator/i);
});

void test("locator and slug inputs are refused before any scan", async () => {
  const outOfRange = await api<SurahAudioManifestResponseDto>(
    apiRoutes.corpusAudio.surahManifest("al-husary", 115),
  );
  assert.equal(outOfRange.status, 400, outOfRange.text);

  for (const raw of ["Al-Husary", "a%2Fb"]) {
    const reply = await api<{ error: string }>(
      `/corpus/audio/manifest/${raw}/surah/1`,
    );
    assert.equal(reply.status, 400, `${raw} -> ${reply.text}`);
  }

  // A shape this handler owns but cannot route is a 404, never the generic
  // 405 the corpus prefix used to hand back for every unhandled sub-path.
  const unroutable = await api<{ error: string }>("/corpus/audio/manifest//surah/1");
  assert.equal(unroutable.status, 404, unroutable.text);
  const orphan = await api<{ error: string }>("/corpus/audio/clips/al-husary");
  assert.equal(orphan.status, 404, orphan.text);
});
