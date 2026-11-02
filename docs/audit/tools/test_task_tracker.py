"""Focused tests for the canonical task tracker and its Markdown mirror."""

import copy
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
import task_tracker
import test_task_tracker_server


class TaskTrackerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tracker = task_tracker.load_json(task_tracker.TRACKER)
        with open(task_tracker.TEMPLATE, encoding="utf-8") as template:
            cls.template = template.read()

    def test_canonical_tracker_has_unique_ids_and_preserves_legacy_rows(self):
        self.assertGreaterEqual(len(self.tracker["tasks"]), 75)
        self.assertIn("MW-1209", {task["id"] for task in self.tracker["tasks"]})
        errors = task_tracker.validate_tracker(self.tracker)
        self.assertEqual(errors, [])
        self.assertEqual(
            len({task["id"] for task in self.tracker["tasks"]}),
            len(self.tracker["tasks"]),
        )

    def test_template_renders_all_tasks_and_preserves_dependency_labels(self):
        rendered = task_tracker.render(self.template, self.tracker)
        with open(task_tracker.OUTPUT, encoding="utf-8") as current:
            self.assertEqual(rendered, current.read())
        self.assertEqual(
            "## Ready for AI work" in rendered,
            bool(task_tracker.ai_ready_tasks(self.tracker)),
        )
        self.assertIn("## AI execution packets", rendered)
        self.assertIn("MW-1215", rendered)
        task_rows = [
            line.split("|", 2)[1].strip()
            for line in rendered.splitlines()
            if line.startswith("| MW-")
            and task_tracker.TASK_ID.fullmatch(line.split("|", 2)[1].strip())
        ]
        self.assertEqual(len(task_rows), len(self.tracker["tasks"]))
        self.assertTrue(
            any(task["dependency_label"] == "\u2014" for task in self.tracker["tasks"])
        )

    def test_ready_tasks_require_all_dependencies_to_be_done(self):
        tracker = {
            "tasks": [
                {"id": "ready", "state": "pending", "depends_on": ["completed"]},
                {"id": "completed", "state": "done", "depends_on": []},
                {"id": "waiting", "state": "proposed", "depends_on": ["blocked"]},
                {"id": "blocked", "state": "blocked", "depends_on": []},
            ]
        }
        ready_ids = {task["id"] for task in task_tracker.dependency_ready_tasks(tracker)}
        by_id = {task["id"]: task for task in tracker["tasks"]}
        self.assertEqual({"ready"}, ready_ids)
        for task_id in ready_ids:
            self.assertIn(by_id[task_id]["state"], {"proposed", "pending"})
            self.assertTrue(all(by_id[dependency]["state"] == "done" for dependency in by_id[task_id]["depends_on"]))

    def test_execution_packets_are_complete_and_reference_catalog_requirements(self):
        requirement_path = os.path.join(
            os.path.dirname(task_tracker.TRACKER), "requirement-catalog.json"
        )
        catalog = task_tracker.load_json(requirement_path)
        requirement_ids = {entry["id"] for entry in catalog["entries"]}
        entries_by_id = {entry["id"]: entry for entry in catalog["entries"]}
        packets = [
            task for task in self.tracker["tasks"] if "execution_packet" in task
        ]
        self.assertTrue(packets)
        for task in packets:
            packet = task["execution_packet"]
            self.assertTrue(packet["scope"].strip())
            self.assertTrue(packet["non_goals"])
            self.assertTrue(packet["spec_refs"])
            self.assertTrue(packet["touchpoints"])
            self.assertTrue(packet["checks"])
            self.assertTrue(packet["stop_conditions"])
            self.assertTrue(set(packet["requirement_ids"]).issubset(requirement_ids))
            for requirement_id in packet["requirement_ids"]:
                self.assertIn(task["id"], entries_by_id[requirement_id]["task_ids"])
            for reference in packet["spec_refs"]:
                source_path = reference.split("#", 1)[0]
                self.assertTrue(os.path.isfile(os.path.join(task_tracker.ROOT, source_path)))

    def test_domain_expansion_backlog_is_split_and_stays_gated(self):
        by_id = {task["id"]: task for task in self.tracker["tasks"]}
        children = [
            task for task in self.tracker["tasks"]
            if task["section"] == "PHASE 10 - D30 feature slices"
        ]
        self.assertEqual(len(children), 22)
        child_ids = {task["id"] for task in children}
        self.assertTrue(child_ids.issubset(set(by_id["MW-1001"]["depends_on"])))
        self.assertTrue(all(task["state"] == "blocked" for task in children))
        requirement_ids = [
            requirement_id
            for task in children
            for requirement_id in task["execution_packet"]["requirement_ids"]
        ]
        self.assertEqual(len(requirement_ids), 365)
        self.assertEqual(len(set(requirement_ids)), len(requirement_ids))

    def test_invalid_execution_packet_is_rejected(self):
        tracker = copy.deepcopy(self.tracker)
        task = next(item for item in tracker["tasks"] if "execution_packet" in item)
        del task["execution_packet"]["checks"]
        errors = task_tracker.validate_tracker(tracker)
        self.assertTrue(any("execution_packet fields must be exactly" in error for error in errors))

        tracker = copy.deepcopy(self.tracker)
        task = next(item for item in tracker["tasks"] if "execution_packet" in item)
        task["execution_packet"]["mode"] = "push_to_main"
        errors = task_tracker.validate_tracker(tracker)
        self.assertTrue(any("invalid execution mode" in error for error in errors))

    def test_tracker_validation_rejects_unknown_or_unlinked_requirement_ids(self):
        requirement_path = os.path.join(
            os.path.dirname(task_tracker.TRACKER), "requirement-catalog.json"
        )
        catalog = task_tracker.load_json(requirement_path)
        tracker = copy.deepcopy(self.tracker)
        task = next(
            item for item in tracker["tasks"]
            if item.get("execution_packet", {}).get("requirement_ids")
        )
        task["execution_packet"]["requirement_ids"] = ["MWREQ-99999"]
        errors = task_tracker.validate_tracker(tracker, catalog["entries"])
        self.assertTrue(any("references unknown requirement MWREQ-99999" in error for error in errors))

        tracker = copy.deepcopy(self.tracker)
        task = next(
            item for item in tracker["tasks"]
            if item.get("execution_packet", {}).get("requirement_ids")
        )
        requirement_id = task["execution_packet"]["requirement_ids"][0]
        catalog_copy = copy.deepcopy(catalog["entries"])
        entry = next(item for item in catalog_copy if item["id"] == requirement_id)
        entry["task_ids"].remove(task["id"])
        errors = task_tracker.validate_tracker(tracker, catalog_copy)
        self.assertTrue(any("is not linked from catalog requirement" in error for error in errors))

    def test_ai_queue_excludes_manual_and_gated_work(self):
        tracker = {
            "tasks": [
                {
                    "id": "ready-decision",
                    "state": "pending",
                    "depends_on": ["completed"],
                    "execution_packet": {"mode": "decision_prep"},
                },
                {"id": "completed", "state": "done", "depends_on": []},
                {
                    "id": "manual",
                    "state": "pending",
                    "depends_on": [],
                    "execution_packet": {"mode": "manual_verification"},
                },
                {
                    "id": "gated",
                    "state": "pending",
                    "depends_on": [],
                    "execution_packet": {"mode": "gated_implementation"},
                },
                {
                    "id": "waiting",
                    "state": "pending",
                    "depends_on": ["blocked"],
                    "execution_packet": {"mode": "autonomous"},
                },
                {"id": "blocked", "state": "blocked", "depends_on": []},
            ]
        }
        queue = task_tracker.ai_ready_tasks(tracker)
        by_id = {task["id"]: task for task in tracker["tasks"]}
        self.assertEqual(["ready-decision"], [task["id"] for task in queue])
        for task in queue:
            self.assertIn(task["execution_packet"]["mode"], {"autonomous", "decision_prep"})
            self.assertTrue(all(by_id[dependency]["state"] == "done" for dependency in task["depends_on"]))

    def test_ai_queue_can_be_empty_when_no_eligible_work_is_ready(self):
        tracker = {
            "tasks": [
                {
                    "id": "manual",
                    "state": "pending",
                    "depends_on": [],
                    "execution_packet": {"mode": "manual_verification"},
                },
                {
                    "id": "waiting",
                    "state": "pending",
                    "depends_on": ["blocked"],
                    "execution_packet": {"mode": "autonomous"},
                },
                {"id": "blocked", "state": "blocked", "depends_on": []},
            ]
        }
        self.assertEqual([], task_tracker.ai_ready_tasks(tracker))

    def test_missing_dependency_and_cycle_are_rejected(self):
        tracker = copy.deepcopy(self.tracker)
        first, second = tracker["tasks"][:2]
        first["depends_on"] = [second["id"]]
        second["depends_on"] = [first["id"]]
        errors = task_tracker.validate_tracker(tracker)
        self.assertTrue(any("dependency cycle" in error for error in errors))

        tracker["tasks"][0]["depends_on"] = ["MW-9999"]
        errors = task_tracker.validate_tracker(tracker)
        self.assertTrue(any("depends on missing task MW-9999" in error for error in errors))

    def test_duplicate_ids_and_invalid_completion_dates_are_rejected(self):
        tracker = copy.deepcopy(self.tracker)
        tracker["tasks"][1]["id"] = tracker["tasks"][0]["id"]
        errors = task_tracker.validate_tracker(tracker)
        self.assertTrue(any("duplicate task ID" in error for error in errors))

        tracker = copy.deepcopy(self.tracker)
        tracker["tasks"][0]["completed_at"] = "not-a-date"
        errors = task_tracker.validate_tracker(tracker)
        self.assertTrue(any("invalid completion timestamp" in error for error in errors))

    def test_unrecorded_completion_dates_remain_unset(self):
        completed_without_date = [
            task
            for task in self.tracker["tasks"]
            if task["state"] == "done" and task["completed_at"] is None
        ]
        self.assertTrue(completed_without_date)


if __name__ == "__main__":
    suite = unittest.TestSuite()
    loader = unittest.defaultTestLoader
    suite.addTests(loader.loadTestsFromModule(sys.modules[__name__]))
    suite.addTests(loader.loadTestsFromModule(test_task_tracker_server))
    result = unittest.TextTestRunner().run(suite)
    sys.exit(not result.wasSuccessful())
