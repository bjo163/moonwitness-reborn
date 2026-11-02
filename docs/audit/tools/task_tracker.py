"""Validate the canonical project tracker and render its Markdown mirror."""

import argparse
from copy import deepcopy
from datetime import datetime, timezone
from html import escape
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
from collections import Counter

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TRACKER = os.path.join(ROOT, "docs", "governance", "task-tracker.json")
REQUIREMENT_CATALOG = os.path.join(ROOT, "docs", "governance", "requirement-catalog.json")
TEMPLATE = os.path.join(ROOT, "docs", "governance", "TODO.template.md")
OUTPUT = os.path.join(ROOT, "TODO.md")

TASK_ID = re.compile(r"MW-\d{4}\Z")
DEPENDENCY_ID = re.compile(r"MW-\d{4}")
REQUIREMENT_ID = re.compile(r"MWREQ-\d{5}\Z")
VALID_STATES = {"done", "in_progress", "proposed", "blocked", "pending"}
EXECUTION_MODES = {
    "autonomous",
    "decision_prep",
    "manual_verification",
    "gated_implementation",
}
EXECUTION_PACKET_LISTS = (
    "non_goals",
    "spec_refs",
    "requirement_ids",
    "touchpoints",
    "checks",
    "stop_conditions",
)
TITLE_COLUMNS = {"Subject", "Goal", "Prompt item"}
ACCEPTANCE_COLUMNS = {"Acceptance Criterion", "Acceptance criterion"}
DEPENDENCY_SEPARATOR = ", "
NO_DEPENDENCY_LABEL = "—"
# Adding a metadata column is a schema decision, so the vocabulary is pinned in
# code instead of derived from whatever rows happen to carry.
METADATA_KEYS = frozenset({"Master-prompt mapping", "D30 source"})
MAX_LENGTHS = {
    "title": 200,
    "status_label": 1200,
    "acceptance_criteria": 2000,
    "evidence": 2000,
}
# The discriminator is position, not vocabulary. A blocked row may honestly
# write "Blocked: no test account, but the auth UI verified in id/en ...", while
# a label that opens with a result verb is what a laundered transition looks
# like: "Implemented; tests green" sitting on a row that is not done.
COMPLETION_CLAIM = re.compile(
    r"\s*(implemented|complete|completed|shipped|delivered|verified|done|closed)\b",
    re.IGNORECASE,
)
# Governance reuses the shape the product already ships for CAB records
# (packages/ql_workflow/services/state-machine.ts): a named table where anything
# not listed is illegal. A task cannot be completed without being worked on, and
# a blocker cannot clear itself, so done and blocked have no edge to done.
TRANSITION_TABLE = {
    "proposed": {"pending", "in_progress", "blocked"},
    "pending": {"in_progress", "blocked"},
    "in_progress": {"blocked", "pending", "done"},
    "blocked": {"pending", "in_progress"},
    "done": {"in_progress"},
}
# Rows recorded as done before an evidence field existed. This set may only
# shrink: adding an ID would license a new completion claim without proof.
LEGACY_DONE_WITHOUT_EVIDENCE = frozenset(
    {
        "MW-0501", "MW-0502", "MW-0503", "MW-0504", "MW-0505", "MW-0506", "MW-0507",
        "MW-0551", "MW-0552", "MW-0553", "MW-0554", "MW-0555", "MW-0556", "MW-0557",
        "MW-0571", "MW-0572", "MW-0573", "MW-0574", "MW-0575", "MW-0576", "MW-0577",
        "MW-0578", "MW-0579", "MW-0580", "MW-0581", "MW-0582", "MW-0583",
        "MW-0601", "MW-0602", "MW-0603", "MW-0604", "MW-0612", "MW-0613", "MW-0614",
        "MW-0618", "MW-0806", "MW-1209", "MW-1210", "MW-1211", "MW-1213", "MW-1214",
        "MW-1237", "MW-1238",
    }
)


def load_json(path):
    with open(path, encoding="utf-8") as source:
        return json.load(source)


def write_atomic(path, content):
    """Replace one file with new text, so readers never observe a partial write."""
    path = Path(path)
    descriptor, temporary_path = tempfile.mkstemp(
        prefix=path.name + ".",
        suffix=".tmp",
        dir=path.parent,
        text=True,
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as destination:
            destination.write(content)
            destination.flush()
            os.fsync(destination.fileno())
        os.replace(temporary_path, path)
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)


def utc_stamp():
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def revision_of(source_bytes):
    return hashlib.sha256(source_bytes).hexdigest()


def is_utc_stamp(value):
    if not isinstance(value, str):
        return False
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    return True


