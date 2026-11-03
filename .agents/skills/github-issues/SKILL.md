---
name: github-issues
description: "Use GitHub Issues as the canonical project task register and verify task dependencies, status, evidence, and execution constraints."
---

# GitHub Issues Workflow

GitHub Issues are the only canonical task/status register. The GitHub Wiki is the
canonical home for human-authored project documentation. Do not recreate task rows
in repository files, TODO lists, Projects, or local databases.

## Before coding

1. Read the matching Issue and its dependency Issues:

   ```powershell
   gh issue view <number> --repo bjo163/moonwitness-reborn
   ```

2. Verify that the Issue is open and labeled `status:pending`, and that every
   dependency Issue is closed. If a dependency is open, or the task is labeled
   `status:blocked`, do not start implementation; report the blocker.
3. Use one Issue per stable `MW-NNNN` ID. Search by the exact ID before creating a
   task, and do not create a duplicate.
4. Do not create or edit an Issue unless the current user request explicitly
   authorizes that GitHub write. A general coding delegation does not authorize
   changes to GitHub records.

## Issue contract

- The Issue title starts with `[MW-NNNN]`.
- The body contains `<!-- mw-task-id: MW-NNNN -->` and a JSON task contract between
  `<!-- mw-task-record-start -->` / `<!-- mw-task-record-end -->` markers.
- The task contract carries the stable ID, title, owner, acceptance criteria,
  dependency IDs, evidence, status note, metadata, and execution constraints.
- A separate imported-record block may preserve the original tracker row as
  migration provenance; its old state is historical and never overrides GitHub.
- GitHub Issue open/closed state and status labels define current workflow state:
  open tasks have exactly one of `status:proposed`, `status:pending`,
  `status:in-progress`, or `status:blocked`; a completed task is closed and has no
  status label. All task Issues have `type:task`.
- Dependencies are direct Issue references (`#<number>`) in the body and stable
  `MW-NNNN` IDs in the task contract. Never add a GitHub Project or milestone as a
  second status authority.
- Closing an Issue is not a release claim. Release evidence remains in the
  separately governed release process and changelog.

## Updating work

Only when authorized, update the existing Issue rather than creating a mirror.
Keep its status label, Issue state, dependency links, contract, blocker note, and
evidence consistent. Move a blocked task back to pending only when the stated
blocker is resolved. Close the Issue only when every acceptance criterion has
direct evidence; include that evidence in the Issue before closing.

For autonomous selection, choose the simplest open `status:pending` Issue whose
dependencies are all closed and whose execution packet permits implementation.
Do not infer readiness from title, priority, or a closed dependency alone when the
Issue is marked blocked or requires owner ratification, rights/security evidence,
manual verification, exact-SHA approval, or a release gate.

## GitHub Actions evidence

- CI is the only executor of build, lint, typecheck, tests, and quality gates. Do
  not run them locally.
- Check Actions for the exact commit SHA:

  ```powershell
  gh run list --repo bjo163/moonwitness-reborn --commit <sha> --json databaseId,headSha,status,conclusion,workflowName,url
  ```

- A matching successful run is PASS. No matching run or an in-progress run is
  pending; a failed run is FAIL. Never infer a result from another SHA or from a
  local test.
- Do not push or create a commit just to start CI unless the user explicitly
  authorizes it.

## Validation

For changes to task or documentation governance, verify the relevant content
directly against GitHub Issues and the GitHub Wiki. Local requirement audit
scripts and CI gates have been retired; do not recreate local task or requirement
snapshots as a second source of truth.