# Changelog

Daftar rilis MoonWitness. Tiap bagian ditulis oleh workflow Release saat rilis digabung ke `main`; isinya commit yang masuk sejak tag sebelumnya.

## [Unreleased]
- Governance: GitHub Issues dan Wiki menjadi sumber kanonis; dokumentasi lokal `docs/` dan audit gate lokal dipensiunkan. Build, lint, typecheck, tes, dan budget web diverifikasi melalui GitHub Actions.

- **Packages sentralisasi**: tambah `@moonwitness/types` (packages/types) — kernel tipe lintas-domain yang dipakai bersama `ql_orm`, `@moonwitness/moonclient`, `@moonwitness/agent-runtime`, `ql_integration` (`FieldType`, `ViewType`, `Operation`, `RecordValue`/`RecordValues`, `ConnectorTokenSource`, `ConnectorVerifyStatus`, `ChatRole`); package ini type-only dan tanpa kondisi `import` di `exports`, sehingga setiap impor value gagal saat kompilasi. Nama publik lama (`QlFieldType`, `QlOperation`, `QlRecord`, `ModelFieldDto.type`, `ModelViewDto.type`, `ModelRecordDto`, `ConnectorTokenSource`, `ConnectorVerifyStatus`, `ChatMessageDto.role`) tetap sama lewat re-export shim — nol perubahan di `apps/api`, `apps/web`, atau file `__manifest__.ts`.
- **Packages sentralisasi**: tambah `@moonwitness/eslint-config` (packages/eslint-config) dengan factory `moonwitnessConfig({ tsconfigRootDir, webAppDir, apiConnectorsDir })` sebagai pemilik tunggal rule boundary (ban `@moonwitness/contracts`, ban HTTP non-moonClient, ban `child_process` di `apps/api/src/connectors/**`, dan guard batas browser baru yang melarang `apps/web/**` mengimpor `ql_*`, `@libsql/client`, `pg`, `@moonwitness/database`, `@moonwitness/agent-runtime`). Root `eslint.config.mjs` sekarang hanya komposer; `pnpm lint` tetap `eslint apps packages` sesuai `AGENTS.md`.
- **Bebas package tambahan yang ditolak**: `@moonwitness/env`, `@moonwitness/logger`, `@moonwitness/addons` registry, `packages/testing`, dan `@moonwitness/contracts` DTO — semuanya masih di bawah ambang 3-situs duplikasi atau melanggar MW-ADR-004 (moonclient = satu-satunya pemilik kontrak). Pemicu reconsiderasi dicatat di file rencana.
- **Test-harness dedup**: tambah subpath `ql_orm/testing` dengan helper `stubAddonManifest(name)` dan `withMemoryOrm(manifests, run)`; tiga duplikat di `ql_integration/models/index.test.ts`, `ql_cloudflare/services/sync-service.test.ts`, dan `ql_cloudflare/models/index.test.ts` dirapikan.
- **Graf turbo**: `packages/database/package.json` memindahkan `ql_base`, `ql_auth`, `ql_chat` dari `dependencies` ke `devDependencies` (hanya dipakai di `src/index.test.ts`), memangkas tiga tepi rebuild paksa `database → api`.
- **Preset tsconfig**: tambah `tsconfig.node.json` dan `tsconfig.addon.json` di root (memakai template `${configDir}` TypeScript 5.5+), memangkas ~10 file `packages/*/tsconfig.json` menjadi satu baris `extends` per paket. `apps/web` tetap Next-owned, `packages/ui` tetap mengoverride `jsx`+`types: ["react"]` sendiri.
- Catatan arsitektur: `GitHub Wiki (Domain Ownership and Dependencies)` dan `GitHub Wiki (Shared Kernel Specification)` menunjuk eksplisit `@moonwitness/types` sebagai shared package; `GitHub Wiki (ADR Registry)` mencatat MW-ADR-015 (type-only kernel) dan MW-ADR-016 (eslint-config package).
- **Fitur produk — CAB + Project Management (MW-ADR-017, workstream MW-0550)**: addon baru `ql_workflow` (packages/ql_workflow) dengan empat model (`workflow.project`, `workflow.task`, `workflow.change`, `workflow.transition`). State machine DRAFT→SUBMITTED→IN_REVIEW→APPROVED→PUBLISHED + CHANGES_REQUESTED/REJECTED/WITHDRAWN/SUPERSEDED diimplementasikan **verbatim** dari `spesifikasi workflow dan publishing di GitHub Wiki`; tidak ada state tambahan yang di-re-design. Bypass-lockdown ditegakkan lewat ACL `write:false, create:false` pada `workflow.change` sehingga PATCH generik `/models/workflow.change` tidak bisa mengubah `state` — satu-satunya jalur mutasi adalah endpoint `/workflow/changes/:id/transition` dengan guard "submitter cannot approve their own work" dan "no duplicate active review" (lihat kontrak workflow di GitHub Wiki). Reviewer group reuse `admin`/`operator` dari `ROLE_CATALOG` yang sudah ada; role `reviewer` baru dan `ql_ops`/`ql_publication` secara eksplisit ditunda. Moonclient dapat blok `workflow` sibling baru di `apiRoutes` (route `/workflow/queue`, `/workflow/changes/:id/transition`, `/workflow/changes/:id/transitions`) + DTO `WorkflowChangeDto`/`WorkflowTransitionDto`/`TransitionRequestDto`/`TransitionResponseDto`; scanner credential test moonclient tetap hijau. API boundary: satu fungsi `handleWorkflowRequest` mengikuti pola `handleConnectorRequest` + satu blok `if` pada dispatcher `server.ts`, `handleRequestError` tidak disentuh. Web: satu layar `/workflow` dengan `WorkspaceTemplate` + `DataTable` + `Card`; nav-link dan card di-dashboard di-gate oleh probe `moonClient.listModels()` — hapus satu baris bootstrap di `apps/api/src/index.ts` = semua permukaan (route, model, nav) hilang bareng, tanpa perlu subsystem feature-flag. PM tracker (`workflow.project`/`workflow.task`) muncul otomatis di workspace `/models` view-driven; nol kode UI baru untuk tracker.

