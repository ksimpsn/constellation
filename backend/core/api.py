"""
ConstellationAPI

Python interface for managing distributed
computation jobs. Bridge between:
  - Flask app (backend/web/app.py): the thing researchers/volunteers interact with
  - Ray cluster logic (backend/core/server.py, worker.py): what actually executes the tasks

Need to coordinate job submission, progress tracking,
result retrieval, and verification.

API responsible for managing the job lifecycle (submission -> tracking -> results -> verification)
"""
from typing import List, Any

import ray

from backend.core.server import Cluster

class ConstellationAPI:
    """
    Handles higher-level job orchestration.
    Flask will call these methods to interact with the Ray backend.
    """

    def __init__(self):
        self.server = Cluster() # start_cluster, submit_tasks, get_results
        # self.jobs maps job_id to a dict with below mapping:
        # status: str -> "submitted" | "running" | "complete" | "failed" | "cancelled"
        # data: list[Any] (chunked payload) -> ex: [1, 2, 3]
        # results: None | list[Any] -> None if job isn't complete, list[Any] after retrieved from compute_task
        self.jobs: dict[int, dict[str, Any]] = {} # TODO: Annabella - switch from in-memory job tracking
        self.futures: dict[int, List[ray.ObjectRef]] = {} # need futures b/c ObjectRefs cannot be stored in DB
        # TODO: DB will store users, jobs, job_data (payloads/dataset), job_results, permissions
        self.counter = 0 # for unique job_ids
        # TODO: later implement user-uploaded functions job_id -> function, parameters, chunked dataset, ray futures, results
        print("[ConstellationAPI] Initialized API layer.")

    # ---------------------------------------------------------
    # Job Submission
    # ---------------------------------------------------------
    def submit_project(self, data):
        """
        Accepts a list or dataset from the researcher and submits it
        to the Ray backend for distributed computation.

        Example:
            api.submit_project([1,2,3,4])
        Returns:
            job_id (str)
        """
        print(f"[ConstellationAPI] Submitting new project with data: {data}")

        job_id = self.server.submit_tasks(data)

        job_id = f"job-{len(self.jobs)}"
        self.jobs[job_id] = {
            "data": data,
            "status": "submitted",
            "results": None
        }

        return job_id

    # ---------------------------------------------------------
    # Status Checking
    # ---------------------------------------------------------
    def check_status(self, job_id):
        """
        Returns the current status of the job.
        Status could be: submitted, running, complete, failed, etc.
        """
        print(f"[ConstellationAPI] Checking status for job: {job_id}")

        if job_id not in self.jobs:
            return "not-found"

        return self.jobs[job_id]["status"]

    # ---------------------------------------------------------
    # Result Retrieval
    # ---------------------------------------------------------
    def get_results(self, job_id):
        """
        Returns computed results for a given job once complete.
        """
        print(f"[ConstellationAPI] Fetching results for job: {job_id}")

        if job_id not in self.jobs:
            raise Exception("Job not found")

        job = self.jobs[job_id]
        if job["results"] is not None:
            return job["results"]

        # results = self.server.get_results(job_id)
        # job["results"] = results
        # job["status"] = "complete"

        # TODO: delete when above logic is implemented
        dummy_results = [x ** 2 for x in job["data"]]
        job["results"] = dummy_results
        job["status"] = "complete"
        return dummy_results

    # ---------------------------------------------------------
    # (Optional) Verification Stub
    # ---------------------------------------------------------
    def verify_results(self, job_id):
        """
        Placeholder for redundancy/result verification.
        """
        print(f"[ConstellationAPI] Verifying results for job: {job_id}")
        # TODO: Add redundancy check
        return True