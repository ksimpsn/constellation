#!/usr/bin/env python3
"""
Setup test data: Create a researcher user and sample projects for testing the dashboard.
"""
import sys
import os

# Add project root to path (go up two levels from backend/test/)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from backend.core.database import (
    init_db,
    create_user,
    get_user_by_email,
    create_project,
    create_run,
    create_task,
    get_session
)
from datetime import datetime, timedelta

def setup_test_data():
    """Create a researcher user and sample projects with test data."""
    print("=" * 70)
    print("Setting up test data for Researcher Dashboard")
    print("=" * 70)
    print()

    # Initialize database
    init_db()

    # Create or get researcher user
    researcher_email = "debug-researcher@constellation.test"
    researcher = get_user_by_email(researcher_email)

    if not researcher:
        researcher = create_user(
            email=researcher_email,
            name="Debug Researcher",
            role="researcher",
            metadata={"debug": True}
        )
        print(f"✓ Created researcher user: {researcher.user_id}")
    else:
        print(f"ℹ Using existing researcher user: {researcher.user_id}")

    print(f"  Email: {researcher.email}")
    print(f"  Role: {researcher.role}")
    print()

    # Create sample projects
    # Note: Using dummy paths since we're just creating database records for testing
    projects_data = [
        {
            "title": "Protein Folding Simulation",
            "description": "Crowdsourced molecular dynamics simulations to explore protein stability.",
            "code_path": "uploads/test/protein_folding.py",
            "dataset_path": "uploads/test/protein_data.csv",
            "dataset_type": "csv",
            "chunk_size": 100,
            "total_tasks": 50,
            "completed_tasks": 50,
            "failed_tasks": 2,
            "created_days_ago": 45,
        },
        {
            "title": "Climate Modeling",
            "description": "Distributed computation of regional weather predictions using ensemble models.",
            "code_path": "uploads/test/climate_model.py",
            "dataset_path": "uploads/test/climate_data.csv",
            "dataset_type": "csv",
            "chunk_size": 200,
            "total_tasks": 100,
            "completed_tasks": 73,
            "failed_tasks": 5,
            "created_days_ago": 30,
        },
        {
            "title": "AI for Drug Discovery",
            "description": "GPU-assisted virtual screening on user devices to accelerate compound searches.",
            "code_path": "uploads/test/drug_discovery.py",
            "dataset_path": "uploads/test/compound_data.csv",
            "dataset_type": "csv",
            "chunk_size": 150,
            "total_tasks": 200,
            "completed_tasks": 82,
            "failed_tasks": 8,
            "created_days_ago": 15,
        },
    ]

    created_projects = []

    for proj_data in projects_data:
        # Check if project already exists (by title)
        with get_session() as session:
            from backend.core.database import Project
            existing = session.query(Project).filter_by(
                researcher_id=researcher.user_id,
                title=proj_data["title"]
            ).first()

            if existing:
                print(f"ℹ Project '{proj_data['title']}' already exists, skipping...")
                created_projects.append(existing)
                continue

        # Create project
        project = create_project(
            researcher_id=researcher.user_id,
            title=proj_data["title"],
            description=proj_data["description"],
            code_path=proj_data["code_path"],
            dataset_path=proj_data["dataset_path"],
            dataset_type=proj_data["dataset_type"],
            func_name="main",
            chunk_size=proj_data["chunk_size"]
        )

        # Set created_at to be in the past
        project.created_at = datetime.utcnow() - timedelta(days=proj_data["created_days_ago"])
        with get_session() as session:
            session.merge(project)
            session.commit()

        # Create a run for this project
        run = create_run(
            project_id=project.project_id,
            total_tasks=proj_data["total_tasks"]
        )
        run.completed_tasks = proj_data["completed_tasks"]
        run.failed_tasks = proj_data["failed_tasks"]

        # Set run status based on completion
        if proj_data["completed_tasks"] >= proj_data["total_tasks"]:
            run.status = "completed"
            run.completed_at = datetime.utcnow() - timedelta(days=proj_data["created_days_ago"] - 10)
        else:
            run.status = "running"
            run.started_at = datetime.utcnow() - timedelta(days=proj_data["created_days_ago"])

        with get_session() as session:
            session.merge(run)
            session.commit()

        # Create tasks with various statuses
        completed_count = 0
        failed_count = 0

        for i in range(proj_data["total_tasks"]):
            task = create_task(run_id=run.run_id, task_index=i)

            if completed_count < proj_data["completed_tasks"]:
                task.status = "completed"
                task.completed_at = datetime.utcnow() - timedelta(days=proj_data["created_days_ago"] - 10 + (i % 5))
                completed_count += 1
            elif failed_count < proj_data["failed_tasks"]:
                task.status = "failed"
                failed_count += 1
            elif i < proj_data["completed_tasks"] + proj_data["failed_tasks"] + 5:
                # Some active tasks
                task.status = "running"
                task.started_at = datetime.utcnow() - timedelta(hours=1)
            else:
                task.status = "pending"

            with get_session() as session:
                session.merge(task)
                session.commit()

        print(f"✓ Created project: {project.title}")
        print(f"  Project ID: {project.project_id}")
        print(f"  Tasks: {proj_data['completed_tasks']}/{proj_data['total_tasks']} completed, {proj_data['failed_tasks']} failed")

        created_projects.append(project)

    print()
    print("=" * 70)
    print("📋 Summary:")
    print("=" * 70)
    print(f"Researcher ID: {researcher.user_id}")
    print(f"Researcher Email: {researcher.email}")
    print(f"Total Projects Created: {len(created_projects)}")
    print()
    print("💡 Use this researcher_id in your frontend:")
    print(f"  const researcherId = \"{researcher.user_id}\";")
    print()
    print("Or update ResearcherDashboard.tsx to fetch from:")
    print(f"  {researcher.user_id}")
    print("=" * 70)

    return researcher.user_id

if __name__ == "__main__":
    researcher_id = setup_test_data()
    print(f"\n✅ Setup complete! Researcher ID: {researcher_id}")
