# MoonWitness

MoonWitness adalah fondasi workspace AI yang dibangun bertahap: runtime TypeScript, provider model OpenAI-compatible, memori percakapan, dan sistem addon model-first. Ini tahap awal platform—bukan klaim bahwa AGI sudah tercapai.

Nama dan arah visual mengambil inspirasi umum dari narasi sci-fi kosmik dan arsitektur model-first di [repo MoonWitness](https://github.com/bjo163/moonwitness). Implementasi ini tetap berfokus pada asisten AI; domain dan fitur khusus dari repo referensi tidak diasumsikan sebagai kebutuhan produk.

## Mulai

Prasyarat: Node.js 22+ dan pnpm 10.

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Landing page publik berjalan di `http://localhost:3001`; dashboard terlindungi login berada di `/command-center`, dan API di `http://localhost:3000`. Data lokal disimpan di `data/moonwitness.db`; schema dibuat otomatis dari manifest addon saat API mulai—tidak perlu generate atau menjalankan migration.

Web menggunakan rewrite Next.js ke API. Akun memiliki sesi cookie `HttpOnly`, password di-hash dengan scrypt, dan data percakapan dibatasi per akun. `POST /chat` menerima `{ "conversationId": "...", "input": "..." }`.

### Model Gateway MoonWitness

MoonWitness menyediakan agregasi provider OpenAI-compatible sendiri melalui addon `ql_ai` dan halaman `/providers`; FreeLLMAPI tidak perlu dijalankan terpisah.

1. Buat key enkripsi lokal:

   ```dotenv
   PROVIDER_ENCRYPTION_KEY=<64-karakter-hex-dari-node-crypto>
   ```

2. Restart API, login, lalu buka **Model providers** dari sidebar.
3. Tambahkan tiap endpoint OpenAI-compatible dengan nama, base URL, model ID, serta API key milikmu. MoonWitness mengenkripsi key menggunakan AES-256-GCM sebelum menyimpannya di field privat model addon `ai.provider`.
4. Atur prioritas fallback dan status aktif di halaman yang sama. Saat chat berjalan, provider aktif dicoba sesuai urutan prioritas; kegagalan dilanjutkan ke provider berikutnya.

Base URL wajib HTTPS; HTTP hanya diizinkan untuk localhost. Jangan commit `PROVIDER_ENCRYPTION_KEY` maupun API key provider. Jika key enkripsi hilang atau berubah, credential tersimpan tidak dapat didekripsi; cadangkan secara aman. Pengguna tetap harus memiliki izin/key sendiri pada tiap provider. Free tier, kuota, rate limit, dan syarat penggunaan mengikuti provider dan tidak dilewati MoonWitness.

Untuk instalasi sederhana atau kompatibilitas sebelumnya, konfigurasi opsional `MODEL_BASE_URL`, `MODEL_API_KEY`, dan `MODEL_NAME` tetap tersedia sebagai provider fallback server-wide. Konfigurasi provider per akun lebih disarankan.

Gateway ini adalah fondasi internal untuk routing chat MoonWitness, bukan clone fitur penuh FreeLLMAPI: katalog/model discovery otomatis, pengelolaan kuota dan biaya, rate limiting, serta endpoint publik OpenAI-compatible belum termasuk. Provider dan model ditambahkan manual memakai kredensial yang memang kamu miliki.

## Struktur

```text
apps/
  api/
    src/
      auth/               Autentikasi API
      ai/                 Konfigurasi/routing provider dan secret
      http/               Boundary HTTP dan tes API
      index.ts            Bootstrap API
  web/
    src/app/              Route dan layout Next.js
    src/features/         Fitur UI, mulai dari assistant workspace
packages/
  agent-runtime/          Kontrak agen dan provider OpenAI-compatible
  moonclient/             SDK TypeScript tunggal untuk DTO, routes, dan komunikasi API
  database/               Adapter layanan domain ke QlOrm (tanpa schema sendiri)
  ql-orm/                 Registry model, ACL, CRUD, dan pemuat addon
  ql_base/                Addon inti, termasuk res.partner dan deklarasi view
  ql_auth/                Addon akun
  ql_ai/                  Addon provider model, ACL, dan deklarasi view
  ql_chat/                Addon percakapan dan pesan
  ui/                     Design system React standalone MoonWitness
```

Addon berada sebagai package di `packages/`, memakai TypeScript murni, dan didaftarkan melalui `__manifest__.ts`. Manifest mendeklarasikan model, akses, dependensi, serta view tanpa XML/CSV. Seluruh schema domain dikelola QlOrm saat startup; Drizzle dan migration files tidak digunakan. Kontrak DTO, route, dan komunikasi HTTP terpusat di `@moonwitness/moonclient`. Web memakai operasi SDK bertipe untuk semua request; API memakai definisi route/DTO yang sama. Jangan menambah transport atau request HTTP langsung di web. Aturan lint workspace dipusatkan di root [`eslint.config.mjs`](./eslint.config.mjs), memakai aturan TypeScript type-aware dan React Hooks; jalankan dengan `pnpm lint`. Konvensi agent dan pengembangan ada di [AGENTS.md](./AGENTS.md).

### UI terpusat

`@moonwitness/ui` adalah sumber komponen dan template bersama untuk aplikasi React:

- `raw/`: elemen semantik/headless untuk menyusun UI.
- `atoms/`: kontrol dasar seperti Button, Input, Textarea, dan Badge.
- `components/`: komponen tersusun seperti Card.
- `blocks/`: pola siap pakai seperti field formulir.
- `templates/`: kerangka halaman auth dan workspace.

Web mengimpor komponen dari package tersebut dan stylesheet `@moonwitness/ui/styles.css`. Fitur khusus aplikasi tetap berada di `apps/web/src/features/`; token, kontrol, dan kerangka visual dibagi dari package UI.

### Model dan view

Addon adalah sumber definisi model dan metadata view. `ql_base` mendeklarasikan view `list` dan `form` berbasis TypeScript untuk `res.partner`. Halaman `/models` mengambil metadata dari API, menyaring model/field berdasarkan ACL, lalu merender list dan form CRUD menggunakan field serta layout yang didaftarkan addon. Backend tetap menjadi penegak izin dan pemilik record; metadata UI tidak menggantikan pemeriksaan akses.

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `pnpm dev` | Jalankan API dan web dalam mode pengembangan |
| `pnpm build` | Build semua workspace |
| `pnpm test` | Jalankan seluruh pengujian |
| `pnpm typecheck` | Periksa tipe TypeScript |
| `pnpm lint` | Jalankan aturan lint ketat bersama untuk seluruh apps dan packages |

## Arah tahap awal

Prioritas berikutnya adalah menegaskan kontrak model, memori, evaluasi kualitas jawaban, observabilitas, dan batas keselamatan. Kemampuan agentic dan akses alat eksternal ditambahkan setelah evaluasi serta kontrol izin tersedia.

## Docker

```powershell
docker compose up -d --build
```

Tidak butuh `.env`: semua nilai bawaan development sudah ada di [`docker-compose.yml`](./docker-compose.yml) dan setiap port diikat ke loopback. Web melayani `http://localhost:3030`, API `http://localhost:3000` (`/health` untuk liveness). Data awet berada di volume `api_data` (file LibSQL api) dan `postgres_data`; `docker compose down -v` menghapusnya.

`QlOrm` (`packages/ql-orm`) masih memakai driver `@libsql/client`, jadi api berjalan di atas file LibSQL dan service `postgres` (16-alpine, `moonwitness:moonwitness@127.0.0.1:5434`) belum menjadi primary store. Service itu siap dipakai setelah `packages/ql-orm` pindah ke driver `pg`; sesudah itu `DATABASE_URL` api diganti `postgres://moonwitness:moonwitness@postgres:5432/moonwitness` dan `PROVIDER_ENCRYPTION_KEY` di production wajib diisi dengan kunci 32-byte acak, bukan bawaan lokal.

Untuk deploy ke Coolify dipakai [`docker-compose.coolify.yml`](./docker-compose.coolify.yml): varian tanpa published port (Traefik Coolify yang merouting lewat label ke `moonwitness-reborn.apps.mycocolink.com` dan `moonwitness-reborn-api.apps.mycocolink.com`), tanpa `networks:` agar Coolify bisa menghubungkan container ke proxy, tanpa service Postgres karena api tetap menulis ke file LibSQL di volume `api_data`, dan `PROVIDER_ENCRYPTION_KEY` diambil dari environment Coolify. Set "Docker Compose Location" resource ke `/docker-compose.coolify.yml`.
