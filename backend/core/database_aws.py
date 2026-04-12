"""
AWS RDS PostgreSQL: users, researchers, projects, project_users.

Set AWS_DATABASE_URL in the environment to use RDS for these tables.
Example: export AWS_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

Runs, tasks, workers, task_results, worker_heartbeats remain in SQLite (database.py).
"""

import json
import os
from contextlib import contextmanager
from datetime import datetime
from types import SimpleNamespace
from typing import List, Optional, Tuple

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


def _ensure_projects_volunteer_metadata_columns() -> None:
    """
    Add why_join / learn_more to public.projects if missing (PostgreSQL/RDS).

    Keeps older databases working without a manual migration; idempotent.
    """
    if aws_engine is None or aws_engine.dialect.name != "postgresql":
        return
    from sqlalchemy import text

    try:
        with aws_engine.begin() as conn:
            for col_name, col_type in (("why_join", "TEXT"), ("learn_more", "TEXT")):
                row = conn.execute(
                    text(
                        "SELECT 1 FROM information_schema.columns "
                        "WHERE table_schema = CURRENT_SCHEMA() AND table_name = 'projects' "
                        "AND column_name = :col"
                    ),
                    {"col": col_name},
                ).fetchone()
                if row is None:
                    conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col_name} {col_type}"))
                    print(f"[AWS DB] Added column projects.{col_name} ({col_type})")
    except Exception as e:
        print(f"[AWS DB] Could not ensure projects.why_join / learn_more columns: {e}")


def init_aws_db() -> bool:
    """Initialize AWS RDS connection. Call once at startup if AWS_DATABASE_URL is set."""
    global aws_engine, AWSSessionLocal
    if not _AWS_DATABASE_URL:
        return False
    try:
        aws_engine = create_engine(_AWS_DATABASE_URL, echo=False)
        AWSSessionLocal = sessionmaker(bind=aws_engine, autocommit=False, autoflush=False)
        _ensure_projects_volunteer_metadata_columns()
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
    # JSON: array of strings (volunteer-facing); array of {label, url} for learn_more (url may be "")
    why_join = Column(Text, nullable=True)
    learn_more = Column(Text, nullable=True)


class AWSProjectUser(AWSBase):
    """Table: project_users"""
    __tablename__ = "project_users"

    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), primary_key=True)
    username = Column(String(255), ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)


def add_aws_project_user(project_id: int, username: str) -> None:
    """Record volunteer username joined project (project_users). Idempotent."""
    if not is_aws_db_configured():
        raise RuntimeError("AWS database not configured. Set AWS_DATABASE_URL.")
    with get_aws_session() as session:
        existing = session.query(AWSProjectUser).filter_by(project_id=project_id, username=username).first()
        if not existing:
            session.add(AWSProjectUser(project_id=project_id, username=username))


def _why_join_list_from_column(raw) -> List[str]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if str(x).strip()]
    if isinstance(raw, str):
        s = raw.strip()
        if not s:
            return []
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list):
                return [str(x).strip() for x in parsed if str(x).strip()]
        except Exception:
            pass
        return [ln.strip() for ln in s.splitlines() if ln.strip()]
    return []


def _learn_more_list_from_column(raw) -> List[dict]:
    if raw is None:
        return []
    if isinstance(raw, list):
        out = []
        for x in raw:
            if isinstance(x, dict):
                lab = str(x.get("label", "")).strip()
                if not lab:
                    continue
                out.append({"label": lab, "url": str(x.get("url", "") or "").strip()})
        return out
    if isinstance(raw, str):
        s = raw.strip()
        if not s:
            return []
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list):
                return _learn_more_list_from_column(parsed)
        except Exception:
            pass
    return []


def _tags_list_from_column(raw) -> List[str]:
    """Normalize projects.tags (JSON array, comma string, or empty) to a list of strings."""
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(tag).strip() for tag in raw if str(tag).strip()]
    if isinstance(raw, str):
        stripped = raw.strip()
        if not stripped:
            return []
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, list):
                return [str(tag).strip() for tag in parsed if str(tag).strip()]
        except Exception:
            pass
        return [x.strip() for x in stripped.split(",") if x.strip()]
    return []


