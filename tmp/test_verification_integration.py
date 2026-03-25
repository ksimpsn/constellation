"""
Integration-style tests for submit_uploaded_tasks_with_verification.

Mocks submit_uploaded_tasks (to avoid Ray), ray.get (to inject results),
and ray.init (so Ray never starts and the process doesn't hang).

Run this module first when running verification tests so the global ray
patch is applied before backend.core.server (and worker) are imported.
"""
import sys
sys.path.insert(0, ".")

# Patch Ray globally before any backend import (avoids hang when worker/server load ray)
import ray as _ray
from unittest.mock import patch, MagicMock
_ray_init_patch = patch.object(_ray, "init", return_value=None)
_ray_initialized_patch = patch.object(_ray, "is_initialized", return_value=False)
_ray_init_patch.start()
_ray_initialized_patch.start()

import unittest


def make_result(task_id, results, result_hash=None):
    d = {"task_id": task_id, "results": results}
    if result_hash is not None:
        d["result_hash"] = result_hash
    return d


def _make_fake_futures(n):
    return [MagicMock() for _ in range(n)]


class TestSubmitUploadedTasksWithVerification(unittest.TestCase):
    """Test verification flow with mocked submit_uploaded_tasks and ray.get."""

    @patch("backend.core.server.ray.get")
    @patch("backend.core.server.Cluster.submit_uploaded_tasks")
    def test_verified_when_both_attempts_agree(self, mock_submit, mock_ray_get):
        mock_submit.side_effect = [
            _make_fake_futures(2),
            _make_fake_futures(2),
        ]
        results_run1 = [make_result("t1", 10), make_result("t2", 20)]
        results_run2 = [make_result("t1", 10), make_result("t2", 20)]
        mock_ray_get.side_effect = [results_run1, results_run2]

        from backend.core.server import Cluster
        cluster = Cluster()
        payloads = [
            {"task_id": "t1", "rows": [1], "params": None},
            {"task_id": "t2", "rows": [2], "params": None},
        ]
        func_bytes = b"fake"

        out = cluster.submit_uploaded_tasks_with_verification(
            payloads, func_bytes,
            replication_factor=2,
            max_rerun_attempts=2,
        )

        self.assertEqual(out["verification_status"], "verified")
        self.assertEqual(len(out["final_results"]), 2)
        self.assertEqual(out["final_results"][0]["results"], 10)
        self.assertEqual(out["final_results"][1]["results"], 20)
        self.assertEqual(mock_ray_get.call_count, 2)

    @patch("backend.core.server.ray.get")
    @patch("backend.core.server.Cluster.submit_uploaded_tasks")
    def test_disputed_when_attempts_disagree(self, mock_submit, mock_ray_get):
        # Initial 2 runs (2 tasks each), then 1 rerun with 2 runs (1 task)
        mock_submit.side_effect = [
            _make_fake_futures(2),
            _make_fake_futures(2),
            _make_fake_futures(1),
            _make_fake_futures(1),
        ]
        results_run1 = [make_result("t1", 10), make_result("t2", 20)]
        results_run2 = [make_result("t1", 10), make_result("t2", 99)]
        rerun1 = [make_result("t2", 20)]
        rerun2 = [make_result("t2", 99)]  # rerun also disagrees -> still disputed
        mock_ray_get.side_effect = [results_run1, results_run2, rerun1, rerun2]

        from backend.core.server import Cluster
        cluster = Cluster()
        payloads = [
            {"task_id": "t1", "rows": [1], "params": None},
            {"task_id": "t2", "rows": [2], "params": None},
        ]

        out = cluster.submit_uploaded_tasks_with_verification(
            payloads, b"fake",
            replication_factor=2,
            max_rerun_attempts=1,
        )

        self.assertEqual(out["verification_status"], "disputed")
        self.assertEqual(len(out["final_results"]), 2)

    @patch("backend.core.server.ray.get")
    @patch("backend.core.server.Cluster.submit_uploaded_tasks")
    def test_three_way_replication_majority(self, mock_submit, mock_ray_get):
        mock_submit.side_effect = [_make_fake_futures(1), _make_fake_futures(1), _make_fake_futures(1)]
        r1 = [make_result("t1", 10)]
        r2 = [make_result("t1", 10)]
        r3 = [make_result("t1", 99)]
        mock_ray_get.side_effect = [r1, r2, r3]

        from backend.core.server import Cluster
        cluster = Cluster()
        payloads = [{"task_id": "t1", "rows": [1], "params": None}]

        out = cluster.submit_uploaded_tasks_with_verification(
            payloads, b"fake",
            replication_factor=3,
            max_rerun_attempts=1,
        )

        self.assertEqual(out["verification_status"], "verified")
        self.assertEqual(out["final_results"][0]["results"], 10)
        self.assertEqual(mock_ray_get.call_count, 3)

    @patch("backend.core.server.ray.get")
    @patch("backend.core.server.Cluster.submit_uploaded_tasks")
    def test_rerun_unverified_until_verified(self, mock_submit, mock_ray_get):
        # submit_uploaded_tasks: 2 runs of 2 tasks, then 2 runs of 1 task (rerun)
        mock_submit.side_effect = [
            _make_fake_futures(2),
            _make_fake_futures(2),
            _make_fake_futures(1),
            _make_fake_futures(1),
        ]
        r1 = [make_result("t1", 10), make_result("t2", 20)]
        r2 = [make_result("t1", 10), make_result("t2", 99)]
        r3 = [make_result("t2", 20)]
        r4 = [make_result("t2", 20)]
        mock_ray_get.side_effect = [r1, r2, r3, r4]

        from backend.core.server import Cluster
        cluster = Cluster()
        payloads = [
            {"task_id": "t1", "rows": [1], "params": None},
            {"task_id": "t2", "rows": [2], "params": None},
        ]

        out = cluster.submit_uploaded_tasks_with_verification(
            payloads, b"fake",
            replication_factor=2,
            max_rerun_attempts=2,
        )

        self.assertEqual(out["verification_status"], "verified")
        self.assertEqual(out["final_results"][0]["results"], 10)
        self.assertEqual(out["final_results"][1]["results"], 20)
        self.assertEqual(mock_ray_get.call_count, 4)


if __name__ == "__main__":
    unittest.main()
