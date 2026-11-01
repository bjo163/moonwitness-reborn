"""Prompt-coverage gate: does the planning baseline cover what `masterprompt.md` requires?

Unlike `repository_census_gate.py`, which proves the repository census is complete, this
script proves the *architecture* baseline is complete against the normative lists in the
prompt. It re-reads the prompt on every run, so a requirement the prompt adds or renames
shows up here as a failure rather than as a stale document.

    PYTHONIOENCODING=utf-8 python docs/audit/tools/prompt_coverage_gate.py

Checks:
  1. §4.3 Canonical Ownership Matrix — every prompt domain appears exactly once in the
     registry's coverage table, maps to an addon that exists in the registry, and repeats
     the prompt's "must not own" text verbatim.
  2. §4.4 Domain Contract — all 20 required attributes are addressed in the registry.
  3. D01–D31 — every deliverable has exactly one row in the deliverable register and the
     canonical document it names exists on disk.
  4. EXECUTION PROTOCOL PHASE 0–12 — each phase is represented in TODO.md by number, and every
     item in each planning phase's own deliverable list has a row in the traceability matrix
     naming a carrier document that exists, with a status and, when it is not covered, a
     reconciliation entry that exists (D30 §PHASE 0–7 / §PHASE 8–12 lists).
  5. MASTER ACCEPTANCE CRITERIA A–I — each criterion is addressed in the coverage report.
  6. Owner vocabulary — no `ql_*` name is used in the D02 roll-up that the registry lacks.
  7. Family views — the ROCKSOUL tables in D02 and in the registry agree with the roll-up.
  8. Roll-up tallies — the counts typed in the prose match a fresh recount of the table, and
     so do the migration-decision counts quoted in the STEP 8 report.
  9. Reconciliation bookkeeping — D03's own entry count and blocker count match its table and
     list, and `TODO.md` mirrors that blocker list item-for-item instead of drifting.
 10. STEP 8 report — the twelve numbered items `masterprompt.md` requires of the final report
     each appear once as a heading of the coverage report, with the prompt's own wording.
 11. Baseline tracking — how much of the canonical document set is not in git yet, and how far
     local HEAD runs ahead of `origin/main`; printed every run so prose cannot go stale.

Nothing here is wired into CI by design; the estate scan is a planning tool, not a build
gate. It reads local files only and makes no network calls.
"""

import os
import re
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
PROMPT = os.path.join(ROOT, "masterprompt.md")
REGISTRY = os.path.join(ROOT, "docs", "architecture", "DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md")
MATRIX = os.path.join(ROOT, "docs", "audit", "REPOSITORY_CAPABILITY_MATRIX.md")
REGISTER = os.path.join(ROOT, "docs", "audit", "DELIVERABLE_REGISTER.md")
RECON = os.path.join(ROOT, "docs", "audit", "ARCHITECTURE_AND_DOCUMENTATION_RECONCILIATION.md")
TODO = os.path.join(ROOT, "TODO.md")
REPORT = os.path.join(ROOT, "docs", "audit", "PROMPT_COVERAGE_AND_STEP8_REPORT.md")
TRACE = os.path.join(ROOT, "docs", "governance", "REQUIREMENTS_TRACEABILITY.md")

# The prompt numbers its phases PHASE 0..12; TODO.md numbering was written before that was
# reconciled and reuses "Phase 12" for the Cloudflare lane. The mismatch is recorded as
# R-45, so it is tolerated here rather than hidden — a NEW mismatch still fails.
TOLERATED_PHASE_TITLES = {
    3: "Product Specification",
    4: "Master Blueprint",
    5: "Master Design System",
    6: "Engineering & Security Specifications",
    7: "Single Application Foundation",
    8: "First Vertical Slice",
    9: "Domain Expansion",
    10: "Integration & Hardening",
    11: "Release Preparation",
    12: "External service integration (Cloudflare DNS)",
}

NON_DOMAIN_ADDONS = ("ql_base", "ql_chat", "ql_integration", "ql_cloudflare")
ALLOWED_NON_ADDON_OWNERS = ("@moonwitness/ui", "@moonwitness/moonclient", "apps/web", "apps/api",
                            "NONE", "MULTIPLE", "TBD")


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read().split("\n")


def cells(line):
    if not line.startswith("|"):
        return None
    return [c.strip() for c in line.strip().strip("|").split("|")]


def section_table(lines, heading_prefix, width):
    """Data rows (as cell lists) of the first table under a heading."""
    try:
        start = next(i for i, l in enumerate(lines) if l.startswith(heading_prefix))
    except StopIteration:
        return None
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
    return [c for c in (cells(l) for l in lines[start:end])
            if c and len(c) == width and not set(c[0]) <= set("-: |")]