def can_transition(from_state, to_state):
    return to_state in TRANSITION_TABLE.get(from_state, set())


def allowed_target_states(task):
    state = task.get("state") if isinstance(task, dict) else None
    return sorted(TRANSITION_TABLE.get(state, set()))


def derived_dependency_label(task):
    if not task["depends_on"]:
        return NO_DEPENDENCY_LABEL
    return DEPENDENCY_SEPARATOR.join(task["depends_on"])


def validate_tracker(tracker, requirement_catalog=None):
    errors = []
    if not isinstance(tracker, dict) or tracker.get("schema_version") != 1:
        return ["tracker schema_version must be 1"]
    catalog_by_id = None
    if requirement_catalog is not None:
        catalog_by_id = {
            entry["id"]: entry
            for entry in requirement_catalog
            if isinstance(entry, dict) and isinstance(entry.get("id"), str)
        }
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
        if completed_at is not None and not is_utc_stamp(completed_at):
            errors.append("%s has an invalid completion timestamp" % (task_id or "task row %d" % index))
        state_changed_at = task.get("state_changed_at")
        if state_changed_at is not None and not is_utc_stamp(state_changed_at):
            errors.append("%s has an invalid state change timestamp" % (task_id or "task row %d" % index))
        for provenance_field in ("changed_by", "evidence"):
            value = task.get(provenance_field)
            if value is not None and (not isinstance(value, str) or not value.strip()):
                errors.append(
                    "%s %s must be a non-empty string when present"
                    % (task_id or "task row %d" % index, provenance_field)
                )
        if not isinstance(task.get("table_headers"), list) or not task.get("table_headers"):
            errors.append("%s has no table headers" % (task_id or "task row %d" % index))
        if not isinstance(task.get("metadata"), dict):
            errors.append("%s metadata must be an object" % (task_id or "task row %d" % index))
        metadata = task.get("metadata")
        if isinstance(metadata, dict):
            for key in metadata:
                if key not in METADATA_KEYS:
                    errors.append(
                        "%s metadata key %r is not an approved metadata column: %s"
                        % (task_id, key, ", ".join(sorted(METADATA_KEYS)))
                    )
        state = task.get("state")
        status_label = task.get("status_label")
        if (
            state in VALID_STATES
            and state != "done"
            and isinstance(status_label, str)
            and COMPLETION_CLAIM.match(status_label)
        ):
            errors.append(
                "%s is %s but its status_label claims completion: %s" % (task_id, state, status_label)
            )
        if (
            isinstance(task_id, str)
            and state == "done"
            and not str(task.get("evidence") or "").strip()
            and task_id not in LEGACY_DONE_WITHOUT_EVIDENCE
        ):
            errors.append(
                "%s is done without evidence; record the command or observation that proves it"
                % task_id
            )
        for field, limit in MAX_LENGTHS.items():
            value = task.get(field)
            if isinstance(value, str) and len(value) > limit:
                errors.append("%s %s is longer than %d characters" % (task_id, field, limit))
        if "execution_packet" in task:
            packet = task["execution_packet"]
            if not isinstance(packet, dict):
                errors.append("%s execution_packet must be an object" % (task_id or "task row %d" % index))
                continue
            required_packet_fields = {"mode", "scope", *EXECUTION_PACKET_LISTS}
            if set(packet) != required_packet_fields:
                errors.append(
                    "%s execution_packet fields must be exactly: %s"
                    % (task_id or "task row %d" % index, ", ".join(sorted(required_packet_fields)))
                )
            if packet.get("mode") not in EXECUTION_MODES:
                errors.append("%s has an invalid execution mode" % (task_id or "task row %d" % index))
            if not isinstance(packet.get("scope"), str) or not packet["scope"].strip():
                errors.append("%s execution_packet has no valid scope" % (task_id or "task row %d" % index))
            for field in EXECUTION_PACKET_LISTS:
                values = packet.get(field)
                if not isinstance(values, list):
                    errors.append("%s execution_packet %s must be an array" % (task_id or "task row %d" % index, field))
                    continue
                if field != "requirement_ids" and not values:
                    errors.append("%s execution_packet %s must not be empty" % (task_id or "task row %d" % index, field))
                if any(not isinstance(value, str) or not value.strip() for value in values):
                    errors.append("%s execution_packet %s contains an empty or invalid value" % (task_id or "task row %d" % index, field))
                if field == "requirement_ids" and any(
                    not isinstance(value, str) or not REQUIREMENT_ID.fullmatch(value)
                    for value in values
                ):
                    errors.append("%s execution_packet has an invalid requirement ID" % (task_id or "task row %d" % index))
                if field == "spec_refs":
                    for reference in values:
                        if isinstance(reference, str):
                            source_path = reference.split("#", 1)[0]
                            if not os.path.isfile(os.path.join(ROOT, source_path)):
                                errors.append("%s has a missing execution spec reference: %s" % (task_id, source_path))
                if field == "requirement_ids" and catalog_by_id is not None:
                    for requirement_id in values:
                        entry = catalog_by_id.get(requirement_id)
                        if entry is None:
                            errors.append("%s references unknown requirement %s" % (task_id, requirement_id))
                        elif task_id not in entry.get("task_ids", []):
                            errors.append("%s is not linked from catalog requirement %s" % (task_id, requirement_id))

    for task_id, task in by_id.items():
        for dependency in task.get("depends_on", []):
            if dependency not in by_id:
                errors.append("%s depends on missing task %s" % (task_id, dependency))

    profiles = {}
    for task_id, task in by_id.items():
        section = task.get("section")
        headers = task.get("table_headers")
        if isinstance(section, str) and isinstance(headers, list):
            profiles.setdefault(section, {})[DEPENDENCY_SEPARATOR.join(headers)] = task_id
    for section, variants in profiles.items():
        if len(variants) > 1:
            errors.append(
                "section %r is rendered by %d tasks with different table_headers: %s"
                % (section, len(variants), ", ".join(sorted(variants.values())))
            )

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
        return derived_dependency_label(task)
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
    queue = ai_ready_tasks(tracker)
    if queue:
        result += "\n\n## Ready for AI work\n\n"
        result += "Dependencies are done. `decision_prep` tasks may prepare options and evidence only; they do not authorize a decision or feature implementation.\n\n"
        for task in queue:
            packet = task["execution_packet"]
            result += "- **%s — %s** (`%s`): %s\n" % (
                task["id"],
                task["title"],
                packet["mode"],
                packet["scope"],
            )
    packets = [task for task in tracker["tasks"] if "execution_packet" in task]
    if packets:
        result += "\n\n## AI execution packets\n\n"
        for task in packets:
            packet = task["execution_packet"]
            result += "<details>\n<summary><code>%s</code> — %s</summary>\n\n" % (
                escape(task["id"]),
                escape(task["title"]),
            )
            result += "**Mode:** `%s`\n\n**Scope:** %s\n\n" % (
                escape(packet["mode"]),
                escape(packet["scope"]),
            )
            for field, label in (
                ("non_goals", "Non-goals"),
                ("spec_refs", "Canonical references"),
                ("touchpoints", "Likely touchpoints"),
                ("checks", "Checks"),
                ("stop_conditions", "Stop conditions"),
            ):
                if packet[field]:
                    result += "**%s**\n\n" % label
                    result += "".join("- %s\n" % escape(value) for value in packet[field])
                    result += "\n"
            if packet["requirement_ids"]:
                result += "**Requirement IDs:** %s\n\n" % ", ".join(
                    "`%s`" % escape(value) for value in packet["requirement_ids"]
                )
            result += "</details>\n\n"
    return result.rstrip() + "\n"


