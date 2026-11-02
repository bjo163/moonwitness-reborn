# Aturan Proyek MoonWitness

## Batas arsitektur

- Semua domain model, data, ACL, dependensi, dan deklarasi view harus menjadi addon `ql_*` di `packages/`, memakai TypeScript.
- Jangan menambahkan Drizzle, schema Drizzle, atau migration files. Semua tabel aplikasi harus didefinisikan melalui model addon `ql_*` dan disinkronkan otomatis oleh QlOrm.
- Setiap addon menyediakan `__manifest__.ts`, definisi model di `models/`, view di `views/`, dan deklarasi `data` default; daftar data boleh kosong hanya bila tidak ada seed sistem/referensi yang sah. QlOrm memuat seed ber-ID stabil sesudah sinkronisasi schema mengikuti urutan dependensi.
- Gunakan prefix nama package `ql_` dan nama model berformat `domain.entity` (contoh `ai.provider`).
- Kontrak request/response, route, dan SDK komunikasi API wajib berada di `@moonwitness/moonclient`.
- Semua komunikasi HTTP aplikasi web (`apps/web`) wajib memakai instance `moonClient`; jangan memakai `fetch`, XMLHttpRequest, atau klien transport lain di aplikasi. Utility developer mandiri di luar `apps/web` boleh memakai HTTP same-origin hanya ke server loopback miliknya sendiri.
- API memakai DTO dan route bersama dari `@moonwitness/moonclient`; jangan menduplikasi path endpoint di server.
- Aturan lint workspace dipusatkan di `eslint.config.mjs`. Build, lint, typecheck, tes, dan budget web dijalankan sebagai gate utama melalui GitHub Actions.

## Data dan keamanan

- Nyatakan field, tipe, validasi panjang, kepemilikan (`ownerField`), ACL, dan view di manifest addon; jangan membuat CRUD domain paralel di API atau database package.
- Jangan seed record milik pengguna atau data rights-sensitive tanpa sumber dan otorisasi yang tervalidasi. Gunakan kebijakan data per-record `insert_only` atau `reconcile`.
- Letakkan validasi domain tambahan pada model/service addon dan gunakan kembali di boundary API; API tetap memvalidasi bentuk serta batas ukuran request.
- Jalankan operasi domain melalui `QlOrm`. Akses service/internal yang membaca atau menulis field privat hanya boleh dipanggil server-side dan harus tetap membatasi record dengan pemiliknya.
- Field rahasia wajib `private`, tidak boleh masuk metadata, hasil CRUD pengguna, log, atau respons API. Enkripsi secret saat disimpan dan jangan pernah mengirim key provider ke browser setelah diterima.
- Terapkan ACL deny-by-default dan isolasi record per pemilik. Tambahkan tes untuk akses silang pengguna, field privat, dan jalur service internal; GitHub Actions menjadi satu-satunya eksekutor gate.

## UI dan perubahan

- Aturan UI berikut berlaku untuk semua coding agent saat mengubah antarmuka:
  - Baca `.agents/skills/antislop/SKILL.md` dan instruksi antislop yang relevan; pilih mode sesuai preferensi sesi/global, jangan mengubah preferensi global tanpa diminta.
  - Untuk pekerjaan visual baru, ikuti arah desain kanonis atau referensi yang diberikan. Agent diperbolehkan membuat atau men-generate aset visual/ilustrasi yang relevan untuk kebutuhan desain antarmuka. Jangan membuat klaim faktual atau statistik palsu.
  - Di `apps/web`, gunakan `moonClient` untuk HTTP dan komponen dari `@moonwitness/ui`. Jangan membuat ulang komponen yang sudah tersedia.
  - Primitive/composite bersama yang dipakai dua layar atau lebih berada di `packages/ui/src/composites/`; periksa ekspor yang ada sebelum menambahkan komponen baru.
  - Copy antarmuka harus tersedia pada katalog `id` dan `en`. Komponen UI bersama tidak berisi copy yang ditujukan ke pengguna; teruskan teks melalui props.
  - `apps/web/src/app/globals.css` hanya mengimpor preset `@moonwitness/ui`. Token, reset browser, dan gaya `.ql-*` berada di `packages/ui/styles/**`. Hook yang mengakses data sesi/pengguna tetap di `apps/web`.
  - Ikuti MW-ADR-020 dan aturan ESLint: jangan gunakan elemen form mentah, `<style>`, anchor internal mentah, inline `style`, warna arbitrer, atau warna palet default Tailwind di layar web. Gunakan token serta kosakata `.ql-*`/`is-*` yang sudah ada.
  - Pertahankan aksesibilitas nama kontrol, label terlihat, keyboard/focus, reduced motion, kontras, layout responsif, dan state loading/error/empty yang terdampak. Setiap kontrol harus memiliki aksi nyata.
  - Tambahkan atau sesuaikan tes pada boundary yang berubah; tes komponen UI bersama harus memeriksa perilaku class override dan markup. Sinkronkan build lokal sesuai kebutuhan.