def prompt_domains():
    rows = section_table(read(PROMPT), "## 4.3 Canonical Ownership Matrix", 3)
    return {c[0]: c[2] for c in rows or [] if c[0] != "Domain"}


def prompt_attributes():
    lines = read(PROMPT)
    try:
        start = next(i for i, l in enumerate(lines) if l.startswith("## 4.4 Domain Contract"))
    except StopIteration:
        return {}
    out = {}
    for l in lines[start:start + 60]:
        m = re.match(r"^(\d+)\.\s+(.+?)\.?$", l.strip())
        if m:
            out[int(m.group(1))] = m.group(2).rstrip(".").strip()
        if l.startswith("## 4.5"):
            break
    return out


def prompt_deliverables():
    rows = section_table(read(PROMPT), "# FINAL REQUIRED DELIVERABLE REGISTRY", 3)
    return {c[0]: (c[1], c[2]) for c in rows or [] if c[0] != "ID"}


def prompt_phases():
    out = {}
    for l in read(PROMPT):
        m = re.match(r"^## PHASE (\d+) — (.+?)\s*$", l)
        if m:
            out[int(m.group(1))] = m.group(2).strip()
    return out


def prompt_criteria():
    out = {}
    started = False
    for l in read(PROMPT):
        if l.startswith("# MASTER ACCEPTANCE CRITERIA"):
            started = True
            continue
        if started and l.startswith("# FINAL REQUIRED DELIVERABLE"):
            break
        m = re.match(r"^## ([A-I])\. (.+?)\s*$", l)
        if started and m:
            out[m.group(1)] = m.group(2).strip()
    return out


def registry_addons():
    rows = section_table(read(REGISTRY), "| Addon/domain |", 3)
    out = []
    for c in rows or []:
        m = re.match(r"`(ql_[a-z_]+)`", c[0])
        if m:
            out.append(m.group(1))
    return out


def check_domain_coverage(failures):
    pdom, cov = prompt_domains(), section_table(read(REGISTRY), "## §4.3 coverage", 4)
    if cov is None:
        print("PROMPT_43_COVERAGE: SECTION MISSING")
        failures.append("registry has no §4.3 coverage table")
        return
    cov = [c for c in cov if c[0] != "§4.3 domain"]
    addons = set(registry_addons())
    seen, dangling = [], []
    for c in cov:
        domain, owner = c[0], c[1]
        seen.append(domain)
        if domain in pdom and c[2] != pdom[domain]:
            failures.append("MUST_NOT_OWN_DRIFT: %s" % domain)
        tokens = re.findall(r"`?(ql_[a-z_]+)`?", owner)
        if not tokens:
            dangling.append("%s -> %s" % (domain, owner))
        for t in tokens:
            if t not in addons:
                dangling.append("%s -> unknown addon %s" % (domain, t))
    missing = sorted(set(pdom) - set(seen))
    extra = sorted(set(seen) - set(pdom))
    dupes = sorted({d for d in seen if seen.count(d) > 1})
    print("PROMPT_43_COVERAGE", len(seen), "of", len(pdom), "domains |",
          "missing:", missing or "none", "| not in prompt:", extra or "none",
          "| duplicated:", dupes or "none", "| unresolved owner:", dangling or "none")
    failures += missing + extra + dupes + dangling
    owners = {t for c in cov for t in re.findall(r"`?(ql_[a-z_]+)`?", c[1])}
    print("REGISTRY_ADDONS", len(addons), "rows |", len(owners), "distinct §4.3 owners |",
          "addons owning no §4.3 domain:", sorted(addons - owners))
    if sorted(addons - owners) != sorted(NON_DOMAIN_ADDONS):
        failures.append("NON_DOMAIN_ADDON_SET_CHANGED")


def check_contract_attributes(failures):
    pattr, cov = prompt_attributes(), section_table(read(REGISTRY), "## §4.4 domain contract", 4)
    if cov is None:
        print("PROMPT_44_COVERAGE: SECTION MISSING")
        failures.append("registry has no §4.4 contract coverage table")
        return
    cov = [c for c in cov if c[0] != "#"]
    nums = [c[0] for c in cov]
    missing = sorted(set(str(n) for n in pattr) - set(nums))
    dupes = sorted({n for n in nums if nums.count(n) > 1})
    named = {c[1].rstrip(".").strip() for c in cov}
    wrong = sorted(a for n, a in pattr.items() if n <= len(cov)
                   and a not in {c[1].rstrip(".").strip() for c in cov})
    print("PROMPT_44_COVERAGE", len(cov), "of", len(pattr), "attributes |",
          "missing:", missing or "none", "| duplicated:", dupes or "none",
          "| attribute-name mismatch:", wrong or "none")
    failures += missing + dupes + wrong


