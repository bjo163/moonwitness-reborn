# Penuntasan Centralisasi UI ke `@moonwitness/ui` (MW-0570)

## Ringkasan

Fondasi MW-0571–MW-0575 sudah ada di disk (belum di-commit): CSS terpecah ke `packages/ui/styles/{tokens,base,components,preset}.css`, `globals.css` sudah satu baris `@import "@moonwitness/ui/preset.css"`, dan 7 composite sudah di-export.

Temuan yang mengubah rencana (hasil verifikasi kode, bukan label tracker):

| Fakta | Bukti |
|---|---|
| **Nol** layar memakai 7 composite (`NavLink`, `SidebarBrand`, `SidebarFooter`, `PageHeader`, `LoadingScreen`, `EmptyState`, `SectionGrid`) | scan impor `@moonwitness/ui`: yang diimpor hanya `Alert/Badge/Button/Card/DataTable/FormField/Input/Select/Textarea/Checkbox/CenteredAuth/WorkspaceTemplate/cn` |
| Markup di-backing composite tetap ditulis manual | `ql-nav-link` 39×, `ql-hud-brand` 8×, `ql-eyebrow` 7×, `<main className="ql-hud-app flex min-h-dvh …">` 13×, `<h1 …text-3xl…>` 8×, icon tile 17×, metric row 11×, `grid gap-4 md:grid-cols-2` 4× |
| 96 kelas hex + 258 kelas `stone-*` masih hidup | `apps/web/src/features/**` |
| 3 layar light-theme di shell gelap | `translation-admin-page.tsx`, `user-admin-page.tsx`, `provider-workspace.tsx` (`bg-white`, `text-stone-950`, `border-stone-200`) |
| MW-0574 claim "7 tests green" | **nol** file test di `packages/ui`; tidak ada script `test` |
| MW-0575 claim size-limit done | `apps/web/.size-limit.json` tidak ada, tidak ada step CI |
| `components.css` menggantung ke markup aplikasi | `.ql-hud-sidebar [aria-label="Riwayat chat"] > div > button:first-child`, override `.text-stone-*`, `.bg-emerald-500`, `!important` di `.ql-hud-auth-card`; `.ql-model-*` dipakai lintas layar (`dns-workspace.tsx:733` memakai `ql-model-editor`) |
| Tracker "13 sub-screens" | ada layar ke-14: `features/research/research-review-page.tsx` |
| Lint tidak menutup landing/layout | blok UI di `packages/eslint-config/index.js` hanya `files: apps/web/src/features/**/*.tsx`, padahal `app/page.tsx` menyimpan 23 hex + 27 `stone-*` |

Keputusan owner: (1) 3 layar light dikonversi ke dark HUD, (2) cakupan penuh MW-0576 → 0578, (3) MW-0574 & MW-0575 di-reopen dan bukti dikerjakan sungguhan.

---

## A. Task tracker dulu (wajib, per `.github/skills/task-tracker/SKILL.md`)

1. `pnpm tracker:check` — pastikan sumber kanonis dan view cocok sebelum edit.
2. Edit `docs/governance/task-tracker.json`:
   - Reopen **MW-0574** dan **MW-0575** → `state: "in_progress"`, `status_label` jujur: "Reopened — no test files existed under `packages/ui`" / "Reopened — `.size-limit.json`/CI step never landed".
   - Tambah task baru (ID belum dipakai; verifikasi dengan grep `MW-05` di JSON):
     - **MW-0579** — Lengkapi design token (ink/border/shadow/void) + `@source` Tailwind; kriteria: tidak ada kelas `stone-*`/`bg-white`/hex-arbitrary yang tersisa di `apps/web/src/**/*.tsx`, dan utilitas yang hanya dipakai di `packages/ui` terbukti ter-emit di CSS build.
     - **MW-0580** — Ship composite `SidebarNav`, `IconTile`, `MetricRow`, `SidePanel` + test render; dependensi MW-0579.
     - **MW-0581** — Konversi 3 layar light-theme ke dark HUD; dependensi MW-0579, MW-0580.
     - **MW-0582** — Ukur & kunci bundle budget per route dengan skrip lokal; revisi teks MW-ADR-020; dependensi MW-0575.
   - Perbaiki **MW-0576**: ganti judul jadi "(14 sub-screens)", `status_label` jadi "Partial — 0 of 14 screens consume any composite; atoms/blocks/templates adopted".
