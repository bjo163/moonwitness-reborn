---
name: task-tracker
description: "Mandatory for every MoonWitness repository coding task: find or create its canonical task, update progress, verify acceptance criteria, and keep task-tracker.json and TODO.md synchronized."
---

# Mandatory Task Tracker Workflow

The canonical source is [`docs/governance/task-tracker.json`](../../../docs/governance/task-tracker.json). `TODO.md` is generated; do not hand-edit its task rows. Follow this skill before implementation and again before reporting completion.

## Before coding

1. Read the tracker and run `pnpm tracker:check` to verify its current source and generated view.
2. Find an existing task whose scope and acceptance criteria cover the request. Do not select a merely adjacent task or claim unrelated acceptance criteria.
3. If no task matches, add a new unique `MW-####` task to the canonical JSON and a matching marker/table row to `docs/governance/TODO.template.md`. Give it a bounded title, explicit owner, dependencies, and testable acceptance criteria. Never reuse an ID or invent a dependency.
4. Mark the selected task `in_progress` before implementation. Preserve its other fields unless the task itself requires an agreed change. Render and verify:

   ```powershell
   pnpm tracker:render
   pnpm tracker:check
   ```

5. Record the selected task ID in the working context and keep changes scoped to its acceptance criteria.

## AI execution packets

When a task has an `execution_packet`, read it before editing and use its canonical references, scope, non-goals, touchpoints, checks, and stop conditions as the bounded work contract.

- `autonomous`: implementation may begin only when the task is pending/proposed and every dependency is done.
- `decision_prep`: gather evidence and prepare options; do not make an owner decision or implement the undecided feature.
- `manual_verification`: ask the owner to perform the named human/browser action and record evidence; do not fabricate completion.
- `gated_implementation`: do not start implementation until every listed ratification, rights, and release prerequisite is done.

Never infer permission to commit, push, create GitHub records, change branch protection, or deploy from a task packet. If a reference is missing, its scope conflicts with an accepted decision, or an explicit stop condition is met, update the task with the blocker and stop rather than guessing.

## While working

- Keep the task in `in_progress` while implementation or verification remains.
- If blocked, set the state to `blocked` and record the reason in `status_label`; do not imply completion.
- When using the local UI, launch it with:

  ```powershell
  python -B docs/audit/tools/task_tracker_server.py
  ```

  Open the printed `http://127.0.0.1:<port>/` URL. The server is loopback-only and updates the canonical JSON plus generated `TODO.md`. Stop the process when the task is done.
- Use the UI only to change task state. It preserves custom `status_label` text and records a UTC `completed_at` only when entering `done` and no completion time is already known.

## Before reporting completion

1. Re-run the task's acceptance tests and relevant workspace checks.
2. Set `state` to `done` only when every acceptance criterion has evidence and relevant checks pass. Preserve a known completion timestamp; if one is missing, record the actual UTC completion time.
3. For incomplete work, keep `in_progress`; for a genuine blocker, use `blocked` and state why. Do not convert an unverified task to done.
4. Render and validate the generated view:

   ```powershell
   pnpm tracker:render
   pnpm tracker:check
   pnpm tracker:test
   ```

5. In the final response, name the task ID, state, evidence, and any remaining blockers. A Done task is not a release claim.
