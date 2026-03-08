"""
AWS PostgreSQL schema integration.

Models and helpers for the Constellation tables created in AWS RDS Postgres:
- users (volunteers)
- researchers
- projects
- project_users
- tasks

Set AWS_DATABASE_URL in the environment to enable syncing to this database.
Example: postgresql://user:password@host:5432/dbname
"""

import os
from datetime import datetime
from contextlib import contextmanager

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Optional: use postgresql driver
_AWS_DATABASE_URL = os.environ.get("AWS_DATABASE_URL")
if _AWS_DATABASE_URL and _AWS_DATABASE_URL.startswith("postgres://"):
    _AWS_DATABASE_URL = _AWS_DATABASE_URL.replace("postgres://", "postgresql://", 1)

aws_engine = None
AWSSessionLocal = None
AWSBase = declarative_base()


def init_aws_db():
    """Initialize AWS Postgres connection. Call once at startup if AWS_DATABASE_URL is set."""
    global aws_engine, AWSSessionLocal
    if not _AWS_DATABASE_URL:
        return False
    try:
        aws_engine = create_engine(_AWS_DATABASE_URL, echo=False)
        AWSSessionLocal = sessionmaker(bind=aws_engine, autocommit=False, autoflush=False)
        return True
    except Exception as e:
        print(f"[AWS DB] Failed to connect: {e}")
        return False


def is_aws_db_configured():
    """Return True if AWS Postgres URL is set and connection is ready."""
    return _AWS_DATABASE_URL is not None and AWSSessionLocal is not None


# ============================================================================
# AWS schema models (match tables created in Postgres)
# ============================================================================


class AWSUser(AWSBase):
    """Volunteers - table: users"""
    __tablename__ = "users"

    username = Column(String(255), primary_key=True)
    hashed_password = Column(String(255), nullable=False)
    date_created = Column(DateTime, default=datetime.utcnow)


class AWSResearcher(AWSBase):
    """Researchers - table: researchers"""
    __tablename__ = "researchers"

    username = Column(String(255), primary_key=True)
    hashed_password = Column(String(255), nullable=False)
    date_created = Column(DateTime, default=datetime.utcnow)


class AWSProject(AWSBase):
    """Projects - table: projects"""
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, autoincrement=True)
    researcher_id = Column(String(255), ForeignKey("researchers.username"), nullable=True)
    ip_address = Column(String(45), nullable=True)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    total_chunks = Column(Integer, nullable=True)
    chunks_completed = Column(Integer, default=0)
    date_created = Column(DateTime, default=datetime.utcnow)


class AWSProjectUser(AWSBase):
    """Which users joined which project - table: project_users"""
    __tablename__ = "project_users"

    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), primary_key=True)
    username = Column(String(255), ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)


class AWSTask(AWSBase):
    """Tasks - table: tasks"""
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    assigned_user = Column(String(255), ForeignKey("users.username"), nullable=True)
    chunk_index = Column(Integer, nullable=False)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


# ============================================================================
# Helpers (do not create tables - they already exist in AWS)
# ============================================================================


@contextmanager
def get_aws_session():
    """Context-managed session for AWS Postgres. Use only when is_aws_db_configured()."""
    if not AWSSessionLocal:
        raise RuntimeError("AWS database not configured. Set AWS_DATABASE_URL.")
    session = AWSSessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def ensure_aws_researcher(username: str = "default_researcher") -> str:
    """Ensure a researcher exists; return username. Use default if no auth."""
    if not is_aws_db_configured():
        return username
    with get_aws_session() as session:
        r = session.query(AWSResearcher).filter_by(username=username).first()
        if not r:
            r = AWSResearcher(username=username, hashed_password="CHANGE_ME")  # Placeholder; set via auth later
            session.add(r)
        return username


def create_aws_project(
    researcher_username: str,
    name: str,
    description: str = "",
    total_chunks: int = 0,
    ip_address: str = None,
    tags: str = None,
) -> int:
    """Create a project in AWS Postgres. Returns project_id."""
    ensure_aws_researcher(researcher_username)
    with get_aws_session() as session:
        p = AWSProject(
            researcher_id=researcher_username,
            name=name,
            description=description,
            total_chunks=total_chunks,
            chunks_completed=0,
            ip_address=ip_address,
            tags=tags,
        )
        session.add(p)
        session.flush()
        project_id = p.project_id
    return project_id


def create_aws_tasks(project_id: int, num_chunks: int) -> None:
    """Create task rows for each chunk (chunk_index 0 .. num_chunks-1)."""
    if not is_aws_db_configured():
        return
    with get_aws_session() as session:
        for i in range(num_chunks):
            t = AWSTask(project_id=project_id, chunk_index=i, status="pending")
            session.add(t)


def update_aws_project_progress(project_id: int, chunks_completed: int) -> None:
    """Update chunks_completed for an AWS project."""
    if not is_aws_db_configured():
        return
    with get_aws_session() as session:
        p = session.query(AWSProject).filter_by(project_id=project_id).first()
        if p:
            p.chunks_completed = chunks_completed


def set_aws_task_completed(project_id: int, chunk_index: int) -> None:
    """Mark one task as completed by chunk_index."""
    if not is_aws_db_configured():
        return
    with get_aws_session() as session:
        t = session.query(AWSTask).filter_by(project_id=project_id, chunk_index=chunk_index).first()
        if t:
            t.status = "completed"
            t.completed_at = datetime.utcnow()


def set_aws_project_tasks_running(project_id: int) -> None:
    """Mark all pending tasks for this project as running (optional)."""
    if not is_aws_db_configured():
        return
    with get_aws_session() as session:
        session.query(AWSTask).filter_by(project_id=project_id, status="pending").update(
            {"status": "running"}, synchronize_session=False
        )