3. Tambah marker + table row untuk tiap task baru di `docs/governance/TODO.template.md` (header sama dengan task `Developer tooling — UI centralisation`: `ID | Subject | Status | Owner | Acceptance Criterion`).
4. `pnpm tracker:render` lalu `pnpm tracker:check` dan `pnpm tracker:test`.

Tidak ada commit/push pada fase ini atau fase lain tanpa diminta eksplisit (AGENTS.md).

## B. Token & CSS layer (`packages/ui/styles/`)

5. `packages/ui/styles/tokens.css` — tambah di dalam blok `@theme` yang sudah ada (nilai dipilih agar tampilan tidak bergeser):
   - `--color-ink-soft: #c6cfc0;` (pengganti `text-stone-200`/`-300`)
   - `--color-muted-dim: #7c8679;` (pengganti `text-stone-600`)
   - `--color-hairline-soft: #2a342a;` (pengganti `divide-[#354135]`/`border-stone-200` tipis)
   - `--color-void: #050706;`
   - `--shadow-hud: 6px 6px 0 var(--color-void);` dan `--shadow-hud-sm: 4px 4px 0 var(--color-void);` → utilitas `shadow-hud`, `shadow-hud-sm` menggantikan `shadow-[4px_4px_0_#050706]`
   - **Jangan** menyentuh blok `:root { --ql-ui-* }` yang sudah ada (invariant MW-0572).
6. `packages/ui/styles/preset.css` — taruh `@source "../src";` tepat setelah `@import "tailwindcss";` supaya kelas yang hanya hidup di `packages/ui` tidak ter-purge saat scan lewat symlink `apps/web/node_modules`.
7. Verifikasi (kriteria MW-0579): `pnpm --filter @moonwitness/web build`, lalu grep `apps/web/.next/static/css/*.css` untuk satu utilitas yang hanya dipakai di package (mis. `.text-acid-dark` dari `PageHeader`, `.border-hairline` dari `EmptyState`) dan pastikan muncul.

## C. Purge CSS yang menggantung ke markup aplikasi (`packages/ui/styles/components.css`)

Pakai pola **grouped selector** supaya tidak ada `.ql-*` yang di-rename secara paksa (invariant MW-0572): tambah nama generik di rule yang sama, migrasikan layar, baru hapus nama lama di langkah terakhir satu task.

8. Tambah/generikkan:
   - `.ql-model-editor, .ql-side-panel { … }` dan `.ql-model-editor__header, .ql-side-panel__header`, `.ql-model-editor__form, .ql-side-panel__form` (dipakai `model-workspace.tsx` dan `dns-workspace.tsx:733`).
   - `.ql-model-workspace, .ql-page-body { … }`; `.ql-model-heading, .ql-page-heading`; `.ql-model-table-content, .ql-card--flush`; `.ql-model-checkbox, .ql-inline-label`.
   - Rule baru `.ql-icon-tile` (base `flex items-center justify-center border border-hairline bg-panel-edge text-acid` via token, varian `.ql-icon-tile--sm|md|lg` untuk `size-8/10/14`), `.ql-sidebar-nav` (flex-col `gap-1`, `flex-1 overflow-y-auto`), `.ql-metric-row` (baseline, `justify-between`, `gap-3`, `py-4`, `.ql-metric-row--divided` untuk `border-b border-hairline sm:border-b-0`).
   - Ganti **semua** nilai hex literal di file ini (`#354135`, `#121a13`, `#151d15`, `#293320`, `#738d32`, `#0c110e`, `#747d72`, `#dce5d6`, `#d6d3d1`, dst.) dengan `var(--color-*)` / `var(--ql-ui-*)` yang sesuai.