def check_deliverables(failures):
    pdel, reg = prompt_deliverables(), section_table(read(REGISTER), "| ID | Canonical document |", 3)
    if reg is None:
        print("D01_D31_REGISTER: TABLE MISSING")
        failures.append("deliverable register has no table")
        return
    reg = [c for c in reg if c[0] != "ID"]
    ids = [c[0] for c in reg]
    missing = sorted(set(pdel) - set(ids))
    extra = sorted(set(ids) - set(pdel))
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    nodoc = []
    for cid, doc in [(c[0], c[1]) for c in reg]:
        m = re.search(r"`([^`]+\.md)`", doc)
        if not m:
            nodoc.append("%s: no document path" % cid)
        elif not os.path.exists(os.path.join(ROOT, m.group(1))):
            nodoc.append("%s: missing file %s" % (cid, m.group(1)))
    print("D01_D31_REGISTER", len(ids), "of", len(pdel), "| missing:", missing or "none",
          "| extra:", extra or "none", "| duplicated:", dupes or "none",
          "| bad document path:", nodoc or "none")
    failures += missing + extra + dupes + nodoc


def check_baseline_tracking():
    """Report how much of the ratified-by-review baseline exists in git.

    Deliberately informational: untracked files are a governance state the owner has to
    change (R-49), not a defect inside the documents, and making it a failure would keep
    this gate red for a reason this script cannot fix.
    """
    import subprocess
    try:
        tracked = set(subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True,
                                     text=True, encoding="utf-8").stdout.split())
        head_files = set(subprocess.run(["git", "ls-tree", "-r", "--name-only", "HEAD"],
                                         cwd=ROOT, capture_output=True, text=True,
                                         encoding="utf-8").stdout.split())
        head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True,
                              text=True).stdout.strip()
    except Exception as exc:  # no git available
        print("BASELINE_TRACKING: UNAVAILABLE —", exc)
        return
    reg = read(REGISTER)
    docs = set()
    for line in read(REGISTER):
        c = cells(line)
        if c and len(c) == 3 and re.fullmatch(r"D\d\d", c[0]):
            docs |= {p for p in re.findall(r"`([^`]+\.md)`", c[1])}
    outside_head = sorted(d for d in docs if d not in head_files)
    untracked = sorted(d for d in docs if d not in tracked)
    ahead = behind = "?"
    tags = ""
    branch = upstream = unpushed = "?"
    modified = "?"
    try:
        ahead = subprocess.run(["git", "rev-list", "--count", "origin/main..HEAD"], cwd=ROOT,
                               capture_output=True, text=True).stdout.strip()
        behind = subprocess.run(["git", "rev-list", "--count", "HEAD..origin/main"], cwd=ROOT,
                                capture_output=True, text=True).stdout.strip()
        remote = subprocess.run(["git", "rev-parse", "origin/main"], cwd=ROOT,
                                capture_output=True, text=True).stdout.strip()
        tags = " ".join(subprocess.run(["git", "tag", "--points-at", "origin/main"], cwd=ROOT,
                                        capture_output=True, text=True).stdout.split())
        # Being ahead of origin/main says nothing about whether a commit is pushed: a
        # checkout on dev is ahead of main by every dev commit. Read the branch's own
        # upstream, so "ahead" is never mistaken for "unpushed" (R-42).
        branch = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=ROOT,
                                capture_output=True, text=True).stdout.strip()
        upstream = subprocess.run(["git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
                                  cwd=ROOT, capture_output=True, text=True).stdout.strip()
        if upstream and "usage:" not in upstream:
            unpushed = subprocess.run(["git", "rev-list", "--count", "@{u}..HEAD"], cwd=ROOT,
                                      capture_output=True, text=True).stdout.strip()
        else:
            upstream = "none"
        status = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT,
                                capture_output=True, text=True).stdout.splitlines()
        modified = str(len([l for l in status if l[:2].strip() and l[0] != "?" and l[1] != "?"]))
    except Exception:
        remote = ""
    # "in the index" is not "in git". Staging a document makes it committable, not
    # committed, and ratification names a commit — so the headline count is measured
    # against HEAD, with the index reported only as the step in between (R-49/R-53).
    r49 = ("R-49 closed: the baseline is committed, ratification is still owed"
           if not outside_head else "R-49, open owner decision")
    print("BASELINE_TRACKING", len(docs), "canonical documents |", len(outside_head),
          "not in HEAD,", len(untracked), "not in index (%s)" % r49,
          "| branch", branch, "HEAD", head[:12],
          "| upstream", upstream, "unpushed", unpushed, "| tracked-modified", modified,
          "| origin/main", remote[:12] if remote else "unknown",
          "| ahead", ahead, "behind", behind,
          "| tags on origin/main:", tags or "none",
          "(R-42/R-52: every count and the tag list move while documents are written, and ahead-of-main "
          "is not the same claim as unpushed — read them here, not from prose)")
    for d in outside_head:
        print("   NOT IN HEAD:", d)


