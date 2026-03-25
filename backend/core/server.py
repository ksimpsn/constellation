from typing import Any, List
from collections import Counter

import ray
import logging
from datetime import datetime
import os
import socket
import subprocess
import time
import warnings
import sys
from backend.core.worker import compute_task, compute_uploaded_task
import hashlib
import json
from ray.util.scheduling_strategies import NodeAffinitySchedulingStrategy

logging.basicConfig(level=logging.INFO)

class Cluster:
    def __init__(self):
        self.context = None

    def is_connected(self) -> bool:
        return ray.is_initialized()

    @staticmethod
    def _get_local_ip() -> str:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
        except Exception:
            return "127.0.0.1"
        finally:
            s.close()

    @staticmethod
    def _ray_cli_base_cmd() -> list[str]:
        """
        Return a reliable command prefix for invoking Ray CLI.
        Use the current interpreter to avoid PATH issues (e.g. missing `ray` binary).
        """
        return [sys.executable, "-m", "ray.scripts.scripts"]

    def start_head(self) -> str:
        """Start a Ray head node on this machine and connect as driver.

        Returns the externally reachable IP address of the head.
        """
        if ray.is_initialized():
            for node in ray.nodes():
                res = node.get("Resources") or {}
                if node.get("Alive") and res.get("node:__internal_head__"):
                    return node.get("NodeManagerAddress", self._get_local_ip())
            return self._get_local_ip()

        # Allow manual override for tricky local networking (VPNs, multiple interfaces).
        local_ip = os.environ.get("RAY_NODE_IP") or self._get_local_ip()

        # Best-effort cleanup: stale Ray processes can make "start --head" fail,
        # but cleanup itself may occasionally hang. Do not fail startup on this.
        try:
            subprocess.run(
                [*self._ray_cli_base_cmd(), "stop"],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=10,
            )
        except subprocess.TimeoutExpired:
            logging.warning("[Cluster] 'ray stop' timed out; continuing with head startup.")
        time.sleep(1)

        env = os.environ.copy()
        env["RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER"] = "1"

        # DEVNULL prevents daemon children from holding pipes open,
        # which caused subprocess.run to hang waiting for EOF.
        subprocess.run(
            [
                *self._ray_cli_base_cmd(), "start", "--head",
                "--port=6379",
                f"--node-ip-address={local_ip}",
                "--num-cpus=0",
                "--min-worker-port=20000",
                "--max-worker-port=20020",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=45,
            env=env,
        )
        time.sleep(2)

        self.context = ray.init(
            address=f"{local_ip}:6379", ignore_reinit_error=True
        )
        logging.info(f"[Cluster] Head started at {local_ip}:6379")
        self._log_cluster_info()
        return local_ip

    def connect_as_driver(self, head_address: str):
        """Connect this process as a Ray driver to an existing head node."""
        if ray.is_initialized():
            logging.info("[Cluster] Ray already initialized")
            return
        if ":" not in head_address:
            head_address = f"{head_address}:6379"
        self.context = ray.init(address=head_address, ignore_reinit_error=True)
        logging.info(f"[Cluster] Connected as driver to {head_address}")
        self._log_cluster_info()

    @staticmethod
    def join_as_worker(head_address: str):
        """Start a Ray worker daemon on this machine that joins a remote head."""
        if ":" not in head_address:
            head_address = f"{head_address}:6379"
        env = os.environ.copy()
        env["RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER"] = "1"
        subprocess.run(
            [*Cluster._ray_cli_base_cmd(), "start", f"--address={head_address}"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=30,
            env=env,
        )
        logging.info(f"[Cluster] Worker joined cluster at {head_address}")

    def _log_cluster_info(self):
        if not ray.is_initialized():
            return
        resources = ray.cluster_resources()
        nodes = ray.nodes()
        resources_str = ", ".join(f"{k}: {v}" for k, v in resources.items())
        logging.info(f"[Cluster] Resources: {resources_str}")
        logging.info(f"[Cluster] {len(nodes)} node(s) connected")
        for node in nodes:
            logging.info(
                f"[Cluster] Node {node.get('NodeManagerAddress')}, "
                f"Alive: {node.get('Alive')}"
            )

    # TODO: Not finished as of 11/23
    # data is a tuple of the python function / model and the subset of data
    def submit_tasks(self, data: list[dict]) -> list[ray.ObjectRef]:
        """
        Submit chunked data to Ray for computation.

            Parameters:
                 data: A list of task payloads (dicts).
                 Each dict is one chunk to be processed by compute_task().
                 FIXME: dict could contain task_id, chunk, params, etc.

            Returns:
                List[ray.ObjectRef]: list of Ray futures.
        """
        if not ray.is_initialized():
            logging.exception("[ERROR] Ray backend not initialized. Call start_cluster first.")
            raise RuntimeError("[ERROR] Ray backend not initialized. Call start_cluster first.")
        futures: List[ray.ObjectRef] = []
        for payload in data:
            futures.append(compute_task.remote(payload))
        return futures

    def submit_uploaded_tasks(self, data: list[dict], func_bytes, target_node_ids: list[str] | None = None) -> list[ray.ObjectRef]:
        """
        Submit chunked data to Ray for computation.

            Parameters:
                 data: A list of task payloads (dicts).
                 Each dict is one chunk to be processed by compute_task().
                 FIXME: dict could contain task_id, chunk, params, etc.

            Returns:
                List[ray.ObjectRef]: list of Ray futures.
        """
        if not ray.is_initialized():
            logging.exception("[ERROR] Ray backend not initialized. Call start_cluster first.")
            raise RuntimeError("[ERROR] Ray backend not initialized. Call start_cluster first.")
        futures: List[ray.ObjectRef] = []
        print(f"[DEBUG] submit_uploaded_tasks: received {len(data)} payloads")
        for idx, payload in enumerate(data):
            try:
                print(f"[DEBUG] Creating future {idx}...")
                target_node_id = None
                if target_node_ids and idx < len(target_node_ids):
                    target_node_id = target_node_ids[idx]

                if target_node_id:
                    # Prefer the selected volunteer node, but allow fallback scheduling
                    # if that node disappears mid-run.
                    future = compute_uploaded_task.options(
                        scheduling_strategy=NodeAffinitySchedulingStrategy(
                            node_id=target_node_id,
                            soft=True
                        )
                    ).remote(payload, func_bytes)
                else:
                    future = compute_uploaded_task.remote(payload, func_bytes)
                futures.append(future)
                print(f"[DEBUG] Created future {idx}: {future}")
            except Exception as e:
                logging.error(f"[ERROR] Failed to create future {idx}: {e}")
                import traceback
                traceback.print_exc()
        print(f"[DEBUG] submit_uploaded_tasks: returning {len(futures)} futures")
        return futures

    # TODO: Not finished as of 11/23
    def get_results(self, futures: list[ray.ObjectRef]) -> list[Any]:
        """
        Given a list of Ray ObjectRefs (futures), return actual results.

            Parameters:
                futures: List of Ray ObjectRef returned by submit_tasks()

            Returns:
                List[Any]: actual outputs from compute_task()
        """
        if not ray.is_initialized():
            logging.exception("[ERROR] Ray backend not initialized. Call start_cluster first.")
            raise RuntimeError("[ERROR] Ray backend not initialized. Call start_cluster first.")
        return ray.get(futures)
    
    def _get_volunteer_nodes(self) -> list:
        """Return node IDs of all live nodes advertising the volunteer_worker resource."""
        try:
            return [
                n["NodeID"]
                for n in ray.nodes()
                if n.get("Alive") and n.get("Resources", {}).get("volunteer_worker", 0) > 0
            ]
        except Exception:
            return []

    def _node_assignments_for_attempt(
        self, num_tasks: int, attempt_index: int, replication_factor: int = 2
    ) -> list | None:
        """
        Return per-task node IDs so replicas of the same task land on different workers.

        Strategy: round-robin across live volunteer nodes offset by `attempt_index`.
        For attempt 0 task i → nodes[i % N]; for attempt 1 task i → nodes[(i+1) % N], etc.

        Returns None when fewer than 2 volunteer nodes are available (Ray picks freely).

        When replication_factor > num_nodes, distinct-worker guarantees only hold for the
        first num_nodes replicas; beyond that, collisions are unavoidable and a warning is
        logged. e.g. 2 nodes + replication_factor=3 → attempts 0 and 2 share the same node
        for every task.
        """
        nodes = self._get_volunteer_nodes()
        num_nodes = len(nodes)

        if num_nodes < 2:
            logging.warning(
                f"[VERIFICATION] Only {num_nodes} volunteer node(s) available; "
                "cannot guarantee distinct workers per replica — tasks will be scheduled freely."
            )
            return None

        if replication_factor > num_nodes:
            max_collisions = replication_factor - num_nodes
            logging.warning(
                f"[VERIFICATION] replication_factor={replication_factor} exceeds available "
                f"volunteer nodes ({num_nodes}). Up to {max_collisions} replica(s) of each task "
                "will share a worker. Add more volunteer nodes to eliminate collisions."
            )

        assignments = [nodes[(i + attempt_index) % num_nodes] for i in range(num_tasks)]
        logging.info(
            f"[VERIFICATION] Attempt {attempt_index}: assigning {num_tasks} task(s) "
            f"across {num_nodes} node(s) (round-robin offset={attempt_index})"
        )
        return assignments

    def _hash_results(self, results):
        """
        Deterministic hash of task results for verification.
        """
        serialized = json.dumps(results, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()

    def _hash_single_result(self, task_result_dict):
        """
        Deterministic hash of a single task result (for per-task verification).
        """
        # Use result_hash if present, else hash the whole result payload
        h = task_result_dict.get("result_hash")
        if h is not None:
            return h
        return self._hash_results(task_result_dict.get("results", task_result_dict))

    def _verify_attempts_per_task(self, results_attempt1, results_attempt2):
        """
        Compare two result lists per task (by index).
        Returns (verified_mask, unverified_indices, hash1_list, hash2_list).
        """
        n = min(len(results_attempt1), len(results_attempt2))
        verified_mask = []
        unverified_indices = []
        hash1_list = []
        hash2_list = []
        for i in range(n):
            h1 = self._hash_single_result(results_attempt1[i])
            h2 = self._hash_single_result(results_attempt2[i])
            hash1_list.append(h1)
            hash2_list.append(h2)
            if h1 == h2:
                verified_mask.append(True)
            else:
                verified_mask.append(False)
                unverified_indices.append(i)
        return verified_mask, unverified_indices, hash1_list, hash2_list

    def _verify_attempts(self, results_attempt1, results_attempt2):
        """
        Compare two result sets using hashes (overall).
        """
        hash1 = self._hash_results(results_attempt1)
        hash2 = self._hash_results(results_attempt2)

        status = "verified" if hash1 == hash2 else "disputed"

        return status, hash1, hash2

    def submit_tasks_with_verification(self, data: list[dict]):
        """
        Submit tasks twice and verify results.
        """

        logging.info("[VERIFICATION] Running Attempt 1")
        futures1 = self.submit_tasks(data)
        results1 = ray.get(futures1)

        logging.info("[VERIFICATION] Running Attempt 2")
        futures2 = self.submit_tasks(data)
        results2 = ray.get(futures2)

        status, hash1, hash2 = self._verify_attempts(results1, results2)

        logging.info(f"[VERIFICATION] Status = {status}")

        return {
            "attempts": [results1, results2],
            "verification_status": status,
            "hashes": [hash1, hash2]
        }

    def _verify_replicated_results(self, all_attempts: List[list], replication_factor: int):
        """
        Given replication_factor result lists (each list is one full run of all tasks),
        for each task index determine: (final_result, verified).
        Verified if a majority of runs agree (>= (replication_factor + 1) // 2 same hashes).
        Returns (final_results, unverified_indices).
        """
        n = len(all_attempts[0]) if all_attempts else 0
        final_results = [all_attempts[0][i] for i in range(n)]
        unverified_indices = []
        for i in range(n):
            hashes = [self._hash_single_result(attempt[i]) for attempt in all_attempts]
            counts = Counter(hashes)
            majority_hash, count = counts.most_common(1)[0]
            # Strict majority: need more than half (e.g. 2-of-2, 2-of-3, 3-of-4)
            threshold = (replication_factor // 2) + 1
            if count >= threshold:
                # Use the result that produced majority_hash
                for attempt in all_attempts:
                    if self._hash_single_result(attempt[i]) == majority_hash:
                        final_results[i] = attempt[i]
                        break
            else:
                unverified_indices.append(i)
                final_results[i] = all_attempts[0][i]
        return final_results, unverified_indices

    def submit_uploaded_tasks_with_verification(
        self,
        data: list[dict],
        func_bytes,
        replication_factor: int = 2,
        max_rerun_attempts: int = 2,
    ):
        """
        Submit uploaded tasks with configurable replication and verification.

        - replication_factor: each task is run this many times; verified if a majority agree.
        - max_rerun_attempts: max times to re-submit unverified tasks (each re-run uses replication_factor again).
        """
        replication_factor = max(2, int(replication_factor))
        max_rerun_attempts = max(1, int(max_rerun_attempts))

        all_attempts = []
        for r in range(replication_factor):
            logging.info(f"[VERIFICATION] Running Uploaded Attempt {r + 1}/{replication_factor}")
            target_node_ids = self._node_assignments_for_attempt(
                len(data), attempt_index=r, replication_factor=replication_factor
            )
            futures = self.submit_uploaded_tasks(data, func_bytes, target_node_ids=target_node_ids)
            results = ray.get(futures)
            all_attempts.append(results)

        final_results, unverified_indices = self._verify_replicated_results(
            all_attempts, replication_factor
        )
        n = len(final_results)

        if unverified_indices:
            logging.info(
                f"[VERIFICATION] {len(unverified_indices)} task(s) unverified, re-submitting (max {max_rerun_attempts} attempt(s))"
            )
            unverified_payloads = [data[i] for i in unverified_indices]
            rerun_attempt = 0
            while rerun_attempt < max_rerun_attempts and unverified_indices:
                rerun_attempt += 1
                logging.info(
                    f"[VERIFICATION] Re-run attempt {rerun_attempt}/{max_rerun_attempts} for {len(unverified_payloads)} task(s) (replication={replication_factor})"
                )
                rerun_attempts = []
                for r in range(replication_factor):
                    target_node_ids = self._node_assignments_for_attempt(
                        len(unverified_payloads), attempt_index=r, replication_factor=replication_factor
                    )
                    rerun_futures = self.submit_uploaded_tasks(
                        unverified_payloads, func_bytes, target_node_ids=target_node_ids
                    )
                    rerun_attempts.append(ray.get(rerun_futures))
                rerun_final, still_unverified = self._verify_replicated_results(
                    rerun_attempts, replication_factor
                )
                for j, orig_idx in enumerate(unverified_indices):
                    final_results[orig_idx] = rerun_final[j]
                unverified_indices = [unverified_indices[k] for k in still_unverified]
                unverified_payloads = [data[i] for i in unverified_indices]
                if not unverified_indices:
                    logging.info("[VERIFICATION] All re-submitted tasks verified")
                    break

            if unverified_indices:
                logging.warning(
                    f"[VERIFICATION] {len(unverified_indices)} task(s) still disputed after {max_rerun_attempts} re-run(s)"
                )

        overall_status = "verified" if not unverified_indices else "disputed"
        hash1 = self._hash_results(all_attempts[0])
        hash2 = self._hash_results(all_attempts[1]) if replication_factor >= 2 else hash1
        logging.info(f"[VERIFICATION] Uploaded Status = {overall_status}")

        return {
            "attempts": all_attempts + [final_results],
            "verification_status": overall_status,
            "hashes": [hash1, hash2],
            "final_results": final_results,
        }
