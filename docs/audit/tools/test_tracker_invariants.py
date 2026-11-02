"""Tracker invariants that must hold for any legal data set.

Every test here works on fixtures. Nothing reads the live tracker, because other
sessions move task states in the shared working tree while these tests run, and a
test that depends on that data can only ever be flaky.
"""

import contextlib
import copy
import http.client
import io
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(__file__))
import task_tracker
from task_tracker_server import TrackerHandler, TrackerHTTPServer


SECTION = "Phase 0: Foundations"
HEADERS = ["ID", "Subject", "Status", "Owner", "Depends on", "Acceptance criterion"]


def make_task(task_id="MW-0001", **overrides):
    task = {
        "id": task_id,
        "title": "Hold the tracker honest",
        "section": SECTION,
        "state": "pending",
        "status_label": "Menunggu pengerjaan",
        "owner": "Owner",
        "depends_on": [],
        "acceptance_criteria": "The rule is enforced and tested.",
        "dependency_label": task_tracker.NO_DEPENDENCY_LABEL,
        "table_headers": list(HEADERS),
        "metadata": {},
        "completed_at": None,
    }
    task.update(overrides)
    return task


def make_tracker(*tasks):
    return {"schema_version": 1, "tasks": [copy.deepcopy(task) for task in tasks]}


def errors_for(tracker):
    return task_tracker.validate_tracker(tracker)


def transition(tracker, task_id, state, **kwargs):
    return task_tracker.transition_task_state(tracker, task_id, state, **kwargs)


class TransitionLegalityTests(unittest.TestCase):
    def test_table_covers_every_state_and_only_lists_legal_edges(self):
        self.assertEqual(set(task_tracker.TRANSITION_TABLE), set(task_tracker.VALID_STATES))
        for from_state, targets in task_tracker.TRANSITION_TABLE.items():
            self.assertTrue(targets, "%s has no way forward" % from_state)
            self.assertTrue(targets <= task_tracker.VALID_STATES)
        all_edges = {
            (from_state, to_state)
            for from_state in task_tracker.VALID_STATES
            for to_state in task_tracker.VALID_STATES
            if task_tracker.can_transition(from_state, to_state)
        }
        self.assertEqual(
            all_edges,
            {
                (from_state, to_state)
                for from_state, targets in task_tracker.TRANSITION_TABLE.items()
                for to_state in targets
            },
        )

    def test_no_state_can_transition_to_itself(self):
        for state in task_tracker.VALID_STATES:
            self.assertFalse(task_tracker.can_transition(state, state))

    def test_completion_requires_doing_the_work_first(self):
        for from_state in ("proposed", "pending", "blocked", "done"):
            self.assertFalse(task_tracker.can_transition(from_state, "done"))
        self.assertTrue(task_tracker.can_transition("in_progress", "done"))

    def test_illegal_edge_is_rejected_by_name(self):
        tracker = make_tracker(make_task(state="pending"))
        with self.assertRaises(ValueError) as caught:
            transition(tracker, "MW-0001", "done")
        self.assertIn("pending -> done", str(caught.exception))
        self.assertIn("in_progress", str(caught.exception))

    def test_allowed_target_states_matches_the_table(self):
        self.assertEqual(
            task_tracker.allowed_target_states({"state": "in_progress"}),
            ["blocked", "done", "pending"],
        )
        self.assertEqual(task_tracker.allowed_target_states({"state": "nonsense"}), [])

    def test_entering_blocked_requires_a_reason(self):
        tracker = make_tracker(make_task(state="in_progress"))
        with self.assertRaises(ValueError) as caught:
            transition(tracker, "MW-0001", "blocked")
        self.assertIn("names the blocker", str(caught.exception))

        reason = "Blocked: the design decision is not made yet."
        updated = transition(tracker, "MW-0001", "blocked", status_label=reason)
        task = updated["tasks"][0]
        self.assertEqual(task["state"], "blocked")
        self.assertEqual(task["status_label"], reason)
        self.assertEqual(errors_for(updated), [])

    def test_reopening_cannot_keep_a_label_that_claims_completion(self):
        tracker = make_tracker(
            make_task(
                state="done",
                status_label="Implemented; tests pass",
                completed_at="2026-10-30T12:00:00Z",
                evidence="pnpm test",
            )
        )
        with self.assertRaises(ValueError) as caught:
            transition(tracker, "MW-0001", "in_progress")
        self.assertIn("still claims completion", str(caught.exception))

        reopened = transition(tracker, "MW-0001", "in_progress", status_label="Reopened: a11y gap")
        task = reopened["tasks"][0]
        self.assertEqual(task["state"], "in_progress")
        self.assertEqual(task["completed_at"], "2026-10-30T12:00:00Z")
        self.assertEqual(errors_for(reopened), [])

    def test_reopen_is_the_only_way_back_out_of_done(self):
        self.assertEqual(task_tracker.allowed_target_states({"state": "done"}), ["in_progress"])

    def test_state_change_records_when_and_who(self):
        tracker = make_tracker(make_task(state="pending"))
        updated = transition(
            tracker,
            "MW-0001",
            "in_progress",
            actor="bjo16",
            changed_at="2026-11-01T09:00:00Z",
        )
        task = updated["tasks"][0]
        self.assertEqual(task["state_changed_at"], "2026-11-01T09:00:00Z")
        self.assertEqual(task["changed_by"], "bjo16")
        self.assertEqual(errors_for(updated), [])

    def test_same_state_write_keeps_provenance_and_stores_evidence(self):
        tracker = make_tracker(
            make_task(state="blocked", status_label="Blocked: waiting for a decision.")
        )
        updated = transition(
            tracker, "MW-0001", "blocked", evidence="Owner meeting moved to next week."
        )
        task = updated["tasks"][0]
        self.assertEqual(task["evidence"], "Owner meeting moved to next week.")
        self.assertNotIn("state_changed_at", task)
        self.assertEqual(errors_for(updated), [])

    def test_source_tracker_is_never_mutated(self):
        tracker = make_tracker(make_task(state="pending"))
        before = copy.deepcopy(tracker)
        transition(tracker, "MW-0001", "in_progress", actor="bjo16")
        self.assertEqual(tracker, before)

    def test_empty_optional_text_and_bad_timestamps_are_rejected(self):
        tracker = make_tracker(make_task(state="pending"))
        for kwargs in (
            {"status_label": "   "},
            {"evidence": ""},
            {"actor": ""},
            {"changed_at": "yesterday"},
            {"completed_at": "not-a-time"},
        ):
            with self.subTest(**kwargs), self.assertRaises(ValueError):
                transition(tracker, "MW-0001", "in_progress", **kwargs)

    def test_unknown_task_and_unknown_state_keep_their_error_types(self):
        tracker = make_tracker(make_task())
        with self.assertRaises(KeyError):
            transition(tracker, "MW-9999", "in_progress")
        with self.assertRaises(ValueError):
            transition(tracker, "MW-0001", "shipped")
        with self.assertRaises(ValueError):
            transition(tracker, "not-an-id", "in_progress")


