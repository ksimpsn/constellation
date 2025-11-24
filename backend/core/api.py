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
import logging
from typing import List, Any

import ray
from backend.core.server import Cluster

from database import get_session, Job, save_job, update_job, get_job

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
        # self.jobs: dict[int, dict[str, Any]] = {} # TODO: Annabella - switch from in-memory job tracking
        # DB will store users, jobs, job_data (payloads/dataset), job_results, permissions
        self.db = get_session()
        self.futures: dict[int, List[ray.ObjectRef]] = {} # need futures b/c ObjectRefs cannot be stored in DB
        self.counter = 0 # for unique job_ids
        # TODO: later implement user-uploaded functions job_id -> function, parameters, chunked dataset, ray futures, results
        print("[ConstellationAPI] Initialized API layer.")

    # ---------------------------------------------------------
    # Job Submission
    # ---------------------------------------------------------
    def submit_project(self, data):
        """
        Accepts a list or dataset from the researcher and submits it
        to the Ray backend for distributed computation. # TODO: in future, will accept a function to apply to the dataset

        Example:
            api.submit_project([1,2,3,4])
        Returns:
            job_id (str)
        """
        print(f"[ConstellationAPI] Submitting new project with data: {data}")

        # generate job_id
        job_id = self.counter
        self.counter += 1

        # convert data into payloads
        payloads = [
            {"task_id": i, "chunk": item, "params": None} for i, item in enumerate(data)
        ]

        # submit tasks to Ray
        futures = self.server.submit_tasks(payloads)
        # store futures in memory
        self.futures[job_id] = futures

        # store metadata in DB
        save_job(job_id=job_id, data=data, status="submitted")

        print("[ConstellationAPI] Job {job_id} saved in DB.")
        return job_id

    # ---------------------------------------------------------
    # Status Checking
    # ---------------------------------------------------------
    def check_status(self, job_id):
        """
        Returns the current status of the job.
        Status could be: submitted, running, complete, failed, etc.
        """
        # TODO: add support for failed as well
        logging.info(f"[ConstellationAPI] Status check for job_id={job_id}")

        job = get_job(job_id)
        if not job:
            logging.error(f"[ConstellationAPI] Job {job_id} not found in DB")
            raise Exception("Job not found")

        current_status = job.get("status")
        logging.info(f"[ConstellationAPI] Current stored status for job {job_id}: {current_status}")

        # If already complete, no need to re-check
        if current_status == "complete":
            logging.info(f"[ConstellationAPI] Job {job_id} already marked complete")
            return "complete"

        # retrieve futures, may be empty
        futures = self.futures.get(job_id, [])
        if not futures:
            logging.warning(f"[ConstellationAPI] No futures found for job {job_id}; marking as submitted")
            return "submitted"

        logging.info(f"[ConstellationAPI] Checking {len(futures)} Ray futures for job {job_id}")

        done, not_done = ray.wait(futures, timeout=0)

        logging.info(
            f"[ConstellationAPI] Job {job_id} -> "
            f"{len(done)} done, {len(not_done)} not done"
        )

        if len(done) == len(futures):
            logging.info(f"[ConstellationAPI] All futures completed for job {job_id}")
            job.status = "complete"
        else:
            logging.info(f"[ConstellationAPI] Job {job_id} still running")
            job.status = "running"

        return job.status

    # ---------------------------------------------------------
    # Result Retrieval
    # ---------------------------------------------------------
    def get_results(self, job_id):
        """
        Retrieve results for a completed job.
        Blocks until results are ready.
        """
        logging.info(f"[ConstellationAPI] Fetching results for job_id={job_id}")

        # job must exist
        job = get_job(job_id)
        if not job:
            logging.error(f"[ConstellationAPI] Job {job_id} not found in self.jobs")
            raise Exception("Job not found")

        # If already cached in DB, return
        if job.result is not None:
            logging.info(f"[ConstellationAPI] Returning cached results for job {job_id}")
            return job.result

        futures = self.futures.get(job_id, [])

        if not futures:
            logging.error(f"[ConstellationAPI] No futures for job {job_id}; cannot fetch results")
            raise Exception("No futures available to fetch results for this job")

        logging.info(f"[ConstellationAPI] Blocking until Ray returns results for {len(futures)} tasks")

        results = self.server.get_results(futures)

        logging.info(f"[ConstellationAPI] Results retrieved for job {job_id}: {results}")

        # Cache results + update status
        update_job(job_id, results=results, status="complete")

        logging.info(f"[ConstellationAPI] Job {job_id} marked complete")
        
        return results
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