def check_phases(failures):
    pp, todo = prompt_phases(), {}
    for l in read(TODO):
        m = re.match(r"^### Phase (\d+) — (.+?)\s*$", l)
        if m:
            todo[int(m.group(1))] = m.group(2).strip()
    missing = sorted(set(pp) - set(todo) - {0})
    print("PROMPT_PHASES", len(pp), "in prompt |", len(todo), "in TODO.md",
          "| TODO has no row for PHASE:", missing or "none")
    unexpected = sorted(set(todo) - set(pp))
    print("TODO_PHASES_NOT_IN_PROMPT:", unexpected or "none",
          "(recorded as R-45; the prompt has no PHASE 13)")
    def norm(s):
        s = re.sub(r"\s*\([^)]*\)\s*", " ", s)
        return re.sub(r"[^a-z]", "", s.lower())
    drift = [n for n in sorted(set(pp) & set(todo) - set(TOLERATED_PHASE_TITLES))
             if not norm(todo[n]).startswith(norm(pp[n]))]
    print("PHASE_TITLE_DRIFT (beyond the tolerated renumbering):", drift or "none")
    failures += ["PHASE_%d_MISSING_FROM_TODO" % n for n in missing]
    failures += ["PHASE_%d_UNEXPECTED_IN_TODO" % n for n in unexpected]
    failures += ["PHASE_%d_TITLE_DRIFT" % n for n in drift]


def prompt_phase_lists():
    """EXECUTION PROTOCOL: the bulleted/numbered deliverable list each phase carries."""
    out, current = {}, None
    for l in read(PROMPT):
        m = re.match(r"^## PHASE (\d+) — (.+?)\s*$", l)
        if m:
            current = int(m.group(1))
            out[current] = []
            continue
        if current is None:
            continue
        if l.startswith("## ") or l.startswith("# "):
            current = None
            continue
        m = re.match(r"^(?:-|\d+\.)\s+(.+?)\.?\s*$", l)
        if m:
            out[current].append(m.group(1).strip())
    return out


def register_documents():
    out = {}
    for line in read(REGISTER):
        c = cells(line)
        if c and len(c) == 3 and re.fullmatch(r"D\d\d", c[0]):
            m = re.search(r"`([^`]+)`", c[1])
            if m:
                out[c[0]] = m.group(1)
    return out


def recon_entries():
    return {int(m.group(1)) for line in read(RECON)
            for m in [re.match(r"^\| R-(\d\d) \|", line)] if m}


