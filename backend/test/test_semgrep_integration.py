"""
Tests for Semgrep static analysis integration in the /submit endpoint
and GET /api/semgrep/<project_id> retrieval endpoint.

Run from the project root:
    python -m pytest backend/test/test_semgrep_integration.py -v
"""
import io
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# Ensure project root is on sys.path so `import backend.*` works
# ---------------------------------------------------------------------------
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)


# ---------------------------------------------------------------------------
# Unit tests for the analysis module itself (no Flask, no Ray)
# ---------------------------------------------------------------------------

class TestSemgrepModule(unittest.TestCase):
    """Tests for backend/analysis/semgrep.py in isolation."""

    def test_semgrep_findings_returns_list_for_empty_results(self):
        """semgrep_findings should return an empty list when there are no hits."""
        from backend.analysis.semgrep import semgrep_findings, SemgrepError

        fake_json = json.dumps({"results": [], "errors": []})

        with patch("backend.analysis.semgrep.shutil.which", return_value="/usr/bin/semgrep"), \
             patch("backend.analysis.semgrep.os.path.exists", return_value=True), \
             patch("backend.analysis.semgrep.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                stdout=fake_json, stderr="", returncode=0
            )
            findings = semgrep_findings("dummy.py", config="p/security-audit")

        self.assertIsInstance(findings, list)
        self.assertEqual(len(findings), 0)

    def test_semgrep_findings_parses_single_finding(self):
        """semgrep_findings should parse severity, message, line numbers correctly."""
        from backend.analysis.semgrep import semgrep_findings

        result_payload = {
            "results": [
                {
                    "check_id": "python.lang.security.dangerous-exec",
                    "path": "upload.py",
                    "start": {"line": 10, "col": 1},
                    "end": {"line": 10, "col": 20},
                    "extra": {
                        "message": "Use of exec() is dangerous",
                        "severity": "ERROR",
                        "confidence": "HIGH",
                        "metadata": {"category": "security"},
                    },
                }
            ],
            "errors": [],
        }
        fake_json = json.dumps(result_payload)

        with patch("backend.analysis.semgrep.shutil.which", return_value="/usr/bin/semgrep"), \
             patch("backend.analysis.semgrep.os.path.exists", return_value=True), \
             patch("backend.analysis.semgrep.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                stdout=fake_json, stderr="", returncode=1
            )
            findings = semgrep_findings("upload.py")

        self.assertEqual(len(findings), 1)
        f = findings[0]
        self.assertEqual(f.rule_id, "python.lang.security.dangerous-exec")
        self.assertEqual(f.severity, "ERROR")
        self.assertEqual(f.confidence, "HIGH")
        self.assertEqual(f.start_line, 10)
        self.assertEqual(f.message, "Use of exec() is dangerous")

    def test_semgrep_findings_raises_when_binary_missing(self):
        """semgrep_findings should raise SemgrepError if semgrep is not on PATH."""
        from backend.analysis.semgrep import semgrep_findings, SemgrepError

        with patch("backend.analysis.semgrep.shutil.which", return_value=None), \
             patch("backend.analysis.semgrep.os.path.exists", return_value=True):
            with self.assertRaises(SemgrepError):
                semgrep_findings("upload.py")

    def test_semgrep_findings_raises_for_missing_file(self):
        """semgrep_findings should raise FileNotFoundError for a nonexistent path."""
        from backend.analysis.semgrep import semgrep_findings

        with self.assertRaises(FileNotFoundError):
            semgrep_findings("/does/not/exist/upload.py")

    def test_run_semgrep_analysis_raises_on_timeout(self):
        """run_semgrep_analysis should raise SemgrepError on timeout."""
        import subprocess
        from backend.analysis.semgrep import run_semgrep_analysis, SemgrepError

        with patch("backend.analysis.semgrep.shutil.which", return_value="/usr/bin/semgrep"), \
             patch("backend.analysis.semgrep.os.path.exists", return_value=True), \
             patch("backend.analysis.semgrep.subprocess.run",
                   side_effect=subprocess.TimeoutExpired(cmd="semgrep", timeout=5)):
            with self.assertRaises(SemgrepError) as ctx:
                run_semgrep_analysis("upload.py")
        self.assertIn("timed out", str(ctx.exception).lower())

    def test_run_semgrep_analysis_raises_on_bad_json(self):
        """run_semgrep_analysis should raise SemgrepError on non-JSON stdout."""
        from backend.analysis.semgrep import run_semgrep_analysis, SemgrepError

        with patch("backend.analysis.semgrep.shutil.which", return_value="/usr/bin/semgrep"), \
             patch("backend.analysis.semgrep.os.path.exists", return_value=True), \
             patch("backend.analysis.semgrep.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                stdout="not valid json", stderr="", returncode=2
            )
            with self.assertRaises(SemgrepError):
                run_semgrep_analysis("upload.py")


