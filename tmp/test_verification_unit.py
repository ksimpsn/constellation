"""
Unit tests for result verification logic in backend.core.server.Cluster.

Tests _hash_results, _hash_single_result, _verify_attempts_per_task,
and _verify_replicated_results without starting Ray.
"""
import unittest
from backend.core.server import Cluster


def make_result(task_id, results, result_hash=None):
    """Build a task result dict like the worker returns."""
    d = {"task_id": task_id, "results": results}
    if result_hash is not None:
        d["result_hash"] = result_hash
    return d


class TestHashResults(unittest.TestCase):
    def setUp(self):
        self.cluster = Cluster()

    def test_hash_results_deterministic(self):
        results = [{"task_id": 0, "results": [1, 2]}, {"task_id": 1, "results": [3, 4]}]
        h1 = self.cluster._hash_results(results)
        h2 = self.cluster._hash_results(results)
        self.assertEqual(h1, h2)

    def test_hash_results_different_input_different_hash(self):
        r1 = [make_result(0, [1, 2])]
        r2 = [make_result(0, [1, 3])]
        self.assertNotEqual(self.cluster._hash_results(r1), self.cluster._hash_results(r2))

    def test_hash_single_result_uses_result_hash_if_present(self):
        r = make_result(0, [1, 2], result_hash="abc123")
        self.assertEqual(self.cluster._hash_single_result(r), "abc123")

    def test_hash_single_result_hashes_results_if_no_result_hash(self):
        r = make_result(0, [1, 2])
        h = self.cluster._hash_single_result(r)
        self.assertIsInstance(h, str)
        self.assertEqual(len(h), 64)  # sha256 hex
        self.assertEqual(h, self.cluster._hash_single_result(r))


class TestVerifyAttemptsPerTask(unittest.TestCase):
    def setUp(self):
        self.cluster = Cluster()

    def test_all_verified_when_identical(self):
        r1 = [make_result(0, 10), make_result(1, 20)]
        r2 = [make_result(0, 10), make_result(1, 20)]
        verified_mask, unverified, _, _ = self.cluster._verify_attempts_per_task(r1, r2)
        self.assertTrue(all(verified_mask))
        self.assertEqual(unverified, [])

    def test_per_task_mismatch(self):
        r1 = [make_result(0, 10), make_result(1, 20)]
        r2 = [make_result(0, 10), make_result(1, 99)]  # task 1 differs
        verified_mask, unverified, _, _ = self.cluster._verify_attempts_per_task(r1, r2)
        self.assertTrue(verified_mask[0])
        self.assertFalse(verified_mask[1])
        self.assertEqual(unverified, [1])

    def test_both_mismatch(self):
        r1 = [make_result(0, 10), make_result(1, 20)]
        r2 = [make_result(0, 11), make_result(1, 21)]
        _, unverified, _, _ = self.cluster._verify_attempts_per_task(r1, r2)
        self.assertEqual(set(unverified), {0, 1})


class TestVerifyReplicatedResults(unittest.TestCase):
    def setUp(self):
        self.cluster = Cluster()

    def test_two_way_all_agree(self):
        r1 = [make_result(0, 10), make_result(1, 20)]
        r2 = [make_result(0, 10), make_result(1, 20)]
        final, unverified = self.cluster._verify_replicated_results([r1, r2], 2)
        self.assertEqual(len(final), 2)
        self.assertEqual(unverified, [])
        self.assertEqual(self.cluster._hash_single_result(final[0]), self.cluster._hash_single_result(r1[0]))
        self.assertEqual(self.cluster._hash_single_result(final[1]), self.cluster._hash_single_result(r1[1]))

    def test_two_way_one_dispute(self):
        r1 = [make_result(0, 10), make_result(1, 20)]
        r2 = [make_result(0, 10), make_result(1, 99)]
        final, unverified = self.cluster._verify_replicated_results([r1, r2], 2)
        self.assertEqual(unverified, [1])
        self.assertEqual(self.cluster._hash_single_result(final[0]), self.cluster._hash_single_result(r1[0]))
        self.assertEqual(self.cluster._hash_single_result(final[1]), self.cluster._hash_single_result(r1[1]))

    def test_three_way_majority_wins(self):
        r1 = [make_result(0, 10)]
        r2 = [make_result(0, 10)]
        r3 = [make_result(0, 99)]
        final, unverified = self.cluster._verify_replicated_results([r1, r2, r3], 3)
        self.assertEqual(unverified, [])
        self.assertEqual(self.cluster._hash_single_result(final[0]), self.cluster._hash_single_result(r1[0]))

    def test_three_way_no_majority(self):
        r1 = [make_result(0, 10)]
        r2 = [make_result(0, 20)]
        r3 = [make_result(0, 30)]
        final, unverified = self.cluster._verify_replicated_results([r1, r2, r3], 3)
        self.assertEqual(unverified, [0])
        self.assertEqual(final[0], r1[0])

    def test_replication_factor_two_requires_both_agree(self):
        """With replication_factor=2, both runs must agree; otherwise task is unverified."""
        r1 = [make_result(0, 1)]
        r2 = [make_result(0, 2)]
        final, unverified = self.cluster._verify_replicated_results([r1, r2], 2)
        self.assertEqual(unverified, [0], "task 0 should be unverified when two runs disagree")


if __name__ == "__main__":
    unittest.main()
