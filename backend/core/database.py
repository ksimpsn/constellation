"""
Constellation Database Models (SQLite for runs, tasks, workers, results).

- AWS RDS (when AWS_DATABASE_URL is set): users, researchers, projects, project_users
  See backend/core/database_aws.py.
- SQLite (this module): runs, tasks, workers, task_results, worker_heartbeats, jobs
"""
from __future__ import annotations

from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey, Index, UniqueConstraint, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.sqlite import JSON
from contextlib import contextmanager
from datetime import datetime
import uuid
import hashlib
import json

# Create SQLite database (local file: constellation.db)
DATABASE_URL = "sqlite:///constellation.db"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

BUCKET_NAME = "constellation-bucket-005988779256-us-east-1-an"

_s3_client = None


def _get_s3_client():
    """Lazy boto3 client so Flask can import without boto3; install for S3 uploads."""
    global _s3_client
    if _s3_client is None:
        import boto3

        _s3_client = boto3.client("s3")
    return _s3_client

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

def _migrate_sqlite_table_columns(table_name: str, additions: list) -> None:
    """
    Add missing columns on SQLite (legacy constellation.db files).
    additions: list of (column_name, sql_type_and_default_fragment).
    """
    try:
        insp = inspect(engine)
        if table_name not in insp.get_table_names():
            return
        cols = {c["name"] for c in insp.get_columns(table_name)}
        for name, ddl in additions:
            if name in cols:
                continue
            try:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {name} {ddl}"))
                cols.add(name)
                print(f"[init_db] Added column {table_name}.{name}")
            except Exception as e:
                print(f"[init_db] {table_name}.{name}: {e}")
    except Exception as e:
        print(f"[init_db] migrate {table_name}: {e}")


def _migrate_sqlite_legacy_schema():
    """Bring older SQLite files in line with current models."""
    _migrate_sqlite_table_columns(
        "projects",
        [
            ("func_name", "TEXT NOT NULL DEFAULT 'main'"),
            ("chunk_size", "INTEGER NOT NULL DEFAULT 1000"),
            ("replication_factor", "INTEGER NOT NULL DEFAULT 2"),
            ("max_verification_attempts", "INTEGER NOT NULL DEFAULT 2"),
            ("status", "TEXT NOT NULL DEFAULT 'active'"),
            ("tags", "JSON"),
        ],
    )
    _migrate_sqlite_table_columns(
        "tasks",
        [
            ("replica_index", "INTEGER NOT NULL DEFAULT 0"),
            ("retry_count", "INTEGER NOT NULL DEFAULT 0"),
            ("error_message", "TEXT"),
            ("raw_result_data", "JSON"),
            ("raw_runtime_seconds", "FLOAT"),
            ("updated_at", "DATETIME"),
        ],
    )


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

def normalize_roles_input(role=None, roles=None) -> str:
    """
    Build a canonical role string: 'researcher', 'volunteer', or 'researcher,volunteer'.
    Accepts legacy single `role` or `roles` as a list or comma-separated string.
    Maps 'contributor' to 'volunteer'. Raises ValueError if nothing valid remains.
    """
    parts: list[str] = []
    if roles is not None:
        if isinstance(roles, str):
            parts.extend(roles.split(","))
        else:
            for item in roles:
                parts.append(str(item))
    elif role is not None:
        parts.append(str(role))
    seen: list[str] = []
    for p in parts:
        r = p.strip().lower()
        if r == "contributor":
            r = "volunteer"
        if r not in ("researcher", "volunteer"):
            continue
        if r not in seen:
            seen.append(r)
    if not seen:
        raise ValueError("At least one role is required (researcher and/or volunteer)")
    seen.sort(key=lambda x: 0 if x == "researcher" else 1)
    return ",".join(seen)


def set_user_roles(user_id: str, role_string: str) -> User | None:
    """Replace the user's role field (e.g. 'researcher,volunteer')."""
    with SessionLocal() as session:
        user = session.query(User).filter_by(user_id=user_id).first()
        if not user:
            return None
        user.role = role_string
        session.commit()
        session.refresh(user)
        return user


