"""
Constellation Database Models (SQLite for runs, tasks, workers, results).

- AWS RDS (when AWS_DATABASE_URL is set): users, researchers, projects, project_users
  See backend/core/database_aws.py.
- SQLite (this module): runs, tasks, workers, task_results, worker_heartbeats, jobs
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey, Index, UniqueConstraint, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.sqlite import JSON
from contextlib import contextmanager
from datetime import datetime
import uuid
import hashlib
import json
import boto3

# Create SQLite database (local file: constellation.db)
DATABASE_URL = "sqlite:///constellation.db"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

BUCKET_NAME = "constellation-bucket-005988779256-us-east-1-an"
s3 = boto3.client("s3")

# ============================================================================
# SQLite tables: runs, tasks, workers, task_results, worker_heartbeats, jobs
# ============================================================================

class Run(Base):
    """Execution runs. project_id is a string reference (AWS project id or 'local')."""
    __tablename__ = "runs"

    run_id = Column(String, primary_key=True, default=lambda: f"run-{uuid.uuid4()}")
    project_id = Column(String, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending", index=True)  # 'pending', 'running', 'completed', 'failed', 'cancelled'
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    total_tasks = Column(Integer, nullable=False, default=0)
    completed_tasks = Column(Integer, nullable=False, default=0)
    failed_tasks = Column(Integer, nullable=False, default=0)
    results_s3_path = Column(String(1000), nullable=True)  # Will be S3 path, currently local path
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    verification_status = Column(String(50), nullable=True, index=True)
    verification_attempts = Column(Integer, nullable=False, default=0)
    verification_hash_attempt1 = Column(String(128), nullable=True)
    verification_hash_attempt2 = Column(String(128), nullable=True)
    verification_completed_at = Column(DateTime, nullable=True)

    tasks = relationship("Task", back_populates="run", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_run_project_created', 'project_id', 'created_at'),
        Index('idx_run_status_created', 'status', 'created_at'),
    )

    def __repr__(self):
        return f"<Run(run_id={self.run_id}, project_id={self.project_id}, status={self.status}, progress={self.completed_tasks}/{self.total_tasks})>"


class Task(Base):
    """Individual task chunks - matches constellation-tasks"""
    __tablename__ = "tasks"

    task_id = Column(String, primary_key=True, default=lambda: f"task-{uuid.uuid4()}")
    run_id = Column(String, ForeignKey("runs.run_id"), nullable=False, index=True)
    task_index = Column(Integer, nullable=False)  # Chunk index within run (0-based)
    replica_index = Column(Integer, nullable=False, default=0)  # Replica number for this chunk (0-based)
    status = Column(String(50), nullable=False, default="pending", index=True)  # 'pending', 'assigned', 'running', 'completed', 'failed', 'cancelled'
    assigned_worker_id = Column(String, ForeignKey("workers.worker_id"), nullable=True, index=True)
    assigned_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    raw_result_data = Column(JSON, nullable=True)  # Latest raw worker output (pre-verification)
    raw_runtime_seconds = Column(Float, nullable=True)  # Latest raw task runtime from worker payload
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    run = relationship("Run", back_populates="tasks")
    assigned_worker = relationship("Worker", back_populates="assigned_tasks")
    result = relationship("TaskResult", back_populates="task", uselist=False, cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_task_run_status', 'run_id', 'status'),
        Index('idx_task_worker_status', 'assigned_worker_id', 'status'),
        Index('idx_task_run_chunk_replica', 'run_id', 'task_index', 'replica_index'),
    )

    def __repr__(self):
        return f"<Task(task_id={self.task_id}, run_id={self.run_id}, status={self.status}, index={self.task_index})>"


class Worker(Base):
    """LAN worker nodes. user_id is a string reference (AWS username or local)."""
    __tablename__ = "workers"

    worker_id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True, index=True)
    worker_name = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    ray_node_id = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="offline", index=True)  # 'online', 'offline', 'idle', 'busy'
    cpu_cores = Column(Integer, nullable=True)
    cpu_availability = Column(Float, nullable=True)  # 0.0-1.0
    memory_gb = Column(Float, nullable=True)
    last_heartbeat = Column(DateTime, nullable=True, index=True)
    tasks_completed = Column(Integer, nullable=False, default=0)
    tasks_failed = Column(Integer, nullable=False, default=0)
    total_cpu_time_seconds = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    assigned_tasks = relationship("Task", back_populates="assigned_worker")
    heartbeats = relationship("WorkerHeartbeat", back_populates="worker", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_worker_status_availability', 'status', 'cpu_availability'),
    )

    def __repr__(self):
        return f"<Worker(worker_id={self.worker_id}, name={self.worker_name}, status={self.status})>"


# ============================================================================
# Redshift-Equivalent Tables (Analytics Data)
# ============================================================================

class TaskResult(Base):
    """Historical task execution results - matches Redshift task_results"""
    __tablename__ = "task_results"

    __table_args__ = (
        UniqueConstraint("task_id", "attempt_id", name="uix_task_attempt"),
    )

    task_result_id = Column(String, primary_key=True, default=lambda: f"result-{uuid.uuid4()}")
    task_id = Column(String, ForeignKey("tasks.task_id"), nullable=False, index=True)
    run_id = Column(String, nullable=False, index=True)  # Denormalized for analytics
    project_id = Column(String, nullable=False, index=True)  # Denormalized for analytics
    worker_id = Column(String, nullable=True, index=True)  # Which worker produced this result (nullable: one result per replica, not per worker)
    result_data = Column(JSON, nullable=False)  # JSON result payload
    runtime_seconds = Column(Float, nullable=True)
    memory_used_mb = Column(Float, nullable=True)
    completed_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    attempt_id = Column(Integer, nullable=False, default=0)

    result_hash = Column(String(128), nullable=True, index=True)
    verification_status = Column(String(50), nullable=True, index=True)
    verification_attempt = Column(Integer, nullable=False, default=1)

    # Relationships
    task = relationship("Task", back_populates="result")

    # Index for time-based queries
    __table_args__ = (
        Index('idx_task_result_completed_at', 'completed_at'),
        Index('idx_task_result_run_completed', 'run_id', 'completed_at'),
    )

    def __repr__(self):
        return f"<TaskResult(task_result_id={self.task_result_id}, task_id={self.task_id}, runtime={self.runtime_seconds}s)>"


class WorkerHeartbeat(Base):
    """Time-series worker status data - matches Redshift worker_heartbeats"""
    __tablename__ = "worker_heartbeats"

    heartbeat_id = Column(String, primary_key=True, default=lambda: f"heartbeat-{uuid.uuid4()}")
    worker_id = Column(String, ForeignKey("workers.worker_id"), nullable=False, index=True)
    cpu_availability = Column(Float, nullable=True)
    cpu_load_avg = Column(Float, nullable=True)
    memory_used_gb = Column(Float, nullable=True)
    active_task_count = Column(Integer, nullable=False, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    worker = relationship("Worker", back_populates="heartbeats")

    # Index for time-series queries
    __table_args__ = (
        Index('idx_heartbeat_worker_timestamp', 'worker_id', 'timestamp'),
    )

    def __repr__(self):
        return f"<WorkerHeartbeat(heartbeat_id={self.heartbeat_id}, worker_id={self.worker_id}, timestamp={self.timestamp})>"


# ============================================================================
# Database Initialization and Session Management
# ============================================================================

def init_db():
    """Create all tables and apply lightweight SQLite schema migrations."""
    Base.metadata.create_all(bind=engine)
    _apply_sqlite_migrations()
    print("Database initialized and tables created.")


def _apply_sqlite_migrations():
    """
    Best-effort additive migrations for existing local SQLite files.
    We only add missing columns; no destructive operations.
    """
    table_column_defs = {
        "runs": [
            "verification_status TEXT",
            "verification_attempts INTEGER NOT NULL DEFAULT 0",
            "verification_hash_attempt1 TEXT",
            "verification_hash_attempt2 TEXT",
            "verification_completed_at DATETIME",
        ],
        "tasks": [
            "raw_result_data JSON",
            "raw_runtime_seconds FLOAT",
        ],
        "task_results": [
            "attempt_id INTEGER NOT NULL DEFAULT 0",
            "result_hash TEXT",
            "verification_status TEXT",
            "verification_attempt INTEGER NOT NULL DEFAULT 1",
        ],
    }

    with engine.begin() as conn:
        for table_name, column_defs in table_column_defs.items():
            existing_cols = {
                row[1]
                for row in conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
            }
            if not existing_cols:
                continue

            for column_def in column_defs:
                col_name = column_def.split()[0]
                if col_name in existing_cols:
                    continue
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_def}"))


@contextmanager
def get_session():
    """
    Context-managed DB session.
    Use like: `with get_session() as session:` so sessions are always closed.
    """
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# ============================================================================
# Legacy Job table functions (for backward compatibility during migration)
# ============================================================================

class Job(Base):
    """Legacy Job table - deprecated, kept for backward compatibility"""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="pending")
    data = Column(JSON)
    results = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


def save_job(job_id, data, status):
    """Legacy function - deprecated. Use Project/Run/Task models instead."""
    with SessionLocal() as session:
        job = session.query(Job).filter_by(id=job_id).first()
        if job is None:
            job = Job(id=job_id, data=data, status=status)
            session.add(job)
        else:
            job.data = data
            job.status = status
            job.updated_at = datetime.now()
        session.commit()
        return job


def update_job(job_id, **kwargs):
    """Legacy function - deprecated. Use Project/Run/Task models instead."""
    with SessionLocal() as session:
        job = session.query(Job).filter_by(id=job_id).first()
        if not job:
            return False
        for key, value in kwargs.items():
            setattr(job, key, value)
        job.updated_at = datetime.now()
        session.commit()
        return True


def get_job(job_id):
    """Legacy function - deprecated. Use Project/Run/Task models instead."""
    with SessionLocal() as session:
        job = session.query(Job).filter_by(id=job_id).first()
        return job


def get_all_jobs(status_filter=None):
    """Legacy function - deprecated."""
    with SessionLocal() as session:
        query = session.query(Job)
        if status_filter:
            query = query.filter_by(status=status_filter)
        jobs = query.all()
        return jobs


def delete_job(job_id):
    """Legacy function - deprecated."""
    with SessionLocal() as session:
        job = session.query(Job).filter_by(id=job_id).first()
        if not job:
            return False
        session.delete(job)
        session.commit()
        return True


# ============================================================================
# Helper Functions (SQLite: Run, Task, TaskResult, Worker, Job)
# User, researcher, project, project_user live in AWS RDS — see database_aws.py
# ============================================================================

def create_run(project_id: str, total_tasks: int = 0) -> Run:
    """Create a new run."""
    with SessionLocal() as session:
        run = Run(project_id=project_id, total_tasks=total_tasks)
        session.add(run)
        session.commit()
        session.refresh(run)
        return run


def get_run(run_id: str) -> Run:
    """Get run by ID."""
    with SessionLocal() as session:
        return session.query(Run).filter_by(run_id=run_id).first()


def update_run(run_id: str, **kwargs) -> bool:
    """Update run fields."""
    with SessionLocal() as session:
        run = session.query(Run).filter_by(run_id=run_id).first()
        if not run:
            return False
        for key, value in kwargs.items():
            setattr(run, key, value)
        run.updated_at = datetime.utcnow()
        session.commit()
        return True


def create_task(run_id: str, task_index: int, replica_index: int = 0) -> Task:
    """Create a new task."""
    with SessionLocal() as session:
        task = Task(run_id=run_id, task_index=task_index, replica_index=replica_index)
        session.add(task)
        session.commit()
        session.refresh(task)
        return task


def get_pending_tasks(run_id: str, limit: int = None) -> list:
    """Get pending tasks for a run."""
    with SessionLocal() as session:
        query = session.query(Task).filter_by(run_id=run_id, status="pending")
        if limit:
            query = query.limit(limit)
        return query.all()


def assign_task(task_id: str, worker_id: str) -> bool:
    """
    Assign a task to a worker (SQLite scheduler path).

    Note: Uploaded projects are executed via Ray (.remote tasks); Ray's scheduler
    places work on cluster nodes. That path does not call assign_task().
    Contributor tracking for Ray runs uses link_aws_project_contributor when results persist.
    """
    with SessionLocal() as session:
        task = session.query(Task).filter_by(task_id=task_id).first()
        if not task:
            return False
        worker = session.query(Worker).filter_by(worker_id=worker_id).first()
        run = session.query(Run).filter_by(run_id=task.run_id).first()
        task.assigned_worker_id = worker_id
        task.status = "assigned"
        task.assigned_at = datetime.utcnow()
        task.updated_at = datetime.utcnow()
        session.commit()

        # Track contributor membership in AWS project_users when possible.
        if worker and worker.user_id and run and run.project_id:
            try:
                from backend.core.database_aws import is_aws_db_configured, add_aws_project_user

                if is_aws_db_configured():
                    add_aws_project_user(int(run.project_id), worker.user_id)
            except Exception:
                # Do not fail assignment if AWS linkage is unavailable.
                pass

        return True


def update_task(task_id: str, **kwargs) -> bool:
    """Update task fields."""
    with SessionLocal() as session:
        task = session.query(Task).filter_by(task_id=task_id).first()
        if not task:
            return False
        for key, value in kwargs.items():
            setattr(task, key, value)
        task.updated_at = datetime.utcnow()
        session.commit()
        return True


def create_task_result(task_id: str, run_id: str, project_id: str, worker_id: str,
                       result_data: dict, runtime_seconds: float = None,
                       memory_used_mb: float = None,
                       verification_attempt: int = 1,
                       verification_status: str = None) -> TaskResult:
    """Create a task result."""
    result_hash = _hash_result(result_data)

    with SessionLocal() as session:
        result = TaskResult(
            task_id=task_id,
            run_id=run_id,
            project_id=project_id,
            worker_id=worker_id,
            result_data=result_data,
            runtime_seconds=runtime_seconds,
            memory_used_mb=memory_used_mb,
            result_hash=result_hash,
            verification_attempt=verification_attempt,
            verification_status=verification_status,
            completed_at=datetime.utcnow()
        )

        session.add(result)
        session.commit()
        session.refresh(result)
        return result


def register_worker(worker_id: str, worker_name: str, user_id: str = None,
                    ip_address: str = None, cpu_cores: int = None,
                    memory_gb: float = None, ray_node_id: str = None,
                    user_email: str = None) -> Worker:
    """Register or update a worker."""
    with SessionLocal() as session:
        worker = session.query(Worker).filter_by(worker_id=worker_id).first()

        # Resolve target identity email first; this is the canonical worker identity.
        target_email = (user_email or "").strip().lower()
        if not target_email and user_id:
            user = get_user_by_id(user_id)
            resolved_email = getattr(user, "email", None) if user else None
            target_email = (resolved_email or "").strip().lower()

        if not worker and target_email:
            # Reuse row only when associated user email matches.
            candidates = session.query(Worker).filter(Worker.user_id.isnot(None)).all()
            for candidate in candidates:
                existing_user = get_user_by_id(candidate.user_id)
                existing_email = getattr(existing_user, "email", None) if existing_user else None
                if (existing_email or "").strip().lower() == target_email:
                    worker = candidate
                    break

        if not worker and not target_email and ray_node_id:
            # Legacy fallback (no email context): reuse by Ray node id.
            worker = session.query(Worker).filter_by(ray_node_id=ray_node_id).first()

        if worker:
            # Update existing worker
            worker.worker_name = worker_name
            worker.user_id = user_id
            worker.ip_address = ip_address
            worker.cpu_cores = cpu_cores
            worker.memory_gb = memory_gb
            if ray_node_id:
                worker.ray_node_id = ray_node_id
            worker.status = "online"
            worker.last_heartbeat = datetime.utcnow()
            worker.updated_at = datetime.utcnow()
        else:
            # Create new worker
            worker = Worker(
                worker_id=worker_id,
                worker_name=worker_name,
                user_id=user_id,
                ip_address=ip_address,
                cpu_cores=cpu_cores,
                memory_gb=memory_gb,
                ray_node_id=ray_node_id,
                status="online",
                last_heartbeat=datetime.utcnow(),
            )
            session.add(worker)

        # Ensure a Ray node is owned by only one worker row at a time to avoid
        # ambiguous node_id -> worker attribution in task result recording.
        if ray_node_id:
            others = (
                session.query(Worker)
                .filter(Worker.ray_node_id == ray_node_id, Worker.worker_id != worker.worker_id)
                .all()
            )
            for other in others:
                other.status = "offline"
                other.ray_node_id = None
                other.updated_at = datetime.utcnow()

        session.commit()
        session.refresh(worker)
        return worker


def update_worker_heartbeat(worker_id: str, cpu_availability: float = None,
                            cpu_load_avg: float = None, memory_used_gb: float = None,
                            active_task_count: int = 0) -> Worker:
    """Update worker heartbeat and status."""
    with SessionLocal() as session:
        worker = session.query(Worker).filter_by(worker_id=worker_id).first()
        if not worker:
            return None

        worker.last_heartbeat = datetime.utcnow()
        worker.updated_at = datetime.utcnow()
        # Update worker's current CPU availability (current snapshot)
        if cpu_availability is not None:
            worker.cpu_availability = cpu_availability
        # Note: cpu_load_avg is only stored in WorkerHeartbeat, not Worker

        # Update status based on activity
        if active_task_count > 0:
            worker.status = "busy"
        elif cpu_availability and cpu_availability > 0.5:
            worker.status = "idle"
        else:
            worker.status = "online"

        # Create heartbeat record (time-series data)
        heartbeat = WorkerHeartbeat(
            worker_id=worker_id,
            cpu_availability=cpu_availability,
            cpu_load_avg=cpu_load_avg,
            memory_used_gb=memory_used_gb,
            active_task_count=active_task_count
        )
        session.add(heartbeat)

        session.commit()
        session.refresh(worker)
        return worker


def get_available_workers(limit: int = None) -> list:
    """Get available volunteer workers (idle or online with good CPU availability)."""
    with SessionLocal() as session:
        candidates = (
            session.query(Worker)
            .filter(
                Worker.status.in_(["idle", "online"]),
                Worker.cpu_availability > 0.5,
                Worker.last_heartbeat.isnot(None)
            )
            .all()
        )

        volunteer_workers = [
            worker for worker in candidates
            if worker.user_id and user_has_role(worker.user_id, "volunteer")
        ]
        volunteer_workers.sort(key=lambda w: w.cpu_availability or 0, reverse=True)
        if limit:
            return volunteer_workers[:limit]
        return volunteer_workers


def _hash_result(result_data):
    serialized = json.dumps(result_data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode()).hexdigest()

def get_all_projects(researcher_id: str = None, limit: int = None) -> list:
    """List all projects (from AWS RDS when configured), optionally filtered by researcher_id."""
    from backend.core.database_aws import is_aws_db_configured, get_all_aws_projects
    if is_aws_db_configured():
        return get_all_aws_projects(researcher_id=researcher_id, limit=limit)
    return []


def get_runs_for_project(project_id: str, limit: int = None) -> list:
    """List runs for a project, newest first."""
    with SessionLocal() as session:
        query = session.query(Run).filter(Run.project_id == project_id).order_by(Run.created_at.desc())
        if limit:
            query = query.limit(limit)
        return query.all()


def get_tasks_for_run(run_id: str) -> list:
    """List all tasks for a run (for dashboard)."""
    with SessionLocal() as session:
        return session.query(Task).filter(Task.run_id == run_id).order_by(Task.task_index).all()


def get_run_worker_count(run_id: str) -> int:
    """Count distinct workers that have been assigned tasks in this run."""
    with SessionLocal() as session:
        from sqlalchemy import func
        count = session.query(func.count(func.distinct(Task.assigned_worker_id))).filter(
            Task.run_id == run_id,
            Task.assigned_worker_id.isnot(None)
        ).scalar()
        return count or 0


def get_all_workers() -> list:
    """List all workers (for dashboard)."""
    with SessionLocal() as session:
        return session.query(Worker).order_by(Worker.last_heartbeat.desc()).all()


def fetch_final_task_results_with_index(session, run_id: str):
    """
    One row per task: the post-verification merged result for that task, i.e. the TaskResult
    row with max(attempt_id) for each task_id (replication attempts share the same task_id).

    Returns list of (TaskResult, task_index) ordered by task_index.
    """
    from sqlalchemy import func

    subq = (
        session.query(
            TaskResult.task_id.label("tid"),
            func.max(TaskResult.attempt_id).label("max_attempt"),
        )
        .filter(TaskResult.run_id == run_id)
        .group_by(TaskResult.task_id)
        .subquery()
    )
    return (
        session.query(TaskResult, Task.task_index)
        .join(
            subq,
            (TaskResult.task_id == subq.c.tid)
            & (TaskResult.attempt_id == subq.c.max_attempt),
        )
        .filter(TaskResult.run_id == run_id)
        .join(Task, TaskResult.task_id == Task.task_id)
        .order_by(Task.task_index)
        .all()
    )


def get_task_results_for_run(run_id: str) -> list:
    """
    Verified final results only (for API download): one dict per task using the merged
    verification attempt (max attempt_id per task). Raw replication attempts are omitted.

    Raises:
        ValueError: run not found, or run.status == 'disputed' (verified outputs withheld).
    """
    r = get_run(run_id)
    if not r:
        raise ValueError("Run not found")
    if r.status == "disputed":
        raise ValueError("Run verification disputed; verified results are not available")

    with SessionLocal() as session:
        rows = fetch_final_task_results_with_index(session, run_id)
        return [
            {
                "task_id": tr.task_id,
                "task_index": idx,
                "result_data": tr.result_data,
                "runtime_seconds": tr.runtime_seconds,
                "completed_at": tr.completed_at.isoformat() if tr.completed_at else None,
                "verification_status": tr.verification_status,
                "attempt_id": tr.attempt_id,
            }
            for tr, idx in rows
        ]


# ============================================================================
# User and project: delegate to AWS RDS when AWS_DATABASE_URL is set
# ============================================================================

def get_user_by_id(user_id: str):
    """Get user by ID. Uses AWS RDS when AWS_DATABASE_URL is set, else None."""
    from backend.core.database_aws import is_aws_db_configured, get_aws_user_by_id
    if is_aws_db_configured():
        return get_aws_user_by_id(user_id)
    return None


def get_user_by_email(email: str):
    """Get user by email. Uses AWS RDS when configured, else None."""
    from backend.core.database_aws import is_aws_db_configured, get_aws_user_by_email
    if is_aws_db_configured():
        return get_aws_user_by_email(email)
    return None


def user_has_role(user_id: str, role: str) -> bool:
    """Check if user has the given role. Uses AWS RDS when configured."""
    from backend.core.database_aws import is_aws_db_configured, user_has_aws_role
    if is_aws_db_configured():
        return user_has_aws_role(user_id, role)
    return False


def get_project(project_id: str):
    """Get project by ID. Uses AWS RDS when configured, else None."""
    from backend.core.database_aws import is_aws_db_configured, get_aws_project
    if is_aws_db_configured():
        return get_aws_project(project_id)
    return None


def create_user(user_id: str, email: str, name: str, role: str = "volunteer", metadata: dict = None):
    """
    Create a new user. Requires AWS_DATABASE_URL.
    Returns (user_like, None) on success, or (None, error_message) if user_id/email exists.
    """
    from backend.core.database_aws import is_aws_db_configured, create_aws_user
    if not is_aws_db_configured():
        return None, "AWS database not configured. Set AWS_DATABASE_URL to create users."
    try:
        u = create_aws_user(user_id=user_id, email=email, name=name, role=role)
        return u, None
    except ValueError as e:
        return None, str(e)


def create_project(researcher_id: str, title: str, description: str,
                   code_path: str, dataset_path: str, dataset_type: str,
                   func_name: str = "main", chunk_size: int = 1000,
                   replication_factor: int = 2, max_verification_attempts: int = 2, num_chunks: int = 0):
    """
    Create a new project. When AWS_DATABASE_URL is set, creates in RDS and uploads code/dataset to S3.
    Returns a project-like object (with project_id, code_s3_path, dataset_s3_path, etc.).
    """
    from backend.core.database_aws import is_aws_db_configured, create_aws_project
    if is_aws_db_configured():
        return create_aws_project(
            researcher_id=researcher_id,
            title=title,
            description=description,
            code_path=code_path,
            dataset_path=dataset_path,
            dataset_type=dataset_type,
            func_name=func_name,
            chunk_size=chunk_size,
            replication_factor=replication_factor,
            max_verification_attempts=max_verification_attempts,
            s3_upload_fn=s3.upload_file,
            bucket_name=BUCKET_NAME,
            num_chunks=num_chunks,
        )
    raise RuntimeError("AWS database not configured. Set AWS_DATABASE_URL to create projects.")


def get_researcher_projects_with_stats(researcher_id: str) -> list:
    """
    Projects from AWS RDS; run/task/contributor stats from SQLite.
    """
    from backend.core.database_aws import is_aws_db_configured, get_all_aws_projects

    if not is_aws_db_configured():
        return []

    projects = get_all_aws_projects(researcher_id=researcher_id)
    result = []

    with SessionLocal() as session:
        from sqlalchemy import func, distinct

        for project in projects:
            pid = getattr(project, "project_id", None)
            if pid is None:
                continue
            pid = str(pid)

            runs = session.query(Run).filter_by(project_id=pid).all()
            total_runs = len(runs)

            all_tasks = session.query(Task).join(Run).filter(Run.project_id == pid).all()
            total_tasks = len(all_tasks)
            completed_tasks = sum(1 for t in all_tasks if t.status == "completed")
            failed_tasks = sum(1 for t in all_tasks if t.status == "failed")

            progress = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0

            # Get unique contributors at user level (one user may own multiple workers).
            completed_task_users = (
                session.query(distinct(Worker.user_id))
                .join(TaskResult, Worker.worker_id == TaskResult.worker_id)
                .filter(
                    TaskResult.project_id == project.project_id,
                    Worker.user_id.isnot(None)
                )
                .all()
            )
            total_contributors = len([u[0] for u in completed_task_users if u[0]])

            # Get active contributors at user level.
            active_task_users = (
                session.query(distinct(Worker.user_id))
                .join(Task, Worker.worker_id == Task.assigned_worker_id)
                .join(Run, Task.run_id == Run.run_id)
                .filter(
                    Run.project_id == project.project_id,
                    Task.status.in_(["assigned", "running"]),
                    Worker.user_id.isnot(None)
                )
                .all()
            )
            active_contributors = len([u[0] for u in active_task_users if u[0]])

            completed_contributors = total_contributors if progress >= 100 else None

            avg_task_time = session.query(func.avg(TaskResult.runtime_seconds)).filter(
                TaskResult.project_id == pid,
                TaskResult.runtime_seconds.isnot(None),
            ).scalar()

            result_url = None
            completed_runs = [r for r in runs if r.status == "completed" and r.results_s3_path]
            if completed_runs:
                latest_completed = max(
                    completed_runs,
                    key=lambda r: r.completed_at if r.completed_at else datetime.min,
                )
                result_url = latest_completed.results_s3_path

            latest_updated = getattr(project, "updated_at", None) or getattr(project, "created_at", None)
            for run in runs:
                if run.updated_at and (latest_updated is None or run.updated_at > latest_updated):
                    latest_updated = run.updated_at

            title = getattr(project, "title", None) or getattr(project, "name", None)
            description = getattr(project, "description", None) or ""
            created_at = getattr(project, "created_at", None) or getattr(project, "date_created", None)

            result.append({
                "id": pid,
                "title": title or "",
                "description": description,
                "progress": progress,
                "resultUrl": result_url,
                "totalContributors": total_contributors,
                "activeContributors": active_contributors,
                "completedContributors": completed_contributors,
                "totalTasks": total_tasks,
                "completedTasks": completed_tasks,
                "failedTasks": failed_tasks,
                "createdAt": created_at.isoformat() if hasattr(created_at, "isoformat") and created_at else None,
                "updatedAt": latest_updated.isoformat() if hasattr(latest_updated, "isoformat") and latest_updated else None,
                "totalRuns": total_runs,
                "averageTaskTime": round(avg_task_time, 1) if avg_task_time else None,
            })

    return result


def get_top_contributors(limit: int = 10) -> list:
    """
    Rank by distinct projects contributed (TaskResult). Names from AWS users when configured.
    """
    from backend.core.database_aws import is_aws_db_configured, get_aws_user_by_id

    with SessionLocal() as session:
        from sqlalchemy import func, distinct

        rows = (
            session.query(
                Worker.user_id,
                Worker.worker_name,
                func.count(distinct(TaskResult.project_id)).label("projects_contributed"),
            )
            .join(TaskResult, Worker.worker_id == TaskResult.worker_id)
            .group_by(Worker.worker_id, Worker.user_id, Worker.worker_name)
            .order_by(func.count(distinct(TaskResult.project_id)).desc())
            .limit(limit)
            .all()
        )

    out = []
    for user_id, worker_name, projects_contributed in rows:
        name = worker_name
        if user_id and is_aws_db_configured():
            u = get_aws_user_by_id(user_id)
            if u and getattr(u, "name", None):
                name = u.name
        out.append({"name": name or str(user_id or "Unknown"), "projects_contributed": projects_contributed})
    return out


def link_aws_project_contributor(project_id, volunteer_user_id: str) -> None:
    """
    Idempotent: add volunteer username to AWS project_users when they ran work on a project.

    Ray never calls assign_task(); use this when saving TaskResult / verification rows
    once we know worker.user_id (requires workers to register via /api/workers/register).
    """
    if not volunteer_user_id:
        return
    try:
        from backend.core.database_aws import is_aws_db_configured, add_aws_project_user

        if not is_aws_db_configured():
            return
        add_aws_project_user(int(project_id), volunteer_user_id)
    except Exception:
        pass


def add_project_user(project_id: int, username: str) -> None:
    """Link a volunteer (users.username) to a project in AWS project_users."""
    from backend.core.database_aws import is_aws_db_configured, add_aws_project_user

    if not is_aws_db_configured():
        raise RuntimeError("AWS database not configured. Set AWS_DATABASE_URL.")
    add_aws_project_user(project_id, username)


def list_project_users(project_id: int) -> list:
    """Usernames on project_users for this project."""
    from backend.core.database_aws import is_aws_db_configured, get_aws_project_users

    if not is_aws_db_configured():
        return []
    return get_aws_project_users(project_id)


# Simple test connection function
if __name__ == "__main__":
    init_db()
    with get_session() as session:
        print("Test DB session created successfully.")
