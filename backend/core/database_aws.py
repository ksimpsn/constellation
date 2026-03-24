"""
AWS RDS PostgreSQL: users, researchers, projects, project_users.

Set AWS_DATABASE_URL in the environment to use RDS for these tables.
Example: export AWS_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

Runs, tasks, workers, task_results, worker_heartbeats remain in SQLite (database.py).
"""

import os
from contextlib import contextmanager
from datetime import datetime
from types import SimpleNamespace
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

_AWS_DATABASE_URL = os.environ.get("AWS_DATABASE_URL")
if _AWS_DATABASE_URL and _AWS_DATABASE_URL.startswith("postgres://"):
    _AWS_DATABASE_URL = _AWS_DATABASE_URL.replace("postgres://", "postgresql://", 1)

aws_engine = None
AWSSessionLocal = None
AWSBase = declarative_base()


def init_aws_db() -> bool:
    """Initialize AWS RDS connection. Call once at startup if AWS_DATABASE_URL is set."""
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


def is_aws_db_configured() -> bool:
    """True if AWS_DATABASE_URL is set and connection is ready."""
    return _AWS_DATABASE_URL is not None and AWSSessionLocal is not None


# =============================================================================
# AWS RDS models (match your existing tables: users, researchers, projects, project_users)
# =============================================================================


class AWSUser(AWSBase):
    """Table: users (volunteers)"""
    __tablename__ = "users"

    username = Column(String(255), primary_key=True)  # use as user_id in app
    hashed_password = Column(String(255), nullable=False)
    # role = Column(String(50), nullable=True)  # 'researcher', 'volunteer', 'researcher,volunteer'
    date_created = Column(DateTime, default=datetime.utcnow)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)


class AWSResearcher(AWSBase):
    """Table: researchers"""
    __tablename__ = "researchers"

    username = Column(String(255), primary_key=True)
    hashed_password = Column(String(255), nullable=False)
    date_created = Column(DateTime, default=datetime.utcnow)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)


class AWSProject(AWSBase):
    """Table: projects"""
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, autoincrement=True)
    researcher_id = Column(String(255), ForeignKey("researchers.username"), nullable=True)
    ip_address = Column(String(45), nullable=True)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(String(255), nullable=True)
    total_chunks = Column(Integer, nullable=True)
    chunks_completed = Column(Integer, default=0)
    date_created = Column(DateTime, default=datetime.utcnow)
    replication_factor = Column(Integer, nullable=True, default=2)
    max_attempts = Column(Integer, nullable=True, default=2)
    code_s3_path = Column(String(1000), nullable=True)
    dataset_s3_path = Column(String(1000), nullable=True)
    dataset_type = Column(String(10), nullable=True)
    status = Column(String(20), nullable=True, default="pending")
    

class AWSProjectUser(AWSBase):
    """Table: project_users"""
    __tablename__ = "project_users"

    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), primary_key=True)
    username = Column(String(255), ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)


# =============================================================================
# Session and helpers (do not create tables; they already exist in RDS)
# =============================================================================


@contextmanager
def get_aws_session():
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


def get_aws_user_by_id(user_id: str) -> Optional[SimpleNamespace]:
    """Look up user by id (username). Returns object with user_id, role, name, email."""
    if not is_aws_db_configured():
        return None
    with get_aws_session() as session:
        in_researchers = session.query(AWSResearcher).filter_by(username=user_id).first() is not None
        u = session.query(AWSUser).filter_by(username=user_id).first()
        if not in_researchers and not u:
            return None
        roles = []
        if in_researchers:
            roles.append("researcher")
        if u:
            roles.append(getattr(u, "role", None) or "volunteer")
        role = ",".join(roles) if roles else "volunteer"
        name = user_id
        email = None
        if u:
            name = getattr(u, "name", None) or user_id
            email = getattr(u, "email", None)
        return SimpleNamespace(user_id=user_id, role=role, name=name, email=email)


def get_aws_user_by_email(email: str) -> Optional[SimpleNamespace]:
    if not is_aws_db_configured():
        return None
    with get_aws_session() as session:
        u = session.query(AWSUser).filter_by(email=email).first()
        if not u:
            return None
        return SimpleNamespace(
            user_id=u.username,
            role=getattr(u, "role", None) or "volunteer",
            name=getattr(u, "name", None) or u.username,
            email=u.email,
        )


def user_has_aws_role(user_id: str, role: str) -> bool:
    user = get_aws_user_by_id(user_id)
    if not user:
        return False
    return role in (user.role or "").split(",")