def create_user(email: str, name: str, role: str = "volunteer", metadata: dict = None) -> User:
    """Create a new user."""
    with SessionLocal() as session:
        user = User(user_id=user_id, email=email, name=name, role=role, user_metadata=metadata or {})
        session.add(user)
        session.commit()
        session.refresh(user)
        return user, None


def get_user_by_email(email: str) -> User:
    """Get user by email."""
    with SessionLocal() as session:
        return session.query(User).filter_by(email=email).first()


def get_user_by_id(user_id: str) -> User:
    """Get user by ID."""
    with SessionLocal() as session:
        return session.query(User).filter_by(user_id=user_id).first()


def user_has_role(user_id: str, role: str) -> bool:
    """Check if user has a specific role."""
    user = get_user_by_id(user_id)
    if not user:
        return False
    # Role can be 'researcher', 'volunteer', or 'researcher,volunteer'
    rset = {x.strip() for x in (user.role or "").split(",") if x.strip()}
    return role in rset

def create_project(researcher_id: str, title: str, description: str,
                   code_path: str, dataset_path: str, dataset_type: str,
                   func_name: str = "main", chunk_size: int = 1000,
                   replication_factor: int = 2,
                   max_verification_attempts: int = 2,
                   tags: list = None) -> Project:
    """Create a new project."""

    with SessionLocal() as session:
        project = Project(
            researcher_id=researcher_id,
            title=title,
            description=description,
            dataset_type=dataset_type,
            func_name=func_name,
            chunk_size=chunk_size,
            replication_factor=replication_factor,
            max_verification_attempts=max_verification_attempts,
            tags=tags or [],
        )
        session.add(project)
        session.flush()  # Assign project_id (from default) before using it for S3 keys

        code_key = f"{project.project_id}/code.py"
        _get_s3_client().upload_file(code_path, BUCKET_NAME, code_key)
        project.code_s3_path = f"s3://{BUCKET_NAME}/{code_key}"

        dataset_key = f"{project.project_id}/dataset.{dataset_type}"
        _get_s3_client().upload_file(dataset_path, BUCKET_NAME, dataset_key)
        project.dataset_s3_path = f"s3://{BUCKET_NAME}/{dataset_key}"

        session.commit()
        session.refresh(project)
        return project


def get_project(project_id: str) -> Project:
    """Get project by ID."""
    with SessionLocal() as session:
        return session.query(Project).filter_by(project_id=project_id).first()


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