9. Hapus aturan yangcouple ke markup app setelah layarnya dimigrasi (langkah D): seluruh `.ql-hud-sidebar .text-stone-*`, `.ql-hud-thread .text-stone-*`, `.ql-hud-composer .text-stone-400`, `.ql-hud-auth-card input*`/`.text-stone-500`, `.ql-hud-status .bg-emerald-500`, `.ql-hud-brand { color: …!important }`, `.ql-hud-status { …!important }`, `.ql-hud-auth-card { …!important }`, dan seluruh selector `[aria-label="Riwayat chat"]`. Status assistant pindah ke `Badge variant="live"` (sudah punya glow via token).
10. `packages/ui/styles.css` tetap aggregator 3-`@import` (back-compat) — tidak diubah.

## D. Composite baru di `packages/ui/src/composites/` (MW-0580)

Ikuti pola file yang sudah ada: tanpa `"use client"` (kriteria MW-0574), `cn()` dari `../lib/utils.js`, prop `className?`, cva untuk varian (lihat `atoms/button.tsx`), JSDoc singkat yang menyebut pola lama yang diganti.

11. `icon-tile.tsx` — `IconTile({ children, size = "md", tone = "accent", className })`; `tone`: `accent` (hairline+panel-edge+acid) | `plain` (hairline+panel). Menggantikan 13 salinan hex `flex size-8 … border-[#354135] bg-[#121a13] text-[#d7ff63]` dan 4 salinan `bg-stone-900 text-white`.
12. `sidebar-nav.tsx` — `SidebarNav({ label, items, className })` dengan `items: ReadonlyArray<SidebarNavItem>` (`href`, `label`, `icon?: ReactNode`, `active?: boolean`, `onSelect?()`), plus `NavSectionLabel({ children })` yang membungkus `.ql-nav-section` yang selama ini tidak punya komponen. Menyerap 39 pemakaian manual `ql-nav-link` + varian `mt-2`/`mt-4`/`space-y-1`/`overflow-y-auto` di 7 sidebar.
13. `metric-row.tsx` — `MetricRow({ label, value, hint?, divided? })` dan `MetricList({ children, className })`; menggantikan 11 salinan baris baseline.
14. `side-panel.tsx` — `SidePanel({ title, closeLabel, onClose, children, footer?, className })` memakai `.ql-side-panel*`; memuat tombol tutup sebagai `<Button variant="ghost" size="icon">` (jangan `<button>` telanjang) dan `role="dialog"` + `aria-modal="false"`? — gunakan `<section aria-label={title}>` saja, konsisten dengan `dns-workspace.tsx:733` saat ini.
15. `packages/ui/src/index.ts` — export semua komponen baru + tipenya, ditata mengikuti gaya file yang ada. Tambah helper builder kelas murni (`navLinkClass`, `sidebarBrandClass`, `iconTileClass`) bila dibutuhkan untuk test (lihat §F).

## E. Migrasi 14 layar (MW-0576 + MW-0581)

Urutan dari risiko terendah. **Per layar = satu commit-sized increment**: (a) ganti markup dengan composite, (b) ganti hex/`stone-*`/`bg-white` dengan token, (c) lint file tersebut bersih 0 warning, (d) `pnpm --filter @moonwitness/web build` hijau, (e) smoke check visual di browser pada route-nya (loading / error / empty / interaksi sidebar-mobile). Jangan menyentuh DTO, route, ACL, atau `moonClient`; `pnpm test` harus tidak berubah hasilnya.