def get_all_aws_projects(researcher_id: str = None, limit: int = None) -> list:
    """List projects from RDS as project-like objects."""
    if not is_aws_db_configured():
        return []
    with get_aws_session() as session:
        query = session.query(AWSProject).order_by(AWSProject.date_created.desc())
        if researcher_id:
            query = query.filter(AWSProject.researcher_id == researcher_id)
        if limit:
            query = query.limit(limit)
        rows = query.all()
        return [
            SimpleNamespace(
                project_id=str(p.project_id),
                researcher_id=p.researcher_id,
                title=p.name,
                description=p.description or "",
                code_s3_path=p.code_s3_path,
                dataset_s3_path=p.dataset_s3_path,
                dataset_type=p.dataset_type or "csv",
                replication_factor=2,
                max_verification_attempts=2,
            )
            for p in rows
        ]


def get_aws_project(project_id) -> Optional[SimpleNamespace]:
    """Look up project by id (int or string). Returns object with project_id, title, code_s3_path, etc."""
    if not is_aws_db_configured():
        return None
    try:
        pid = int(project_id)
    except (TypeError, ValueError):
        return None
    with get_aws_session() as session:
        p = session.query(AWSProject).filter_by(project_id=pid).first()
        if not p:
            return None
        return SimpleNamespace(
            project_id=str(p.project_id),
            researcher_id=p.researcher_id,
            title=p.name,
            description=p.description or "",
            code_s3_path=p.code_s3_path,
            dataset_s3_path=p.dataset_s3_path,
            dataset_type=p.dataset_type or "csv",
            replication_factor=2,
            max_verification_attempts=2,
        )


def create_aws_user(
    user_id: str,
    email: str,
    name: str,
    role: str = "volunteer",
    hashed_password: str = "CHANGE_ME",
) -> SimpleNamespace:
    if not is_aws_db_configured():
        raise RuntimeError("AWS database not configured. Set AWS_DATABASE_URL.")
    with get_aws_session() as session:
        if session.query(AWSUser).filter_by(username=user_id).first():
            raise ValueError("user_id already exists")
        if email and session.query(AWSUser).filter_by(email=email).first():
            raise ValueError("email already exists")
        u = AWSUser(
            username=user_id,
            hashed_password=hashed_password,
            email=email or None,
            name=name or user_id,
            role=role,
        )
        session.add(u)
    return SimpleNamespace(user_id=user_id, role=role, name=name or user_id, email=email)


def create_aws_project(
    researcher_id: str,
    title: str,
    description: str,
    code_path: str,
    dataset_path: str,
    dataset_type: str,
    func_name: str = "main",
    chunk_size: int = 1000,
    replication_factor: int = 2,
    max_verification_attempts: int = 2,
    s3_upload_fn=None,
    bucket_name: str = None,
) -> SimpleNamespace:
    """
    Create project in RDS and optionally upload code/dataset to S3.
    s3_upload_fn(code_path, bucket, key) and bucket_name must be provided to upload to S3.
    Returns a project-like object with project_id (str), code_s3_path, dataset_s3_path, etc.
    """
    if not is_aws_db_configured():
        raise RuntimeError("AWS database not configured. Set AWS_DATABASE_URL.")
    with get_aws_session() as session:
        p = AWSProject(
            researcher_id=researcher_id,
            name=title,
            description=description,
            dataset_type=dataset_type,
            total_chunks=0,
            chunks_completed=0,
        )
        session.add(p)
        session.flush()
        pid = p.project_id
        code_s3_path = None
        dataset_s3_path = None
        if s3_upload_fn and bucket_name:
            try:
                code_key = f"{pid}/code.py"
                s3_upload_fn(code_path, bucket_name, code_key)
                code_s3_path = f"s3://{bucket_name}/{code_key}"
                dataset_key = f"{pid}/dataset.{dataset_type}"
                s3_upload_fn(dataset_path, bucket_name, dataset_key)
                dataset_s3_path = f"s3://{bucket_name}/{dataset_key}"
                p.code_s3_path = code_s3_path
                p.dataset_s3_path = dataset_s3_path
            except Exception as e:
                print(f"[AWS] S3 upload failed: {e}")
    return SimpleNamespace(
        project_id=str(pid),
        researcher_id=researcher_id,
        title=title,
        description=description,
        code_s3_path=code_s3_path,
        dataset_s3_path=dataset_s3_path,
        dataset_type=dataset_type,
        func_name=func_name,
        chunk_size=chunk_size,
        replication_factor=replication_factor,
        max_verification_attempts=max_verification_attempts,
    )
