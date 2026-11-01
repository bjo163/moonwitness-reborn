# Changelog

Daftar rilis MoonWitness. Tiap bagian ditulis oleh workflow Release saat rilis digabung ke `main`; isinya commit yang masuk sejak tag sebelumnya.

## [Unreleased]

- **Packages sentralisasi**: tambah `@moonwitness/types` (packages/types) — kernel tipe lintas-domain yang dipakai bersama `ql_orm`, `@moonwitness/moonclient`, `@moonwitness/agent-runtime`, `ql_integration` (`FieldType`, `ViewType`, `Operation`, `RecordValue`/`RecordValues`, `ConnectorTokenSource`, `ConnectorVerifyStatus`, `ChatRole`); package ini type-only dan tanpa kondisi `import` di `exports`, sehingga setiap impor value gagal saat kompilasi. Nama publik lama (`QlFieldType`, `QlOperation`, `QlRecord`, `ModelFieldDto.type`, `ModelViewDto.type`, `ModelRecordDto`, `ConnectorTokenSource`, `ConnectorVerifyStatus`, `ChatMessageDto.role`) tetap sama lewat re-export shim — nol perubahan di `apps/api`, `apps/web`, atau file `__manifest__.ts`.
- **Packages sentralisasi**: tambah `@moonwitness/eslint-config` (packages/eslint-config) dengan factory `moonwitnessConfig({ tsconfigRootDir, webAppDir, apiConnectorsDir })` sebagai pemilik tunggal rule boundary (ban `@moonwitness/contracts`, ban HTTP non-moonClient, ban `child_process` di `apps/api/src/connectors/**`, dan guard batas browser baru yang melarang `apps/web/**` mengimpor `ql_*`, `@libsql/client`, `pg`, `@moonwitness/database`, `@moonwitness/agent-runtime`). Root `eslint.config.mjs` sekarang hanya komposer; `pnpm lint` tetap `eslint apps packages` sesuai `AGENTS.md`.
- **Bebas package tambahan yang ditolak**: `@moonwitness/env`, `@moonwitness/logger`, `@moonwitness/addons` registry, `packages/testing`, dan `@moonwitness/contracts` DTO — semuanya masih di bawah ambang 3-situs duplikasi atau melanggar MW-ADR-004 (moonclient = satu-satunya pemilik kontrak). Pemicu reconsiderasi dicatat di file rencana.
- **Test-harness dedup**: tambah subpath `ql_orm/testing` dengan helper `stubAddonManifest(name)` dan `withMemoryOrm(manifests, run)`; tiga duplikat di `ql_integration/models/index.test.ts`, `ql_cloudflare/services/sync-service.test.ts`, dan `ql_cloudflare/models/index.test.ts` dirapikan.
- **Graf turbo**: `packages/database/package.json` memindahkan `ql_base`, `ql_auth`, `ql_chat` dari `dependencies` ke `devDependencies` (hanya dipakai di `src/index.test.ts`), memangkas tiga tepi rebuild paksa `database → api`.
- **Preset tsconfig**: tambah `tsconfig.node.json` dan `tsconfig.addon.json` di root (memakai template `${configDir}` TypeScript 5.5+), memangkas ~10 file `packages/*/tsconfig.json` menjadi satu baris `extends` per paket. `apps/web` tetap Next-owned, `packages/ui` tetap mengoverride `jsx`+`types: ["react"]` sendiri.
- Catatan arsitektur: `docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md` dan `docs/architecture/SHARED_KERNEL_SPECIFICATION.md:39` menunjuk eksplisit `@moonwitness/types` sebagai shared package; `docs/decisions/ADR_REGISTRY.md` mencatat MW-ADR-015 (type-only kernel) dan MW-ADR-016 (eslint-config package).
- **Fitur produk — CAB + Project Management (MW-ADR-017, workstream MW-0550)**: addon baru `ql_workflow` (packages/ql_workflow) dengan empat model (`workflow.project`, `workflow.task`, `workflow.change`, `workflow.transition`). State machine DRAFT→SUBMITTED→IN_REVIEW→APPROVED→PUBLISHED + CHANGES_REQUESTED/REJECTED/WITHDRAWN/SUPERSEDED diimplementasikan **verbatim** dari `docs/workflows/WORKFLOW_AND_PUBLISHING_SPECIFICATION.md:8-12`; tidak ada state tambahan yang di-re-design. Bypass-lockdown ditegakkan lewat ACL `write:false, create:false` pada `workflow.change` sehingga PATCH generik `/models/workflow.change` tidak bisa mengubah `state` — satu-satunya jalur mutasi adalah endpoint `/workflow/changes/:id/transition` dengan guard "submitter cannot approve their own work" dan "no duplicate active review" (lihat spec baris `:14, :29`). Reviewer group reuse `admin`/`operator` dari `ROLE_CATALOG` yang sudah ada; role `reviewer` baru dan `ql_ops`/`ql_publication` secara eksplisit ditunda. Moonclient dapat blok `workflow` sibling baru di `apiRoutes` (route `/workflow/queue`, `/workflow/changes/:id/transition`, `/workflow/changes/:id/transitions`) + DTO `WorkflowChangeDto`/`WorkflowTransitionDto`/`TransitionRequestDto`/`TransitionResponseDto`; scanner credential test moonclient tetap hijau. API boundary: satu fungsi `handleWorkflowRequest` mengikuti pola `handleConnectorRequest` + satu blok `if` pada dispatcher `server.ts`, `handleRequestError` tidak disentuh. Web: satu layar `/workflow` dengan `WorkspaceTemplate` + `DataTable` + `Card`; nav-link dan card di-dashboard di-gate oleh probe `moonClient.listModels()` — hapus satu baris bootstrap di `apps/api/src/index.ts` = semua permukaan (route, model, nav) hilang bareng, tanpa perlu subsystem feature-flag. PM tracker (`workflow.project`/`workflow.task`) muncul otomatis di workspace `/models` view-driven; nol kode UI baru untuk tracker.

<!-- bagian rilis -->
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