<!-- bagian rilis -->
## v0.2.10 — 2026-11-02

- build(web): record size budget baseline for attachment and corpus-verify routes (fbe34b8)
- feat(corpus): add ayah proof/verification endpoints and QlOrm storage driver (a1c7bf8)
- feat(attachment): complete QlOrm attachment management (Fase 0-4) and fix CI lint (1a4a916)
- feat(attachment): include ql_attachment addon and HTTP endpoints in build (d987d51)
- feat(batch6): complete track 30 spatial viewport testing and finalize 30 strategic tracks (1c0382a)
- feat(batch6): complete tracks 27-29 strict typing, bundle budget, and workflow state machine matrix (63693e9)
- feat(batch5): implement tracks 16-22, 24, 25 community governance, sanad review, and telemetry (ef69870)
- chore(web): untrack generated .next-i18n-preview build output (MW-1256) (b364737)
- fix(api): type community filters and import createHash (batch4 build) (b019089)
- fix(lockfile): record tsx devDependency for types and ql_corpus (MW-1264) (697166e)
- feat(batch5): implement harbor governance, telemetry and operability (tracks 16-22, 24-25) (2226104)
- chore(conventions): enforce role-aware package script and export contracts (MW-1264) (58db03c)
- feat(batch4): implement cognitive AI and grounded reasoning engine (tracks 06-10) (9c4ec4a)

## v0.2.9 — 2026-11-02

- fix(batch3): restore deleted ql_search tests and bind audio stream segments in QuranReader (bbb96ea)

## v0.2.8 — 2026-11-02

- feat(batch3): implement tracks 03, 04, 05 knowledge graph, cryptographic proofs, and tilawah player (c242a95)

## v0.2.7 — 2026-11-02