def ai_ready_tasks(tracker):
    tasks = {task["id"]: task for task in tracker["tasks"]}
    return [
        task
        for task in tracker["tasks"]
        if task["state"] in {"proposed", "pending"}
        and "execution_packet" in task
        and task["execution_packet"]["mode"] in {"autonomous", "decision_prep"}
        and all(tasks[dependency]["state"] == "done" for dependency in task["depends_on"])
    ]


def dependency_ready_tasks(tracker):
    tasks = {task["id"]: task for task in tracker["tasks"]}
    return [
        task
        for task in tracker["tasks"]
        if task["state"] in {"proposed", "pending"}
        and all(tasks[dependency]["state"] == "done" for dependency in task["depends_on"])
    ]


def transition_task_state(
    tracker,
    task_id,
    state,
    completed_at=None,
    *,
    status_label=None,
    evidence=None,
    actor=None,
    changed_at=None,
):
    """Return a copy of tracker with one legal transition and its provenance applied."""
    if not isinstance(state, str) or state not in VALID_STATES:
        raise ValueError("invalid task state: %s" % state)
    if not isinstance(task_id, str) or not TASK_ID.fullmatch(task_id):
        raise ValueError("invalid task ID: %s" % task_id)
    for field, value in (
        ("completed_at", completed_at),
        ("changed_at", changed_at),
        ("status_label", status_label),
        ("evidence", evidence),
        ("actor", actor),
    ):
        if value is not None and not isinstance(value, str):
            raise ValueError("%s must be a string" % field)
    for field, value in (("completed_at", completed_at), ("changed_at", changed_at)):
        if value is not None and not is_utc_stamp(value):
            raise ValueError("invalid timestamp for %s: %s" % (field, value))
    for field, value in (
        ("status_label", status_label),
        ("evidence", evidence),
        ("actor", actor),
    ):
        if value is not None and not value.strip():
            raise ValueError("%s must not be empty" % field)

    updated = deepcopy(tracker)
    task = next((item for item in updated["tasks"] if item.get("id") == task_id), None)
    if task is None:
        raise KeyError("task not found: %s" % task_id)

    previous_state = task["state"]
    allowed = sorted(TRANSITION_TABLE.get(previous_state, set()))
    if state != previous_state:
        if state not in allowed:
            raise ValueError(
                "illegal transition for %s: %s -> %s (allowed from %s: %s)"
                % (task_id, previous_state, state, previous_state, ", ".join(allowed) or "none")
            )
        if state == "blocked" and not status_label:
            raise ValueError(
                "moving %s to blocked needs a status_label that names the blocker" % task_id
            )
        # Reopen is the only back edge, so it is the one place a finished-sounding label
        # can be laundered onto an active row.
        if previous_state == "done":
            resulting_label = status_label if status_label is not None else task.get("status_label")
            if COMPLETION_CLAIM.match(str(resulting_label or "")):
                raise ValueError(
                    "reopening %s needs a new status_label; %r still claims completion"
                    % (task_id, resulting_label)
                )

    task["state"] = state
    if status_label is not None:
        task["status_label"] = status_label
    if evidence is not None:
        task["evidence"] = evidence
    if state == "done" and not task.get("completed_at"):
        task["completed_at"] = completed_at or utc_stamp()
    if state != previous_state:
        task["state_changed_at"] = changed_at or utc_stamp()
        if actor is not None:
            task["changed_by"] = actor
    return updated


