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
import shutil
from typing import List, Any
import os
import csv
import json

import csv, json, os, importlib.util
import dill
import ray
from backend.core.server import Cluster

from backend.core.database import get_session, Job, save_job, update_job, get_job

class ConstellationAPI:
    """
    Handles higher-level job orchestration.
    Flask will call these methods to interact with the Ray backend.
    """

    def __init__(self):
        self.server = Cluster() # start_cluster, submit_tasks, get_results
        self.server.start_cluster()
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
    # TODO: custom functions are not handled currently
    def csv_parser(self, csv_file_path: str, function_file_path: str = None) -> int:
        """
        Parse a CSV file and submit its rows as a project to the Ray backend.
        Expects a header row.
        Each row of the CSV becomes one item in the dataset passed to
        `submit_project`. Returns the created `job_id`.
        """

        if not os.path.isfile(csv_file_path):
            logging.exception(f"[ERROR] File {csv_file_path} does not exist.")
            raise FileNotFoundError(f"[ERROR] File {csv_file_path} does not exist.")

        data: List[dict] = []
        with open(csv_file_path, mode='r', encoding='utf-8', newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                data.append(row)

        logging.info(f"[INFO] Parsed {len(data)} rows from {csv_file_path}")

        job_id = self.submit_project(data)
        logging.info(f"[INFO] Submitted CSV project as job {job_id}")
        return job_id
    # TODO: custom functions are not handled currently
    def json_parser(self, json_file_path: str, function_file_path: str = None) -> int:
        """
        Parse a JSON file and submit its contents as a project to the Ray backend.

        If the JSON root is a list, each element becomes an item in the dataset.
        If it's an object/dict, the object is submitted as a single-item dataset.
        """

        if not os.path.isfile(json_file_path):
            logging.exception(f"[ERROR] File {json_file_path} does not exist.")
            raise FileNotFoundError(f"[ERROR] File {json_file_path} does not exist.")

        with open(json_file_path, 'r', encoding='utf-8') as jf:
            parsed = json.load(jf)

        if isinstance(parsed, list):
            data = parsed
        else:
            data = [parsed]

        logging.info(f"[INFO] Parsed JSON data from {json_file_path} (items: {len(data)})")

        job_id = self.submit_project(data)
        logging.info(f"[INFO] Submitted JSON project as job {job_id}")
        return job_id

    def _load_csv(self, path: str):
        if not os.path.isfile(path):
            raise FileNotFoundError(f"[ERROR] CSV file not found: {path}")

        rows = []
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
        return rows

    def _load_json(self, path: str):
        if not os.path.isfile(path):
            raise FileNotFoundError(f"[ERROR] JSON file not found: {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return data if isinstance(data, list) else [data]

    def load_user_function(self, code_path: str, func_name: str = "main"):
        """
            Dynamically load a user-provided Python file and retrieve a function from it.

            Parameters:
                code_path (str): path to the user's .py file
                func_name (str): name of function inside the module to call per row

            Returns:
                callable: the loaded function object

            Raises:
                FileNotFoundError: if the file doesn't exist
                AttributeError: if function doesn't exist in the code
                TypeError: if the attribute is not callable
        """
        if not os.path.isfile(code_path):
            raise FileNotFoundError(f"[ERROR] File not found: {code_path}")

        spec = importlib.util.spec_from_file_location("user_module", code_path)
        if spec is None:
            raise ImportError(f"[ERROR] Could not load spec from {code_path}")

        user_module = importlib.util.module_from_spec(spec)
        loader = spec.loader
        if loader is None:
            raise ImportError(f"[ERROR] Could not create loader for {code_path}")

        # Execute the module (runs top-level code)
        loader.exec_module(user_module)

        # Retrieve function
        if not hasattr(user_module, func_name):
            raise AttributeError(f"[ERROR] Function '{func_name}' not found in {code_path}")

        fn = getattr(user_module, func_name)

        if not callable(fn):
            raise TypeError(f"[ERROR] Attribute '{func_name}' in {code_path} is not callable")

        return fn

    def submit_uploaded_project(
            self,
            code_path: str,
            dataset_path: str,
            file_type: str,
            func_name: str = "main",
            chunk_size: int = 1000
    ) -> int:
        """
        Full pipeline for researcher-uploaded projects.

        Steps:
          1. Load user Python function (from .py file)
          2. Serialize function to bytes (fn_bytes)
          3. Load dataset (CSV or JSON)
          4. Chunk dataset
          5. Submit Ray tasks (each receives rows + fn_bytes)
          6. Record job in DB
        """

        # ---------------------------------------------------------
        # 1. Load + serialize user function
        # ---------------------------------------------------------
        fn = self.load_user_function(code_path, func_name)
        try:
            fn_bytes = dill.dumps(fn)
        except Exception as e:
            raise RuntimeError(f"[ERROR] Could not serialize function {func_name}: {e}")

        # ---------------------------------------------------------
        # 2. Load dataset
        # ---------------------------------------------------------
        if file_type.lower() == "csv":
            data = self._load_csv(dataset_path)
        elif file_type.lower() == "json":
            data = self._load_json(dataset_path)
        else:
            raise ValueError("file_type must be 'csv' or 'json'")

        if not isinstance(data, list):
            raise ValueError("Dataset loader must return a list of rows")

        # ---------------------------------------------------------
        # 3. Chunk dataset
        chunks = [
            data[i:i + chunk_size]
            for i in range(0, len(data), chunk_size)
        ]

        # ---------------------------------------------------------
        # 4. Create Ray payloads
        payloads = []
        for idx, chunk in enumerate(chunks):
            payloads.append({
                "task_id": idx,
                "rows": chunk,
                "params": None  # can extend later for extra args
            })

        # ---------------------------------------------------------
        # 5. Submit tasks to Ray
        job_id = self.counter
        self.counter += 1

        print(f"[DEBUG] About to submit: {len(payloads)} payloads")
        futures = self.server.submit_uploaded_tasks(payloads, fn_bytes)
        print(f"[DEBUG] Received {len(futures)} futures from submit_uploaded_tasks")
        self.futures[job_id] = futures
        print(f"[DEBUG] submit_uploaded_project: stored job_id={job_id}, futures_count={len(futures)}, self.futures keys={list(self.futures.keys())}")

        # ---------------------------------------------------------
        # 6. Copy user code and dataset to local storage FIXME: this will be updated to S3 bucket path later
        # ---------------------------------------------------------
        os.makedirs(f"uploads/job_{job_id}", exist_ok=True)

        # Copy user code to local storage
        stored_code_path = f"uploads/job_{job_id}/project.py"
        shutil.copyfile(code_path, stored_code_path)

        # Copy dataset
        stored_dataset_path = f"uploads/job_{job_id}/dataset.{file_type}"
        shutil.copyfile(dataset_path, stored_dataset_path)

        # ---------------------------------------------------------
        # 7. Save job metadata to DB
        # ---------------------------------------------------------
        save_job(job_id=job_id, data=payloads, status="submitted")

        logging.info(f"[INFO] Submitted uploaded project as job {job_id} "
                     f"with {len(chunks)} chunks")

        return job_id

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
        # save_job(job_id=job_id, data=payloads, status="submitted")
        # FIXME: payloads contains a bunch of binary so may want to rethink
        # save_job(job_id=job_id, data={"num_chunks": len(payloads)}, status="submitted")

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
        logging.info(f"[ConstellationAPI] Status check for job_id={job_id}")

        job = get_job(job_id)
        if not job:
            logging.error(f"[ConstellationAPI] Job {job_id} not found in DB")
            raise Exception("Job not found")

        current_status = job.status
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

        done, not_done = ray.wait(futures, num_returns=len(futures), timeout=0)

        logging.info(
            f"[ConstellationAPI] Job {job_id} -> "
            f"{len(done)} done, {len(not_done)} not done"
        )

        if len(done) == len(futures):
            logging.info(f"[ConstellationAPI] All futures completed for job {job_id}")
            update_job(job_id, status="complete")
            return "complete"
        else:
            logging.info(f"[ConstellationAPI] Job {job_id} still running")
            update_job(job_id, status="running")
            return "running"

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
        if job.results is not None:
            logging.info(f"[ConstellationAPI] Returning cached results for job {job_id}")
            return job.results

        futures = self.futures.get(job_id, [])

        if not futures:
            logging.error(f"[ConstellationAPI] No futures for job {job_id}; cannot fetch results")
            raise Exception("No futures available to fetch results for this job")

        logging.info(f"[ConstellationAPI] Blocking until Ray returns results for {len(futures)} tasks")

        results = self.server.get_results(futures)

        logging.info(f"[ConstellationAPI] Results retrieved for job {job_id}: {results}")
        print(f"[ConstellationAPI] Job {job_id} results:", results)  # Keep this - useful!

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