def get_aws_project_users(project_id: int) -> list:
    """Usernames (volunteers) linked to a project."""
    if not is_aws_db_configured():
        return []
    with get_aws_session() as session:
        rows = session.query(AWSProjectUser.username).filter_by(project_id=project_id).all()
        return [row[0] for row in rows]


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
        r = session.query(AWSResearcher).filter_by(username=user_id).first()
        u = session.query(AWSUser).filter_by(username=user_id).first()
        if not r and not u:
            return None
        roles = []
        if r:
            roles.append("researcher")
        if u:
            roles.append("volunteer")
        role = ",".join(roles) if roles else "volunteer"
        name = user_id
        email = None
        if u:
            name = getattr(u, "name", None) or user_id
            email = getattr(u, "email", None)
        if r and (name == user_id or email is None):
            name = getattr(r, "name", None) or name
            if email is None:
                email = getattr(r, "email", None)
        return SimpleNamespace(user_id=user_id, role=role, name=name, email=email)


def get_aws_user_by_email(email: str) -> Optional[SimpleNamespace]:
    """Look up by email in users and researchers; return unified user object."""
    if not is_aws_db_configured():
        return None
    with get_aws_session() as session:
        u = session.query(AWSUser).filter_by(email=email).first()
        r = session.query(AWSResearcher).filter_by(email=email).first()
        if not u and not r:
            return None
        user_id = (u or r).username
        roles = []
        if r:
            roles.append("researcher")
        if u:
            roles.append("volunteer")
        role = ",".join(roles) if roles else "volunteer"
        name = getattr(u or r, "name", None) or user_id
        return SimpleNamespace(user_id=user_id, role=role, name=name, email=email)


def get_aws_password_hash_by_email(email: str) -> Optional[str]:
    """
    Return stored password hash for a user email, if present.
    Checks users and researchers tables; prefers non-empty hash.
    """
    if not is_aws_db_configured():
        return None
    with get_aws_session() as session:
        u = session.query(AWSUser).filter_by(email=email).first()
        r = session.query(AWSResearcher).filter_by(email=email).first()
        candidates = [
            getattr(u, "hashed_password", None) if u else None,
            getattr(r, "hashed_password", None) if r else None,
        ]
        for cand in candidates:
            if cand and str(cand).strip():
                return str(cand).strip()
    return None


def set_aws_user_password_by_user_id(user_id: str, hashed_password: str) -> bool:
    """Update password hash in users/researchers rows for the given user_id."""
    if not is_aws_db_configured():
        return False
    if not user_id or not hashed_password:
        return False

    with get_aws_session() as session:
        u = session.query(AWSUser).filter_by(username=user_id).first()
        r = session.query(AWSResearcher).filter_by(username=user_id).first()
        if not u and not r:
            return False
        if u:
            u.hashed_password = hashed_password
        if r:
            r.hashed_password = hashed_password
        return True


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
                replication_factor=getattr(p, "replication_factor", None) or 2,
                max_verification_attempts=getattr(p, "max_attempts", None) or 2,
                created_at=getattr(p, "date_created", None),
                updated_at=None,
                status=getattr(p, "status", None) or "pending",
            )
            for p in rows
        ]


def list_aws_browse_projects(limit: int = 200) -> list:
    """
    Public browse list sourced from AWS projects table.
    Returns shape compatible with frontend browse/details pages.
    """
    if not is_aws_db_configured():
        return []

    with get_aws_session() as session:
        rows = (
            session.query(AWSProject, AWSResearcher.name)
            .outerjoin(AWSResearcher, AWSProject.researcher_id == AWSResearcher.username)
            .order_by(AWSProject.date_created.desc())
            .limit(limit)
            .all()
        )

        out = []
        for project, researcher_name in rows:
            raw = project.tags
            if raw is None:
                tag_list = []
            elif isinstance(raw, list):
                tag_list = [str(tag) for tag in raw if str(tag).strip()]
            elif isinstance(raw, str):
                stripped = raw.strip()
                if not stripped:
                    tag_list = []
                else:
                    try:
                        parsed = json.loads(stripped)
                        if isinstance(parsed, list):
                            tag_list = [str(tag) for tag in parsed if str(tag).strip()]
                        else:
                            tag_list = [x.strip() for x in stripped.split(",") if x.strip()]
                    except Exception:
                        tag_list = [x.strip() for x in stripped.split(",") if x.strip()]
            else:
                tag_list = []

            why_join_list = _why_join_list_from_column(getattr(project, "why_join", None))
            learn_more_list = _learn_more_list_from_column(getattr(project, "learn_more", None))

            out.append(
                {
                    "id": project.project_id,
                    "title": project.name,
                    "description": (project.description or "")[:500],
                    "tags": tag_list,
                    "researcherName": researcher_name,
                    "researcherId": project.researcher_id,
                    "whyJoin": why_join_list,
                    "learnMore": learn_more_list,
                }
            )

        return out


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
            replication_factor=getattr(p, "replication_factor", None) or 2,
            max_verification_attempts=getattr(p, "max_attempts", None) or 2,
            created_at=getattr(p, "date_created", None),
            updated_at=None,
            status=getattr(p, "status", None) or "pending",
            tags=_tags_list_from_column(p.tags),
            why_join=_why_join_list_from_column(getattr(p, "why_join", None)),
            learn_more=_learn_more_list_from_column(getattr(p, "learn_more", None)),
            aws_total_chunks=p.total_chunks,
            aws_chunks_completed=p.chunks_completed or 0,
        )


