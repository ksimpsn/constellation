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
import importlib.util
import dill
import ray
import threading
import time
from sqlalchemy import func
from datetime import datetime
from backend.core.server import Cluster

from backend.core.database import (
    get_session,
    Job, save_job, update_job, get_job,
    # New schema models and functions
    Run, Task, TaskResult, Worker, WorkerHeartbeat,
    create_project, get_project,
    create_run, get_run, update_run,
    create_task, get_pending_tasks, assign_task, update_task,
    create_task_result,
    register_worker, update_worker_heartbeat, get_available_workers, user_has_role,
    fetch_final_task_results_with_index,
    link_aws_project_contributor,
)
from backend.core.database_aws import update_aws_project_chunks

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
        self.run_id_to_job_id: dict[str, int] = {}
        self.run_fn_bytes: dict[str, bytes] = {}
        # In-memory queue for runs waiting on volunteer workers.
        self.queued_runs: dict[str, dict] = {}
        # Deferred replica payloads: replicas that could not be assigned to a
        # distinct node at dispatch time. Keyed by run_id.
        self.pending_replicas: dict[str, list[dict]] = {}
        # Track runs currently being finalized to avoid duplicate processing.
        self._runs_finalizing: set[str] = set()
        self._lock = threading.RLock()
        self.counter = 0  # for legacy job_id compatibility
        self._background_worker = threading.Thread(
            target=self._background_result_processor,
            name="constellation-result-processor",
            daemon=True,
        )
        self._background_worker.start()
        print("[ConstellationAPI] Initialized API layer.")

    def get_run_progress(self, run_id):
        """
        Return (completed_count, total_count) for a run from Ray futures when available.
        Used so the frontend can show live task progress while a run is in progress.
        """
        run = get_run(run_id)
        if not run:
            return None
        total = run.total_tasks or 0
        futures = self.futures.get(run_id, [])
        if not futures:
            return (run.completed_tasks, total)
        try:
            done, _ = ray.wait(futures, num_returns=len(futures), timeout=0)
            return (len(done), total)
        except Exception:
            return (run.completed_tasks, total)
    def _background_result_processor(self):
        """Continuously ingest finished Ray tasks and finalize runs."""
        while True:
            try:
                self.try_dispatch_queued_runs()
                self._process_runs_once()
            except Exception as e:
                logging.exception(f"[ConstellationAPI] Background processor error: {e}")
            time.sleep(1.0)

    def _process_runs_once(self):
        with self._lock:
            run_ids = [run_id for run_id in self.futures.keys() if isinstance(run_id, str)]

        for run_id in run_ids:
            with self._lock:
                pending = list(self.futures.get(run_id, []))
            if not pending:
                continue

            done, not_done = ray.wait(pending, num_returns=len(pending), timeout=0)
            if done:
                try:
                    ray_results = list(self.server.get_results(done))
                except ray.exceptions.TaskUnschedulableError as e:
                    # Avoid endless background-loop spam when a pinned node disappears.
                    logging.error(
                        "[ConstellationAPI] Run %s unschedulable; marking failed: %s",
                        run_id,
                        e,
                    )
                    with get_session() as session:
                        run_row = session.query(Run).filter_by(run_id=run_id).first()
                        if run_row:
                            run_row.status = "failed"
                            run_row.completed_at = datetime.utcnow()
                            run_row.updated_at = datetime.utcnow()
                        session.query(Task).filter(
                            Task.run_id == run_id,
                            Task.status.in_(["pending", "assigned", "running"]),
                        ).update(
                            {
                                Task.status: "failed",
                                Task.error_message: "Task became unschedulable (target node unavailable).",
                                Task.updated_at: datetime.utcnow(),
                            },
                            synchronize_session=False,
                        )
                        session.commit()

                    job_id = self.run_id_to_job_id.get(run_id)
                    if job_id is not None:
                        update_job(job_id, status="failed")

                    with self._lock:
                        self.futures.pop(run_id, None)
                        self.run_fn_bytes.pop(run_id, None)
                        self._runs_finalizing.discard(run_id)
                    continue

                self._record_results(run_id, ray_results)
                self._verify_completed_chunks_incrementally(run_id)

            with self._lock:
                self.futures[run_id] = list(not_done)
                # Don't finalize while deferred replicas are still waiting to be
                # dispatched — those futures haven't been added yet.
                has_pending_replicas = bool(self.pending_replicas.get(run_id))
                should_finalize = (
                    len(not_done) == 0
                    and not has_pending_replicas
                    and run_id not in self._runs_finalizing
                )
                if should_finalize:
                    self._runs_finalizing.add(run_id)

            if should_finalize:
                try:
                    self._finalize_run(run_id)
                finally:
                    with self._lock:
                        self._runs_finalizing.discard(run_id)

    def _record_results(self, run_id: str, ray_results: list[dict]):
        """Persist raw task completion rows as soon as Ray futures resolve."""
        now = datetime.utcnow()
        with get_session() as session:
            for ray_result in ray_results:
                task_id = ray_result.get("task_id")
                task = session.query(Task).filter_by(task_id=task_id).first()
                if not task:
                    continue

                result_data = ray_result.get("results", ray_result)
                runtime = ray_result.get("runtime_seconds")
                prev_status = task.status
                task.raw_result_data = result_data
                task.raw_runtime_seconds = runtime
                task.completed_at = now
                task.updated_at = now

                if ray_result.get("error"):
                    task.status = "failed"
                    task.error_message = ray_result.get("error")
                else:
                    task.status = "completed"
                    task.error_message = None

                # Attribution should follow task assignment, not node identity.
                if prev_status not in ["completed", "failed"]:
                    worker = None
                    if task.assigned_worker_id:
                        worker = session.query(Worker).filter_by(worker_id=task.assigned_worker_id).first()
                    if worker is None:
                        node_id = ray_result.get("node_id")
                        if node_id:
                            worker = session.query(Worker).filter_by(ray_node_id=node_id).first()

                    if worker:
                        runtime_val = float(runtime) if isinstance(runtime, (int, float)) else 0.0
                        worker.total_cpu_time_seconds = (worker.total_cpu_time_seconds or 0.0) + runtime_val
                        if task.status == "completed":
                            worker.tasks_completed = (worker.tasks_completed or 0) + 1
                        elif task.status == "failed":
                            worker.tasks_failed = (worker.tasks_failed or 0) + 1
                        worker.updated_at = now
            session.commit()

    def _build_chunk_outputs(self, run_id: str) -> dict[int, dict[str, dict]]:
        chunk_outputs: dict[int, dict[str, dict]] = {}
        with get_session() as session:
            tasks = session.query(Task).filter(Task.run_id == run_id, Task.status == "completed").all()
            for task in tasks:
                if task.raw_result_data is None:
                    continue
                chunk_outputs.setdefault(task.task_index, {})[task.task_id] = {
                    "task_id": task.task_id,
                    "output": task.raw_result_data,
                    "runtime_seconds": task.raw_runtime_seconds,
                }
        return chunk_outputs

    def _upsert_verified_results(self, run_id: str, project_id: str, verified_by_chunk: dict[int, dict]):
        """Persist currently verified chunks without waiting for the full run to finish."""
        with get_session() as session:
            for chunk_idx, verified_item in verified_by_chunk.items():
                supporting_task_ids = verified_item.get("supporting_task_ids") or []
                canonical_task_id = supporting_task_ids[0] if supporting_task_ids else None
                if not canonical_task_id:
                    continue

                existing = (
                    session.query(TaskResult)
                    .join(Task, TaskResult.task_id == Task.task_id)
                    .filter(
                        TaskResult.run_id == run_id,
                        Task.task_index == chunk_idx,
                    )
                    .first()
                )

                if existing:
                    existing.task_id = canonical_task_id
                    existing.result_data = verified_item.get("output")
                    existing.runtime_seconds = verified_item.get("runtime_seconds")
                    existing.completed_at = datetime.utcnow()
                else:
                    session.add(TaskResult(
                        task_id=canonical_task_id,
                        run_id=run_id,
                        project_id=project_id,
                        result_data=verified_item.get("output"),
                        runtime_seconds=verified_item.get("runtime_seconds"),
                        completed_at=datetime.utcnow(),
                    ))
            session.commit()

    def _verify_completed_chunks_incrementally(self, run_id: str):
        """
        Verify and persist chunks whose tasks are all terminal, without waiting
        for all chunks in the run to finish.
        """
        with get_session() as session:
            run_row = session.query(Run).filter_by(run_id=run_id).first()
            if not run_row or run_row.status in ["completed", "failed", "cancelled"]:
                return
            project = get_project(run_row.project_id)
            if not project:
                return
            project_id = run_row.project_id
            replication_factor = max(1, int(project.replication_factor or 1))

            verified_chunk_indexes = {
                chunk_idx
                for (chunk_idx,) in (
                    session.query(Task.task_index)
                    .join(TaskResult, TaskResult.task_id == Task.task_id)
                    .filter(TaskResult.run_id == run_id)
                    .distinct()
                    .all()
                )
            }
            tasks = session.query(Task).filter(Task.run_id == run_id).all()

        tasks_by_chunk: dict[int, list[Task]] = {}
        for task in tasks:
            tasks_by_chunk.setdefault(task.task_index, []).append(task)

        newly_verified: dict[int, dict] = {}
        for chunk_idx, chunk_tasks in tasks_by_chunk.items():
            if chunk_idx in verified_chunk_indexes:
                continue

            statuses = {task.status for task in chunk_tasks}
            if statuses.intersection({"pending", "assigned", "running"}):
                continue

            chunk_outputs = []
            for task in chunk_tasks:
                if task.status == "completed" and task.raw_result_data is not None:
                    chunk_outputs.append({
                        "task_id": task.task_id,
                        "output": task.raw_result_data,
                        "runtime_seconds": task.raw_runtime_seconds,
                    })

            verified, verified_output, supporting_task_ids = self._verify_chunk_outputs(
                chunk_outputs,
                replication_factor=replication_factor,
            )
            if not verified:
                continue

            runtimes = [
                item.get("runtime_seconds")
                for item in chunk_outputs
                if item.get("task_id") in supporting_task_ids and item.get("runtime_seconds") is not None
            ]
            avg_runtime = sum(runtimes) / len(runtimes) if runtimes else None
            newly_verified[chunk_idx] = {
                "output": verified_output,
                "supporting_task_ids": supporting_task_ids,
                "runtime_seconds": avg_runtime,
            }

        if newly_verified:
            self._upsert_verified_results(run_id, project_id, newly_verified)

    def _finalize_run(self, run_id: str):
        """Verify outputs and persist one TaskResult per logical chunk."""
        job_id = self.run_id_to_job_id.get(run_id)

        with get_session() as session:
            run_row = session.query(Run).filter_by(run_id=run_id).first()
            if not run_row:
                return
            project = get_project(run_row.project_id)
            if not project:
                return
            project_id = run_row.project_id
            replication_factor = max(1, int(project.replication_factor or 1))
            max_verification_attempts = max(0, int(project.max_verification_attempts or 0))
            dataset_type = project.dataset_type
            dataset_path = project.dataset_s3_path
            chunk_size = max(1, int(getattr(project, "chunk_size", 1) or 1))
            run_row.status = "verifying"
            run_row.updated_at = datetime.utcnow()
            session.commit()

        if job_id is not None:
            update_job(job_id, status="verifying")

        if dataset_type.lower() == "csv":
            all_rows = self._load_csv(dataset_path)
        elif dataset_type.lower() == "json":
            all_rows = self._load_json(dataset_path)
        else:
            raise ValueError(f"Unsupported dataset type: {dataset_type}")

        # Main-branch flow expects project.chunk_size to exist; AWS-backed project lookups
        # can return a SimpleNamespace without that field. Infer from persisted run tasks.
        if not getattr(project, "chunk_size", None):
            with get_session() as session:
                logical_chunks = (
                    session.query(Task.task_index)
                    .filter(Task.run_id == run_id)
                    .distinct()
                    .count()
                )
            if logical_chunks > 0 and len(all_rows) > 0:
                chunk_size = max(1, (len(all_rows) + logical_chunks - 1) // logical_chunks)
            else:
                chunk_size = 1

        chunks = [all_rows[i:i + chunk_size] for i in range(0, len(all_rows), chunk_size)]

        chunk_outputs = self._build_chunk_outputs(run_id)
        verified_by_chunk: dict[int, dict] = {}
        unresolved_chunks = set(range(len(chunks)))

        for attempt in range(max_verification_attempts + 1):
            unresolved_chunks = set()
            for chunk_idx in range(len(chunks)):
                chunk_attempt_outputs = list(chunk_outputs.get(chunk_idx, {}).values())
                verified, verified_output, supporting_task_ids = self._verify_chunk_outputs(
                    chunk_attempt_outputs,
                    replication_factor=replication_factor,
                )
                if verified:
                    runtimes = [
                        item.get("runtime_seconds")
                        for item in chunk_attempt_outputs
                        if item.get("task_id") in supporting_task_ids and item.get("runtime_seconds") is not None
                    ]
                    avg_runtime = sum(runtimes) / len(runtimes) if runtimes else None
                    verified_by_chunk[chunk_idx] = {
                        "output": verified_output,
                        "supporting_task_ids": supporting_task_ids,
                        "runtime_seconds": avg_runtime,
                    }
                else:
                    unresolved_chunks.add(chunk_idx)

            # Persist verified chunks as they become available (partial progress).
            if verified_by_chunk:
                self._upsert_verified_results(run_id, project_id, verified_by_chunk)

            if not unresolved_chunks:
                break
            if attempt >= max_verification_attempts:
                break

            retry_payloads = []
            now = datetime.utcnow()
            for chunk_idx in sorted(unresolved_chunks):
                with get_session() as session:
                    task = (
                        session.query(Task)
                        .filter(Task.run_id == run_id, Task.task_index == chunk_idx)
                        .order_by(Task.retry_count.asc(), Task.replica_index.asc())
                        .first()
                    )
                    if not task:
                        continue
                    task.retry_count = (task.retry_count or 0) + 1
                    task.status = "assigned"
                    task.assigned_at = now
                    task.updated_at = now
                    task.error_message = None
                    session.commit()
                    retry_payloads.append({
                        "task_id": task.task_id,
                        "task_index": chunk_idx,
                        "replica_index": task.replica_index,
                        "rows": chunks[chunk_idx],
                        "params": None,
                    })

            if not retry_payloads:
                break

            retry_futures = self._dispatch_run_to_volunteers(
                run_id=run_id,
                payloads=retry_payloads,
                fn_bytes=self.run_fn_bytes.get(run_id),
            )
            if not retry_futures:
                break

            retry_results = list(self.server.get_results(retry_futures))
            self._record_results(run_id, retry_results)
            for item in retry_results:
                task_id = item.get("task_id")
                with get_session() as session:
                    task = session.query(Task).filter_by(task_id=task_id).first()
                    if task and task.status == "completed" and task.raw_result_data is not None:
                        chunk_outputs.setdefault(task.task_index, {})[task.task_id] = {
                            "task_id": task.task_id,
                            "output": task.raw_result_data,
                            "runtime_seconds": task.raw_runtime_seconds,
                        }

        if unresolved_chunks:
            with get_session() as session:
                failure_message = (
                    "Verification failed: no consensus output across replicas "
                    f"after {max_verification_attempts} retry attempts"
                )
                # Mark all tasks in unresolved chunks as failed (verification-level failure).
                unresolved_tasks = (
                    session.query(Task)
                    .filter(
                        Task.run_id == run_id,
                        Task.task_index.in_(list(unresolved_chunks))
                    )
                    .all()
                )
                for task in unresolved_tasks:
                    task.status = "failed"
                    task.error_message = failure_message
                    task.updated_at = datetime.utcnow()

                run_row = session.query(Run).filter_by(run_id=run_id).first()
                if run_row:
                    completed_count = session.query(Task).filter(
                        Task.run_id == run_id, Task.status == "completed"
                    ).count()
                    failed_count = session.query(Task).filter(
                        Task.run_id == run_id, Task.status == "failed"
                    ).count()
                    run_row.completed_tasks = completed_count
                    run_row.failed_tasks = failed_count
                    run_row.status = "failed"
                    run_row.completed_at = datetime.utcnow()
                    run_row.updated_at = datetime.utcnow()
                    session.commit()
            if job_id is not None:
                update_job(job_id, status="failed")
            with self._lock:
                self.futures.pop(run_id, None)
                self.run_fn_bytes.pop(run_id, None)
            return

        # Ensure latest verified results are persisted before marking run complete.
        if verified_by_chunk:
            self._upsert_verified_results(run_id, project_id, verified_by_chunk)

        results = []
        with get_session() as session:
            persisted = (
                session.query(TaskResult, Task.task_index)
                .join(Task, TaskResult.task_id == Task.task_id)
                .filter(TaskResult.run_id == run_id)
                .order_by(Task.task_index)
                .all()
            )
            seen_chunks = set()
            for tr, chunk_idx in persisted:
                if chunk_idx in seen_chunks:
                    continue
                seen_chunks.add(chunk_idx)
                results.append({
                    "task_index": chunk_idx,
                    "task_id": tr.task_id,
                    "result": tr.result_data,
                    "runtime_seconds": tr.runtime_seconds,
                })

            completed_count = session.query(Task).filter(
                Task.run_id == run_id, Task.status == "completed"
            ).count()
            failed_count = session.query(Task).filter(
                Task.run_id == run_id, Task.status == "failed"
            ).count()
            run_row = session.query(Run).filter_by(run_id=run_id).first()
            if run_row:
                run_row.completed_tasks = completed_count
                run_row.failed_tasks = failed_count
                run_row.status = "completed"
                run_row.completed_at = datetime.utcnow()
                run_row.updated_at = datetime.utcnow()
            session.commit()

        if job_id is not None:
            update_job(job_id, results=results, status="complete")

        projects_dir = f"projects/{project_id}"
        if os.path.isdir(projects_dir):
            out_path = os.path.join(projects_dir, f"results_{run_id}.json")
            try:
                payload = {
                    "run_id": run_id,
                    "project_id": project_id,
                    "total_tasks": len(results),
                    "results": results,
                }
                with open(out_path, "w") as f:
                    json.dump(payload, f, indent=2, default=str)
            except Exception as e:
                logging.warning(f"[ConstellationAPI] Could not write results to {out_path}: {e}")

        with self._lock:
            self.futures.pop(run_id, None)
            self.run_fn_bytes.pop(run_id, None)

    # ---------------------------------------------------------
    # Worker Management
    # ---------------------------------------------------------
    def _canonicalize_output(self, value: Any) -> str:
        """Stable serialization used for result verification comparisons."""
        return json.dumps(value, sort_keys=True, default=str)

    def _verify_chunk_outputs(self, chunk_outputs: list[dict], replication_factor: int):
        """
        Verify a chunk by comparing actual worker outputs.
        Returns (verified: bool, verified_output, supporting_task_ids).
        """
        if not chunk_outputs:
            return False, None, []

        groups: dict[str, dict] = {}
        for item in chunk_outputs:
            signature = self._canonicalize_output(item["output"])
            bucket = groups.setdefault(signature, {"count": 0, "output": item["output"], "task_ids": []})
            bucket["count"] += 1
            bucket["task_ids"].append(item["task_id"])

        best = max(groups.values(), key=lambda g: g["count"])
        if best["count"] >= max(1, replication_factor):
            return True, best["output"], best["task_ids"]

        return False, None, []

    def _get_live_ray_nodes(self) -> dict:
        """Return live Ray node metadata keyed by node id."""
        live_nodes = {}
        for node in ray.nodes():
            if node.get("Alive", False):
                live_nodes[node.get("NodeID")] = node
        return live_nodes

    def _get_connected_volunteer_workers(self, live_nodes: dict | None = None) -> list[Worker]:
        """
        Return volunteer-owned workers that map to currently live non-head Ray nodes.
        """
        if live_nodes is None:
            live_nodes = self._get_live_ray_nodes()

        eligible_node_ids = {
            node_id for node_id, node in live_nodes.items()
            if not node.get("IsHeadNode", False)
        }

        with get_session() as session:
            workers = (
                session.query(Worker)
                .filter(
                    Worker.user_id.isnot(None),
                    Worker.ray_node_id.isnot(None),
                    Worker.status.in_(["online", "idle", "busy"])
                )
                .all()
            )
            volunteer_workers = []
            for worker in workers:
                if not user_has_role(worker.user_id, "volunteer"):
                    continue
                if worker.ray_node_id in eligible_node_ids:
                    volunteer_workers.append(worker)
            return volunteer_workers

    @staticmethod
    def _worker_name_key(worker: Worker) -> str:
        """
        Stable identity key for replica-placement uniqueness.
        Prefer worker_name, with worker_id fallback for empty names.
        """
        worker_name = (worker.worker_name or "").strip()
        if worker_name:
            return worker_name
        return f"worker-id:{worker.worker_id}"

    def _dispatch_run_to_volunteers(self, run_id: str, payloads: list[dict], fn_bytes) -> list[ray.ObjectRef]:
        """
        Submit payloads to volunteer nodes, guaranteeing distinct worker_name values
        per replica of the same task_index whenever possible.

        When num_nodes < replication_factor, only the first num_nodes replicas of each
        task are submitted now; the remainder are stored in self.pending_replicas[run_id]
        and dispatched automatically as more volunteer nodes join.

        Returns futures for the tasks that were submitted immediately.
        """
        if fn_bytes is None:
            raise RuntimeError(f"Missing serialized function bytes for run {run_id}")
        live_nodes = self._get_live_ray_nodes()
        volunteer_workers = self._get_connected_volunteer_workers(live_nodes=live_nodes)
        if not volunteer_workers:
            return []

        worker_entries = sorted(
            [(w.ray_node_id, w) for w in volunteer_workers if w.ray_node_id],
            key=lambda item: (
                self._worker_name_key(item[1]),
                item[1].worker_id,
                item[0],
            ),
        )
        if not worker_entries:
            return []
        node_id_to_worker = {node_id: worker for node_id, worker in worker_entries}
        num_workers = len(worker_entries)

        # Group and sort replicas by task_index so we can assign each to a distinct node.
        from collections import defaultdict
        by_task: dict[int, list[dict]] = defaultdict(list)
        for payload in payloads:
            by_task[payload["task_index"]].append(payload)
        for replicas in by_task.values():
            replicas.sort(key=lambda p: p["replica_index"])

        to_submit: list[tuple[dict, str]] = []   # (payload, target_node_id)
        to_defer:  list[dict] = []

        for task_index, replicas in by_task.items():
            used_worker_names: set[str] = set()
            for replica_index, payload in enumerate(replicas):
                chosen_node_id = None
                for offset in range(num_workers):
                    # Offset by task_index/replica_index so tasks don't always start from worker 0.
                    node_id, worker = worker_entries[(task_index + replica_index + offset) % num_workers]
                    worker_name_key = self._worker_name_key(worker)
                    if worker_name_key in used_worker_names:
                        continue
                    chosen_node_id = node_id
                    used_worker_names.add(worker_name_key)
                    break

                if chosen_node_id is None:
                    to_defer.append(payload)
                    continue

                to_submit.append((payload, chosen_node_id))

        now = datetime.utcnow()
        with get_session() as session:
            for payload, node_id in to_submit:
                task = session.query(Task).filter_by(task_id=payload["task_id"]).first()
                if not task:
                    continue
                worker = node_id_to_worker.get(node_id)
                if worker:
                    task.assigned_worker_id = worker.worker_id
                task.status = "assigned"
                task.assigned_at = now
                task.updated_at = now
            session.commit()

        submit_payloads  = [p for p, _ in to_submit]
        submit_node_ids  = [n for _, n in to_submit]
        futures = self.server.submit_uploaded_tasks(submit_payloads, fn_bytes, target_node_ids=submit_node_ids)

        if to_defer:
            with self._lock:
                existing = self.pending_replicas.get(run_id, [])
                self.pending_replicas[run_id] = existing + to_defer
            logging.info(
                f"[DISPATCH] Run {run_id}: submitted {len(to_submit)} replica(s) immediately, "
                f"deferred {len(to_defer)} replica(s) until more volunteer nodes join."
            )

        return futures

    def try_dispatch_queued_runs(self) -> int:
        """
        Dispatch all queued runs waiting for volunteer workers, then attempt to
        send any deferred replicas for partially-dispatched runs to newly joined nodes.
        Returns the total number of runs/replicas dispatched.
        """
        self.sync_ray_workers_to_db()
        dispatched_count = 0
        queued_run_ids = list(self.queued_runs.keys())

        for run_id in queued_run_ids:
            queue_item = self.queued_runs.get(run_id)
            if not queue_item:
                continue

            futures = self._dispatch_run_to_volunteers(
                run_id=run_id,
                payloads=queue_item["payloads"],
                fn_bytes=queue_item["fn_bytes"]
            )
            if not futures:
                continue

            self.futures[run_id] = futures
            self.queued_runs.pop(run_id, None)
            update_run(run_id, status="running", started_at=datetime.utcnow())

            job_id = self.run_id_to_job_id.get(run_id)
            if job_id is not None:
                update_job(job_id, status="running")
            dispatched_count += 1
            logging.info(f"[INFO] Dispatched queued run {run_id} to volunteer workers.")

        # Also try to assign any deferred replicas from partially-dispatched runs.
        dispatched_count += self._dispatch_pending_replicas()

        return dispatched_count

    def _dispatch_pending_replicas(self) -> int:
        """
        Submit deferred replicas to newly available volunteer nodes.

        For each deferred replica, query which worker_name values are already assigned
        to other replicas of the same task_index, then pick a volunteer worker with a
        different name. If no such worker exists yet, the replica stays deferred.

        Returns the total number of replicas dispatched.
        """
        live_nodes = self._get_live_ray_nodes()
        volunteer_workers = self._get_connected_volunteer_workers(live_nodes=live_nodes)
        if not volunteer_workers:
            return 0

        worker_entries = sorted(
            [(w.ray_node_id, w) for w in volunteer_workers if w.ray_node_id],
            key=lambda item: (
                self._worker_name_key(item[1]),
                item[1].worker_id,
                item[0],
            ),
        )
        if not worker_entries:
            return 0
        node_id_to_worker = {node_id: worker for node_id, worker in worker_entries}

        total_dispatched = 0

        with self._lock:
            pending_run_ids = list(self.pending_replicas.keys())

        for run_id in pending_run_ids:
            with self._lock:
                deferred = list(self.pending_replicas.get(run_id, []))
            if not deferred:
                with self._lock:
                    self.pending_replicas.pop(run_id, None)
                continue

            fn_bytes = self.run_fn_bytes.get(run_id)
            if not fn_bytes:
                continue

            # Build a map: task_index → set of worker_name keys already assigned to that task.
            from collections import defaultdict
            used_worker_names_by_task: dict[int, set[str]] = defaultdict(set)
            with get_session() as session:
                rows = (
                    session.query(Task.task_index, Worker.worker_name, Worker.worker_id)
                    .join(Worker, Task.assigned_worker_id == Worker.worker_id)
                    .filter(
                        Task.run_id == run_id,
                        Task.status.in_(["assigned", "running", "completed"]),
                    )
                    .all()
                )
            for task_index, worker_name, worker_id in rows:
                name_key = (worker_name or "").strip() or f"worker-id:{worker_id}"
                used_worker_names_by_task[task_index].add(name_key)

            to_submit: list[tuple[dict, str]] = []
            still_deferred: list[dict] = []

            for payload in deferred:
                task_index = payload["task_index"]
                used_names = used_worker_names_by_task[task_index]
                chosen_node_id = None
                for node_id, worker in worker_entries:
                    name_key = self._worker_name_key(worker)
                    if name_key in used_names:
                        continue
                    chosen_node_id = node_id
                    used_names.add(name_key)
                    break

                if chosen_node_id is None:
                    still_deferred.append(payload)
                    continue

                to_submit.append((payload, chosen_node_id))

            if to_submit:
                now = datetime.utcnow()
                with get_session() as session:
                    for payload, node_id in to_submit:
                        task = session.query(Task).filter_by(task_id=payload["task_id"]).first()
                        if not task:
                            continue
                        worker = node_id_to_worker.get(node_id)
                        if worker:
                            task.assigned_worker_id = worker.worker_id
                        task.status = "assigned"
                        task.assigned_at = now
                        task.updated_at = now
                    session.commit()

                submit_payloads = [p for p, _ in to_submit]
                submit_node_ids  = [n for _, n in to_submit]
                new_futures = self.server.submit_uploaded_tasks(
                    submit_payloads, fn_bytes, target_node_ids=submit_node_ids
                )

                with self._lock:
                    existing = self.futures.get(run_id, [])
                    self.futures[run_id] = existing + new_futures

                total_dispatched += len(new_futures)
                logging.info(
                    f"[DISPATCH] Run {run_id}: dispatched {len(new_futures)} deferred replica(s) "
                    f"to new volunteer node(s); {len(still_deferred)} still waiting."
                )

            with self._lock:
                if still_deferred:
                    self.pending_replicas[run_id] = still_deferred
                else:
                    self.pending_replicas.pop(run_id, None)
                    logging.info(f"[DISPATCH] Run {run_id}: all deferred replicas now dispatched.")

        return total_dispatched

    def _expected_verified_results_count(self, run_id: str) -> int:
        """Number of logical chunk results expected for a run."""
        with get_session() as session:
            chunk_count = (
                session.query(Task.task_index)
                .filter(Task.run_id == run_id)
                .distinct()
                .count()
            )
        return chunk_count

    def sync_ray_workers_to_db(self):
        """
        Sync Ray metadata for existing volunteer workers only.
        Never auto-register generic Ray nodes as volunteer workers.
        """
        try:
            live_nodes = self._get_live_ray_nodes()
            with get_session() as session:
                workers = (
                    session.query(Worker)
                    .filter(
                        Worker.user_id.isnot(None),
                        Worker.ray_node_id.isnot(None)
                    )
                    .all()
                )

                for worker in workers:
                    if not user_has_role(worker.user_id, "volunteer"):
                        continue

                    node = live_nodes.get(worker.ray_node_id)
                    if not node:
                        worker.status = "offline"
                        worker.updated_at = datetime.utcnow()
                        continue

                    resources = node.get("Resources", {})
                    worker.ip_address = node.get("NodeManagerAddress")
                    worker.cpu_cores = int(resources.get("CPU", 0))
                    worker.memory_gb = resources.get("memory", 0) / (1024**3)
                    worker.last_heartbeat = datetime.utcnow()
                    if worker.status == "offline":
                        worker.status = "online"
                    worker.updated_at = datetime.utcnow()
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

    def _read_path(self, path: str) -> str:
        """Return file contents as a string, supporting both local paths and s3:// URIs."""
        if path.startswith("s3://"):
            import boto3, io
            # s3://bucket/key
            parts = path[len("s3://"):].split("/", 1)
            bucket, key = parts[0], parts[1]
            s3 = boto3.client("s3")
            obj = s3.get_object(Bucket=bucket, Key=key)
            return obj["Body"].read().decode("utf-8")
        else:
            if not os.path.isfile(path):
                raise FileNotFoundError(f"[ERROR] File not found: {path}")
            with open(path, "r", encoding="utf-8") as f:
                return f.read()

    def _load_csv(self, path: str):
        import io
        content = self._read_path(path)
        reader = csv.DictReader(io.StringIO(content))
        return list(reader)

    def _load_json(self, path: str):
        content = self._read_path(path)
        data = json.loads(content)
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
            replication_factor: int = 2,
            max_verification_attempts: int = 2,
            researcher_id: str = None,
            title: str = None,
            description: str = None,
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
        replication_factor = max(1, int(replication_factor or 1))
        max_verification_attempts = max(0, int(max_verification_attempts or 0))

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
            chunk_size=chunk_size,
            replication_factor=replication_factor,
            max_verification_attempts=max_verification_attempts,
            num_chunks=len(chunks),
        )
        
        # Copy files to project directory, named by project_id (same hash as folder / results_<run_id>.json)
        proj_dir = f"projects/{project.project_id}"
        os.makedirs(proj_dir, exist_ok=True)
        pid = project.project_id
        stored_code_path = f"{proj_dir}/{pid}.py"
        stored_dataset_path = f"{proj_dir}/{pid}.{file_type}"
        shutil.copyfile(code_path, stored_code_path)
        shutil.copyfile(dataset_path, stored_dataset_path)
        
        # # Update project with stored paths
        # project.code_s3_path = stored_code_path
        # project.dataset_s3_path = stored_dataset_path
        # with get_session() as session:
        #     session.merge(project)
        #     session.commit()

        # ---------------------------------------------------------
        # 5. Create Run and Tasks in DB
        # ---------------------------------------------------------
        run = create_run(project_id=project.project_id, total_tasks=len(chunks) * replication_factor)
        run.status = "pending"
        with get_session() as session:
            session.merge(run)
            session.commit()
        
        # Create Task records for each chunk replica.
        tasks = []
        for idx, chunk in enumerate(chunks):
            for replica_idx in range(replication_factor):
                task = create_task(run_id=run.run_id, task_index=idx, replica_index=replica_idx)
                tasks.append(task)

        # ---------------------------------------------------------
        # 6. Create Ray payloads (using DB task_ids)
        # ---------------------------------------------------------
        payloads = []
        for task in tasks:
            chunk = chunks[task.task_index]
            payloads.append({
                "task_id": task.task_id,  # Use DB task_id instead of index
                "task_index": task.task_index,
                "replica_index": task.replica_index,
                "rows": chunk,
                "params": None
            })

        # For backward compatibility: map legacy job_id to run_id
        legacy_job_id = self.counter
        self.counter += 1
        self.job_id_to_run_id[legacy_job_id] = run.run_id
        self.run_id_to_job_id[run.run_id] = legacy_job_id
        self.run_fn_bytes[run.run_id] = fn_bytes
        
        # ---------------------------------------------------------
        # 7. Sync workers and dispatch to volunteers (or queue)
        # ---------------------------------------------------------
        self.sync_ray_workers_to_db()
        print(f"[DEBUG] About to submit: {len(payloads)} payloads")
        futures = self._dispatch_run_to_volunteers(
            run_id=run.run_id,
            payloads=payloads,
            fn_bytes=fn_bytes
        )

        # Also save to legacy Job table for backward compatibility
        if futures:
            self.futures[run.run_id] = futures
            update_run(run.run_id, status="running", started_at=datetime.utcnow())
            save_job(job_id=legacy_job_id, data={"run_id": run.run_id, "project_id": project.project_id}, status="running")
            print(f"[DEBUG] Received {len(futures)} futures from submit_uploaded_tasks")
        else:
            self.queued_runs[run.run_id] = {
                "payloads": payloads,
                "fn_bytes": fn_bytes
            }
            update_run(run.run_id, status="queued")
            save_job(job_id=legacy_job_id, data={"run_id": run.run_id, "project_id": project.project_id}, status="queued")
            logging.info(f"[INFO] Run {run.run_id} queued: waiting for volunteer workers.")

        logging.info(f"[INFO] Submitted uploaded project: project_id={project.project_id}, run_id={run.run_id}, job_id={legacy_job_id}, chunks={len(chunks)}")

        return (legacy_job_id, run.run_id, project.project_id, len(tasks))

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
        execution = self.server.submit_tasks_with_verification(payloads)
        verification_status = execution["verification_status"]

        # store futures in memory
        self.futures[job_id] = execution.get("futures", [])

        # store metadata in DB
        save_job(job_id=job_id, data={"num_chunks": len(payloads)}, status=verification_status)
        # save_job(job_id=job_id, data=payloads, status="submitted")
        # FIXME: payloads contains a bunch of binary so may want to rethink
        # save_job(job_id=job_id, data={"num_chunks": len(payloads)}, status="submitted")

        print("[ConstellationAPI] Job {job_id} saved in DB.")
        return job_id

    # ---------------------------------------------------------
    # Status Checking
    # ---------------------------------------------------------
    def get_progress(self, job_id: int) -> dict:
        """Return live progress metrics for a job/run."""
        run_id = self.job_id_to_run_id.get(job_id)

        # Fallback to legacy Job table for backward compatibility
        if not run_id:
            legacy_job = get_job(job_id)
            if legacy_job and legacy_job.data and isinstance(legacy_job.data, dict):
                run_id = legacy_job.data.get("run_id")

        if run_id:
            self.try_dispatch_queued_runs()
            with get_session() as session:
                run_row = session.query(Run).filter_by(run_id=run_id).first()
                if not run_row:
                    raise Exception("Run not found")

                task_counts_by_status = {
                    status: count for status, count in (
                        session.query(Task.status, func.count(Task.task_id))
                        .filter(Task.run_id == run_id)
                        .group_by(Task.status)
                        .all()
                    )
                }
                total_tasks = session.query(func.count(Task.task_id)).filter(
                    Task.run_id == run_id
                ).scalar() or 0

                expected_verified = self._expected_verified_results_count(run_id)
                verified_chunks = (
                    session.query(Task.task_index)
                    .join(TaskResult, TaskResult.task_id == Task.task_id)
                    .filter(TaskResult.run_id == run_id)
                    .distinct()
                    .count()
                )

                status = run_row.status or "pending"
                if status == "completed":
                    status = "complete"

                return {
                    "job_id": job_id,
                    "run_id": run_id,
                    "project_id": run_row.project_id,
                    "status": status,
                    "tasks": {
                        "total": int(total_tasks),
                        "pending": int(task_counts_by_status.get("pending", 0)),
                        "assigned": int(task_counts_by_status.get("assigned", 0)),
                        "running": int(task_counts_by_status.get("running", 0)),
                        "completed": int(task_counts_by_status.get("completed", 0)),
                        "failed": int(task_counts_by_status.get("failed", 0)),
                        "cancelled": int(task_counts_by_status.get("cancelled", 0)),
                    },
                    "verification": {
                        "verified_chunks": int(verified_chunks),
                        "expected_chunks": int(expected_verified),
                    },
                }

        legacy_job = get_job(job_id)
        if not legacy_job:
            raise Exception("Job not found")

        return {
            "job_id": job_id,
            "status": legacy_job.status or "submitted",
        }

    def check_status(self, job_id):
        """
        Returns the current status of the job/run.
        Status could be: submitted, running, complete, failed, etc.
        
        Args:
            job_id: Legacy integer job_id (will map to run_id internally)
        """
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
            self.try_dispatch_queued_runs()
            run = get_run(run_id)
            if not run:
                logging.error(f"[ConstellationAPI] Run {run_id} not found in DB")
                raise Exception("Run not found")
            current_status = run.status or "pending"
            logging.info(f"[ConstellationAPI] Current stored status for run {run_id}: {current_status}")
            if current_status == "completed":
                return "complete"
            return current_status
        
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
            self.try_dispatch_queued_runs()
            with get_session() as session:
                run_row = session.query(Run).filter_by(run_id=run_id).first()
                if not run_row:
                    logging.error(f"[ConstellationAPI] Run {run_id} not found")
                    raise Exception("Run not found")
                _project_id = run_row.project_id
                _total_tasks = run_row.total_tasks
                _run_status = run_row.status

            if _run_status == "disputed":
                raise ValueError(
                    "Run verification disputed; verified results are not available"
                )

            # Check if verified final results are cached (one TaskResult per task: max attempt_id)
            with get_session() as session:
                final_rows = fetch_final_task_results_with_index(session, run_id)
                task_results = [tr for tr, _ in final_rows]
                if task_results and len(task_results) == _total_tasks:
                    update_aws_project_chunks(
                        _project_id,
                        chunks_completed=len(task_results),
                        total_chunks=_total_tasks,
                    )
                    results = []
                    for tr, chunk_idx in final_rows:
                        results.append({
                            "task_index": chunk_idx,
                            "task_id": tr.task_id,
                            "result": tr.result_data,
                            "runtime_seconds": tr.runtime_seconds,
                        })
                    logging.info(f"[ConstellationAPI] Returning cached verified results for run {run_id}")
                    return results

            # Fetch from Ray futures (may be empty after server restart)
            futures = self.futures.get(run_id, [])
            if not futures:
                # Server may have restarted; try returning cached results from DB again (join to order, no tr.task access)
                with get_session() as session:
                    final_rows = fetch_final_task_results_with_index(session, run_id)
                    task_results = [tr for tr, _ in final_rows]
                    if task_results and len(task_results) == _total_tasks:
                        update_aws_project_chunks(
                            _project_id,
                            chunks_completed=len(task_results),
                            total_chunks=_total_tasks,
                        )
                        results = []
                        for tr, _ in final_rows:
                            results.append({
                                "task_id": tr.task_id,
                                "result": tr.result_data,
                                "runtime_seconds": tr.runtime_seconds
                            })
                        logging.info(f"[ConstellationAPI] Returning cached verified results for run {run_id} (no futures)")
                        return results

                    # If we have partial persisted final results, return them instead of 500.
                    if task_results:
                        update_aws_project_chunks(
                            _project_id,
                            chunks_completed=len(task_results),
                            total_chunks=_total_tasks,
                        )
                        partial_results = []
                        for tr, _ in final_rows:
                            partial_results.append({
                                "task_id": tr.task_id,
                                "result": tr.result_data,
                                "runtime_seconds": tr.runtime_seconds
                            })
                        logging.warning(
                            f"[ConstellationAPI] Returning partial cached results for run {run_id}: "
                            f"{len(partial_results)}/{_total_tasks} tasks"
                        )
                        return partial_results

                # No futures and no persisted results yet. Treat as in-progress to avoid hard failure after restart.
                run_status = get_run(run_id).status if get_run(run_id) else "pending"
                if run_status in ["pending", "running", "submitted"]:
                    logging.warning(
                        f"[ConstellationAPI] No futures/results available yet for run {run_id}; "
                        f"status={run_status}. Returning empty result set."
                    )
                    return []

                logging.error(
                    f"[ConstellationAPI] Run {run_id} has no futures and no persisted results (status={run_status})"
                )
                raise Exception("Results are unavailable for this run")

            logging.info(f"[ConstellationAPI] Blocking until Ray returns results for {len(futures)} tasks")
            ray_results = self.server.get_results(futures)

            # Store results in TaskResult table (use _project_id only; do not load Project to avoid DetachedInstanceError)
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
                        # Capture task_id while session is active to avoid DetachedInstanceError (task.run can lazy-load Run)
                        task_id_val = task.task_id
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
                            if worker and getattr(worker, "user_id", None):
                                link_aws_project_contributor(_project_id, worker.user_id)
                        else:
                            worker_id = "worker-unknown"
                        
                        # Create or update TaskResult (within current session); use _project_id (project is detached)
                        tr = session.query(TaskResult).filter_by(task_id=task_id_val).first()
                        if not tr:
                            tr = TaskResult(
                                task_id=task_id_val,
                                run_id=run_id,
                                project_id=_project_id,
                                worker_id=worker_id,  # Now correctly mapped from Ray node_id
                                result_data=result_data,
                                runtime_seconds=runtime,
                                completed_at=datetime.utcnow()
                            )
                            session.add(tr)
                        
                        results.append({
                            "task_id": task_id_val,
                            "result": result_data,
                            "runtime_seconds": runtime
                        })
                
                # Update run with completed/failed task counts; capture project_id while session is active
                run_row = session.query(Run).filter_by(run_id=run_id).first()
                project_id = run_row.project_id if run_row else None
                if run_row:
                    run_row.completed_tasks = completed_count
                    run_row.failed_tasks = failed_count
                    run_row.updated_at = datetime.utcnow()
                    session.commit()

            logging.info(f"[ConstellationAPI] Results retrieved for run {run_id}: {len(results)} results ({completed_count} completed, {failed_count} failed)")
            update_aws_project_chunks(
                _project_id,
                chunks_completed=completed_count + failed_count,
                total_chunks=_total_tasks,
            )
            update_run(run_id, status="completed", completed_at=datetime.utcnow())
            update_job(job_id, results=results, status="complete")
            # Write aggregated results to project folder for persistence (use _project_id; project may be detached)
            if project_id is None:
                project_id = _project_id
            if project_id:
                projects_dir = f"projects/{project_id}"
                if os.path.isdir(projects_dir):
                    out_path = os.path.join(projects_dir, f"results_{run_id}.json")
                    try:
                        payload = {"run_id": run_id, "project_id": project_id, "total_tasks": len(results), "results": results}
                        with open(out_path, "w") as f:
                            json.dump(payload, f, indent=2, default=str)
                        logging.info(f"[ConstellationAPI] Wrote results to {out_path}")
                    except Exception as e:
                        logging.warning(f"[ConstellationAPI] Could not write results to {out_path}: {e}")
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
            current_status = legacy_job.status or "submitted"
            if current_status in ["submitted", "running"]:
                logging.warning(
                    f"[ConstellationAPI] No futures/results available yet for job {job_id}; "
                    f"status={current_status}. Returning empty result set."
                )
                return []
            logging.error(f"[ConstellationAPI] No futures for job {job_id}; cannot fetch results")
            raise Exception("Results are unavailable for this job")

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
    
    def _persist_verification_results(self, run_id, project_id, execution):
        """
        Store verification attempts into TaskResult and synchronize Task/Run progress.
        """

        verification_status = execution["verification_status"]
        attempts = execution["attempts"]

        with get_session() as session:
            for attempt_id, attempt_results in enumerate(attempts, start=1):
                for ray_result in attempt_results:
                    task_id = ray_result.get("task_id")
                    if not task_id:
                        continue

                    node_id = ray_result.get("node_id")
                    worker = session.query(Worker).filter_by(ray_node_id=node_id).first()
                    worker_id = worker.worker_id if worker else "worker-unknown"
                    if worker and getattr(worker, "user_id", None):
                        link_aws_project_contributor(project_id, worker.user_id)

                    tr = TaskResult(
                        task_id=task_id,
                        run_id=run_id,
                        project_id=project_id,
                        worker_id=worker_id,
                        attempt_id=attempt_id,
                        verification_status=verification_status,
                        result_data=ray_result.get("results"),
                        result_hash=ray_result.get("result_hash"),
                        runtime_seconds=ray_result.get("runtime_seconds"),
                        completed_at=datetime.utcnow()
                    )
                    session.add(tr)

                    # Keep task lifecycle fields in sync even before /results is called.
                    task = session.query(Task).filter_by(task_id=task_id).first()
                    if task:
                        now = datetime.utcnow()
                        if worker_id != "worker-unknown":
                            task.assigned_worker_id = worker_id
                            if task.assigned_at is None:
                                task.assigned_at = now
                        if task.started_at is None:
                            task.started_at = now
                        task.status = "failed" if ray_result.get("error") else "completed"
                        task.error_message = ray_result.get("error") if ray_result.get("error") else None
                        task.completed_at = now
                        task.updated_at = now

            # Synchronize run counters from task table.
            completed_count = session.query(Task).filter_by(run_id=run_id, status="completed").count()
            failed_count = session.query(Task).filter_by(run_id=run_id, status="failed").count()
            run_row = session.query(Run).filter_by(run_id=run_id).first()
            if run_row:
                run_row.completed_tasks = completed_count
                run_row.failed_tasks = failed_count
                run_row.updated_at = datetime.utcnow()

            session.commit()

        return verification_status