def transition_main(args):
    """Apply one transition through the sanctioned write path: validate, render, CAS, write."""
    task_id, state = args.transition
    with open(TRACKER, "rb") as source:
        source_bytes = source.read()
    tracker = json.loads(source_bytes.decode("utf-8"))
    catalog = load_json(REQUIREMENT_CATALOG)
    entries = catalog.get("entries", [])
    errors = validate_tracker(tracker, entries)
    if errors:
        for error in errors:
            print("TRACKER ERROR:", error)
        return 1
    try:
        updated = transition_task_state(
            tracker,
            task_id,
            state,
            status_label=args.status_label,
            evidence=args.evidence,
            actor=args.actor,
        )
    except (KeyError, ValueError) as error:
        print("TRACKER TRANSITION REJECTED:", error)
        return 1
    errors = validate_tracker(updated, entries)
    if errors:
        for error in errors:
            print("TRACKER ERROR:", error)
        return 1
    with open(TEMPLATE, encoding="utf-8") as source:
        template = source.read()
    rendered = render(template, updated)
    task = next(item for item in updated["tasks"] if item["id"] == task_id)
    if args.dry_run:
        print(
            "DRY RUN: %s -> %s at %s; TODO.md would be re-rendered from %d tasks."
            % (task_id, state, task["state_changed_at"], len(updated["tasks"]))
        )
        return 0
    with open(TRACKER, "rb") as source:
        if revision_of(source.read()) != revision_of(source_bytes):
            print("TRACKER ERROR: the tracker changed while this command ran; re-run --transition.")
            return 1
    write_atomic(TRACKER, json.dumps(updated, ensure_ascii=False, indent=2) + "\n")
    write_atomic(OUTPUT, rendered)
    print("TRANSITIONED %s -> %s and re-rendered TODO.md." % (task_id, state))
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="write the generated TODO.md")
    mode.add_argument("--check", action="store_true", help="fail if TODO.md is stale")
    mode.add_argument(
        "--transition",
        nargs=2,
        metavar=("TASK_ID", "STATE"),
        help="apply one legal state transition and re-render TODO.md",
    )
    parser.add_argument("--status-label", help="new status_label to store with --transition")
    parser.add_argument("--evidence", help="completion evidence to store with --transition")
    parser.add_argument("--as", dest="actor", metavar="ACTOR", help="who is making this change")
    parser.add_argument("--dry-run", action="store_true", help="check a --transition without writing")
    args = parser.parse_args()

    try:
        if args.transition:
            return transition_main(args)
        tracker = load_json(TRACKER)
        catalog = load_json(REQUIREMENT_CATALOG)
        errors = validate_tracker(tracker, catalog.get("entries", []))
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
            "| AI queue:",
            len(ai_ready_tasks(tracker)),
        )
        print("TODO_GENERATION: PASS")
        return 0
    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
        print("TASK_TRACKER ERROR:", error)
        return 1


if __name__ == "__main__":
    sys.exit(main())