16. `app/layout.tsx`, `app/page.tsx` — `SidebarBrand`/`IconTile` untuk brand tile L87, `MetricRow` untuk L278/286/294, token untuk 23 hex + 27 `stone-*`. Layar ini sekarang **tidak** terjaring lint → diperbaiki di §G.
17. `features/locale/locale-switcher.tsx`, `features/locale/translation-catalog.tsx` — `translation-catalog.tsx:174` `<button className="…underline…">` → `<Button variant="ghost" size="sm">`.
18. `features/auth/auth-page.tsx` — `<main …text-stone-500>` L158 → `LoadingScreen`; icon tile L191 → `IconTile`; `CenteredAuth` sudah dipakai, pertahankan.
19. `features/corpus/corpus-shelf.tsx` — 2× `LoadingScreen` (L130/138), `SidebarBrand`+`IconTile` (L170), `SidebarNav`, `PageHeader` (L253), `SectionGrid` (L294), `EmptyState` untuk "No published editions yet". **Kunci regressi MW-ADR-019:** `dir="rtl" lang="ar"` pada edisi Arab `/corpus` tidak boleh berubah; cek `quran-reader.tsx` juga.
20. `features/corpus/quran-reader.tsx` — `bg-[#0b110b]` → `bg-panel-deep`, `text-stone-200` → `text-ink-soft`, heading → `PageHeader`.
21. `features/workflow/review-queue.tsx` — `LoadingScreen` (L254/265), `IconTile` (L292), `SidebarNav`, `PageHeader` (L385), token untuk `border-[#354135]`/`divide-[#354135]` (L334/384/506).
22. `features/dashboard/dashboard-page.tsx` — 7 baris `<Link className="ql-nav-link">` (L196+) → `SidebarNav`; brand row L176-195 → `SidebarBrand` + tombol tutup; footer `mt-4 … border-t border-[#354135]` L276 → `SidebarFooter`; `LoadingScreen` L144; `MetricRow` L592-608; `IconTile` L173/181; 38 hex + 46 `stone-*` → token (mis. `focus-visible:outline-[#d7ff63]` → `focus-visible:outline-acid`, `group-hover:text-[#d7ff63]` → `group-hover:text-acid`).
23. `features/assistant/assistant-page.tsx` — `SidebarNav` untuk daftar riwayat (L300, `aria-label={copy.assistant.history}`), hapus 2× `LoadingScreen` inline (L218/226), `IconTile` L401/419 (ukuran `lg`), status dot → `Badge variant="live"`. Setelah ini selector `[aria-label="Riwayat chat"]` di §C langkah 9 boleh dihapus.
24. `features/models/model-workspace.tsx` — `<a href="/command-center" className="ql-hud-brand …">` L346 → `SidebarBrand` (sekaligus menghilangkan 1 pelanggaran `<a>` internal), panel editor → `SidePanel`, `PageHeader` untuk heading L322, `Box`/`Boxes className="text-[#d7ff63]"` L323/347 → `IconTile`.
25. `features/connectors/connector-workspace.tsx`, `features/connectors/dns-workspace.tsx` — `LoadingScreen`, `SidebarNav` (zone list `dns` L468), `SidebarBrand`/`SidebarFooter`, `SidePanel` (`dns-workspace.tsx:733`), `PageHeader`, token untuk 8 hex sisanya.
26. **MW-0581 — konversi light→dark**: `features/providers/provider-workspace.tsx` (L191 `text-stone-950` → `text-ink`; L202/207/228 `bg-white`/`border-stone-200` → `Card` + `bg-panel`/`border-hairline`; L208 `bg-stone-100 text-stone-700` → `IconTile`), `features/admin/user-admin-page.tsx` (L261 `<select className="… bg-white …">` → `Select` dari ui; L320 `bg-white … shadow-sm` → `Card`), `features/admin/translation-admin-page.tsx` (L285/305/372 `text-stone-950` → `text-ink`; L484 `hover:bg-stone-50` → `hover:bg-panel-raised`; L541 `bg-stone-100` → `bg-panel-edge`; daftar entri L477 `<button>` → `Button variant="ghost"` + `aria-current`). Ganti heading+description yang di-hand-roll (L370, L227, L191) dengan `PageHeader`. Ini **perubahan visual yang disengaja dan sudah di-approve owner**: catat before/after screenshot tiap route di bukti task.
27. `features/research/research-review-page.tsx` — sudah pakai atoms; adopsi `SidebarNav`/`PageHeader`/`EmptyState`/`SectionGrid` + token. Layar ini ditambahkan ke daftar sub-screen MW-0576 (langkah A.3).
28. `DataTable` (`packages/ui/src/components/data-table.tsx`) menelan copy Indonesian sebagai default (`"Belum ada data."`, `"Aksi"`, `"Ya"`, `"Tidak"`). Jadikan `emptyMessage`, `actionsLabel`, `yesLabel`, `noLabel` **required** di `DataTableProps`, dan setiap call site (`dns-workspace`, `user-admin-page`, `corpus-shelf`, `model-workspace`, `research-review-page`, `review-queue`) mengirim `t("web.common.*")` / `copy.common.*` yang sudah ada di `messages.ts` (`actions`, `yes`, `no`). `tsc` akan menemukan semua call site yang kurang argumen — jangan pakai cast.