def update_aws_project_by_owner(
    project_id,
    owner_researcher_id: str,
    *,
    title: str | None = None,
    description: str | None = None,
    tags: list | str | None = None,
    why_join: list | None = None,
    learn_more: list | None = None,
) -> Tuple[bool, Optional[str]]:
    """
    Update RDS project metadata if owner_researcher_id matches project.researcher_id.
    Returns (success, error_message).
    """
    if not is_aws_db_configured():
        return False, "AWS database not configured"
    if not owner_researcher_id:
        return False, "Missing owner"
    try:
        pid = int(project_id)
    except (TypeError, ValueError):
        return False, "Invalid project id"
    with get_aws_session() as session:
        p = session.query(AWSProject).filter_by(project_id=pid).first()
        if not p:
            return False, "Project not found"
        if (p.researcher_id or "") != owner_researcher_id:
            return False, "Only the project owner can update this project"
        if title is not None:
            t = title.strip()
            if not t:
                return False, "Title cannot be empty"
            p.name = t[:500]
        if description is not None:
            p.description = description
        if tags is not None:
            if isinstance(tags, list):
                cleaned = [str(x).strip() for x in tags if str(x).strip()]
                if not cleaned:
                    return False, "At least one tag is required"
                p.tags = json.dumps(cleaned)
            else:
                s = str(tags).strip()
                if not s:
                    return False, "At least one tag is required"
                p.tags = s
        if why_join is not None:
            cleaned_wj = [str(x).strip() for x in why_join if str(x).strip()]
            if not cleaned_wj:
                return False, "At least one 'why join' line is required"
            p.why_join = json.dumps(cleaned_wj)
        if learn_more is not None:
            lm = []
            for i, item in enumerate(learn_more):
                if not isinstance(item, dict):
                    return False, f"learnMore[{i}] must be an object with label and optional url"
                lab = str(item.get("label", "")).strip()
                if not lab:
                    return False, f"learnMore[{i}] needs a non-empty label (URL may be blank)"
                lm.append({"label": lab, "url": str(item.get("url", "") or "").strip()})
            p.learn_more = json.dumps(lm)
        return True, None


def create_aws_user(
    user_id: str,
    email: str,
    name: str,
    role: str = "volunteer",
    hashed_password: str = "CHANGE_ME",
) -> SimpleNamespace:
    """
    Create in RDS: 'volunteer' -> users; 'researcher' -> researchers;
    'researcher,volunteer' -> both tables.
    """
    if not is_aws_db_configured():
        raise RuntimeError("AWS database not configured. Set AWS_DATABASE_URL.")
    role = role or "volunteer"
    roles = [x.strip() for x in role.split(",") if x.strip()]
    with get_aws_session() as session:
        if session.query(AWSUser).filter_by(username=user_id).first():
            raise ValueError("user_id already exists")
        if session.query(AWSResearcher).filter_by(username=user_id).first():
            raise ValueError("user_id already exists")
        if email:
            if session.query(AWSUser).filter_by(email=email).first():
                raise ValueError("email already exists")
            if session.query(AWSResearcher).filter_by(email=email).first():
                raise ValueError("email already exists")
        if "volunteer" in roles:
            session.add(
                AWSUser(
                    username=user_id,
                    hashed_password=hashed_password,
                    email=email or "",
                    name=name or user_id,
                )
            )
        if "researcher" in roles:
            session.add(
                AWSResearcher(
                    username=user_id,
                    hashed_password=hashed_password,
                    email=email or "",
                    name=name or user_id,
                )
            )
    return SimpleNamespace(user_id=user_id, role=role, name=name or user_id, email=email)