def create_task_result(task_id: str, run_id: str, project_id: str,
                       result_data: dict, runtime_seconds: float = None,
                       memory_used_mb: float = None) -> TaskResult:
    """Create a task result. Worker is implied via Task.assigned_worker_id."""
    with SessionLocal() as session:
        result = TaskResult(
            task_id=task_id,
            run_id=run_id,
            project_id=project_id,
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

def create_task_result(task_id: str, run_id: str, project_id: str, worker_id: str,
                       result_data: dict, runtime_seconds: float = None,
                       memory_used_mb: float = None,
                       verification_attempt: int = 1,
                       verification_status: str = None) -> TaskResult:

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

def _hash_result(result_data):
    serialized = json.dumps(result_data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode()).hexdigest()

def get_all_projects(researcher_id: str = None, limit: int = None) -> list:
    """List all projects, optionally filtered by researcher_id."""
    with SessionLocal() as session:
        query = session.query(Project).filter(Project.status == "active")
        if researcher_id:
            query = query.filter(Project.researcher_id == researcher_id)
        query = query.order_by(Project.created_at.desc())
        if limit:
            query = query.limit(limit)
        return query.all()


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


def get_task_results_for_run(run_id: str) -> list:
    """Get all task results for a run, ordered by task_index (for download). Returns list of dicts."""
    with SessionLocal() as session:
        rows = (
            session.query(TaskResult, Task.task_index)
            .join(Task, TaskResult.task_id == Task.task_id)
            .filter(TaskResult.run_id == run_id)
            .order_by(Task.task_index)
            .all()
        )
        return [
            {
                "task_id": tr.task_id,
                "task_index": idx,
                "result_data": tr.result_data,
                "runtime_seconds": tr.runtime_seconds,
                "completed_at": tr.completed_at.isoformat() if tr.completed_at else None,
            }
            for tr, idx in rows
        ]

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


def create_user(
    user_id: str,
    email: str,
    name: str,
    role: str = "volunteer",
    metadata: dict = None,
    password: str = None,
):
    """
    Create a new user. Requires AWS_DATABASE_URL.
    Returns (user_like, None) on success, or (None, error_message) if user_id/email exists.
    """
    from werkzeug.security import generate_password_hash

    from backend.core.database_aws import is_aws_db_configured, create_aws_user
    if not is_aws_db_configured():
        return None, "AWS database not configured. Set AWS_DATABASE_URL to create users."
    hashed = (
        generate_password_hash(password)
        if password and str(password).strip()
        else "CHANGE_ME"
    )
    try:
        u = create_aws_user(
            user_id=user_id,
            email=email,
            name=name,
            role=role,
            hashed_password=hashed,
        )
        return u, None
    except ValueError as e:
        return None, str(e)


def set_user_roles(user_id: str, role_string: str):
    """Update user roles in AWS-backed auth store."""
    from backend.core.database_aws import is_aws_db_configured, set_aws_user_roles
    if not is_aws_db_configured():
        return None
    return set_aws_user_roles(user_id, role_string)


def link_aws_project_contributor(project_id: str, user_id: str) -> bool:
    """
    Link a contributor (user_id) to an AWS project in project_users.
    Safe no-op when AWS DB is not configured or project_id is not an AWS numeric id.
    """
    from backend.core.database_aws import (
        is_aws_db_configured,
        add_aws_project_user,
    )

    if not user_id or not is_aws_db_configured():
        return False

    try:
        aws_project_id = int(str(project_id))
    except (TypeError, ValueError):
        # Local/non-AWS project ids are not linkable in AWS project_users.
        return False

    try:
        add_aws_project_user(aws_project_id, user_id)
        return True
    except Exception:
        # Never fail task/result flow due to AWS linkage issues.
        return False


def create_project(researcher_id: str, title: str, description: str,
                   code_path: str, dataset_path: str, dataset_type: str,
                   func_name: str = "main", chunk_size: int = 1000,
                   replication_factor: int = 2, max_verification_attempts: int = 2,
                   num_chunks: int = 0, ip_address: str = None,
                   tags: list | None = None,
                   why_join: list | None = None,
                   learn_more: list | None = None):
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
            s3_upload_fn=_get_s3_client().upload_file,
            bucket_name=BUCKET_NAME,
            num_chunks=num_chunks,
            ip_address=ip_address,
            tags=tags,
            why_join=why_join,
            learn_more=learn_more,
        )
    raise RuntimeError("AWS database not configured. Set AWS_DATABASE_URL to create projects.")


