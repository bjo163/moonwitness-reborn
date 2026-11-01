# Changelog

Daftar rilis MoonWitness. Tiap bagian ditulis oleh workflow Release saat rilis digabung ke `main`; isinya commit yang masuk sejak tag sebelumnya.

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