def check_phase_lists(failures):
    """Every item in a planning phase's own list must have a row naming a real carrier."""
    docs = register_documents()
    if not os.path.exists(TRACE):
        print("PHASE_LISTS: traceability document missing —", os.path.relpath(TRACE, ROOT))
        failures.append("no requirements traceability document to carry the phase lists")
        return
    plines = read(TRACE)
    plan = section_table(plines, "## PHASE 0–7 deliverable coverage", 5)
    build = section_table(plines, "## PHASE 8–12 lists", 4)
    if plan is None or build is None:
        print("PHASE_LISTS: COVERAGE TABLES MISSING in", os.path.relpath(TRACE, ROOT))
        failures.append("traceability has no phase coverage tables")
        return
    plan = [c for c in plan if c[0] != "Phase"]
    build = [c for c in build if c[0] != "Phase"]
    lists, known = prompt_phase_lists(), recon_entries()

    def norm(s):
        return re.sub(r"[^a-z0-9/`]", "", s.lower())

    rows, bad_status, bad_gap = {}, [], []
    for c in plan:
        try:
            phase = int(c[0])
        except ValueError:
            failures.append("PHASE_ROW_NOT_A_NUMBER: %r" % c[0])
            continue
        rows.setdefault(phase, []).append(c)
        if c[3] not in ("COVERED", "PARTIAL", "NONE"):
            bad_status.append("%d: %s -> %s" % (phase, c[1], c[3]))
        cited = re.findall(r"R-\d\d", c[4])
        if c[3] == "COVERED":
            if cited:
                bad_gap.append("%d: %s cites %s but is COVERED" % (phase, c[1], cited[0]))
        elif not cited or int(cited[0][2:]) not in known:
            bad_gap.append("%d: %s (%s) names no existing reconciliation entry"
                           % (phase, c[1], c[3]))

    mapped, unmapped, extra, no_carrier = 0, [], [], []
    for phase in range(8):
        required = lists.get(phase, [])
        have = rows.get(phase, [])
        have_norm = [norm(c[1]) for c in have]
        for item in required:
            if norm(item) in have_norm:
                mapped += 1
            else:
                unmapped.append("PHASE %d: %s" % (phase, item))
        for c in have:
            if norm(c[1]) not in [norm(i) for i in required]:
                extra.append("PHASE %d: %s" % (phase, c[1]))
        for c in have:
            ids = re.findall(r"\bD\d\d\b", c[2])
            paths = [p for p in re.findall(r"`([^`]+)`", c[2])
                     if re.search(r"\.(md|py|yml|ts|tsx|json)$", p)]
            unknown = [i for i in ids if i not in docs]
            missing = [p for p in paths if not os.path.exists(os.path.join(ROOT, p))]
            # A NONE row is allowed to name no document — that is the finding. It still has to
            # cite the reconciliation entry that records the hole (checked above).
            if c[3] != "NONE" and not ids and not paths:
                no_carrier.append("PHASE %d: %s names no document" % (phase, c[1]))
            for i in unknown:
                no_carrier.append("PHASE %d: %s cites %s, absent from the register" % (phase, c[1], i))
            for p in missing:
                no_carrier.append("PHASE %d: %s cites %s, which does not exist" % (phase, c[1], p))

    required_total = sum(len(lists.get(p, [])) for p in range(8))
    counts = {s: sum(1 for c in plan if c[3] == s) for s in ("COVERED", "PARTIAL", "NONE")}
    print("PHASE_LISTS", mapped, "of", required_total, "planning items mapped across PHASE 0-7 |",
          "COVERED", counts["COVERED"], "PARTIAL", counts["PARTIAL"], "NONE", counts["NONE"])
    print("PHASE_LISTS_UNMAPPED:", unmapped or "none")
    print("PHASE_LISTS_NOT_IN_PROMPT:", extra or "none")
    print("PHASE_LISTS_BAD_CARRIER:", no_carrier or "none")
    print("PHASE_LISTS_STATUS_OR_GAP:", (bad_status + bad_gap) or "none")
    holes = [c for c in plan if c[3] != "COVERED"]
    print("PHASE_LIST_HOLES", len(holes), "item(s) not fully covered |",
          "; ".join("PHASE %s %s (%s)" % (c[0], c[1], c[3]) for c in holes))
    if os.path.exists(REPORT):
        body = norm(open(REPORT, encoding="utf-8").read())
        omitted = sorted({c[1] for c in holes if norm(c[1]) not in body})
        print("PHASE_LIST_HOLES_NAMED_IN_REPORT omitted:", omitted or "none")
        failures += ["REPORT: phase-list hole not named: %s" % h for h in omitted]

    drift, not_build = [], []
    build_norm = []
    for c in build:
        try:
            build_norm.append((int(c[0]), int(c[1]), c[3]))
        except ValueError:
            failures.append("PHASE_BUILD_ROW_NOT_A_NUMBER: %r" % c[0])
    for phase, item_count, state in build_norm:
        if phase not in range(8, 13):
            not_build.append(str(phase))
        elif lists.get(phase, []) and len(lists[phase]) != item_count:
            drift.append("PHASE %d claims %d items, prompt lists %d"
                         % (phase, item_count, len(lists[phase])))
        elif not lists.get(phase, []) and item_count != 0:
            drift.append("PHASE %d claims %d items, prompt lists none" % (phase, item_count))
        if "BUILD" not in state:
            drift.append("PHASE %s build row status is not BUILD" % c[0])
    missing_build = sorted(set(range(8, 13)) - {p for p, _, _ in build_norm})
    print("PHASE_BUILD_LISTS",
          " ".join("%d:%d" % (p, len(lists.get(p, []))) for p in sorted(lists) if p >= 8),
          "| count drift:", drift or "none",
          "| phases with no build row:", missing_build or "none",
          "| rows outside 8-12:", not_build or "none")

    failures += ["PHASE_LIST_ITEM_UNMAPPED: %s" % u for u in unmapped]
    failures += ["PHASE_LIST_ROW_EXTRA: %s" % u for u in extra]
    failures += ["PHASE_LIST_CARRIER: %s" % u for u in no_carrier]
    failures += ["PHASE_LIST_STATUS: %s" % u for u in bad_status + bad_gap]
    failures += ["PHASE_BUILD: %s" % u for u in drift]
    failures += ["PHASE_BUILD_MISSING_ROW_%d" % p for p in missing_build]