# ---------------------------------------------------------------------------
# Integration tests: Flask routes that exercise semgrep logic
# ---------------------------------------------------------------------------

def _make_submit_form(py_code: str = "def main(row): return row") -> dict:
    """Build a multipart form payload dict for POST /submit."""
    py_bytes = py_code.encode()
    csv_bytes = b"x\n1\n2\n"
    return {
        "title": "Test Project",
        "description": "integration test",
        "tags": "science",
        "why_join": "help science",
        "learn_more": "[]",
        "chunk_size": "100",
        "replication_factor": "1",
        "max_verification_attempts": "1",
        "user_id": "researcher1",
        "py_file": (io.BytesIO(py_bytes), "upload.py"),
        "data_file": (io.BytesIO(csv_bytes), "data.csv"),
    }


def _install_ray_mocks():
    """
    Inject MagicMock stubs for the full ray package tree before any app
    module is imported. app.py / server.py / api.py all import ray submodules
    at the module level, which means the stubs must be in sys.modules before
    the first `import backend.app`.
    """
    ray_submodules = [
        "ray",
        "ray.util",
        "ray.util.scheduling_strategies",
        "ray.runtime_context",
        "ray.remote_function",
        "ray.actor",
        "ray.exceptions",
        "ray._private",
        "ray._private.worker",
    ]
    for name in ray_submodules:
        if name not in sys.modules:
            sys.modules[name] = MagicMock()

    # Ensure top-level ray attributes tests rely on are present
    ray_mock = sys.modules["ray"]
    ray_mock.is_initialized.return_value = False
    ray_mock.nodes.return_value = []
    # NodeAffinitySchedulingStrategy is imported from ray.util.scheduling_strategies
    sys.modules["ray.util.scheduling_strategies"].NodeAffinitySchedulingStrategy = MagicMock()


# Install before any backend.app import happens
_install_ray_mocks()


