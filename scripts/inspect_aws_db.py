#!/usr/bin/env python3
"""
Print rows from AWS RDS tables: users (volunteers), researchers, projects.

Usage (from repo root, with venv active):
  export AWS_DATABASE_URL="postgresql://..."
  python3 scripts/inspect_aws_db.py

Or rely on .env / scripts/.env (same as start-flask.sh).
"""
from __future__ import annotations

import os
import sys

_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)


def _load_dotenv_files() -> None:
    for rel in (".env", "scripts/.env"):
        path = os.path.join(_REPO_ROOT, rel)
        if not os.path.isfile(path):
            continue
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                k, v = k.strip(), v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v


def main() -> int:
    _load_dotenv_files()
    if not os.environ.get("AWS_DATABASE_URL"):
        print(
            "Missing AWS_DATABASE_URL. Export it or add to .env / scripts/.env",
            file=sys.stderr,
        )
        return 1

    from backend.core.database_aws import (
        AWSProject,
        AWSResearcher,
        AWSUser,
        get_aws_session,
        init_aws_db,
        is_aws_db_configured,
    )

    if not init_aws_db() or not is_aws_db_configured():
        print("Could not initialize AWS DB (check URL, psycopg2-binary, network).", file=sys.stderr)
        return 1

    # Read all attributes while the session is open (ORM instances detach after exit).
    with get_aws_session() as session:
        users = session.query(AWSUser).order_by(AWSUser.email).all()
        researchers = session.query(AWSResearcher).order_by(AWSResearcher.email).all()
        projects = session.query(AWSProject).order_by(AWSProject.date_created.desc()).all()

        users_rows = [
            (u.username, u.email, u.name, u.date_created) for u in users
        ]
        researchers_rows = [
            (r.username, r.email, r.name, r.date_created) for r in researchers
        ]
        projects_rows = []
        for p in projects:
            desc = p.description or ""
            projects_rows.append(
                (
                    p.project_id,
                    p.name,
                    p.researcher_id,
                    p.status,
                    p.ip_address,
                    p.date_created,
                    desc,
                )
            )

    print("=== users (volunteers) ===")
    if not users_rows:
        print("  (no rows)")
    for username, email, name, date_created in users_rows:
        print(
            f"  username={username!r}  email={email!r}  name={name!r}  "
            f"created={date_created}"
        )

    print("\n=== researchers ===")
    if not researchers_rows:
        print("  (no rows)")
    for username, email, name, date_created in researchers_rows:
        print(
            f"  username={username!r}  email={email!r}  name={name!r}  "
            f"created={date_created}"
        )

    print("\n=== projects ===")
    if not projects_rows:
        print("  (no rows)")
    for project_id, name, researcher_id, status, ip_address, date_created, description in projects_rows:
        print(
            f"  project_id={project_id}  name={name!r}  researcher_id={researcher_id!r}  "
            f"status={status!r}  ip={ip_address!r}  created={date_created}"
        )
        if description:
            preview = (description[:120] + "…") if len(description) > 120 else description
            print(f"    description: {preview!r}")

    print(
        f"\nCounts: users={len(users_rows)}  researchers={len(researchers_rows)}  "
        f"projects={len(projects_rows)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
