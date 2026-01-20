"""
Constellation Database Models
SQLite implementation matching AWS schema from DATABASE.md

This module provides SQLAlchemy models for:
- DynamoDB-equivalent tables: Users, Projects, Runs, Tasks, Workers
- Redshift-equivalent tables: TaskResults, WorkerHeartbeats
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.sqlite import JSON
from contextlib import contextmanager
from datetime import datetime
import uuid

# Create SQLite database (local file: constellation.db)
DATABASE_URL = "sqlite:///constellation.db"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# ============================================================================
# DynamoDB-Equivalent Tables (Transactional Data)
# ============================================================================

class User(Base):
    """User accounts (researchers and volunteers) - matches constellation-users"""
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=lambda: f"user-{uuid.uuid4()}")
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # 'researcher', 'volunteer', or 'researcher,volunteer'
    user_metadata = Column("metadata", JSON, nullable=True)  # Flexible storage (signup reasons, preferences)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    projects = relationship("Project", back_populates="researcher", cascade="all, delete-orphan")
    workers = relationship("Worker", back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(user_id={self.user_id}, email={self.email}, role={self.role})>"


class Project(Base):
    """Research projects - matches constellation-projects"""
    __tablename__ = "projects"

    project_id = Column(String, primary_key=True, default=lambda: f"project-{uuid.uuid4()}")
    researcher_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    code_s3_path = Column(String(1000), nullable=False)  # Will be S3 path, currently local path
    dataset_s3_path = Column(String(1000), nullable=False)  # Will be S3 path, currently local path
    dataset_type = Column(String(10), nullable=False)  # 'csv' or 'json'
    func_name = Column(String(255), nullable=False, default="main")
    chunk_size = Column(Integer, nullable=False, default=1000)
    status = Column(String(50), nullable=False, default="active", index=True)  # 'active', 'archived', 'deleted'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    researcher = relationship("User", back_populates="projects")
    runs = relationship("Run", back_populates="project", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_project_researcher_created', 'researcher_id', 'created_at'),
        Index('idx_project_status_created', 'status', 'created_at'),
    )

    def __repr__(self):
        return f"<Project(project_id={self.project_id}, title={self.title}, status={self.status})>"


class Run(Base):
    """Execution runs - matches constellation-runs"""
    __tablename__ = "runs"

    run_id = Column(String, primary_key=True, default=lambda: f"run-{uuid.uuid4()}")
    project_id = Column(String, ForeignKey("projects.project_id"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending", index=True)  # 'pending', 'running', 'completed', 'failed', 'cancelled'
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    total_tasks = Column(Integer, nullable=False, default=0)
    completed_tasks = Column(Integer, nullable=False, default=0)
    failed_tasks = Column(Integer, nullable=False, default=0)
    results_s3_path = Column(String(1000), nullable=True)  # Will be S3 path, currently local path
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="runs")
    tasks = relationship("Task", back_populates="run", cascade="all, delete-orphan")

    # Indexes
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
    status = Column(String(50), nullable=False, default="pending", index=True)  # 'pending', 'assigned', 'running', 'completed', 'failed', 'cancelled'
    assigned_worker_id = Column(String, ForeignKey("workers.worker_id"), nullable=True, index=True)
    assigned_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
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
    )

    def __repr__(self):
        return f"<Task(task_id={self.task_id}, run_id={self.run_id}, status={self.status}, index={self.task_index})>"


class Worker(Base):
    """LAN worker nodes - matches constellation-workers"""
    __tablename__ = "workers"

    worker_id = Column(String, primary_key=True)  # Can be UUID or device MAC address
    user_id = Column(String, ForeignKey("users.user_id"), nullable=True, index=True)
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

    # Relationships
    owner = relationship("User", back_populates="workers")
    assigned_tasks = relationship("Task", back_populates="assigned_worker")
    task_results = relationship("TaskResult", back_populates="worker")
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

    task_result_id = Column(String, primary_key=True, default=lambda: f"result-{uuid.uuid4()}")
    task_id = Column(String, ForeignKey("tasks.task_id"), unique=True, nullable=False, index=True)
    run_id = Column(String, nullable=False, index=True)  # Denormalized for analytics
    project_id = Column(String, nullable=False, index=True)  # Denormalized for analytics
    worker_id = Column(String, ForeignKey("workers.worker_id"), nullable=False, index=True)
    result_data = Column(JSON, nullable=False)  # JSON result payload
    runtime_seconds = Column(Float, nullable=True)
    memory_used_mb = Column(Float, nullable=True)
    completed_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    task = relationship("Task", back_populates="result")
    worker = relationship("Worker", back_populates="task_results")

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
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)
    print("Database initialized and tables created.")


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
# Helper Functions for New Schema
# ============================================================================

def create_user(email: str, name: str, role: str = "volunteer", metadata: dict = None) -> User:
    """Create a new user."""
    with SessionLocal() as session:
        user = User(email=email, name=name, role=role, user_metadata=metadata or {})
        session.add(user)
        session.commit()
        session.refresh(user)
        return user


def get_user_by_email(email: str) -> User:
    """Get user by email."""
    with SessionLocal() as session:
        return session.query(User).filter_by(email=email).first()


def get_user_by_id(user_id: str) -> User:
    """Get user by ID."""
    with SessionLocal() as session:
        return session.query(User).filter_by(user_id=user_id).first()


def create_project(researcher_id: str, title: str, description: str, 
                   code_path: str, dataset_path: str, dataset_type: str,
                   func_name: str = "main", chunk_size: int = 1000) -> Project:
    """Create a new project."""
    with SessionLocal() as session:
        project = Project(
            researcher_id=researcher_id,
            title=title,
            description=description,
            code_s3_path=code_path,  # Will be S3 path later
            dataset_s3_path=dataset_path,  # Will be S3 path later
            dataset_type=dataset_type,
            func_name=func_name,
            chunk_size=chunk_size
        )
        session.add(project)
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


def create_task(run_id: str, task_index: int) -> Task:
    """Create a new task."""
    with SessionLocal() as session:
        task = Task(run_id=run_id, task_index=task_index)
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
    """Assign a task to a worker."""
    with SessionLocal() as session:
        task = session.query(Task).filter_by(task_id=task_id).first()
        if not task:
            return False
        task.assigned_worker_id = worker_id
        task.status = "assigned"
        task.assigned_at = datetime.utcnow()
        task.updated_at = datetime.utcnow()
        session.commit()
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
                       memory_used_mb: float = None) -> TaskResult:
    """Create a task result."""
    with SessionLocal() as session:
        result = TaskResult(
            task_id=task_id,
            run_id=run_id,
            project_id=project_id,
            worker_id=worker_id,
            result_data=result_data,
            runtime_seconds=runtime_seconds,
            memory_used_mb=memory_used_mb,
            completed_at=datetime.utcnow()
        )
        session.add(result)
        session.commit()
        session.refresh(result)
        return result


def register_worker(worker_id: str, worker_name: str, user_id: str = None,
                    ip_address: str = None, cpu_cores: int = None,
                    memory_gb: float = None) -> Worker:
    """Register or update a worker."""
    with SessionLocal() as session:
        worker = session.query(Worker).filter_by(worker_id=worker_id).first()
        if worker:
            # Update existing worker
            worker.worker_name = worker_name
            worker.user_id = user_id
            worker.ip_address = ip_address
            worker.cpu_cores = cpu_cores
            worker.memory_gb = memory_gb
            worker.updated_at = datetime.utcnow()
        else:
            # Create new worker
            worker = Worker(
                worker_id=worker_id,
                worker_name=worker_name,
                user_id=user_id,
                ip_address=ip_address,
                cpu_cores=cpu_cores,
                memory_gb=memory_gb
            )
            session.add(worker)
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
    """Get available workers (idle or online with good CPU availability)."""
    with SessionLocal() as session:
        query = session.query(Worker).filter(
            Worker.status.in_(["idle", "online"]),
            Worker.cpu_availability > 0.5,
            Worker.last_heartbeat.isnot(None)
        ).order_by(Worker.cpu_availability.desc())
        if limit:
            query = query.limit(limit)
        return query.all()


# Simple test connection function
if __name__ == "__main__":
    init_db()
    with get_session() as session:
        print("Test DB session created successfully.")