- fix(web): satisfy floating-promise lint in UI tests (#170) (bf73099)
- feat(web): render grounded citation states (#170) (96e8c33)
- feat(chat): integrate rights-grounded generation (#169) (f19acd6)
- fix(chat): narrow citation input types (#168) (9045f25)
- feat(chat): persist grounded citations (#168) (a2e3fd0)
- fix(search): use interface in indexing test (#167) (f1bf3c9)
- feat(search): add rights-aware corpus indexing and retrieval (#167) (b764cb7)
- perf(web): lazy-load English fallback catalog (#172) (f3898d3)
- fix(web): stabilize bundle budget checks (#172) (ab8ccc5)
- fix(eslint-config): narrow nextPlugin rule types to satisfy ESLint RulesRecord (800688b)
- fix(types): correct ESLint config JSDoc types (2d051e9)
- docs: correct architecture section numbering (d36bfcf)
- docs: link ARSY research and implementation roadmap (506b9fc)
- docs: fix ARSY roadmap index formatting (1691762)
- docs: index ARSY research roadmap (f301d76)
- docs: add ARSY research synthesis and implementation roadmap (4c7e978)
- docs: finalize native ARSY acceptance criteria (fd52423)
- docs: align Headquarter with native ARSY runtime (01754f8)
- docs: remove remaining external agent dependency (274eff4)
- docs: update architecture index for ARSY (2e4e708)
- docs: make ARSY runtime fully MoonWitness-owned (319dcb1)
- docs: index System Observatory architecture (5332e69)
- docs: clarify System Observatory operational responsibilities (65feb21)
- docs: define System Observatory automation architecture (fb03300)
- fix(types): type shared ESLint configuration (15d18e8)
- fix(ci): add ESLint config typecheck project (c32fe04)
- fix(ci): remove invalid eslint-config typecheck (9baee30)
- test(addons): add focused manifest, model, and ACL tests for ql_base, ql_ai, ql_chat (MW-1265) (07849a9)
- feat(web,ui,corpus): implement Batch 1 strategic tracks (modular page, QuranText, HermeneuticReader, CommandPalette) (eab23b1)
- chore: add workspace-level package convention validator (4b6dc66)
- fix(governance): remove local-gate permission conflicting with GitHub Actions-only policy (e1fa9ae)
- fix(ci): align root build ordering with type-aware lint (c9df762)
- test(eslint-config): add effective-config tests for shared ESLint rules (a0506ae)
- fix(web): remove stale generated Next.js paths from web tsconfig (ff6be99)
- feat(web): elevate Quran Reader, Spotlight surah quick jump, and Command Deck telemetry (dc8737f)
- feat(ui,web,i18n): ecosystem visual alignment and global spotlight search (fb173fa)
- feat(web,ui,design): reconcile Home view with concept mockup v02 (be8b5c6)
- feat(web,ui,i18n): deep design alignment with design/ specifications (decc413)
- fix(agent-runtime): remove grounded test lint error (#166) (177d90d)
- feat(agent-runtime,moonclient): implement MW-1245 grounded chat contracts and agent output validation (9c91268)
- feat(chat): add grounded response validation (#166) (f2648a9)
- feat(web,i18n): reconcile design audit findings P0-P2 (ee27712)
- fix(web): resolve dashboard & community lint errors (clean imports, button composite, safe state) (0ff0145)
- feat(web,ui): complete Spatial Headquarter (6 regions) and Dock Community Harbor route (e60cc00)
- fix(web,ui): remove unused icons, state, and imports in LandingPage and TransmissionCard (b439fde)
- docs(design): record full palette documentation alignment (1e40f23)
- docs(design): align Headquarter palette with Moon UI tokens (9cbf05e)
- docs(design): reconcile Home blueprint with current implementation (f90487d)
- docs(design): index Home reconciliation audit and status (6895afd)
- docs(design): add Home implementation reconciliation audit (381e63f)
- docs(design): align palette and typography with current Moon UI tokens (d223130)
- docs(design): align palette and typography with current Moon UI tokens (44d6761)
- docs(design): align palette and typography with current Moon UI tokens (13a11c1)
- feat(web,ui): implement full 8-movement narrative sequence for A-L-L-A-H.COM Home (f60a418)

## v0.2.6 — 2026-11-02

- design: index complete design governance and art direction (6325f1e)
- feat(search): implement ql_search addon, API queries, correlation graph, and studio exporter (v0.3.0) (#155) (d4790e6)
- design: add responsive-accessibility-qa specification (4492e0a)
- design: add interaction-motion-sound specification (cb2d328)
- design: add visual-world-asset-language specification (1982b4f)
- design: add master-design-constitution specification (e40fc4e)

## v0.2.5 — 2026-11-02

- docs(design): connect Headquarter blueprint to design library (362361a)
- docs(design): define visual mockup sequence and review gates (377ff6a)
- docs(design): define A-L-L-A-H.COM Home experience blueprint (b02230f)
- docs(design): document semantic design token contract (e85c99d)
- docs(design): define visual and interaction design DNA (9cc80e9)
- docs(design): specify public and member user journeys (1b99b71)
- docs(design): define ecosystem information architecture (3644552)
- docs(design): define A-L-L-A-H.COM product vision (04fc670)
- docs(design): add design documentation index (5dc3123)

## v0.2.4 — 2026-11-02

- docs(design): add Headquarter spatial command center blueprint (80c691d)

## v0.2.3 — 2026-11-02

- feat(models): add instant search, enum select options, and public model explorer (eb25ddb)

## v0.2.2 — 2026-11-02

- chore(web): update First Load JS route baseline for new i18n catalog entries (0d42b4d)
- feat(views): auto-group model workspace by category and add declarative landing views (454a94c)

## v0.2.1 — 2026-11-02

- docs(operations): add performance targets and disaster recovery runbooks (MW-0609, MW-1109..1113) (2c38945)

## v0.1.5 — 2026-11-02

- chore: apply pending workspace changes (10aef5b)
- docs: make agent guidance vendor-neutral (887044d)
- oke (89660a1)
- oke (696077c)

## v0.1.4 — 2026-11-01

- ci: scope pull request validation to main (833b1be)

## v0.1.3 — 2026-11-01

- fix(ci): automate approval of release candidate checks (af456c6)

## v0.1.2 — 2026-11-01

- fix(ci): correct release sync script quoting (084fbba)

## v0.1.1 — 2026-11-01

- ci: restore green-gated release automation (38ca6e5)
- test: allow task tracker growth (9a745e5)
- ci: promote latest green dev through protected release (229f0ee)
- chore: declare shared eslint config workspace dependency (682b74d)
- feat: add first-use onboarding and platform updates (ce40725)
- Add canonical task tracker and local UI (ab2d3a4)
- Add MoonWitness development agent guidance (a2ac596)
- Map master prompt requirements to goals (40c04f1)
- docs: reconcile TODO governance notes with observed branch policy (8fe4713)
- docs: remove obsolete repository-selection ambiguity (c235696)
- docs: make A-L-L-A-H.COM ecosystem identity clear in README (888119d)
- docs: establish Moon UI as shared design system identity (cd657c0)
- docs: align blueprint experience roles with official ecosystem canon (8aa3bf2)
- docs: clarify product spec authority under official ecosystem canon (00f0467)
- docs: align MoonWitness vision with A-L-L-A-H official canon (b7bd155)
- docs: align master prompt with canonical repository and identity (efdd390)
- oke (5358c39)
- docs: link official A-L-L-A-H canon from README (bd0d8eb)
- docs: establish A-L-L-A-H official identity and ecosystem canon (777ca7b)
- Catat status baseline yang sebenarnya di TODO dan laporan cakupan (94b4a73)
- Namai commit child dan catat hasil gate setelah baseline benar-benar di HEAD (b6a57ca)
- Masukkan tiga dokumen docs/data dan ukur baseline dari HEAD, bukan index (85feec0)
- Masukkan baseline perencanaan ke git supaya ratifikasi bisa diikat ke SHA (8016edc)
- Tambah service Coolify untuk Stalwart dan webmail Roundcube (7e7a66c)
- Setujui otomatis run CI milik PR rilis agar rilis tak perlu klik manual (286bde5)

## v0.1.0 — 2026-11-01

- Biarkan CI menyapu semua branch, cukup tag yang dilewati (ae441be)
- Rilis versi, auto-merge dan changelog dari dev ke main (1029328)
- Bind MoonClient fetch to the global receiver (090e1ab)
- Kelola DNS Cloudflare dari MoonWitness tanpa menyimpan token layanan (7d801c3)
- Record that CI now covers the postgres dialect (0209874)
- Drop the scratch tables the postgres suites create (4cebd26)
- Cover schema evolution in both dialect suites (cc28930)
- Verify the Postgres dialect in CI (a585b94)
- Make the local compose DATABASE_URL overridable (5fbf137)
- QlOrm support for PostgreSQL driver and documentation (8864e9b)
- Run the build before the type-aware lint gate (15c7e89)
- Add password-reset email flow for a-l-l-a-h.com (6cf789a)
- Route the production domains through Traefik (8543a2d)
- Drop unused Postgres service from the Coolify stack (76fa1e0)
- Add Coolify compose stack without host port bindings (3acab11)
- Fix Docker build and compose wiring for real deploys (19086b1)
- Add Docker Compose setup with Postgres (bc32604)
- Initial commit: moonwitness-reborn workspace (e0c735e)
