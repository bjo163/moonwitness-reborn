# Aturan Proyek MoonWitness

## Batas arsitektur

- Semua domain model, data, ACL, dependensi, dan deklarasi view harus menjadi addon `ql_*` di `packages/`, memakai TypeScript.
- Jangan menambahkan Drizzle, schema Drizzle, atau migration files. Semua tabel aplikasi harus didefinisikan melalui model addon `ql_*` dan disinkronkan otomatis oleh QlOrm.
- Setiap addon menyediakan `__manifest__.ts`, definisi model di `models/`, dan view di `views/`; daftarkan dependensi addon secara eksplisit di manifest dan bootstrap API.
- Gunakan prefix nama package `ql_` dan nama model berformat `domain.entity` (contoh `ai.provider`).
- Kontrak request/response, route, dan SDK komunikasi API wajib berada di `@moonwitness/moonclient`.
- Semua komunikasi HTTP dari web wajib memakai instance `moonClient`; jangan memakai `fetch`, XMLHttpRequest, atau klien transport lain di aplikasi web.
- API memakai DTO dan route bersama dari `@moonwitness/moonclient`; jangan menduplikasi path endpoint di server.
- Aturan lint workspace dipusatkan di `eslint.config.mjs` dan dijalankan dari root melalui `pnpm lint`. Perubahan harus melewati lint, typecheck, dan tes relevan.

## Data dan keamanan

- Nyatakan field, tipe, validasi panjang, kepemilikan (`ownerField`), ACL, dan view di manifest addon; jangan membuat CRUD domain paralel di API atau database package.
- Letakkan validasi domain tambahan pada model/service addon dan gunakan kembali di boundary API; API tetap memvalidasi bentuk serta batas ukuran request.
- Jalankan operasi domain melalui `QlOrm`. Akses service/internal yang membaca atau menulis field privat hanya boleh dipanggil server-side dan harus tetap membatasi record dengan pemiliknya.
- Field rahasia wajib `private`, tidak boleh masuk metadata, hasil CRUD pengguna, log, atau respons API. Enkripsi secret saat disimpan dan jangan pernah mengirim key provider ke browser setelah diterima.
- Terapkan ACL deny-by-default dan isolasi record per pemilik. Tambahkan tes untuk akses silang pengguna, field privat, dan jalur service internal.

## UI dan perubahan

- UI model/view-driven memakai metadata addon dan komponen dari `@moonwitness/ui`; jangan menduplikasi komponen design system di aplikasi.
- Letakkan perilaku domain di addon/runtime yang sesuai; API hanya menjadi boundary autentikasi, validasi request, dan pemanggil service.
- Setiap perubahan addon menyertakan tes manifest/model/ACL dan dites dengan `pnpm build`, `pnpm typecheck`, serta tes workspace yang relevan.
- Perbarui dokumentasi arsitektur saat menambah addon atau mengubah batas tanggung jawab package.

## Alur kerja dan validasi

- Sebelum mengedit, telusuri pemilik fitur, pola terdekat, kontrak bersama, dan tes yang sudah ada. Ubah sesedikit mungkin file untuk menyelesaikan akar masalah; jangan menyapu perubahan pengguna yang tidak terkait.
- Jaga setiap perubahan tetap terketik, dengan validasi dan error yang eksplisit. Jangan menyamarkan kegagalan memakai fallback sukses, catch luas, atau cast tipe yang tidak aman.
- Tambahkan atau sesuaikan tes pada boundary yang berubah. Untuk perubahan UI, periksa loading, error, empty, dan interaksi yang terdampak; untuk katalog i18n, jaga konsistensi key `id`/`en`.
- Jalankan tes/build yang terarah saat iterasi. Sebelum menyatakan pekerjaan selesai, jalankan quality gate yang relevan dan laporkan perintah serta hasilnya; bedakan error lint dari warning.
- Lint menggunakan TypeScript type-aware. Pada checkout bersih atau setelah perubahan dependency/package, ikuti urutan CI: `pnpm exec turbo run build` → `pnpm lint` → `pnpm typecheck` → `pnpm test`. `pnpm build` sendiri menjalankan lint sebelum build, jadi bukan pengganti urutan tersebut pada checkout tanpa output build.
- Untuk perubahan tracker, jalankan `pnpm tracker:check` dan `pnpm tracker:test`. Edit `docs/governance/task-tracker.json` sebagai sumber kanonis, lalu hasilkan `TODO.md` melalui `pnpm tracker:render`.
- Pecah pekerjaan paralel hanya untuk bagian yang benar-benar independen dan file/interface yang tidak tumpang tindih. Beri tiap worker lingkup serta kriteria selesai yang jelas; satu integrator menangani kontrak bersama dan menjalankan validasi akhir.
- Jangan commit, push, mengubah konfigurasi GitHub, atau menjalankan deployment kecuali diminta secara eksplisit.

## Kustomisasi agent

- Instruksi ini adalah aturan proyek yang selalu berlaku. Prosedur implementasi terperinci ada di `.github/skills/moonwitness-development/SKILL.md`; agent khusus ada di `.github/agents/`.
- Saat mengubah aturan arsitektur atau quality gate, perbarui instruksi, skill, dan/atau agent yang terdampak dalam perubahan yang sama. Hindari menyalin seluruh isi aturan ke beberapa tempat; tautkan ke sumber kanonis.
