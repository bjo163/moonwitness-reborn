# GitHub Governance and Automation

**Status: historical snapshot and recommendation — overtaken in part by another session while this audit ran.** The owner has ratified the target repository. Nothing was changed by this audit: no issue, project, rule or branch was touched here. Between 08:30Z and 09:00Z a parallel session merged two pull requests, published tag and release `v0.1.0`, and enabled classic protection on `main`; the section §Re-observed at 2026-11-01T09:00Z records what the repository said at that time. The D30 requirement catalog and this document's later snapshots, not the retired source, are current references.

## Verified `moonwitnessxv` snapshot

- Account `bjo163` had admin permission.
- Active ruleset `dev-integration-protection` targets `dev`, prevents deletion and non-fast-forward updates.
- Active ruleset `main-release-protection` targets `main`, prevents deletion/non-fast-forward updates and requires status check `Monorepo Verification & Safety Gates`.
- Classic branch protection endpoint returned “Branch not protected”; the active rulesets above govern the inspected branches.
- `main` and `dev` were both at `1b5c1b717b68db8ca7c06fa3dc5cc392edc9257d`; one open issue and no open PRs were observed; latest CI run at that SHA succeeded, with older failed runs.

## Verified current workspace repository: `moonwitness-reborn`

- Public repo; branch `main` at `3acab11b2a6dd8291dc971869f45511fc078b82b`; local checkout equals `origin/main`; account has admin permission.
- Zero active rulesets; classic branch-protection endpoint returns 404. `main` is not protected.
- Current Actions run `41271986513` on `3acab11b2a6dd8291dc971869f45511fc078b82b` fails at `pnpm lint`; typecheck/test/build are skipped. Previous runs `41271676701` on `19086b1…` and `41269601156` on `bc32604…` also failed lint; the latter reported 720 type-aware/type-resolution errors. Local `lint`, `typecheck`, `test` and `build` passed at the prior `bc32604…` SHA with generated outputs available; they were not rerun on current HEAD.
- GitHub returned zero open issues, zero releases, zero tags, zero deployments and zero configured environments at the audit snapshot. No project-board inventory is claimed.
- Commits `19086b1` and `3acab11` update root Compose and API/web Dockerfiles and add a tracked Coolify Compose stack. Both Compose files start Postgres while API uses a LibSQL file. Root Compose retains an all-zero provider-key fallback labelled for local development; Coolify Compose defaults the key to empty. No deployment is verified by GitHub records.

## Re-observed at 2026-11-01T09:00Z (after another session's release work)

- `main` is at `4fdb7c77795648e47935aa7642b4cbe27f55f103` ("Merge pull request #2 from bjo163/release/v0.1.0").
- **Branch protection was active on `main`** through the classic endpoint at this snapshot: required status checks `strict: true` with context `validate`, `enforce_admins` enabled, force-push and deletion prevented. The pull-request-reviews object was present but carried `required_approving_review_count: 0`, `require_code_owner_reviews: false` and `require_last_push_approval: false`, and signed commits were not required — so a PR could be merged into the release branch with no approving review at all. The rulesets endpoint returned `[]`, so the protection was classic rather than a ruleset. This matched the branch-protection requirement now preserved in D30's legacy PHASE 7 catalog; it was delivered by a different session rather than by this plan. (Historical re-read 09:12Z.)
- Two pull requests exist and both are closed/merged: #1 "Bind MoonClient fetch to the global receiver" (09:41:41Z) and #2 "Rilis v0.1.0" (09:56:20Z) by GitHub's own timestamps; local `date -u` read 09:00Z at the same query, so the clock discrepancy already recorded under R-42 applies here too, and conclusions are cited by object id rather than by timestamp.
- Tag `v0.1.0` and release "MoonWitness v0.1.0" (published 09:56:34Z GitHub time) now exist, so the "zero releases, zero tags" line above is true only of the 04:09Z–08:29Z snapshot it describes.
- Still zero open issues and no project-board inventory. **No label scheme has ever been written**, in this document or in `TODO.md`.
- `dev` re-read at 09:12Z: also protected, but **not to the same standard as `main`** — required status check `validate` with `strict: false`, `enforce_admins: false`, no required pull-request review, `allow_force_pushes: false`, `allow_deletions: false`, and zero rulesets repository-wide. `release/v0.1.0` is still an open branch on the remote. So PHASE 7's "Branch Protection" is now partially satisfied by another session's work, unevenly, and the policy below remains a recommendation rather than a ratified setting.
- The repository's **default branch is now `dev`** (`gh api repos/bjo163/moonwitness-reborn` at 09:16Z; `updated_at` 2026-11-01T09:09:20Z), so `main` is no longer the headline ref a visitor or a clone lands on. That happens to match this plan's proposed policy — PRs target `dev`, `main` is the release branch — but it was flipped by the release session, not decided here, and the D02 row for this repository pins a `main` SHA that is now two commits behind the default branch rather than ahead of it. Any future census must say which ref it pinned.
- This checkout was on `dev` at `7e7a66c…`, which was **also the remote `origin/dev` tip** — `286bde5…` (a new 47-line `.github/workflows/release.yml`) and `7e7a66c…` (Coolify compose files for Stalwart and Roundcube) were pushed, and `validate` concluded **success** on that tip (Actions run `41291851818`). So `dev` was two commits ahead of the released `main` (`4fdb7c7…`, `v0.1.0`) and green; what was uncommitted at that reading was this audit's own output — `TODO.md` and `docs/architecture/DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md` tracked-modified and 26 canonical documents untracked (R-49). **Closed later the same morning:** the baseline was committed on `dev` as `8016edc…` plus its child `85feec0…` that also unblocked three documents hidden by an unanchored `data/` pattern in `.gitignore` (R-53). The former coverage gate printed branch, upstream, unpushed count and tracked-modified count; its historical snapshots are not current git-state evidence.

