#!/usr/bin/env python3
"""
Inspect the database: See what users, projects, runs, and tasks are stored.
"""
import sys
import os

# Add project root to path (go up two levels from backend/test/)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from backend.core.database import (
    init_db,
    get_session,
    User,
    Project,
    Run,
    Task,
    TaskResult,
    Worker
)

def inspect_database():
    """Print all data in the database."""
    print("=" * 70)
    print("Database Inspection")
    print("=" * 70)
    print()

    # Initialize database if needed
    init_db()

    with get_session() as session:
        # Users
        print("👥 USERS:")
        print("-" * 70)
        users = session.query(User).all()
        if users:
            for user in users:
                print(f"  User ID: {user.user_id}")
                print(f"  Email: {user.email}")
                print(f"  Name: {user.name}")
                print(f"  Role: {user.role}")
                print(f"  Created: {user.created_at}")
                print()
        else:
            print("  No users found")
            print()

        # Projects
        print("📁 PROJECTS:")
        print("-" * 70)
        projects = session.query(Project).all()
        if projects:
            for project in projects:
                print(f"  Project ID: {project.project_id}")
                print(f"  Title: {project.title}")
                print(f"  Researcher ID: {project.researcher_id}")
                print(f"  Description: {project.description or '(none)'}")
                print(f"  Status: {project.status}")
                print(f"  Created: {project.created_at}")
                print(f"  Updated: {project.updated_at}")
                print()
        else:
            print("  No projects found")
            print()

        # Runs
        print("🏃 RUNS:")
        print("-" * 70)
        runs = session.query(Run).all()
        if runs:
            for run in runs:
                print(f"  Run ID: {run.run_id}")
                print(f"  Project ID: {run.project_id}")
                print(f"  Status: {run.status}")
                print(f"  Tasks: {run.completed_tasks}/{run.total_tasks} completed, {run.failed_tasks} failed")
                if run.started_at:
                    print(f"  Started: {run.started_at}")
                if run.completed_at:
                    print(f"  Completed: {run.completed_at}")
                print()
        else:
            print("  No runs found")
            print()

        # Tasks
        print("📋 TASKS:")
        print("-" * 70)
        tasks = session.query(Task).all()
        if tasks:
            status_counts = {}
            for task in tasks:
                status_counts[task.status] = status_counts.get(task.status, 0) + 1

            print(f"  Total tasks: {len(tasks)}")
            print(f"  By status:")
            for status, count in sorted(status_counts.items()):
                print(f"    {status}: {count}")
            print()

            # Show sample tasks
            print("  Sample tasks (first 5):")
            for task in tasks[:5]:
                print(f"    Task {task.task_index}: {task.status} (Run: {task.run_id[:20]}...)")
        else:
            print("  No tasks found")
            print()

        # Task Results
        print("📊 TASK RESULTS:")
        print("-" * 70)
        results = session.query(TaskResult).all()
        if results:
            print(f"  Total results: {len(results)}")
            if results:
                avg_runtime = sum(r.runtime_seconds for r in results if r.runtime_seconds) / len([r for r in results if r.runtime_seconds])
                print(f"  Average runtime: {avg_runtime:.2f}s")
        else:
            print("  No task results found")
            print()

        # Workers
        print("🔧 WORKERS:")
        print("-" * 70)
        workers = session.query(Worker).all()
        if workers:
            for worker in workers:
                print(f"  Worker ID: {worker.worker_id}")
                print(f"  Name: {worker.worker_name}")
                print(f"  User ID: {worker.user_id or '(none)'}")
                print(f"  Status: {worker.status}")
                print(f"  Tasks completed: {worker.tasks_completed}")
                print()
        else:
            print("  No workers found")
            print()

        # Summary
        print("=" * 70)
        print("📊 SUMMARY:")
        print("=" * 70)
        print(f"  Users: {len(users)}")
        print(f"  Projects: {len(projects)}")
        print(f"  Runs: {len(runs)}")
        print(f"  Tasks: {len(tasks)}")
        print(f"  Task Results: {len(results)}")
        print(f"  Workers: {len(workers)}")
        print("=" * 70)

if __name__ == "__main__":
    inspect_database()
