"""Serve a loopback-only browser UI for editing canonical task states.

Writes here are a mitigation, not a lock: there is no mutual exclusion against
another process editing the JSON. The sanctioned single-writer path is
`python -B docs/audit/tools/task_tracker.py --transition`, and `in_progress` is a
human-visible claim. The tracker JSON is authoritative; a stale TODO.md is
detected by `--check` and repaired by `pnpm tracker:render`.
"""

import argparse
import hmac
import json
from pathlib import Path
import secrets
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

import task_tracker


ASSET_ROOT = Path(__file__).with_name("task-tracker-ui")
MAX_BODY_BYTES = 8192

# test_task_tracker_server.py patches this module attribute, so the alias stays even
# though the implementation now lives in task_tracker.
write_atomic = task_tracker.write_atomic
revision_of = task_tracker.revision_of


def tag_of(revision):
    return '"%s"' % revision


def bare_tag(value):
    return value.strip().strip('"')


class TrackerHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, address, handler, tracker_path=None, template_path=None, output_path=None):
        super().__init__(address, handler)
        self.tracker_path = Path(tracker_path or task_tracker.TRACKER)
        self.template_path = Path(template_path or task_tracker.TEMPLATE)
        self.output_path = Path(output_path or task_tracker.OUTPUT)
        self.csrf_token = secrets.token_urlsafe(32)
        self.write_lock = threading.Lock()

    @property
    def origin(self):
        return "http://127.0.0.1:%d" % self.server_address[1]

    @property
    def expected_host(self):
        return "127.0.0.1:%d" % self.server_address[1]