The owner has ratified `moonwitness-reborn` as the primary repo. Before implementation, add branch protection/rulesets and repair clean-checkout CI after the remaining planning review. No issue or settings changes were made.

## Selected CI/CD policy

The owner selected direct pushes to `dev`, followed by automatic latest-green promotion and release:

- Direct pushes to `dev` are allowed. CI still runs `validate`, but that check is not a branch-required gate on `dev`; the release workflow itself promotes only after a successful CI push run. This avoids GitHub's required-check bypass warning for direct pushes.
- A successful CI push run on `dev` starts the release workflow. A queued run is skipped if its SHA is no longer the current `dev` head; an already-started release is allowed to finish.
- The release workflow creates a candidate PR to protected `main`, explicitly runs `validate` against the exact candidate SHA, and enables auto-merge only after success.
- The workflow increments the patch version by default, tags and publishes a GitHub Release from the exact merged `main` SHA, then opens a validated PR to sync `main` back into `dev`.
- `workflow_dispatch` and dry-run remain available. A push to `main` can trigger production deployment only if the external deployment service is configured to watch that branch; GitHub workflow success alone is not deployment evidence.
- This policy intentionally means green `dev` changes can reach production without a separate human release approval. Add an approval gate before enabling production deployment if that is not acceptable.
- The initial dry-run against `dev` returned `v0.1.1` with 22 commits since `v0.1.0`. Review this initial release scope before merging the automatic workflow into `dev`.

The workflow definition and live branch-protection settings must both be present for this policy to be active; confirm the latest Actions run and deployment result by exact SHA.

The live `dev` protection now permits direct pushes while preventing force-pushes and deletion; it no longer has required status checks or PR reviews. The automation changes are still local and are not active until merged into the default branch. The repository allows Actions to create PRs and auto-merge, and `main` still requires a PR plus strict `validate`.

## Task and issue governance

`docs/governance/task-tracker.json` is the only canonical task/status register. `TODO.md` is generated from that JSON and its template with `pnpm tracker:render`; CI runs `pnpm tracker:check` and rejects stale output, duplicate IDs, missing dependencies, and dependency cycles. Once approved, each GitHub issue mirrors one stable `MW-NNNN` task ID, scope, acceptance criteria, dependencies, tests, owner, priority, complexity and evidence. Projects/milestones visualize tasks but do not become another status authority. Do not create duplicate tasks or issue mirrors before ratification. A task marked Done is not a release record; only released work belongs in `CHANGELOG.md`.

## Automation

CI should run reproducible root install/lint/typecheck/relevant tests/build and upload exact commit results. Release automation must be explicit and protected; no autonomous merge of sensitive changes. Preserve failed run evidence and do not report “green” from only the latest run without SHA context.
