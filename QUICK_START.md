# Quick Start: Database and API Setup

## Step 1: Check What's in Your Database

```bash
python3 backend/test/inspect_database.py
```

This shows all users, projects, runs, tasks, and workers in your database.

## Step 2: Add Sample Data

### Option A: Add a Real Project (Recommended)
```bash
python3 backend/test/add_sample_project.py
```
This creates a real project using the API (just like the frontend does).

### Option B: Add Test Data for Dashboard
```bash
python3 backend/test/setup_test_data.py
```
This creates 3 sample projects with various completion states.

## Step 3: Create Debug Users (if needed)

Following DEBUG_USERS.md:
```bash
python3 backend/create_debug_user.py
```

This creates three debug users:
- `debug-volunteer@constellation.test` (volunteer role)
- `debug-researcher@constellation.test` (researcher role) ← Used by dashboard
- `debug-both@constellation.test` (both roles)

To see debug user info:
```bash
python3 backend/test/get_debug_users.py
```

## Step 4: Start the Backend Server

```bash
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000
```

Keep this running in a terminal.

## Step 5: Test API Connection

In another terminal:
```bash
python3 backend/test/test_api_connection.py
```

This verifies:
- Backend is running
- API endpoints are accessible
- Database has data

## Step 6: Start Frontend

The frontend should now be able to connect and show your projects!

## Troubleshooting "Failed to Fetch"

### 1. Check if Backend is Running
```bash
curl http://localhost:5000/
```
Should return: `{"message": "Welcome to the Constellation API!", "status": "running"}`

### 2. Test API Endpoints
```bash
python3 backend/test/test_api_connection.py
```

### 3. Check Browser Console
Open browser DevTools (F12) → Console tab
Look for:
- CORS errors
- Network errors
- Failed fetch requests

### 4. Verify Database Has Data
```bash
python3 backend/test/inspect_database.py
```

If no projects exist, run:
```bash
python3 backend/test/add_sample_project.py
```

### 5. Check API URL in Frontend
The frontend uses: `http://localhost:5000` by default
Make sure this matches your backend port.

## Common Issues

### "No projects found"
→ Run `python3 backend/test/add_sample_project.py`

### "Cannot connect to backend"
→ Start the Flask server: `python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000`

### "CORS error"
→ Backend has CORS enabled by default. If still seeing errors, check browser console for details.

### Database is empty
→ Run the setup scripts to add data:
```bash
python3 backend/create_debug_user.py
python3 backend/test/add_sample_project.py
```

## Full Example Workflow

```bash
# Terminal 1: Setup database
python3 backend/create_debug_user.py
python3 backend/test/add_sample_project.py
python3 backend/test/inspect_database.py  # Verify data

# Terminal 2: Start backend
python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000

# Terminal 3: Test connection
python3 backend/test/test_api_connection.py

# Terminal 4: Start frontend (if using npm/vite)
npm run dev  # or your frontend command
```

Now open the frontend in your browser - it should show your projects!
