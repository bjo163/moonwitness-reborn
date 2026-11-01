# Aturan Proyek MoonWitness

## Batas arsitektur

- Semua domain model, data, ACL, dependensi, dan deklarasi view harus menjadi addon `ql_*` di `packages/`, memakai TypeScript.
- Jangan menambahkan Drizzle, schema Drizzle, atau migration files. Semua tabel aplikasi harus didefinisikan melalui model addon `ql_*` dan disinkronkan otomatis oleh QlOrm.
- Setiap addon menyediakan `__manifest__.ts`, definisi model di `models/`, view di `views/`, dan deklarasi `data` default; daftar data boleh kosong hanya bila tidak ada seed sistem/referensi yang sah. QlOrm memuat seed ber-ID stabil sesudah sinkronisasi schema mengikuti urutan dependensi.
- Gunakan prefix nama package `ql_` dan nama model berformat `domain.entity` (contoh `ai.provider`).
- Kontrak request/response, route, dan SDK komunikasi API wajib berada di `@moonwitness/moonclient`.
- Semua komunikasi HTTP aplikasi web (`apps/web`) wajib memakai instance `moonClient`; jangan memakai `fetch`, XMLHttpRequest, atau klien transport lain di aplikasi. Utility developer mandiri di luar `apps/web` boleh memakai HTTP same-origin hanya ke server loopback miliknya sendiri.
- API memakai DTO dan route bersama dari `@moonwitness/moonclient`; jangan menduplikasi path endpoint di server.
- Aturan lint workspace dipusatkan di `eslint.config.mjs` dan dijalankan dari root melalui `pnpm lint`. Perubahan harus melewati lint, typecheck, dan tes relevan.

## Data dan keamanan

- Nyatakan field, tipe, validasi panjang, kepemilikan (`ownerField`), ACL, dan view di manifest addon; jangan membuat CRUD domain paralel di API atau database package.
- Jangan seed record milik pengguna atau data rights-sensitive tanpa sumber dan otorisasi yang tervalidasi. Gunakan kebijakan data per-record `insert_only` atau `reconcile`.
- Letakkan validasi domain tambahan pada model/service addon dan gunakan kembali di boundary API; API tetap memvalidasi bentuk serta batas ukuran request.
- Jalankan operasi domain melalui `QlOrm`. Akses service/internal yang membaca atau menulis field privat hanya boleh dipanggil server-side dan harus tetap membatasi record dengan pemiliknya.
- Field rahasia wajib `private`, tidak boleh masuk metadata, hasil CRUD pengguna, log, atau respons API. Enkripsi secret saat disimpan dan jangan pernah mengirim key provider ke browser setelah diterima.
- Terapkan ACL deny-by-default dan isolasi record per pemilik. Tambahkan tes untuk akses silang pengguna, field privat, dan jalur service internal.

## UI dan perubahan

