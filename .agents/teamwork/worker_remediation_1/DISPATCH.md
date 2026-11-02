## 2026-11-02T11:42:01Z
You are worker_remediation_1.
Your working directory is: z:\project\moonstranaut\.agents\teamwork\worker_remediation_1
Parent conversation ID: 15ce11f1-e3a8-45f6-959a-ed89d1ed23fb

You MUST read the original request before starting:
Path to ORIGINAL_REQUEST.md: z:\project\moonstranaut\.agents\teamwork\ORIGINAL_REQUEST.md

Read the challenger and reviewer reports:
- Challenger 1 handoff: z:\project\moonstranaut\.agents\teamwork\challenger_1\handoff.md
- Challenger 2 handoff: z:\project\moonstranaut\.agents\teamwork\challenger_2\handoff.md
- Reviewer 2 handoff: z:\project\moonstranaut\.agents\teamwork\reviewer_2\handoff.md
- Reviewer 1 handoff: z:\project\moonstranaut\.agents\teamwork\reviewer_1\handoff.md
- Auditor handoff: z:\project\moonstranaut\.agents\teamwork\auditor_1\handoff.md

FILE WRITE OWNERSHIP:
You EXCLUSIVELY own:
C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md
and files in your working directory z:\project\moonstranaut\.agents\teamwork\worker_remediation_1\.
DO NOT touch any other files.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

YOUR ASSIGNMENT:
Carefully edit `C:/Users/bjo16/.gemini/antigravity/brain/77dac2f8-6fdb-4bba-8a28-c317571590ec/plan_30_grand_strategic_tracks.md` to resolve all 10 concrete issues identified by Challenger 1, Challenger 2, and Reviewer 2:

1. FIX FATAL GIT GREP SYNTAX (Section 4.1 Gate 2 & Gate 3):
   - In Gate 2 (line 7583), change `(fetch(|` to `(fetch\(|axios\.|XMLHttpRequest)`.
   - In Gate 3 (line 7598), change `(style={{|` to `(style=\{\{|#[0-9a-fA-F]{3,6})`.
   Ensure both commands execute cleanly in POSIX ERE.

2. FIX PNPM --FILTER SYNTAX (Section 7 and Section 4.2):
   - Replace directory-style filters `pnpm --filter packages/ql_*` and `pnpm --filter apps/web` with valid package-name selectors:
     - `pnpm --filter @moonwitness/ql_workflow`
     - `pnpm --filter @moonwitness/ql_chat`
     - `pnpm --filter @moonwitness/ql_base`
     - `pnpm --filter @moonwitness/web`
   - For packages without root script entries, note the explicit `node --test` command fallback (e.g. `pnpm --filter @moonwitness/ql_workflow exec node --test ...`).

3. FIX QL_ORM `selectionKeys` -> `options` TYPING:
   - In `packages/ql-orm/src/index.ts:27`, `char` fields use `options?: readonly string[]` for enum lists.
   - In Tracks 21, 22, 24, 26, and 30, replace `selectionKeys: [...]` with `options: [...]` across all model definitions.

4. RESOLVE MULTI-TENANT ISOLATION ON COLLABORATIVE & PUBLIC MODELS:
   - For `workflow.covenant_signature` (Track 16): remove `ownerField: "signer_id"`; use `signer_id: { type: "char", required: true }`. Public read is permitted for all roles, while creation is authenticated and updates/unlinks are prohibited.
   - For `community.study_circle` (Track 18): remove `ownerField: "facilitator_id"`; keep `facilitator_id` as a regular required field so all community members can discover and view public study circles.
   - For `community.circle_reflection` (Track 18): remove `ownerField: "author_id"`; keep `author_id` as a required field and document that read access allows members to view approved reflections.
   - For `community.beneficial_deed` (Track 19): remove `ownerField: "contributor_id"`; keep `contributor_id` as a required field so the Public Activity Ledger is universally readable.

5. FIX SANAD PIPELINE SERVICE QUERY SYNTAX (Track 17):
   - Update `submitPeerReviewForService` lines 4330 & 4351 from `orm.findManyByService("workflow.peer_review", { filter: { ... } })` to `orm.findManyByService("workflow.peer_review", { task_id: taskId })` matching QlOrm's exact `(modelName, filters)` signature.

6. FIX MOONCLIENT BINARY PDF STREAMING (Track 24):
   - In `MoonClient` code snippet, add `async downloadBlob(path: string, options?: RequestInit): Promise<Blob>` to handle binary PDF downloads without `JSON.parse()`.

7. FIX SECURITY & SSRF VULNERABILITY (Track 07):
   - In `ai.provider_mesh_config`, set `viewer: { read: false, write: false, create: false, unlink: false }` to deny anonymous reads.
   - Add explicit IP address validation to reject private/loopback/link-local IP addresses (e.g., `127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.0.0/16`) to eliminate SSRF risks.

8. REALIGN TABLE 1.3 DEPENDENCY MATRIX:
   - Adjust Table 1.3 upstream dependencies so Batch 1 tracks (e.g. Tracks 26 and 23) depend strictly on foundational core packages (`packages/ql_corpus`, `packages/ui`, Next.js core) rather than later Batch 4 tracks (e.g. Tracks 11, 12, 13, 14).

9. HARDEN RUNTIME EDGE CASES & FALLBACKS:
   - Track 10: Explicitly verify that `await navigator.gpu.requestAdapter()` is non-null before initializing WebGPU; fallback to WASM or server API if null.
   - Track 07: Add a 5000ms inter-chunk token timeout for streaming responses, and return a graceful fallback DTO if all providers are exhausted.
   - Track 06: Compute Levenshtein distance against the best-matching substring excerpt of the verse.
   - Track 14: Add mobile touch exit gesture (two-finger tap or persistent subtle floating touch target) for mobile devices.
   - Track 30: Document that dynamic particle animations in Track 11 are deactivated during visual regression tests via `?disable-particles=true`.

10. ENFORCE 4 UI STATES & REDUCED MOTION:
    - Ensure Section 5 across tracks explicitly incorporates the 4 UI states (`empty`, `loading`, `error`, `success`) and `@media (prefers-reduced-motion: reduce)` declarations.

Verify all changes, write a handoff report to `z:\project\moonstranaut\.agents\teamwork\worker_remediation_1\handoff.md`, and notify parent when complete.