def set_aws_user_roles(user_id: str, role_string: str) -> Optional[SimpleNamespace]:
    """
    Ensure the user exists in AWS tables that correspond to role_string:
    - volunteer -> users table
    - researcher -> researchers table
    Returns the unified user object, or None if user_id does not exist in either table.
    """
    if not is_aws_db_configured():
        raise RuntimeError("AWS database not configured. Set AWS_DATABASE_URL.")

    roles = {r.strip() for r in (role_string or "").split(",") if r.strip()}
    if not roles:
        raise ValueError("At least one role is required")

    with get_aws_session() as session:
        u = session.query(AWSUser).filter_by(username=user_id).first()
        r = session.query(AWSResearcher).filter_by(username=user_id).first()
        if not u and not r:
            return None

        base_name = (
            (u.name if u and getattr(u, "name", None) else None)
            or (r.name if r and getattr(r, "name", None) else None)
            or user_id
        )
        base_email = (
            (u.email if u and getattr(u, "email", None) else None)
            or (r.email if r and getattr(r, "email", None) else None)
            or ""
        )
        base_password = (
            (u.hashed_password if u and getattr(u, "hashed_password", None) else None)
            or (r.hashed_password if r and getattr(r, "hashed_password", None) else None)
            or "CHANGE_ME"
        )

        if "volunteer" in roles:
            if not u:
                session.add(
                    AWSUser(
                        username=user_id,
                        hashed_password=base_password,
                        email=base_email,
                        name=base_name,
                    )
                )
            elif not u.email and base_email:
                u.email = base_email
                u.name = u.name or base_name
        elif u:
            session.delete(u)

        if "researcher" in roles:
            if not r:
                session.add(
                    AWSResearcher(
                        username=user_id,
                        hashed_password=base_password,
                        email=base_email,
                        name=base_name,
                    )
                )
            elif not r.email and base_email:
                r.email = base_email
                r.name = r.name or base_name
        elif r:
            session.delete(r)

    return get_aws_user_by_id(user_id)


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
    num_chunks: int = 0,
    ip_address: str = None,
    tags: List[str] | None = None,
    why_join: List[str] | None = None,
    learn_more: List[dict] | None = None,
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
            total_chunks=num_chunks,
            chunks_completed=0,
            replication_factor=replication_factor,
            max_attempts=max_verification_attempts,
            ip_address=ip_address,
        )
        if tags is not None:
            cleaned_tags = [str(t).strip() for t in tags if str(t).strip()]
            p.tags = json.dumps(cleaned_tags) if cleaned_tags else None
        if why_join is not None:
            cleaned_wj = [str(x).strip() for x in why_join if str(x).strip()]
            p.why_join = json.dumps(cleaned_wj) if cleaned_wj else None
        if learn_more is not None:
            lm = []
            for item in learn_more:
                if not isinstance(item, dict):
                    continue
                lab = str(item.get("label", "")).strip()
                if not lab:
                    continue
                lm.append({"label": lab, "url": str(item.get("url", "") or "").strip()})
            p.learn_more = json.dumps(lm)
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


def update_aws_project_ip(project_id, ip_address: str) -> bool:
    """Store or update the Ray head IP address for a project."""
    if not is_aws_db_configured():
        return False
    try:
        pid = int(project_id)
    except (TypeError, ValueError):
        return False
    with get_aws_session() as session:
        p = session.query(AWSProject).filter_by(project_id=pid).first()
        if not p:
            return False
        p.ip_address = ip_address
        return True


def get_aws_project_ip(project_id) -> Optional[str]:
    """Retrieve the Ray head IP address for a project."""
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
        return p.ip_address


def update_aws_project_chunks(project_id, chunks_completed: int = None, total_chunks: int = None) -> bool:
    """
    Update AWS projects.total_chunks / chunks_completed for progress tracking.
    When chunks_completed >= total_chunks (and total_chunks > 0), sets status to 'completed'.

    Returns True when the project row is found and updated.
    """
    if not is_aws_db_configured():
        return False

    try:
        pid = int(project_id)
    except (TypeError, ValueError):
        return False

    with get_aws_session() as session:
        p = session.query(AWSProject).filter_by(project_id=pid).first()
        if not p:
            return False

        if total_chunks is not None:
            p.total_chunks = max(0, int(total_chunks))

        if chunks_completed is not None:
            completed = max(0, int(chunks_completed))
            if p.total_chunks is not None:
                completed = min(completed, p.total_chunks)
            p.chunks_completed = completed

        # Mark project complete when all chunks have finished processing.
        tc = p.total_chunks
        cc = p.chunks_completed or 0
        if tc is not None and tc > 0 and cc >= tc:
            p.status = "completed"

        return True
