import contextlib
import copy
import io
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import requirement_coverage_gate as gate
import requirements_traceability_gate as trace_gate


ROOT = Path(gate.ROOT)


class RequirementCoverageGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(gate.CATALOG, encoding="utf-8") as source:
            cls.catalog = json.load(source)

    def test_baseline_catalog_passes(self):
        self.assertEqual(gate.validate_catalog(self.catalog, gate.ROOT), [])

    def test_missing_requirement_fails_inventory_integrity(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["entries"].pop()
        failures = gate.validate_catalog(catalog, gate.ROOT)
        self.assertTrue(any("entry count" in failure for failure in failures))
        self.assertTrue(any("digest" in failure for failure in failures))

    def test_duplicate_requirement_id_fails(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["entries"][1]["id"] = catalog["entries"][0]["id"]
        failures = gate.validate_catalog(catalog, gate.ROOT)
        self.assertTrue(any("duplicate requirement ID" in failure for failure in failures))

    def test_missing_canonical_home_fails(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["entries"][0]["canonical_home"] = "docs/missing-spec.md"
        failures = gate.validate_catalog(catalog, gate.ROOT)
        self.assertTrue(any("missing canonical document" in failure for failure in failures))

    def test_unknown_task_fails(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["entries"][0]["task_ids"] = ["MW-9999"]
        failures = gate.validate_catalog(catalog, gate.ROOT)
        self.assertTrue(any("unknown TODO task" in failure for failure in failures))

    def test_unknown_evidence_state_fails(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["entries"][0]["implementation_status"] = "DONE"
        failures = gate.validate_catalog(catalog, gate.ROOT)
        self.assertTrue(any("invalid implementation status" in failure for failure in failures))

    def test_unverified_status_is_rejected(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["entries"][0]["implementation_status"] = "UNVERIFIED"
        failures = gate.validate_catalog(catalog, gate.ROOT)
        self.assertTrue(any("invalid implementation status" in failure for failure in failures))

    def test_implementation_review_does_not_change_source_inventory_digest(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["entries"][0]["implementation_status"] = "UNKNOWN"
        catalog["entries"][0]["implementation_review_basis"] = "No direct code/test evidence."
        self.assertEqual(gate.validate_catalog(catalog, gate.ROOT), [])

    def test_source_statement_change_fails_inventory_integrity(self):
        catalog = copy.deepcopy(self.catalog)
        catalog["entries"][0]["statement"] += " changed"
        failures = gate.validate_catalog(catalog, gate.ROOT)
        self.assertTrue(any("digest" in failure for failure in failures))

    def test_missing_implementation_review_basis_fails(self):
        catalog = copy.deepcopy(self.catalog)
        del catalog["entries"][0]["implementation_review_basis"]
        failures = gate.validate_catalog(catalog, gate.ROOT)
        self.assertTrue(any("no implementation review basis" in failure for failure in failures))

    def test_gate_runs_without_the_legacy_source_file(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            catalog_path = root / "docs" / "governance" / "requirement-catalog.json"
            shutil.copytree(ROOT / "docs", root / "docs")
            for relative in ("TODO.md", "BLUEPRINT.md", "MASTER_DESIGN.md"):
                shutil.copy2(ROOT / relative, root / relative)

            self.assertFalse((root / "masterprompt.md").exists())
            output = io.StringIO()
            with patch.object(gate, "ROOT", str(root)), patch.object(
                gate, "CATALOG", str(catalog_path)
            ), contextlib.redirect_stdout(output):
                result = gate.main()
            self.assertEqual(result, 0, output.getvalue())
            self.assertIn("GATE: PASS", output.getvalue())

    def test_crosswalk_gate_runs_without_the_legacy_source_file(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copytree(ROOT / "docs", root / "docs")
            for relative in ("TODO.md", "BLUEPRINT.md", "MASTER_DESIGN.md"):
                shutil.copy2(ROOT / relative, root / relative)
            workflow = root / ".github" / "workflows"
            workflow.mkdir(parents=True)
            shutil.copy2(ROOT / ".github" / "workflows" / "ci.yml", workflow / "ci.yml")

            self.assertFalse((root / "masterprompt.md").exists())
            output = io.StringIO()
            with (
                patch.object(trace_gate, "ROOT", str(root)),
                patch.object(trace_gate, "CATALOG", str(root / "docs" / "governance" / "requirement-catalog.json")),
                patch.object(trace_gate, "REGISTRY", str(root / "docs" / "architecture" / "DOMAIN_OWNERSHIP_AND_DEPENDENCIES.md")),
                patch.object(trace_gate, "MATRIX", str(root / "docs" / "audit" / "REPOSITORY_CAPABILITY_MATRIX.md")),
                patch.object(trace_gate, "REGISTER", str(root / "docs" / "audit" / "DELIVERABLE_REGISTER.md")),
                patch.object(trace_gate, "RECON", str(root / "docs" / "audit" / "ARCHITECTURE_AND_DOCUMENTATION_RECONCILIATION.md")),
                patch.object(trace_gate, "TODO", str(root / "TODO.md")),
                patch.object(trace_gate, "REPORT", str(root / "docs" / "audit" / "PROMPT_COVERAGE_AND_STEP8_REPORT.md")),
                patch.object(trace_gate, "TRACE", str(root / "docs" / "governance" / "REQUIREMENTS_TRACEABILITY.md")),
                contextlib.redirect_stdout(output),
            ):
                result = trace_gate.main()
            self.assertEqual(result, 0, output.getvalue())
            self.assertIn("GATE: PASS", output.getvalue())


if __name__ == "__main__":
    unittest.main()