def _average_task_runtime_seconds_for_project(session, project_id: str) -> float | None:
    """
    Mean task runtime for a project.

    Uses TaskResult.runtime_seconds joined through Run (same project scope as other stats).
    Falls back to Task.raw_runtime_seconds for completed tasks when result rows have no
    runtime (e.g. legacy rows or paths that only set raw time on Task).
    """
    from sqlalchemy import func

    pid = str(project_id)
    avg_tr = (
        session.query(func.avg(TaskResult.runtime_seconds))
        .join(Task, TaskResult.task_id == Task.task_id)
        .join(Run, Task.run_id == Run.run_id)
        .filter(
            Run.project_id == pid,
            TaskResult.runtime_seconds.isnot(None),
        )
        .scalar()
    )
    if avg_tr is not None:
        return float(avg_tr)
    avg_raw = (
        session.query(func.avg(Task.raw_runtime_seconds))
        .join(Run, Task.run_id == Run.run_id)
        .filter(
            Run.project_id == pid,
            Task.status == "completed",
            Task.raw_runtime_seconds.isnot(None),
        )
        .scalar()
    )
    if avg_raw is not None:
        return float(avg_raw)
    return None


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
        from sqlalchemy import func, distinct, or_

        for project in projects:
            pid = getattr(project, "project_id", None)
            if pid is None:
                continue
            pid = str(pid)

            runs = session.query(Run).filter_by(project_id=pid).all()
            total_runs = len(runs)
            latest_run = (
                max(runs, key=lambda r: (r.updated_at or r.created_at or datetime.min))
                if runs
                else None
            )

            all_tasks = session.query(Task).join(Run).filter(Run.project_id == pid).all()
            total_tasks = len(all_tasks)
            completed_tasks = sum(1 for t in all_tasks if t.status == "completed")
            failed_tasks = sum(1 for t in all_tasks if t.status == "failed")
            progress = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0

            # Total unique chunks (task_index) across all runs for this project
            total_chunks = len({t.task_index for t in all_tasks}) if all_tasks else 0

            # Verified chunks: TaskResult rows from consensus upsert (verification_status)
            # or legacy rows before that column was set (NULL).
            verified_chunk_indices = (
                session.query(distinct(Task.task_index))
                .join(TaskResult, TaskResult.task_id == Task.task_id)
                .join(Run, Task.run_id == Run.run_id)
                .filter(
                    Run.project_id == pid,
                    or_(
                        TaskResult.verification_status == "verified",
                        TaskResult.verification_status.is_(None),
                    ),
                )
                .all()
            )
            verified_chunks = len(verified_chunk_indices)

            # Failed verifications: TaskResult rows with a failed/disputed verification status
            failed_verifications = (
                session.query(func.count(TaskResult.task_result_id))
                .join(Task, TaskResult.task_id == Task.task_id)
                .join(Run, Task.run_id == Run.run_id)
                .filter(
                    Run.project_id == pid,
                    TaskResult.verification_status.in_(["failed", "disputed"]),
                )
                .scalar()
            ) or 0

            # Get unique contributors: users whose workers completed tasks in this project.
            # Join through Task (assigned_worker_id) rather than TaskResult.worker_id
            # to avoid missing contributors where worker_id was "worker-unknown".
            completed_task_users = (
                session.query(distinct(Worker.user_id))
                .join(Task, Task.assigned_worker_id == Worker.worker_id)
                .join(Run, Task.run_id == Run.run_id)
                .filter(
                    Run.project_id == pid,
                    Task.status == "completed",
                    Worker.user_id.isnot(None),
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
                    Run.project_id == pid,
                    Task.status.in_(["assigned", "running"]),
                    Worker.user_id.isnot(None),
                    Worker.status != "offline",
                )
                .all()
            )
            active_contributors = len([u[0] for u in active_task_users if u[0]])
            completed_contributors = total_contributors if progress >= 100 else None

            avg_task_time = _average_task_runtime_seconds_for_project(session, pid)

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

            raw_tags = getattr(project, "tags", None)
            if raw_tags is None:
                tag_list = []
            elif isinstance(raw_tags, list):
                tag_list = raw_tags
            elif isinstance(raw_tags, str):
                try:
                    decoded = json.loads(raw_tags)
                    tag_list = decoded if isinstance(decoded, list) else [str(decoded)]
                except Exception:
                    tag_list = [t.strip() for t in raw_tags.split(",") if t.strip()]
            else:
                tag_list = []

            title = getattr(project, "title", None) or getattr(project, "name", None) or f"Project {pid}"
            description = getattr(project, "description", None) or ""
            created_at = getattr(project, "created_at", None) or getattr(project, "date_created", None)

            result.append(
                {
                    "id": pid,
                    "researcherId": getattr(project, "researcher_id", None),
                    "title": title,
                    "description": description,
                    "status": getattr(project, "status", None) or "incomplete",
                    "datasetType": getattr(project, "dataset_type", None),
                    "funcName": getattr(project, "func_name", None) or "main",
                    "chunkSize": getattr(project, "chunk_size", None),
                    "replicationFactor": getattr(project, "replication_factor", None) or 2,
                    "maxVerificationAttempts": (
                        getattr(project, "max_verification_attempts", None)
                        or getattr(project, "max_attempts", None)
                        or 2
                    ),
                    "tags": tag_list,
                    "codePath": getattr(project, "code_s3_path", None) or "",
                    "datasetPath": getattr(project, "dataset_s3_path", None) or "",
                "progress": progress,
                "resultUrl": result_url,
                "totalContributors": total_contributors,
                "activeContributors": active_contributors,
                "completedContributors": completed_contributors,
                "totalTasks": total_tasks,
                "completedTasks": completed_tasks,
                "failedTasks": failed_tasks,
                "totalChunks": total_chunks,
                "verifiedChunks": verified_chunks,
                "failedVerifications": failed_verifications,
                    "createdAt": created_at.isoformat() if hasattr(created_at, "isoformat") and created_at else None,
                    "updatedAt": latest_updated.isoformat() if hasattr(latest_updated, "isoformat") and latest_updated else None,
                "totalRuns": total_runs,
                    "averageTaskTime": round(avg_task_time, 1) if avg_task_time is not None else None,
                    "latestRunId": latest_run.run_id if latest_run else None,
                    "latestRunStatus": latest_run.status if latest_run else None,
                }
            )

        return result


