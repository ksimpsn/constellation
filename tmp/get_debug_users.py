#!/usr/bin/env python3
"""
Get debug users information (matching DEBUG_USERS.md).
This shows the same debug users that are created by create_debug_user.py
"""
import sys
import os
import requests

# Add project root to path (go up two levels from backend/test/)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from backend.core.database import init_db, get_user_by_email

def get_debug_users_info():
    """Get and display debug users information."""
    print("=" * 70)
    print("Debug Users Information (from DEBUG_USERS.md)")
    print("=" * 70)
    print()

    # Initialize database
    init_db()

    # Get debug users (same emails as in DEBUG_USERS.md)
    volunteer = get_user_by_email("debug-volunteer@constellation.test")
    researcher = get_user_by_email("debug-researcher@constellation.test")
    both_user = get_user_by_email("debug-both@constellation.test")

    print("👥 Debug Users:")
    print("-" * 70)

    if volunteer:
        print(f"✓ Volunteer User:")
        print(f"  User ID: {volunteer.user_id}")
        print(f"  Email: {volunteer.email}")
        print(f"  Name: {volunteer.name}")
        print(f"  Role: {volunteer.role}")
        print()
    else:
        print("✗ Volunteer user not found")
        print("  Run: python3 backend/create_debug_user.py")
        print()

    if researcher:
        print(f"✓ Researcher User:")
        print(f"  User ID: {researcher.user_id}")
        print(f"  Email: {researcher.email}")
        print(f"  Name: {researcher.name}")
        print(f"  Role: {researcher.role}")
        print()
    else:
        print("✗ Researcher user not found")
        print("  Run: python3 backend/create_debug_user.py")
        print()

    if both_user:
        print(f"✓ Both Roles User:")
        print(f"  User ID: {both_user.user_id}")
        print(f"  Email: {both_user.email}")
        print(f"  Name: {both_user.name}")
        print(f"  Role: {both_user.role}")
        print()
    else:
        print("✗ Both roles user not found")
        print("  Run: python3 backend/create_debug_user.py")
        print()

    print("=" * 70)
    print("📋 Usage:")
    print("=" * 70)

    if researcher:
        print(f"\n💡 For Researcher Dashboard:")
        print(f"   The frontend automatically uses: {researcher.user_id}")
        print(f"   Or fetch via API: GET /api/researcher/debug-id")
        print()

    if volunteer:
        print(f"💡 For Worker Connection:")
        print(f"   curl -X POST http://localhost:5000/api/workers/connect \\")
        print(f"     -H 'Content-Type: application/json' \\")
        print(f"     -d '{{\"user_id\": \"{volunteer.user_id}\", \"worker_name\": \"MyLaptop\", \"head_node_ip\": \"10.5.0.2\"}}'")
        print()

    if researcher:
        print(f"💡 For Head Node Start:")
        print(f"   curl -X POST http://localhost:5000/api/cluster/start-head \\")
        print(f"     -H 'Content-Type: application/json' \\")
        print(f"     -d '{{\"researcher_id\": \"{researcher.user_id}\"}}'")
        print()

    print("=" * 70)

    # Also try API endpoint if backend is running
    print("\n🌐 Testing API Endpoint (if backend is running):")
    print("-" * 70)
    try:
        response = requests.get("http://localhost:5000/api/debug-users", timeout=2)
        if response.status_code == 200:
            data = response.json()
            print("✓ API endpoint /api/debug-users is working!")
            print(f"  Researcher ID: {data.get('researcher', {}).get('user_id')}")
        else:
            print(f"✗ API returned status {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("✗ Backend not running (this is okay)")
        print("  Start with: python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    get_debug_users_info()
