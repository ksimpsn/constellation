#!/usr/bin/env python3
"""
Create debug users for testing multi-device setup.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.database import init_db, create_user, get_user_by_email

def create_debug_users():
    """Create debug users for testing."""
    # Initialize database if needed
    init_db()
    
    # Debug volunteer user
    volunteer_email = "debug-volunteer@constellation.test"
    volunteer = get_user_by_email(volunteer_email)
    if not volunteer:
        volunteer = create_user(
            email=volunteer_email,
            name="Debug Volunteer",
            role="volunteer",
            metadata={"debug": True}
        )
        print(f"✓ Created volunteer user: {volunteer.user_id}")
        print(f"  Email: {volunteer.email}")
        print(f"  Role: {volunteer.role}")
    else:
        print(f"ℹ Volunteer user already exists: {volunteer.user_id}")
        print(f"  Email: {volunteer.email}")
        print(f"  Role: {volunteer.role}")
    
    # Debug researcher user
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
        print(f"  Email: {researcher.email}")
        print(f"  Role: {researcher.role}")
    else:
        print(f"ℹ Researcher user already exists: {researcher.user_id}")
        print(f"  Email: {researcher.email}")
        print(f"  Role: {researcher.role}")
    
    # Debug user with both roles
    both_email = "debug-both@constellation.test"
    both_user = get_user_by_email(both_email)
    if not both_user:
        both_user = create_user(
            email=both_email,
            name="Debug Both",
            role="researcher,volunteer",
            metadata={"debug": True}
        )
        print(f"✓ Created user with both roles: {both_user.user_id}")
        print(f"  Email: {both_user.email}")
        print(f"  Role: {both_user.role}")
    else:
        print(f"ℹ User with both roles already exists: {both_user.user_id}")
        print(f"  Email: {both_user.email}")
        print(f"  Role: {both_user.role}")
    
    print("\n📋 Summary:")
    print(f"  Volunteer user_id: {volunteer.user_id}")
    print(f"  Researcher user_id: {researcher.user_id}")
    print(f"  Both roles user_id: {both_user.user_id}")
    print("\n💡 Use these user_ids in your API calls:")
    print(f"  curl -X POST http://localhost:5001/api/workers/connect \\")
    print(f"    -H 'Content-Type: application/json' \\")
    print(f"    -d '{{\"user_id\": \"{volunteer.user_id}\", \"worker_name\": \"MyLaptop\", \"head_node_ip\": \"10.5.0.2\"}}'")

if __name__ == "__main__":
    create_debug_users()
