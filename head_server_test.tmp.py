"""Tests for state transitions and the loopback task tracker server."""

import copy
import http.client
import json
import os
from pathlib import Path
import sys
import threading
import unittest
from unittest.mock import patch
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(__file__))
import task_tracker
from task_tracker_server import TrackerHandler, TrackerHTTPServer


class TrackerStateTransitionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tracker = task_tracker.load_json(task_tracker.TRACKER)

    def test_state_transition_preserves_label_and_existing_timestamp(self):
        tracker = copy.deepcopy(self.tracker)
        task = tracker["tasks"][0]
        task["state"] = "pending"
        task["status_label"] = "Owner verification pending"
        task["completed_at"] = "2026-10-30T12:00:00Z"

        updated = task_tracker.transition_task_state(
            tracker, task["id"], "done", "2026-11-01T12:00:00Z"
        )

        self.assertEqual(updated["tasks"][0]["status_label"], "Owner verification pending")
        self.assertEqual(updated["tasks"][0]["completed_at"], "2026-10-30T12:00:00Z")
        self.assertEqual(tracker["tasks"][0]["state"], "pending")

    def test_entering_done_records_known_utc_time_and_reopening_preserves_it(self):
        tracker = copy.deepcopy(self.tracker)
        task = tracker["tasks"][0]
        task["state"] = "in_progress"
        task["completed_at"] = None

        completed = task_tracker.transition_task_state(
            tracker, task["id"], "done", "2026-11-01T12:00:00Z"
        )
        reopened = task_tracker.transition_task_state(
            completed, task["id"], "pending"
        )

        self.assertEqual(completed["tasks"][0]["completed_at"], "2026-11-01T12:00:00Z")
        self.assertEqual(reopened["tasks"][0]["completed_at"], "2026-11-01T12:00:00Z")

    def test_invalid_state_and_unknown_task_are_rejected(self):
        with self.assertRaises(ValueError):
            task_tracker.transition_task_state(self.tracker, "MW-0501", "unknown")
        with self.assertRaises(KeyError):
            task_tracker.transition_task_state(self.tracker, "MW-9999", "done")


class TrackerHTTPTests(unittest.TestCase):
    def setUp(self):
        self.server = TrackerHTTPServer(("127.0.0.1", 0), TrackerHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_address[1]

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def request(self, method, path, body=None, headers=None, host=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=3)
        request_headers = {"Host": host or "127.0.0.1:%d" % self.port}
        if headers:
            request_headers.update(headers)
        payload = None if body is None else json.dumps(body)
        connection.request(method, path, body=payload, headers=request_headers)
        response = connection.getresponse()
        content = response.read()
        connection.close()
        return response.status, response.getheader("Content-Type"), content

    def post_headers(self):
        return {
            "Origin": self.server.origin,
            "X-Tracker-Token": self.server.csrf_token,
            "Content-Type": "application/json",
        }

    def test_get_serves_ui_and_validated_tasks(self):
        status, content_type, html = self.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertTrue(content_type.startswith("text/html"))
        self.assertIn(self.server.csrf_token.encode(), html)

        status, _, body = self.request("GET", "/api/tasks")
        self.assertEqual(status, 200)
        response = json.loads(body)
        self.assertEqual(len(response["tasks"]), len(self.server_tasks()))
        by_id = {task["id"]: task for task in response["tasks"]}
        self.assertIn("execution_packet", by_id["MW-1215"])
        self.assertNotIn("MW-0602", response["ai_ready_task_ids"])
        self.assertNotIn("MW-0558", response["ai_ready_task_ids"])
        self.assertNotIn("MW-1215", response["ai_ready_task_ids"])

    def test_update_changes_only_state_data_and_renders_markdown(self):
        task = next(
            item for item in self.server_tasks() if item["id"] == "MW-1209"
        )
        original_label = task["status_label"]
        captured_writes = {}
        with patch(
            "task_tracker_server.write_atomic",
            side_effect=lambda path, content: captured_writes.update(
                {Path(path): content}
            ),
        ):
            status, _, body = self.request(
                "POST",
                "/api/tasks/%s/state" % quote(task["id"]),
                {"state": "pending"},
                self.post_headers(),
            )

        self.assertEqual(status, 200, body.decode())
        saved = json.loads(captured_writes[self.server.tracker_path])
        updated = next(item for item in saved["tasks"] if item["id"] == task["id"])
        self.assertEqual(updated["state"], "pending")
        self.assertEqual(updated["status_label"], original_label)
        template = self.server.template_path.read_text(encoding="utf-8")
        self.assertEqual(
            captured_writes[self.server.output_path],
            task_tracker.render(template, saved),
        )

    def test_post_rejects_cross_origin_and_invalid_state(self):
        task_id = self.server_tasks()[0]["id"]
        headers = self.post_headers()
        headers["Origin"] = "http://evil.example"
        status, _, _ = self.request(
            "POST", "/api/tasks/%s/state" % task_id, {"state": "done"}, headers
        )
        self.assertEqual(status, 403)

        status, _, _ = self.request(
            "POST",
            "/api/tasks/%s/state" % task_id,
            {"state": "invalid"},
            self.post_headers(),
        )
        self.assertEqual(status, 400)

    def test_post_requires_token_and_exact_host(self):
        task_id = self.server_tasks()[0]["id"]
        status, _, _ = self.request(
            "POST",
            "/api/tasks/%s/state" % task_id,
            {"state": "done"},
            {"Origin": self.server.origin, "Content-Type": "application/json"},
        )
        self.assertEqual(status, 403)

        status, _, _ = self.request("GET", "/", host="localhost:%d" % self.port)
        self.assertEqual(status, 403)

    def server_tasks(self):
        return task_tracker.load_json(self.server.tracker_path)["tasks"]


if __name__ == "__main__":
    unittest.main()
