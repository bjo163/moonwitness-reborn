"""D02 repository census + coverage gate.

Re-runs the three-source union census against GitHub and diffs the result against the
main table of REPOSITORY_CAPABILITY_MATRIX.md, then checks that the estate-wide
capability → canonical owner roll-up assigns every matrix row exactly once. Run manually
before treating any planning phase as current:

    PYTHONIOENCODING=utf-8 python docs/audit/tools/repository_census_gate.py

Requires an authenticated `gh` CLI. Nothing here is wired into CI by design; the estate
scan is a planning tool, not a build gate.
"""

import json
import os
import re
import subprocess
import sys

MATRIX = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "REPOSITORY_CAPABILITY_MATRIX.md"))

OWNERS = ("bjo163", "ArsyBelovedLabs")

FILTER = re.compile(
    r"moon|mw|xv|xiv|rocksoul|witness|allah|crayon|empire|orbit|mesh|ontolog|divine|"
    r"antikythera|propet|rgbl|arsy|a-l-l-a-h|hbd|denpa|echolog|lumen|sentinel|mizan",
    re.I,
)

# Rows kept in the matrix although the relevance filter cannot see them.
CARRIED = ("zenix-id/orbit", "bjo163/ecosystem-foundation")

# Branches under continuous concurrent commits: a literal-SHA assertion can never stay
# satisfied for them, so they are checked for row presence only and reported here.
MOVING_TIP = ("bjo163/moonwitness-reborn",)

# Heading of the estate-wide capability → canonical owner roll-up inside the matrix.
ROLLUP_HEADING = "## Estate-wide capability"

UNPINNED = re.compile(
    r"Branch/SHA UNKNOWN|Exact SHAs not pinned|exact SHA not pinned|exact SHA pending|"
    r"not fully pinned|SHA UNKNOWN"
)


def api(path):
    out = subprocess.run(["gh", "api", path], capture_output=True, text=True,
                         encoding="utf-8", errors="replace")
    if out.returncode:
        return None
    try:
        return json.loads(out.stdout)
    except Exception:
        return None


def paginate(path):
    out = subprocess.run(["gh", "api", "--paginate", path, "--jq", "."],
                         capture_output=True, text=True, encoding="utf-8", errors="replace")
    if out.returncode:
        return []
    items, dec, s, i = [], json.JSONDecoder(), out.stdout, 0
    while i < len(s):
        while i < len(s) and s[i] in " \n\r\t":
            i += 1
        if i >= len(s):
            break
        obj, j = dec.raw_decode(s, i)
        items.extend(obj)
        i = j
    return items


def gql_search(user):
    rows, cursor = [], None
    tmpl = ('{ search(query: "user:%s", type: REPOSITORY, first: 100%s) { repositoryCount '
            'pageInfo { hasNextPage endCursor } nodes { ... on Repository { name isFork '
            "defaultBranchRef { name target { oid } } } } } }")
    while True:
        q = tmpl % (user, (', after: "%s"' % cursor) if cursor else "")
        out = subprocess.run(["gh", "api", "graphql", "-f", "query=" + q],
                             capture_output=True, text=True, encoding="utf-8", errors="replace")
        if out.returncode:
            break
        data = json.loads(out.stdout)["data"]["search"]
        rows.extend(data["nodes"])
        if not data["pageInfo"]["hasNextPage"]:
            break
        cursor = data["pageInfo"]["endCursor"]
    return rows


def resolve_repo(name):
    d = api("repos/%s" % name)
    if not d:
        return None
    branch = d.get("default_branch")
    if not branch:
        return None
    ref = api("repos/%s/git/ref/heads/%s" % (name, branch))
    return ((ref or {}).get("object") or {}).get("sha")


def census():
    found, diag = {}, {}
    for user in OWNERS:
        sources, descs = {}, {}
        g = gql_search(user)
        sources["graphql_search"] = {r["name"]: (r.get("defaultBranchRef") or {}).get("target", {}).get("oid")
                                     for r in g}
        for kind in ("users", "orgs"):
            lst = paginate("%s/%s/repos?per_page=100&type=all" % (kind, user))
            if lst:
                sources["rest_" + kind] = {r["name"]: r.get("sha") for r in lst}
                for r in lst:
                    if r.get("description"):
                        descs[r["name"]] = r["description"]
        names = set()
        for v in sources.values():
            names |= set(v)
        diag[user] = dict({k: len(v) for k, v in sources.items()}, union=len(names))
        for n in sorted(names):
            if not FILTER.search(n + " " + descs.get(n, "")):
                continue
            full = "%s/%s" % (user, n)
            sha = next((v[n] for v in sources.values() if v.get(n)), None) or resolve_repo(full)
            found[full] = sha or "-"
    return found, diag


