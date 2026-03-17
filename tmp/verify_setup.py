#!/usr/bin/env python3
"""
Verify the complete setup: database, users, projects, and API endpoints.
This helps diagnose "failed to fetch" errors.
"""
import sys
import os
import requests

# Add project root to path (go up two levels from backend/test/)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from backend.core.database import init_db, get_user_by_email, get_session, Project, Run, Task

def verify_setup():
    """Verify everything is set up correctly."""
    print("=" * 70)
    print("Verifying Constellation Setup")
    print("=" * 70)
    print()

    # 1. Check database
    print("1. Checking database...")
    try:
        init_db()
        print("   ✓ Database initialized")
    except Exception as e:
        print(f"   ✗ Database error: {e}")
        return False

    # 2. Check debug researcher
    print("\n2. Checking debug researcher...")
    researcher = get_user_by_email("debug-researcher@constellation.test")
    if researcher:
        print(f"   ✓ Debug researcher exists: {researcher.user_id}")
        print(f"     Email: {researcher.email}")
        print(f"     Role: {researcher.role}")
    else:
        print("   ✗ Debug researcher not found!")
        print("   → Run: python3 backend/create_debug_user.py")
        return False

    # 3. Check projects
    print("\n3. Checking projects...")
    with get_session() as session:
        projects = session.query(Project).filter_by(researcher_id=researcher.user_id).all()
        if projects:
            print(f"   ✓ Found {len(projects)} project(s):")
            for proj in projects:
                runs = session.query(Run).filter_by(project_id=proj.project_id).all()
                total_tasks = sum(session.query(Task).filter_by(run_id=run.run_id).count() for run in runs)
                print(f"     - {proj.title} (ID: {proj.project_id[:20]}...)")
                print(f"       Runs: {len(runs)}, Tasks: {total_tasks}")
        else:
            print("   ⚠ No projects found for debug researcher")
            print("   → Run: python3 backend/test/add_sample_project.py")

    # 4. Check backend API
    print("\n4. Checking backend API...")
    api_url = "http://localhost:5000"

    try:
        # Test health endpoint
        response = requests.get(f"{api_url}/", timeout=2)
        if response.status_code == 200:
            print(f"   ✓ Backend is running at {api_url}")
        else:
            print(f"   ✗ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"   ✗ Cannot connect to backend at {api_url}")
        print("   → Start backend: python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

    # 5. Test debug researcher endpoint
    print("\n5. Testing API endpoints...")
    try:
        response = requests.get(f"{api_url}/api/researcher/debug-id", timeout=2)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ /api/researcher/debug-id works")
            print(f"     Researcher ID: {data.get('researcher_id')}")
        else:
            print(f"   ✗ /api/researcher/debug-id returned {response.status_code}")
            print(f"     Response: {response.text}")
    except Exception as e:
        print(f"   ✗ Error testing endpoint: {e}")

    # 6. Test projects endpoint
    try:
        response = requests.get(f"{api_url}/api/researcher/{researcher.user_id}/projects", timeout=2)
        if response.status_code == 200:
            data = response.json()
            projects_count = len(data.get('projects', []))
            print(f"   ✓ /api/researcher/<id>/projects works")
            print(f"     Found {projects_count} project(s)")
        else:
            print(f"   ✗ /api/researcher/<id>/projects returned {response.status_code}")
            print(f"     Response: {response.text}")
    except Exception as e:
        print(f"   ✗ Error testing endpoint: {e}")

    print("\n" + "=" * 70)
    print("Summary")
    print("=" * 70)
    print("✓ Database: OK")
    print("✓ Debug researcher: OK")
    if projects:
        print("✓ Projects: OK")
    else:
        print("⚠ Projects: None (run add_sample_project.py)")
    print("✓ Backend API: OK")
    print("\n💡 If frontend still shows 'failed to fetch':")
    print("   1. Check browser console (F12) for CORS errors")
    print("   2. Verify frontend is using: http://localhost:5000")
    print("   3. Make sure both frontend and backend are running")
    print("=" * 70)

    return True

if __name__ == "__main__":
    verify_setup()