def get_project_stats(project_id: str) -> dict | None:
    """
    Project-level stats used by the project details page.
    Mirrors researcher dashboard metrics for a single project.
    """
    from types import SimpleNamespace
    from backend.core.database_aws import is_aws_db_configured, get_aws_project

    pid = str(project_id)
    aws_project = get_aws_project(pid) if is_aws_db_configured() else None

    with SessionLocal() as session:
        from sqlalchemy import func, distinct, or_

        runs = session.query(Run).filter_by(project_id=pid).all()
        total_runs = len(runs)
        latest_run = (
            max(runs, key=lambda r: (r.updated_at or r.created_at or datetime.min))
            if runs
            else None
        )

        all_tasks = session.query(Task).join(Run).filter(Run.project_id == pid).all()
        total_tasks = len(all_tasks)
        completed_tasks = sum(1 for t in all_tasks if t.status == "completed")
        failed_tasks = sum(1 for t in all_tasks if t.status == "failed")
        progress = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0

        completed_task_users = (
            session.query(distinct(Worker.user_id))
            .join(Task, Task.assigned_worker_id == Worker.worker_id)
            .join(Run, Task.run_id == Run.run_id)
            .filter(
                Run.project_id == pid,
                Task.status == "completed",
                Worker.user_id.isnot(None),
            )
            .all()
        )
        total_contributors = len([u[0] for u in completed_task_users if u[0]])

        active_task_users = (
            session.query(distinct(Worker.user_id))
            .join(Task, Worker.worker_id == Task.assigned_worker_id)
            .join(Run, Task.run_id == Run.run_id)
            .filter(
                Run.project_id == pid,
                Task.status.in_(["assigned", "running"]),
                Worker.user_id.isnot(None),
                Worker.status != "offline",
            )
            .all()
        )
        active_contributors = len([u[0] for u in active_task_users if u[0]])
        completed_contributors = total_contributors if progress >= 100 else None

        avg_task_time = _average_task_runtime_seconds_for_project(session, pid)

        total_chunks = len({t.task_index for t in all_tasks}) if all_tasks else 0

        verified_chunk_indices = (
            session.query(distinct(Task.task_index))
            .join(TaskResult, TaskResult.task_id == Task.task_id)
            .join(Run, Task.run_id == Run.run_id)
            .filter(
                Run.project_id == pid,
                or_(
                    TaskResult.verification_status == "verified",
                    TaskResult.verification_status.is_(None),
                ),
            )
            .all()
        )
        verified_chunks = len(verified_chunk_indices)

        failed_verifications = (
            session.query(func.count(TaskResult.task_result_id))
            .join(Task, TaskResult.task_id == Task.task_id)
            .join(Run, Task.run_id == Run.run_id)
            .filter(
                Run.project_id == pid,
                TaskResult.verification_status.in_(["failed", "disputed"]),
            )
            .scalar()
        ) or 0

        if not aws_project and total_runs == 0 and total_tasks == 0:
            return None

        project_like = aws_project or SimpleNamespace(
            project_id=pid,
            status="pending",
            created_at=None,
            updated_at=None,
        )

        latest_updated = getattr(project_like, "updated_at", None) or getattr(project_like, "created_at", None)
        for run in runs:
            if run.updated_at and (latest_updated is None or run.updated_at > latest_updated):
                latest_updated = run.updated_at

        created_at = getattr(project_like, "created_at", None) or getattr(project_like, "date_created", None)

        result = {
            "id": pid,
            "status": getattr(project_like, "status", None) or "pending",
            "progress": progress,
            "totalContributors": total_contributors,
            "activeContributors": active_contributors,
            "completedContributors": completed_contributors,
            "totalTasks": total_tasks,
            "completedTasks": completed_tasks,
            "failedTasks": failed_tasks,
            "totalRuns": total_runs,
            "averageTaskTime": round(avg_task_time, 1) if avg_task_time is not None else None,
            "latestRunId": latest_run.run_id if latest_run else None,
            "latestRunStatus": latest_run.status if latest_run else None,
            "createdAt": created_at.isoformat() if hasattr(created_at, "isoformat") and created_at else None,
            "updatedAt": latest_updated.isoformat() if hasattr(latest_updated, "isoformat") and latest_updated else None,
            "totalChunks": total_chunks,
            "verifiedChunks": verified_chunks,
            "failedVerifications": failed_verifications,
        }

        if aws_project:
            result["researcherId"] = getattr(aws_project, "researcher_id", None)
            result["title"] = getattr(aws_project, "title", None)
            result["description"] = getattr(aws_project, "description", None) or ""
            result["tags"] = list(getattr(aws_project, "tags", None) or [])
            result["whyJoin"] = list(getattr(aws_project, "why_join", None) or [])
            result["learnMore"] = list(getattr(aws_project, "learn_more", None) or [])
            result["replicationFactor"] = getattr(aws_project, "replication_factor", None) or 2
            result["maxVerificationAttempts"] = getattr(aws_project, "max_verification_attempts", None) or 2
            result["datasetType"] = getattr(aws_project, "dataset_type", None)
            result["awsTotalChunks"] = getattr(aws_project, "aws_total_chunks", None)
            result["awsChunksCompleted"] = getattr(aws_project, "aws_chunks_completed", None)
        else:
            result["researcherId"] = None
            result["tags"] = []

        return result