def main_table_lines(lines):
    start = next(i for i, l in enumerate(lines) if l.startswith("| Repository |"))
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
    return start, lines[start:end]


def row_identities(body):
    ids = []
    for line in body[2:]:
        m = re.match(r"^\|\s*([^|]+?)\s*\|", line)
        if not m:
            continue
        cell = m.group(1)
        if cell.startswith("XV "):
            continue
        inner = re.fullmatch(r"`([^`]+)`", cell)
        if inner:
            ids.append(inner.group(1))
    return ids


def cells(line):
    if not line.startswith("|"):
        return None
    parts = [c.strip() for c in line.strip().strip("|").split("|")]
    return parts


def main_row_ids(body, width):
    """Every first cell of a real data row in the main matrix, XV slices included."""
    return [c[0] for c in (cells(l) for l in body[2:]) if c and len(c) == width]


def rollup_rows(lines):
    """The estate-wide roll-up table: (row id, target owner) for every data row."""
    try:
        start = next(i for i, l in enumerate(lines) if l.startswith(ROLLUP_HEADING))
    except StopIteration:
        return None
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
    out = []
    for line in lines[start:end]:
        c = cells(line)
        if not c or len(c) != 4:
            continue
        if c[0] in ("Repository / slice",) or set(c[0]) <= set("-: "):
            continue
        out.append((c[0], c[1]))
    return out


def main():
    found, diag = census()
    print("DIAG", json.dumps(diag))

    with open(MATRIX, encoding="utf-8") as fh:
        lines = fh.read().split("\n")
    start, body = main_table_lines(lines)
    ids = row_identities(body)
    names = set(ids)
    body_text = "\n".join(body)

    print("CENSUS", len(found), "MAIN_TABLE_ROWS", len(ids))

    failures = []

    missing = [full for full in list(found) + list(CARRIED) if full not in names]
    print("MISSING_FROM_MATRIX:", missing or "none")
    failures += missing

    stale = [f for f, sha in found.items() if sha != "-" and f not in MOVING_TIP and sha not in body_text]
    print("CENSUS_SHA_NOT_PRESENT_IN_TABLE:", stale or "none")
    print("MOVING_TIP_EXEMPT (row present, SHA assertion skipped):",
          [m for m in MOVING_TIP if m in names] or "none")
    failures += stale

    dupes = sorted({n for n in ids if ids.count(n) > 1})
    print("DUPLICATE_ROWS:", dupes or "none")
    failures += dupes

    blank = [start + i + 1 for i, l in enumerate(body[1:], 1) if l.strip() == "" and l != body[-1]]
    print("BLANK_LINES_INSIDE_TABLE:", blank or "none")
    failures += [str(b) for b in blank]

    bad_cols = [l[:70] for l in body[2:] if l.startswith("|") and l.count("|") != 12]
    print("ROWS_WITH_WRONG_CELL_COUNT:", bad_cols or "none")
    failures += bad_cols

    unpinned = [r[:110] for r in lines if r.startswith("| `") and UNPINNED.search(r)]
    print("ROWS_WITH_UNPINNED_MARKERS:", unpinned or "none")
    failures += unpinned

    empties = [f for f, sha in found.items() if sha == "-"]
    print("EMPTY_CENSUS_REPOS:", empties)
    print("CENSUS_WITH_SHA", sum(1 for sha in found.values() if sha != "-"))
    print("ROWS_WITH_40_HEX_SHA:", sum(1 for l in body[2:] if re.search(r"`[0-9a-f]{40}`", l)))
    print("ALL_EMPTIES_ROWWISE_PRESENT:", all(e in names for e in empties))

    rollup = rollup_rows(lines)
    if rollup is None:
        print("ROLLUP_COVERAGE: SECTION MISSING —", ROLLUP_HEADING)
        failures.append("rollup section missing")
    else:
        header = cells(lines[start])
        width = len(header) if header else 11
        mids = main_row_ids(body, width)
        rid = [r for r, _ in rollup]
        missing = sorted(set(mids) - set(rid))
        extra = sorted(set(rid) - set(mids))
        dup = sorted({n for n in rid if rid.count(n) > 1})
        empty = sorted(r for r, owner in rollup if not owner or owner == "-")
        print("ROLLUP_COVERAGE", len(rid), "of", len(mids),
              "| missing:", missing or "none",
              "| extra:", extra or "none",
              "| duplicated:", dup or "none",
              "| owner cell empty:", empty or "none")
        failures += missing + extra + dup + empty

    if failures:
        print("GATE: FAIL", len(failures), "issue(s)")
        return 1
    print("GATE: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