## F. Test `packages/ui` (bukti MW-0574)

29. `packages/ui/package.json`: tambah `"test": "tsx --test tests/composites.test.tsx tests/molecules.test.tsx tests/tokens.test.tsx"`, `"sizecheck"` tidak diperlukan; devDependencies `react: catalog:`, `react-dom: catalog:`, `tsx: catalog:`, `@types/react-dom: catalog:`.
30. Test render lewat `node:test` + `react-dom/server` (`renderToStaticMarkup`) — konvensi repo (`tsx --test`). Untuk `NavLink` dan `SidebarBrand` (mereka impor `next/link`): coba `renderToStaticMarkup` lebih dulu; kalau gagal di luar runtime Next (klien reference), **fallback yang diputuskan**: ekspor builder kelas murni `navLinkClass()` / `sidebarBrandClass()` dari package dan unit-test builder itu (asserti `ql-nav-link` tetap ada saat `className` di-override, `is-active` + `aria-current="page"` saat `active`), sementara composite non-Next tetap diuji via render.
31. Assert per composite: kelas dasar `ql-*` bertahan saat `className` di-override, tidak ada `#hex` di output, dan `SidebarNav` me-render `aria-label` serta `is-active` yang benar. `tests/tokens.test.tsx` mengunci bahwa tiap `--color-*`/`--shadow-*` yang dipakai komponen ada di `tokens.css` (baca file CSS dari test dan cocokkan nama token).
32. `packages/ui/tsconfig.json`: jangan biarkan test masuk keluaran build — taruh test di `packages/ui/tests/` (di luar `rootDir: "src"`), dan tambah `packages/ui/tsconfig.test.json` (`extends: "../../tsconfig.base.json"`, include tests, `types: ["react","react-dom","node"]`); ubah `"typecheck"` menjadi `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json`.

## G. Lint: perluas scope lalu flip (MW-0577)

33. `packages/eslint-config/index.js`:
    - Ganti `files` blok UI dari `` `${webAppDir}/src/features/**/*.tsx` `` menjadi `` `${webAppDir}/src/**/*.tsx` `` supaya `app/page.tsx` dan `app/layout.tsx` ikut terjaring.
    - Tambah `uiDefaultPaletteBan`: `JSXAttribute[name.name="className"] Literal[value=/(?:bg|text|border|divide|ring|outline|from|to|placeholder|fill|stroke|accent)-(?:stone|zinc|neutral|gray|slate|white|black|emerald|teal|green|amber|yellow|blue|sky|indigo|violet|purple|pink|rose)/]` dengan pesan "Use the design tokens from @moonwitness/ui (MW-ADR-020)". Tanpa kurung siku/kwantifier `{n,m}` di dalam regex — ikuti catatan di komentar `uiArbitraryHexBan` yang sudah ada, karena esquery menolaknya.
    - Masukkan ke array `no-restricted-syntax` yang sama (tetap `warn` sampai langkah 36).
    - `uiArbitraryHexColorBan` saat ini dideklarasikan & di-export tapi tidak dipakai di mana pun — cek `Grep` referensi, lalu hapus deklarasi + entry `sharedRuleFragments` bila memang tak terpakai.
34. Sinkronkan pesan `UI_PRIMITIVE_BAN_MESSAGE` dengan daftar komponen final (tambah `SidebarNav`, `IconTile`, `MetricRow`, `SidePanel`).
35. Perbaiki `apps/web/tsconfig.json`: entri include `".next-i18n-preview/types/**/*.ts"` (baris 38) dan folder tak-ter-track `apps/web/.next-i18n-preview/` adalah artefak eksperimen dev; jangan hapus include, tapi tambahkan `apps/web/.next-i18n-preview/` ke `.gitignore` supaya tidak terbawa sebagai perubahan pengguna.
36. Setelah `pnpm lint` melapor **0 warning** di `apps/web/src/**` (precondition yang sudah ditulis di MW-0577), flip `warn` → `error` untuk seluruh rule yang ditambahkan MW-0575 dalam satu commit.