- UI model/view-driven memakai metadata addon dan komponen dari `@moonwitness/ui`; jangan menduplikasi komponen design system di aplikasi. `apps/web` hanya boleh memuat CSS satu baris `@import "@moonwitness/ui/preset.css"` di `src/app/globals.css`; seluruh design token, browser reset, dan `.ql-*` class hidup di `packages/ui/styles/**` (MW-ADR-020). Primitif dan composite yang dipakai dua layar atau lebih (`NavLink`, `SidebarNav`, `NavSectionLabel`, `SidebarBrand`, `SidebarFooter`, `WorkspaceSidebar`, `PageHeader`, `LoadingScreen`, `EmptyState`, `SectionGrid`, `IconTile`, `MetricRow`/`MetricList`, `ListOption`, `SidePanel`, `Card`, `Badge`, `Alert`, `DataTable`, `WorkspaceTemplate`, `CenteredAuth`, `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `FormField`, `RawField`) wajib diimpor dari `@moonwitness/ui`, bukan di-re-implement di `apps/web`. Aturan konsistensi UI (`no-restricted-syntax`) berstatus `error` dan berlaku untuk setiap `.tsx` di `apps/web/src` (bukan hanya `src/features`): elemen form/`<style>` telanjang, `<a href="…">` internal, `style={}`, warna arbitrary (`bg-[#0b110b]`), dan kelas palette default Tailwind (`text-stone-300`, `bg-white`) semua menggagalkan CI — token `@theme` (`bg-panel`, `text-acid`, `border-hairline`, `text-ink-soft`) adalah satu-satunya sumber warna; nama class `ql-*`/`is-*` tetap legal. Component baru wajib punya test render di `packages/ui/tests/` dan tidak memiliki teks UI di dalam package (semua copy lewat props, mis. label `DataTable` wajib). Hook yang menyentuh data/session (`currentUser()` + 401→`/auth`) tetap di `apps/web` karena `@moonwitness/ui` tidak boleh bergantung pada `@moonwitness/moonclient`.
- Letakkan perilaku domain di addon/runtime yang sesuai; API hanya menjadi boundary autentikasi, validasi request, dan pemanggil service.
- Setiap perubahan addon menyertakan tes manifest/model/ACL dan dites dengan `pnpm build`, `pnpm typecheck`, serta tes workspace yang relevan.
- Perbarui dokumentasi arsitektur saat menambah addon atau mengubah batas tanggung jawab package.

## Alur kerja dan validasi

- Untuk setiap pekerjaan coding, wajib baca dan ikuti skill [task-tracker](.github/skills/task-tracker/SKILL.md) sebelum implementasi: petakan pekerjaan ke task kanonis, tandai aktif, lalu tutup dengan bukti atau catat blocker. Jangan memulai implementasi tanpa task yang terlacak.
- Sebelum mengedit, telusuri pemilik fitur, pola terdekat, kontrak bersama, dan tes yang sudah ada. Ubah sesedikit mungkin file untuk menyelesaikan akar masalah; jangan menyapu perubahan pengguna yang tidak terkait.
- Jaga setiap perubahan tetap terketik, dengan validasi dan error yang eksplisit. Jangan menyamarkan kegagalan memakai fallback sukses, catch luas, atau cast tipe yang tidak aman.
- Tambahkan atau sesuaikan tes pada boundary yang berubah. Untuk perubahan UI, periksa loading, error, empty, dan interaksi yang terdampak; untuk katalog i18n, jaga konsistensi key `id`/`en`.
- Jalankan tes/build yang terarah saat iterasi. Sebelum menyatakan pekerjaan selesai, jalankan quality gate yang relevan dan laporkan perintah serta hasilnya; bedakan error lint dari warning.
- Lint menggunakan TypeScript type-aware. Pada checkout bersih atau setelah perubahan dependency/package, ikuti urutan CI: `pnpm exec turbo run build` → `pnpm lint` → `pnpm typecheck` → `pnpm test`. `pnpm build` sendiri menjalankan lint sebelum build, jadi bukan pengganti urutan tersebut pada checkout tanpa output build.
- Untuk perubahan tracker, jalankan `pnpm tracker:check` dan `pnpm tracker:test`. Edit `docs/governance/task-tracker.json` sebagai sumber kanonis, lalu hasilkan `TODO.md` melalui `pnpm tracker:render`. Mini UI lokal diluncurkan dengan `python -B docs/audit/tools/task_tracker_server.py` dan hanya boleh mengikat `127.0.0.1`.
- Pecah pekerjaan paralel hanya untuk bagian yang benar-benar independen dan file/interface yang tidak tumpang tindih. Beri tiap worker lingkup serta kriteria selesai yang jelas; satu integrator menangani kontrak bersama dan menjalankan validasi akhir.
- Jangan commit, push, mengubah konfigurasi GitHub, atau menjalankan deployment kecuali diminta secara eksplisit.

## Kustomisasi agent

- Instruksi ini adalah aturan proyek yang selalu berlaku. Prosedur implementasi terperinci ada di `.github/skills/moonwitness-development/SKILL.md`; penggunaan tracker wajib dijalankan melalui `.github/skills/task-tracker/SKILL.md`; agent khusus ada di `.github/agents/`.
- Saat mengubah aturan arsitektur atau quality gate, perbarui instruksi, skill, dan/atau agent yang terdampak dalam perubahan yang sama. Hindari menyalin seluruh isi aturan ke beberapa tempat; tautkan ke sumber kanonis.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
