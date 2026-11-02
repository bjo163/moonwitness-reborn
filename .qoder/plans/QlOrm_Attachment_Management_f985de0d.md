# QlOrm Attachment Management

## Ringkasan

Audit: attachment management **belum ada sama sekali**, dan tidak bisa dibangun sebagai field biasa.

| Bukti | Lokasi |
|---|---|
| `FieldType` hanya scalar: `char\|text\|integer\|boolean\|datetime` | `packages/types/src/index.ts:16` |
| `RecordValue = string\|number\|boolean\|null` (byte tak bisa masuk record/wire) | `packages/types/src/index.ts:37` |
| `sqlType()` hanya hasilkan TEXT/INTEGER/BIGINT/SMALLINT, tanpa BLOB | `packages/ql-orm/src/index.ts:266-277` |
| `toDatabaseValue()` melempar `Unsupported field value.` untuk `Buffer`/`Uint8Array` | `packages/ql-orm/src/index.ts:303-325` |
| `mapRows()` **senyap** mengubah nilai non-scalar jadi `null` | `packages/ql-orm/src/index.ts:1706-1708` |
| Body HTTP dibatasi `MAX_BODY_BYTES = 64 * 1024` dan `readJsonBody()` menampung seluruh body di RAM | `apps/api/src/http/server.ts:185`, `:300-306` |
| Tidak ada API transaction (dibatasi juga oleh komentar importer) | `packages/ql_corpus/services/import-service.ts:31-36` |
| Tidak ada tipe relasi `m2o`/`o2m`; filter service hanya operator `=` | `packages/ql-orm/src/index.ts:1375-1389` |
| Grep `attachment\|binary\|Blob\|upload\|multipart` di `packages/`: 3 hit tak relevan | seluruh repo |

Keputusan arsitektur inti: **byte tidak pernah masuk ke kolom database dan tidak pernah masuk `RecordValue`.** Yang ditambahkan ke ORM adalah *seam penyimpanan* (`QlStorageDriver`), bukan tipe kolom biner. Metadata attachment tetap tersimpan sebagai field scalar biasa yang sudah didukung hari ini.

## Kontrak yang tidak boleh dilanggar (dari AGENTS.md)

- Domain model, ACL, view, data harus lewat addon `ql_*`; **tidak ada Drizzle/migration file**; tabel disinkronkan `syncSchema()`.
- Semua HTTP di `apps/web` wajib `moonClient`; tanpa `fetch`/`XMLHttpRequest`/klien lain. Ini ditegakkan ESLint (`no-restricted-globals`/`-properties`) di `packages/eslint-config/index.js:52-61`.
- DTO, route, dan SDK wajib di `@moonwitness/moonclient`; path endpoint tidak boleh diduplikasi.
- Komponen bersama di `packages/ui/src/composites/`; primitif di `atoms/`. Elemen form mentah (`input`, `button`, `select`, `textarea`), `<style>`, `style` inline, dan warna arbitrer **dilarang** di `apps/web/src/features/**` (`packages/eslint-config/index.js:132-153`), tetapi legal di `packages/ui` (karena di sana memang implementasi primitifnya).
- Copy wajib ada di katalog `id` dan `en`; komponen UI bersama tidak boleh berisi copy user-facing.
- Gerbang: build → lint type-aware → typecheck → test → budget web, hanya lewat GitHub Actions.

## Prasyarat yang harus dikonfirmasi sebelum kode pertama

