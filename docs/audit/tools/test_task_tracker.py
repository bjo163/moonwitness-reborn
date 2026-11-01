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
        self.assertEqual(len(self.tracker["tasks"]), 75)
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
        task_rows = [
            line.split("|", 2)[1].strip()
            for line in rendered.splitlines()
            if line.startswith("| MW-")
            and task_tracker.TASK_ID.fullmatch(line.split("|", 2)[1].strip())
        ]
        self.assertEqual(len(task_rows), 75)
        self.assertTrue(
            any(task["dependency_label"] == "\u2014" for task in self.tracker["tasks"])
        )

    def test_ready_tasks_require_all_dependencies_to_be_done(self):
        ready_ids = {task["id"] for task in task_tracker.dependency_ready_tasks(self.tracker)}
        by_id = {task["id"]: task for task in self.tracker["tasks"]}
        self.assertTrue(ready_ids)
        for task_id in ready_ids:
            self.assertIn(by_id[task_id]["state"], {"proposed", "pending"})
            self.assertTrue(all(by_id[dependency]["state"] == "done" for dependency in by_id[task_id]["depends_on"]))

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
