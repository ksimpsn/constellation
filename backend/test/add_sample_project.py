#!/usr/bin/env python3
"""
Add a sample project to the database using the API (like the frontend does).
This creates a real project with runs and tasks.
"""
import sys
import os

# Add project root to path (go up two levels from backend/test/)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from backend.core.database import init_db, create_user, get_user_by_email
from backend.core.api import ConstellationAPI

def add_sample_project():
    """Add a sample project using the API."""
    print("=" * 70)
    print("Adding Sample Project to Database")
    print("=" * 70)
    print()

    # Initialize database
    init_db()

    # Create or get researcher user (using DEBUG_USERS.md system)
    # This matches the debug users created by: python3 backend/create_debug_user.py
    researcher_email = "debug-researcher@constellation.test"
    researcher = get_user_by_email(researcher_email)

    if not researcher:
        print("Creating debug researcher user (matching DEBUG_USERS.md)...")
        researcher = create_user(
            email=researcher_email,
            name="Debug Researcher",
            role="researcher",
            metadata={"debug": True}
        )
        print(f"✓ Created researcher user: {researcher.user_id}")
    else:
        print(f"✓ Using existing debug researcher: {researcher.user_id}")

    print(f"  Email: {researcher.email}")
    print(f"  Role: {researcher.role}")
    print()
    print("💡 This uses the same debug user system as DEBUG_USERS.md")
    print()

    # Check if dataset exists, create it if not
    dataset_path = "backend/test/dataset.csv"
    if not os.path.exists(dataset_path):
        print(f"Creating sample dataset: {dataset_path}")
        os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
        with open(dataset_path, "w") as f:
            f.write("x\n")
            for i in range(1, 101):  # 100 rows
                f.write(f"{i}\n")
        print(f"✓ Created dataset with 100 rows")

    # Check if project.py exists, create a simple one if not
    code_path = "backend/test/project.py"
    if not os.path.exists(code_path):
        print(f"Creating sample project code: {code_path}")
        os.makedirs(os.path.dirname(code_path), exist_ok=True)
        with open(code_path, "w") as f:
            f.write("""def main(rows):
    \"\"\"Simple function that doubles each value.\"\"\"
    results = []
    for row in rows:
        if isinstance(row, dict) and 'x' in row:
            value = int(row['x'])
            results.append({'x': value, 'doubled': value * 2})
        elif isinstance(row, (int, float, str)):
            try:
                value = int(row)
                results.append({'x': value, 'doubled': value * 2})
            except:
                pass
    return results
""")
        print(f"✓ Created sample project code")

    print()
    print("📤 Submitting project via API...")
    print(f"  Code: {code_path}")
    print(f"  Dataset: {dataset_path}")
    print()

    # Initialize API
    api = ConstellationAPI()

    # Submit project using the API (this creates Project, Run, Tasks in DB)
    try:
        job_id = api.submit_uploaded_project(
            code_path=code_path,
            dataset_path=dataset_path,
            file_type="csv",
            chunk_size=10,  # 10 rows per task = 10 tasks total
            func_name="main",
            researcher_id=researcher.user_id,
            title="Sample Test Project",
            description="A sample project created for testing the dashboard"
        )

        print(f"✓ Project submitted successfully!")
        print(f"  Job ID: {job_id}")
        print()
        print("📋 Project Details:")
        print(f"  Researcher ID: {researcher.user_id}")
        print(f"  Title: Sample Test Project")
        print(f"  Dataset: 100 rows, chunked into ~10 tasks")
        print()
        print("💡 You can now:")
        print(f"  1. Check the database: python3 backend/test/inspect_database.py")
        print(f"  2. View in dashboard: The project should appear in ResearcherDashboard")
        print()

        return job_id

    except Exception as e:
        print(f"❌ Error submitting project: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    job_id = add_sample_project()
    if job_id:
        print(f"✅ Done! Job ID: {job_id}")