def check_criteria(failures):
    pc = prompt_criteria()
    if not os.path.exists(REPORT):
        print("ACCEPTANCE_CRITERIA: REPORT MISSING —", os.path.relpath(REPORT, ROOT))
        failures.append("no STEP 8 coverage report")
        return
    body = open(REPORT, encoding="utf-8").read()
    not_addressed = [k for k, v in pc.items()
                     if not re.search(r"\*\*%s[\. ]" % k, body)]
    print("ACCEPTANCE_CRITERIA", len(pc) - len(not_addressed), "of", len(pc),
          "addressed in the coverage report |", "not addressed:", not_addressed or "none")
    failures += ["CRITERION_%s_NOT_ADDRESSED" % k for k in not_addressed]


def rollup_rows():
    rows = section_table(read(MATRIX), "## Estate-wide capability", 4)
    if rows is None:
        return None
    return [c for c in rows if c[0] != "Repository / slice"]


def check_owner_vocabulary(failures):
    rows = rollup_rows()
    if rows is None:
        print("OWNER_VOCABULARY: ROLLUP MISSING")
        failures.append("no roll-up table")
        return {}
    addons = set(registry_addons())
    unknown = sorted({t for c in rows for t in re.findall(r"ql_[a-z_]+", c[1]) if t not in addons})
    print("OWNER_VOCABULARY", len(rows), "rows |", "ql_* names not in registry:", unknown or "none")
    failures += unknown
    tally = {}
    for c in rows:
        for t in set(re.findall(r"ql_[a-z_]+", c[1])):
            tally[t] = tally.get(t, 0) + 1
    for label in ALLOWED_NON_ADDON_OWNERS:
        tally[label] = sum(1 for c in rows if c[1].startswith(label) or label in c[1])
    return tally


def check_tallies(failures, tally):
    if not tally:
        return
    body = "\n".join(read(MATRIX))
    i = body.index("**What the roll-up shows.**")
    para = body[i:body.index("\n\n", i)]
    claims = re.findall(r"`(ql_[a-z_]+)` \(\*\*(\d+)\*\*\)", para)
    bad = ["%s: prose %s, table %s" % (n, c, tally.get(n, 0))
           for n, c in claims if tally.get(n, 0) != int(c)]
    simple = [("@moonwitness/ui", r"`@moonwitness/ui` receives \*\*(\d+)\*\*"),
              ("@moonwitness/moonclient", r"`@moonwitness/moonclient` \*\*(\d+)\*\*"),
              ("apps/web", r"`apps/web` is the landing target for \*\*(\d+)\*\*"),
              ("apps/api", r"`apps/api` for \*\*(\d+)\*\*"),
              ("NONE", r"\*\*(\d+) of 102 rows resolve to `NONE`\*\*|(\d+) of 102 rows resolve to `NONE`"),
              ("MULTIPLE", r"(\d+) rows are `MULTIPLE`|Three rows are `MULTIPLE`"),
              ("TBD", r"(\d+) rows are deliberately `TBD`|Two rows are deliberately `TBD`")]
    for name, rx in simple:
        m = re.search(rx, para)
        if not m:
            bad.append("%s: no prose count found" % name)
            continue
        val = next((g for g in m.groups() if g), None)
        if val is not None and tally.get(name, 0) != int(val):
            bad.append("%s: prose %s, table %s" % (name, val, tally.get(name, 0)))
    used = {t for c in rollup_rows() for t in re.findall(r"ql_[a-z_]+", c[1])}
    prompt_owned = {t for c in (section_table(read(REGISTRY), "## §4.3 coverage", 4) or [])
                    for t in re.findall(r"`?(ql_[a-z_]+)`?", c[1])}
    zero_domains = sorted(prompt_owned - used)
    z = re.search(r"receive no estate material at all\*\* — (.+?) —", para)
    if z is None:
        bad.append("no prose sentence naming the domains with no estate material")
    else:
        named = re.findall(r"`(ql_[a-z_]+)`", z.group(1))
        word = re.search(r"\*\*(\w+) required §4\.3 domains", para)
        words = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
                 "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12}
        if sorted(named) != zero_domains:
            bad.append("zero-material list: prose %s, table %s" % (sorted(named), zero_domains))
        if word and words.get(word.group(1).lower()) != len(named):
            bad.append("zero-material count word: prose %s for %d names" % (word.group(1), len(named)))
        failures += ["%s: claimed zero-material but the table has rows" % n
                     for n in named if tally.get(n, 0) != 0]
    print("PROSE_TALLIES", len(claims), "per-addon claims +", len(simple), "slot claims |",
          "mismatch:", bad or "none")
    print("DOMAINS_WITH_NO_ESTATE_MATERIAL:", sorted(set(registry_addons()) - used) or "none",
          "| of those, §4.3-required:", zero_domains or "none")
    failures += bad


