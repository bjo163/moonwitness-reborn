"""Verify that the canonical requirement catalog remains complete and traceable.

The gate intentionally reads the catalog and its canonical carriers only. It does not read
the retired planning prompt or use its file as a runtime source of truth.

    python docs/audit/tools/requirement_coverage_gate.py
"""

import hashlib
import json
import os
import re
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CATALOG = os.path.join(ROOT, "docs", "governance", "requirement-catalog.json")
TODO = os.path.join(ROOT, "TODO.md")

EXPECTED_ENTRY_COUNT = 1891
EXPECTED_DIGEST = "f47fac6d03a73b6bb651948467f94741e22c853e4efc322c9adf9f97c0ee573f"
SOURCE_INVENTORY_FIELDS = (
    "id",
    "source_section",
    "legacy_lines",
    "source_kind",
    "statement",
)
EXPECTED_KINDS = {
    "paragraph": 417,
    "list_item": 1365,
    "table_row": 85,
    "table_header": 5,
    "code": 19,
}
VALID_SPECIFICATION_STATES = {"REVIEW_REQUIRED", "SPECIFIED", "OPEN_DECISION"}
VALID_IMPLEMENTATION_STATES = {
    "IMPLEMENTED",
    "PARTIAL",
    "GAP",
    "UNKNOWN",
    "TESTED",
    "VERIFIED",
    "DEPLOYED",
    "PRODUCTION_CERTIFIED",
}


def cells(line):
    if not line.startswith("|"):
        return None
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def table_after(lines, heading, width):
    try:
        start = next(index for index, line in enumerate(lines) if line.startswith(heading))
    except StopIteration:
        return None
    end = next(
        (index for index in range(start + 1, len(lines)) if lines[index].startswith("## ")),
        len(lines),
    )
    return [
        row
        for row in (cells(line) for line in lines[start:end])
        if row and len(row) == width and not set(row[0]) <= set("-: |")
    ]