1. **Persistensi produksi sudah aman.** `docker-compose.coolify.yml:40-41` dan `docker-compose.yml:44-45` sama-sama memasang volume `api_data:/app/data`. Simpan blob di bawah `/app/data/attachments` agar ikut terlindungi backup/volume yang sama. `web` tidak punya (dan tidak boleh punya) volume.
2. **Produksi memakai SQLite, bukan Postgres** (`DATABASE_URL: file:/app/data/moonwitness.db`). Semua tes attachment wajib hijau di **dua driver**.
3. **Browser memanggil API lewat rewrite Next** (`apps/web/next.config.ts:7-13`, `/api/:path*` → `API_URL`). Artinya:
   - Sesi cookie `ql_session` bersifat `HttpOnly; SameSite=Strict; Path=/` (`apps/api/src/auth/auth.ts:111-119`), dan因为是 same-origin, subresource seperti `<video src>` ikut terbawa cookie. Jadi unduhan bertenar **tanpa** perlu signed token.
   - Semua body upload/download diprokses oleh Next. Konsekuensi teknis: ukuran chunk dan penggunaan `Range` adalah cara membatasi memori proxy, bukan sekadar kenyamanan UX. **Wajib divalidasi secara terukur** (lihat Fase 2.6 dan Risks #5).
4. Jangan menyentuh `MAX_BODY_BYTES` global. Rute biner mendapat batas sendiri yang eksplisit.

---

## Fase 0 — Seam penyimpanan di `ql_orm` (core)

Fase ini tidak bergantung addon lain dan berdiri sendiri.

- **0.1** Baru `packages/ql-orm/src/storage.ts`:
  - `QlStorageKey` = string tervalidasi `^ir/attachment/[a-f0-9-]{36}$` (atau prefix `tmp/`), **selalu** dihasilkan server. Validasi sebelum menyentuh filesystem.
  - `interface QlStorageDriver` dengan API yang **hanya stream**: `write(key): QlStorageSink` (`append(chunk: Uint8Array)`, `abort()`, `finish()` mengembalikan `{ sizeBytes, sha256 }`), `read(key, range?: { start?: number; end?: number }): AsyncIterable<Uint8Array>`, `stat(key)`, `remove(key)`, `list(prefix)`. Tidak ada method yang mengembalikan seluruh isi file sebagai `Buffer`.
  - `class QlConfigurationError extends Error` untuk driver yang belum dipasang.
- **0.2** Baru `packages/ql-orm/src/storage-local.ts`: `LocalDiskStorageDriver(rootDir)`.
  - Path final `resolve(rootDir, key)`; setelah resolve, **wajib** cek `path.startsWith(rootDir + sep)` (penahan kedua terhadap traversal).
  - `finish()` menulis ke `${key}.part` lalu `rename()` (publish atomik). `abort()` menghapus `.part`.
  - sha256 diakumulasi per `append()` lewat `createHash`, jadi **tidak pernah** membaca ulang file 500 MB untuk verifikasi.
  - `read()` memakai `fs.createReadStream({ start, end })`; `end` tak ditentukan berarti sampai EOF.
- **0.3** Ubah `packages/ql-orm/src/index.ts` (edit aditif, jangan refactor):
  - `createQlOrm(databaseUrl, manifests, options?: { storage?: QlStorageDriver })`.
  - `QlOrm` constructor menerima opsi; getter `storage` melempar `QlConfigurationError` bila belum dipasang (kegagalan harus nyaring, bukan fallback diam-diam).
  - Tambah `package.json` exports: `./storage` dan `./storage/local`.
- **0.4** Ubah `packages/ql-orm/src/testing.ts`: `withMemoryOrm(manifests, run, options?)` dengan opsi `storage` (default: driver lokal di `mkdtemp`). Tetap kompatibel mundur untuk semua pemanggil lama.
- **0.5** Baru `packages/ql-orm/src/storage.test.ts`: penolakan traversal (`..`, absolut, key asing), aritmetika range (open-ended, `end` clamped, mulai > akhir → error), key hilang, file kosong, publish atomik (tak ada state separuh), dua writer bersamaan, dan `storage` getter melempar saat driver tidak dipasang.

## Fase 1 — Addon `ql_attachment`

- **1.1** Scaffold `packages/ql_attachment/`: `package.json` (nama `ql_attachment`, exports `./__manifest__`, `./models`, `./services/attachment-service`, `./services/media-policy`, `./views`), `tsconfig.json` extends `../../tsconfig.addon.json`, dan folder `models/`, `views/`, `services/`. Ikuti pola `ql_cloudflare`/`ql_i18n`.
- **1.2** Baru `models/ir_attachment.ts` → model `ir.attachment`, tabel `ir_attachment`, `ownerField: "owner_id"`.
  - `name` char required maxLength 240 (nama tampilan hasil sanitasi)
  - `parent_model` char maxLength 120; `parent_record_id` char maxLength 120 (link polymorphic; **bukan** `owner_model`/`owner_id`, karena `owner_id` sudah diambil `ownerField` dan diisi otomatis oleh `create()`)
  - `kind` char required maxLength 32, `options: ["media","document","dataset"]`
  - `mime_type` char required maxLength 120
  - `size_bytes` integer required minValue 0 maxValue 524288000 (500 MiB)
  - `sha256` char required maxLength 64 dengan `validator` regex `^[a-f0-9]{64}$`
  - `state` char required `options: ["uploading","verifying","ready","deleted"]`, default `"uploading"`
  - `driver` char required maxLength 40
  - `storage_key` char required unique maxLength 200 **`private: true`**
  - `created_at`, `updated_at`, `uploaded_at` datetime required
- **1.3** Baru `models/ir_attachment_upload.ts` → model `ir.attachment.upload`, tabel `ir_attachment_upload`, `ownerField: "owner_id"`. Field: `attachment_id` char required, `state` char options `["open","assembling","failed","closed"]`, `chunk_size` integer required, `total_chunks` integer required minValue 1 maxValue 20000, `expected_bytes` integer required, `declared_sha256` char maxLength 64 + validator, `expires_at` datetime required.
- **1.4** Baru `views/index.ts`: list `ir.attachment` (`id,name,kind,mime_type,size_bytes,state,created_at`) dan form detail. **Jangan** sertakan `storage_key` (private). `ir.attachment.upload` **tanpa view** dan **tanpa access rule** (deny-by-default; hanya bisa lewat service internal).
- **1.5** Baru `__manifest__.ts`: `category: "system"`, `depends: ["ql_base","ql_auth"]`, `data: []` (tidak ada seed sah; tidak ada data milik pengguna), access satu rule: `model: "ir.attachment"`, `group: "user"`, `read: true`, `create: true`, `write: false`, `unlink: true`. Tanpa rule `admin`/`root` agar isolasi record per pemilik tidak bocor.
- **1.6** Baru `services/media-policy.ts`: allowlist MIME per `kind`, batas ukuran per `kind` (`media`/`dataset` 500 MiB, `document` 50 MiB), dan **penciuman magic bytes** (PNG/JPEG/GIF/WEBP/MP4/PDF/ZIP). `declaredMime !== sniffedMime` → `QlValidationError`.
- **1.7** Baru `services/attachment-service.ts` (semua tulis via `*ForService`; `ir.attachment` untuk read user biasa via `findMany`):
  - `createUploadSession()`: validasi policy + kuota, buat row `ir.attachment` (`state: uploading`) dan `ir.attachment.upload` (`state: open`, `expires_at: now + 6h`), kembalikan `{ uploadId, attachmentId, chunkSize, maxBytes }`.
  - `appendChunk(uploadId, index, source)`: tulis ke key `tmp/<uploadId>/<index>`; **idempoten** (re-PUT index yang sama menimpa). `received` dihitung dari **daftar part yang benar-benar ada** (`list(prefix)`), bukan dari counter yang di-increment. Ini mencegah bug klasik bolong/terhitung ganda.
  - `completeUpload()`: gabungkan part → key final, verifikasi `size_bytes === expected_bytes` dan `sha256 === declared_sha256`, baru flip `state: ready` dan set `uploaded_at`. Gagal → `state: failed` di session, part dihapus, attachment dihapus.
  - `readContent(attachmentId, user, range)`: cek `owner_id` via `findManyById`/`findOne` bertenar user, lalu stream dari driver.
  - `removeAttachment()`: tandai `deleted` → hapus bytes → hapus row. Bila hapus bytes gagal, row tetap `deleted` dan direaper (tidak pernah ada row `ready` tanpa bytes yang lolos tanpa jejak).
  - `cleanupExpired()`: reaper untuk session `open`/`assembling` yang `expires_at`-nya lewat dan bytes yatim. **Tanpa transaction API**, reaper harus idempoten dan aman dijalankan ulang.
- **1.8** Tes: `models/index.test.ts` (manifest/ACL/view/private, pola sama `ql_cloudflare/models/index.test.ts`), `services/attachment-service.test.ts` (happy path, bolong chunk, duplikat, lebih dari batas, digest mismatch, akses lintas user ditolak, session kedaluwarsa, reaper), `services/media-policy.test.ts` (MIME spoofing). Jalankan di **dua driver**.
- **1.9** Registrasi: `import attachmentManifest from "ql_attachment/__manifest__"` dan tambahkan ke array `createQlOrm()` di `apps/api/src/index.ts:43-57`; bangun driver dari env baru `ATTACHMENT_STORAGE_DIR` (default `/app/data/attachments`) dan operasikan sebagai opsi ketiga `createQlOrm`. Tambah key ke `.env.example`, `docker-compose.yml`, `docker-compose.coolify.yml`.

## Fase 2 — Boundary API (`apps/api`)

- **2.1** Baru `apps/api/src/http/attachments.ts`: satu function handler (ikut pola pemisahan `handleConnectorsRequest`/i18n), dipanggil dari `handleApiRequest` sebelum 404 penutup. Rute:
  - `POST /attachments/uploads` (JSON, batas 64 KB tetap)
  - `PUT /attachments/uploads/:uploadId/chunks/:index` (`application/octet-stream`; `content-type` lain → 415; batas per rute = `chunkSize + 64 KiB`, lebih → 413)
  - `POST /attachments/uploads/:uploadId/complete` (JSON)
  - `GET /attachments`, `GET /attachments/:id`, `DELETE /attachments/:id`
  - `GET /attachments/:id/content`
- **2.2** Reader body biner **men stream** langsung ke `QlStorageSink` (`for await (const chunk of request)`), tidak pernah menumpuk `chunks: Uint8Array[]` seperti `readJsonBody`. Jangan mengubah `readJsonBody`.
- **2.3** Saat menolak lebih awal (401/413/415), **habiskan atau hancurkan** stream request. Di `node:http` mentah, mengirim respons tanpa drain membuat upload menggantung. `requireAuthenticatedUser` sudah memakai `request.resume()`; tiru perilaku ini.
- **2.4** Sanitasi `Content-Disposition`: buang CR/LF/kutip/kontrol, emit `filename` ASCII dan `filename*` RFC 5987. Ini menutup header injection lewat nama file.
- **2.5** Header respons konten: `Accept-Ranges: bytes`, `Content-Length`, `Content-Range` + status 206 (416 bila range tak satisfiable), `ETag` = sha256, `If-Range`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, max-age=300, must-revalidate`, `Vary: Cookie`. `Content-Disposition: attachment` untuk tipe di luar daftar inline-safe.
- **2.6** Perbaiki pemetaan error di `handleRequestError` (`apps/api/src/http/server.ts:582-636`): `QlConfigurationError` → 503, kelebihan payload → 413 dengan `Retry-After` tak perlu, tipe ditolak → 415. Tambah assertion di `apps/api/src/http/attachments.test.ts` (ikuti gaya `corpus.test.ts`) untuk: unauth 401, lintas user 404/403, bolong chunk, 413, 415, 206/416, dan penghapusan. Tambah **tes batas memori**: upload total jauh melampaui 64 KB sambil memastikan RSS tidak naik sebanding ukuran file.

## Fase 3 — Kontrak `@moonwitness/moonclient`

- **3.1** Tambah `apiRoutes.attachments = { collection, prefix, item(id), content(id), uploads, upload(id), complete(id), chunk(uploadId, index) }` mengikuti pola `segment()` yang ada (`packages/moonclient/src/index.ts:1023-1092`).
- **3.2** DTO: `AttachmentDto`, `AttachmentListResponseDto`, `CreateAttachmentUploadRequestDto`/`ResponseDto`, `UploadChunkResponseDto`, `CompleteAttachmentUploadRequestDto`, `DeleteAttachmentResponseDto`. **Tidak ada field `storageKey`** di DTO mana pun.
- **3.3** Refactor `MoonClient.request()` (`:1513-1552`) menjadi `requestJson()` + `requestBinary()` yang **memakai pemetaan error yang sama** (jangan duplikasi parsing `ApiErrorBody`). `requestBinary` tidak mengirim `content-type: application/json`.
- **3.4** Method: `listAttachments()`, `createAttachmentUpload(input)`, `uploadAttachmentChunk(uploadId, index, body: Blob|Uint8Array, signal?)`, `completeAttachmentUpload(uploadId, input)`, `deleteAttachment(id)`, dan `attachmentContentUrl(id)` yang membangun URL resource dari route (sehingga `apps/web` tidak pernah menulis path endpoint sendiri).
- **3.5** Tes di `packages/moonclient/src/index.test.ts`: method biner tidak mengirim `content-type: application/json`, pemetaan 413/415 identik dengan jalur JSON, `attachmentContentUrl` meng-escape segmen.

## Fase 4 — Primitif UI bersama (`packages/ui`)

`packages/ui` **belum punya** komponen progress sama sekali (grep `progress|meter|aria-valuenow` = 0 hasil), dan `<input type="file">` mentah dilarang di `apps/web/src/features`. Keduanya harus lahir di sini.

- **4.1** Baru `src/atoms/progress.tsx` + blok `.ql-progress` di `packages/ui/styles/components.css` (ikut nilai literal yang sudah ada, `border-radius: 0`, warna via `var(--ql-ui-*)`): `role="progressbar"`, `aria-valuemin/max/now`, `aria-valuetext`, determinate dan indeterminate. Lebar diisi dari **CSS custom property yang di-set di dalam paket** (`--ql-progress-value`), bukan `style` inline di apps/web. Animasi tunduk `prefers-reduced-motion`.
- **4.2** Baru `src/atoms/file-input.tsx`: `<input type="file">` asli hidup di sini, visually hidden dengan label yang terlihat, `accept`/`multiple` via props, target sentuh ≥44px, focus terlihat, `disabled` menampilkan `cursor: not-allowed`.
- **4.3** Baru `src/composites/attachment-upload.tsx` dan `src/composites/attachment-list.tsx`: murni presentasi + props; **copy user-facing masuk lewat props** (AGENTS.md). Sertakan state kosong/memuat/gagal/batas ukuran ditolak. Tes wajib memeriksa perilaku override `className` dan markup (aturan proyek untuk komponen bersama).
- **4.4** Ekspor dari `packages/ui/src/index.ts`.

## Fase 5 — Layar web + copy (`apps/web`)

- **5.1** Baru `apps/web/src/app/attachments/page.tsx` dan modul `src/features/attachments/*`. Susun dari `WorkspaceTemplate`, `PageHeader`, `EmptyState`, `LoadingScreen` seperti workspace yang sudah ada; jangan merakit ulang kerangka sidebar.
- **5.2** Hook upload resumable: `File.slice()` → chunk 4 MiB (konfigurasi, maks 8 MiB), **maks 3 chunk paralel**, retry per-chunk dengan backoff, progress dihitung dari **byte yang diakui server** (`UploadChunkResponseDto`), bukan estimasi klien. Sedia batal dan jeda. Simpan `uploadId` agar bisa lanjut setelah reload.
- **5.3** Pratinjau lewat `moonClient.attachmentContentUrl(id)` di `<video>`/`<img>`, **wajib** `width`+`height` atau `aspect-ratio` (R-40), `alt` benar (kosong bila dekoratif), dan state fallback ketika gagal dimuat.
- **5.4** Tambah entri navigasi sidebar **hanya setelah** halaman benar-benar ada (R-24), melalui `SidebarNav` items milik workspace.
- **5.5** Copy baru ke `packages/ql_i18n/i18n/id.po` dan `en.po` dengan `msgctxt "web:attachments.*"` (msgid Indonesia, sama seperti entri lain). **Tanpa em dash** (R-02). Jalankan validasi katalog (`packages/ql_i18n/scripts/catalog-validation.test.mjs`, `catalogs.test.mjs`).
- **5.6** Catatan arah desain (R-37, memakai kanon yang ada, bukan menciptakan arah baru): *"Reading this as: internal workspace tool (lampiran) untuk anggota terautentikasi, dalam bahasa visual Moon UI Cosmic Ivory & Antique Gold, dial ENERGY 1 / RHYTHM 1 / MOTION 1."* Alasannya tercatat di `design/DESIGN-DNA.md` §6 (umpan balik muat harus menjelaskan tunggu nyata, tanpa persentase palsu) dan §3 (`border-radius: 0`, geometri arsitektural). **Jangan** membuat/men-generate aset logo, avatar, atau ilustrasi baru; attachment adalah milik pengguna (R-23, R-38).

## Fase 6 — Gap ORM pendamping (bisa rilis terpisah, tidak memblokir attachment)

- **6.1** Deklarasi relasi: tambahkan `relation?: { kind: "m2o"; model: string } | { kind: "o2m"; model: string; inverseField: string }` ke `QlFieldDefinition` (`packages/ql-orm/src/index.ts:23-38`), dengan tipe penyimpanan tetap `char` (FK = id target). Validasi di `QlModelRegistry` (`:607-701`): model target harus ada, `inverseField` harus ada dan berupa `m2o` yang menunjuk balik. Tambah `orm.readRelations(modelName, records, fieldNames)` untuk hidrasi o2m/m2o sekali jalan (hindari N+1).
- **6.2** API transaction: `QlConnection.transaction<T>(fn)` di `packages/ql-orm/src/index.ts:169-174`. Untuk `postgres` pakai `pool.connect()` (satu sesi koneksi); untuk `libsql` kirim `BEGIN`/`COMMIT`/`ROLLBACK`. Ini bagian paling berisiko di fase ini karena `QlConnection.execute()` saat ini tidak memodelkan sesi koneksi; desain sebagai view `QlConnection` terikat transaksi, dan **jangan** menyentuh jalur non-transaction.
- **6.3** **Pernyataan batas yang jujur:** transaction API ini untuk tulis multi-row **di dalam database yang sama**. Ia **tidak** membuat operasi blob+row menjadi atomik (filesystem dan database bukan satu resource manager). Karena itu attachment sengaja memakai state machine + reaper, bukan transaction.
- **6.4** Opsional setelah 6.1: ganti link `parent_model`/`parent_record_id` manual dengan relasi `m2o` yang dideklarasikan. Ubah hanya bila ada kebutuhan query baru; jangan dikejakan tanpa alasan.

## Fase 7 — Operasi, gerbang, dokumentasi

- **7.1** Kuota dan penahan disk: total per pengguna (default 2 GiB, via env), periksa ruang kosong sebelum `createUploadSession`, tolak dengan 503 + `Retry-After` saat sisa ruang kritis. Ini menutup disk-DoS dari upload sahit.
- **7.2** Penjadwalan reaper: interval dalam proses (mis. 15 menit) **plus** sapuan saat boot. Catatan jujur: belum ada infra struktur antrean/pekerja, jadi reaper proses tunggal adalah batas yang disengaja, bukan solusi skalabel multi-replika.
- **7.3** Verifikasi Traefik/Coolify: batas ukuran body dan timeout koneksi untuk upload panjang. Chunk 4 MiB dipilih supaya satu koneksi tidak pernah membawa 500 MB, sehingga timeout proxy tidak menghapus seluruh progresso.
- **7.4** Gerbang GitHub Actions sesuai urutan `AGENTS.md`: build → lint type-aware → typecheck → test → budget web. Jangan menyatakan lulus tanpa run yang diamati pada SHA persis.
- **7.5** Perbarui halaman arsitektur Wiki untuk addon `ql_attachment` dan seam `QlStorageDriver` (wajib saat menambah addon).
- **7.6** Lacak task lewat GitHub Issues dengan skill `.github/skills/github-issues/SKILL.md`; jangan buat daftar task lokal.
- **7.7** Sebelum menyerahkan bagian UI: jalankan Delivery Gate antislop (Blok 1–4) sebagai laporan PASS/FAIL baris-per-baris dengan bukti konkret (click-through tiap kontrol, kedua tema, breakpoint mobile, tanpa error console). Gerbang ini tidak bisa didelegasikan atau digantikan ringkasan.

## Dependency

- Fase 0 → 1 → 2 → 3 (runtuh; tiap fase butuh kontrak fase sebelumnya).
- Fase 4 berdiri sendiri (hanya butuh tipe DTO Fase 3 untuk props akhir; bisa dimulai paralel dengan 1–3).
- Fase 5 butuh 3 **dan** 4.
- Fase 6 butuh 0 selesai dan berdiri sendiri setelahnya; 6.4 butuh 6.1. **Fase 6 tidak memblokir 1–5.**
- Fase 7.1–7.3 berjalan bersama Fase 2; 7.5–7.7 terakhir.

## Risks dan mitigasi

1. **Kehilangan data senyap bila tipe kolom biner ditambahkan.** `mapRows()` sudah mengubah apa pun yang bukan scalar/string/number jadi `null` (`:1706-1708`). Mitigasi: **keputusan desain: jangan tambah FieldType biner**; byte hanya lewat driver. Tambah tes yang mengunci tidak adanya field `binary` di `FieldType`.
2. **Path traversal lewat key.** Mitigasi: key hanya dibuat server (UUID), regex `QlStorageKey`, lalu pemeriksaan `resolve()` harus berada dalam `rootDir`. Tes eksplisit di 0.5.
3. **Header injection lewat nama file.** Mitigasi: 2.4 (sanitasi + `filename*` RFC 5987).
4. **OOM pada file besar.** Mitigasi: antarmuka driver stream-only (0.1), `appendChunk` stream (2.2), verifikasi sha256 inkremental (0.2), `Range` membatasi ukuran tiap respons proxy. Dikunci assertion di 2.6.
5. **Proxy Next rewrite menyangga body.** Ini risiko nyata yang belum terukur di repo. Mitigasi: chunk kecil + `Range` membuat badan tiap respons selalu kecil; langkah 2.6 mengukurnya. Bila PUT biner lewat rewrite terbukti menyangga, fallback yang diizinkan: naikkan batas chunk dan arahkan klien ke URL API langsung untuk rute biner **dengan persetujuanmu**, karena itu mengubah postulat same-origin dan perlu keputusan terpisah (bukan diputuskan diam-diam oleh implementer).
6. **Baris/bytes yatim tanpa transaction.** Mitigasi: state machine `uploading → ready`, transisi idempoten, `expires_at`, reaper (1.7 + 7.2). Aturan tak boleh dilanggar: **tidak pernah** ada row `ready` tanpa bytes terverifikasi.
7. **Bolong/duplikat/reorder chunk.** Mitigasi: part di-key per index, progress dan `total` dihitung dari daftar part aktual (bukan counter), 409/400 bila index tak dikenal, verifikasi kontiguitas saat `complete`.
8. **Spoofing MIME → XSS saat disajikan inline.** Mitigasi: magic-byte sniff (1.6), allowlist inline-safe, sisanya `Content-Disposition: attachment`, `nosniff` (2.5).
9. **Disk-DoS / kuota tak terbatas.** Mitigasi: 7.1.
10. **Regresi pada `server.ts` (3.2 ribu baris).** Mitigasi: hanya tambah satu file handler + pemetaan error + registrasi; tanpa sapuan refactor; `readJsonBody` dan `MAX_BODY_BYTES` tak berubah.
11. **Pelanggaran MW-ADR-020 saat bikin UI.** Mitigasi: semua markup mentah dan style dinamis hidup di `packages/ui` (Fase 4); `pnpm lint` dijalankan **sejak awal Fase 5**, bukan di akhir.
12. **Konflik `owner_id`.** Mitigasi: link induk bernama `parent_model`/`parent_record_id`; `ownerField` tetap `owner_id` karena `create()` mengisinya otomatis dan `update()` menolangnya (`:1257-1263`, `:1303-1305`).
13. **Lintas driver.** Produksi SQLite, dev Postgres. Mitigasi: semua tes attachment dijalankan dua-duanya (1.8, 2.6).
14. **Bahaya i18n diam-diam.** Komponen bersama tidak boleh memuat copy (1.6 UI rule). Mitigasi: props-only di 4.3, kunci validasi katalog di 5.5.
15. **Rahasia di `.env.coolify`.** Temuan audit (bukan attachment): token Cloudflare aktif tersimpan plaintext. File itu memang gitignored, tapi tetaplah layak diganti/rotasi. Implementer tidak boleh menyalinnya ke tempat lain, dan wajib tetap mematuhi aturan "field rahasia wajib `private`, tak masuk metadata/log/respons".

## Rejected Alternatives

- **Menambah `FieldType` biner/BLOB (`bytea`, BLOB).** Ditolak. `mapRows` diam-diam men-null-kan non-scalar (kehilangan data senyap), `toDatabaseValue` melempar, `RecordValue` tak bisa membawa byte, dan 500 MB di Postgres/SQLite membengkakkan vacuum/backup/replication. Menyimpan byte di DB hanya beralasan untuk aset kecil yang butuh backup satu-langkah, dan itu bukan profil targetmu.
- **`binary` disimpan sebagai base64 di kolom `text`.** Ditolak. Base64 menambah ~33%, memaksa deserialisasi penuh ke RAM, membuat `MAX_INPUT_LENGTH` 16.000 tidak bermakna, dan menghancurkan integritas sha256/rentang byte.
- **Menaruh driver penyimpanan dalam `ql_attachment` saja, tanpa menyentuh ORM.** Ditolak. Bertentangan dengan maksud permintaan ("pengembangan ql ORM") dan menjamin duplikasi begitu avatar atau audio korpus butuh byte. Yang tetap diambil dari usulan ini: disiplin aditif (satu file handler, `readJsonBody` tak disentuh, tiap fase bisa rilis sendiri).
- **Menyusulkan `m2o`/`o2m` sebagai prasyarat attachment.** Ditolak. Repo sudah memiliki preseden link polymorphic lewat `ir.model.data` (`model_name`/`record_id`), jadi `parent_model`/`parent_record_id` idiomatic dan tidak memblokir. Memasukkan relasi ke jalur kritis hanya memperlebar diff dan risiko tanpa manfaat fungsional untuk upload.
- **Mengandalkan API transaction untuk atomisitas blob+row.** Ditolak, secara teknis mustahil (dua resource manager berbeda, tanpa XA). Diganti state machine + reaper yang idempoten. Transaction API tetap dikerjakan (6.2), tapi untuk tulis multi-row dalam satu database.
- **Single POST di-stream langsung ke disk (tanpa chunking).** Ditolak untuk profil 500 MB: browser tidak bisa melanjutkan POST yang putus, dan timeout proxy dapat menghapus unggahan berjam-jam. Chunking resumable (B) dimenangkan; bentuk single-POST ini tetap layak sebagai jalur internal CLI/importer, dan tidak perlu dibikin sekarang.
- **Presigned PUT langsung ke penyimpanan object.** Ditolak untuk fase ini; butuh backend object storage (R2/S3) yang belum ada, dan akan melanggar postulat "semua HTTP lewat `moonClient`" di web karena browser menghubungi origin pihak ketiga. Dijadikan jalur evolusi berikutnya: implementasi `QlStorageDriver` kedua, tanpa mengubah model/API/SDK yang direncanakan di atas.
- **Signed download token untuk pratinjau video.** Ditolak sebagai default; `/api` same-origin + cookie `ql_session` `SameSite=Strict` sudah mengirim kredensial ke subresource, jadi token tambahan hanya menambah permukaan rahasia dan umur. Dipakai hanya bila verifikasi 5.3 membuktikan sebaliknya.
- **Memakai `tus` (tus-js-client).** Ditolak. Menambah dependency klien/server dan pola protokol yang tidak selaras dengan DTO `moonclient`; nilai yang sama dicapai dengan protokol chunk kecil yangDTO-nya didefinisikan sendiri di 3.2.
- **Membuat `ir.attachment` sebagai view `landing` publik.** Ditolak (R-38, aturan ACL deny-by-default). Attachment adalah data pribadi terautentikasi; tidak ada alasan menampilkannya di halaman publik.