class TestSubmitSemgrepIntegration(unittest.TestCase):
    """Tests for semgrep integration via the Flask /submit endpoint."""

    @classmethod
    def setUpClass(cls):
        """Import is already safe because _install_ray_mocks() ran at module load."""
        pass

    def _get_app(self):
        """Return a fresh Flask test client each time (re-importing reuses module state)."""
        import backend.app as app_module
        app_module.app.config["TESTING"] = True
        return app_module.app.test_client(), app_module

    def _patch_auth(self, app_module, researcher_id="researcher1"):
        """Return patches that make the auth checks pass."""
        user_ns = MagicMock()
        user_ns.role = "researcher"

        p1 = patch.object(app_module, "get_user_by_id", return_value=user_ns)
        p2 = patch.object(app_module, "user_has_role", return_value=True)
        return p1, p2

    def _patch_api_submit(self, app_module, project_id="proj-abc123"):
        """Patch api.submit_uploaded_project and api.start_ray_head."""
        p1 = patch.object(
            app_module.api, "submit_uploaded_project",
            return_value=(0, "run-1", project_id, 2),
        )
        p2 = patch.object(app_module.api, "start_ray_head", return_value="127.0.0.1")
        return p1, p2

    def test_submit_includes_semgrep_clean(self):
        """A project with no findings returns semgrep_scan.status=completed, 0 findings."""
        client, app_module = self._get_app()

        p_auth1, p_auth2 = self._patch_auth(app_module)
        p_sub1, p_sub2 = self._patch_api_submit(app_module, project_id="proj-clean")

        clean_patch = patch(
            "backend.app.semgrep_findings",
            return_value=[],
        )

        with p_auth1, p_auth2, p_sub1, p_sub2, clean_patch:
            resp = client.post(
                "/submit",
                data=_make_submit_form(),
                content_type="multipart/form-data",
            )

        self.assertEqual(resp.status_code, 200)
        body = resp.get_json()
        self.assertIn("semgrep_scan", body)
        scan = body["semgrep_scan"]
        self.assertEqual(scan["status"], "completed")
        self.assertEqual(scan["findings_count"], 0)
        self.assertFalse(scan["has_high_severity"])
        self.assertEqual(scan["findings"], [])

    def test_submit_blocked_with_findings(self):
        """A project with findings is rejected with 400 and the scan is included."""
        from backend.analysis.semgrep import SemgrepFinding

        client, app_module = self._get_app()
        p_auth1, p_auth2 = self._patch_auth(app_module)
        p_sub1, p_sub2 = self._patch_api_submit(app_module, project_id="proj-dirty")

        mock_finding = SemgrepFinding(
            rule_id="python.lang.security.exec-use",
            message="Dangerous use of exec()",
            path="/tmp/upload.py",
            start_line=5,
            end_line=5,
            start_col=1,
            end_col=20,
            severity="ERROR",
            confidence="HIGH",
        )

        findings_patch = patch(
            "backend.app.semgrep_findings",
            return_value=[mock_finding],
        )

        with p_auth1, p_auth2, p_sub1, p_sub2, findings_patch:
            resp = client.post(
                "/submit",
                data=_make_submit_form("import os\nexec(os.environ['CMD'])"),
                content_type="multipart/form-data",
            )

        self.assertEqual(resp.status_code, 400)
        body = resp.get_json()
        self.assertIn("error", body)
        self.assertIn("semgrep_scan", body)
        scan = body["semgrep_scan"]
        self.assertEqual(scan["status"], "completed")
        self.assertEqual(scan["findings_count"], 1)
        self.assertTrue(scan["has_high_severity"])
        finding = scan["findings"][0]
        self.assertEqual(finding["rule_id"], "python.lang.security.exec-use")
        self.assertEqual(finding["severity"], "ERROR")
        self.assertEqual(finding["start_line"], 5)

    def test_submit_graceful_when_semgrep_not_installed(self):
        """Submission succeeds even when semgrep binary is missing."""
        from backend.analysis.semgrep import SemgrepError

        client, app_module = self._get_app()
        p_auth1, p_auth2 = self._patch_auth(app_module)
        p_sub1, p_sub2 = self._patch_api_submit(app_module, project_id="proj-noscanner")

        semgrep_patch = patch(
            "backend.app.semgrep_findings",
            side_effect=SemgrepError("semgrep binary not found"),
        )

        with p_auth1, p_auth2, p_sub1, p_sub2, semgrep_patch:
            resp = client.post(
                "/submit",
                data=_make_submit_form(),
                content_type="multipart/form-data",
            )

        self.assertEqual(resp.status_code, 200)
        body = resp.get_json()
        scan = body["semgrep_scan"]
        self.assertEqual(scan["status"], "skipped")
        self.assertEqual(scan["findings_count"], 0)
        self.assertFalse(scan["has_high_severity"])
        self.assertIn("semgrep binary not found", scan["reason"])

    def test_submit_graceful_on_unexpected_semgrep_error(self):
        """Submission succeeds even when semgrep raises an unexpected exception."""
        client, app_module = self._get_app()
        p_auth1, p_auth2 = self._patch_auth(app_module)
        p_sub1, p_sub2 = self._patch_api_submit(app_module, project_id="proj-crashscan")

        semgrep_patch = patch(
            "backend.app.semgrep_findings",
            side_effect=RuntimeError("unexpected crash"),
        )

        with p_auth1, p_auth2, p_sub1, p_sub2, semgrep_patch:
            resp = client.post(
                "/submit",
                data=_make_submit_form(),
                content_type="multipart/form-data",
            )

        self.assertEqual(resp.status_code, 200)
        body = resp.get_json()
        scan = body["semgrep_scan"]
        self.assertEqual(scan["status"], "error")
        self.assertEqual(scan["findings_count"], 0)

    def test_get_semgrep_endpoint_returns_cached_scan(self):
        """GET /api/semgrep/<project_id> returns the scan stored during submit."""
        client, app_module = self._get_app()
        project_id = "proj-retrieve-test"

        # Pre-populate the cache directly
        app_module._project_semgrep_cache[project_id] = {
            "status": "completed",
            "findings_count": 0,
            "has_high_severity": False,
            "findings": [],
        }

        resp = client.get(f"/api/semgrep/{project_id}")
        self.assertEqual(resp.status_code, 200)
        body = resp.get_json()
        self.assertEqual(body["status"], "completed")
        self.assertEqual(body["findings_count"], 0)

    def test_get_semgrep_endpoint_404_for_unknown_project(self):
        """GET /api/semgrep/<project_id> returns 404 for a project not in cache."""
        client, app_module = self._get_app()

        resp = client.get("/api/semgrep/does-not-exist-xyz")
        self.assertEqual(resp.status_code, 404)
        body = resp.get_json()
        self.assertIn("error", body)

    def test_clean_submit_stores_scan_in_cache(self):
        """A clean submission caches the scan and it is retrievable afterwards."""
        client, app_module = self._get_app()
        project_id = "proj-cache-roundtrip"

        p_auth1, p_auth2 = self._patch_auth(app_module)
        p_sub1, p_sub2 = self._patch_api_submit(app_module, project_id=project_id)
        clean_patch = patch("backend.app.semgrep_findings", return_value=[])

        with p_auth1, p_auth2, p_sub1, p_sub2, clean_patch:
            submit_resp = client.post(
                "/submit",
                data=_make_submit_form(),
                content_type="multipart/form-data",
            )

        self.assertEqual(submit_resp.status_code, 200)

        get_resp = client.get(f"/api/semgrep/{project_id}")
        self.assertEqual(get_resp.status_code, 200)
        body = get_resp.get_json()
        self.assertEqual(body["status"], "completed")

    def test_blocked_submit_does_not_cache(self):
        """A submission blocked by findings never creates a project, so the cache has no entry."""
        from backend.analysis.semgrep import SemgrepFinding

        client, app_module = self._get_app()
        project_id = "proj-blocked-no-cache"

        p_auth1, p_auth2 = self._patch_auth(app_module)
        p_sub1, p_sub2 = self._patch_api_submit(app_module, project_id=project_id)

        mock_finding = SemgrepFinding(
            rule_id="test.rule", message="bad", path="x.py",
            start_line=1, end_line=1, start_col=1, end_col=5, severity="ERROR",
        )
        findings_patch = patch("backend.app.semgrep_findings", return_value=[mock_finding])

        with p_auth1, p_auth2, p_sub1, p_sub2, findings_patch:
            submit_resp = client.post(
                "/submit",
                data=_make_submit_form(),
                content_type="multipart/form-data",
            )

        self.assertEqual(submit_resp.status_code, 400)
        get_resp = client.get(f"/api/semgrep/{project_id}")
        self.assertEqual(get_resp.status_code, 404)


if __name__ == "__main__":
    unittest.main()