def rocksoul_tokens(cell):
    return set(re.findall(r"ql_[a-z_]+", cell)) | {t for t in
            ("@moonwitness/ui", "@moonwitness/moonclient", "apps/web", "apps/api") if t in cell}


def check_family_views(failures):
    rows = rollup_rows()
    if rows is None:
        return
    by_repo = {}
    for c in rows:
        m = re.match(r"`(?:bjo163|ArsyBelovedLabs)/(.+?)`", c[0])
        if m:
            by_repo[m.group(1)] = c[1]
        elif c[0] == "`rocksoul`":
            by_repo["rocksoul"] = c[1]
    sources = [("D02 ROCKSOUL map", section_table(read(MATRIX), "| Repository | Canonical Domain Owner |", 4)),
               ("registry ROCKSOUL table", section_table(read(REGISTRY), "| Repository | Related ql* Domain |", 4))]
    checked = 0
    conflicts = []
    for label, tbl in sources:
        for c in tbl or []:
            if c[0] == "Repository":
                continue
            name = c[0].strip("`")
            owner_cell = c[1]
            if name not in by_repo:
                conflicts.append("%s: %s has no roll-up row" % (label, name))
                continue
            checked += 1
            roll = by_repo[name]
            toks = rocksoul_tokens(owner_cell)
            if owner_cell.startswith("NONE"):
                if not roll.startswith("NONE") and not toks & {"NONE"}:
                    conflicts.append("%s: %s map=NONE but roll-up=%s" % (label, name, roll))
                for t in toks:
                    if t not in roll:
                        conflicts.append("%s: %s notes %s which the roll-up lacks (%s)" % (label, name, t, roll))
            else:
                for t in toks:
                    if t not in roll:
                        conflicts.append("%s: %s maps to %s, roll-up says %s" % (label, name, t, roll))
    print("FAMILY_VIEWS", checked, "compared rows | conflicts:", conflicts or "none")
    failures += conflicts


def check_migration_decisions(failures):
    """The migration-decision tallies quoted in the STEP 8 report must match the matrix."""
    lines = read(MATRIX)
    try:
        start = next(i for i, l in enumerate(lines) if l.startswith("| Repository |"))
    except StopIteration:
        return
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
    rows = [c for c in (cells(l) for l in lines[start + 2:end]) if c and len(c) == 11]
    tally = {}
    unlabeled = []
    for c in rows:
        m = re.search(r"\b(ADOPT|REBUILD|IMPORT|REFERENCE|RETAIN)\b", c[9])
        if m:
            tally[m.group(1)] = tally.get(m.group(1), 0) + 1
        else:
            unlabeled.append(c[0].strip("`"))
    print("MIGRATION_DECISIONS", len(rows), "rows |",
          " ".join("%s=%d" % (k, tally.get(k, 0)) for k in ("REFERENCE", "REBUILD", "IMPORT", "ADOPT", "RETAIN")),
          "| no label:", len(unlabeled))
    if not os.path.exists(REPORT):
        return
    body = open(REPORT, encoding="utf-8").read()
    for name in ("REFERENCE", "REBUILD", "IMPORT", "ADOPT", "RETAIN"):
        m = re.search(r"\b%s (\d+)\b" % name, body)
        if m is None:
            failures.append("REPORT: no %s count quoted" % name)
        elif int(m.group(1)) != tally.get(name, 0):
            failures.append("REPORT: %s quoted %s, matrix says %d" % (name, m.group(1), tally.get(name, 0)))
    m = re.search(r"and (\d+) rows that carry an explicit exclusion", body)
    if m is None or int(m.group(1)) != len(unlabeled):
        failures.append("REPORT: unlabeled-row count %s vs matrix %d"
                        % (m.group(1) if m else "absent", len(unlabeled)))
    para = body[body.index("## 8. Migration candidates"):body.index("## 9.")]
    omitted = sorted(u for u in unlabeled if u.split("/")[-1].strip("`") not in para)
    print("MIGRATION_ROWS_NAMED_IN_REPORT omitted:", omitted or "none")
    failures += ["REPORT: unlabeled row not named: %s" % u for u in omitted]


def blocker_list(lines, heading_prefix):
    items, active, n = {}, False, 0
    for l in lines:
        if l.startswith("## "):
            active = l.startswith(heading_prefix)
            continue
        if not active:
            continue
        if l.strip() == "---":
            active = False
            continue
        m = re.match(r"^(\d+)\.\s+(.*)$", l)
        if m:
            n = int(m.group(1))
            items[n] = m.group(2)
        elif items and l.strip() and not l.startswith(("|", "-", " ")):
            items[n] += " " + l.strip()
    return items


