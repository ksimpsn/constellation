#!/usr/bin/env python3
"""
Clear all projects from the database.
This removes all projects, runs, tasks, and task results.
Useful for testing - start with a clean slate.
"""
import sys
import os

# Add project root to path (go up two levels from backend/test/)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from backend.core.database import (
    init_db,
    get_session,
    Project,
    Run,
    Task,
    TaskResult
)

def clear_all_projects():
    """Remove all projects from the database."""
    print("=" * 70)
    print("Clearing All Projects from Database")
    print("=" * 70)
    print()

    # Initialize database
    init_db()

    with get_session() as session:
        # Count what we're about to delete
        project_count = session.query(Project).count()
        run_count = session.query(Run).count()
        task_count = session.query(Task).count()
        result_count = session.query(TaskResult).count()

        print(f"Found in database:")
        print(f"  Projects: {project_count}")
        print(f"  Runs: {run_count}")
        print(f"  Tasks: {task_count}")
        print(f"  Task Results: {result_count}")
        print()

        if project_count == 0:
            print("✓ Database is already empty - nothing to delete")
            return

        # Confirm deletion
        print("⚠️  WARNING: This will delete ALL projects and related data!")
        print("   This includes:")
        print("   - All projects")
        print("   - All runs")
        print("   - All tasks")
        print("   - All task results")
        print()

        response = input("Are you sure you want to continue? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            print("❌ Cancelled. No data was deleted.")
            return

        print()
        print("Deleting...")

        # Delete task results first (they reference tasks)
        deleted_results = session.query(TaskResult).delete()
        print(f"  ✓ Deleted {deleted_results} task results")

        # Delete tasks (they reference runs)
        deleted_tasks = session.query(Task).delete()
        print(f"  ✓ Deleted {deleted_tasks} tasks")

        # Delete runs (they reference projects)
        deleted_runs = session.query(Run).delete()
        print(f"  ✓ Deleted {deleted_runs} runs")

        # Delete projects
        deleted_projects = session.query(Project).delete()
        print(f"  ✓ Deleted {deleted_projects} projects")

        # Commit the deletions
        session.commit()

        print()
        print("=" * 70)
        print("✅ Successfully cleared all projects!")
        print("=" * 70)
        print()
        print("💡 You can now create fresh test projects:")
        print("   python3 backend/test/create_test_projects.py")

def clear_all_projects_no_confirm():
    """Remove all projects without confirmation (for scripting)."""
    init_db()

    with get_session() as session:
        project_count = session.query(Project).count()
        run_count = session.query(Run).count()
        task_count = session.query(Task).count()
        result_count = session.query(TaskResult).count()

        if project_count == 0:
            print("Database is already empty")
            return

        session.query(TaskResult).delete()
        session.query(Task).delete()
        session.query(Run).delete()
        deleted = session.query(Project).delete()
        session.commit()

        print(f"Deleted {deleted} projects, {run_count} runs, {task_count} tasks, {result_count} results")

if __name__ == "__main__":
    import sys

    # Allow --yes flag to skip confirmation
    if "--yes" in sys.argv or "-y" in sys.argv:
        clear_all_projects_no_confirm()
    else:
        clear_all_projects()
