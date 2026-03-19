#!/usr/bin/env python3
"""
Test API connection - Verify the backend is running and accessible.
"""
import requests
import sys

API_BASE_URL = "http://localhost:5000"

def test_api_connection():
    """Test if the API is running and accessible."""
    print("=" * 70)
    print("Testing API Connection")
    print("=" * 70)
    print()

    # Test 1: Health check
    print("1. Testing health check endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print(f"   ✓ Backend is running!")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ✗ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"   ✗ Cannot connect to {API_BASE_URL}")
        print(f"   Make sure the backend is running:")
        print(f"   python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

    print()

    # Test 2: Get debug researcher ID
    print("2. Testing debug researcher endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/researcher/debug-id", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Debug researcher endpoint works!")
            print(f"   Researcher ID: {data.get('researcher_id')}")
            print(f"   Email: {data.get('email')}")
            researcher_id = data.get('researcher_id')
        else:
            print(f"   ✗ Endpoint returned status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

    print()

    # Test 3: Get researcher projects
    if researcher_id:
        print(f"3. Testing projects endpoint for researcher {researcher_id}...")
        try:
            response = requests.get(f"{API_BASE_URL}/api/researcher/{researcher_id}/projects", timeout=5)
            if response.status_code == 200:
                data = response.json()
                projects = data.get('projects', [])
                print(f"   ✓ Projects endpoint works!")
                print(f"   Found {len(projects)} project(s)")
                for proj in projects:
                    print(f"     - {proj.get('title')} ({proj.get('progress')}% complete)")
            else:
                print(f"   ✗ Endpoint returned status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        except Exception as e:
            print(f"   ✗ Error: {e}")
            return False

    print()
    print("=" * 70)
    print("✅ All API tests passed!")
    print("=" * 70)
    print()
    print("💡 If the frontend still shows 'failed to fetch':")
    print("   1. Check browser console for CORS errors")
    print("   2. Verify frontend is using the correct API URL")
    print("   3. Check that both frontend and backend are running")

    return True

if __name__ == "__main__":
    success = test_api_connection()
    sys.exit(0 if success else 1)