def canonical_digest(entries):
    inventory = [
        {field: entry.get(field) for field in SOURCE_INVENTORY_FIELDS}
        for entry in entries
        if isinstance(entry, dict)
    ]
    encoded = json.dumps(inventory, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def validate_catalog(catalog, root):
    failures = []
    entries = catalog.get("entries")
    if not isinstance(entries, list):
        return ["catalog entries must be an array"]

    if catalog.get("schema_version") != 1:
        failures.append("catalog schema_version must be 1")
    if catalog.get("entry_count") != EXPECTED_ENTRY_COUNT or len(entries) != EXPECTED_ENTRY_COUNT:
        failures.append(
            "catalog entry count must remain %d (metadata=%r, rows=%d)"
            % (EXPECTED_ENTRY_COUNT, catalog.get("entry_count"), len(entries))
        )
    digest = canonical_digest(entries)
    if catalog.get("inventory_sha256") != EXPECTED_DIGEST or digest != EXPECTED_DIGEST:
        failures.append("catalog inventory digest does not match the reviewed baseline")

    kinds = {}
    seen_ids = set()
    seen_lines = set()
    todo_path = os.path.join(root, "TODO.md")
    try:
        with open(todo_path, encoding="utf-8") as source:
            todo = source.read()
    except OSError as exc:
        return failures + ["TODO.md cannot be read: %s" % exc]
    todo_ids = set(re.findall(r"(?m)^\|\s*(MW-\d{4})\s*\|", todo))

    for index, entry in enumerate(entries, 1):
        if not isinstance(entry, dict):
            failures.append("catalog row %d is not an object" % index)
            continue
        expected_id = "MWREQ-%05d" % index
        requirement_id = entry.get("id")
        if requirement_id != expected_id:
            failures.append("catalog row %d has ID %r, expected %s" % (index, requirement_id, expected_id))
        if requirement_id in seen_ids:
            failures.append("duplicate requirement ID: %s" % requirement_id)
        seen_ids.add(requirement_id)

        kind = entry.get("source_kind")
        kinds[kind] = kinds.get(kind, 0) + 1
        if not isinstance(entry.get("statement"), str) or not entry["statement"].strip():
            failures.append("%s has no requirement statement" % requirement_id)
        if not isinstance(entry.get("source_section"), str) or not entry["source_section"].strip():
            failures.append("%s has no source section" % requirement_id)

        span = entry.get("legacy_lines")
        if (
            not isinstance(span, list)
            or len(span) != 2
            or not all(isinstance(value, int) and value > 0 for value in span)
            or span[0] > span[1]
        ):
            failures.append("%s has an invalid source span" % requirement_id)
        elif span[0] in seen_lines:
            failures.append("%s duplicates a source block start line" % requirement_id)
        else:
            seen_lines.add(span[0])

        canonical_home = entry.get("canonical_home")
        if not isinstance(canonical_home, str) or not canonical_home:
            failures.append("%s has no canonical document owner" % requirement_id)
        elif not os.path.isfile(os.path.join(root, canonical_home)):
            failures.append("%s points to missing canonical document %s" % (requirement_id, canonical_home))

        task_ids = entry.get("task_ids")
        if not isinstance(task_ids, list) or not task_ids:
            failures.append("%s has no TODO task link" % requirement_id)
        else:
            for task_id in task_ids:
                if task_id not in todo_ids:
                    failures.append("%s points to unknown TODO task %s" % (requirement_id, task_id))

        if entry.get("specification_status") not in VALID_SPECIFICATION_STATES:
            failures.append("%s has an invalid specification status" % requirement_id)
        if entry.get("implementation_status") not in VALID_IMPLEMENTATION_STATES:
            failures.append("%s has an invalid implementation status" % requirement_id)
        review_basis = entry.get("implementation_review_basis")
        if not isinstance(review_basis, str) or not review_basis.strip():
            failures.append("%s has no implementation review basis" % requirement_id)

    if kinds != EXPECTED_KINDS:
        failures.append("catalog block-kind counts changed: %r" % kinds)

    sections = [entry.get("source_section", "") for entry in entries if isinstance(entry, dict)]
    pillars = {
        int(match.group(1))
        for section in sections
        for match in [re.search(r"\bPILLAR 0?(\d+)\b", section)]
        if match
    }
    phases = {
        int(match.group(1))
        for section in sections
        for match in [re.search(r"\bPHASE (\d+)\b", section)]
        if match
    }
    criteria = {
        match.group(1)
        for section in sections
        for match in [re.search(r"\b([A-I])\. [A-Z]", section)]
        if match
    }
    if pillars != set(range(1, 13)):
        failures.append("catalog must cover all 12 pillars; found %r" % sorted(pillars))
    if phases != set(range(13)):
        failures.append("catalog must cover phases 0–12; found %r" % sorted(phases))
    if criteria != set("ABCDEFGHI"):
        failures.append("catalog must cover acceptance criteria A–I; found %r" % sorted(criteria))

    return failures


def validate_governance(root):
    failures = []
    trace_path = os.path.join(root, "docs", "governance", "REQUIREMENTS_TRACEABILITY.md")
    register_path = os.path.join(root, "docs", "audit", "DELIVERABLE_REGISTER.md")
    domain_path = os.path.join(root, "docs", "architecture", "DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md")
    try:
        with open(trace_path, encoding="utf-8") as source:
            trace = source.read()
        with open(register_path, encoding="utf-8") as source:
            register = source.read().splitlines()
        with open(domain_path, encoding="utf-8") as source:
            domains = source.read().splitlines()
        with open(TODO if root == ROOT else os.path.join(root, "TODO.md"), encoding="utf-8") as source:
            todo = source.read()
    except OSError as exc:
        return ["canonical governance input cannot be read: %s" % exc]

    if not re.search(r"1,891 atomic source statements", trace):
        failures.append("D30 does not identify the complete atomic requirement catalog")
    if not re.search(r"requirement-catalog\.json", trace):
        failures.append("D30 does not link the requirement catalog")
    if not re.search(r"MW-0618", todo):
        failures.append("TODO.md does not track the prompt retirement gate")

    deliverables = []
    for line in register:
        row = cells(line)
        if row and len(row) == 3 and re.fullmatch(r"D\d{2}", row[0]):
            deliverables.append(row[0])
            match = re.search(r"`([^`]+\.md)`", row[1])
            if not match or not os.path.isfile(os.path.join(root, match.group(1))):
                failures.append("%s has a missing canonical deliverable path" % row[0])
    if set(deliverables) != {"D%02d" % number for number in range(1, 32)} or len(deliverables) != 31:
        failures.append("D01–D31 deliverable register is incomplete or duplicated")

    domains_table = table_after(domains, "## §4.3 coverage", 4)
    if domains_table is None or len([row for row in domains_table if row[0] != "§4.3 domain"]) != 23:
        failures.append("canonical domain registry does not cover 23 §4.3 domains")

    if not re.search(r"^\| MW-0618 \|", todo, re.M):
        failures.append("MW-0618 task row is missing")

    return failures


def main():
    try:
        with open(CATALOG, encoding="utf-8") as source:
            catalog = json.load(source)
    except (OSError, json.JSONDecodeError) as exc:
        print("CATALOG: cannot be read:", exc)
        return 1

    failures = validate_catalog(catalog, ROOT)
    failures += validate_governance(ROOT)
    print(
        "REQUIREMENT_CATALOG",
        len(catalog.get("entries", [])),
        "entries | expected",
        EXPECTED_ENTRY_COUNT,
        "| digest:",
        "PASS" if catalog.get("inventory_sha256") == EXPECTED_DIGEST else "FAIL",
    )
    status_counts = {
        status: sum(1 for entry in catalog.get("entries", []) if entry.get("implementation_status") == status)
        for status in ("GAP", "PARTIAL", "UNKNOWN")
    }
    print(
        "IMPLEMENTATION_TRIAGE",
        " ".join("%s=%d" % (status, count) for status, count in status_counts.items()),
        "| unreviewed:",
        sum(1 for entry in catalog.get("entries", []) if entry.get("implementation_status") == "UNVERIFIED"),
    )
    print("CANONICAL_LINKS", "PASS" if not failures else "CHECK FAILURES")
    if failures:
        for failure in failures:
            print("FAILURE:", failure)
        print("GATE: FAIL (%d issues)" % len(failures))
        return 1
    print("GATE: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
