#!/usr/bin/env python3
"""
Create test projects with different states for dashboard testing.
Creates:
- 1 completed project (100% done)
- 1 in-progress project (partially complete)
"""
import sys
import os
from datetime import datetime, timedelta

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
    create_task_result,
    get_session,
    Project,
    Run,
    Task,
    TaskResult,
    Worker
)

def create_test_projects():
    """Create test projects with different completion states."""
    print("=" * 70)
    print("Creating Test Projects for Dashboard")
    print("=" * 70)
    print()

    # Initialize database
    init_db()

    # Get or create researcher user
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
        print(f"✓ Using existing researcher: {researcher.user_id}")

    print()

    # Create a dummy worker for task results
    with get_session() as session:
        from backend.core.database import Worker
        worker = session.query(Worker).first()
        if not worker:
            worker = Worker(
                worker_id="test-worker-1",
                worker_name="Test Worker",
                user_id=researcher.user_id,
                status="online"
            )
            session.add(worker)
            session.commit()
            print("✓ Created test worker")

    projects_created = []

    # ============================================================
    # Project 1: Completed Project (100%)
    # ============================================================
    print("\n" + "=" * 70)
    print("Creating COMPLETED Project (100% done)")
    print("=" * 70)

    with get_session() as session:
        # Check if project already exists
        existing = session.query(Project).filter_by(
            researcher_id=researcher.user_id,
            title="Completed Test Project"
        ).first()

        if existing:
            print("ℹ Completed project already exists, skipping...")
            projects_created.append(existing)
        else:
            # Create project
            project = create_project(
                researcher_id=researcher.user_id,
                title="Completed Test Project",
                description="This project has finished computing. All tasks are complete and results are available.",
                code_path="uploads/test/completed_project.py",
                dataset_path="uploads/test/completed_data.csv",
                dataset_type="csv",
                func_name="main",
                chunk_size=10
            )
            project.created_at = datetime.utcnow() - timedelta(days=30)

            # Create completed run
            run = create_run(project_id=project.project_id, total_tasks=20)
            run.status = "completed"
            run.completed_tasks = 20
            run.failed_tasks = 0
            run.started_at = datetime.utcnow() - timedelta(days=29)
            run.completed_at = datetime.utcnow() - timedelta(days=25)
            run.results_s3_path = "/results/completed_project.json"

            with get_session() as s:
                s.merge(run)
                s.commit()

            # Create completed tasks with results
            total_runtime = 0
            for i in range(20):
                task = create_task(run_id=run.run_id, task_index=i)
                task.status = "completed"
                task.assigned_worker_id = worker.worker_id
                task.started_at = datetime.utcnow() - timedelta(days=29, hours=23-i)
                task.completed_at = datetime.utcnow() - timedelta(days=29, hours=22-i)

                runtime = 45.2 + (i % 10)  # Vary runtime between 45-55 seconds
                total_runtime += runtime

                # Create task result
                result = create_task_result(
                    task_id=task.task_id,
                    run_id=run.run_id,
                    project_id=project.project_id,
                    worker_id=worker.worker_id,
                    result_data={"result": f"Task {i} completed", "value": i * 2},
                    runtime_seconds=runtime
                )

                with get_session() as s:
                    s.merge(task)
                    s.add(result)
                    s.commit()

            avg_runtime = total_runtime / 20

            print(f"✓ Created completed project:")
            print(f"  Project ID: {project.project_id}")
            print(f"  Title: {project.title}")
            print(f"  Tasks: 20/20 completed (100%)")
            print(f"  Avg task time: {avg_runtime:.1f}s")
            projects_created.append(project)

    # ============================================================
    # Project 2: In-Progress Project (65% done)
    # ============================================================
    print("\n" + "=" * 70)
    print("Creating IN-PROGRESS Project (65% done)")
    print("=" * 70)

    with get_session() as session:
        # Check if project already exists
        existing = session.query(Project).filter_by(
            researcher_id=researcher.user_id,
            title="In-Progress Test Project"
        ).first()

        if existing:
            print("ℹ In-progress project already exists, skipping...")
            projects_created.append(existing)
        else:
            # Create project
            project = create_project(
                researcher_id=researcher.user_id,
                title="In-Progress Test Project",
                description="This project is currently processing across volunteer devices. Tasks are being completed in real-time.",
                code_path="uploads/test/inprogress_project.py",
                dataset_path="uploads/test/inprogress_data.csv",
                dataset_type="csv",
                func_name="main",
                chunk_size=15
            )
            project.created_at = datetime.utcnow() - timedelta(days=10)

            # Create in-progress run
            total_tasks = 40
            completed_tasks = 26  # 65%
            failed_tasks = 2
            pending_tasks = total_tasks - completed_tasks - failed_tasks

            run = create_run(project_id=project.project_id, total_tasks=total_tasks)
            run.status = "running"
            run.completed_tasks = completed_tasks
            run.failed_tasks = failed_tasks
            run.started_at = datetime.utcnow() - timedelta(days=9)

            with get_session() as s:
                s.merge(run)
                s.commit()

            # Create tasks with various statuses
            total_runtime = 0
            task_index = 0

            # Completed tasks
            for i in range(completed_tasks):
                task = create_task(run_id=run.run_id, task_index=task_index)
                task.status = "completed"
                task.assigned_worker_id = worker.worker_id
                task.started_at = datetime.utcnow() - timedelta(days=9, hours=23-i//2)
                task.completed_at = datetime.utcnow() - timedelta(hours=2-i//3)

                runtime = 38.5 + (i % 15)  # Vary runtime
                total_runtime += runtime

                # Create task result
                result = create_task_result(
                    task_id=task.task_id,
                    run_id=run.run_id,
                    project_id=project.project_id,
                    worker_id=worker.worker_id,
                    result_data={"result": f"Task {task_index} completed", "value": task_index * 2},
                    runtime_seconds=runtime
                )

                with get_session() as s:
                    s.merge(task)
                    s.add(result)
                    s.commit()

                task_index += 1

            # Failed tasks
            for i in range(failed_tasks):
                task = create_task(run_id=run.run_id, task_index=task_index)
                task.status = "failed"
                task.assigned_worker_id = worker.worker_id
                task.started_at = datetime.utcnow() - timedelta(hours=5)
                task.error_message = "Task execution timeout"

                with get_session() as s:
                    s.merge(task)
                    s.commit()

                task_index += 1

            # Running tasks (currently being processed)
            running_count = 5
            for i in range(running_count):
                task = create_task(run_id=run.run_id, task_index=task_index)
                task.status = "running"
                task.assigned_worker_id = worker.worker_id
                task.started_at = datetime.utcnow() - timedelta(minutes=30-i*5)

                with get_session() as s:
                    s.merge(task)
                    s.commit()

                task_index += 1

            # Pending tasks (waiting to be assigned)
            for i in range(pending_tasks - running_count):
                task = create_task(run_id=run.run_id, task_index=task_index)
                task.status = "pending"

                with get_session() as s:
                    s.merge(task)
                    s.commit()

                task_index += 1

            avg_runtime = total_runtime / completed_tasks if completed_tasks > 0 else 0

            print(f"✓ Created in-progress project:")
            print(f"  Project ID: {project.project_id}")
            print(f"  Title: {project.title}")
            print(f"  Tasks: {completed_tasks}/{total_tasks} completed ({int(completed_tasks/total_tasks*100)}%)")
            print(f"  Failed: {failed_tasks}, Running: {running_count}, Pending: {pending_tasks - running_count}")
            print(f"  Avg task time: {avg_runtime:.1f}s")
            projects_created.append(project)

    # Summary
    print("\n" + "=" * 70)
    print("📋 Summary")
    print("=" * 70)
    print(f"Researcher ID: {researcher.user_id}")
    print(f"Projects Created: {len(projects_created)}")
    print()
    print("Projects:")
    for proj in projects_created:
        print(f"  - {proj.title}")
    print()
    print("💡 These projects will appear in the Researcher Dashboard!")
    print("   Start the backend and frontend to view them.")
    print("=" * 70)

    return projects_created

if __name__ == "__main__":
    projects = create_test_projects()
    print(f"\n✅ Done! Created {len(projects)} test project(s)")
