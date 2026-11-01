"""Validate the canonical project tracker and render its Markdown mirror."""

import argparse
from copy import deepcopy
from datetime import datetime, timezone
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TRACKER = os.path.join(ROOT, "docs", "governance", "task-tracker.json")
TEMPLATE = os.path.join(ROOT, "docs", "governance", "TODO.template.md")
OUTPUT = os.path.join(ROOT, "TODO.md")

TASK_ID = re.compile(r"MW-\d{4}\Z")
DEPENDENCY_ID = re.compile(r"MW-\d{4}")
VALID_STATES = {"done", "in_progress", "proposed", "blocked", "pending"}
TITLE_COLUMNS = {"Subject", "Goal", "Prompt item"}
ACCEPTANCE_COLUMNS = {"Acceptance Criterion", "Acceptance criterion"}


def load_json(path):
    with open(path, encoding="utf-8") as source:
        return json.load(source)


def validate_tracker(tracker):
    errors = []
    if not isinstance(tracker, dict) or tracker.get("schema_version") != 1:
        return ["tracker schema_version must be 1"]
    tasks = tracker.get("tasks")
    if not isinstance(tasks, list) or not tasks:
        return ["tracker tasks must be a non-empty array"]

    by_id = {}
    for index, task in enumerate(tasks, 1):
        if not isinstance(task, dict):
            errors.append("task row %d must be an object" % index)
            continue
        task_id = task.get("id")
        if not isinstance(task_id, str) or not TASK_ID.fullmatch(task_id):
            errors.append("task row %d has an invalid ID" % index)
        elif task_id in by_id:
            errors.append("duplicate task ID: %s" % task_id)
        else:
            by_id[task_id] = task

        for field in (
            "title",
            "section",
            "status_label",
            "owner",
            "acceptance_criteria",
            "dependency_label",
        ):
            if not isinstance(task.get(field), str) or not task[field].strip():
                errors.append("%s has no valid %s" % (task_id or "task row %d" % index, field))
        if task.get("state") not in VALID_STATES:
            errors.append("%s has an invalid state" % (task_id or "task row %d" % index))
        if not isinstance(task.get("depends_on"), list) or any(
            not isinstance(dependency, str) or not TASK_ID.fullmatch(dependency)
            for dependency in task.get("depends_on", [])
        ):
            errors.append("%s has invalid dependencies" % (task_id or "task row %d" % index))
        completed_at = task.get("completed_at")
        if completed_at is not None:
            if not isinstance(completed_at, str):
                errors.append("%s has an invalid completion timestamp" % (task_id or "task row %d" % index))
            else:
                try:
                    datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
                except ValueError:
                    errors.append("%s has an invalid completion timestamp" % (task_id or "task row %d" % index))
        if not isinstance(task.get("table_headers"), list) or not task.get("table_headers"):
            errors.append("%s has no table headers" % (task_id or "task row %d" % index))
        if not isinstance(task.get("metadata"), dict):
            errors.append("%s metadata must be an object" % (task_id or "task row %d" % index))

    for task_id, task in by_id.items():
        for dependency in task.get("depends_on", []):
            if dependency not in by_id:
                errors.append("%s depends on missing task %s" % (task_id, dependency))

    visiting = set()
    visited = set()

    def visit(task_id):
        if task_id in visiting:
            errors.append("dependency cycle includes %s" % task_id)
            return
        if task_id in visited:
            return
        visiting.add(task_id)
        for dependency in by_id[task_id].get("depends_on", []):
            if dependency in by_id:
                visit(dependency)
        visiting.remove(task_id)
        visited.add(task_id)

    for task_id in by_id:
        visit(task_id)

    return errors


def cell_for(task, header):
    if header == "ID":
        return task["id"]
    if header in TITLE_COLUMNS:
        return task["title"]
    if header == "Status":
        return task["status_label"]
    if header == "Owner":
        return task["owner"]
    if header == "Depends on":
        return task["dependency_label"]
    if header in ACCEPTANCE_COLUMNS:
        return task["acceptance_criteria"]
    return task["metadata"].get(header, "")


def markdown_row(task):
    cells = [cell_for(task, header).replace("|", "&#124;").replace("\n", " ") for header in task["table_headers"]]
    return "| " + " | ".join(cells) + " |"


def render(template, tracker):
    by_id = {task["id"]: task for task in tracker["tasks"]}
    marker = re.compile(r"(?m)^<!-- TASK:(MW-\d{4}) -->$")
    seen = []

    def replace(match):
        task_id = match.group(1)
        task = by_id.get(task_id)
        if task is None:
            raise ValueError("template references missing task %s" % task_id)
        seen.append(task_id)
        return markdown_row(task)

    result = marker.sub(replace, template)
    if len(seen) != len(set(seen)):
        raise ValueError("template contains duplicate task markers")
    missing = set(by_id) - set(seen)
    if missing:
        raise ValueError("template is missing task markers: %s" % ", ".join(sorted(missing)))
    return result


def dependency_ready_tasks(tracker):
    tasks = {task["id"]: task for task in tracker["tasks"]}
    return [
        task
        for task in tracker["tasks"]
        if task["state"] in {"proposed", "pending"}
        and all(tasks[dependency]["state"] == "done" for dependency in task["depends_on"])
    ]


def transition_task_state(tracker, task_id, state, completed_at=None):
    if not isinstance(state, str) or state not in VALID_STATES:
        raise ValueError("invalid task state: %s" % state)
    if not isinstance(task_id, str) or not TASK_ID.fullmatch(task_id):
        raise ValueError("invalid task ID: %s" % task_id)

    updated = deepcopy(tracker)
    task = next((item for item in updated["tasks"] if item.get("id") == task_id), None)
    if task is None:
        raise KeyError("task not found: %s" % task_id)

    previous_state = task["state"]
    task["state"] = state
    if state == "done" and previous_state != "done" and task["completed_at"] is None:
        task["completed_at"] = completed_at or datetime.now(timezone.utc).isoformat(
            timespec="seconds"
        ).replace("+00:00", "Z")
    return updated


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="write the generated TODO.md")
    mode.add_argument("--check", action="store_true", help="fail if TODO.md is stale")
    args = parser.parse_args()

    try:
        tracker = load_json(TRACKER)
        errors = validate_tracker(tracker)
        if errors:
            for error in errors:
                print("TRACKER ERROR:", error)
            return 1
        with open(TEMPLATE, encoding="utf-8") as source:
            template = source.read()
        generated = render(template, tracker)
        if args.write:
            with open(OUTPUT, "w", encoding="utf-8", newline="\n") as destination:
                destination.write(generated)
            print("TODO.md generated from task-tracker.json (%d tasks)." % len(tracker["tasks"]))
            return 0
        with open(OUTPUT, encoding="utf-8") as source:
            current = source.read()
        if current != generated:
            print("TODO.md is stale. Run: pnpm tracker:render")
            return 1
        counts = Counter(task["state"] for task in tracker["tasks"])
        print(
            "TASK_TRACKER",
            len(tracker["tasks"]),
            "tasks | states:",
            ", ".join("%s=%d" % item for item in sorted(counts.items())),
            "| ready:",
            len(dependency_ready_tasks(tracker)),
        )
        print("TODO_GENERATION: PASS")
        return 0
    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
        print("TASK_TRACKER ERROR:", error)
        return 1


if __name__ == "__main__":
    sys.exit(main())
