from typing import Any, List

import ray
import logging
from datetime import datetime
import os
import subprocess
import warnings
from backend.core.worker import compute_task, compute_uploaded_task

logging.basicConfig(level=logging.INFO)

class Cluster:
    def __init__(self):
        self.context = None

    def start_cluster(self, mode="head", head_address=None):

        if ray.is_initialized():
            logging.info("[INFO] Ray backend already initialized")
            return

        # type(self.context) - ray._private.worker.RayContext
        if mode == "head":
            # Head node: start Ray cluster and allow remote connections
            # Check if Ray head is already running
            try:
                # Try to connect to existing Ray cluster
                self.context = ray.init(address="auto", ignore_reinit_error=True)
                logging.info("[INFO] Connected to existing Ray head node")
            except Exception as connect_error:
                ray_address = os.environ.get("RAY_ADDRESS")
                if ray_address:
                    logging.error(
                        f"[ERROR] No Ray cluster at {ray_address}. "
                        "Start the head first in another terminal: ./scripts/start-ray-head.sh"
                    )
                    raise RuntimeError(
                        f"No Ray cluster at {ray_address}. "
                        "Start the head first: ./scripts/start-ray-head.sh"
                    ) from connect_error
                # Start new Ray head node via subprocess
                # Note: This requires Ray to be installed and in PATH
                logging.info("[INFO] No existing Ray cluster found, starting new head node...")
                try:
                    # Try starting Ray head node with remote connections enabled
                    result = subprocess.run(
                        ["ray", "start", "--head", "--port=6379", "--node-ip-address=127.0.0.1"],
                        check=True,
                        capture_output=True,
                        text=True,
                        timeout=15
                    )
                    logging.info(f"[INFO] Ray head node started successfully")
                    # Small delay to ensure Ray is fully initialized
                    import time
                    time.sleep(2)
                    # Connect to the newly started head node
                    self.context = ray.init(address="auto", ignore_reinit_error=True)
                    logging.info("[INFO] Connected to Ray head node on port 6379 (allowing remote connections)")
                except subprocess.CalledProcessError as e:
                    # Show actual error from Ray command
                    error_output = e.stderr.decode() if e.stderr else str(e)
                    stdout_output = e.stdout.decode() if e.stdout else ""
                    logging.error(f"[ERROR] Failed to start Ray head node via command line:")
                    logging.error(f"[ERROR] Return code: {e.returncode}")
                    if stdout_output:
                        logging.error(f"[ERROR] stdout: {stdout_output}")
                    if error_output:
                        logging.error(f"[ERROR] stderr: {error_output}")
                    
                    # Try alternative: start Ray head without node-ip-address (may work better)
                    logging.info("[INFO] Trying alternative: starting Ray head without explicit IP binding...")
                    try:
                        result = subprocess.run(
                            ["ray", "start", "--head", "--port=6379"],
                            check=True,
                            capture_output=True,
                            text=True,
                            timeout=15
                        )
                        import time
                        time.sleep(2)
                        self.context = ray.init(address="auto", ignore_reinit_error=True)
                        logging.info("[INFO] Started Ray head node (alternative method, may have limited remote access)")
                    except Exception as alt_error:
                        logging.warning(f"[WARNING] Alternative method also failed: {alt_error}")
                        logging.info("[INFO] Falling back to local Ray cluster (single-node mode, no remote connections)")
                        self.context = ray.init()
                        logging.warning("[WARNING] Local cluster mode: remote workers cannot connect")
                except (FileNotFoundError, subprocess.TimeoutExpired) as e:
                    # Ray command not found or timeout
                    logging.warning(f"[WARNING] Could not start Ray head node: {e}")
                    logging.info("[INFO] Falling back to local Ray cluster (single-node mode)")
                    self.context = ray.init()
                    logging.warning("[WARNING] Local cluster mode: remote workers cannot connect")
        elif mode == "worker":
            # Worker node: connect to existing head node
            if not head_address:
                raise ValueError("head_address required when mode='worker'")
            # Format: "ray://head_address:10001" or just "head_address:6379"
            if not head_address.startswith("ray://"):
                # Assume format is IP:PORT or just IP (default port 10001 for Ray client)
                if ":" not in head_address:
                    head_address = f"{head_address}:10001"
                head_address = f"ray://{head_address}"
            self.context = ray.init(address=head_address)
            logging.info(f"[INFO] Connecting to Ray head node at {head_address}")
        else:
            # Default: single-node local cluster (backward compatible)
            self.context = ray.init()
            logging.info("[INFO] Starting local Ray cluster (single-node mode)")

        # type(resources) - dict[str, float]
        # {
        #     "CPU": 8.0,
        #     "memory": 7071940608.0,
        #     "object_store_memory": 2147483648.0,
        #     "node:127.0.0.1": 1.0
        # }
        resources = ray.cluster_resources()
        # type(nodes) - list[dict]
        nodes = ray.nodes() # list

        logging.info(f"[INFO] Ray backend initialized at {datetime.now()}")
        resources_str = []
        for key, value in resources.items():
            resources_str.append(f"{key}: {value}")
        resources_str = ", ".join(resources_str)
        logging.info(f"[INFO] Ray cluster resources: {resources_str}")
        logging.info(f"[INFO] {len(nodes)} Ray node(s) connected")
        
        # Check if head node accepts remote connections
        if mode == "head":
            head_node = None
            for node in nodes:
                if node.get("Alive", False):
                    head_node = node
                    break
            
            if head_node:
                node_address = head_node.get("NodeManagerAddress", "unknown")
                if node_address == "0.0.0.0" or node_address != "127.0.0.1":
                    logging.info(f"[INFO] Ray head node listening on {node_address} - ready for remote connections")
                else:
                    logging.warning(f"[WARNING] Ray head node listening on {node_address} - may not accept remote connections")
                    logging.info("[INFO] For same-machine workers use --node-ip-address=127.0.0.1; for remote workers use your LAN IP. See scripts/start-ray-head.sh.")
        
        for node in nodes:
            # type(nodes) - dict[str, Any]
            # {
            #     "NodeID": "...",
            #     "Alive": True,
            #     "NodeManagerAddress": "127.0.0.1",
            #     "Resources": {"CPU": 8.0, ...}
            # }
            logging.info(f"[INFO] Ray node {node.get('NodeManagerAddress')}, Connected: {node.get('Alive')}")

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

    def submit_uploaded_tasks(self, data: list[dict], func_bytes) -> list[ray.ObjectRef]:
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