- Letakkan perilaku domain di addon/runtime yang sesuai; API hanya menjadi boundary autentikasi, validasi request, dan pemanggil service.
- Setiap perubahan addon menyertakan tes manifest/model/ACL yang relevan; eksekusi semua gate hanya melalui GitHub Actions.
- Perbarui halaman arsitektur di GitHub Wiki saat menambah addon atau mengubah batas tanggung jawab package.

## Alur kerja dan validasi

- Untuk setiap pekerjaan coding, baca [skill GitHub Issues](.github/skills/github-issues/SKILL.md) sebelum implementasi. GitHub Issues adalah sumber kanonis task; Wiki adalah sumber kanonis dokumentasi proyek. Gunakan Issue yang sesuai atau buat hanya atas permintaan eksplisit pengguna. Jangan membuat salinan status atau daftar task lokal.
- Jika pengguna secara eksplisit mendelegasikan keputusan dalam percakapan aktif, agent boleh memilih di antara opsi keputusan yang sudah dibatasi dan didukung bukti. Pilih opsi konservatif yang dapat dibalik, catat bahwa keputusan dibuat berdasarkan delegasi pengguna beserta batas dan pemicunya, lalu perbarui dokumen kanonis. Delegasi ini tidak menggantikan bukti hak/lisensi, persetujuan legal atau keamanan, pengukuran, akun/environment non-produksi, verifikasi manual, ratifikasi exact-SHA, atau gerbang rilis; jangan mengarangnya atau menandai task yang masih memerlukan bukti tersebut selesai.
- Sebelum mengedit, telusuri pemilik fitur, pola terdekat, kontrak bersama, dan tes yang sudah ada. Ubah sesedikit mungkin file untuk menyelesaikan akar masalah; jangan menyapu perubahan pengguna yang tidak terkait.
- Jaga setiap perubahan tetap terketik, dengan validasi dan error yang eksplisit. Jangan menyamarkan kegagalan memakai fallback sukses, catch luas, atau cast tipe yang tidak aman.
- Tambahkan atau sesuaikan tes pada boundary yang berubah. Untuk perubahan UI, pertahankan state loading/error/empty dan interaksi yang terdampak; untuk katalog i18n, jaga konsistensi key `id`/`en`.
- Rilis kanonik tetap mengikuti hasil verifikasi GitHub Actions untuk SHA yang tepat. Tanpa run yang cocok dan sukses di GitHub Actions, status gate rilis dilaporkan sebagai pending, bukan PASS.
- Urutan otoritatif GitHub Actions berada di `.github/workflows/ci.yml`: build, lint type-aware, typecheck, test, lalu budget web. Bedakan error lint dari warning dan jangan menyatakan workflow lulus tanpa hasil run yang diamati.
- Untuk perubahan tata kelola Issues/Wiki, verifikasi Issue, label, dan dokumentasi langsung pada sumber kanonis GitHub Issues/Wiki menggunakan skill GitHub Issues. Requirement audit gates lokal sudah dipensiunkan; jangan menambahkan kembali salinan snapshot atau script lokal sebagai sumber status.
- Pecah pekerjaan paralel hanya untuk bagian yang benar-benar independen dan file/interface yang tidak tumpang tindih. Beri tiap worker lingkup serta kriteria selesai yang jelas; satu integrator menangani kontrak bersama dan menjalankan validasi akhir.
- Alur branch: `dev` adalah branch kerja harian dan menerima `git push origin dev` langsung; jangan membuka pull request untuk memasukkan pekerjaan ke `dev` dan jangan menjadikan `dev` sebagai branch yang butuh gerbang tambahan. Branch default repo adalah `main`, tetapi `main` hanya garis rilis: masuknya lewat pull request `dev` → `main` yang dibuka workflow Release (`.github/workflows/release.yml`) dan dijaga status check `validate` dengan `enforce_admins`. Jangan mengubah default branch atau proteksi `main`/`dev` tanpa perintah eksplisit pengguna.
- Jangan commit, push, mengubah konfigurasi GitHub, atau menjalankan deployment kecuali diminta secara eksplisit.

## Kustomisasi agent

- File `AGENTS.md` ini adalah panduan proyek kanonis yang netral terhadap vendor dan berlaku untuk coding agent yang mendukung konvensi `AGENTS.md`. Tidak ada satu format instruksi yang otomatis didukung semua agent; konfigurasi integrasi khusus boleh menunjuk ke file ini.
- `.github/agents/` dan `.github/instructions/` adalah konfigurasi khusus GitHub Copilot. `.github/skills/` menyimpan workflow yang dapat digunakan ulang melalui integrasi skill yang mendukungnya. Konfigurasi provider harus merujuk ke aturan di sini, bukan menggandakan atau mengganti kebijakan proyek.
- Workflow terperinci GitHub Issues dan implementasi MoonWitness tersedia di `.github/skills/` untuk agent yang dapat memuatnya. Aturan inti untuk arsitektur, keamanan, alur perubahan, dan gate harus tetap cukup jelas di file ini.
- Saat mengubah aturan arsitektur atau quality gate, perbarui sumber kanonis dan adapter yang terdampak dalam perubahan yang sama. Hindari menyalin seluruh isi aturan ke beberapa tempat.

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