class TrackerHandler(BaseHTTPRequestHandler):
    server_version = "MoonWitnessTracker/1.0"
    sys_version = ""

    def _send(self, status, content, content_type, extra_headers=None):
        body = content.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'none'; script-src 'self'; style-src 'self'; "
            "connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
        )
        for name, value in (extra_headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status, value, extra_headers=None):
        self._send(
            status,
            json.dumps(value, ensure_ascii=False),
            "application/json; charset=utf-8",
            extra_headers,
        )

    def _same_host(self):
        return self.headers.get("Host") == self.server.expected_host

    def _read_tracker(self):
        source = self.server.tracker_path.read_bytes()
        value = json.loads(source)
        catalog = task_tracker.load_json(task_tracker.REQUIREMENT_CATALOG)
        entries = catalog.get("entries", [])
        errors = task_tracker.validate_tracker(value, entries)
        if errors:
            raise ValueError("Invalid canonical task tracker: " + "; ".join(errors))
        return source, value, entries

    def _tasks_response(self, tracker, revision):
        tasks = [
            {
                "id": task["id"],
                "title": task["title"],
                "section": task["section"],
                "state": task["state"],
                "status_label": task["status_label"],
                "owner": task["owner"],
                "depends_on": task["depends_on"],
                "acceptance_criteria": task["acceptance_criteria"],
                "execution_packet": task.get("execution_packet"),
                "completed_at": task["completed_at"],
                "evidence": task.get("evidence"),
                "allowed_states": task_tracker.allowed_target_states(task),
            }
            for task in tracker["tasks"]
        ]
        return {
            "revision": revision,
            "tasks": tasks,
            "ready_task_ids": [
                task["id"] for task in task_tracker.dependency_ready_tasks(tracker)
            ],
            "ai_ready_task_ids": [
                task["id"] for task in task_tracker.ai_ready_tasks(tracker)
            ],
            "states": {
                state: sum(task["state"] == state for task in tasks)
                for state in sorted(task_tracker.VALID_STATES)
            },
        }

    def do_GET(self):
        if not self._same_host():
            self._send_json(403, {"error": "Use the printed 127.0.0.1 URL."})
            return

        path = urlsplit(self.path).path
        if path == "/":
            content = (ASSET_ROOT / "index.html").read_text(encoding="utf-8")
            content = content.replace("__TRACKER_TOKEN__", self.server.csrf_token)
            self._send(200, content, "text/html; charset=utf-8")
            return
        if path == "/api/tasks":
            try:
                source, tracker, _ = self._read_tracker()
            except (OSError, json.JSONDecodeError, ValueError) as error:
                self._send_json(500, {"error": str(error)})
                return
            revision = revision_of(source)
            self._send_json(200, self._tasks_response(tracker, revision), {"ETag": tag_of(revision)})
            return
        assets = {
            "/app.js": ("app.js", "text/javascript; charset=utf-8"),
            "/styles.css": ("styles.css", "text/css; charset=utf-8"),
        }
        asset = assets.get(path)
        if asset:
            try:
                content = (ASSET_ROOT / asset[0]).read_text(encoding="utf-8")
            except OSError as error:
                self._send_json(500, {"error": "Could not read UI asset: %s" % error})
                return
            self._send(200, content, asset[1])
            return
        self._send_json(404, {"error": "Not found."})

    def do_POST(self):
        if not self._same_host():
            self._send_json(403, {"error": "Unexpected host."})
            return
        if self.headers.get("Origin") != self.server.origin:
            self._send_json(403, {"error": "Cross-origin changes are not allowed."})
            return
        supplied_token = self.headers.get("X-Tracker-Token", "")
        if not hmac.compare_digest(supplied_token, self.server.csrf_token):
            self._send_json(403, {"error": "Tracker session token is invalid; reload the page."})
            return
        if self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower() != "application/json":
            self._send_json(415, {"error": "Content-Type must be application/json."})
            return

        path = unquote(urlsplit(self.path).path)
        prefix = "/api/tasks/"
        suffix = "/state"
        if not path.startswith(prefix) or not path.endswith(suffix):
            self._send_json(404, {"error": "Not found."})
            return
        task_id = path[len(prefix):-len(suffix)]
        length_value = self.headers.get("Content-Length", "")
        if not length_value.isdecimal():
            self._send_json(400, {"error": "Content-Length is required."})
            return
        body_length = int(length_value)
        if body_length < 1 or body_length > MAX_BODY_BYTES:
            self._send_json(
                413,
                {"error": "Request body must be between 1 and %d bytes." % MAX_BODY_BYTES},
            )
            return
        try:
            body = json.loads(self.rfile.read(body_length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(400, {"error": "Request body must be valid JSON."})
            return
        if not isinstance(body, dict) or not isinstance(body.get("state"), str):
            self._send_json(400, {"error": "Request body must contain a string 'state'."})
            return
        unknown = sorted(set(body) - {"state", "status_label", "evidence"})
        if unknown:
            self._send_json(400, {"error": "Unknown request fields: %s" % ", ".join(unknown)})
            return
        for field in ("status_label", "evidence"):
            value = body.get(field)
            if value is None:
                continue
            if not isinstance(value, str):
                self._send_json(400, {"error": "%s must be a string." % field})
                return
            if len(value) > task_tracker.MAX_LENGTHS[field]:
                self._send_json(
                    400,
                    {"error": "%s must be at most %d characters." % (field, task_tracker.MAX_LENGTHS[field])},
                )
                return

        if_match = self.headers.get("If-Match", "")
        if not if_match.strip():
            self._send_json(
                428,
                {"error": "Send If-Match with the revision from GET /api/tasks."},
            )
            return

        with self.server.write_lock:
            try:
                source, tracker, catalog_entries = self._read_tracker()
                revision = revision_of(source)
                client_revision = bare_tag(if_match)
                if client_revision != "*" and client_revision != revision:
                    stale = self._tasks_response(tracker, revision)
                    stale["error"] = (
                        "Another change landed first; the tasks below are current. "
                        "Nothing was written."
                    )
                    self._send_json(409, stale, {"ETag": tag_of(revision)})
                    return
                updated = task_tracker.transition_task_state(
                    tracker,
                    task_id,
                    body["state"],
                    task_tracker.utc_stamp(),
                    status_label=body.get("status_label"),
                    evidence=body.get("evidence"),
                )
                errors = task_tracker.validate_tracker(updated, catalog_entries)
                if errors:
                    self._send_json(400, {"error": "; ".join(errors)})
                    return
                template = self.server.template_path.read_text(encoding="utf-8")
                rendered = task_tracker.render(template, updated)
                if revision_of(self.server.tracker_path.read_bytes()) != revision:
                    self._send_json(409, {"error": "Tracker changed concurrently; reload and retry."})
                    return
                serialized = json.dumps(updated, ensure_ascii=False, indent=2) + "\n"
                write_atomic(self.server.tracker_path, serialized)
                write_atomic(self.server.output_path, rendered)
            except KeyError as error:
                self._send_json(404, {"error": str(error)})
                return
            except ValueError as error:
                self._send_json(400, {"error": str(error)})
                return
            except (OSError, json.JSONDecodeError) as error:
                self._send_json(
                    500,
                    {
                        "error": (
                            "Could not finish saving the tracker and TODO.md: %s. "
                            "The canonical JSON may already be updated; reload and run "
                            "pnpm tracker:render before continuing."
                        )
                        % error
                    },
                )
                return
        new_revision = revision_of(serialized.encode("utf-8"))
        self._send_json(
            200,
            self._tasks_response(updated, new_revision),
            {"ETag": tag_of(new_revision)},
        )

    def log_message(self, format_string, *args):
        print("%s - %s" % (self.address_string(), format_string % args))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765, help="loopback port (0 selects an available port)")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("--port must be between 0 and 65535")

    try:
        server = TrackerHTTPServer(("127.0.0.1", args.port), TrackerHandler)
    except OSError as error:
        parser.exit(1, "Could not start the local task tracker: %s\n" % error)
    print("Task tracker UI: %s/" % server.origin, flush=True)
    print("Bound to 127.0.0.1 only. Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping task tracker UI.", flush=True)
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