## H. Bundle budget (bukti MW-0575, via MW-0582)

37. **Keputusan teknis:** `size-limit` tidak dipakai, karena tidak bisa menghitung "First Load JS per route" untuk Next App Router (ia mengukur glob file, bukan `initial` chunks per rute) dan menambah dependensi registry baru. Sebagai gantinya skrip nol-dependensi `apps/web/scripts/check-bundle-budget.mjs`:
    - baca `apps/web/.size-budget.json`: `{ "maxFirstLoadKb": 150, "maxRouteDeltaKb": 2, "routes": { "<route>": <kB> } }`;
    - parse `apps/web/.next/app-build-manifest.json`, resolve daftar `initial` per rute ke `apps/web/.next/static/**`, hitung ukuran **gzip** via `node:zlib`;
    - exit non-zero bila rute mana pun > 150 kB atau naiknya > 2 kB dari baseline; dengan flag `--update` tulis baseline baru.
38. `apps/web/package.json` tambah `"size": "node scripts/check-bundle-budget.mjs"`; `.github/workflows/ci.yml` tambah step `- run: pnpm --filter @moonwitness/web size` **setelah** `pnpm test` (pola langkah lain di file itu: `uses`/`run` + `-`), dan pastikan `next build` sudah menghasilkan `.next/app-build-manifest.json` sebelum step itu.
39. Jalankan sekali, simpan baseline awal, lalu catat revisi di `docs/decisions/ADR_REGISTRY.md` MW-ADR-020: ganti kalimat "`pnpm --filter @moonwitness/web size` (via `size-limit`)" menjadi nama skrip budget per-route, dengan alasan di atas. Task MW-0575 di-reopen (langkah A) dan ditutup lewat MW-0582.

## I. Dokumentasi (MW-0578)

40. `packages/ui/README.md` — perbaiki contoh impor dari `styles.css` ke `@import "@moonwitness/ui/preset.css";` (file itu sekarang masih mendokumentasikan cara lama), dokumentasikan layer `raw/atoms/blocks/components/composites/templates` **beserta** komponen baru beserta contoh usage, tabel token, dan prosedur "menambah token baru".
41. `.github/skills/moonwitness-development/SKILL.md` — tambah seksi "UI Consistency Rules" yang menunjuk MW-ADR-020: daftar pola yang dilarang (hex arbitrary, `stone-*`/palette default, `<button>/<input>/<select>/<textarea>` telanjang, `<a href="/…">`, `style={}`), di mana komponen baru harus ditaruh, dan cara menjalankan gate.
42. `AGENTS.md` §UI dan perubahan — perluas daftar komponen wajib dengan composite baru + larangan palette default, supaya teks aturan dan isi package tidak bercabang (jaga satu sumber kanonis: rujuk MW-ADR-020, jangan salin seluruh aturan).
43. `docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md` — perbarui row `@moonwitness/ui` bila permukaan export berubah.

## J. Quality gate & bukti

44. Urutan wajib dari checkout ini (AGENTS.md): `pnpm exec turbo run build` → `pnpm lint` → `pnpm typecheck` → `pnpm test`, lalu `pnpm --filter @moonwitness/web build`, `pnpm --filter @moonwitness/web size`, `pnpm tracker:render` → `pnpm tracker:check` → `pnpm tracker:test`. Bedakan error vs warning saat melapor hasil.
45. Smoke visual tiap dari 14 route (`/`, `/auth`, `/command-center`, `/command-center/chat`, `/models`, `/providers`, `/connectors`, `/connectors/:id/dns`, `/corpus`, `/corpus/:editionKey/:surah`, `/workflow`, `/admin/users`, `/admin/translations`) dalam kondisi loading / error / empty / drawer-mobile, khususnya 3 layar hasil konversi light→dark.
46. Tutup task: MW-0574, MW-0575, MW-0579, MW-0580, MW-0581, MW-0576, MW-0577, MW-0582, MW-0578 dengan bukti di `status_label`; `pnpm tracker:render`. Sebut ID task + state + bukti + blocker di laporan akhir, dan nyatakan bahwa Done bukan klaim rilis.