class ValidatorInvariantTests(unittest.TestCase):
    def test_clean_fixture_has_no_errors(self):
        self.assertEqual(errors_for(make_tracker(make_task())), [])

    def test_unapproved_metadata_key_is_rejected(self):
        tracker = make_tracker(make_task(metadata={"Priority": "high"}))
        errors = errors_for(tracker)
        self.assertTrue(any("is not an approved metadata column" in error for error in errors))

    def test_approved_metadata_keys_are_accepted(self):
        tracker = make_tracker(
            make_task(metadata={"Master-prompt mapping": "P-12", "D30 source": "D30-3"})
        )
        self.assertEqual(errors_for(tracker), [])

    def test_completion_claim_on_an_active_row_is_rejected(self):
        tracker = make_tracker(make_task(state="in_progress", status_label="Implemented"))
        errors = errors_for(tracker)
        self.assertTrue(any("claims completion" in error for error in errors))

    def test_honest_partial_progress_label_is_accepted(self):
        tracker = make_tracker(
            make_task(state="in_progress", status_label="Build passes; owner review pending")
        )
        self.assertEqual(errors_for(tracker), [])

    def test_a_blocker_label_may_mention_a_passing_check_in_its_prose(self):
        # The discriminator is where the label opens. This shape is a real blocked
        # row, and rejecting it would make the guard refuse honest evidence.
        tracker = make_tracker(
            make_task(
                state="blocked",
                status_label=(
                    "Blocked: locale flows remain unverified because no "
                    "non-production test account was available; the auth UI "
                    "verified in id/en at desktop and mobile."
                ),
            )
        )
        self.assertEqual(errors_for(tracker), [])

    def test_field_length_limits_are_enforced(self):
        tracker = make_tracker(
            make_task(status_label="x" * (task_tracker.MAX_LENGTHS["status_label"] + 1))
        )
        errors = errors_for(tracker)
        self.assertTrue(any("status_label is longer than 1200 characters" in error for error in errors))

        tracker = make_tracker(make_task(evidence="x" * (task_tracker.MAX_LENGTHS["evidence"] + 1)))
        errors = errors_for(tracker)
        self.assertTrue(any("evidence is longer than 2000 characters" in error for error in errors))

    def test_a_section_must_be_rendered_with_one_header_profile(self):
        tracker = make_tracker(
            make_task("MW-0001"),
            make_task("MW-0002", table_headers=["ID", "Goal", "Status", "Owner", "Depends on"]),
        )
        errors = errors_for(tracker)
        self.assertTrue(any("different table_headers" in error for error in errors))

    def test_dependency_label_is_derived_not_trusted(self):
        task = make_task(depends_on=["MW-0002"], dependency_label="STALE")
        tracker = make_tracker(task, make_task("MW-0002"))
        row = task_tracker.markdown_row(tracker["tasks"][0])
        cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
        self.assertNotIn("STALE", row)
        self.assertEqual(cells[HEADERS.index("Depends on")], "MW-0002")
        self.assertEqual(
            task_tracker.derived_dependency_label(make_task()),
            task_tracker.NO_DEPENDENCY_LABEL,
        )

    def test_done_row_outside_the_legacy_set_requires_evidence(self):
        tracker = make_tracker(make_task(state="done", status_label="Implemented"))
        errors = errors_for(tracker)
        self.assertTrue(any("is done without evidence" in error for error in errors))

        tracker["tasks"][0]["evidence"] = "pnpm test -> 214 passing"
        self.assertEqual(errors_for(tracker), [])

    def test_legacy_done_rows_stay_valid_without_evidence(self):
        tracker = make_tracker(
            *[
                make_task(task_id, state="done", status_label="Implemented")
                for task_id in sorted(task_tracker.LEGACY_DONE_WITHOUT_EVIDENCE)
            ]
        )
        self.assertEqual(errors_for(tracker), [])

    def test_grandfather_set_may_only_shrink(self):
        authored = frozenset(
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
        self.assertLessEqual(task_tracker.LEGACY_DONE_WITHOUT_EVIDENCE, authored)
        self.assertTrue(
            all(task_tracker.TASK_ID.fullmatch(task_id) for task_id in task_tracker.LEGACY_DONE_WITHOUT_EVIDENCE)
        )

    def test_provenance_fields_must_be_wellformed(self):
        tracker = make_tracker(
            make_task(evidence="   ", state_changed_at="last tuesday", changed_by=7)
        )
        errors = errors_for(tracker)
        self.assertTrue(any("evidence must be a non-empty string" in error for error in errors))
        self.assertTrue(any("invalid state change timestamp" in error for error in errors))
        self.assertTrue(any("changed_by must be a non-empty string" in error for error in errors))


class WriteAtomicTests(unittest.TestCase):
    def test_write_atomic_replaces_content_and_leaves_no_temp_files(self):
        directory = tempfile.mkdtemp()
        try:
            path = Path(directory) / "tracker.json"
            task_tracker.write_atomic(path, json.dumps({"ok": True}) + "\n")
            task_tracker.write_atomic(path, json.dumps({"ok": False}) + "\n")
            self.assertEqual(path.read_text(encoding="utf-8"), json.dumps({"ok": False}) + "\n")
            self.assertEqual(list(Path(directory).iterdir()), [path])
        finally:
            shutil.rmtree(directory, ignore_errors=True)


class ServerContractTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.mkdtemp()
        self.tracker_path = Path(self.directory) / "task-tracker.json"
        self.output_path = Path(self.directory) / "TODO.md"
        self.template_path = Path(self.directory) / "TODO.template.md"
        tracker = make_tracker(
            make_task("MW-0001", state="pending"),
            make_task(
                "MW-0002",
                state="in_progress",
                status_label="Dikerjakan",
                depends_on=["MW-0001"],
                dependency_label="MW-0001",
            ),
        )
        self.write(self.tracker_path, json.dumps(tracker, ensure_ascii=False, indent=2) + "\n")
        self.write(self.output_path, "# mirror\n")
        self.write(
            self.template_path,
            "# TODO\n\n| ID | Task |\n| --- | --- |\n"
            + "".join("<!-- TASK:%s -->\n" % task["id"] for task in tracker["tasks"]),
        )
        self.server = TrackerHTTPServer(
            ("127.0.0.1", 0),
            TrackerHandler,
            tracker_path=self.tracker_path,
            template_path=self.template_path,
            output_path=self.output_path,
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        shutil.rmtree(self.directory, ignore_errors=True)

    @staticmethod
    def write(path, content):
        Path(path).write_text(content, encoding="utf-8", newline="\n")

    def request(self, method, path, body=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_address[1], timeout=3)
        request_headers = {"Host": self.server.expected_host}
        request_headers.update(headers or {})
        connection.request(
            method, path, body=None if body is None else json.dumps(body), headers=request_headers
        )
        response = connection.getresponse()
        content = response.read()
        status, etag = response.status, response.getheader("ETag")
        connection.close()
        return status, etag, (json.loads(content) if content else {})

    def post_headers(self, if_match=None):
        return {
            "Origin": self.server.origin,
            "X-Tracker-Token": self.server.csrf_token,
            "Content-Type": "application/json",
            **({"If-Match": if_match} if if_match is not None else {}),
        }

    def current_revision(self):
        return task_tracker.revision_of(self.tracker_path.read_bytes())

    def test_get_exposes_revision_and_legal_targets(self):
        status, etag, body = self.request("GET", "/api/tasks")
        self.assertEqual(status, 200)
        self.assertEqual(etag, '"%s"' % self.current_revision())
        self.assertEqual(body["revision"], self.current_revision())
        by_id = {task["id"]: task for task in body["tasks"]}
        self.assertEqual(by_id["MW-0001"]["allowed_states"], ["blocked", "in_progress"])
        self.assertEqual(by_id["MW-0001"]["evidence"], None)

    def test_post_without_if_match_is_refused_and_writes_nothing(self):
        with patch("task_tracker_server.write_atomic") as writes:
            status, _, body = self.request(
                "POST", "/api/tasks/MW-0001/state", {"state": "in_progress"}, self.post_headers()
            )
        self.assertEqual(status, 428)
        writes.assert_not_called()
        saved = json.loads(self.tracker_path.read_text(encoding="utf-8"))
        self.assertEqual(saved["tasks"][0]["state"], "pending")

    def test_stale_if_match_gets_conflict_with_fresh_data_and_no_write(self):
        with patch("task_tracker_server.write_atomic") as writes:
            status, etag, body = self.request(
                "POST",
                "/api/tasks/MW-0001/state",
                {"state": "in_progress"},
                self.post_headers('"deadbeef"'),
            )
        self.assertEqual(status, 409)
        writes.assert_not_called()
        self.assertEqual(etag, '"%s"' % self.current_revision())
        self.assertIn("error", body)
        self.assertEqual(body["revision"], self.current_revision())
        self.assertEqual(len(body["tasks"]), 2)

    def test_matching_if_match_writes_json_and_mirror(self):
        status, etag, body = self.request(
            "POST",
            "/api/tasks/MW-0001/state",
            {"state": "in_progress"},
            self.post_headers('"%s"' % self.current_revision()),
        )
        self.assertEqual(status, 200, body)
        saved = json.loads(self.tracker_path.read_text(encoding="utf-8"))
        task = next(item for item in saved["tasks"] if item["id"] == "MW-0001")
        self.assertEqual(task["state"], "in_progress")
        self.assertIsNotNone(task["state_changed_at"])
        self.assertEqual(body["revision"], self.current_revision())
        self.assertEqual(etag, '"%s"' % self.current_revision())
        self.assertIn("| MW-0001 |", self.output_path.read_text(encoding="utf-8"))

    def test_wildcard_if_match_still_refuses_an_illegal_edge(self):
        with patch("task_tracker_server.write_atomic") as writes:
            status, _, body = self.request(
                "POST",
                "/api/tasks/MW-0001/state",
                {"state": "done"},
                self.post_headers("*"),
            )
        self.assertEqual(status, 400)
        self.assertIn("pending -> done", body["error"])
        writes.assert_not_called()

    def test_done_without_evidence_is_refused_over_http(self):
        with patch("task_tracker_server.write_atomic") as writes:
            status, _, body = self.request(
                "POST",
                "/api/tasks/MW-0002/state",
                {"state": "done"},
                self.post_headers("*"),
            )
        self.assertEqual(status, 400)
        self.assertIn("is done without evidence", body["error"])
        writes.assert_not_called()

    def save(self, task_id, body, if_match="*"):
        return self.request(
            "POST", "/api/tasks/%s/state" % task_id, body, self.post_headers(if_match)
        )

    def saved_task(self, task_id):
        saved = json.loads(self.tracker_path.read_text(encoding="utf-8"))
        return next(item for item in saved["tasks"] if item["id"] == task_id)

    def test_blocked_needs_its_reason_through_http(self):
        with patch("task_tracker_server.write_atomic") as writes:
            status, _, body = self.save("MW-0001", {"state": "blocked"})
        self.assertEqual(status, 400)
        self.assertIn("names the blocker", body["error"])
        writes.assert_not_called()

        status, _, body = self.save(
            "MW-0001",
            {"state": "blocked", "status_label": "Blocked: menunggu keputusan arsitektur."},
        )
        self.assertEqual(status, 200, body)
        task = self.saved_task("MW-0001")
        self.assertEqual(task["state"], "blocked")
        self.assertEqual(task["status_label"], "Blocked: menunggu keputusan arsitektur.")

    def test_done_can_carry_its_evidence_through_http(self):
        self.write(
            self.tracker_path,
            json.dumps(
                make_tracker(
                    make_task("MW-0001", state="in_progress", status_label="Dikerjakan"),
                    make_task(
                        "MW-0002",
                        state="done",
                        status_label="Implemented",
                        evidence="pnpm test -> 214 passing",
                    ),
                ),
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
        )
        status, _, body = self.save(
            "MW-0001",
            {"state": "done", "status_label": "Implemented", "evidence": "pnpm test -> 214 passing"},
        )
        self.assertEqual(status, 200, body)
        task = self.saved_task("MW-0001")
        self.assertEqual(task["evidence"], "pnpm test -> 214 passing")
        self.assertIsNotNone(task["completed_at"])

    def test_unknown_fields_and_oversized_values_are_refused(self):
        with patch("task_tracker_server.write_atomic") as writes:
            status, _, body = self.save("MW-0001", {"state": "pending", "owner": "me"})
            self.assertEqual(status, 400)
            self.assertIn("Unknown request fields: owner", body["error"])

            status, _, body = self.save(
                "MW-0001",
                {"state": "in_progress", "status_label": "x" * 1201},
            )
            self.assertEqual(status, 400)
            self.assertIn("status_label must be at most 1200 characters", body["error"])

            status, _, body = self.save(
                "MW-0001",
                {"state": "in_progress", "evidence": "x" * 2001},
            )
            self.assertEqual(status, 400)
            self.assertIn("evidence must be at most 2000 characters", body["error"])
            writes.assert_not_called()

    def test_oversized_body_is_refused_before_parsing(self):
        huge = json.dumps(
            {"state": "in_progress", "evidence": "x" * 9000}, ensure_ascii=False
        )
        connection = http.client.HTTPConnection(
            "127.0.0.1", self.server.server_address[1], timeout=3
        )
        connection.request(
            "POST", "/api/tasks/MW-0001/state", body=huge, headers=self.post_headers("*")
        )
        response = connection.getresponse()
        status, content = response.status, response.read()
        connection.close()
        self.assertEqual(status, 413)
        self.assertIn("1 and 8192 bytes", json.loads(content)["error"])

    def test_a_save_returns_the_revision_the_next_save_must_send(self):
        first = self.current_revision()
        status, _, body = self.save(
            "MW-0001", {"state": "in_progress", "status_label": "Dikerjakan sekarang"}, first
        )
        self.assertEqual(status, 200, body)
        self.assertEqual(body["revision"], self.current_revision())
        self.assertNotEqual(body["revision"], first)

        status, _, stale_body = self.save(
            "MW-0001", {"state": "blocked", "status_label": "Blocked: x."}, first
        )
        self.assertEqual(status, 409)
        self.assertEqual(stale_body["revision"], self.current_revision())
        self.assertEqual(self.saved_task("MW-0001")["state"], "in_progress")


class CliTransitionTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.directory, True)
        self.tracker_path = Path(self.directory) / "task-tracker.json"
        self.output_path = Path(self.directory) / "TODO.md"
        self.template_path = Path(self.directory) / "TODO.template.md"
        self.catalog_path = Path(self.directory) / "requirement-catalog.json"
        self.write(self.tracker_path, self.tracker_json(make_tracker(make_task("MW-0001"))))
        self.write(self.output_path, "# mirror\n")
        self.write(self.template_path, "# TODO\n\n<!-- TASK:MW-0001 -->\n")
        self.write(self.catalog_path, json.dumps({"entries": []}))
        for name, path in (
            ("TRACKER", self.tracker_path),
            ("TEMPLATE", self.template_path),
            ("OUTPUT", self.output_path),
            ("REQUIREMENT_CATALOG", self.catalog_path),
        ):
            patcher = patch.object(task_tracker, name, str(path))
            patcher.start()
            self.addCleanup(patcher.stop)
        self.output = ""

    @staticmethod
    def tracker_json(tracker):
        return json.dumps(tracker, ensure_ascii=False, indent=2) + "\n"

    @staticmethod
    def write(path, content):
        Path(path).write_text(content, encoding="utf-8", newline="\n")

    def run_cli(self, *argv):
        buffer = io.StringIO()
        with patch.object(sys, "argv", ("task_tracker.py",) + argv), contextlib.redirect_stdout(buffer):
            code = task_tracker.main()
        self.output = buffer.getvalue()
        return code

    def test_legal_transition_is_written_to_json_and_mirror(self):
        code = self.run_cli(
            "--transition", "MW-0001", "in_progress", "--as", "bjo16", "--status-label", "Dikerjakan"
        )
        self.assertEqual(code, 0, self.output)
        saved = json.loads(self.tracker_path.read_text(encoding="utf-8"))["tasks"][0]
        self.assertEqual(saved["state"], "in_progress")
        self.assertEqual(saved["changed_by"], "bjo16")
        self.assertIsNotNone(saved["state_changed_at"])
        self.assertIn("| MW-0001 |", self.output_path.read_text(encoding="utf-8"))

    def test_dry_run_reports_without_writing(self):
        before = self.tracker_path.read_bytes()
        code = self.run_cli("--transition", "MW-0001", "in_progress", "--dry-run")
        self.assertEqual(code, 0, self.output)
        self.assertIn("DRY RUN", self.output)
        self.assertEqual(self.tracker_path.read_bytes(), before)

    def test_illegal_edge_is_reported_by_name_and_never_written(self):
        before = self.tracker_path.read_bytes()
        code = self.run_cli("--transition", "MW-0001", "done")
        self.assertEqual(code, 1)
        self.assertIn("pending -> done", self.output)
        self.assertEqual(self.tracker_path.read_bytes(), before)

    def test_completion_without_evidence_is_refused(self):
        self.write(
            self.tracker_path,
            self.tracker_json(make_tracker(make_task("MW-0001", state="in_progress", status_label="Dikerjakan"))),
        )
        before = self.tracker_path.read_bytes()
        code = self.run_cli("--transition", "MW-0001", "done", "--status-label", "Implemented")
        self.assertEqual(code, 1)
        self.assertIn("is done without evidence", self.output)
        self.assertEqual(self.tracker_path.read_bytes(), before)

        code = self.run_cli(
            "--transition",
            "MW-0001",
            "done",
            "--status-label",
            "Implemented",
            "--evidence",
            "pnpm test -> 214 passing",
        )
        self.assertEqual(code, 0, self.output)
        saved = json.loads(self.tracker_path.read_text(encoding="utf-8"))["tasks"][0]
        self.assertEqual(saved["evidence"], "pnpm test -> 214 passing")
        self.assertIsNotNone(saved["completed_at"])

    def test_a_concurrent_writer_wins_and_this_command_backs_off(self):
        real_render = task_tracker.render

        def racing(template, tracker):
            self.write(
                self.tracker_path,
                self.tracker_json(
                    make_tracker(make_task("MW-0001", state="blocked", status_label="Blocked by someone else"))
                ),
            )
            return real_render(template, tracker)

        with patch.object(task_tracker, "render", side_effect=racing):
            code = self.run_cli("--transition", "MW-0001", "in_progress")
        self.assertEqual(code, 1)
        self.assertIn("changed while this command ran", self.output)
        self.assertIn("Blocked by someone else", self.tracker_path.read_text(encoding="utf-8"))

    def test_a_tracker_that_already_fails_validation_is_not_touched(self):
        broken = make_tracker(make_task("MW-0001", state="nonsense"))
        self.write(self.tracker_path, self.tracker_json(broken))
        before = self.tracker_path.read_bytes()
        code = self.run_cli("--transition", "MW-0001", "in_progress")
        self.assertEqual(code, 1)
        self.assertIn("TRACKER ERROR", self.output)
        self.assertEqual(self.tracker_path.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