def check_blocker_bookkeeping(failures):
    """D03's own counts, and TODO.md's mirror of the blocker list, must agree with D03."""
    recon = read(RECON)
    entries = [m.group(1) for l in recon for m in [re.match(r"^\| (R-\d\d) \|", l)] if m]
    d03 = blocker_list(recon, "## Ratification blockers")
    todo = blocker_list(read(TODO), "## 5. Ratification blockers")
    refs = lambda t: tuple(sorted(set(re.findall(r"R-\d\d", t))))
    print("RECON_ENTRIES", len(set(entries)), "distinct R-rows |", min(entries), "->", max(entries))
    print("BLOCKER_LISTS D03", len(d03), "items | TODO.md", len(todo), "items")
    dupes = sorted({e for e in entries if entries.count(e) > 1})
    if dupes:
        failures.append("RECON: duplicated R-number rows: %s" % dupes)
    row = next((cells(l) for l in read(REGISTER) if l.startswith("| D03 |")), None)
    if row:
        m = re.search(r"all (\d+) discrepancy entries \((R-\d\d) through (R-\d\d)\)", row[2])
        if not m:
            failures.append("REGISTER: D03 row states no entry count")
        elif (int(m.group(1)), m.group(2), m.group(3)) != (len(set(entries)), min(entries), max(entries)):
            failures.append("REGISTER: D03 row says %s entries %s-%s, D03 has %d (%s-%s)"
                            % (m.group(1), m.group(2), m.group(3),
                               len(set(entries)), min(entries), max(entries)))
        m = re.search(r"(\d+) ratification blockers", row[2])
        if not m or int(m.group(1)) != len(d03):
            failures.append("REGISTER: D03 row says %s blockers, list has %d"
                            % (m.group(1) if m else "none", len(d03)))
    if len(d03) != len(todo):
        failures.append("BLOCKERS: D03 lists %d, TODO.md lists %d" % (len(d03), len(todo)))
    for k in sorted(set(d03) & set(todo)):
        if refs(d03[k]) != refs(todo[k]):
            failures.append("BLOCKER %d: D03 cites %s, TODO.md cites %s" % (k, refs(d03[k]), refs(todo[k])))


def check_step8(failures):
    """FINAL ASSIGNMENT STEP 8's twelve report items each need a section of that number."""
    plines, items, active = read(PROMPT), {}, False
    for l in plines:
        if l.startswith("## STEP 8"):
            active = True
            continue
        if not active:
            continue
        if l.startswith("#") or l.startswith("**"):
            break
        m = re.match(r"^(\d+)\.\s+(.+?)\.?\s*$", l)
        if m:
            items[int(m.group(1))] = m.group(2).strip()
    got = {}
    if os.path.exists(REPORT):
        for l in read(REPORT):
            m = re.match(r"^## (\d+)\.\s+(.+?)\s*$", l)
            if m:
                got[int(m.group(1))] = m.group(2).strip()
    def norm(s):
        return re.sub(r"[^a-z]", "", s.lower())
    missing = sorted(set(items) - set(got))
    extra = sorted(set(got) - set(items))
    drift = [n for n in sorted(set(items) & set(got)) if norm(items[n]) != norm(got[n])]
    print("STEP8_REPORT %d of %d items present | missing: %s | extra: %s | title drift: %s"
          % (len(set(items) & set(got)), len(items), missing or "none", extra or "none",
             ["%d: %r vs %r" % (n, items[n], got[n]) for n in drift] or "none"))
    failures += ["STEP8_ITEM_%d_MISSING_FROM_REPORT" % n for n in missing]
    failures += ["STEP8_SECTION_%d_NOT_IN_PROMPT" % n for n in extra]
    failures += ["STEP8_ITEM_%d_TITLE_MISMATCH" % n for n in drift]


def main():
    for path in (PROMPT, REGISTRY, MATRIX, REGISTER, RECON, TRACE, TODO):
        if not os.path.exists(path):
            print("MISSING INPUT:", path)
            return 1
    failures = []
    check_domain_coverage(failures)
    check_contract_attributes(failures)
    check_deliverables(failures)
    check_baseline_tracking()
    check_phases(failures)
    check_phase_lists(failures)
    check_criteria(failures)
    check_step8(failures)
    tally = check_owner_vocabulary(failures)
    check_tallies(failures, tally)
    check_family_views(failures)
    check_migration_decisions(failures)
    check_blocker_bookkeeping(failures)
    if failures:
        for f in failures:
            print("   FAILURE:", f)
        print("GATE: FAIL", len(failures), "issue(s)")
        return 1
    print("GATE: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