## Urutan kerja & dependensi

B(5-7) → C(8-10, sebagian ditunda sampai E) → D(11-15) → E(16-28) → F(29-32) → G(33-36) → H(37-39) → I(40-43) → J(44-46). Langkah A berjalan paling dulu dan diulang sebelum melapor selesai. C.9 bergantung pada E.23/E.26 (jangan hapus override sebelum layarnya pindah). MW-0577 (G.36) tidak boleh didahului migrasi layar mana pun yang masih meninggalkan warning.

## Risk & mitigation

- **Utilitas Tailwind dari `packages/ui` ter-purge** → `@source "../src"` (B.6) + asserti CSS hasil build (B.7), bukan asumsi.
- **Menghapus `.ql-*` lama memecahkan layar yang belum dimigrasi** → grouped selector + hapus nama lama hanya setelah tidak ada referensi (`Grep` `ql-model-` di `apps/web/src` harus kosong).
- **Perubahan visual light→dark salah interpretasinya** → sudah di-approve owner; tangkap before/after tiap route, dan jangan ubah struktur data/label.
- **`renderToStaticMarkup` gagal untuk `next/link`** → fallback builder kelas murni yang diekspor (F.30), tanpa menambah mock framework.
- **Flip `warn`→`error` bikin CI merah** → flip hanya setelah `pnpm lint` 0 warning di `apps/web/src/**`; perluasan glob `src/**/*.tsx` dilakukan **sebelum** migrasi landing (`app/page.tsx`) selesai.
- **Regresi i18n** → label baru wajib masuk `en.po` **dan** `id.po` + `messages.ts` interface; `DataTable` required-labels memaksa parity lewat `tsc`.
- **Kunci invariant MW-ADR-019 (RTL Arab)** → asserti `dir="rtl" lang="ar"` pada `/corpus` saat smoke check.
- **Session berjalan lain meng-commit setengah jadi** (kolom riwayat proyek) → jangan `git stash`/`checkout`; kerja di atas working tree yang ada, dan verifikasi `git diff --stat` per langkah.

## Alternatif yang ditolak

- **`size-limit`** sesuai teks MW-ADR-0575: ditolak (tidak bisa menghitung First Load JS per rute App Router, menambah dependensi registry); diganti skrip Node lokal dengan kriteria yang direvisi secara terbuka.
- **`tailwindcss/no-arbitrary-value`** (opsi pertama di MW-ADR-020): ditolak — akan ikut menolak `tracking-[-0.04em]` dan arbitrary non-warna yang sah, serta menambah plugin; selector regex `Literal` sudah menutup kasus warna.
- **Varian "paper/light" resmi di `packages/ui`** untuk 3 layar admin: ditolak oleh owner — dua sistem visual dalam satu app justru sumber inkonsistensi.
- **Subpath export per-komponen (`@moonwitness/ui/button`)** untuk tree-shaking: ditolak untuk saat ini — `transpilePackages` + barrel ESM sudah tree-shake, dan 7 screens import barrel; dievaluasi ulang hanya jika langkah H menandai pertumbuhan.
- **Rename `.ql-*` langsung** (mis. `.ql-model-editor` → `.ql-side-panel` saja): ditolak — melanggar invariant "no `.ql-*` rule renamed" dari MW-0572; grouped selector mencapai hasil sama tanpa breaking.
- **`"use client"` di composite**: ditolak — melanggar kriteria MW-0574; state sidebar tetap di layar (`WorkspaceTemplate` sudah menerima `sidebarOpen`/`onCloseSidebar`).
- **Memindah CSS per-layar ke `apps/web` agar cepat selesai**: ditolak — dilarang eksplisit oleh AGENTS.md (hanya satu baris `@import` di `globals.css`).
- **Membiarkan copy Indonesia ter-hardcode di `DataTable`**: ditolak — package desain tidak boleh memiliki copy; jadikan props required.