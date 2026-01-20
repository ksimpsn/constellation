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
import uuid

import csv, json, os, importlib.util
import dill
import ray
from datetime import datetime
from backend.core.server import Cluster

from backend.core.database import (
    get_session, 
    # Legacy functions (for backward compatibility)
    Job, save_job, update_job, get_job,
    # New schema models and functions
    Project, Run, Task, TaskResult, Worker, WorkerHeartbeat,
    create_project, get_project,
    create_run, get_run, update_run,
    create_task, get_pending_tasks, assign_task, update_task,
    create_task_result,
    register_worker, update_worker_heartbeat, get_available_workers
)

class ConstellationAPI:
    """
    Handles higher-level job orchestration.
    Flask will call these methods to interact with the Ray backend.
    """

    def __init__(self):
        self.server = Cluster() # start_cluster, submit_tasks, get_results
        self.server.start_cluster()
        # Map run_id to Ray futures (since ObjectRefs cannot be stored in DB)
        self.futures: dict[str, List[ray.ObjectRef]] = {}  # run_id -> List[ray.ObjectRef]
        # Map legacy job_id (integer) to run_id (string) for backward compatibility
        self.job_id_to_run_id: dict[int, str] = {}
        self.counter = 0  # for legacy job_id compatibility
        print("[ConstellationAPI] Initialized API layer.")

    # ---------------------------------------------------------
    # Worker Management
    # ---------------------------------------------------------
    def sync_ray_workers_to_db(self):
        """Sync connected Ray nodes to Worker table in database."""
        try:
            nodes = ray.nodes()
            for node in nodes:
                node_id = node.get("NodeID")
                ip = node.get("NodeManagerAddress")
                alive = node.get("Alive", False)
                resources = node.get("Resources", {})
                
                if not alive:
                    continue
                
                # Check if worker exists in database
                with get_session() as session:
                    worker = session.query(Worker).filter_by(ray_node_id=node_id).first()
                    
                    if not worker:
                        # New Ray node - register with generic name
                        # Note: user_id should be set when worker connects via API
                        worker_id = f"worker-{uuid.uuid4()}"
                        worker = register_worker(
                            worker_id=worker_id,
                            worker_name=f"Ray-Node-{node_id[:8]}",
                            ip_address=ip,
                            cpu_cores=int(resources.get("CPU", 0)),
                            memory_gb=resources.get("memory", 0) / (1024**3),
                            ray_node_id=node_id
                        )
                        logging.info(f"[INFO] Registered new Ray worker: {worker.worker_id}")
                    else:
                        # Update existing worker
                        worker.ip_address = ip
                        worker.cpu_cores = int(resources.get("CPU", 0))
                        worker.memory_gb = resources.get("memory", 0) / (1024**3)
                        worker.last_heartbeat = datetime.utcnow()
                        worker.status = "online"
                        session.commit()
        except Exception as e:
            logging.error(f"[ERROR] Failed to sync Ray workers: {e}")

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
            chunk_size: int = 1000,
            researcher_id: str = None,
            title: str = None,
            description: str = None
    ) -> int:
        """
        Full pipeline for researcher-uploaded projects.

        Steps:
          1. Load user Python function (from .py file)
          2. Serialize function to bytes (fn_bytes)
          3. Load dataset (CSV or JSON)
          4. Chunk dataset
          5. Create Project, Run, and Tasks in DB
          6. Submit Ray tasks (each receives rows + fn_bytes)
          7. Store files locally (will be S3 later)

        Returns:
            job_id (int): Legacy job ID for backward compatibility with frontend
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
        # ---------------------------------------------------------
        chunks = [
            data[i:i + chunk_size]
            for i in range(0, len(data), chunk_size)
        ]

        # ---------------------------------------------------------
        # 4. Create Project in DB
        # ---------------------------------------------------------
        # Default researcher_id if not provided (for backward compatibility)
        if not researcher_id:
            researcher_id = "user-default"  # TODO: Get from auth context
        
        if not title:
            title = f"Project {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        project = create_project(
            researcher_id=researcher_id,
            title=title,
            description=description or "",
            code_path=code_path,  # Will be S3 path later
            dataset_path=dataset_path,  # Will be S3 path later
            dataset_type=file_type,
            func_name=func_name,
            chunk_size=chunk_size
        )
        
        # Copy files to project directory
        os.makedirs(f"uploads/{project.project_id}", exist_ok=True)
        stored_code_path = f"uploads/{project.project_id}/project.py"
        stored_dataset_path = f"uploads/{project.project_id}/dataset.{file_type}"
        shutil.copyfile(code_path, stored_code_path)
        shutil.copyfile(dataset_path, stored_dataset_path)
        
        # Update project with stored paths
        project.code_s3_path = stored_code_path
        project.dataset_s3_path = stored_dataset_path
        with get_session() as session:
            session.merge(project)
            session.commit()

        # ---------------------------------------------------------
        # 5. Create Run and Tasks in DB
        # ---------------------------------------------------------
        run = create_run(project_id=project.project_id, total_tasks=len(chunks))
        run.started_at = datetime.utcnow()
        run.status = "running"
        with get_session() as session:
            session.merge(run)
            session.commit()
        
        # Create Task records for each chunk
        tasks = []
        for idx, chunk in enumerate(chunks):
            task = create_task(run_id=run.run_id, task_index=idx)
            tasks.append(task)

        # ---------------------------------------------------------
        # 6. Create Ray payloads (using DB task_ids)
        # ---------------------------------------------------------
        payloads = []
        for task in tasks:
            chunk = chunks[task.task_index]
            payloads.append({
                "task_id": task.task_id,  # Use DB task_id instead of index
                "rows": chunk,
                "params": None
            })

        # ---------------------------------------------------------
        # 7. Sync Ray workers to database before task submission
        # ---------------------------------------------------------
        self.sync_ray_workers_to_db()

        # ---------------------------------------------------------
        # 8. Submit tasks to Ray
        # ---------------------------------------------------------
        print(f"[DEBUG] About to submit: {len(payloads)} payloads")
        futures = self.server.submit_uploaded_tasks(payloads, fn_bytes)
        print(f"[DEBUG] Received {len(futures)} futures from submit_uploaded_tasks")
        
        # Store futures mapped to run_id
        self.futures[run.run_id] = futures
        
        # For backward compatibility: map legacy job_id to run_id
        legacy_job_id = self.counter
        self.counter += 1
        self.job_id_to_run_id[legacy_job_id] = run.run_id
        
        # Also save to legacy Job table for backward compatibility
        save_job(job_id=legacy_job_id, data={"run_id": run.run_id, "project_id": project.project_id}, status="submitted")

        logging.info(f"[INFO] Submitted uploaded project: project_id={project.project_id}, run_id={run.run_id}, job_id={legacy_job_id}, chunks={len(chunks)}")

        return legacy_job_id  # Return legacy job_id for frontend compatibility

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
        Returns the current status of the job/run.
        Status could be: submitted, running, complete, failed, etc.
        
        Args:
            job_id: Legacy integer job_id (will map to run_id internally)
        """
        from datetime import datetime
        
        logging.info(f"[ConstellationAPI] Status check for job_id={job_id}")

        # Map legacy job_id to run_id
        run_id = self.job_id_to_run_id.get(job_id)
        
        # Fallback to legacy Job table for backward compatibility
        if not run_id:
            legacy_job = get_job(job_id)
            if legacy_job and legacy_job.data and isinstance(legacy_job.data, dict):
                run_id = legacy_job.data.get("run_id")
        
        # Use new Run table if we have run_id
        if run_id:
            run = get_run(run_id)
            if not run:
                logging.error(f"[ConstellationAPI] Run {run_id} not found in DB")
                raise Exception("Run not found")
            
            current_status = run.status
            logging.info(f"[ConstellationAPI] Current stored status for run {run_id}: {current_status}")

            # If already complete, no need to re-check
            if current_status in ["completed", "failed", "cancelled"]:
                return "complete" if current_status == "completed" else current_status

            # Check Ray futures to update status
            futures = self.futures.get(run_id, [])
            if not futures:
                logging.warning(f"[ConstellationAPI] No futures found for run {run_id}; returning stored status")
                return current_status

            logging.info(f"[ConstellationAPI] Checking {len(futures)} Ray futures for run {run_id}")
            done, not_done = ray.wait(futures, num_returns=len(futures), timeout=0)

            logging.info(
                f"[ConstellationAPI] Run {run_id} -> "
                f"{len(done)} done, {len(not_done)} not done"
            )

            if len(done) == len(futures):
                logging.info(f"[ConstellationAPI] All futures completed for run {run_id}")
                update_run(run_id, status="completed", completed_at=datetime.utcnow())
                # Update legacy job too
                update_job(job_id, status="complete")
                return "complete"
            else:
                if current_status == "pending":
                    update_run(run_id, status="running", started_at=datetime.utcnow())
                update_job(job_id, status="running")
                return "running"
        
        # Fallback to legacy Job table
        legacy_job = get_job(job_id)
        if not legacy_job:
            logging.error(f"[ConstellationAPI] Job {job_id} not found in DB")
            raise Exception("Job not found")

        current_status = legacy_job.status
        if current_status == "complete":
            return "complete"

        futures = self.futures.get(job_id, [])
        if not futures:
            return current_status or "submitted"

        done, not_done = ray.wait(futures, num_returns=len(futures), timeout=0)
        if len(done) == len(futures):
            update_job(job_id, status="complete")
            return "complete"
        else:
            update_job(job_id, status="running")
            return "running"

    # ---------------------------------------------------------
    # Result Retrieval
    # ---------------------------------------------------------
    def get_results(self, job_id):
        """
        Retrieve results for a completed job/run.
        Blocks until results are ready.
        
        Args:
            job_id: Legacy integer job_id (will map to run_id internally)
        """
        from datetime import datetime
        
        logging.info(f"[ConstellationAPI] Fetching results for job_id={job_id}")

        # Map legacy job_id to run_id
        run_id = self.job_id_to_run_id.get(job_id)
        
        # Fallback to legacy Job table
        if not run_id:
            legacy_job = get_job(job_id)
            if legacy_job and legacy_job.data and isinstance(legacy_job.data, dict):
                run_id = legacy_job.data.get("run_id")
        
        # Use new Run table if we have run_id
        if run_id:
            run = get_run(run_id)
            if not run:
                logging.error(f"[ConstellationAPI] Run {run_id} not found")
                raise Exception("Run not found")
            
            # Check if results already in TaskResult table
            with get_session() as session:
                from backend.core.database import TaskResult
                task_results = session.query(TaskResult).filter_by(run_id=run_id).all()
                if task_results and len(task_results) == run.total_tasks:
                    # All results already stored
                    results = []
                    # Sort by task_index to maintain order
                    for tr in sorted(task_results, key=lambda x: x.task.task_index if x.task else 0):
                        results.append({
                            "task_id": tr.task_id,
                            "result": tr.result_data,
                            "runtime_seconds": tr.runtime_seconds
                        })
                    logging.info(f"[ConstellationAPI] Returning cached results for run {run_id}")
                    return results

            # Fetch from Ray futures
            futures = self.futures.get(run_id, [])
            if not futures:
                logging.error(f"[ConstellationAPI] No futures for run {run_id}; cannot fetch results")
                raise Exception("No futures available to fetch results for this run")

            logging.info(f"[ConstellationAPI] Blocking until Ray returns results for {len(futures)} tasks")
            ray_results = self.server.get_results(futures)

            # Store results in TaskResult table
            project = get_project(run.project_id)
            results = []
            completed_count = 0
            failed_count = 0
            
            with get_session() as session:
                for ray_result in ray_results:
                    task_id = ray_result.get("task_id")
                    task = session.query(Task).filter_by(task_id=task_id).first()
                    if not task:
                        # Fallback: try to find by index if task_id is integer
                        task = session.query(Task).filter_by(run_id=run_id, task_index=task_id).first()
                    
                    if task:
                        result_data = ray_result.get("results", ray_result)
                        runtime = ray_result.get("runtime_seconds")
                        
                        # Check if task failed
                        if ray_result.get("error"):
                            # Task failed
                            task.status = "failed"
                            task.error_message = ray_result.get("error")
                            task.completed_at = datetime.utcnow()
                            failed_count += 1
                        else:
                            # Task completed successfully
                            task.status = "completed"
                            task.completed_at = datetime.utcnow()
                            completed_count += 1
                        
                        task.updated_at = datetime.utcnow()
                        
                        # Map Ray node_id to Worker.worker_id
                        node_id = ray_result.get("node_id")
                        if node_id:
                            # Find worker by ray_node_id
                            worker = session.query(Worker).filter_by(ray_node_id=node_id).first()
                            worker_id = worker.worker_id if worker else "worker-unknown"
                        else:
                            worker_id = "worker-unknown"
                        
                        # Create or update TaskResult (within current session)
                        tr = session.query(TaskResult).filter_by(task_id=task.task_id).first()
                        if not tr:
                            tr = TaskResult(
                                task_id=task.task_id,
                                run_id=run_id,
                                project_id=project.project_id,
                                worker_id=worker_id,  # Now correctly mapped from Ray node_id
                                result_data=result_data,
                                runtime_seconds=runtime,
                                completed_at=datetime.utcnow()
                            )
                            session.add(tr)
                        
                        results.append({
                            "task_id": task.task_id,
                            "result": result_data,
                            "runtime_seconds": runtime
                        })
                
                # Update run with completed/failed task counts
                run = session.query(Run).filter_by(run_id=run_id).first()
                if run:
                    run.completed_tasks = completed_count
                    run.failed_tasks = failed_count
                    run.updated_at = datetime.utcnow()
                    session.commit()

            logging.info(f"[ConstellationAPI] Results retrieved for run {run_id}: {len(results)} results ({completed_count} completed, {failed_count} failed)")
            update_run(run_id, status="completed", completed_at=datetime.utcnow())
            update_job(job_id, results=results, status="complete")
            return results
        
        # Fallback to legacy Job table
        legacy_job = get_job(job_id)
        if not legacy_job:
            logging.error(f"[ConstellationAPI] Job {job_id} not found")
            raise Exception("Job not found")

        if legacy_job.results is not None:
            logging.info(f"[ConstellationAPI] Returning cached results for job {job_id}")
            return legacy_job.results

        futures = self.futures.get(job_id, [])
        if not futures:
            logging.error(f"[ConstellationAPI] No futures for job {job_id}; cannot fetch results")
            raise Exception("No futures available to fetch results for this job")

        results = self.server.get_results(futures)
        update_job(job_id, results=results, status="complete")
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