from typing import Any

import ray
import logging
from datetime import datetime
import os
import warnings
from worker import compute_task

logging.basicConfig(level=logging.INFO)

class Cluster:
    def __init__(self):
        self.context = None

    def start_cluster(self):

        if ray.is_initialized():
            logging.info("[INFO] Ray backend already initialized")
            return

        # type(self.context) - ray._private.worker.RayContext
        self.context = ray.init()
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
        if not ray.is_initialized():
            logging.exception("[ERROR] Ray backend not initialized. Call start_cluster first.")
            raise RuntimeError("[ERROR] Ray backend not initialized. Call start_cluster first.")
        futures = []
        for item in data:
            futures.append(compute_task.remote(item))
        return futures

    # TODO: Not finished as of 11/23
    def get_results(self, futures: list[ray.ObjectRef]) -> list[Any]:
        if not ray.is_initialized():
            logging.exception("[ERROR] Ray backend not initialized. Call start_cluster first.")
            raise RuntimeError("[ERROR] Ray backend not initialized. Call start_cluster first.")
        return ray.get(futures)