def list_browse_projects(limit: int = 200) -> list:
    """
    Public browse list sourced from AWS projects table.
    Kept for backward compatibility with older imports/call sites.
    """
    try:
        from backend.core.database_aws import list_aws_browse_projects
        return list_aws_browse_projects(limit=limit)
    except Exception:
        return []


def get_top_contributors_by_projects(limit: int = 200) -> list:
    """
    Top contributors ranked by number of distinct projects contributed to.
    Uses Worker.user_id as the contributor identifier.
    """
    with SessionLocal() as session:
        from sqlalchemy import func, distinct

        contributors = session.query(
            Worker.user_id,
            func.count(distinct(TaskResult.project_id)).label('projects_contributed')
        ).join(
            Task, Task.assigned_worker_id == Worker.worker_id
        ).join(
            TaskResult, TaskResult.task_id == Task.task_id
        ).filter(
            Worker.user_id.isnot(None)
        ).group_by(
            Worker.user_id
        ).order_by(
            func.count(distinct(TaskResult.project_id)).desc()
        ).limit(limit).all()

        result = []
        for contributor in contributors:
            result.append({
                "name": contributor.user_id,
                "projects_contributed": contributor.projects_contributed
            })

        return result


def set_workers_offline_for_user(user_id: str) -> int:
    """Mark all active workers for a user as offline. Returns number updated."""
    if not user_id:
        return 0
    with SessionLocal() as session:
        rows = (
            session.query(Worker)
            .filter(
                Worker.user_id == user_id,
                Worker.status.in_(["online", "idle", "busy"]),
            )
            .all()
        )
        for worker in rows:
            worker.status = "offline"
            worker.ray_node_id = None
            worker.updated_at = datetime.utcnow()
        session.commit()
        return len(rows)


# Simple test connection function
if __name__ == "__main__":
    init_db()
    with get_session() as session:
        print("Test DB session created successfully.")
