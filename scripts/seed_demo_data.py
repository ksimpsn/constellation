#!/usr/bin/env python3
"""
Seed SQLite (constellation.db) with demo researchers, volunteers, and browseable projects.

Run from repository root with venv activated:

  python3 scripts/seed_demo_data.py

Safe to run multiple times: skips users/projects that already exist (by email / title).
"""

from __future__ import annotations

import os
import sys

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from backend.core.database import (  # noqa: E402
    init_db,
    create_user,
    get_user_by_email,
    create_project,
)


DEMO_USERS = [
    {
        "email": "demo-researcher-alpha@constellation.test",
        "name": "Dr. Alex Chen",
        "role": "researcher",
    },
    {
        "email": "demo-researcher-beta@constellation.test",
        "name": "Prof. Sam Rivera",
        "role": "researcher",
    },
    {
        "email": "demo-volunteer-1@constellation.test",
        "name": "Jamie Volunteer",
        "role": "volunteer",
    },
    {
        "email": "demo-volunteer-2@constellation.test",
        "name": "Riley Contributor",
        "role": "volunteer",
    },
    {
        "email": "demo-both-roles@constellation.test",
        "name": "Jordan Dual-Role",
        "role": "researcher,volunteer",
    },
]

# Projects: title, description, tags, paths relative to repo (for reference; need not exist for UI)
PROJECT_SEEDS = [
    {
        "researcher_email": "demo-researcher-alpha@constellation.test",
        "title": "Regional Climate Ensembles",
        "description": (
            "We run ensemble regional climate models to improve predictions of drought and extreme heat. "
            "Tasks process CSV chunks of historical weather data with a shared Python pipeline."
        ),
        "tags": ["Climate", "Physics"],
        "code_path": "sample-projects/test-square/project.py",
        "dataset_path": "sample-projects/test-square/dataset.csv",
        "dataset_type": "csv",
    },
    {
        "researcher_email": "demo-researcher-alpha@constellation.test",
        "title": "Genomic Variant Screening",
        "description": (
            "Distributed screening of genomic variants against reference panels. Each task evaluates a batch of "
            "rows with a user-supplied main(row) function."
        ),
        "tags": ["Genomics", "Medicine"],
        "code_path": "sample-projects/test-square/project.py",
        "dataset_path": "sample-projects/test-square/dataset.csv",
        "dataset_type": "csv",
    },
    {
        "researcher_email": "demo-researcher-beta@constellation.test",
        "title": "Neural Signal Feature Extraction",
        "description": (
            "Feature extraction from anonymized neural time-series for assistive device research. "
            "Volunteers contribute CPU for batch preprocessing."
        ),
        "tags": ["Neuroscience", "AI / ML"],
        "code_path": "sample-projects/test-square/project.py",
        "dataset_path": "sample-projects/test-square/dataset.csv",
        "dataset_type": "csv",
    },
    {
        "researcher_email": "debug-researcher@constellation.test",
        "title": "Debug Dashboard Sample Project",
        "description": (
            "Lightweight project tied to the debug researcher account so the researcher dashboard "
            "shows at least one row after seeding."
        ),
        "tags": ["AI / ML"],
        "code_path": "sample-projects/test-square/project.py",
        "dataset_path": "sample-projects/test-square/dataset.csv",
        "dataset_type": "csv",
    },
]


def main() -> None:
    init_db()

    created_users = 0
    for u in DEMO_USERS:
        if get_user_by_email(u["email"]):
            print(f"User exists: {u['email']}")
            continue
        create_user(
            email=u["email"],
            name=u["name"],
            role=u["role"],
            metadata={"demo": True},
        )
        created_users += 1
        print(f"Created user: {u['email']} ({u['role']})")

    # Ensure debug researcher exists (same as /api/researcher/debug-id)
    if not get_user_by_email("debug-researcher@constellation.test"):
        create_user(
            email="debug-researcher@constellation.test",
            name="Debug Researcher",
            role="researcher",
            metadata={"debug": True},
        )
        created_users += 1
        print("Created debug-researcher@constellation.test")
    else:
        print("User exists: debug-researcher@constellation.test")

    from backend.core.database import get_session, Project  # noqa: E402

    created_projects = 0
    for seed in PROJECT_SEEDS:
        user = get_user_by_email(seed["researcher_email"])
        if not user:
            print(f"Skip project (missing user): {seed['title']}")
            continue
        with get_session() as session:
            existing = (
                session.query(Project)
                .filter_by(researcher_id=user.user_id, title=seed["title"])
                .first()
            )
        if existing:
            print(f"Project exists: {seed['title']}")
            continue
        create_project(
            researcher_id=user.user_id,
            title=seed["title"],
            description=seed["description"],
            code_path=seed["code_path"],
            dataset_path=seed["dataset_path"],
            dataset_type=seed["dataset_type"],
            tags=seed["tags"],
        )
        created_projects += 1
        print(f"Created project: {seed['title']}")

    print()
    print(f"Done. New users: {created_users}, new projects: {created_projects}.")
    print("Browse: GET http://localhost:5001/api/projects/browse")
    print("Researcher dashboard uses debug id: GET http://localhost:5001/api/researcher/debug-id")
    print("Dual-role demo login: demo-both-roles@constellation.test (menu shows Switch to Researcher / Volunteer)")


if __name__ == "__main__":
    main()
