# Release and Acceptance Strategy

**Status: PROPOSED; no release target selected.**

## Evidence states

Use `DESIGNED`, `PROPOSED`, `IMPLEMENTED`, `TESTED`, `VERIFIED`, `DEPLOYED`, `PRODUCTION CERTIFIED` precisely. Each stronger status requires separate evidence tied to exact SHA, environment and scope.

## Gates

1. **Planning ratified:** primary repo, scope, architecture, source rights, owners and SLOs approved.
2. **Build verified:** clean install and root lint/typecheck/tests/build pass on protected commit.
3. **Security/data verified:** addon manifest/model/ACL tests; cross-owner and private-field tests; rights/provenance and retention checks.
4. **UX verified:** end-to-end journey in id/en, themes, responsive and accessibility review.
5. **Operations verified:** health/readiness, secrets, structured redacted logs, backup restore, failure handling and rollback tested.
6. **Release accepted:** product owner signs the defined journey, known limitations, support/incident runbook and release note.
7. **Production certified:** real deployed environment evidence, monitoring and recovery objectives met. Do not infer this from CI.

## Release record

Record version/tag, source repository, commit SHA, build artifact digest, environment, CI run IDs, test commands/results, schema state, dataset/rights version, known issues, approval, rollback artifact and follow-up tasks. Preserve failed runs and superseded decisions.

## Current status

Workspace HEAD is `3acab11b2a6dd8291dc971869f45511fc078b82b` on `bjo163/moonwitness-reborn/main`. On 2026-11-01, local lint, typecheck, tests (30 passing), and build exited 0 at the previous SHA `bc32604e70454ed8474d144d40faacac888be533`; these checks were not rerun after the Docker/build-wiring and Coolify commits. GitHub Actions on current HEAD fails at lint. No deployment, backup/restore proof, rights approval, or release record was verified. It is not release-ready or production-certified based on this audit.
