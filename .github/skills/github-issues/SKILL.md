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

## Validation

For changes to the task/documentation governance or requirement audit tooling,
fetch the public Wiki and all task Issues to temporary files, then run:

```powershell
python -B docs/audit/tools/test_requirement_coverage_gate.py
python -B docs/audit/tools/requirement_coverage_gate.py
python -B docs/audit/tools/requirements_traceability_gate.py
```

Set `MW_WIKI_ROOT` to the Wiki clone and `MW_TASK_ISSUES_FILE` to the JSON output
from `gh issue list --state all --limit 1000 --json number,title,body,state,labels,url`.
Never commit either snapshot; they are validation inputs, not task sources.
