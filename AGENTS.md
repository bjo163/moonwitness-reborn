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
